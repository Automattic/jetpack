/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { store as bootStore } from '@wordpress/boot';
import { dispatch } from '@wordpress/data';
import { chartBar } from '@wordpress/icons';

/**
 * Initialize the Jetpack Analytics app.
 * Runs before routes render.
 */
export async function init(): Promise< void > {
	// Point apiFetch at this site's REST API and authenticate requests. Required
	// before any package (e.g. site-sync) calls apiFetch against /jetpack/v4/*.
	const site = getScriptData()?.site;
	if ( site?.rest_root ) {
		apiFetch.use( apiFetch.createRootURLMiddleware( site.rest_root ) );
	}
	if ( site?.rest_nonce ) {
		apiFetch.use( apiFetch.createNonceMiddleware( site.rest_nonce ) );
	}

	dispatch( bootStore ).updateMenuItem( 'dashboard', {
		icon: chartBar,
	} );
}
