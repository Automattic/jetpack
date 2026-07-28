/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import apiFetch from '@wordpress/api-fetch';
import { store as bootStore } from '@wordpress/boot';
import { dispatch } from '@wordpress/data';
import { chartBar } from '@wordpress/icons';

// apiFetch middleware registers onto a shared, process-wide chain. Guard so
// repeated init() calls (re-mount, HMR, a future second boot) don't stack
// duplicate root-URL/nonce middleware.
let authConfigured = false;

/**
 * Configure the bundled apiFetch instance with the WordPress REST API root URL
 * and authentication nonce from Jetpack script data. Runs once before routes
 * render so shared packages (e.g. site-sync) can call the REST API.
 */
function setupApiFetch(): void {
	if ( authConfigured ) {
		return;
	}
	const site = getScriptData()?.site;
	if ( site?.rest_root ) {
		apiFetch.use( apiFetch.createRootURLMiddleware( site.rest_root ) );
	}
	if ( site?.rest_nonce ) {
		apiFetch.use( apiFetch.createNonceMiddleware( site.rest_nonce ) );
	}
	// Only latch once we actually registered, so an early call before
	// script-data is ready doesn't permanently skip configuration.
	if ( site?.rest_root || site?.rest_nonce ) {
		authConfigured = true;
	}
}

/**
 * Initialize the Jetpack Analytics app.
 * Runs before routes render.
 */
export async function init(): Promise< void > {
	// Kick off the JS translation catalog downloads first (async), then do the
	// synchronous setup in parallel while they're in flight.
	const catalogs = loadI18nCatalogs( 'jetpack-premium-analytics-pkg', import.meta.url );

	setupApiFetch();

	dispatch( bootStore ).updateMenuItem( 'dashboard', {
		icon: chartBar,
	} );

	await catalogs;
}
