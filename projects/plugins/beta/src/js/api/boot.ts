/**
 * Page bootstrap for the Jetpack Beta dashboard.
 *
 * Under wp-build the dashboard loads as an ES module, so the server can't attach
 * data with `wp_localize_script`. The state is bootstrapped onto
 * `window.JetpackScriptData.betaTester` via the `jetpack_admin_js_script_data`
 * filter (see `Admin::inject_script_data()`) and read here with `getScriptData()`.
 *
 * Importing this module also configures `apiFetch` once with the REST root and
 * nonce, so the WP Abilities calls authenticate.
 *
 * @package
 */

import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import type { BetaBootstrap } from './types';

const EMPTY: BetaBootstrap = {
	apiRoot: '',
	apiNonce: '',
	pluginName: null,
	plugins: null,
	adminUrl: '',
};

/**
 * Read the Jetpack Beta bootstrap state off the page.
 *
 * @return The bootstrap data, with empty defaults when the page didn't inject it.
 */
export function getBetaData(): BetaBootstrap {
	const data = getScriptData() as { betaTester?: Partial< BetaBootstrap > } | undefined;
	return { ...EMPTY, ...( data?.betaTester ?? {} ) };
}

// Configure apiFetch once, from the bootstrapped REST root/nonce.
const boot = getBetaData();
if ( boot.apiRoot ) {
	apiFetch.use( apiFetch.createRootURLMiddleware( boot.apiRoot ) );
}
if ( boot.apiNonce ) {
	apiFetch.use( apiFetch.createNonceMiddleware( boot.apiNonce ) );
}
