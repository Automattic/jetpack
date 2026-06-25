import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';

// Serve the first settings + categories fetches from PHP-rendered data instead of
// the network. Imported first in index.tsx so it runs before any hook fetches.
const preload = getScriptData()?.podcast?.preload;

if ( preload ) {
	apiFetch.use( apiFetch.createPreloadingMiddleware( preload ) );
}
