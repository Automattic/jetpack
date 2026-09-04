/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { reportingTimeZone } from '../reporting-time-zone';

/** The package defaults before tests override them. */
const DEFAULTS = getSettings();

const siteOn = ( timezone: { offset: number; string: string } ) =>
	setSettings( {
		...DEFAULTS,
		timezone: { ...timezone, offsetFormatted: String( timezone.offset ), abbr: '' },
	} );

describe( 'reportingTimeZone', () => {
	it( 'reports in the site timezone', () => {
		siteOn( { offset: 9, string: 'Asia/Tokyo' } );

		expect( reportingTimeZone() ).toBe( 'Asia/Tokyo' );
	} );

	it( 'reports in the site offset when the site has no named zone', () => {
		siteOn( { offset: 5.5, string: '' } );

		expect( reportingTimeZone() ).toBe( '+05:30' );
	} );
} );
