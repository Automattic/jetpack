/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

const status = ( state = {}, action ) => {
	switch ( action.type ) {
		default:
			return state;
	}
};

const reducers = combineReducers( {
	status,
} );

export default reducers;
