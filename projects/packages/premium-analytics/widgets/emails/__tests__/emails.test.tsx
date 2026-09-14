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
import Emails, { EmailsList, type EmailRow } from '../render';
import type { EmailMetric } from '../widget';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

function row( overrides: Partial< EmailRow > & Pick< EmailRow, 'id' | 'label' > ): EmailRow {
	return {
		opens: 0,
		uniqueOpens: 0,
		opensRate: 0,
		clicks: 0,
		uniqueClicks: 0,
		clicksRate: 0,
		...overrides,
	};
}

const rows: EmailRow[] = [
	row( {
		id: 12,
		postId: 12,
		link: 'https://example.com/newsletter/',
		label: 'Monthly newsletter',
		opens: 420,
		uniqueOpens: 400,
		opensRate: 42,
		clicks: 75,
		uniqueClicks: 70,
		clicksRate: 7,
	} ),
];

function renderEmailsList( metric: EmailMetric ) {
	return render(
		<WidgetRoot
			attributes={ {
				reportParams: { from: '2026-06-01', to: '2026-06-30' },
			} }
		>
			<EmailsList rows={ rows } metric={ metric } />
		</WidgetRoot>
	);
}

describe( 'EmailsList', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it.each( [
		[ 'opens', 'email-opens' ],
		[ 'clicks', 'email-clicks' ],
	] as const )( 'opens the matching detail tab for the %s metric', ( metric, expectedSection ) => {
		renderEmailsList( metric );

		const link = screen.getByRole( 'link', { name: 'Monthly newsletter' } );
		const url = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );

		expect( url.pathname ).toBe( '/post/12' );
		expect( url.searchParams.get( 'from' ) ).toBe( '2026-06-01' );
		expect( url.searchParams.get( 'section' ) ).toBe( expectedSection );
		expect( url.searchParams.get( 'post_url' ) ).toBe( 'https://example.com/newsletter/' );
	} );

	it.each( [
		[ 'opens', '420', '42%', '420 opens, 42% open rate' ],
		[ 'clicks', '75', '7%', '75 clicks, 7% click rate' ],
	] as const )( 'shows the %s count beside its rate', ( metric, count, rate, description ) => {
		renderEmailsList( metric );

		expect( screen.getByText( count ) ).toBeInTheDocument();
		expect( screen.getByText( rate ) ).toBeInTheDocument();
		expect( screen.getByText( description ) ).toBeInTheDocument();
	} );

	it( 'keeps rows in the same order for either metric', () => {
		const orderRows = [
			row( { id: 1, label: 'Newer', opens: 5, clicks: 50 } ),
			row( { id: 2, label: 'Older', opens: 50, clicks: 5 } ),
		];
		const labelsFor = ( metric: EmailMetric ) => {
			const { unmount } = render(
				<WidgetRoot attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-30' } } }>
					<EmailsList rows={ orderRows } metric={ metric } />
				</WidgetRoot>
			);
			const labels = screen.getAllByRole( 'listitem' ).map( item => item.textContent );
			unmount();
			return labels;
		};

		expect( labelsFor( 'opens' )[ 0 ] ).toContain( 'Newer' );
		expect( labelsFor( 'clicks' )[ 0 ] ).toContain( 'Newer' );
	} );

	it( 'renders the rate at two decimals, trimming a trailing zero', () => {
		render(
			<WidgetRoot attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-30' } } }>
				<EmailsList
					rows={ [
						row( { id: 1, label: 'Half a percent', opensRate: 11.5 } ),
						row( { id: 2, label: 'Three decimals', opensRate: 3.814 } ),
					] }
					metric="opens"
				/>
			</WidgetRoot>
		);

		expect( screen.getByText( '11.5%' ) ).toBeInTheDocument();
		expect( screen.getByText( '3.81%' ) ).toBeInTheDocument();
	} );

	it( 'shows an em dash for a click rate with no attributable recipient', () => {
		render(
			<WidgetRoot attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-30' } } }>
				<EmailsList
					rows={ [ row( { id: 1, label: 'Scanned links', clicks: 12, uniqueClicks: 0 } ) ] }
					metric="clicks"
				/>
			</WidgetRoot>
		);

		expect( screen.getByText( '12' ) ).toBeInTheDocument();
		expect( screen.getByText( '—' ) ).toBeInTheDocument();
		expect( screen.getByText( '12 clicks, click rate unknown' ) ).toBeInTheDocument();
	} );

	it( 'restores the exact count behind an abbreviated one', () => {
		render(
			<WidgetRoot attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-30' } } }>
				<EmailsList
					rows={ [ row( { id: 1, label: 'Big list', opens: 18432, uniqueOpens: 18000 } ) ] }
					metric="opens"
				/>
			</WidgetRoot>
		);

		expect( screen.getByText( '18.4K' ) ).toBeInTheDocument();
		expect( screen.getByText( '18,432' ) ).toBeInTheDocument();
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
