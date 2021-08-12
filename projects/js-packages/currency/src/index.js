/**
 * External dependencies
 */
import { createElement } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { sprintf } from '@wordpress/i18n';
import { numberFormat } from '@woocommerce/number';
import deprecated from '@wordpress/deprecated';

const CurrencyFactory = function ( currencySetting ) {
	let currency;

	setCurrency( currencySetting );

	function setCurrency( setting ) {
		const defaultCurrency = {
			code: 'USD',
			symbol: '$',
			symbolPosition: 'left',
			thousandSeparator: ',',
			decimalSeparator: '.',
			precision: 2,
		};
		const config = { ...defaultCurrency, ...setting };
		currency = {
			code: config.code.toString(),
			symbol: config.symbol.toString(),
			symbolPosition: config.symbolPosition.toString(),
			decimalSeparator: config.decimalSeparator.toString(),
			priceFormat: getPriceFormat( config ),
			thousandSeparator: config.thousandSeparator.toString(),
			precision: parseInt( config.precision, 10 ),
		};
	}

	function stripTags( str ) {
		const tmp = document.createElement( 'DIV' );
		tmp.innerHTML = str;
		return tmp.textContent || tmp.innerText || '';
	}

	/**
	 * Formats money value.
	 *
	 * @param   {number|string} number number to format
	 * @return {?string} A formatted string.
	 */
	function formatAmount( number ) {
		const formattedNumber = numberFormat( currency, number );

		if ( formattedNumber === '' ) {
			return formattedNumber;
		}

		const { priceFormat, symbol } = currency;

		// eslint-disable-next-line @wordpress/valid-sprintf
		return sprintf( priceFormat, symbol, formattedNumber );
	}

	/**
	 * Formats money value.
	 *
	 * @deprecated
	 *
	 * @param   {number|string} number number to format
	 * @return {?string} A formatted string.
	 */
	function formatCurrency( number ) {
		deprecated( 'Currency().formatCurrency', {
			version: '5.0.0',
			alternative: 'Currency().formatAmount',
			plugin: 'WooCommerce',
			hint: '`formatAmount` accepts the same arguments as formatCurrency',
		} );
		return formatAmount( number );
	}

	/**
	 * Get the default price format from a currency.
	 *
	 * @param {Object} config Currency configuration.
	 * @return {string} Price format.
	 */
	function getPriceFormat( config ) {
		if ( config.priceFormat ) {
			return stripTags( config.priceFormat.toString() );
		}

		switch ( config.symbolPosition ) {
			case 'left':
				return '%1$s%2$s';
			case 'right':
				return '%2$s%1$s';
			case 'left_space':
				return '%1$s %2$s';
			case 'right_space':
				return '%2$s %1$s';
		}

		return '%1$s%2$s';
	}

	/**
	 * Get formatted data for a country from supplied locale and symbol info.
	 *
	 * @param {string} countryCode Country code.
	 * @param {Object} localeInfo Locale info by country code.
	 * @param {Object} currencySymbols Currency symbols by symbol code.
	 * @return {Object} Formatted currency data for country.
	 */
	function getDataForCountry(
		countryCode,
		localeInfo = {},
		currencySymbols = {}
	) {
		const countryInfo = localeInfo[ countryCode ] || {};
		const symbol = currencySymbols[ countryInfo.currency_code ];

		if ( ! symbol ) {
			return {};
		}

		return {
			code: countryInfo.currency_code,
			symbol: decodeEntities( symbol ),
			symbolPosition: countryInfo.currency_pos,
			thousandSeparator: countryInfo.thousand_sep,
			decimalSeparator: countryInfo.decimal_sep,
			precision: countryInfo.num_decimals,
		};
	}

	return {
		getCurrencyConfig: () => {
			return { ...currency };
		},
		getDataForCountry,
		setCurrency,
		formatAmount,
		formatCurrency,
		getPriceFormat,

		/**
		 * Get the rounded decimal value of a number at the precision used for the current currency.
		 * This is a work-around for fraction-cents, meant to be used like `wc_format_decimal`
		 *
		 * @param {number|string} number A floating point number (or integer), or string that converts to a number
		 * @return {number} The original number rounded to a decimal point
		 */
		formatDecimal( number ) {
			if ( typeof number !== 'number' ) {
				number = parseFloat( number );
			}
			if ( Number.isNaN( number ) ) {
				return 0;
			}
			const { precision } = currency;
			return (
				Math.round( number * Math.pow( 10, precision ) ) /
				Math.pow( 10, precision )
			);
		},

		/**
		 * Get the string representation of a floating point number to the precision used by the current currency.
		 * This is different from `formatAmount` by not returning the currency symbol.
		 *
		 * @param  {number|string} number A floating point number (or integer), or string that converts to a number
		 * @return {string}               The original number rounded to a decimal point
		 */
		formatDecimalString( number ) {
			if ( typeof number !== 'number' ) {
				number = parseFloat( number );
			}
			if ( Number.isNaN( number ) ) {
				return '';
			}
			const { precision } = currency;
			return number.toFixed( precision );
		},

		/**
		 * Render a currency for display in a component.
		 *
		 * @param  {number|string} number A floating point number (or integer), or string that converts to a number
		 * @return {Node|string} The number formatted as currency and rendered for display.
		 */
		render( number ) {
			if ( typeof number !== 'number' ) {
				number = parseFloat( number );
			}
			if ( number < 0 ) {
				return (
					<span className="is-negative">
						{ formatAmount( number ) }
					</span>
				);
			}
			return formatAmount( number );
		},
	};
};

export default CurrencyFactory;

/**
 * Returns currency data by country/region. Contains code, symbol, position, thousands separator, decimal separator, and precision.
 *
 * Dev Note: When adding new currencies below, the exchange rate array should also be updated in WooCommerce Admin's `business-details.js`.
 *
 * @deprecated
 *
 * @return {Object} Curreny data.
 */
export function getCurrencyData() {
	deprecated( 'getCurrencyData', {
		version: '3.1.0',
		alternative: 'CurrencyFactory.getDataForCountry',
		plugin: 'WooCommerce Admin',
		hint:
			'Pass in the country, locale data, and symbol info to use getDataForCountry',
	} );

	// See https://github.com/woocommerce/woocommerce-admin/issues/3101.
	return {
		US: {
			code: 'USD',
			symbol: '$',
			symbolPosition: 'left',
			thousandSeparator: ',',
			decimalSeparator: '.',
			precision: 2,
		},
		EU: {
			code: 'EUR',
			symbol: '€',
			symbolPosition: 'left',
			thousandSeparator: '.',
			decimalSeparator: ',',
			precision: 2,
		},
		IN: {
			code: 'INR',
			symbol: '₹',
			symbolPosition: 'left',
			thousandSeparator: ',',
			decimalSeparator: '.',
			precision: 2,
		},
		GB: {
			code: 'GBP',
			symbol: '£',
			symbolPosition: 'left',
			thousandSeparator: ',',
			decimalSeparator: '.',
			precision: 2,
		},
		BR: {
			code: 'BRL',
			symbol: 'R$',
			symbolPosition: 'left',
			thousandSeparator: '.',
			decimalSeparator: ',',
			precision: 2,
		},
		VN: {
			code: 'VND',
			symbol: '₫',
			symbolPosition: 'right',
			thousandSeparator: '.',
			decimalSeparator: ',',
			precision: 1,
		},
		ID: {
			code: 'IDR',
			symbol: 'Rp',
			symbolPosition: 'left',
			thousandSeparator: '.',
			decimalSeparator: ',',
			precision: 0,
		},
		BD: {
			code: 'BDT',
			symbol: '৳',
			symbolPosition: 'left',
			thousandSeparator: ',',
			decimalSeparator: '.',
			precision: 0,
		},
		PK: {
			code: 'PKR',
			symbol: '₨',
			symbolPosition: 'left',
			thousandSeparator: ',',
			decimalSeparator: '.',
			precision: 2,
		},
		RU: {
			code: 'RUB',
			symbol: '₽',
			symbolPosition: 'right',
			thousandSeparator: ' ',
			decimalSeparator: ',',
			precision: 2,
		},
		TR: {
			code: 'TRY',
			symbol: '₺',
			symbolPosition: 'left',
			thousandSeparator: '.',
			decimalSeparator: ',',
			precision: 2,
		},
		MX: {
			code: 'MXN',
			symbol: '$',
			symbolPosition: 'left',
			thousandSeparator: ',',
			decimalSeparator: '.',
			precision: 2,
		},
		CA: {
			code: 'CAD',
			symbol: '$',
			symbolPosition: 'left',
			thousandSeparator: ',',
			decimalSeparator: '.',
			precision: 2,
		},
	};
}
