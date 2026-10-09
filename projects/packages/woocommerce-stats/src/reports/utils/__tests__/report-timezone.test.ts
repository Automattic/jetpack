/**
 * External dependencies
 */
import { getSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { resolveReportTimeZone } from '../report-timezone';

jest.mock( '@wordpress/date', () => ( { getSettings: jest.fn() } ) );

const mockGetSettings = getSettings as unknown as jest.Mock;

describe( 'resolveReportTimeZone', () => {
	it.each( [
		[ 'a named zone', { string: 'Asia/Taipei', offset: 8 }, 'Asia/Taipei' ],
		[ 'a whole-hour offset', { string: '', offset: 8 }, '+08:00' ],
		[ 'a negative offset', { string: '', offset: -3 }, '-03:00' ],
		[ 'a half-hour offset', { string: '', offset: 5.5 }, '+05:30' ],
		[ 'an offset WordPress stores as a string', { string: '', offset: '-9.5' }, '-09:30' ],
		[ 'UTC', { string: '', offset: 0 }, '+00:00' ],
	] )( 'reads %s from the site settings', ( _name, timezone, expected ) => {
		mockGetSettings.mockReturnValue( { timezone } );

		expect( resolveReportTimeZone() ).toBe( expected );
	} );
} );
