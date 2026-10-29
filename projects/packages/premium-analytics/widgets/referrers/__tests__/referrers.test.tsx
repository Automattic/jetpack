/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { RegistryProvider } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { createNoticesRegistry } from '../../../tests/js/notice-test-utils';
import { createWidgetActionsHost } from '../../../tests/js/widget-host-test-utils';
import ReferrersWidget, { toReferrerRow } from '../render';
import type { StatsReferrersComparisonItem } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const REFERRERS_RESPONSE = {
	date: '2026-06-29',
	days: {},
	summary: {
		groups: [
			{
				group: 'Search Engines',
				name: 'Search Engines',
				icon: 'https://wordpress.com/i/stats/search-engine.png',
				total: 4801,
				results: [
					{
						name: 'Google Search',
						icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=32',
						views: 3936,
						children: [
							{
								name: 'google.com',
								url: 'https://www.google.com/',
								views: 3920,
							},
						],
					},
					{
						name: 'Bing',
						icon: 'https://www.google.com/s2/favicons?domain=bing.com&sz=32',
						views: 542,
						children: [
							{
								name: 'bing.com',
								url: 'https://www.bing.com/',
								views: 523,
							},
						],
					},
				],
			},
			{
				group: 'jetpack.com',
				name: 'jetpack.com',
				url: 'https://jetpack.com/',
				total: 18,
				results: { views: 18 },
			},
		],
		other_views: 0,
		total_views: 4819,
	},
};

const DOMAIN_GROUP_REFERRERS_RESPONSE = {
	date: '2026-06-29',
	days: {},
	summary: {
		groups: [
			{
				group: 'example.com',
				name: 'example.com',
				total: 30,
				results: [
					{ name: 'example.com/', url: 'https://example.com/', views: 20 },
					{ name: 'example.com/about/', url: 'https://example.com/about/', views: 10 },
				],
			},
		],
		other_views: 0,
		total_views: 30,
	},
};

// A single-result group renders as the result itself, so this is the shortest
// path from an API-supplied URL to a rendered anchor.
const HOSTILE_REFERRERS_RESPONSE = {
	date: '2026-06-29',
	days: {},
	summary: {
		groups: [
			{
				group: 'evil.example',
				name: 'evil.example',
				url: 'javascript:alert(document.cookie)',
				total: 12,
				results: { views: 12 },
			},
		],
		other_views: 0,
		total_views: 12,
	},
};

describe( 'ReferrersWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( REFERRERS_RESPONSE );
	} );

	it( 'drills down through nested referrer groups and navigates back', async () => {
		const user = userEvent.setup();
		render(
			<ReferrersWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const groupButton = await screen.findByRole( 'button', {
			name: /view referrers for search engines/i,
		} );

		await user.click( groupButton );

		// Second level: sources inside the group can drill down again, and the
		// back link points at the full top-level list.
		await expect(
			screen.findByRole( 'button', { name: /all referrers/i } )
		).resolves.toBeInTheDocument();
		const sourceButton = await screen.findByRole( 'button', {
			name: /view referrers for google search/i,
		} );

		await user.click( sourceButton );

		// Third level: URL-backed leaf domains list with a "View" action and the
		// back link is labelled after the parent list.
		await expect( screen.findByText( 'google.com' ) ).resolves.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: /search engines/i } ) );

		// Back at the second level, going back again returns to the top list.
		await expect(
			screen.findByRole( 'button', { name: /view referrers for google search/i } )
		).resolves.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: /all referrers/i } ) );

		await expect( screen.findByText( 'jetpack.com' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /all referrers/i } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the drill-down across date range changes while the path still resolves', async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<ReferrersWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const groupButton = await screen.findByRole( 'button', {
			name: /view referrers for search engines/i,
		} );

		await user.click( groupButton );
		await expect(
			screen.findByRole( 'button', { name: /view all referrers/i } )
		).resolves.toBeInTheDocument();

		// The new range still contains the drilled group, so the selection
		// survives — matching how Locations keeps its country across ranges.
		rerender(
			<ReferrersWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-30-days' ) } }
			/>
		);

		await expect(
			screen.findByRole( 'button', { name: /view referrers for google search/i } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /view all referrers/i } ) ).toBeInTheDocument();
	} );

	it( 'resets the drill-down when the drilled group disappears from the data', async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<ReferrersWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const groupButton = await screen.findByRole( 'button', {
			name: /view referrers for search engines/i,
		} );

		await user.click( groupButton );
		await expect(
			screen.findByRole( 'button', { name: /view all referrers/i } )
		).resolves.toBeInTheDocument();

		// The next range's report no longer contains the drilled group, so the
		// stale path is dropped once the new data settles.
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-29',
			days: {},
			summary: {
				groups: [
					{
						group: 'jetpack.com',
						name: 'jetpack.com',
						url: 'https://jetpack.com/',
						total: 18,
						results: { views: 18 },
					},
				],
				other_views: 0,
				total_views: 18,
			},
		} );
		rerender(
			<ReferrersWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-30-days' ) } }
			/>
		);

		await waitFor( () =>
			expect(
				screen.queryByRole( 'button', { name: /view all referrers/i } )
			).not.toBeInTheDocument()
		);
		await expect( screen.findByText( 'jetpack.com' ) ).resolves.toBeInTheDocument();
	} );

	it( 'offers a childless referrer with a URL from a "View in new tab" action, not from its name', async () => {
		render(
			<ReferrersWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const view = await screen.findByRole( 'link', { name: 'View "jetpack.com" in a new tab' } );
		expect( view ).toHaveAttribute( 'href', 'https://jetpack.com/' );
		expect( view ).toHaveAttribute( 'target', '_blank' );
		expect( screen.queryByRole( 'link', { name: /^jetpack\.com/i } ) ).not.toBeInTheDocument();
	} );

	it( 'marks a childless referrer as spam from its row action and drops the row', async () => {
		const user = userEvent.setup();
		const { registry, createSuccessNotice } = createNoticesRegistry();

		render(
			<RegistryProvider value={ registry }>
				<ReferrersWidget
					attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
				/>
			</RegistryProvider>
		);

		await user.click( await screen.findByRole( 'button', { name: 'Mark "jetpack.com" as spam' } ) );
		const dialog = await screen.findByRole( 'alertdialog', { name: 'Mark as spam' } );
		await user.click( within( dialog ).getByRole( 'button', { name: 'Mark as spam' } ) );

		await waitFor( () => expect( screen.queryByTitle( 'jetpack.com' ) ).not.toBeInTheDocument() );
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				method: 'POST',
				path: expect.stringContaining( 'stats/referrers/spam/new?domain=jetpack.com' ),
			} )
		);
		expect( createSuccessNotice ).toHaveBeenCalledWith(
			'"jetpack.com" marked as spam.',
			expect.objectContaining( { type: 'snackbar' } )
		);
		// Search Engines is a named source, not a domain, so it offers no spam action.
		expect( screen.queryByRole( 'button', { name: /as spam$/ } ) ).not.toBeInTheDocument();
	} );

	it( 'offers "Mark as spam" on a domain group that drills down, without drilling down', async () => {
		const user = userEvent.setup();
		mockApiFetch.mockResolvedValue( DOMAIN_GROUP_REFERRERS_RESPONSE );

		render(
			<ReferrersWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const spam = await screen.findByRole( 'button', { name: 'Mark "example.com" as spam' } );
		expect(
			screen.getByRole( 'button', { name: 'View referrers for example.com' } )
		).toBeInTheDocument();

		await user.click( spam );

		const dialog = screen.getByRole( 'alertdialog', { name: 'Mark as spam' } );
		// The dialog renders in a portal; React still bubbles its clicks to the row.
		await user.click( within( dialog ).getByText( /Are you sure/ ) );
		await user.click( within( dialog ).getByRole( 'button', { name: 'Cancel' } ) );

		expect( screen.queryByRole( 'button', { name: /all referrers/i } ) ).not.toBeInTheDocument();
	} );

	// Referrer rows derive from inbound request data rather than anything the site
	// owner authored, and the scheme is not guaranteed by the API contract.
	it( 'renders a referrer with an unsafe URL as plain text instead of a link', async () => {
		mockApiFetch.mockResolvedValue( HOSTILE_REFERRERS_RESPONSE );

		render(
			<ReferrersWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		// The row still lists — rejecting the URL must not drop the data.
		await expect( screen.findByTitle( 'evil.example' ) ).resolves.toBeInTheDocument();

		expect( screen.queryByRole( 'link', { name: /evil\.example/i } ) ).not.toBeInTheDocument();
		screen.queryAllByRole( 'link' ).forEach( link => {
			expect( link ).not.toHaveAttribute( 'href', expect.stringMatching( /^javascript:/i ) );
		} );
	} );

	it( 'declares the CSV download to its host once the rows settle', async () => {
		mockApiFetch.mockResolvedValue( REFERRERS_RESPONSE );
		const { WidgetActionsHost, declaredActions } = createWidgetActionsHost();

		render(
			<WidgetActionsHost>
				<ReferrersWidget
					attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
				/>
			</WidgetActionsHost>
		);

		await expect(
			screen.findByRole( 'button', { name: /view referrers for search engines/i } )
		).resolves.toBeInTheDocument();

		await waitFor( () =>
			expect( declaredActions() ).toEqual( [
				expect.objectContaining( { id: 'download-csv', relevance: 'medium' } ),
			] )
		);
	} );
} );

describe( 'toReferrerRow', () => {
	it( 'maps merged data-layer items onto leaderboard rows', () => {
		const item: StatsReferrersComparisonItem = {
			label: 'Search Engines',
			views: 4801,
			previousValue: 4100,
			link: null,
			icon: 'https://example.com/search-engine.png',
			labelIcon: null,
			childrenHaveComparison: true,
			children: [
				{
					label: 'google.com',
					views: 3920,
					previousValue: undefined,
					link: 'https://www.google.com/',
					icon: 'https://example.com/google.png',
					labelIcon: 'external',
					children: null,
					childrenHaveComparison: false,
				},
			],
		};

		expect( toReferrerRow( item ) ).toEqual( {
			label: 'Search Engines',
			value: 4801,
			previousValue: 4100,
			href: undefined,
			icon: 'https://example.com/search-engine.png',
			childrenHaveComparison: true,
			children: [
				{
					label: 'google.com',
					value: 3920,
					// Missing comparison matches stay undefined so the chart
					// suppresses the delta instead of showing a fake change.
					previousValue: undefined,
					href: 'https://www.google.com/',
					icon: 'https://example.com/google.png',
					children: undefined,
				},
			],
		} );
	} );
} );
