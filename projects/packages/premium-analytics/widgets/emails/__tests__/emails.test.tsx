/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import { act, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { renderWithActionsHost } from '../../../tests/js/widget-host-test-utils';
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
		totalSends: 1000,
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
		expect( url.searchParams.get( 'ref' ) ).toBe( 'emails' );
		expect( url.searchParams.get( 'post_url' ) ).toBe( 'https://example.com/newsletter/' );
	} );

	it.each( [
		[ 'opens', '420', '42%', '420 opens, 42% open rate', 'Opens', 'Open rate' ],
		[ 'clicks', '75', '7%', '75 clicks, 7% click rate', 'Clicks', 'Click rate' ],
	] as const )(
		'shows the %s count beside its rate, under their headings',
		( metric, count, rate, description, countHeading, rateHeading ) => {
			renderEmailsList( metric );

			expect( screen.getByText( count ) ).toBeInTheDocument();
			expect( screen.getByText( rate ) ).toBeInTheDocument();
			expect( screen.getByText( 'Emails' ) ).toBeInTheDocument();
			expect( screen.getByText( countHeading ) ).toBeInTheDocument();
			expect( screen.getByText( rateHeading ) ).toBeInTheDocument();
			// Screen readers hear one sentence per row, so it must stay out of the hidden figures.
			expect(
				screen.getByText( description, {
					ignore: '[aria-hidden="true"], [aria-hidden="true"] *',
				} )
			).toBeInTheDocument();
		}
	);

	it( 'offers the live email in a new tab beside the title', () => {
		renderEmailsList( 'opens' );

		expect(
			screen.getByRole( 'link', { name: 'View "Monthly newsletter" in a new tab' } )
		).toHaveAttribute( 'href', 'https://example.com/newsletter/' );
	} );

	it.each( [
		[ 'no post ID', { link: 'https://example.com/digest/' }, 1 ],
		[ 'no public URL', { postId: 7 }, 1 ],
	] )( 'offers no "View" action for an email with %s', ( _case, overrides, links ) => {
		render(
			<WidgetRoot attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-30' } } }>
				<EmailsList rows={ [ row( { id: 7, label: 'Digest', ...overrides } ) ] } metric="opens" />
			</WidgetRoot>
		);

		expect( screen.getAllByRole( 'link' ) ).toHaveLength( links );
		expect( screen.queryByRole( 'link', { name: /^View / } ) ).not.toBeInTheDocument();
		// An empty action slot beside the label would still space it; the label holds the title alone.
		// eslint-disable-next-line testing-library/no-node-access -- An empty slot has no accessible query target.
		const label = screen.getByText( 'Digest' ).closest( 'li' )?.firstElementChild;
		// eslint-disable-next-line testing-library/no-node-access -- Its child count is the check.
		expect( label?.childElementCount ).toBe( 1 );
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

	it( 'shows an em dash for an email with no recorded sends', () => {
		render(
			<WidgetRoot attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-30' } } }>
				<EmailsList
					rows={ [ row( { id: 1, label: 'Legacy send', totalSends: 0 } ) ] }
					metric="opens"
				/>
			</WidgetRoot>
		);

		expect( screen.getByText( '—' ) ).toBeInTheDocument();
		expect( screen.getByText( '0 opens, open rate unknown' ) ).toBeInTheDocument();
	} );

	it( 'restores the exact count and its unit behind an abbreviated one', () => {
		render(
			<WidgetRoot attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-30' } } }>
				<EmailsList
					rows={ [ row( { id: 1, label: 'Big list', opens: 18432, uniqueOpens: 18000 } ) ] }
					metric="opens"
				/>
			</WidgetRoot>
		);

		expect( screen.getByText( '18.4K' ) ).toBeInTheDocument();
		expect( screen.getByText( '18,432 opens' ) ).toBeInTheDocument();
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
		expect( url.searchParams.get( 'ref' ) ).toBe( 'emails' );
	} );

	it( 'keeps the download beside the rows a failed refetch leaves on screen', async () => {
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-30',
			posts: [ { id: 71, title: 'API newsletter', opens: 30, total_sends: 100 } ],
		} );
		const { declaredAction } = renderWithActionsHost(
			<Emails attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } } />
		);
		await expect(
			screen.findByRole( 'link', { name: 'API newsletter' } )
		).resolves.toBeInTheDocument();

		mockApiFetch.mockRejectedValue( { code: 'not_found', data: { status: 404 } } );
		await act( () => queryClient.refetchQueries() );
		// React Query notifies its observers on the next macrotask.
		await act( () => new Promise( resolve => setTimeout( resolve, 0 ) ) );

		expect( screen.getByRole( 'link', { name: 'API newsletter' } ) ).toBeInTheDocument();
		expect( declaredAction( 'download-csv' ) ).toBeDefined();
	} );
} );
