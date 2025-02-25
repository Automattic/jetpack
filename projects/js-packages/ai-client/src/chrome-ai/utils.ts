/**
 * External dependencies
 */
import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack:ai-client:chrome-ai' );

let isSummarizerDisabled = false;

/**
 * Check for the feature flag.
 *
 * @return boolean
 */
export function shouldUseChromeAI() {
	return getJetpackExtensionAvailability( 'ai-use-chrome-ai-sometimes' ).available === true;
}

/**
 * Check if translation is available.
 *
 * @return boolean
 */
export function isTranslationAvailable() {
	const isAvailable =
		'translation' in self &&
		'createTranslator' in self.translation &&
		'canTranslate' in self.translation;

	if ( ! isAvailable ) {
		debug( 'Translation is not available' );
	}

	return isAvailable;
}

/**
 * Check if language detector is available.
 *
 * @return boolean
 */
export function isLanguageDetectorAvailable() {
	const isAvailable =
		'ai' in self && 'languageDetector' in self.ai && 'create' in self.ai.languageDetector;

	if ( ! isAvailable ) {
		debug( 'Language detector is not available' );
	}

	return isAvailable;
}

/**
 * Check if summarizer is available.
 *
 * @return boolean
 */
export function isSummarizerAvailable() {
	const isAvailable =
		'ai' in self &&
		'summarizer' in self.ai &&
		'create' in self.ai.summarizer &&
		! isSummarizerDisabled;

	if ( ! isAvailable ) {
		debug( 'Summarizer is not available' );
	}

	return isAvailable;
}

/**
 * Call a function with a cancelation timeout.
 *
 * @param fn      - The function to call.
 * @param timeout - The timeout in milliseconds.
 * @return Promise that resolves with the same type as fn, or rejects with Error
 */
export function callWithTimeout< T >(
	fn: ( ...args: unknown[] ) => Promise< T >,
	timeout: number
): Promise< T > {
	return new Promise( ( resolve, reject ) => {
		const timeoutId = setTimeout( () => {
			reject( new Error( 'Timeout' ) );
		}, timeout );

		fn()
			.then( resolve )
			.catch( reject )
			.finally( () => clearTimeout( timeoutId ) );
	} );
}

/**
 * Disable the summarizer.
 */
export function disableSummarizer() {
	isSummarizerDisabled = true;
	debug( 'Summarizer is disabled due to timeout' );
}
