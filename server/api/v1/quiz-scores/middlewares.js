const QuizScore = require('app-modules/models/quiz-score')

const middlewares = {
  getAnswerersScores,
  createQuizScore
}

function getAnswerersScores(options) {
  return (req, res, next) => {
    const answererId = options.getAnswererId(req)
    const quizzes = (options.getQuizzes(req) || '').split(',').filter(id => !!id);

    if (!answererId) {
      next()
    }

    QuizScore.getStatsByQuizIds(answererId, quizzes)
      .then(scores => {
        req.scores = scores
        
        return next()
      })
      .catch(err => next(err))
  }
}

function createQuizScore(options) {
  return (req, res, next) => {
    const answererId = options.getAnswererId(req)
    const quizId = options.getQuizId(req)
    const score = options.getScore(req)
    const meta = options.getMeta(req)

    if (!answererId || !score) {
      next()
    }

    const attributes = {
      answererId,
      quizId,
      score,
      meta
    }

    QuizScore.findOneAndUpdate(
      { answererId, quizId },
      { $set: attributes },
      { 
        new: true, 
        upsert: true
      }
    )
    .then(newScore => {
      req.newScore = newScore

      return next()
    })
    .catch(err => next(err))
  }
}

module.exports = middlewares