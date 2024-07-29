import { z } from 'zod';
import { CriticalCssErrorDetails, Provider } from './stores/critical-css-state-types';
import { recordBoostEvent, TracksEventProperties } from '$lib/utils/analytics';
import { castToNumber } from '$lib/utils/cast-to-number';
import { logPreCriticalCSSGeneration } from '$lib/utils/console';
import { isSameOrigin } from '$lib/utils/is-same-origin';
import { prepareAdminAjaxRequest } from '$lib/utils/make-admin-ajax-request';
import { standardizeError } from '$lib/utils/standardize-error';
import { SuccessTargetError } from 'jetpack-boost-critical-css-gen';

type Viewport = {
	width: number;
	height: number;
};

const CriticalCSSGeneratorSchema = z.object( {
	BrowserInterfaceIframe: z.function(),
	generateCriticalCSS: z.function(),
} );

const defaultViewports: Viewport[] = [
	{
		// Phone
		width: 414,
		height: 896,
	},
	{
		// Tablet
		width: 1200,
		height: 800,
	},
	{
		// Desktop
		width: 1920,
		height: 1080,
	},
];

interface ProviderCallbacks {
	setProviderCss: ( provider: string, css: string ) => Promise< unknown >;
	setProviderErrors: ( provider: string, error: CriticalCssErrorDetails[] ) => Promise< unknown >;
	setProviderProgress: ( progress: number ) => void;
}

interface GeneratorCallbacks extends ProviderCallbacks {
	onError: ( error: Error ) => void; // Called when the generator fails with a critical error.
	onFinished: () => void; // Called when the generator is finished, regardless of success or failure.
}

/**
 * Run the local Critical CSS Generator for a set of providers, if it is not already running.
 * The result of generation will not be returned to the caller; it will be sent to the given
 * Critical CSS state setter instead.
 *
 * @param {Provider[]} providers  - List of providers to generate for.
 * @param {string}     proxyNonce - Nonce to use when using Proxy API endpoint for fetching external stylesheets.
 * @param {Object}     callbacks  - Callbacks to use during generation.
 * @param {Viewport[]} viewports  - Viewports to use when generating Critical CSS.
 */
export function runLocalGenerator(
	providers: Provider[],
	proxyNonce: string,
	callbacks: GeneratorCallbacks,
	viewports: Viewport[] = defaultViewports
) {
	const abort = new AbortController();

	generateCriticalCss( providers, viewports, proxyNonce, callbacks, abort.signal )
		.catch( err => {
			callbacks.onError( standardizeError( err ) );
		} )
		.finally( () => {
			callbacks.onFinished();
		} );

	return abort;
}

/**
 * Generate Critical CSS for this site. Will load the Critical CSS Generator
 * library dynamically as needed.
 *
 * @param {Object[]}    providers  - List of providers to generate for.
 * @param {Viewport[]}  viewports  - Viewports to use when generating Critical CSS.
 * @param {string}      proxyNonce - Nonce to use when using Proxy API endpoint for fetching external stylesheets.
 * @param {Object}      callbacks  - Callbacks to use during generation.
 * @param {AbortSignal} signal     - Used to cancel the generation process.
 */
async function generateCriticalCss(
	providers: Provider[],
	viewports: Viewport[],
	proxyNonce: string,
	callbacks: ProviderCallbacks,
	signal: AbortSignal
) {
	try {
		// Prepare GET parameters to include with each request.
		const requestGetParameters = {
			'jb-generate-critical-css': Date.now().toString(),
		};

		if ( signal.aborted ) {
			return;
		}

		const pendingProviders = providers.filter( provider => provider.status === 'pending' );
		if ( ! pendingProviders.length ) {
			return;
		}

		logPreCriticalCSSGeneration();

		if ( pendingProviders.length > 0 ) {
			await generateForKeys(
				pendingProviders,
				viewports,
				requestGetParameters,
				proxyNonce,
				callbacks,
				signal
			);
		}
	} catch ( err ) {
		// Swallow errors if cancelling the process.
		if ( signal.aborted ) {
			// eslint-disable-next-line no-console
			console.error( err );
		} else {
			throw err;
		}
	}
}

/**
 * Helper method to prepare a Browser Interface for Critical CSS generation.
 *
 * @param {Object} requestGetParameters - GET parameters to include with each request.
 * @param {string} proxyNonce           - Nonce to use when proxying CSS requests.
 */
function createBrowserInterface(
	requestGetParameters: Record< string, string >,
	proxyNonce: string
) {
	return new ( class extends CriticalCSSGenerator.BrowserInterfaceIframe {
		constructor() {
			super( {
				requestGetParameters,
				verifyPage,
				allowScripts: false,
			} );
		}

		fetch( url: string, options: RequestInit, context?: string ) {
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

function isSuccessTargetError( err: unknown ): err is SuccessTargetError {
	return err instanceof Error && 'isSuccessTargetError' in err;
}

/**
 * Generate Critical CSS for the specified Provider Keys, sending each block
 * to the server. Throws on error or cancellation.
 *
 * @param {Object}      providers            - Set of URLs to use for each provider key
 * @param {Viewport[]}  viewports            - Viewports to use when generating Critical CSS.
 * @param {Object}      requestGetParameters - GET parameters to include with each request.
 * @param {string}      proxyNonce           - Nonce to use when proxying CSS requests.
 * @param {Object}      callbacks            - Callbacks to use during generation.
 * @param {AbortSignal} signal               - Used to cancel the generation process.
 */
async function generateForKeys(
	providers: Provider[],
	viewports: Viewport[],
	requestGetParameters: { [ key: string ]: string },
	proxyNonce: string,
	callbacks: ProviderCallbacks,
	signal: AbortSignal
): Promise< void > {
	try {
		CriticalCSSGeneratorSchema.parse( CriticalCSSGenerator );
	} catch ( err ) {
		recordBoostEvent( 'critical_css_library_failure', {} );
		throw new Error( 'css-gen-library-failure' );
	}

	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const startTime = Date.now();
	let totalSize = 0;
	let stepsPassed = 0;
	let stepsFailed = 0;
	let maxSize = 0;

	// Run through each set of URLs.
	for ( const { urls, success_ratio, key } of providers ) {
		if ( signal.aborted ) {
			return;
		}

		try {
			const [ css ] = await CriticalCSSGenerator.generateCriticalCSS( {
				browserInterface: createBrowserInterface( requestGetParameters, proxyNonce ),
				urls,
				viewports,
				progressCallback: ( step: number, total: number ) => {
					callbacks.setProviderProgress( step / total );
				},
				filters: {
					atRules: keepAtRule,
					properties: keepProperty,
				},
				successRatio: success_ratio,
				maxPages: 10,
			} );

			await callbacks.setProviderCss( key, css );
			totalSize += css.length;
			maxSize = css.length > maxSize ? css.length : maxSize;
			stepsPassed++;

			// Reset local progress whenever a provider is finished to prevent progress bar jank.
			callbacks.setProviderProgress( 0 );
		} catch ( err ) {
			// Success Target Errors indicate that URLs failed, but the process itself succeeded.
			if ( isSuccessTargetError( err ) ) {
				stepsFailed++;

				// Rearrange errors from CriticalCssGen from {url:details} to [{url:details:}].
				const errors = Object.entries( err.urlErrors ).map(
					( [ url, details ] ) =>
						( {
							url,
							...details,
						} ) as CriticalCssErrorDetails
				);

				await callbacks.setProviderErrors( key, errors );

				// Keep tracks events for CSS errors.
				for ( const [ url, error ] of Object.entries( errors ) ) {
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
				const stdError = standardizeError( err );
				const type =
					( 'type' in stdError && typeof stdError.type === 'string' && stdError.type ) || 'unknown';

				// Track showstopper Critical CSS generation error.
				const eventProps = {
					time: Date.now() - startTime,
					provider_key: key,
					error_message: stdError.message,
					error_type: type,
				};

				recordBoostEvent( 'critical_css_failure', eventProps );

				throw err;
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
