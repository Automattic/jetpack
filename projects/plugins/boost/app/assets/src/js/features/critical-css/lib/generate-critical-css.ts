import { get } from 'svelte/store';
import { criticalCssMeta } from './stores/critical-css-meta';
import {
	localCriticalCSSProgress,
	saveCriticalCssChunk,
	criticalCssFatalError,
	storeGenerateError,
	updateProvider,
} from './stores/critical-css-state';
import {
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

/**
 * Generate Critical CSS for this site. Will load the Critical CSS Generator
 * library dynamically as needed.
 *
 * @param {CriticalCssState} cssState
 */
export default async function generateCriticalCss(
	cssState: CriticalCssState
): Promise< boolean > {
	const cancelling = false;

	try {
		// Load Critical CSS gen library if not already loaded.
		await loadCriticalCssLibrary();

		// Prepare GET parameters to include with each request.
		const requestGetParameters = {
			'jb-generate-critical-css': Date.now().toString(),
		};

		logPreCriticalCSSGeneration();

		const { viewports, callback_passthrough, proxy_nonce } = get( criticalCssMeta );

		const pendingProviders = cssState.providers.filter( provider => provider.status === 'pending' );
		if ( pendingProviders.length > 0 ) {
			return await generateForKeys(
				pendingProviders,
				requestGetParameters,
				viewports as Viewport[],
				callback_passthrough as JSONObject,
				proxy_nonce
			);
		}
	} catch ( err ) {
		// Swallow errors if cancelling the process.
		// eslint-disable-next-line no-console
		console.error( err );
		if ( ! cancelling ) {
			// Record thrown errors as Critical CSS status.
			storeGenerateError( err );
		}
	}
	return true;
}

/**
 * Helper method to prepare a Browser Interface for Critical CSS generation.
 *
 * @param {Object} requestGetParameters - GET parameters to include with each request.
 * @param {string} proxyNonce           - Nonce to use when proxying CSS requests.
 */
function createBrowserInterface( requestGetParameters, proxyNonce ) {
	return new ( class extends CriticalCSSGenerator.BrowserInterfaceIframe {
		constructor() {
			super( {
				requestGetParameters,
				verifyPage,
				allowScripts: false,
			} );
		}

		fetch( url, options, context ) {
			if ( context === 'css' && ! isSameOrigin( url ) ) {
				return prepareAdminAjaxRequest( {
					action: 'boost_proxy_css',
					proxy_url: url,
					nonce: proxyNonce,
				} );
			}

			return fetch( url, options );
		}
	} )();
}

/**
 * Generate Critical CSS for the specified Provider Keys, sending each block
 * to the server. Throws on error or cancellation.
 *
 * @param {Object}     providers            - Set of URLs to use for each provider key
 * @param {Object}     requestGetParameters - GET parameters to include with each request.
 * @param {Viewport[]} viewports            - Viewports to generate with.
 * @param {JSONObject} passthrough          - JSON data to include in callbacks to API.
 * @param {string}     proxyNonce           - Nonce to use when proxying CSS requests.
 */
async function generateForKeys(
	providers: Provider[],
	requestGetParameters: { [ key: string ]: string },
	viewports: Viewport[],
	passthrough: JSONObject,
	proxyNonce: string
): Promise< boolean > {
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const startTime = Date.now();
	let totalSize = 0;
	let stepsPassed = 0;
	let stepsFailed = 0;
	let maxSize = 0;

	// Run through each set of URLs.
	for ( const { urls, success_ratio, key } of providers ) {
		try {
			const [ css, warnings ] = await CriticalCSSGenerator.generateCriticalCSS( {
				browserInterface: createBrowserInterface( requestGetParameters, proxyNonce ),
				urls,
				viewports,
				progressCallback: ( step: number, total: number ) => {
					localCriticalCSSProgress.set( step / total );
				},
				filters: {
					atRules: keepAtRule,
					properties: keepProperty,
				},
				successRatio: success_ratio,
				maxPages: 10,
			} );

			const updateResult = await saveCriticalCssChunk( key, css, passthrough );

			const status = warnings.length > 0 ? 'error' : 'success';
			updateProvider( key, {
				status,
				errors: warnings,
			} );

			// Reset local progress whenever a provider is finished to prevent progress bar jank.
			localCriticalCSSProgress.set( 0 );

			if ( updateResult === false ) {
				return false;
			}

			stepsPassed++;
			totalSize += css.length;
			maxSize = css.length > maxSize ? css.length : maxSize;
		} catch ( err ) {
			// Success Target Errors indicate that URLs failed, but the process itself succeeded.
			if ( err.isSuccessTargetError ) {
				stepsFailed++;
				const urlErrors = err.urlErrors as {
					// These come from Jetpack Boost Critical CSS Generator
					// In this shape:
					[ url: string ]: {
						message: string;
						type: Critical_CSS_Error_Type;
						meta: { [ key: string ]: JSONObject };
					};
				};
				const errorsWithURLs = Object.keys( urlErrors ).map( url => {
					const error = urlErrors[ url ];
					return {
						...error,
						url,
					};
				} );

				if ( key ) {
					updateProvider( key, {
						status: 'error',
						error_status: 'active',
						errors: errorsWithURLs,
					} );
				}

				for ( const [ url, error ] of Object.entries( urlErrors ) ) {
					// Track individual Critical CSS generation error.
					const eventProps: TracksEventProperties = {
						url,
						provider_key: key,
						error_message: error.message,
						error_type: error.type,
					};
					if (
						error.type === 'HttpError' &&
						typeof error.meta === 'object' &&
						error.meta !== null &&
						'code' in error.meta
					) {
						eventProps.error_meta = castToNumber( error.meta.code );
					}
					recordBoostEvent( 'critical_css_url_error', eventProps );
				}
			} else {
				criticalCssFatalError();

				// Track showstopper Critical CSS generation error.
				const eventProps = {
					time: Date.now() - startTime,
					provider_key: key,
					error_message: err.message,
					error_type: err.type || ( err.constructor && err.constructor.name ) || 'unknown',
				};
				recordBoostEvent( 'critical_css_failure', eventProps );
				return false;
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
			provider_keys: Object.keys( providers ).join( ',' ),
		};
		recordBoostEvent( 'critical_css_success', eventProps );
	}
	return true;
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
 * Helper method to filter out at-rules that we don't want.
 *
 * @param {string} name Name of the at-rule to evaluate
 * @return {boolean} indicating whether or not the at-rule is wanted.
 */
function keepAtRule( name: string ): boolean {
	return ! name.endsWith( 'keyframes' );
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
