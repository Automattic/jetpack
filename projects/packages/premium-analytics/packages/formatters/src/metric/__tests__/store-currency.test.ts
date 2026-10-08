/**
 * Internal dependencies
 */
import { formatMetricValue } from '../format-metric-value';

describe( 'formatMetricValue with a store currency', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	const setStore = ( code: string, symbol: string ) => {
		window.JetpackScriptData = {
			premium_analytics: { store_currency: { code, symbol } },
		} as unknown as typeof window.JetpackScriptData;
	};

	it.each( [
		[ 'a currency number-formatters lists', 'EUR', '€', '€1,234.50' ],
		[ 'a currency number-formatters does not list', 'BYN', 'Br', 'Br\u00a01,234.50' ],
	] )( 'prints %s with the store symbol', ( _, code, symbol, expected ) => {
		setStore( code, symbol );

		expect( formatMetricValue( 1234.5, 'currency' ) ).toBe( expected );
	} );

	it( 'keeps an explicit other currency on its own symbol', () => {
		setStore( 'BYN', 'Br' );

		expect( formatMetricValue( 1234.5, 'currency', { currencyCode: 'USD' } ) ).toBe( '$1,234.50' );
	} );
} );
