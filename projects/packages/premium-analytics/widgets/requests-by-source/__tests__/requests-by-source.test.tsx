/**
 * External dependencies
 */
import { useStatsEdgeBotRequests } from '@jetpack-premium-analytics/data';
import { screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { renderWithActionsHost } from '../../../tests/js/widget-host-test-utils';
import RequestsBySource from '../render';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsEdgeBotRequests: jest.fn(),
} ) );

const mockUseStatsEdgeBotRequests = jest.mocked( useStatsEdgeBotRequests );

function requestsResult( summary: Record< string, number > ) {
	return {
		primary: {
			data: {
				summary,
				data: [
					{ date_start: '2026-11-01T00:00:00', date_end: '2026-11-01T23:59:59', ...summary },
				],
			},
		},
		timezone: 'UTC',
		isLoading: false,
		isFetching: false,
		isError: false,
		refetch: jest.fn(),
	} as unknown as ReturnType< typeof useStatsEdgeBotRequests >;
}

function renderWidget( reportParams: Partial< ReportParams > ) {
	return renderWithActionsHost(
		<RequestsBySource attributes={ { reportParams: reportParams as ReportParams } } />
	);
}

describe( 'RequestsBySource', () => {
	beforeEach( () => {
		mockUseStatsEdgeBotRequests.mockReset();
	} );

	it( 'shows each source with its total and its share of every request', () => {
		mockUseStatsEdgeBotRequests.mockReturnValue(
			requestsResult( { human: 600, ai: 250, other: 100, blocked: 50 } )
		);

		renderWidget( { from: '2026-11-01', to: '2026-11-07', interval: 'day' } );

		const totals = screen.getAllByRole( 'listitem' ).map( item => item.textContent );
		expect( totals ).toEqual( [
			'Human60060% of requests',
			'AI bots25025% of requests',
			'Other bots10010% of requests',
			'Blocked505% of requests',
		] );
	} );

	it.each( [
		[ 'a single day', '2026-11-01', 'day', { granularity: 'hour', bucket: undefined } ],
		[ 'a week', '2026-11-07', 'day', { granularity: 'day', bucket: undefined } ],
		[ '90 days', '2027-01-29', 'week', { granularity: 'day', bucket: 'week' } ],
		[ 'a year', '2027-10-31', 'month', { granularity: 'day', bucket: 'month' } ],
	] as const )( 'asks for %s by the page interval', ( _, to, interval, params ) => {
		mockUseStatsEdgeBotRequests.mockReturnValue(
			requestsResult( { human: 1, ai: 0, other: 0, blocked: 0 } )
		);

		renderWidget( { from: '2026-11-01', to, interval } );

		const [ lastParams ] = mockUseStatsEdgeBotRequests.mock.lastCall ?? [];
		expect( lastParams ).toMatchObject( params );
	} );

	it( 'shows the shared empty state rather than an empty chart', () => {
		mockUseStatsEdgeBotRequests.mockReturnValue(
			requestsResult( { human: 0, ai: 0, other: 0, blocked: 0 } )
		);

		renderWidget( { from: '2026-11-01', to: '2026-11-07', interval: 'day' } );

		expect( screen.getByText( 'We couldn’t find results for this time period.' ) ).toBeVisible();
		expect( screen.queryByRole( 'listitem' ) ).not.toBeInTheDocument();
	} );

	it( 'asks for a shorter period when the range is longer than the edge data serves', () => {
		mockUseStatsEdgeBotRequests.mockReturnValue(
			requestsResult( { human: 0, ai: 0, other: 0, blocked: 0 } )
		);

		renderWidget( { from: '2023-11-08', to: '2026-11-07', interval: 'month' } );

		expect( screen.getByText( /Choose a shorter period\./ ) ).toBeVisible();
	} );
} );
