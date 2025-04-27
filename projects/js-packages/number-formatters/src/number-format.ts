import { getCachedFormatter } from './get-cached-formatter.ts';
import type { NumberFormatParams } from './types.ts';

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
	/**
	 * `numberingSystem` is an option to `Intl.NumberFormat` and is available
	 * in all major browsers according to
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options
	 * but is not part of the TypeScript types in `es2020`:
	 *
	 * https://github.com/microsoft/TypeScript/blob/cfd472f7aa5a2010a3115263bf457b30c5b489f3/src/lib/es2020.intl.d.ts#L272
	 *
	 * However, it is part of the TypeScript types in `es5`:
	 *
	 * https://github.com/microsoft/TypeScript/blob/cfd472f7aa5a2010a3115263bf457b30c5b489f3/src/lib/es5.d.ts#L4310
	 *
	 * Apparently calypso uses `es2020` so we cannot use that option here right
	 * now. Instead, we will use the unicode extension to the locale, documented
	 * here:
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/numberingSystem#adding_a_numbering_system_via_the_locale_string
	 */
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
