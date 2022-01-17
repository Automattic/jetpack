/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SET_PURCHASES } from './actions';

const products = ( state = {} ) => {
	return state;
};

const purchases = ( state = {}, action ) => {
	if ( action.type !== SET_PURCHASES ) {
		return state;
	}

	return {
		...state,
		items: action?.purchases || [],
	};
};

const reducers = combineReducers( {
	products,
	purchases,
} );

export default reducers;
