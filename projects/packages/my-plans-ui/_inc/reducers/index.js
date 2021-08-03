/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import API from './api';
import assets from './assets';

const reducer = combineReducers( {
	API,
	assets,
} );

export default reducer;
