export interface NumberFormatParams {
	/**
	 * Browser-safe locale string that works with Intl.NumberFormat e.g. 'en-US' (not 'en_US').
	 */
	browserSafeLocale: string;
	/**
	 * Number of decimal places to use.
	 * This is just convenience over setting `minimumFractionDigits`, `maximumFractionDigits` to the same value.
	 * ( default = 0 )
	 */
	decimals?: number;
	/**
	 * Whether to use latin numbers by default ( default = true ).
	 */
	forceLatin?: boolean;
	/**
	 * `Intl.NumberFormat` options to pass through.
	 * `minimumFractionDigits` & `maximumFractionDigits` will override `decimals` if set.
	 */
	numberFormatOptions?: Intl.NumberFormatOptions;
}

export interface CurrencyOverride {
	symbol?: string;
	/**
	 * Smallest-unit exponent for this currency, used when the browser's ICU
	 * `maximumFractionDigits` disagrees with the API's smallest-unit encoding,
	 * or when this package's hard-coded fallback exponent (see
	 * `SMALLEST_UNIT_EXPONENT_OVERRIDES` in `number-format-currency/index.ts`)
	 * disagrees with the host application's source of truth.
	 *
	 * For example, modern browser ICU (Chrome / Node 24+) reports IDR as
	 * 0-decimal, but this package's hard-coded fallback applies an exponent of
	 * 2 for legacy compatibility. The WPCOM currencies endpoint can send
	 * `{ "IDR": { "decimal": 0 } }` to override that hard-coded 2 back to 0.
	 */
	decimal?: number;
}

export interface NumberFormatCurrencyParams {
	/**
	 * Number to format.
	 */
	number: number;

	/**
	 * Browser-safe locale string that works with Intl.NumberFormat e.g. 'en-US' (not 'en_US').
	 */
	browserSafeLocale: string;

	/**
	 * Currency code.
	 */
	currency: string;

	/**
	 * Whether to use latin numbers by default ( default = true ).
	 */
	forceLatin?: boolean;

	/**
	 * The user's geo location if available.
	 */
	geoLocation?: string;

	/**
	 * Forces any decimal zeros to be hidden if set.
	 *
	 * For example, the function will normally format `10.00` in `USD` as
	 * `$10.00` but when this option is true, it will return `$10` instead.
	 *
	 * For currencies without decimals (eg: JPY), this has no effect.
	 */
	stripZeros?: boolean;

	/**
	 * Changes function to treat number as an integer in the currency's smallest unit.
	 *
	 * Since rounding errors are common in floating point math, sometimes a price
	 * is provided as an integer in the smallest unit of a currency (eg: cents in
	 * USD or yen in JPY). If this option is false, the function will format the
	 * amount `1025` in `USD` as `$1,025.00`, but when the option is true, it
	 * will return `$10.25` instead.
	 */
	isSmallestUnit?: boolean;

	/**
	 * If the number is greater than 0, setting this to true will include its
	 * sign (eg: `+$35.00`). Has no effect on negative numbers or 0.
	 */
	signForPositive?: boolean;

	/**
	 * Dynamic currency overrides, typically supplied by the host application
	 * (eg: from a remote endpoint) via `setCurrencyOverrides`.
	 *
	 * When provided, entries here take precedence over the hard-coded defaults
	 * baked into the package on a per-field basis. Anything not specified in
	 * this map falls back to the hard-coded defaults, so passing a partial map
	 * is safe.
	 */
	currencyOverrides?: Record< string, CurrencyOverride >;
}

export interface CurrencyObject {
	/**
	 * The negative sign for the price, if it is negative, or the positive sign
	 * if `signForPositive` is set.
	 */
	sign: '-' | '+' | '';

	/**
	 * The currency symbol for the formatted price.
	 *
	 * Note that the symbol's position depends on the `symbolPosition` property,
	 * and keep RTL locales in mind.
	 */
	symbol: string;

	/**
	 * The position of the currency symbol relative to the formatted price.
	 */
	symbolPosition: 'before' | 'after';

	/**
	 * The section of the formatted price before the decimal.
	 *
	 * Note that this is not a number, but a locale-formatted string which may
	 * include symbols like spaces, commas, or periods as group separators.
	 */
	integer: string;

	/**
	 * The section of the formatted price after and including the decimal.
	 *
	 * Note that this is not a number, but a locale-formatted string which may
	 * include symbols like spaces, commas, or periods as the decimal separator.
	 */
	fraction: string;

	/**
	 * True if the formatted number has a non-0 decimal part.
	 */
	hasNonZeroFraction: boolean;

	/**
	 * The raw floating-point version of the number prepared for formatting,
	 * after unit conversion and precision scaling.
	 *
	 * For non-decimal currencies (eg: JPY) this will actually be an integer.
	 * Otherwise it will likely be a floating-point number. Be careful with this!
	 * It should not be used for math if possible because of floating-point
	 * rounding issues! Use the smallest unit instead.
	 */
	floatValue: number;
}

export type FormatNumber = (
	number: number,
	options?: Omit< NumberFormatParams, 'browserSafeLocale' >
) => string;

export type FormatCurrency = (
	number: number,
	currency: string,
	options?: Omit<
		NumberFormatCurrencyParams,
		'number' | 'currency' | 'browserSafeLocale' | 'geoLocation' | 'currencyOverrides'
	>
) => string;

export type GetCurrencyObject = (
	number: number,
	currency: string,
	options?: Omit<
		NumberFormatCurrencyParams,
		'number' | 'currency' | 'browserSafeLocale' | 'geoLocation' | 'currencyOverrides'
	>
) => CurrencyObject;
