/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	requestGeneration,
	sendGenerationResult,
	storeGenerateError,
	updateGenerateStatus,
} from '../stores/critical-css-status';
import type { JSONObject } from './json-types';
import type { Viewport } from './types';
import { isEnabled } from '../stores/modules';
import { loadCriticalCssLibrary } from './load-critical-css-library';
import { removeShownAdminNotices } from './remove-admin-notices';
import { clearDismissedRecommendations } from '../stores/critical-css-recommendations';

export type ProviderKeyUrls = {
	[ providerKey: string ]: string[];
};

export type ProvidersSuccessRatio = {
	[ providerKey: string ]: Number;
};

export type MajorMinorCallback = (
	majorSteps: number,
	majorStep: number,
	minorSteps: number,
	minorStep: number
) => void;

let hasGenerateRun = false;

/**
 * Call generateCriticalCss if it hasn't been called before this app execution
 * (browser pageload), to verify if Critical CSS needs to be generated.
 */
export async function maybeGenerateCriticalCss() {
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
	reset: boolean = true,
	isShowstopperRetry: boolean = false
): Promise< void > {
	hasGenerateRun = true;
	let cancelling = false;

	if ( reset ) {
		clearDismissedRecommendations();
		updateGenerateStatus( true, 0 );
	}

	try {
		// Fetch a list of provider keys and URLs while loading the Critical CSS lib.
		const cssStatus = await requestGeneration( reset, isShowstopperRetry );

		// Abort early if css module deactivated or nothing needs doing
		if ( ! cssStatus || cssStatus.status !== 'requesting' ) {
			return;
		}

		removeShownAdminNotices( 'critical-css' );

		updateGenerateStatus( true, 0 );

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

			updateGenerateStatus( true, percent );
		} );

		// Prepare GET parameters to include with each request.
		const requestGetParameters = {
			'jb-generate-critical-css': cssStatus.generation_nonce,
		};

		// Run generator on each configuration.
		updateGenerateStatus( true, 0 );
		await generateForKeys(
			cssStatus.pending_provider_keys,
			requestGetParameters,
			cssStatus.viewports,
			cssStatus.callback_passthrough,
			wrappedCallback,
			cssStatus.provider_success_ratio
		);
	} catch ( err ) {
		// Swallow errors if cancelling the process.
		if ( ! cancelling ) {
			// Record thrown errors as Critical CSS status.
			await storeGenerateError( err );
		}
	} finally {
		// Always update generate status to not generating at the end.
		updateGenerateStatus( false, 0 );
	}
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
 */
async function generateForKeys(
	providerKeys: ProviderKeyUrls,
	requestGetParameters: { [ key: string ]: string },
	viewports: Viewport[],
	passthrough: JSONObject,
	callback: MajorMinorCallback,
	successRatios: ProvidersSuccessRatio
): Promise< void > {
	const majorSteps = Object.keys( providerKeys ).length + 1;
	let majorStep = 0;

	// Run through each set of URLs.
	for ( const [ providerKey, urls ] of Object.entries( providerKeys ) ) {
		callback( ++majorStep, majorSteps, 0, 0 );
		try {
			const [ css, warnings ] = await CriticalCSSGenerator.generateCriticalCSS( {
				browserInterface: new CriticalCSSGenerator.BrowserInterfaceIframe( {
					requestGetParameters,
					verifyPage,
					allowScripts: false,
				} ),
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
			} else {
				await sendGenerationResult( providerKey, 'error', {
					data: {
						show_stopper: true,
						error: err.message,
					},
					passthrough,
				} );

				return;
			}
		}
	}

	await updateGenerateStatus( false, 0 );
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
 *
 * @param {string} name  Name of the property to evaluate
 * @param {string} value Value of the property to evaluate
 * @return {boolean} indicating whether or not the property is wanted.
 */
function keepProperty( name: string, value: string ): boolean {
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

function verifyPage( url: string, innerWindow: Window, innerDocument: Document ): boolean {
	return !! innerDocument.querySelector( 'meta[name="jb-generate-critical-css"]' );
}
