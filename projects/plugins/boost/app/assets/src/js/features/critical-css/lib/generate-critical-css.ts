import { get } from 'svelte/store';
import { criticalCssMeta } from './stores/critical-css-meta';
import {
	CriticalCssErrorDetails,
	CriticalCssState,
	Critical_CSS_Error_Type,
	Provider,
} from './stores/critical-css-state-types';
import { JSONObject } from '$lib/stores/data-sync-client';
import { recordBoostEvent, TracksEventProperties } from '$lib/utils/analytics';
import { castToNumber } from '$lib/utils/cast-to-number';
import { logPreCriticalCSSGeneration } from '$lib/utils/console';
import { isSameOrigin } from '$lib/utils/is-same-origin';
import { loadCriticalCssLibrary } from '$lib/utils/load-critical-css-library';
import { prepareAdminAjaxRequest } from '$lib/utils/make-admin-ajax-request';
import type { Viewport } from '$lib/utils/types';
import { SuccessTargetError, UrlError } from 'jetpack-boost-critical-css-gen';
import { normalizeError } from '$lib/utils/normalize-error';

interface GenerationTarget {
	key: string;
	urls: string[];
	success_ratio: number;
}

type ProviderSuccessHandler = ( key: string, css: string ) => Promise< void >;
type ProviderErrorHandler = ( key: string, errors: CriticalCssErrorDetails[] ) => Promise< void >; // For when a single provider fails
type SuccessHandler = () => void; // For when the whole process finishes.
type ErrorHandler = ( error: Error ) => void; // For when the whole process fails.

type GenerationParams = {
	targets: GenerationTarget[];
	onProviderSuccess: ProviderSuccessHandler;
	onProviderError: ProviderErrorHandler;
	onSuccess: SuccessHandler;
	onError: ErrorHandler;
};

export function startLocalGenerator( {
	targets,
	onProviderSuccess,
	onProviderError,
	onSuccess,
	onError,
}: GenerationParams ) {
	const abortController: AbortController = new AbortController();

	generatorProcess(
		targets,
		onProviderSuccess,
		onProviderError,
		onSuccess,
		onError,
		abortController
	);

	// Return a function to stop the process.
	return () => {
		abortController.abort();
	};
}

async function generatorProcess(
	targets: GenerationTarget[],
	onProviderSuccess: ProviderSuccessHandler,
	onProviderError: ProviderErrorHandler,
	onSuccess: SuccessHandler,
	onError: ErrorHandler,
	abortController: AbortController
) {
	try {
		// Load Critical CSS gen library if not already loaded.
		await loadCriticalCssLibrary();

		// Let users know that console warnings are normal during Critical CSS generation.
		logPreCriticalCSSGeneration();

		// @TODO convert me to react/config.
		const { viewports, proxy_nonce } = get( criticalCssMeta );

		// Generate Critical CSS for each target.
		await generateForKeys(
			targets,
			viewports! as Viewport[],
			proxy_nonce!,
			onProviderSuccess,
			onProviderError,
			abortController.signal
		);

		onSuccess();
	} catch ( err ) {
		// Swallow errors if cancelling the process.
		if ( ! abortController.signal.aborted ) {
			onError( normalizeError( err ) );
		}
	}
}

async function generateForKeys(
	targets: GenerationTarget[],
	viewports: Viewport[],
	proxyNonce: string,
	onProviderSuccess: ProviderSuccessHandler,
	onProviderError: ProviderErrorHandler,
	abortSignal: AbortSignal
): Promise< void > {
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const startTime = Date.now();
	let totalSize = 0;
	let stepsPassed = 0;
	let stepsFailed = 0;
	let maxSize = 0;

	// Run through each set of URLs.
	for ( const { urls, success_ratio: successRatio, key } of targets ) {
		try {
			const [ css ] = await CriticalCSSGenerator.generateCriticalCSS( {
				browserInterface: createBrowserInterface( proxyNonce, abortSignal ),
				urls,
				viewports,
				successRatio,
				//				progressCallback: ( step: number, total: number ) => {},
				filters: { properties: keepProperty },
				maxPages: 10,
			} );

			if ( abortSignal.aborted ) {
				return;
			}

			await onProviderSuccess( key, css );

			// Reset local progress whenever a provider is finished to prevent progress bar jank.
			// localCriticalCSSProgress.set( 0 );

			stepsPassed++;
			totalSize += css.length;
			maxSize = css.length > maxSize ? css.length : maxSize;
		} catch ( err ) {
			// SuccessTargetError is used to indicate the generator couldn't load URLs.
			if ( err instanceof SuccessTargetError ) {
				// @TODO: This kind of type conversion is ugly.
				// Convert {url:error} to [{url,...error}], as that is how our provider errors are stored.
				const flatErrors = Object.entries( err.urlErrors ).map(
					( [ url, details ] ) => ( { url, ...details } ) as CriticalCssErrorDetails
				);

				await onProviderError( key, flatErrors );

				// Track Critical CSS generation errors.
				stepsFailed++;
				for ( const { url, message, type } of flatErrors ) {
					recordBoostEvent( 'critical_css_url_error', {
						url,
						provider_key: key,
						error_message: message,
						error_type: type,
					} );
				}
			} else {
				const errorObject = normalizeError( err );
				const explicitType =
					'type' in errorObject && typeof errorObject.type === 'string' && errorObject.type;
				const impliedType = errorObject.constructor && errorObject.constructor.name;

				// Track error.
				recordBoostEvent( 'critical_css_error', {
					provider_key: key,
					error_message: errorObject.message,
					error_type: explicitType || impliedType || 'unknown',
				} );

				throw errorObject;
			}
		}
	}

	// Track complete Critical CSS generation result.
	if ( stepsPassed === 0 ) {
		const eventProps = {
			time: Date.now() - startTime,
			error_message: 'Critical CSS Generation failed for all the provider keys.',
			error_type: 'allProvidersError',
		};
		recordBoostEvent( 'critical_css_failure', eventProps );
	} else {
		const eventProps = {
			time: Date.now() - startTime,
			block_count: stepsPassed,
			error_count: stepsFailed,
			average_size: totalSize / Math.max( 1, stepsPassed ),
			max_size: maxSize,
			provider_keys: Object.keys( targets ).join( ',' ),
		};
		recordBoostEvent( 'critical_css_success', eventProps );
	}
}

/**
 * Helper method to prepare a Browser Interface for Critical CSS generation.
 *
 * @param {string}      proxyNonce - Nonce to use when proxying CSS requests.
 * @param {AbortSignal} signal     - AbortSignal to use for aborting the process.
 */
function createBrowserInterface( proxyNonce: string, signal: AbortSignal ) {
	// Prepare GET parameters to include with each request; both as a cache-buster, and to turn off other optimizations.
	const requestGetParameters = { 'jb-generate-critical-css': Date.now().toString() };

	return new ( class extends CriticalCSSGenerator.BrowserInterfaceIframe {
		constructor() {
			super( {
				requestGetParameters,
				verifyPage,
				allowScripts: false,
			} );
		}

		fetch( url: string, options: RequestInit, context: string ) {
			if ( context === 'css' && ! isSameOrigin( url ) ) {
				return prepareAdminAjaxRequest( {
					action: 'boost_proxy_css',
					proxy_url: url,
					nonce: proxyNonce,
				} );
			}

			return fetch( url, { ...options, signal } );
		}
	} )();
}

/**
 * Strip vendor prefixes from the specified at-rule or property name.
 *
 * @param {string} name - Property or at-rule name to strip vendor prefixes from.
 * @return {string} - Name with vendor prefixes stripped off.
 */
function stripVendorPrefix( name: string ): string {
	for ( const prefix of [ '-webkit-', '-moz-', '-ms-', '-o-' ] ) {
		if ( name.startsWith( prefix ) ) {
			return name.substring( prefix.length );
		}
	}

	return name;
}

/**
 * Helper method to filter out properties that we don't want.
 * Note this function is used as a filter in the generateCriticalCSS function
 * in the jetpack-boost-critical-css-gen library (https://github.com/Automattic/jetpack-boost-critical-css-gen).
 *
 * This function has a value parameter which is not being used here but other implementations of this
 * helper function for the library may require the value parameter for filtering.
 * As a result we are retaining the value parameters here.
 *
 * @param {string} name   Name of the property to evaluate
 * @param {string} _value Value of the property to evaluate
 * @return {boolean} indicating whether or not the property is wanted.
 */
function keepProperty( name: string, _value: string ): boolean {
	const stripped = stripVendorPrefix( name );
	return ! stripped.startsWith( 'animation' );
}

/**
 * Function to verify that a specific page is valid to run the Critical CSS process on it.
 *
 * Note that this function is used as a callback in the generateCriticalCSS function
 * in the jetpack-boost-critical-css-gen library (https://github.com/Automattic/jetpack-boost-critical-css-gen).
 *
 * This function has a url and innerWindow parameters which are not being used here but this method
 * is called with URL and InnerWindow in that library to offer flexibility of the verification for other implementation.
 * As a result we are retaining the url and innerWindow parameters here.
 *
 * @param {string}   url           Url of the page being verified.
 * @param {Window}   innerWindow   Inner Window object of the page being verified.
 * @param {Document} innerDocument Inner Document object of the page being verified.
 */
function verifyPage( url: string, innerWindow: Window, innerDocument: Document ): boolean {
	return !! innerDocument.querySelector( 'meta[name="jb-generate-critical-css"]' );
}
