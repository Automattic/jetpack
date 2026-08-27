/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { DEFAULT_YEAR_SURFACE_COUNT } from '@jetpack-premium-analytics/datetime';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { getYearElements, resolveSelectedYear } from '../years';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// The list runs down from today, so the payload is built relative to it — a
// hardcoded year would drift out of the surface after New Year. The package
// test script pins TZ=UTC, which is also what `siteTimeZone()` resolves to
// under jsdom's default WP date settings.
const CURRENT_YEAR = new Date().getFullYear();

const yearRow = ( year: number ) => ( {
	year: String( year ),
	total_posts: 1,
	total_words: 1,
	avg_words: 1,
	total_likes: 1,
	avg_likes: 1,
	total_comments: 1,
	avg_comments: 1,
	total_images: 1,
	avg_images: 1,
} );

const insightsPayload = ( years: unknown[] ) => ( {
	highest_day_of_week: 6,
	highest_day_percent: 10,
	highest_hour: 11,
	highest_hour_percent: 5,
	years,
} );

describe( 'getYearElements', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'lists every year back to the oldest one in the payload', async () => {
		mockApiFetch.mockResolvedValue(
			insightsPayload( [ yearRow( CURRENT_YEAR - 3 ), yearRow( CURRENT_YEAR ) ] )
		);

		// Calendar years, newest first, publish gaps included — matching the year
		// filter surface the section used to provide.
		await expect( getYearElements() ).resolves.toEqual( [
			{ value: `year-${ CURRENT_YEAR }`, label: String( CURRENT_YEAR ) },
			{ value: `year-${ CURRENT_YEAR - 1 }`, label: String( CURRENT_YEAR - 1 ) },
			{ value: `year-${ CURRENT_YEAR - 2 }`, label: String( CURRENT_YEAR - 2 ) },
			{ value: `year-${ CURRENT_YEAR - 3 }`, label: String( CURRENT_YEAR - 3 ) },
		] );
	} );

	it( 'ignores a row with a garbled year instead of exploding the list', async () => {
		// The sanitizer normalizes a missing year to '' — without the guard this
		// would resolve to year 0 and list two thousand entries.
		mockApiFetch.mockResolvedValue(
			insightsPayload( [ { ...yearRow( CURRENT_YEAR ), year: '' }, yearRow( CURRENT_YEAR ) ] )
		);

		await expect( getYearElements() ).resolves.toEqual( [
			{ value: `year-${ CURRENT_YEAR }`, label: String( CURRENT_YEAR ) },
		] );
	} );

	it( 'reads the report the widget already loaded rather than fetching again', async () => {
		mockApiFetch.mockResolvedValue( insightsPayload( [ yearRow( CURRENT_YEAR ) ] ) );

		await getYearElements();
		await getYearElements();

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'falls back to the default surface when the report never arrives', async () => {
		// A 403 rather than a bare error: the shared client retries anything it
		// reads as transient, and this test is about the outcome, not the wait.
		mockApiFetch.mockRejectedValue( { code: 'rest_forbidden', data: { status: 403 } } );

		const elements = await getYearElements();

		expect( elements ).toHaveLength( DEFAULT_YEAR_SURFACE_COUNT );
		expect( elements[ 0 ] ).toEqual( {
			value: `year-${ CURRENT_YEAR }`,
			label: String( CURRENT_YEAR ),
		} );
	} );
} );

describe( 'resolveSelectedYear', () => {
	it( 'reads the year out of the preset the attribute carries', () => {
		expect( resolveSelectedYear( 'year-2019' ) ).toBe( 2019 );
	} );

	it( 'falls back to the current year for an instance carrying none', () => {
		expect( resolveSelectedYear( undefined ) ).toBe( CURRENT_YEAR );
	} );
} );
