import { getCachedFormatter } from './get-cached-formatter.js';
import type { NumberFormatParams } from '../types/index.js';

/**
 * Formats numbers using locale settings and/or passed options.
 * @param  params                     - The parameters for the number formatter.
 * @param  params.browserSafeLocale   - The browser safe locale.
 * @param  params.decimals            - The number of decimal places to use.
 * @param  params.forceLatin          - Whether to force the latin locale.
 * @param  params.numberFormatOptions - The options for the number formatter.
 * @return {Intl.NumberFormat} The number formatter.
 */
const numberFormat = ( {
	browserSafeLocale,
	decimals = 0,
	forceLatin = true,
	numberFormatOptions = {},
}: NumberFormatParams ): Intl.NumberFormat => {
	const locale = `${ browserSafeLocale }${ forceLatin ? '-u-nu-latn' : '' }`;
	const options = {
		minimumFractionDigits: decimals, // minimumFractionDigits default is 0
		maximumFractionDigits: decimals, // maximumFractionDigits default is the greater between minimumFractionDigits and 3
		...numberFormatOptions,
	};

	return getCachedFormatter( { locale, options } );
};

/**
 * Convenience method for formatting numbers in a compact notation e.g. 1K, 1M, etc.
 * Basically sets `notation: 'compact'` and `maximumFractionDigits: 1` in the options.
 * Everything is overridable by passing the `numberFormatOptions` option.
 * If you want more digits, pass `maximumFractionDigits: 2`.
 * @param  params                     - The parameters for the number formatter.
 * @param  params.numberFormatOptions - The options for the number formatter.
 * @return {Intl.NumberFormat} The number formatter.
 */
const numberFormatCompact: typeof numberFormat = ( { numberFormatOptions = {}, ...params } ) =>
	numberFormat( {
		...params,
		numberFormatOptions: {
			notation: 'compact',
			maximumFractionDigits: 1,
			...numberFormatOptions,
		},
	} );

export { numberFormat, numberFormatCompact };
