/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { captureCsvDownloads } from '../../test-utils';
import ClicksWidget, { toClickRows, toClickRowsWithComparison } from '../render';
import type { StatsClicksItem, StatsNormalizedReport } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const CLICKS_RESPONSE = {
	date: '2026-06-29',
	days: {},
	summary: {
		clicks: [
			{
				name: 'wordpress.org',
				views: 42,
				icon: 'https://www.google.com/s2/favicons?domain=wordpress.org&sz=32',
				children: [
					{
						name: 'wordpress.org/plugins/jetpack-search',
						views: 42,
						url: 'https://wordpress.org/plugins/jetpack-search',
					},
				],
			},
			{
				name: 'jetpack.com',
				views: 18,
				url: 'https://jetpack.com/',
			},
		],
	},
};

describe( 'ClicksWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( CLICKS_RESPONSE );
	} );

	it( 'drills down from top-level domains to clicked links', async () => {
		render(
			<ClicksWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const drillDownButton = await screen.findByRole( 'button', {
			name: /view clicked links for wordpress\.org/i,
		} );
		expect( screen.queryByRole( 'link', { name: /wordpress\.org/i } ) ).not.toBeInTheDocument();

		fireEvent.click( drillDownButton ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		const link = await screen.findByRole( 'link', {
			name: /\/plugins\/jetpack-search/i,
		} );
		expect( link ).toHaveAttribute( 'href', 'https://wordpress.org/plugins/jetpack-search' );

		const backLink = screen.getByRole( 'button', { name: /view all clicks/i } );
		fireEvent.click( backLink ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		await expect(
			screen.findByRole( 'button', {
				name: /view clicked links for wordpress\.org/i,
			} )
		).resolves.toBeInTheDocument();
	} );

	it( 'renders childless top-level URLs as external links', async () => {
		render(
			<ClicksWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const link = await screen.findByRole( 'link', { name: /jetpack\.com/i } );
		expect( link ).toHaveAttribute( 'href', 'https://jetpack.com/' );
	} );

	it( 'links to the Clicks report', () => {
		render( <ClicksWidget attributes={ {} } /> );

		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/clicks' )
		);
	} );

	it( 'clears the stored drill-down when the selected link leaves the data', async () => {
		const { rerender } = render(
			<ClicksWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const drillDownButton = await screen.findByRole( 'button', {
			name: /view clicked links for wordpress\.org/i,
		} );
		fireEvent.click( drillDownButton ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		await expect(
			screen.findByRole( 'button', { name: /view all clicks/i } )
		).resolves.toBeInTheDocument();

		// The next range's report no longer contains the drilled domain, so the
		// stale selection is dropped once the new data settles (WOOA7S-1666).
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-29',
			days: {},
			summary: {
				clicks: [
					{
						name: 'jetpack.com',
						views: 18,
						url: 'https://jetpack.com/',
					},
				],
			},
		} );
		rerender(
			<ClicksWidget
				attributes={ { reportParams: getDefaultQueryParams( false, 'last-30-days' ) } }
			/>
		);

		await waitFor( () =>
			expect( screen.queryByRole( 'button', { name: /view all clicks/i } ) ).not.toBeInTheDocument()
		);
		await expect(
			screen.findByRole( 'link', { name: /jetpack\.com/i } )
		).resolves.toBeInTheDocument();
	} );
} );

describe( 'toClickRows', () => {
	it( 'merges comparison values by URL before slicing primary rows', () => {
		const primary = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-29',
					date_start: '2026-06-29 00:00:00',
					date_end: '2026-06-29 23:59:59',
					items: [
						{
							label: 'wordpress.org',
							views: 60,
							link: null,
							icon: 'https://example.com/blavatar.png',
							labelIcon: 'external',
							children: [
								{
									label: '/plugins/jetpack-search',
									views: 42,
									link: 'https://wordpress.org/plugins/jetpack-search',
									icon: null,
									labelIcon: 'external',
									children: null,
								},
								{
									label: '/plugins/jetpack-boost/',
									views: 18,
									link: 'https://wordpress.org/plugins/jetpack-boost/',
									icon: null,
									labelIcon: 'external',
									children: null,
								},
							],
						},
						{
							label: 'jetpack.com',
							views: 18,
							link: 'https://jetpack.com/',
							icon: null,
							labelIcon: 'external',
							children: null,
						},
					] satisfies StatsClicksItem[],
				},
			],
		} satisfies StatsNormalizedReport< StatsClicksItem >;

		const comparison = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-22',
					date_start: '2026-06-22 00:00:00',
					date_end: '2026-06-22 23:59:59',
					items: [
						{
							label: 'wordpress.org',
							views: 38,
							link: null,
							icon: 'https://example.com/blavatar.png',
							labelIcon: 'external',
							children: [
								{
									label: '/plugins/jetpack-search',
									views: 30,
									link: 'https://wordpress.org/plugins/jetpack-search',
									icon: null,
									labelIcon: 'external',
									children: null,
								},
							],
						},
					] satisfies StatsClicksItem[],
				},
			],
		} satisfies StatsNormalizedReport< StatsClicksItem >;

		expect( toClickRows( primary, comparison, 1 ) ).toEqual( [
			{
				label: 'wordpress.org',
				value: 60,
				previousValue: 38,
				icon: 'https://example.com/blavatar.png',
				childrenHaveComparison: true,
				children: [
					{
						label: '/plugins/jetpack-search',
						value: 42,
						previousValue: 30,
						href: 'https://wordpress.org/plugins/jetpack-search',
						icon: 'https://example.com/blavatar.png',
						children: undefined,
					},
					{
						label: '/plugins/jetpack-boost/',
						value: 18,
						previousValue: undefined,
						href: 'https://wordpress.org/plugins/jetpack-boost/',
						icon: 'https://example.com/blavatar.png',
						children: undefined,
					},
				],
			},
		] );
	} );

	it( 'treats zero comparison values as overlapping click rows', () => {
		const primary = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-29',
					date_start: '2026-06-29 00:00:00',
					date_end: '2026-06-29 23:59:59',
					items: [
						{
							label: 'wordpress.org',
							views: 42,
							link: null,
							icon: null,
							labelIcon: 'external',
							children: [
								{
									label: '/plugins/jetpack-search',
									views: 42,
									link: 'https://wordpress.org/plugins/jetpack-search',
									icon: null,
									labelIcon: 'external',
									children: null,
								},
							],
						},
					] satisfies StatsClicksItem[],
				},
			],
		} satisfies StatsNormalizedReport< StatsClicksItem >;

		const comparison = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-22',
					date_start: '2026-06-22 00:00:00',
					date_end: '2026-06-22 23:59:59',
					items: [
						{
							label: 'wordpress.org',
							views: 0,
							link: null,
							icon: null,
							labelIcon: 'external',
							children: [
								{
									label: '/plugins/jetpack-search',
									views: 0,
									link: 'https://wordpress.org/plugins/jetpack-search',
									icon: null,
									labelIcon: 'external',
									children: null,
								},
							],
						},
					] satisfies StatsClicksItem[],
				},
			],
		} satisfies StatsNormalizedReport< StatsClicksItem >;

		expect( toClickRowsWithComparison( primary, comparison, 10 ) ).toEqual( {
			hasComparison: true,
			rows: [
				{
					label: 'wordpress.org',
					value: 42,
					previousValue: 0,
					icon: null,
					childrenHaveComparison: true,
					children: [
						{
							label: '/plugins/jetpack-search',
							value: 42,
							previousValue: 0,
							href: 'https://wordpress.org/plugins/jetpack-search',
							icon: null,
							children: undefined,
						},
					],
				},
			],
		} );
	} );

	// The guard replaced a `typeof item.link === 'string'` check, which reads like a validity
	// check — a revert to plain truthiness would reopen the sink with nothing else failing.
	it( 'omits href for a row whose link is not a safe http(s) URL', () => {
		const primary = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-29',
					date_start: '2026-06-29 00:00:00',
					date_end: '2026-06-29 23:59:59',
					items: [
						{
							label: 'evil.example',
							views: 12,
							link: 'javascript:alert(document.cookie)',
							icon: null,
							labelIcon: 'external',
							children: null,
						},
					] satisfies StatsClicksItem[],
				},
			],
		} satisfies StatsNormalizedReport< StatsClicksItem >;

		const [ row ] = toClickRows( primary, undefined, 10 );

		// The row still lists — rejecting the URL must not drop the data.
		expect( row.label ).toBe( 'evil.example' );
		expect( row.href ).toBeUndefined();
	} );
} );

describe( 'ClicksWidget CSV export', () => {
	let downloads: ReturnType< typeof captureCsvDownloads >;

	const FULL_REPORT = {
		...CLICKS_RESPONSE,
		summary: {
			clicks: [
				...CLICKS_RESPONSE.summary.clicks,
				...Array.from( { length: 11 }, ( _, index ) => ( {
					name: `site-${ index + 1 }.com`,
					views: 10 - index,
					url: `https://site-${ index + 1 }.com/`,
				} ) ),
			],
		},
	};

	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
		downloads = captureCsvDownloads();
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve( path.includes( 'max=0' ) ? FULL_REPORT : CLICKS_RESPONSE )
		);
	} );

	afterEach( () => {
		jest.useRealTimers();
		downloads.restore();
	} );

	it( 'downloads the whole Clicks report while drilled into one link', async () => {
		render(
			<ClicksWidget attributes={ { reportParams: { from: '2026-03-01', to: '2026-03-10' } } } />
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click(
			await screen.findByRole( 'button', { name: /view clicked links for wordpress\.org/i } )
		);
		await expect(
			screen.findByRole( 'button', { name: /view all clicks/i } )
		).resolves.toBeInTheDocument();
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( screen.getByRole( 'button', { name: /Download CSV/ } ) );
		await waitFor( () => expect( downloads.files ).toHaveLength( 1 ) );

		const lines = await downloads.lines();
		expect( lines[ 0 ] ).toBe( '"Clicked URL","Group","Clicks"' );
		expect( lines ).toContain( '"https://jetpack.com/","jetpack.com","18"' );
		expect( lines ).toHaveLength( 15 );
		expect( downloads.files[ 0 ].filename ).toBe( 'clicks-2026-03-01_2026-03-10.csv' );
	} );
} );
