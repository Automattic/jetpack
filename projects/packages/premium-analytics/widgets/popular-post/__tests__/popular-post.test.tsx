/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { getMockRouteLinkUrl } from '../../../tests/js/route-test-utils';
import PopularPostWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// The window is resolved from "now" in the site timezone, so pin both rather
// than letting the machine's clock and zone decide what to expect.
const NOW = new Date( '2026-08-27T12:00:00.000Z' );

const topPostsResponse = {
	date: '2026-08-26',
	period: 'day',
	days: {},
	summary: {
		postviews: [
			{
				id: 7,
				title: 'Winning post',
				type: 'post',
				href: 'https://example.com/winning-post/',
				date: '2026-06-02',
				views: 420,
			},
		],
		total_views: 420,
	},
};

const postContentResponse = [
	{
		id: 7,
		title: { rendered: 'Winning post' },
		link: 'https://example.com/winning-post/',
		date: '2026-06-02T08:00:00',
	},
];

const postStatsResponse = { views: 9999, like_count: 12, post: { ID: 7, comment_count: 4 } };

type MockedFetchArgs = { path?: string; url?: string };

function requestPath( options: unknown ): string {
	const { path, url } = options as MockedFetchArgs;

	return path || url || '';
}

function topPostsRequests(): string[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => requestPath( options ) )
		.filter( target => target.includes( 'stats/top-posts' ) );
}

/**
 * Report params for a single calendar year, the shape the Insights section's
 * year filter hands its widgets.
 *
 * @param year - Four-digit year.
 * @return Report params scoped to that year.
 */
function yearReportParams( year: number ) {
	return {
		...getDefaultQueryParams( false ),
		preset: undefined,
		from: `${ year }-01-01T00:00:00.000+00:00`,
		to: `${ year }-12-31T23:59:59.999+00:00`,
	};
}

describe( 'PopularPostWidget', () => {
	let defaultSettings: ReturnType< typeof getSettings >;

	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockImplementation( ( options: unknown ) => {
			const target = requestPath( options );

			if ( target.includes( 'stats/top-posts' ) ) {
				return Promise.resolve( topPostsResponse );
			}
			if ( target.includes( 'stats/post/' ) ) {
				return Promise.resolve( postStatsResponse );
			}
			if ( target.startsWith( '/wp/v2/posts' ) ) {
				return Promise.resolve( postContentResponse );
			}

			return Promise.resolve( {} );
		} );

		defaultSettings = getSettings();
		setSettings( {
			...defaultSettings,
			timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
		} );
		jest.useFakeTimers();
		jest.setSystemTime( NOW );
	} );

	afterEach( () => {
		jest.useRealTimers();
		setSettings( defaultSettings );
	} );

	it( 'ranks over its own window whatever range the host injects', async () => {
		const { rerender } = render(
			<PopularPostWidget attributes={ { reportParams: yearReportParams( 2022 ) } } />
		);

		await expect( screen.findByText( 'Winning post' ) ).resolves.toBeInTheDocument();

		// The window's own bounds are asserted in the hook's suite; what only shows
		// here is that the injected year never displaces them.
		const [ ranking ] = topPostsRequests().map( decodeURIComponent );
		expect( ranking ).toContain( 'start_date=2025-08-27T00:00:00' );
		expect( ranking ).not.toContain( '2022' );

		// A different section year is the change this card must ignore: it reads
		// the range from nowhere, so no second ranking request is issued. Settle
		// first — asserting a count that is already right would pass on the first
		// tick, before a request the rerender triggered could be seen.
		rerender( <PopularPostWidget attributes={ { reportParams: yearReportParams( 2023 ) } } /> );

		await waitFor( () => expect( mockApiFetch ).not.toHaveBeenCalledTimes( 0 ) );
		await act( async () => {
			await Promise.resolve();
		} );

		expect( topPostsRequests() ).toHaveLength( 1 );
		expect( topPostsRequests()[ 0 ] ).not.toContain( '2023' );
	} );

	it( 'flags the metric tiles as all-time, not the window the title names', async () => {
		render( <PopularPostWidget attributes={ { reportParams: yearReportParams( 2022 ) } } /> );

		await expect( screen.findByText( 'Winning post' ) ).resolves.toBeInTheDocument();

		// The note is what stops "Views 9,999" under a title naming twelve months
		// being read as that year's count.
		expect( screen.getAllByText( 'All-time total, not the last 12 months.' ) ).toHaveLength( 3 );
	} );

	it( 'links the post to its detail page on the window it ranked over', async () => {
		render( <PopularPostWidget attributes={ { reportParams: yearReportParams( 2022 ) } } /> );

		const link = await screen.findByRole( 'link', { name: 'Winning post' } );
		const { searchParams: search } = getMockRouteLinkUrl( link );

		expect( search.get( 'preset' ) ).toBe( 'last-12-months' );
		expect( search.get( 'from' ) ).toContain( '2025-08-27T00:00:00' );
		expect( search.get( 'to' ) ).toContain( '2026-08-26T23:59:59' );
	} );
} );
