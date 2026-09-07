/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import {
	EN_US_SETTINGS,
	ES_ES_SETTINGS,
	utcDate,
} from '../packages/formatters/src/date/__fixtures__/wp-date-settings';
import { formatPublishedDate, performanceSentence } from './detail-header';

// Captured before any suite installs its own, since `setSettings` is global and
// these suites share a module registry with the rest of their group.
const BASE_SETTINGS = getSettings();

beforeEach( () => setSettings( EN_US_SETTINGS ) );
afterEach( () => setSettings( BASE_SETTINGS ) );

describe( 'formatPublishedDate', () => {
	it( 'reads an offset-less value as site wall time', () => {
		// Late enough that a browser-local read would name the 11th east of the site.
		expect( formatPublishedDate( '2026-01-10T23:30:00' ) ).toBe( 'Jan 10, 2026' );
	} );

	it( "follows the site's locale and date format", () => {
		setSettings( ES_ES_SETTINGS );

		expect( formatPublishedDate( '2026-01-10T08:00:00' ) ).toBe( '10 de ene de 2026' );
	} );

	it.each( [ undefined, '', 'not a date', '0000-00-00 00:00:00' ] )(
		'states nothing for %p',
		value => {
			expect( formatPublishedDate( value ) ).toBeUndefined();
		}
	);
} );

describe( 'performanceSentence', () => {
	it( 'names both bounds of the committed range', () => {
		expect(
			performanceSentence( { from: utcDate( 2026, 7, 9 ), to: utcDate( 2026, 7, 15 ) } )
		).toBe( 'Performance from Jul 9, 2026 to Jul 15, 2026' );
	} );

	it( "follows the site's locale and date format", () => {
		setSettings( ES_ES_SETTINGS );

		expect(
			performanceSentence( { from: utcDate( 2026, 7, 9 ), to: utcDate( 2026, 7, 15 ) } )
		).toBe( 'Performance from 9 de jul de 2026 to 15 de jul de 2026' );
	} );

	it.each( [
		[ 'no range', undefined ],
		[ 'an open start', { from: undefined, to: utcDate( 2026, 7, 15 ) } ],
		[ 'an open end', { from: utcDate( 2026, 7, 9 ), to: undefined } ],
		[ 'an unparseable bound', { from: new Date( 'nope' ), to: utcDate( 2026, 7, 15 ) } ],
	] )( 'states nothing for %s', ( _label, range ) => {
		expect( performanceSentence( range ) ).toBeUndefined();
	} );
} );
