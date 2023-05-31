/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';
import { fromPairs, keys, map, uniqBy } from 'lodash';
/**
 * Internal dependencies
 */
import {
	RESPONSES_FETCH,
	RESPONSES_FETCH_FAIL,
	RESPONSES_FETCH_RECEIVE,
	RESPONSES_LOADING_SET,
	RESPONSES_REMOVE,
	RESPONSES_SELECTION_SET,
	RESPONSES_TAB_TOTALS_ADD,
} from './action-types';

const filters = ( state = {}, action ) => {
	if ( action.type === RESPONSES_FETCH_RECEIVE ) {
		return action.filters;
	}

	return state;
};

const loading = ( state = false, action ) => {
	if ( action.type === RESPONSES_FETCH ) {
		return true;
	}

	if ( action.type === RESPONSES_FETCH_RECEIVE || action.type === RESPONSES_FETCH_FAIL ) {
		return false;
	}

	if ( action.type === RESPONSES_LOADING_SET ) {
		return action.loading;
	}

	return state;
};

const responses = ( state = [], action ) => {
	if ( action.type === RESPONSES_FETCH && ! action.append ) {
		return [];
	}

	if ( action.type === RESPONSES_FETCH_RECEIVE ) {
		if ( ! action.append ) {
			return [ ...action.responses ];
		}

		// It's technically possible to have duplicate responses when appending,
		// hence the need to make sure we're only displaying one of each.
		return uniqBy( [ ...state, ...action.responses ], response => response.id );
	}

	if ( action.type === RESPONSES_REMOVE ) {
		return state.filter( response => action.responseIds.indexOf( response.id ) < 0 );
	}

	return state;
};

const query = ( state = {}, action ) => {
	if ( action.type === RESPONSES_FETCH ) {
		return action.query;
	}

	return state;
};

const tabTotals = ( state = undefined, action ) => {
	if ( action.type === RESPONSES_FETCH_RECEIVE ) {
		return action.tabTotals;
	}

	if ( action.type === RESPONSES_TAB_TOTALS_ADD ) {
		return fromPairs(
			map( keys( { ...state, ...action.tabTotals } ), tab => [
				tab,
				( state[ tab ] || 0 ) + ( action.tabTotals[ tab ] || 0 ),
			] )
		);
	}

	return state;
};

const total = ( state = 0, action ) => {
	if ( action.type === RESPONSES_FETCH && action.offset === 0 ) {
		return 0;
	}

	if ( action.type === RESPONSES_FETCH_RECEIVE ) {
		return action.total;
	}

	if ( action.type === RESPONSES_REMOVE ) {
		return state - action.responseIds.length;
	}

	return state;
};

const currentSelection = ( state = [], action ) => {
	if ( action.type === RESPONSES_FETCH_RECEIVE ) {
		return [];
	}

	if ( action.type === RESPONSES_SELECTION_SET ) {
		return action.selectedResponses;
	}

	return state;
};

export default combineReducers( {
	currentSelection,
	filters,
	loading,
	query,
	responses,
	tabTotals,
	total,
} );
