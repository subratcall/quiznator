import React from 'react';
import { connect } from 'react-redux';
import _get from 'lodash.get';
import LikertScale from 'likert-react';

import Loader from 'components/loader';
import PeerReview from './peer-review';
import SubmitButton from 'components/quiz/submit-button';

import { quizPropsTypes, quizDefaultProps } from 'components/quiz';
import { loadPeerReviews } from 'state/peer-reviews';
import withClassPrefix from 'utils/class-prefix';
import userResourceLoader from 'components/user-resource-loader';
import { hasAnsweredToQuiz } from 'selectors/quiz-answers';

class PeerReviewQuiz extends React.Component {
  onChoosePeerReview(chosen, rejected) {
    return e => {
      e.preventDefault();

      this.props.onPeerReviewChosenReviewChange({
        chosenQuizAnswerId: chosen._id,
        rejectedQuizAnswerId: rejected._id
      });
    }
  }

  onReviewChange(e) {
    e.preventDefault();

    this.props.onPeerReviewReviewChange(this.refs.review.value);
  }

  getChosenReview() {
    return _get(this.props.answer, 'data.chosenQuizAnswerId');
  }

  validate() {
    const likert = _get(this.props.answer, 'data.likert') || {};
    return this.getChosenReview() && _get(this.props.answer, 'data.review') && Object.keys(likert).length == 4;
  }

  onSubmit(e) {
    e.preventDefault();

    if(this.validate()) {
      this.props.onSubmit();
    }
  }

  handleLikertChange(name, value) {
    this.props.onLikertChange(name, value);
  }

  renderForm() {
    const isValid = this.validate();
    const submitDisabled = !isValid || !!this.props.disabled || !!this.props.submitting;

    const reviews = [
      { question: 'Essay was on-topic' },
      { question: 'Essay was comprehensive' },
      { question: 'Essay was well-reasoned' },
      { question: 'Essay was easy to follow' }
    ];

    return (
      <form onSubmit={this.onSubmit.bind(this)}>
        <div className={withClassPrefix('form-group')}>
          <textarea disabled={this.props.disabled} onChange={this.onReviewChange.bind(this)} className={withClassPrefix('textarea')} rows={5} maxLength={5000} ref="review">
          </textarea>
        </div>

        <div className={withClassPrefix('form-group')}>
          <LikertScale reviews={reviews} onClick={(name, value) => this.handleLikertChange(name, value)} />
        </div>

        <div className={withClassPrefix('form-group')}>
          <SubmitButton disabled={submitDisabled} submitting={this.props.submitting} submitted={this.props.answerSubmitted}/>
        </div>
      </form>
    );
  }

  renderContent() {
    return (
      <div className={withClassPrefix('peer-review-wrapper')}>
        <h4>{this.props.peerReviews.data.quiz.title}</h4>

        {this.renderPeerReviews()}
        {this.renderForm()}
      </div>
    );
  }

  renderPeerReviews() {
    const quiz = this.props.peerReviews.data.quiz;
    const firstReview = this.props.peerReviews.data.peerReviews[0];
    const secondReview = this.props.peerReviews.data.peerReviews[1];

    return (
      <div className={withClassPrefix('peer-review-container')}>
        <div className={withClassPrefix('peer-review-container__answer')} key={firstReview._id}>
          <PeerReview quiz={quiz} answer={firstReview} chosen={this.getChosenReview() === firstReview._id} onChoose={this.onChoosePeerReview(firstReview, secondReview)}/>
        </div>

        <div className={withClassPrefix('peer-review-container__answer')} key={secondReview._id}>
          <PeerReview quiz={quiz} answer={secondReview} chosen={this.getChosenReview() === secondReview._id} onChoose={this.onChoosePeerReview(secondReview, firstReview)}/>
        </div>
      </div>
    );
  }

  hasPeerReviews() {
    return this.props.peerReviews.data && this.props.peerReviews.data.peerReviews.length > 1;
  }

  renderNotAnswered() {
    return (
      <div className={withClassPrefix('text-muted')}>
        Submit your answer to the quiz before giving a peer review.
      </div>
    );
  }

  renderNoPeerReviews() {
    return (
      <div className={withClassPrefix('text-muted')}>
        No peer reviews currently available
      </div>
    );
  }

  answeringIsRequired() {
    return !!_get(this.props.quiz, 'data.answeringRequired');
  }

  render() {
    if(this.props.peerReviews.loading) {
      return <Loader/>;
    } else if(!this.props.hasAnswered && this.answeringIsRequired()) {
      return this.renderNotAnswered();
    } else if(this.hasPeerReviews()) {
      return this.renderContent();
    } else {
      return this.renderNoPeerReviews();
    }
  }
}

PeerReviewQuiz.propTypes = Object.assign({},
  quizPropsTypes,
  {
    peerReviews: React.PropTypes.object,
    hasAnswered: React.PropTypes.bool
  }
);

PeerReviewQuiz.defaultProps = Object.assign({},
  quizDefaultProps,
  {
    peerReviews: {},
    hasAnswered: false
  }
);

const mapStateToProps = (state, ownProps) => ({
  peerReviews: state.peerReviews[ownProps.quiz._id],
  hasAnswered: hasAnsweredToQuiz(state, { quizId: _get(ownProps, 'quiz.data.quizId') })
});

const withUserResourceLoader = userResourceLoader({
  dispatcher: (dispatch, ownProps) => dispatch(loadPeerReviews({ targetQuizId: ownProps.quiz.data.quizId, sourceQuizId: ownProps.quiz._id }))
})(PeerReviewQuiz);

export default connect(
  mapStateToProps
)(withUserResourceLoader);
