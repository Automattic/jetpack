/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import ReachWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const FOLLOWERS_RESPONSE = {
	page: 1,
	pages: 1,
	total: 30,
	total_email: 18,
	total_wpcom: 12,
	subscribers: [],
};

const PUBLICIZE_RESPONSE = {
	services: [
		{ service: 'facebook', followers: 24 },
		{ service: 'twitter', followers: 15 },
	],
};

// Resolves each proxied Stats endpoint the widget requests: `stats/followers`
// for the WordPress.com / email totals and `stats/publicize` for the connected
// social services.
function routeRequest( { path }: { path: string } ) {
	if ( path.includes( 'stats/publicize' ) ) {
		return Promise.resolve( PUBLICIZE_RESPONSE );
	}
	return Promise.resolve( FOLLOWERS_RESPONSE );
}

describe( 'ReachWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockImplementation( routeRequest );
	} );

	it( 'ranks every subscriber channel by follower count', async () => {
		render( <ReachWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Facebook' ) ).resolves.toBeInTheDocument();

		// Assert the rendered order, not just presence: highest count first —
		// Facebook (24), Email (18), Twitter (15), WordPress.com (12). Comparing the
		// DOM-ordered labels against the expected sequence catches a sort regression
		// that a presence-only check would miss.
		const rankedLabels = screen.getAllByText( /^(Facebook|Email|Twitter|WordPress\.com)$/ );
		expect( rankedLabels ).toEqual( [
			screen.getByText( 'Facebook' ),
			screen.getByText( 'Email' ),
			screen.getByText( 'Twitter' ),
			screen.getByText( 'WordPress.com' ),
		] );
	} );

	it( 'omits channels with no followers', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) => {
			if ( path.includes( 'stats/publicize' ) ) {
				return Promise.resolve( { services: [] } );
			}
			return Promise.resolve( { total_email: 18, total_wpcom: 0, subscribers: [] } );
		} );

		render( <ReachWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Email' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'WordPress.com' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the empty state when there are no subscribers', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) => {
			if ( path.includes( 'stats/publicize' ) ) {
				return Promise.resolve( { services: [] } );
			}
			return Promise.resolve( { total_email: 0, total_wpcom: 0, subscribers: [] } );
		} );

		render( <ReachWidget attributes={ {} } /> );

		await expect( screen.findByText( 'No subscribers yet.' ) ).resolves.toBeInTheDocument();
	} );

	it( 'still renders followers reach when the Publicize request fails', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) => {
			if ( path.includes( 'stats/publicize' ) ) {
				// A 401/403 rejection resolves deterministically (no retry), matching a
				// plan- or permission-gated Publicize endpoint.
				return Promise.reject( { status: 403 } );
			}
			return Promise.resolve( FOLLOWERS_RESPONSE );
		} );

		render( <ReachWidget attributes={ {} } /> );

		// The supplementary Publicize failure must not hide the WordPress.com / email reach.
		await expect( screen.findByText( 'Email' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'WordPress.com' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Unable to load your reach.' ) ).not.toBeInTheDocument();
	} );
} );
