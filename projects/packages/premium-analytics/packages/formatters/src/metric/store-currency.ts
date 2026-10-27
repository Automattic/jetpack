/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { createNumberFormatters } from '@automattic/number-formatters';

type StoreCurrency = { code: string; symbol: string; precision?: number };

// Private, so the store's symbol override never reaches other users of the default formatters.
const formatters = createNumberFormatters();
let registered: StoreCurrency | undefined;

/**
 * The WooCommerce store currency from the script data, if the site has a store.
 *
 * @return The store currency, or `undefined`.
 */
function readStoreCurrency(): StoreCurrency | undefined {
	if ( typeof window === 'undefined' ) {
		return undefined;
	}

	const currency = getScriptData()?.premium_analytics?.store_currency;

	return typeof currency?.code === 'string' && /^[A-Z]{3}$/.test( currency.code )
		? currency
		: undefined;
}

// At most 20, what every Intl engine accepts, so a mistyped decimals setting cannot throw.
const isFractionDigits = ( value: unknown ): value is number =>
	Number.isInteger( value ) && ( value as number ) >= 0 && ( value as number ) <= 20;

/**
 * Currency formatters that print the store currency with the store's own symbol, as
 * WooCommerce Analytics does. That symbol also lets currencies `number-formatters` does not
 * list (BYN, VES, …) format as themselves instead of falling back to USD.
 *
 * Read on every call rather than at import, like the site locale and time zone.
 *
 * @return The store's currency code (USD without a store), its price decimals, and the formatters to use.
 */
export function storeCurrencyFormatters() {
	const store = readStoreCurrency();

	if ( store !== registered ) {
		formatters.setCurrencyOverrides(
			store ? { [ store.code ]: { symbol: store.symbol || store.code } } : {}
		);
		registered = store;
	}

	const precision = store?.precision;

	return {
		code: store?.code ?? 'USD',
		decimals: isFractionDigits( precision ) ? precision : undefined,
		formatCurrency: formatters.formatCurrency,
		getCurrencyObject: formatters.getCurrencyObject,
	};
}
