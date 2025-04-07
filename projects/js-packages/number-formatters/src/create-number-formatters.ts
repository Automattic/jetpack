import { getSettings } from '@wordpress/date';
import { FALLBACK_LOCALE } from './constants.js';
import {
	numberFormatCurrency,
	getCurrencyObject as getCurrencyObjectFromCurrencyFormatter,
} from './number-format-currency/index.js';
import { numberFormat, numberFormatCompact } from './number-format.js';
import type { CurrencyObject, FormatCurrency, FormatNumber, GetCurrencyObject } from './types.js';

// Since global is used inside createNumberFormatters, we need to declare it for TS
declare const global: typeof globalThis;

export interface NumberFormatters {
	/**
	 * Sets the locale for number formatting
	 * @param locale - The locale to use for formatting
	 */
	setLocale( locale: string ): void;

	/**
	 * Sets the user's geo location for currency formatting if available
	 * @param geoLocation - The geo location to use for formatting
	 */
	setGeoLocation( geoLocation: string ): void;

	/**
	 * Formats numbers using locale settings and/or passed options.
	 * @param  number                     - The number to format.
	 * @param  params                     - The parameters for the formatter.
	 * @param  params.decimals            - The number of decimal places to display.
	 * @param  params.forceLatin          - Whether to force the Latin script.
	 * @param  params.numberFormatOptions - Additional options to pass to the formatter.
	 * @return {string} Formatted number as string, or original number as string if formatting fails.
	 */
	formatNumber: FormatNumber;

	/**
	 * Formats numbers using locale settings and/or passed options, with a compact notation.
	 * Convenience method for formatting numbers in a compact notation e.g. 1K, 1M, etc.
	 * Basically sets `notation: 'compact'` and `maximumFractionDigits: 1` in the options.
	 * Everything is overridable by passing the `numberFormatOptions` option.
	 * If you want more digits, pass `maximumFractionDigits: 2`.
	 * @param  number                     - The number to format.
	 * @param  params                     - The parameters for the formatter.
	 * @param  params.decimals            - The number of decimal places to display.
	 * @param  params.forceLatin          - Whether to force the Latin script.
	 * @param  params.numberFormatOptions - Additional options to pass to the formatter.
	 * @return {string} Formatted number as string, or original number as string if formatting fails.
	 */
	formatNumberCompact: FormatNumber;

	/**
	 * Formats money with a given currency code.
	 *
	 * The currency will define the properties to use for this formatting, but
	 * those properties can be overridden using the options. Be careful when doing
	 * this.
	 *
	 * For currencies that include decimals, this will always return the amount
	 * with decimals included, even if those decimals are zeros. To exclude the
	 * zeros, use the `stripZeros` option. For example, the function will normally
	 * format `10.00` in `USD` as `$10.00` but when this option is true, it will
	 * return `$10` instead.
	 *
	 * Since rounding errors are common in floating point math, sometimes a price
	 * is provided as an integer in the smallest unit of a currency (eg: cents in
	 * USD or yen in JPY). Set the `isSmallestUnit` to change the function to
	 * operate on integer numbers instead. If this option is not set or false, the
	 * function will format the amount `1025` in `USD` as `$1,025.00`, but when the
	 * option is true, it will return `$10.25` instead.
	 *
	 * If the number is NaN, it will be treated as 0.
	 *
	 * If the currency code is not known, this will assume a default currency
	 * similar to USD.
	 *
	 * If `isSmallestUnit` is set and the number is not an integer, it will be
	 * rounded to an integer.
	 * @param  number                  - The number to format.
	 * @param  currency                - The currency to format.
	 * @param  options                 - The options for the formatter.
	 * @param  options.stripZeros      - Whether to strip zeros.
	 * @param  options.isSmallestUnit  - Whether the number is the smallest unit of a currency.
	 * @param  options.signForPositive - Whether to show the sign for positive numbers.
	 * @param  options.forceLatin      - Whether to force the latin locale.
	 * @return {string} A formatted string.
	 */
	formatCurrency: FormatCurrency;

	/**
	 * Returns a formatted price object which can be used to manually render a
	 * formatted currency (eg: if you wanted to render the currency symbol in a
	 * different font size).
	 *
	 * The currency will define the properties to use for this formatting, but
	 * those properties can be overridden using the options. Be careful when doing
	 * this.
	 *
	 * For currencies that include decimals, this will always return the amount
	 * with decimals included, even if those decimals are zeros. To exclude the
	 * zeros, use the `stripZeros` option. For example, the function will normally
	 * format `10.00` in `USD` as `$10.00` but when this option is true, it will
	 * return `$10` instead.
	 *
	 * Since rounding errors are common in floating point math, sometimes a price
	 * is provided as an integer in the smallest unit of a currency (eg: cents in
	 * USD or yen in JPY). Set the `isSmallestUnit` to change the function to
	 * operate on integer numbers instead. If this option is not set or false, the
	 * function will format the amount `1025` in `USD` as `$1,025.00`, but when the
	 * option is true, it will return `$10.25` instead.
	 *
	 * Note that the `integer` return value of this function is not a number, but a
	 * locale-formatted string which may include symbols like spaces, commas, or
	 * periods as group separators. Similarly, the `fraction` property is a string
	 * that contains the decimal separator.
	 *
	 * If the number is NaN, it will be treated as 0.
	 *
	 * If the currency code is not known, this will assume a default currency
	 * similar to USD.
	 *
	 * If `isSmallestUnit` is set and the number is not an integer, it will be
	 * rounded to an integer.
	 * @param  number                  - The number to format.
	 * @param  currency                - The currency to format.
	 * @param  options                 - The options for the formatter.
	 * @param  options.stripZeros      - Whether to strip zeros.
	 * @param  options.isSmallestUnit  - Whether the number is the smallest unit of a currency.
	 * @param  options.signForPositive - Whether to show the sign for positive numbers.
	 * @param  options.forceLatin      - Whether to force the latin locale.
	 * @return {CurrencyObject} A formatted price object.
	 */
	getCurrencyObject: GetCurrencyObject;
}

/**
 * Creates a NumberFormatters instance that provides number and currency formatting functionality with locale awareness
 * @return {NumberFormatters} A NumberFormatters instance
 */
function createNumberFormatters(): NumberFormatters {
	let localeState: string | undefined;
	let geoLocationState: string | undefined;

	const setLocale = ( locale: string ): void => {
		/**
		 * The `Intl.NumberFormat` constructor fails only when there is a variant, divided by `_`.
		 * These suffixes should be removed. Values like `de-at` or `es-mx`
		 * should all be valid inputs for the constructor.
		 */
		localeState = locale;
	};

	/**
	 * Returns the locale defined on the module instance (through `setLocale`)
	 * or the "fallback locale" if no locale has been set.
	 *
	 * The "fallback locale" is defined as:
	 * - the current WP user locale, if available through `@wordpress/date` settings (assuming this runs in a WordPress context)
	 * - or the browser locale, if available through `window.navigator.language`
	 * - or the fallback locale constant (`FALLBACK_LOCALE`)
	 *
	 * @return {string} The locale to use for formatting.
	 */
	const getBrowserSafeLocale = (): string => {
		const {
			l10n: { locale: localeFromUserSettings },
		} = getSettings();

		return (
			localeState ??
			( localeFromUserSettings || global?.window?.navigator?.language ) ??
			FALLBACK_LOCALE
		).split( '_' )[ 0 ];
	};

	const setGeoLocation = ( geoLocation: string ): void => {
		geoLocationState = geoLocation;
	};

	const formatNumber: FormatNumber = (
		number,
		{ decimals = 0, forceLatin = true, numberFormatOptions = {} } = {}
	): string => {
		try {
			const formatter = numberFormat( {
				browserSafeLocale: getBrowserSafeLocale(),
				decimals,
				forceLatin,
				numberFormatOptions,
			} );

			return formatter.format( number );
		} catch {
			return String( number );
		}
	};

	const formatNumberCompact: FormatNumber = (
		number,
		{ decimals = 0, forceLatin = true, numberFormatOptions = {} } = {}
	): string => {
		try {
			const formatter = numberFormatCompact( {
				browserSafeLocale: getBrowserSafeLocale(),
				decimals,
				forceLatin,
				numberFormatOptions,
			} );

			return formatter.format( number );
		} catch {
			return String( number );
		}
	};

	const formatCurrency: FormatCurrency = (
		number,
		currency,
		{ stripZeros = false, isSmallestUnit = false, signForPositive = false, forceLatin = true } = {}
	): string => {
		return numberFormatCurrency( {
			number,
			currency,
			browserSafeLocale: getBrowserSafeLocale(),
			stripZeros,
			isSmallestUnit,
			signForPositive,
			geoLocation: geoLocationState,
			forceLatin,
		} );
	};

	const getCurrencyObject: GetCurrencyObject = (
		number,
		currency,
		{ stripZeros = false, isSmallestUnit = false, signForPositive = false, forceLatin = true } = {}
	): CurrencyObject => {
		return getCurrencyObjectFromCurrencyFormatter( {
			number,
			currency,
			browserSafeLocale: getBrowserSafeLocale(),
			stripZeros,
			isSmallestUnit,
			signForPositive,
			geoLocation: geoLocationState,
			forceLatin,
		} );
	};

	return {
		setLocale,
		setGeoLocation,
		formatNumber,
		formatNumberCompact,
		formatCurrency,
		getCurrencyObject,
	};
}

export default createNumberFormatters;
