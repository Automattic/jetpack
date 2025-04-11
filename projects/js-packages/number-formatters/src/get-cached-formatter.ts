import debugFactory from 'debug';
import { FALLBACK_LOCALE } from './constants.ts';

const debug = debugFactory( 'number-formatters:get-cached-formatter' );

const formatterCache = new Map();

interface Params {
	locale: string;
	options?: Intl.NumberFormatOptions;
	fallbackLocale?: string;
	retries?: number;
}

/**
 * Get a cached formatter for a given locale and options.
 * @param  params                - The parameters for the formatter.
 * @param  params.locale         - The locale to format the number in.
 * @param  params.options        - Intl.NumberFormatOptions to pass to the formatter.
 * @param  params.fallbackLocale - The locale to fallback to if the locale is not supported.
 * @param  params.retries        - The number of retries to attempt if the formatter is not created.
 * @return {Intl.NumberFormat} A cached formatter for the given locale and options.
 */
export function getCachedFormatter( {
	locale,
	fallbackLocale = FALLBACK_LOCALE,
	options,
	retries = 1,
}: Params ): Intl.NumberFormat {
	const cacheKey = JSON.stringify( [ locale, options ] );

	try {
		return (
			formatterCache.get( cacheKey ) ??
			formatterCache.set( cacheKey, new Intl.NumberFormat( locale, options ) ).get( cacheKey )
		);
	} catch ( error ) {
		// If the locale is invalid, creating the NumberFormat will throw.
		debug(
			`Intl.NumberFormat was called with a non-existent locale "${ locale }"; falling back to ${ fallbackLocale }`
		);

		if ( retries ) {
			return getCachedFormatter( {
				locale: fallbackLocale,
				options,
				retries: retries - 1,
			} );
		}

		throw error;
	}
}
