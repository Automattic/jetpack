/**
 * Internal dependencies
 */
import {
	JETPACK_SYNC_PROGRESS_FETCH,
	JETPACK_SYNC_PROGRESS_FETCH_FAIL,
	JETPACK_SYNC_PROGRESS_FETCH_RECEIVE,
} from 'state/action-types';

const initialState = {
	isFetching: false,
	value: null,
};

export const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case JETPACK_SYNC_PROGRESS_FETCH:
			return { ...state, isFetching: true };
		case JETPACK_SYNC_PROGRESS_FETCH_RECEIVE:
			return { value: action.syncProgress, isFetching: false };
		case JETPACK_SYNC_PROGRESS_FETCH_FAIL:
			return { ...state, isFetching: false };
		default:
			return state;
	}
};

/**
 * Returns true if currently requesting sync progress. Otherwise false.
 *
 * @param   {object}  state Global state tree
 * @returns {boolean}       Whether sync progress is being requested
 */
export function isFetchingSyncProgress( state ) {
	return !! state.jetpack.syncProgress.isFetching;
}

/**
 * Returns Jetpack Sync progress .
 * @param   {object}  state Global state tree
 * @returns {number|null}  Sync progress
 */
export function getSyncProgress( state ) {
	return state.jetpack.syncProgress.value;
}
