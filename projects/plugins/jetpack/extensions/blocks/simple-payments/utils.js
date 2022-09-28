import { getCurrencyDefaults } from '@automattic/format-currency';
import { trimEnd } from 'lodash';
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
	const nav = global?.window?.navigator;
	if ( nav?.languages?.length ) {
		return nav.languages[ 0 ];
	}
	return nav?.userLanguage ?? nav?.language ?? nav?.browserLanguage ?? defaultLang;
};

// Legacy method of displaying prices.
export const formatPriceFallback = ( price = 0, currency, withSymbol = true ) => {
	const { precision, symbol } = getCurrencyDefaults( currency );
	const value = price.toFixed( precision );
	// Trim the dot at the end of symbol, e.g., 'kr.' becomes 'kr'
	return withSymbol ? `${ value } ${ trimEnd( symbol, '.' ) }` : value;
};

// Display prices using Intl.NumberFormat if available - supported in 95.75% of browsers as of Oct 2020.
export const formatPrice = ( price = 0, currency, withSymbol = true ) => {
	if ( ! window.Intl || 'function' !== typeof Intl.NumberFormat ) {
		return formatPriceFallback( price, currency, withSymbol );
	}

	const siteLocale = window?.Jetpack_Editor_Initial_State?.siteLocale ?? 'en-US';

	const tryLocales = [ siteLocale, getNavigatorLanguage(), 'en-US' ];

	let formatOptions = {};
	if ( withSymbol ) {
		formatOptions = { style: 'currency', currency };
	}

	// We're not 100% certain that the siteLocale or the navigatorLanguage line
	// up with Intl.NumberFormat ("best effort" API).  Try them in order,
	// fallback to "en-US".
	let locale;
	for ( locale of tryLocales ) {
		try {
			return Intl.NumberFormat( locale, formatOptions ).format( price );
		} catch {
			continue;
		}
	}

	// "Shouldn't" reach here - maybe Intl.Numberformat rejected the currency. Fallback.
	return formatPriceFallback( price, currency, withSymbol );
};
