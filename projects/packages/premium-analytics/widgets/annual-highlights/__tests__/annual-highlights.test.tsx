/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	GlobalErrorProvider,
	queryClient,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { DEFAULT_YEAR_SURFACE_COUNT, type YearPresetId } from '@jetpack-premium-analytics/datetime';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import AnnualHighlightsWidget from '../render';
import { getYearElements, resolveSelectedYear } from '../years';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// Built relative to today: hardcoded years would silently move the no-attribute
// default off the data after New Year. The package test script pins TZ=UTC, which
// is what the widget's `reportingTimeZone()` also resolves to under jsdom.
const CURRENT_YEAR = new Date().getFullYear();
const PREVIOUS_YEAR = CURRENT_YEAR - 1;

const INSIGHTS_PAYLOAD = {
	highest_day_of_week: 6,
	highest_day_percent: 10,
	highest_hour: 11,
	highest_hour_percent: 5,
	years: [
		{
			year: String( PREVIOUS_YEAR ),
			total_posts: 12,
			total_words: 300,
			avg_words: 25,
			total_likes: 7,
			avg_likes: 0.6,
			total_comments: 4,
			avg_comments: 0.3,
			total_images: 2,
			avg_images: 0.2,
		},
		{
			year: String( CURRENT_YEAR ),
			total_posts: 30,
			total_words: 900,
			avg_words: 30,
			total_likes: 21,
			avg_likes: 0.7,
			total_comments: 9,
			avg_comments: 0.3,
			total_images: 5,
			avg_images: 0.2,
		},
	],
};

const renderWidget = (
	year?: YearPresetId,
	reportParams: Partial< ReportParams > = getDefaultQueryParams( false, 'last-7-days' )
) =>
	render(
		<GlobalErrorProvider>
			<AnnualHighlightsWidget
				attributes={ {
					...( year ? { year } : {} ),
					reportParams: reportParams as ReportParams,
				} }
			/>
		</GlobalErrorProvider>
	);

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

describe( 'AnnualHighlightsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( INSIGHTS_PAYLOAD );
	} );

	it( 'shows every tile for the year the attribute names', async () => {
		const { container } = renderWidget( `year-${ PREVIOUS_YEAR }` );

		await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Posts12' );
		expect( container ).toHaveTextContent( 'Words300' );
		expect( container ).toHaveTextContent( 'Likes7' );
		expect( container ).toHaveTextContent( 'Comments4' );
	} );

	it( 'ignores the section date selection', async () => {
		// The year shown belongs to the widget's own attribute: a section still
		// carrying last year's preset must not move the tiles off the default.
		const { container } = renderWidget( undefined, {
			preset: `year-${ PREVIOUS_YEAR }`,
			from: `${ PREVIOUS_YEAR }-01-01`,
			to: `${ PREVIOUS_YEAR }-12-31`,
		} );

		await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Posts30' );
		expect( container ).toHaveTextContent( 'Words900' );
	} );

	it.each( [
		[
			'shows zeros, not an empty state, for a year the site did not publish in',
			// Only last year has a row, so the current-year default has none.
			{ ...INSIGHTS_PAYLOAD, years: [ INSIGHTS_PAYLOAD.years[ 0 ] ] },
		],
		// The insights sanitizer returns a bare object, without `years`, for a shape it does not recognize.
		[ 'survives a payload the sanitizer rejects', {} ],
	] )( '%s', async ( _title, payload ) => {
		mockApiFetch.mockResolvedValue( payload );

		renderWidget();

		await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByText( '0' ) ).toHaveLength( 4 );
	} );

	it( 'links to the Annual insights report', async () => {
		renderWidget();

		await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/annual-insights' )
		);
	} );

	it( 'keeps focus on the download after a failed download of stale highlights', async () => {
		jest.useFakeTimers();
		try {
			renderWidget();
			await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();

			act( () => {
				jest.advanceTimersByTime( 6 * 60 * 1000 );
			} );
			mockApiFetch.mockRejectedValue( { code: 'server_error', data: { status: 500 } } );
			const button = screen.getByRole( 'button', { name: /Download CSV/ } );
			act( () => button.focus() );
			// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
			fireEvent.click( button );
			await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 2 ) );

			await waitFor( () => expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
			expect( screen.getByRole( 'button', { name: /Download CSV/ } ) ).toHaveFocus();
			expect( screen.getByText( 'Posts' ) ).toBeInTheDocument();
		} finally {
			jest.useRealTimers();
		}
	} );
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
