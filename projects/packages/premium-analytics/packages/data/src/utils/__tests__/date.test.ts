const mockGetEntityRecord = jest.fn();

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@wordpress/data', () => ( {
	select: jest.fn( () => ( {
		getEntityRecord: mockGetEntityRecord,
	} ) ),
} ) );

/**
 * Internal dependencies
 */
import { getSiteTimezone } from '../date';

describe( 'getSiteTimezone', () => {
	it( 'returns UTC for a site with an empty timezone string and zero offset', () => {
		mockGetEntityRecord.mockReturnValue( { timezone: '', gmt_offset: 0 } );

		expect( getSiteTimezone() ).toBe( '+00:00' );
	} );

	it( 'formats a fractional manual offset', () => {
		mockGetEntityRecord.mockReturnValue( { timezone: '', gmt_offset: 5.5 } );

		expect( getSiteTimezone() ).toBe( '+05:30' );
	} );
} );
