import apiFetch from '@wordpress/api-fetch';
import AiHubApp from '../../_inc/client/ai/main';
import analytics from '../../_inc/client/lib/analytics';
import './route.scss';
import type { ComponentType } from 'react';

const { apiRoot, apiNonce, tracksUserData } = window?.jetpackAiSettings ?? {};

// Identify the connected user so Tracks events aren't anonymous.
if ( tracksUserData?.userid && tracksUserData?.username ) {
	analytics.initialize( tracksUserData.userid, tracksUserData.username );
}

if ( apiRoot ) {
	apiFetch.use( apiFetch.createRootURLMiddleware( apiRoot ) );
}
if ( apiNonce ) {
	apiFetch.use( apiFetch.createNonceMiddleware( apiNonce ) );
}

/**
 * Boot stage for the Jetpack AI Hub.
 *
 * Renders the same tree as the legacy entry, hash routing included — boot reads its
 * path from `?p=`, never the hash, so `#/mcp/read` deep links still resolve.
 *
 * @return The AI Hub app.
 */
// main.jsx is untyped, so TS infers its return as `object` rather than a React element.
const App = AiHubApp as ComponentType;

const Stage = () => <App />;

export { Stage as stage };
