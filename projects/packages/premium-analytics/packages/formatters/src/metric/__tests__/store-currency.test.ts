/**
 * Internal dependencies
 */
import { formatMetricValue } from '../format-metric-value';

describe( 'formatMetricValue with a store currency', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	const setStore = ( code: string, symbol: string, precision?: unknown ) => {
		window.JetpackScriptData = {
			premium_analytics: { store_currency: { code, symbol, precision } },
		} as unknown as typeof window.JetpackScriptData;
	};

	it.each( [
		[ 'a currency number-formatters lists', 'EUR', '€', '€1,234.50' ],
		[ 'a currency number-formatters does not list', 'BYN', 'Br', 'Br\u00a01,234.50' ],
	] )( 'prints %s with the store symbol', ( _, code, symbol, expected ) => {
		setStore( code, symbol );

		expect( formatMetricValue( 1234.5, 'currency' ) ).toBe( expected );
	} );

	it.each( [
		[ 'USD', '$', 0, 92.4, {}, '$92' ],
		[ 'JPY', '¥', 2, 92, {}, '¥92.00' ],
		[ 'USD', '$', undefined, 92, {}, '$92.00' ],
		[ 'USD', '$', '0', 92, {}, '$92.00' ],
		[ 'USD', '$', 0, 500, { useMultipliers: true }, '$500' ],
		[ 'USD', '$', 0, 1500, { useMultipliers: true }, '$1.5K' ],
		[ 'USD', '$', 0, 0.37, { currencyCode: 'USD' }, '$0.37' ],
	] )(
		'%s (%s) at precision %p formats %p with %o as %s',
		( code, symbol, precision, value, options, expected ) => {
			setStore( code, symbol, precision );

			expect( formatMetricValue( value, 'currency', options ) ).toBe( expected );
		}
	);

	it( 'keeps an explicit other currency on its own symbol', () => {
		setStore( 'BYN', 'Br' );

		expect( formatMetricValue( 1234.5, 'currency', { currencyCode: 'USD' } ) ).toBe( '$1,234.50' );
	} );
} );
