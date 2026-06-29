import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';

const preload = getScriptData()?.podcast?.preload;

if ( preload ) {
	apiFetch.use( apiFetch.createPreloadingMiddleware( preload ) );
}
