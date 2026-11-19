import { getAdsSettingsData } from '../ads-settings-data';
import { getTab, getTabSearch } from '../tabs';
import type { AdsSettingsData } from '../ads-settings-data';

jest.mock( '../ads-settings-data', () => ( { getAdsSettingsData: jest.fn() } ) );

describe( 'getTab', () => {
	it.each( [ undefined, 'nope', 42 ] )( 'falls back to Overview for %p', value => {
		expect( getTab( value ).value ).toBe( 'overview' );
	} );

	it.each( [
		[ 'the Jetpack plugin sends its data', {} as AdsSettingsData, 'settings' ],
		[ 'the site has no Settings data', undefined, 'overview' ],
	] )( 'opens Settings only where %s', ( _case, data, expected ) => {
		jest.mocked( getAdsSettingsData ).mockReturnValue( data );
		expect( getTab( 'settings' ).value ).toBe( expected );
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
