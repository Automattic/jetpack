/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import ClicksWidget, { toClickRows } from '../render';
import type { StatsClicksItem, StatsNormalizedReport } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const CLICKS_RESPONSE = {
	date: '2026-06-29',
	days: {},
	summary: {
		clicks: [
			{
				name: 'wordpress.org',
				views: 42,
				url: 'https://wordpress.org/',
				icon: 'https://www.google.com/s2/favicons?domain=wordpress.org&sz=32',
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

	it( 'renders fetched clicked links', async () => {
		render(
			<ClicksWidget
				attributes={ { max: 10, reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		const link = await screen.findByRole( 'link', { name: /wordpress\.org/ } );
		expect( link ).toHaveAttribute( 'href', 'https://wordpress.org/' );
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
							views: 42,
							link: 'https://wordpress.org/',
							icon: null,
							labelIcon: 'external',
							children: null,
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
							views: 30,
							link: 'https://wordpress.org/',
							icon: null,
							labelIcon: 'external',
							children: null,
						},
					] satisfies StatsClicksItem[],
				},
			],
		} satisfies StatsNormalizedReport< StatsClicksItem >;

		expect( toClickRows( primary, comparison, 1 ) ).toEqual( [
			{
				label: 'wordpress.org',
				value: 42,
				previousValue: 30,
				href: 'https://wordpress.org/',
				icon: null,
			},
		] );
	} );
} );
