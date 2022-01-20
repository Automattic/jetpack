/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	SET_PURCHASES,
	SET_PURCHASES_IS_FETCHING,
	SET_PRODUCT_ACTION_ERROR,
	SET_PRODUCT_STATUS,
} from './actions';

const products = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_PRODUCT_STATUS: {
			const { productId, status } = action;
			return {
				...state,
				items: {
					...state.items,
					[ productId ]: {
						...state.items[ productId ],
						...status,
					},
				},
				error: {},
			};
		}

		case SET_PRODUCT_ACTION_ERROR:
			return {
				...state,
				error: action.error,
			};

		default:
			return state;
	}
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
