/**
 * External dependencies
 */
import { getCurrencyDefaults } from '@automattic/format-currency';
import { trimEnd } from 'lodash';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SIMPLE_PAYMENTS_PRODUCT_POST_TYPE } from './constants';

export const isValidSimplePaymentsProduct = product =>
	product.type === SIMPLE_PAYMENTS_PRODUCT_POST_TYPE && product.status === 'publish';

// based on https://stackoverflow.com/a/10454560/59752
export const decimalPlaces = number => {
	const match = ( '' + number ).match( /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/ );
	if ( ! match ) {
		return 0;
	}
	return Math.max( 0, ( match[ 1 ] ? match[ 1 ].length : 0 ) - ( match[ 2 ] ? +match[ 2 ] : 0 ) );
};

const getNavigatorLanguage = ( defaultLang = 'en-US' ) => {
	if ( navigator.languages && navigator.languages.length ) {
		return navigator.languages[ 0 ];
	}
	return navigator.userLanguage || navigator.language || navigator.browserLanguage || defaultLang;
};

// Legacy method of displaying prices.
export const formatPriceFallback = ( price, currency, withSymbol = true ) => {
	const { precision, symbol } = getCurrencyDefaults( currency );
	const value = price.toFixed( precision );
	// Trim the dot at the end of symbol, e.g., 'kr.' becomes 'kr'
	return withSymbol ? `${ value } ${ trimEnd( symbol, '.' ) }` : value;
};

// Display prices using Intl.NumberFormat if available - supported in 95.75% of browsers as of Oct 2020.
export const formatPrice = ( price, currency, withSymbol = true ) => {
	if ( ! window.Intl || 'function' !== typeof Intl.NumberFormat ) {
		return formatPriceFallback( price, currency, withSymbol );
	}

	const locale = getNavigatorLanguage();

	let formatOptions = {};
	if ( withSymbol ) {
		formatOptions = { style: 'currency', currency };
	}

	try {
		return Intl.NumberFormat( locale, formatOptions ).format( price );
	} catch {
		// "Shouldn't" reach here - maybe Intl.Numberformat rejected the currency. Fallback.
		return formatPriceFallback( price, currency, withSymbol );
	}
};
