import { get } from 'svelte/store';
import setProviderIssue, {
	localCriticalCSSProgress,
	saveCriticalCssChunk,
	stopTheShow,
	storeGenerateError,
	updateProvider,
} from '../stores/critical-css-status';
import {
	CriticalCssIssue,
	CriticalCssStatus,
	Critical_CSS_Error_Type,
	Provider,
} from '../stores/critical-css-status-ds';
import { JSONObject, suggestRegenerateDS } from '../stores/data-sync-client';
import { modules } from '../stores/modules';
import { recordBoostEvent } from './analytics';
import { castToNumber } from './cast-to-number';
import { logPreCriticalCSSGeneration } from './console';
import { isSameOrigin } from './is-same-origin';
import { loadCriticalCssLibrary } from './load-critical-css-library';
import { prepareAdminAjaxRequest } from './make-admin-ajax-request';
import type { Viewport } from './types';

let hasGenerateRun = false;

/**
 * Reset hasGenerateRun if the module is disabled to ensure generateCriticalCss
 * runs if the module is enabled again.
 */
modules.subscribe( modulesState => {
	if ( ! modulesState[ 'critical-css' ] || ! modulesState[ 'critical-css' ].enabled ) {
		hasGenerateRun = false;
	}
} );

/**
 * Call generateCriticalCss if it hasn't been called before this app execution
 * (browser pageload), to verify if Critical CSS needs to be generated.
 */
export async function maybeGenerateCriticalCss(): Promise< void > {
	if ( hasGenerateRun ) {
		return;
	}

	return generateCriticalCss( get( criticalCssState ) );
}

/**
 * Generate Critical CSS for this site. Will load the Critical CSS Generator
 * library dynamically as needed.
 *
 * @param {boolean} reset              - If true, reset any stored CSS before beginning.
 * @param {boolean} isShowstopperRetry - Set this flag to indicate this attempt is retrying after a showstopper error.
 * @param           cssStatus
 */
export default async function generateCriticalCss(
	cssStatus: CriticalCssStatus
): Promise< void > {
	hasGenerateRun = true;
	const cancelling = false;

	try {
		// Abort early if css module deactivated or nothing needs doing
		if ( ! cssStatus || cssStatus.status !== 'pending' ) {
			return;
		}

		// Load Critical CSS gen library if not already loaded.
		await loadCriticalCssLibrary();

		// Prepare GET parameters to include with each request.
		const requestGetParameters = {
			'jb-generate-critical-css': cssStatus.generation_nonce,
		};

		logPreCriticalCSSGeneration();

		// @REFACTORING: Add Toast error handling if sources missing
		if ( cssStatus.providers.length > 0 ) {
			await generateForKeys(
				cssStatus.providers,
				requestGetParameters,
				cssStatus.viewports as Viewport[],
				cssStatus.callback_passthrough as JSONObject,
				cssStatus.proxy_nonce
			);
		}
	} catch ( err ) {
		// Swallow errors if cancelling the process.
		console.error( err );
		if ( ! cancelling ) {
			// Record thrown errors as Critical CSS status.
			storeGenerateError( err );
		}
	}
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
): Promise< void > {
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const startTime = Date.now();
	let totalSize = 0;
	let stepsPassed = 0;
	let stepsFailed = 0;
	let maxSize = 0;

	// Run through each set of URLs.
	for ( const { urls, success_ratio, label, key } of providers ) {
		try {
			const [ css, warnings ] = await CriticalCSSGenerator.generateCriticalCSS( {
				browserInterface: createBrowserInterface( requestGetParameters, proxyNonce ),
				urls,
				viewports,
				progressCallback: ( step: number, total: number ) => {
					localCriticalCSSProgress.set( step / total  );
				},
				filters: {
					atRules: keepAtRule,
					properties: keepProperty,
				},
				successRatio: success_ratio,
			} );

			const updateResult = await saveCriticalCssChunk( key, css, passthrough);

			const status = warnings.length > 0 ? 'error' : 'success';
			updateProvider( key, {
				status,
				errors: warnings,
			} );

			if ( updateResult === false ) {
				return;
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
				stopTheShow();

				// Track showstopper Critical CSS generation error.
				const eventProps = {
					time: Date.now() - startTime,
					provider_key: key,
					error_message: err.message,
					error_type: err.type || ( err.constructor && err.constructor.name ) || 'unknown',
				};
				recordBoostEvent( 'critical_css_failure', eventProps );
				return;
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
