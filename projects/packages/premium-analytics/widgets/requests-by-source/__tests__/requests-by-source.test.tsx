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

function report( day: string, summary: Record< string, number > ) {
	return {
		summary,
		data: [ { date_start: `${ day }T00:00:00`, date_end: `${ day }T23:59:59`, ...summary } ],
	};
}

function requestsResult(
	summary: Record< string, number >,
	comparisonSummary?: Record< string, number >
) {
	return {
		primary: { data: report( '2026-11-01', summary ) },
		comparison: { data: comparisonSummary && report( '2026-10-31', comparisonSummary ) },
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

	it( 'shows the change on each source total against the comparison period', () => {
		mockUseStatsEdgeBotRequests.mockReturnValue(
			requestsResult(
				{ human: 600, ai: 250, other: 100, blocked: 50 },
				{ human: 400, ai: 250, other: 0, blocked: 100 }
			)
		);

		renderWidget( { from: '2026-11-01', to: '2026-11-01', interval: 'day' } );

		const totals = screen.getAllByRole( 'listitem' ).map( item => item.textContent );
		expect( totals ).toEqual( [
			'Human600+50%60% of requests',
			'AI bots2500%25% of requests',
			'Other bots100—10% of requests',
			'Blocked50-50%5% of requests',
		] );
	} );

	it( 'keeps the totals when only the comparison period had requests', () => {
		mockUseStatsEdgeBotRequests.mockReturnValue(
			requestsResult(
				{ human: 0, ai: 0, other: 0, blocked: 0 },
				{ human: 400, ai: 0, other: 0, blocked: 0 }
			)
		);

		renderWidget( { from: '2026-11-01', to: '2026-11-01', interval: 'day' } );

		expect( screen.getAllByRole( 'listitem' )[ 0 ] ).toHaveTextContent( 'Human0-100%' );
	} );

	it.each( [
		[ 'a single day', '2026-11-01', 'day', { period: 'hour' } ],
		[ 'a week', '2026-11-07', 'day', { period: 'day' } ],
		[ '90 days', '2027-01-29', 'week', { period: 'week' } ],
		[ 'a year', '2027-10-31', 'month', { period: 'month' } ],
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
