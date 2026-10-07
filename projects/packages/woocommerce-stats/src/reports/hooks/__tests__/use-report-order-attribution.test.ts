/**
 * External dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
/**
 * Internal dependencies
 */
import { reportOrderAttributionSummaryQuery } from '../../queries/report-order-attribution-summary-query';
import { useReportOrderAttribution } from '../use-report-order-attribution';
import type { ReportParams } from '../../utils/types';

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( { useReport: jest.fn() } ) );
jest.mock( '../../queries/report-order-attribution-summary-query', () => ( {
	reportOrderAttributionSummaryQuery: jest.fn( () => ( { queryKey: [ 'summary' ] } ) ),
} ) );

const mockUseReport = useReport as jest.Mock;
const mockSummaryQuery = reportOrderAttributionSummaryQuery as jest.Mock;

const PERIOD = { from: '2026-06-01', to: '2026-06-07', interval: 'day' };
const PARAMS: ReportParams = { ...PERIOD, view: 'device' };

// Run the hook and call the query factory it hands to `useReport`, as the dashboard would.
const buildQuery = ( params: ReportParams, queryType: 'primary' | 'comparison' = 'primary' ) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks -- `useReport` is mocked, so this runs as a plain function.
	useReportOrderAttribution( params );

	return mockUseReport.mock.calls.at( -1 )[ 0 ]( PERIOD, queryType );
};

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'useReportOrderAttribution', () => {
	it( 'asks one summary for both periods, with the view and the filters', () => {
		const filters: ReportParams[ 'filters' ] = [
			{ key: 'product_type', value: [ 'booking' ], compare: 'IN' },
		];

		buildQuery( { ...PARAMS, compare_from: '2026-05-25', compare_to: '2026-05-31', filters } );

		expect( mockSummaryQuery ).toHaveBeenCalledWith( {
			...PERIOD,
			view: 'device',
			compare_from: '2026-05-25',
			compare_to: '2026-05-31',
			date_type: undefined,
			filters,
		} );
	} );

	it( 'compares the period with itself when the params name no comparison', () => {
		buildQuery( PARAMS );

		expect( mockSummaryQuery ).toHaveBeenCalledWith(
			expect.objectContaining( { compare_from: PERIOD.from, compare_to: PERIOD.to } )
		);
	} );

	it.each( [
		[ 'the comparison query, which the summary already answers', PARAMS, 'comparison' ],
		[ 'a report without a view', PERIOD, 'primary' ],
	] as const )( 'leaves %s disabled', ( _name, params, queryType ) => {
		expect( buildQuery( params, queryType ) ).toMatchObject( { enabled: false } );
		expect( mockSummaryQuery ).not.toHaveBeenCalled();
	} );
} );
