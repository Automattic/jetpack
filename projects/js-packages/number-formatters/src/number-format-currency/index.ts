import debugFactory from 'debug';
import { FALLBACK_CURRENCY } from '../constants.ts';
import { getCachedFormatter } from '../get-cached-formatter.ts';
import { defaultCurrencyOverrides } from './currencies.ts';
import type { CurrencyOverride, CurrencyObject, NumberFormatCurrencyParams } from '../types.ts';

const debug = debugFactory( 'number-formatters:number-format-currency' );

/**
 * Retrieves the currency override for a given currency.
 * If the currency is USD and the user is not in the US, it will return `US$`.
 * @param  currency    - The currency to get the override for.
 * @param  geoLocation - The geo location of the user.
 * @return {CurrencyOverride | undefined} The currency override.
 */
function getCurrencyOverride(
	currency: string,
	geoLocation?: string
): CurrencyOverride | undefined {
	if ( currency === 'USD' && geoLocation && geoLocation !== '' && geoLocation !== 'US' ) {
		return { symbol: 'US$' };
	}
	return defaultCurrencyOverrides[ currency ];
}

/**
 * Returns a valid currency code based on a shortlist of currency codes.
 * Only currencies from the shortlist are allowed. Everything else will fall back to `FALLBACK_CURRENCY`.
 * @param  currency    - The currency to get the valid currency for.
 * @param  geoLocation - The geo location of the user.
 * @return {string} The valid currency.
 */
function getValidCurrency( currency: string, geoLocation?: string ): string {
	if ( ! getCurrencyOverride( currency, geoLocation ) ) {
		debug(
			`getValidCurrency was called with a non-existent currency "${ currency }"; falling back to ${ FALLBACK_CURRENCY }`
		);
		return FALLBACK_CURRENCY;
	}
	return currency;
}

/**
 * Returns a currency formatter for a given currency.
 * @param  params                   - The parameters for the currency formatter.
 * @param  params.number            - The number to format.
 * @param  params.currency          - The currency to format.
 * @param  params.browserSafeLocale - The browser safe locale.
 * @param  params.forceLatin        - Whether to force the latin locale.
 * @param  params.stripZeros        - Whether to strip zeros.
 * @param  params.signForPositive   - Whether to show the sign for positive numbers.
 * @return {Intl.NumberFormat} The currency formatter.
 */
function getCurrencyFormatter( {
	number,
	currency,
	browserSafeLocale,
	forceLatin = true,
	stripZeros,
	signForPositive,
}: NumberFormatCurrencyParams ): Intl.NumberFormat {
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
	const numberFormatOptions: Intl.NumberFormatOptions = {
		style: 'currency',
		currency,
		...( stripZeros &&
			Number.isInteger( number ) && {
				/**
				 * There's an option called `trailingZeroDisplay` but it does not yet work
				 * in FF so we have to strip zeros manually.
				 */
				maximumFractionDigits: 0,
				minimumFractionDigits: 0,
			} ),
		...( signForPositive && { signDisplay: 'exceptZero' } ),
	};
	return getCachedFormatter( {
		locale,
		options: numberFormatOptions,
	} );
}

/**
 * Returns the precision for a given locale and currency.
 * @param  browserSafeLocale - The browser safe locale.
 * @param  currency          - The currency to get the precision for.
 * @param  forceLatin        - Whether to force the latin locale.
 * @return {number | undefined} The precision.
 */
function getPrecisionForLocaleAndCurrency(
	browserSafeLocale: string,
	currency: string,
	forceLatin?: boolean
): number | undefined {
	const formatter = getCurrencyFormatter( { number: 0, currency, browserSafeLocale, forceLatin } );
	/**
	 * For regular numbers, the default is 3 if neither `minimumFractionDigits` or `maximumFractionDigits` are set,
	 * otherwise the greatest betweem `minimumFractionDigits` and 3.
	 *
	 * For currencies, the default is dependent on the currency.
	 *
	 * This may also result in undefined, for several reasons:
	 * see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#significantdigitsfractiondigits_default_values
	 */
	return formatter.resolvedOptions().maximumFractionDigits;
}

/**
 * Scales a number to a specified precision and rounds it to that precision.
 * It ensures that all currency values are consistently rounded to the desired precision,
 * avoiding issues with floating-point arithmetic.
 * @param  number            - The number to scale.
 * @param  currencyPrecision - The precision to scale the number to.
 * @return {number} The scaled number.
 */
function scaleNumberForPrecision( number: number, currencyPrecision: number ): number {
	const scale = Math.pow( 10, currencyPrecision );
	return Math.round( number * scale ) / scale;
}

/**
 * Prepares a number for formatting.
 * @param  number            - The number to prepare.
 * @param  currencyPrecision - The precision to prepare the number for.
 * @param  isSmallestUnit    - Whether the number is the smallest unit of a currency.
 * @return {number} The prepared number.
 */
function prepareNumberForFormatting(
	number: number,
	// currencyPrecision here must be the precision of the currency, regardless
	// of what precision is requested for display!
	currencyPrecision: number,
	isSmallestUnit?: boolean
): number {
	if ( isNaN( number ) ) {
		debug( 'formatCurrency was called with NaN' );
		return 0;
	}

	if ( isSmallestUnit ) {
		if ( ! Number.isInteger( number ) ) {
			debug(
				'formatCurrency was called with isSmallestUnit and a float which will be rounded',
				number
			);
		}
		const smallestUnitDivisor = 10 ** currencyPrecision;
		return scaleNumberForPrecision( Math.round( number ) / smallestUnitDivisor, currencyPrecision );
	}

	return scaleNumberForPrecision( number, currencyPrecision );
}

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
 *
 * @param  params                   - The parameters for the currency formatter.
 * @param  params.number            - The number to format.
 * @param  params.browserSafeLocale - The browser safe locale.
 * @param  params.currency          - The currency to format.
 * @param  params.stripZeros        - Whether to strip zeros.
 * @param  params.isSmallestUnit    - Whether the number is the smallest unit of a currency.
 * @param  params.signForPositive   - Whether to show the sign for positive numbers.
 * @param  params.geoLocation       - The geo location of the user.
 * @param  params.forceLatin        - Whether to force the latin locale.
 * @return {string} A formatted string.
 */
const numberFormatCurrency = ( {
	number,
	browserSafeLocale,
	currency,
	stripZeros,
	isSmallestUnit,
	signForPositive,
	geoLocation,
	forceLatin,
}: NumberFormatCurrencyParams ) => {
	const validCurrency = getValidCurrency( currency, geoLocation );
	const currencyOverride = getCurrencyOverride( validCurrency, geoLocation );
	const currencyPrecision = getPrecisionForLocaleAndCurrency(
		browserSafeLocale,
		validCurrency,
		forceLatin
	);

	if ( isSmallestUnit && typeof currencyPrecision === 'undefined' ) {
		throw new Error(
			`Could not determine currency precision for ${ validCurrency } in ${ browserSafeLocale }`
		);
	}

	const numberAsFloat = prepareNumberForFormatting(
		number,
		currencyPrecision ?? 0,
		isSmallestUnit
	);
	const formatter = getCurrencyFormatter( {
		number: numberAsFloat,
		currency: validCurrency,
		browserSafeLocale,
		forceLatin,
		stripZeros,
		signForPositive,
	} );
	const parts = formatter.formatToParts( numberAsFloat );

	return parts.reduce( ( formatted, part ) => {
		switch ( part.type ) {
			case 'currency':
				if ( currencyOverride?.symbol ) {
					return formatted + currencyOverride.symbol;
				}
				return formatted + part.value;
			default:
				return formatted + part.value;
		}
	}, '' );
};

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
 *
 * @param  params                   - The parameters for the currency formatter.
 * @param  params.number            - The number to format.
 * @param  params.browserSafeLocale - The browser safe locale.
 * @param  params.currency          - The currency to format.
 * @param  params.stripZeros        - Whether to strip zeros.
 * @param  params.isSmallestUnit    - Whether the number is the smallest unit of a currency.
 * @param  params.signForPositive   - Whether to show the sign for positive numbers.
 * @param  params.geoLocation       - The geo location of the user.
 * @param  params.forceLatin        - Whether to force the latin locale.
 * @return {CurrencyObject} A formatted string e.g. { symbol:'$', integer: '$99', fraction: '.99', sign: '-' }
 */
const getCurrencyObject = ( {
	number,
	browserSafeLocale,
	currency,
	stripZeros,
	isSmallestUnit,
	signForPositive,
	geoLocation,
	forceLatin,
}: NumberFormatCurrencyParams ): CurrencyObject => {
	const validCurrency = getValidCurrency( currency, geoLocation );
	const currencyOverride = getCurrencyOverride( validCurrency, geoLocation );
	const currencyPrecision = getPrecisionForLocaleAndCurrency(
		browserSafeLocale,
		validCurrency,
		forceLatin
	);
	const numberAsFloat = prepareNumberForFormatting(
		number,
		currencyPrecision ?? 0,
		isSmallestUnit
	);
	const formatter = getCurrencyFormatter( {
		number: numberAsFloat,
		currency: validCurrency,
		browserSafeLocale,
		forceLatin,
		stripZeros,
		signForPositive,
	} );
	const parts = formatter.formatToParts( numberAsFloat );

	let sign = '' as CurrencyObject[ 'sign' ];
	let symbol = '$';
	let symbolPosition = 'before' as CurrencyObject[ 'symbolPosition' ];
	let hasAmountBeenSet = false;
	let hasDecimalBeenSet = false;
	let integer = '';
	let fraction = '';

	parts.forEach( part => {
		switch ( part.type ) {
			case 'currency':
				symbol = currencyOverride?.symbol ?? part.value;
				if ( hasAmountBeenSet ) {
					symbolPosition = 'after';
				}
				return;
			case 'group':
				integer += part.value;
				hasAmountBeenSet = true;
				return;
			case 'decimal':
				fraction += part.value;
				hasAmountBeenSet = true;
				hasDecimalBeenSet = true;
				return;
			case 'integer':
				integer += part.value;
				hasAmountBeenSet = true;
				return;
			case 'fraction':
				fraction += part.value;
				hasAmountBeenSet = true;
				hasDecimalBeenSet = true;
				return;
			case 'minusSign':
				sign = '-' as CurrencyObject[ 'sign' ];
				return;
			case 'plusSign':
				sign = '+' as CurrencyObject[ 'sign' ];
		}
	} );

	const hasNonZeroFraction = ! Number.isInteger( numberAsFloat ) && hasDecimalBeenSet;

	return {
		sign,
		symbol,
		symbolPosition,
		integer,
		fraction,
		hasNonZeroFraction,
	};
};

export { numberFormatCurrency, getCurrencyObject };
