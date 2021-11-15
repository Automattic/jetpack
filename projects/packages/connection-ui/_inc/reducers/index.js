/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import API from './api';
import assets from './assets';
import IDC from './idc';

const reducer = combineReducers( {
	API,
	assets,
	IDC,
} );

export default reducer;
