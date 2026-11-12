import { getTab, getTabSearch } from '../tabs';

describe( 'getTab', () => {
	it.each( [ undefined, 'nope', 42 ] )( 'falls back to Overview for %p', value => {
		expect( getTab( value ).value ).toBe( 'overview' );
	} );

	it( 'opens Settings wherever the page shows', () => {
		expect( getTab( 'settings' ).value ).toBe( 'settings' );
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
