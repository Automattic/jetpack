/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import EmailBreakdownWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// Raw WPCOM fieldless all-time shapes the email breakdown sanitizer reads. Each
// per-breakdown endpoint returns only its own payload key, mirroring Calypso
// fetching `link` and `user-content-link` separately and merging.
const COUNTRY_RESPONSE = {
	countries: {
		data: [
			[ 'US', 1840 ],
			[ 'GB', 720 ],
		],
	},
	'countries-info': {
		US: { country_full: 'United States' },
		GB: { country_full: 'United Kingdom' },
	},
};

const INTERNAL_LINKS_RESPONSE = {
	links: {
		data: [
			[ 'post-url', 640 ],
			[ 'some-other-internal', 22 ],
		],
	},
};

const USER_CONTENT_LINKS_RESPONSE = {
	'user-content-links': { data: [ [ 'https://example.com/spring-sale', 512 ] ] },
};

/**
 * Route a mocked links-view request to the fixture matching its breakdown path.
 *
 * @param userContentResponse - Response for the `user-content-link` breakdown.
 * @param internalResponse    - Response for the `link` breakdown.
 * @return The mock implementation for `apiFetch`.
 */
function linksViewFetchMock(
	userContentResponse: unknown = USER_CONTENT_LINKS_RESPONSE,
	internalResponse: unknown = INTERNAL_LINKS_RESPONSE
) {
	return ( { path }: { path: string } ) =>
		// Match `user-content-link` first: a bare `/link` check would match it too.
		Promise.resolve(
			path.includes( '/user-content-link' ) ? userContentResponse : internalResponse
		);
}

describe( 'EmailBreakdownWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'renders the opens-by-country breakdown for the selected email', async () => {
		mockApiFetch.mockResolvedValue( COUNTRY_RESPONSE );

		render(
			<EmailBreakdownWidget
				attributes={ {
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					view: 'countries',
				} }
			/>
		);

		await expect( screen.findByText( 'United States' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'United Kingdom' ) ).toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/opens/emails/1234/country' );
	} );

	it( 'reads the clicks endpoint for dimension views when metric is clicks', async () => {
		mockApiFetch.mockResolvedValue( COUNTRY_RESPONSE );

		render(
			<EmailBreakdownWidget
				attributes={ {
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					view: 'countries',
					metric: 'clicks',
				} }
			/>
		);

		await expect( screen.findByText( 'United States' ) ).resolves.toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/clicks/emails/1234/country' );
	} );

	it( 'merges internal link types with clicked links for the links view', async () => {
		mockApiFetch.mockImplementation( linksViewFetchMock() );

		render(
			<EmailBreakdownWidget
				attributes={ {
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					view: 'links',
				} }
			/>
		);

		// User-content links render as external links opening in a new tab.
		const link = await screen.findByRole( 'link', {
			name: /https:\/\/example\.com\/spring-sale/,
		} );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/spring-sale' );
		// Known internal link types are mapped to display labels; unknown ones are
		// aggregated into "Other".
		expect( screen.getByText( 'Post URL' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Other' ) ).toBeInTheDocument();

		// The links view fetches both clicks breakdowns, matching Calypso.
		const requestedPaths = mockApiFetch.mock.calls.map( call => call[ 0 ].path as string );
		expect(
			requestedPaths.some( path => /stats\/clicks\/emails\/1234\/link(?:\?|$)/.test( path ) )
		).toBe( true );
		expect(
			requestedPaths.some( path => path.includes( 'stats/clicks/emails/1234/user-content-link' ) )
		).toBe( true );
	} );

	it( 'shows the error state when one of the two links-view queries fails on first load', async () => {
		// The `link` breakdown fails (non-retryable 403 so React Query surfaces the
		// error immediately) while `user-content-link` succeeds. Half a merged list
		// with no error would silently hide the internal link types, so the widget
		// must surface the error (with Retry) instead of the incomplete rows.
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			path.includes( '/user-content-link' )
				? Promise.resolve( USER_CONTENT_LINKS_RESPONSE )
				: Promise.reject( { status: 403, message: 'Forbidden' } )
		);

		render(
			<EmailBreakdownWidget
				attributes={ {
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					view: 'links',
				} }
			/>
		);

		await expect(
			screen.findByText( /couldn't load this email's breakdown/ )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: /https:\/\/example\.com\/spring-sale/ } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps populated rows instead of the error state when a refetch fails', async () => {
		mockApiFetch.mockResolvedValue( COUNTRY_RESPONSE );

		render(
			<EmailBreakdownWidget
				attributes={ {
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					view: 'countries',
				} }
			/>
		);

		await expect( screen.findByText( 'United States' ) ).resolves.toBeInTheDocument();

		// The next fetch fails, but the query already has data: the widget keeps
		// showing the populated rows rather than swapping in the error state.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );
		await act( async () => {
			await queryClient.refetchQueries();
		} );

		expect( screen.getByText( 'United States' ) ).toBeInTheDocument();
		expect( screen.queryByText( /couldn't load this email's breakdown/ ) ).not.toBeInTheDocument();
	} );

	it( 'renders the empty state and makes no request without a selected email', async () => {
		render( <EmailBreakdownWidget attributes={ { view: 'countries' } } /> );

		await expect(
			screen.findByText( 'Select an email to see its breakdown.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'renders an unsafe link protocol as plain text, never a clickable anchor', async () => {
		// Built by concatenation so the literal does not trip the no-script-url lint rule.
		const unsafeUrl = 'javascript' + ':alert(1)';
		mockApiFetch.mockImplementation(
			linksViewFetchMock( { 'user-content-links': { data: [ [ unsafeUrl, 99 ] ] } } )
		);

		render(
			<EmailBreakdownWidget
				attributes={ {
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					view: 'links',
				} }
			/>
		);

		// The label still renders so the row is visible, but not as an anchor.
		await expect( screen.findByText( unsafeUrl ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /alert/ } ) ).not.toBeInTheDocument();
	} );
} );
