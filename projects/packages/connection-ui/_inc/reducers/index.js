import { combineReducers } from '@wordpress/data';
import API from './api';
import assets from './assets';
import IDC from './idc';

const reducer = combineReducers( {
	API,
	assets,
	IDC,
} );

export default reducer;
