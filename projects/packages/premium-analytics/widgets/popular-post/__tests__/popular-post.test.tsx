/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	needsReportDateParamsSeed,
	queryClient,
} from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
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

		// Let anything the rerender queued actually run, so the count below is a
		// settled one rather than a first-tick reading.
		await act( async () => {
			await Promise.resolve();
		} );

		expect( topPostsRequests() ).toHaveLength( 1 );
		expect( topPostsRequests()[ 0 ] ).not.toContain( '2023' );
	} );

	it( 'flags the metric tiles as all-time, not the window the title names', async () => {
		render( <PopularPostWidget attributes={ { reportParams: yearReportParams( 2022 ) } } /> );

		await expect( screen.findByText( 'Winning post' ) ).resolves.toBeInTheDocument();

		// Visible, and once for the row: a tooltip would reach neither a touch nor a
		// keyboard reader, and three copies would be read out on every tile.
		expect( screen.getByText( 'Totals since this post was published' ) ).toBeInTheDocument();
	} );

	it( 'links the post to its detail page on the window it ranked over', async () => {
		render( <PopularPostWidget attributes={ { reportParams: yearReportParams( 2022 ) } } /> );

		const link = await screen.findByRole( 'link', { name: 'Winning post' } );
		const { searchParams: search } = getMockRouteLinkUrl( link );

		expect( search.get( 'preset' ) ).toBe( 'last-12-months' );
		expect( search.get( 'from' ) ).toContain( '2025-08-27T00:00:00' );
		expect( search.get( 'to' ) ).toContain( '2026-08-26T23:59:59' );

		// A complete window, so the detail route reseeds the URL from these params
		// rather than from its own defaults. (It does reseed either way — its
		// redirect also fires on the `post_id` a link cannot carry — so what this
		// pins is the window that survives, not whether the redirect happens.)
		expect(
			needsReportDateParamsSeed( {
				from: search.get( 'from' ) ?? undefined,
				to: search.get( 'to' ) ?? undefined,
				interval: search.get( 'interval' ) ?? undefined,
				preset: search.get( 'preset' ) as 'last-12-months',
			} )
		).toBe( false );
	} );

	it( 'renders on a saved instance that carries no report params', async () => {
		// The widget rules allow `attributes` to arrive empty, and nothing here
		// reads the host's range, so an instance saved before this card pinned its
		// window still has everything it needs.
		render( <PopularPostWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Winning post' ) ).resolves.toBeInTheDocument();

		const [ ranking ] = topPostsRequests().map( decodeURIComponent );
		expect( ranking ).toContain( 'start_date=2025-08-27T00:00:00' );
	} );
} );
