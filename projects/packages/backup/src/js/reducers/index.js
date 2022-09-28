import { combineReducers } from '@wordpress/data';
import API from './api';
import assets from './assets';
import connectedPlugins from './connected-plugins';
import jetpackStatus from './jetpack-status';
import siteData from './site-data';

const reducer = combineReducers( {
	connectedPlugins,
	API,
	jetpackStatus,
	assets,
	siteData,
} );

export default reducer;
