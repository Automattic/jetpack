import { getTab, getTabSearch } from '../tabs';

describe( 'getTab', () => {
	it.each( [ undefined, 'settings', 42 ] )( 'falls back to Overview for %p', value => {
		expect( getTab( value ).value ).toBe( 'overview' );
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
