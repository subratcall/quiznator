import scour from 'scourjs';
import lget from 'lodash.get';

import { createReducer } from 'redux-create-reducer';

import { 
    POST_PRIVACY_AGREEMENT, 
    POST_PRIVACY_AGREEMENT_SUCCESS, 
    POST_PRIVACY_AGREEMENT_FAIL, 
    STORE_PRIVACY_AGREEMENT_LOCAL_STORAGE_KEY,
    FETCH_PRIVACY_AGREEMENT,
    FETCH_PRIVACY_AGREEMENT_SUCCESS,
    FETCH_PRIVACY_AGREEMENT_FAIL,
    REFRESH_PRIVACY_AGREEMENT
} from './actions';

function setNotSubmitting(state, quizId) {
    return scour(state)
      .go(quizId)
      .extend({ submitting: false })
      .root;
  }
  
export default createReducer({}, {
    [POST_PRIVACY_AGREEMENT](state, action) {
        return scour(state)
            .go(action.quizId)
            .extend({ submitting: true })
            .root
            .value;
    },
    [POST_PRIVACY_AGREEMENT_SUCCESS](state, action) {
        return setNotSubmitting(state, action.meta.previousAction.quizId).value;
    },
    [POST_PRIVACY_AGREEMENT_FAIL](state, action) {
        return setNotSubmitting(state, action.meta.previousAction.quizId).value;
    },
    [STORE_PRIVACY_AGREEMENT_LOCAL_STORAGE_KEY](state, action) {
        return scour(state)
            .root
            .value;
    },
    [FETCH_PRIVACY_AGREEMENT](state, action) {
        return scour(state)
            .go(action.quizId)
            .extend({ loading: true, /* ??? */ })
            .root
            .value;
    },
    [FETCH_PRIVACY_AGREEMENT_SUCCESS](state, action) {
        if (lget(action, 'payload.data')) {
            const agreement = action.payload.data

            return scour(state)
                .go(agreement.quizId)
                .extend({ data: agreement, isOld: true, loading: false})
                .root
                .value
        } else {
            return state;
        }
    },
    [FETCH_PRIVACY_AGREEMENT_FAIL](state, action) {
        return scour(state)
            .extend({ loading: false })
            .root 
            .value;
    },
    [REFRESH_PRIVACY_AGREEMENT](state, action) {
        return scour(state)
            .root
            .value; 
    }
});