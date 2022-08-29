import { __ } from '@wordpress/i18n';
import { clearDismissedRecommendations } from '../stores/critical-css-recommendations';
import {
	requestGeneration,
	sendGenerationResult,
	storeGenerateError,
	updateGenerateStatus,
} from '../stores/critical-css-status';
import { modules, isEnabled } from '../stores/modules';
import { recordBoostEvent } from './analytics';
import { castToNumber } from './cast-to-number';
import { logPreCriticalCSSGeneration } from './console';
import { isSameOrigin } from './is-same-origin';
import { loadCriticalCssLibrary } from './load-critical-css-library';
import { prepareAdminAjaxRequest } from './make-admin-ajax-request';
import { removeShownAdminNotices } from './remove-admin-notices';
import type { JSONObject } from './json-types';
import type { Viewport } from './types';

export type ProviderKeyUrls = {
	[ providerKey: string ]: string[];
};

export type ProvidersSuccessRatio = {
	[ providerKey: string ]: number;
};

export type MajorMinorCallback = (
	majorSteps: number,
	majorStep: number,
	minorSteps: number,
	minorStep: number
) => void;

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

	return generateCriticalCss( false );
}

/**
 * Generate Critical CSS for this site. Will load the Critical CSS Generator
 * library dynamically as needed.
 *
 * @param {boolean} reset              - If true, reset any stored CSS before beginning.
 * @param {boolean} isShowstopperRetry - Set this flag to indicate this attempt is retrying after a showstopper error.
 */
export default async function generateCriticalCss(
	reset = true,
	isShowstopperRetry = false
): Promise< void > {
	hasGenerateRun = true;
	let cancelling = false;

	try {
		if ( reset ) {
			await clearDismissedRecommendations();
			updateGenerateStatus( { status: 'requesting', progress: 0 } );
		}

		// Fetch a list of provider keys and URLs while loading the Critical CSS lib.
		const cssStatus = await requestGeneration( reset, isShowstopperRetry );

		// Abort early if css module deactivated or nothing needs doing
		if ( ! cssStatus || cssStatus.status !== 'requesting' ) {
			return;
		}

		removeShownAdminNotices( 'critical-css' );

		updateGenerateStatus( { status: 'requesting', progress: 0 } );

		// Load Critical CSS gen library if not already loaded.
		await loadCriticalCssLibrary();

		// Prepare a wrapped callback to gather major/minor steps and convert to
		// percent. Also check for module deactivation and cancel if need be.
		const offset = cssStatus.success_count || 0;
		const wrappedCallback = wrapCallback( offset, percent => {
			if ( ! isEnabled( 'critical-css' ) ) {
				cancelling = true;
				throw new Error( __( 'Operation cancelled', 'jetpack-boost' ) );
			}

			updateGenerateStatus( { status: 'requesting', progress: percent } );
		} );

		// Prepare GET parameters to include with each request.
		const requestGetParameters = {
			'jb-generate-critical-css': cssStatus.generation_nonce,
		};

		// Run generator on each configuration.
		updateGenerateStatus( { status: 'requesting', progress: 0 } );
		logPreCriticalCSSGeneration();
		await generateForKeys(
			cssStatus.pending_provider_keys,
			requestGetParameters,
			cssStatus.viewports,
			cssStatus.callback_passthrough,
			wrappedCallback,
			cssStatus.provider_success_ratio,
			cssStatus.proxy_nonce
		);
	} catch ( err ) {
		// Swallow errors if cancelling the process.
		if ( ! cancelling ) {
			// Record thrown errors as Critical CSS status.
			storeGenerateError( err );
		}
	} finally {
		// Always update generate status to not generating at the end.
		updateGenerateStatus( { status: 'success', progress: 0 } );
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
 * @param {ProviderKeyUrls}    providerKeys         - Set of URLs to use for each provider key
 * @param {Object}             requestGetParameters - GET parameters to include with each request.
 * @param {Viewport[]}         viewports            - Viewports to generate with.
 * @param {JSONObject}         passthrough          - JSON data to include in callbacks to API.
 * @param {MajorMinorCallback} callback             - Callback to send minor / major progress step info to.
 * @param {Array}              successRatios        - Success ratios.
 * @param {string}             proxyNonce           - Nonce to use when proxying CSS requests.
 */
async function generateForKeys(
	providerKeys: ProviderKeyUrls,
	requestGetParameters: { [ key: string ]: string },
	viewports: Viewport[],
	passthrough: JSONObject,
	callback: MajorMinorCallback,
	successRatios: ProvidersSuccessRatio,
	proxyNonce: string
): Promise< void > {
	const majorSteps = Object.keys( providerKeys ).length + 1;
	let majorStep = 0;

	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const startTime = Date.now();
	let totalSize = 0;
	let stepsPassed = 0;
	let stepsFailed = 0;
	let maxSize = 0;

	// Run through each set of URLs.
	for ( const [ providerKey, urls ] of Object.entries( providerKeys ) ) {
		callback( ++majorStep, majorSteps, 0, 0 );
		try {
			const [ css, warnings ] = await CriticalCSSGenerator.generateCriticalCSS( {
				browserInterface: createBrowserInterface( requestGetParameters, proxyNonce ),
				urls,
				viewports,
				progressCallback: ( step: number, stepCount: number ) => {
					callback( majorStep, majorSteps, step, stepCount );
				},
				filters: {
					atRules: keepAtRule,
					properties: keepProperty,
				},
				successRatio: successRatios[ providerKey ],
			} );

			const updateResult = await sendGenerationResult( providerKey, 'success', {
				data: css,
				warnings: warnings.map( x => x.toString() ),
				passthrough,
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
				await sendGenerationResult( providerKey, 'error', {
					data: {
						show_stopper: false,
						provider_key: providerKey,
						urls: err.urlErrors,
					},
					passthrough,
				} );

				stepsFailed++;
				const urlError = err.urlErrors as {
					[ url: string ]: {
						message: string;
						type: string;
						meta: JSONObject;
					};
				};

				for ( const [ url, error ] of Object.entries( urlError ) ) {
					// Track individual Critical CSS generation error.
					const eventProps: TracksEventProperties = {
						url,
						provider_key: providerKey,
						error_message: error.message,
						error_type: error.type,
					};
					if ( error.type === 'HttpError' ) {
						eventProps.error_meta = castToNumber( error.meta.code );
					}
					recordBoostEvent( 'critical_css_url_error', eventProps );
				}
			} else {
				await sendGenerationResult( providerKey, 'error', {
					data: {
						show_stopper: true,
						error: err.message,
					},
					passthrough,
				} );

				// Track showstopper Critical CSS generation error.
				const eventProps = {
					time: Date.now() - startTime,
					provider_key: providerKey,
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
			provider_keys: Object.keys( providerKeys ).join( ',' ),
		};
		recordBoostEvent( 'critical_css_success', eventProps );
	}

	updateGenerateStatus( { status: 'success', progress: 0 } );
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
 * Helper for tracking multiple "levels" of progress; minor and major. Calls the
 * supplied callback with major / minor step information converted to a raw
 * percentage. Also takes an offset for major steps, to represent progress that
 * may have already passed before counting here.
 *
 * @param {number}                    offset Major steps to assume have already passed.
 * @param {(percent: number) => void} cb     Callback to call with progress.
 * @return {Function} Function to call with full progress details.
 */
function wrapCallback( offset: number, cb: ( percent: number ) => void ): MajorMinorCallback {
	return ( majorStep, majorSteps, minorStep, minorSteps ) => {
		const stepSize = 100 / Math.max( 1, majorSteps + offset );
		const minorProgress = minorStep / Math.max( 1, minorSteps );

		cb( ( majorStep + offset + minorProgress ) * stepSize );
	};
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
