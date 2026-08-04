/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import Emails, { EmailsLeaderboard, type EmailRow } from '../render';
import type { EmailMetric } from '../widget';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const rows: EmailRow[] = [
	{
		id: 12,
		postId: 12,
		link: 'https://example.com/newsletter/',
		label: 'Monthly newsletter',
		opensRate: 42,
		clicksRate: 7,
	},
];

function renderLeaderboard( metric: EmailMetric ) {
	return render(
		<WidgetRoot
			attributes={ {
				reportParams: { from: '2026-06-01', to: '2026-06-30' },
			} }
		>
			<EmailsLeaderboard rows={ rows } metric={ metric } />
		</WidgetRoot>
	);
}

describe( 'EmailsLeaderboard', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it.each( [
		[ 'opens', 'email-opens' ],
		[ 'clicks', 'email-clicks' ],
	] as const )( 'opens the matching detail tab for the %s metric', ( metric, expectedSection ) => {
		renderLeaderboard( metric );

		const link = screen.getByRole( 'link', { name: 'Monthly newsletter' } );
		const url = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );

		expect( url.pathname ).toBe( '/post/12' );
		expect( url.searchParams.get( 'from' ) ).toBe( '2026-06-01' );
		expect( url.searchParams.get( 'section' ) ).toBe( expectedSection );
		expect( url.searchParams.get( 'post_url' ) ).toBe( 'https://example.com/newsletter/' );
	} );

	it( 'carries the report post ID and URL into the rendered detail link', async () => {
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-30',
			posts: [
				{
					id: 71,
					title: 'API newsletter',
					href: 'https://example.com/api-newsletter/',
					opens: 30,
					clicks: 4,
					opens_rate: 30,
					clicks_rate: 4,
					unique_opens: 24,
					unique_clicks: 3,
					total_sends: 100,
				},
			],
		} );

		render(
			<Emails
				attributes={ {
					metric: 'opens',
					reportParams: getDefaultQueryParams( false, 'last-7-days' ),
				} }
			/>
		);

		const link = await screen.findByRole( 'link', { name: 'API newsletter' } );
		const url = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );

		expect( url.pathname ).toBe( '/post/71' );
		expect( url.searchParams.get( 'post_url' ) ).toBe( 'https://example.com/api-newsletter/' );
		expect( url.searchParams.get( 'section' ) ).toBe( 'email-opens' );
	} );
} );
