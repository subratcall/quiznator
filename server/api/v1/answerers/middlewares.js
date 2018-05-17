const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const co = require('co');
const mongoose = require('mongoose');
const quizTypes = require('app-modules/constants/quiz-types');

const Quiz = require('app-modules/models/quiz');
const QuizAnswer = require('app-modules/models/quiz-answer');
const PeerReview = require('app-modules/models/peer-review');
const Confirmation = require('app-modules/models/confirmation')

const { InvalidRequestError } = require('app-modules/errors');

function getAnswerersProgress(options) {
  return (req, res, next) => {
    const getQuizzes = Quiz.findAnswerable({ _id: { $in: options.getQuizzes(req) } });
    const getQuizAnswers = QuizAnswer.find({ answererId: options.getAnswererId(req), quizId: { $in: options.getQuizzes(req) } }).distinct('quizId').exec();

    return Promise.all([getQuizzes, getQuizAnswers])
      .spread((quizzes, answers) => {
        const answerQuizIds = answers.map(id => id.toString());

        req.progress = _.groupBy(quizzes, quiz => answerQuizIds.indexOf(quiz._id.toString()) >= 0 ? 'answered' : 'notAnswered');

        return next();
      });
  }
}

function getAnswerers() {
  return (req, res, next) => {
    co(function* () {
      const { quizId, dateTo } = req.query;

      if (!quizId) {
        return Promise.reject(new InvalidRequestError('quizId is required'));
      }

      const sort = { creatAt: -1 };

      const group = { 
        _id: '$answererId', 
        id: { $first: '$_id' },
        spamFlags: { $first: '$spamFlags' }, 
        data: { $first: '$data' }, 
        peerReviewCount: { $first: '$peerReviewCount' },
        confirmed: { $first: '$confirmed' },
      };

      let match = { quizId: mongoose.Types.ObjectId(quizId) };

      if (dateTo) {
        match = Object.assign({}, match, { createdAt: { $lte: moment.utc(dateTo, 'DD-MM-YYYY').toDate() } });
      }

      const pipeline = [
        { $match: match },
        { $sort: sort },
        { $group: group },
      ];

      const answers = yield QuizAnswer.aggregate(pipeline);
      
      const peerReviews = yield PeerReview.find({ quizId });

      const peerReviewsByGiver = _.groupBy(peerReviews, peerReview => peerReview.giverAnswererId);
      const peerReviewsByReceiver = _.groupBy(peerReviews, peerReview => peerReview.targetAnswererId)

      const data = answers.map(answer => {
        return {
          answerId: answer.id,
          answererId: answer._id,
          spamFlags:  answer.spamFlags,
          data: answer.data,
          confirmed: answer.confirmed,
          receivedPeerReviews: peerReviewsByReceiver[answer._id] || [],
          givenPeerReviewsCount: (peerReviewsByGiver[answer._id] || []).length,
        };
      });

      req.answerers = data;

      return next();
    }).catch(next);
  }
}

function getProgressWithValidation(options) {
  return (req, res, next) => {
    const answererId = options.getAnswererId(req)
    const body = options.getBody(req)
    
    let quizIds = body.quizIds
    
    const getQuizzes = Quiz.findAnswerable({ _id: { $in: quizIds }})
    const getAnswers = QuizAnswer.find({ answererId, quizId: { $in: quizIds } }).exec()

    return Promise.all([getQuizzes, getAnswers])
      .spread((quizzes, answers) => {
        const answerQuizIds = answers.map(answer => answer.quizId.toString());
        
        const progress = _.groupBy(quizzes.map(quiz => {
          const answer = answers.filter(answer => answer.quizId.equals(quiz._id))

          return {
            quiz,
            answer: answer.length > 0 ? answer : null
          } 
        }), entry => answerQuizIds.indexOf(entry.quiz._id.toString()) >= 0 ? 'answered' : 'notAnswered')

        // or some better method
        Confirmation.findOne({ answererId })
          .then(confirmation => {
            req.validation = { ...validate(progress), answererId, confirmation }

            return next()
          })
        
      })
  }
}


function validate(progress) {
  let totalPoints = 0
  let totalMaxPoints = 0
  let totalNormalizedPoints = 0

  let answered = []
  let notAnswered = []

  progress.answered && progress.answered.forEach(entry => {
    const { quiz, answer } = entry

    let points = 0
    let maxPoints = 1
    let normalizedPoints = 0

    const { regex, multi, rightAnswer } = quiz.data.meta
    const { items, choices } = quiz.data 

    const itemAmount = Math.max(items ? items.length : 0, 1)
    
    const { data } = answer[0]

    switch (quiz.type) {
      case quizTypes.ESSAY:
        points = answer.confirmed ? 1 : 0
        normalizedPoints = points
        break
      case quizTypes.RADIO_MATRIX:
        points = multi
          ? (items.map(item => 
            data[item.id].map(k => rightAnswer[item.id].indexOf(k) >= 0).every(v => !!v)
            && rightAnswer[item.id].map(k => data[item.id].indexOf(k) >= 0).every(v => !!v)
          ).filter(v => v).length)
          : (items.map(item => 
            rightAnswer[item.id].indexOf(data[item.id]) >= 0
          ).filter(v => v).length)
        normalizedPoints = points / itemAmount
        maxPoints = itemAmount
        break
      case quizTypes.MULTIPLE_CHOICE:
        points = rightAnswer.some(o => o === data) ? 1 : 0
        normalizedPoints = points
        break
      case quizTypes.OPEN:
        if (regex) {
          try {
            let re = new RegExp(rightAnswer)
            points = !!re.exec(data.trim().toLowerCase()) ? 1 : 0
          } catch(err) {
            return 0
          }
        } else {
          points = data.trim().toLowerCase() === rightAnswer.trim().toLowerCase() ? 1 : 0
        }
        normalizedPoints = points
        break
      case quizTypes.MULTIPLE_OPEN:
        if (regex) {
          points = items.map(item => {
            try {
              let re = new RegExp(rightAnswer[item.id])
              return !!re.exec(data[item.id].trim().toLowerCase())
            } catch(err) {
              return false
            }
          }).filter(v => v).length              
        } else {
          points = items.map(item => 
            data[item.id].trim().toLowerCase() === rightAnswer[item.id].trim().toLowerCase()
          ).filter(v => v).length
        }
        normalizedPoints = points / itemAmount
        maxPoints = itemAmount
        break
      default:
        break
    }

    totalPoints += points
    totalMaxPoints += maxPoints
    totalNormalizedPoints += normalizedPoints

    answered.push({
          quiz,
          answer,
          validation: {
            points,
            maxPoints,
            normalizedPoints: precise_round(normalizedPoints, 2)
          }
        })
  })
  
  progress.notAnswered && progress.notAnswered.map(entry => {
    const { quiz } = entry
    const { items } = quiz.data

    const itemAmount = Math.max(items ? items.length : 0, 1)
        
    totalMaxPoints += itemAmount

    notAnswered.push({
      quiz,
      validation: {
        maxPoints: itemAmount
      }
    })
  })

  const maxNormalizedPoints = (progress.answered || []).length + (progress.notAnswered || []).length 
  const confirmedAmount = (progress.answered || []).filter(entry => entry.answer[0].confirmed).length

  const progressWithValidation = {
    answered,
    notAnswered,
    validation: {
      points: totalPoints,
      maxPoints: totalMaxPoints,
      confirmedAmount,
      normalizedPoints: precise_round(totalNormalizedPoints, 2),
      maxNormalizedPoints,
      progress: precise_round(confirmedAmount / maxNormalizedPoints * 100, 2),
    }
  }

  return progressWithValidation
}

function precise_round(num,decimals) {
  var sign = num >= 0 ? 1 : -1;
  return parseFloat((Math.round((num*Math.pow(10,decimals)) + (sign*0.001)) / Math.pow(10,decimals)).toFixed(decimals));
}

module.exports = { getAnswerersProgress, getAnswerers, getProgressWithValidation };
