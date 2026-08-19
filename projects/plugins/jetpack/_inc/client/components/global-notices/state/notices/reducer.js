import { combineReducers } from 'redux';
import { NEW_NOTICE, REMOVE_NOTICE } from '../action-types';

/**
 * Reducer for global notices.
 *
 * @param {Array}  state  - Current state.
 * @param {object} action - Action object.
 * @return {Array} Updated state.
 */
export function globalNotices( state = [], action ) {
	switch ( action.type ) {
		case NEW_NOTICE:
			return [ action.notice, ...state ];
		case REMOVE_NOTICE:
			return state.filter( notice => notice.noticeId !== action.noticeId );
	}
	return state;
}

export default combineReducers( {
	globalNotices,
} );
