/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import EmailTopRowWidget, { selectEmailRow, toEmailTopRowMetrics } from '../render';
import type { StatsEmailSummary } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const EMAIL_SUMMARY_RESPONSE = {
	posts: [
		{
			id: 2000,
			title: 'Latest newsletter',
			href: 'https://example.com/latest',
			type: 'post',
			opens_rate: 38.1,
			clicks_rate: 3.81,
			opens: 400,
			clicks: 40,
			unique_opens: 380,
			unique_clicks: 38,
			total_sends: 1000,
		},
		{
			id: 2001,
			title: 'Older newsletter',
			href: 'https://example.com/older',
			type: 'post',
			opens_rate: 22.5,
			clicks_rate: 2.1,
			opens: 200,
			clicks: 18,
			unique_opens: 190,
			unique_clicks: 17,
			total_sends: 900,
		},
	],
};

describe( 'EmailTopRowWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( EMAIL_SUMMARY_RESPONSE );
	} );

	it( 'renders the selected email totals as metric tiles', async () => {
		render(
			<EmailTopRowWidget
				attributes={ { postId: 2000, reportParams: getDefaultQueryParams( false ) } }
			/>
		);

		// The tile captions for the selected email.
		await expect( screen.findByText( 'Total sends' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Unique opens' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Open rate' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Click rate' ) ).toBeInTheDocument();

		// The open rate is formatted as a percentage from the 0–100 rate.
		expect( screen.getByText( '38.1%' ) ).toBeInTheDocument();
	} );

	it( 'shows the empty state when the selected email is not in the summary', async () => {
		render(
			<EmailTopRowWidget
				attributes={ { postId: 9999, reportParams: getDefaultQueryParams( false ) } }
			/>
		);

		await expect(
			screen.findByText( 'Select an email to see its opens and clicks.' )
		).resolves.toBeInTheDocument();
	} );
} );

describe( 'selectEmailRow', () => {
	const report = {
		summary: {},
		data: [
			{
				time_interval: 'alltime',
				date_start: '',
				date_end: '',
				items: [
					{
						id: 2000,
						label: 'Latest newsletter',
						value: 400,
						opens: 400,
						clicks: 40,
						opens_rate: 38.1,
						clicks_rate: 3.81,
						unique_opens: 380,
						unique_clicks: 38,
						total_sends: 1000,
						children: null,
					},
				],
			},
		],
	} as unknown as StatsEmailSummary;

	it( 'returns undefined when no email is selected', () => {
		expect( selectEmailRow( report, undefined ) ).toBeUndefined();
	} );

	it( 'returns undefined when the email is not present', () => {
		expect( selectEmailRow( report, 1234 ) ).toBeUndefined();
	} );

	it( 'matches the row by post ID', () => {
		expect( selectEmailRow( report, 2000 )?.total_sends ).toBe( 1000 );
	} );
} );

describe( 'toEmailTopRowMetrics', () => {
	it( 'maps counts and converts 0–100 rates to fractions in order', () => {
		const metrics = toEmailTopRowMetrics( {
			id: 2000,
			label: 'Latest newsletter',
			value: 400,
			opens: 400,
			clicks: 40,
			opens_rate: 38.1,
			clicks_rate: 3.81,
			unique_opens: 380,
			unique_clicks: 38,
			total_sends: 1000,
			children: null,
		} );

		expect( metrics.map( metric => metric.key ) ).toEqual( [
			'total_sends',
			'opens',
			'unique_opens',
			'opens_rate',
			'clicks',
			'clicks_rate',
		] );
		expect( metrics.find( metric => metric.key === 'opens_rate' )?.value ).toBeCloseTo( 0.381 );
		expect( metrics.find( metric => metric.key === 'total_sends' )?.value ).toBe( 1000 );
	} );
} );
