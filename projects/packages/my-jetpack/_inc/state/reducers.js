/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SET_PURCHASES, SET_PURCHASES_IS_FETCHING } from './actions';

const products = ( state = {} ) => {
	return state;
};

const purchases = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_PURCHASES_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};

		case SET_PURCHASES:
			return {
				...state,
				items: action?.purchases || [],
			};

		default:
			return state;
	}
};

const reducers = combineReducers( {
	products,
	purchases,
} );

export default reducers;
