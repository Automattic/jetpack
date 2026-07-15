/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import ReferrersWidget, { toReferrerRow } from '../render';
import type { StatsReferrersComparisonItem } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

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

describe( 'ReferrersWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( REFERRERS_RESPONSE );
	} );

	it( 'drills down through nested referrer groups and navigates back', async () => {
		render(
			<ReferrersWidget
				attributes={ { max: 10, reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const groupButton = await screen.findByRole( 'button', {
			name: /view referrers for search engines/i,
		} );

		fireEvent.click( groupButton ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		// Second level: sources inside the group can drill down again, and the
		// back link points at the full top-level list.
		await expect(
			screen.findByRole( 'button', { name: /all referrers/i } )
		).resolves.toBeInTheDocument();
		const sourceButton = await screen.findByRole( 'button', {
			name: /view referrers for google search/i,
		} );

		fireEvent.click( sourceButton ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		// Third level: URL-backed leaf domains render as outbound links and the
		// back link is labelled after the parent list.
		await expect( screen.findByText( 'google.com' ) ).resolves.toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button', { name: /search engines/i } ) ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		// Back at the second level, going back again returns to the top list.
		await expect(
			screen.findByRole( 'button', { name: /view referrers for google search/i } )
		).resolves.toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button', { name: /all referrers/i } ) ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		await expect( screen.findByText( 'jetpack.com' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /all referrers/i } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the drill-down across date range changes while the path still resolves', async () => {
		const { rerender } = render(
			<ReferrersWidget
				attributes={ { max: 10, reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const groupButton = await screen.findByRole( 'button', {
			name: /view referrers for search engines/i,
		} );

		fireEvent.click( groupButton ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		await expect(
			screen.findByRole( 'button', { name: /view all referrers/i } )
		).resolves.toBeInTheDocument();

		// The new range still contains the drilled group, so the selection
		// survives — matching how Locations keeps its country across ranges.
		rerender(
			<ReferrersWidget
				attributes={ { max: 10, reportParams: getDefaultQueryParams( false, 'last-30-days' ) } }
			/>
		);

		await expect(
			screen.findByRole( 'button', { name: /view referrers for google search/i } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /view all referrers/i } ) ).toBeInTheDocument();
	} );

	it( 'resets the drill-down when the drilled group disappears from the data', async () => {
		const { rerender } = render(
			<ReferrersWidget
				attributes={ { max: 10, reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const groupButton = await screen.findByRole( 'button', {
			name: /view referrers for search engines/i,
		} );

		fireEvent.click( groupButton ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
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
				attributes={ { max: 10, reportParams: getDefaultQueryParams( false, 'last-30-days' ) } }
			/>
		);

		await waitFor( () =>
			expect(
				screen.queryByRole( 'button', { name: /view all referrers/i } )
			).not.toBeInTheDocument()
		);
		await expect( screen.findByText( 'jetpack.com' ) ).resolves.toBeInTheDocument();
	} );

	it( 'renders childless referrers with a URL as outbound links that open in a new tab', async () => {
		render(
			<ReferrersWidget
				attributes={ { max: 10, reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const link = await screen.findByRole( 'link', { name: /jetpack\.com/i } );
		expect( link ).toHaveAttribute( 'href', 'https://jetpack.com/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
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
