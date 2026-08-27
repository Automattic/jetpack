/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
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

	it( 'ranks over its own last 365 days whatever range the host injects', async () => {
		const { rerender } = render(
			<PopularPostWidget attributes={ { reportParams: yearReportParams( 2022 ) } } />
		);

		await expect( screen.findByText( 'Winning post' ) ).resolves.toBeInTheDocument();

		const [ ranking ] = topPostsRequests().map( decodeURIComponent );
		expect( ranking ).toContain( 'start_date=2025-08-27T00:00:00' );
		expect( ranking ).toContain( 'date=2026-08-26T23:59:59' );
		expect( ranking ).toContain( 'days=365' );
		// The injected year must not reach the request at all.
		expect( ranking ).not.toContain( '2022' );

		// A different section year is the change this card must ignore: it reads
		// the range from nowhere, so no second ranking request is issued.
		rerender( <PopularPostWidget attributes={ { reportParams: yearReportParams( 2023 ) } } /> );

		await waitFor( () => expect( topPostsRequests() ).toHaveLength( 1 ) );
		expect( topPostsRequests()[ 0 ] ).not.toContain( '2023' );
	} );

	it( 'links the post to its detail page on the window it ranked over', async () => {
		render( <PopularPostWidget attributes={ { reportParams: yearReportParams( 2022 ) } } /> );

		const link = await screen.findByRole( 'link', { name: 'Winning post' } );
		const search = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' ).searchParams;

		expect( search.get( 'preset' ) ).toBe( 'last-365-days' );
		expect( search.get( 'from' ) ).toContain( '2025-08-27T00:00:00' );
		expect( search.get( 'to' ) ).toContain( '2026-08-26T23:59:59' );
	} );
} );
