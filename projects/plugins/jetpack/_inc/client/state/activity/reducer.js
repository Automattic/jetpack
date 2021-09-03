/**
 * External dependencies
 */
import { assign } from 'lodash';

/**
 * Internal dependencies
 */
import {
	ACTIVITY_STATUS_FETCH,
	ACTIVITY_STATUS_FETCH_RECEIVE,
	ACTIVITY_STATUS_FETCH_FAIL,
} from 'state/action-types';

const activity = ( state = {}, action ) => {
	switch ( action.type ) {
		case ACTIVITY_STATUS_FETCH:
			return assign( {}, state, {} );
		case ACTIVITY_STATUS_FETCH_RECEIVE:
			return assign( {}, state, { status: 'success', items: action.data } );
		case ACTIVITY_STATUS_FETCH_FAIL:
			return assign( {}, state, { status: 'failed', items: [] } );
		default:
			return state;
	}
};

export default activity;
