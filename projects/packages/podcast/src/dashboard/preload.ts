import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';

// Seed apiFetch with the settings + categories responses PHP rendered into script
// data, so the first dashboard render serves them from cache instead of issuing
// mount-time REST round-trips. Each path is served once (the bootstrap GET); saves
// and refetches fall through to the network as before. Imported first in index.tsx
// so the middleware is registered before any hook can fire a request.
const preload = getScriptData()?.podcast?.preload;

if ( preload ) {
	apiFetch.use( apiFetch.createPreloadingMiddleware( preload ) );
}
