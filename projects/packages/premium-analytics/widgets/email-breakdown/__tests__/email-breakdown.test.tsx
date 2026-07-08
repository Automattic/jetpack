/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
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

// Raw WPCOM fieldless all-time shapes the email breakdown sanitizer reads.
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

const LINK_RESPONSE = {
	links: { data: [ [ 'post-url', 640 ] ] },
	'user-content-links': { data: [ [ 'https://example.com/spring-sale', 512 ] ] },
};

describe( 'EmailBreakdownWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'renders the opens-by-country breakdown for the selected email', async () => {
		mockApiFetch.mockResolvedValue( COUNTRY_RESPONSE );

		render( <EmailBreakdownWidget attributes={ { postId: 1234, view: 'countries' } } /> );

		await expect( screen.findByText( 'United States' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'United Kingdom' ) ).toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/opens/emails/1234/country' );
	} );

	it( 'reads the clicks endpoint and renders clicked links for the links view', async () => {
		mockApiFetch.mockResolvedValue( LINK_RESPONSE );

		render( <EmailBreakdownWidget attributes={ { postId: 1234, view: 'links' } } /> );

		// User-content links render as external links opening in a new tab.
		const link = await screen.findByRole( 'link', {
			name: /https:\/\/example\.com\/spring-sale/,
		} );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/spring-sale' );
		// Known internal link types are mapped to display labels.
		expect( screen.getByText( 'Post URL' ) ).toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/clicks/emails/1234/user-content-link' );
	} );

	it( 'renders the empty state and makes no request without a selected email', async () => {
		render( <EmailBreakdownWidget attributes={ { view: 'countries' } } /> );

		await expect(
			screen.findByText( 'No country data for this email yet.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'renders an unsafe link protocol as plain text, never a clickable anchor', async () => {
		// Built by concatenation so the literal does not trip the no-script-url lint rule.
		const unsafeUrl = 'javascript' + ':alert(1)';
		mockApiFetch.mockResolvedValue( {
			links: { data: [] },
			'user-content-links': { data: [ [ unsafeUrl, 99 ] ] },
		} );

		render( <EmailBreakdownWidget attributes={ { postId: 1234, view: 'links' } } /> );

		// The label still renders so the row is visible, but not as an anchor.
		await expect( screen.findByText( unsafeUrl ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /alert/ } ) ).not.toBeInTheDocument();
	} );
} );
