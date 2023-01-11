import { combineReducers } from '@wordpress/data';
import API from './api';
import assets from './assets';
import connectedPlugins from './connected-plugins';
import jetpackStatus from './jetpack-status';
import siteData from './site-data';
import siteRewindPolicies from './site-rewind-policies';
import siteRewindSize from './site-rewind-size';

const reducer = combineReducers( {
	connectedPlugins,
	API,
	jetpackStatus,
	assets,
	siteData,
	siteRewindSize,
	siteRewindPolicies,
} );

export default reducer;
