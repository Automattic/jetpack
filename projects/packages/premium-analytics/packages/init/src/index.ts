/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { store as bootStore } from '@wordpress/boot';
import { dispatch } from '@wordpress/data';
import { chartBar } from '@wordpress/icons';

type PreloadedResponse = {
	body: unknown;
	headers?: Record< string, string >;
};

type PremiumAnalyticsScriptData = ReturnType< typeof getScriptData > & {
	premium_analytics?: {
		preload?: Record< string, PreloadedResponse >;
	};
};

// apiFetch middleware registers onto a shared, process-wide chain. Guard so
// repeated init() calls (re-mount, HMR, a future second boot) don't stack
// duplicate root-URL/nonce/preload middleware.
let apiFetchConfigured = false;

/**
 * Configure the bundled apiFetch instance with the WordPress REST API root URL
 * and authentication nonce from Jetpack script data. Runs once before routes
 * render so shared packages (e.g. site-sync) can call the REST API.
 */
function setupApiFetch(): void {
	if ( apiFetchConfigured ) {
		return;
	}

	const scriptData = getScriptData() as PremiumAnalyticsScriptData | undefined;
	const site = scriptData?.site;
	const preload = scriptData?.premium_analytics?.preload;

	if ( site?.rest_root ) {
		apiFetch.use( apiFetch.createRootURLMiddleware( site.rest_root ) );
	}
	if ( site?.rest_nonce ) {
		apiFetch.use( apiFetch.createNonceMiddleware( site.rest_nonce ) );
	}
	if ( preload ) {
		apiFetch.use( apiFetch.createPreloadingMiddleware( preload ) );
	}

	// Only latch once we actually registered, so an early call before
	// script-data is ready doesn't permanently skip configuration.
	if ( site?.rest_root || site?.rest_nonce || preload ) {
		apiFetchConfigured = true;
	}
}

/**
 * Initialize the Jetpack Analytics app.
 * Runs before routes render.
 */
export async function init(): Promise< void > {
	setupApiFetch();

	dispatch( bootStore ).updateMenuItem( 'dashboard', {
		icon: chartBar,
	} );
}
