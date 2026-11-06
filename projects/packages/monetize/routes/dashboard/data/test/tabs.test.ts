import { getTab, getTabs, getTabSearch } from '../tabs';

describe( 'getTab', () => {
	it.each( [ undefined, 'settings', 42 ] )( 'falls back to Overview for %p', value => {
		expect( getTab( value ).value ).toBe( 'overview' );
	} );

	it( 'opens Settings when it is listed', () => {
		expect( getTab( 'settings', getTabs( true ) ).value ).toBe( 'settings' );
	} );
} );

describe( 'getTabs', () => {
	it.each( [
		[ true, [ 'overview', 'payments', 'subscribers', 'ads', 'settings' ] ],
		[ false, [ 'overview', 'payments', 'subscribers', 'ads' ] ],
	] )( 'with the Ads settings %p lists %p', ( hasAdsSettings, values ) => {
		expect( getTabs( hasAdsSettings ).map( tab => tab.value ) ).toEqual( values );
	} );
} );

describe( 'getTabSearch', () => {
	it.each( [
		[ 'ads', { tab: 'ads', foo: 'bar' } ],
		[ 'overview', { tab: undefined, foo: 'bar' } ],
	] )( 'opens %s and keeps the other params', ( next, expected ) => {
		expect( getTabSearch( { tab: 'payments', foo: 'bar' }, next ) ).toEqual( expected );
	} );
} );
