import { combineReducers } from 'redux';

import quizzes from './quizzes';
import quizAnswers from './quiz-answers';
import quizAlerts from './quiz-alerts';
import user from './user';
import peerReviews from './peer-reviews';
import peerReviewsReceived from './peer-reviews-received';
import privacyAgreements from './privacy-agreement';
import dashboard from './dashboard';
import quizAnswerSpamFlags from './quiz-answer-spam-flags';

export default combineReducers({
  quizzes,
  quizAnswers,
  quizAlerts,
  user,
  peerReviews,
  peerReviewsReceived,
  privacyAgreements,
  dashboard,
  quizAnswerSpamFlags
});
