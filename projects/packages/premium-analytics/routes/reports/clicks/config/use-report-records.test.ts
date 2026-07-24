/**
 * External dependencies
 */
import { useStatsClicks } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useClicksReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsClicksComparisonItem,
	StatsClicksItem,
	StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsClicks: jest.fn(),
} ) );

const mockUseStatsClicks = useStatsClicks as jest.MockedFunction< typeof useStatsClicks >;

const report: StatsNormalizedReport< StatsClicksItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
			items: [
				{
					label: 'jetpack.com',
					views: 13,
					link: 'https://jetpack.com/',
					icon: null,
					labelIcon: 'external',
					children: null,
				},
			],
		},
	],
};

const reportParams: ReportParams = {
	from: '2026-07-09',
	to: '2026-07-10',
	interval: 'day',
};

const comparisonRows: StatsClicksComparisonItem[] = [
	{
		label: 'jetpack.com',
		views: 13,
		previousValue: 10,
		link: 'https://jetpack.com/',
		icon: null,
		labelIcon: 'external',
		children: null,
	},
];
const primaryRows: StatsClicksComparisonItem[] = comparisonRows.map( row => ( {
	...row,
	previousValue: undefined,
} ) );

describe( 'useClicksReportRecords', () => {
	beforeEach( () => {
		mockUseStatsClicks.mockReset();
		mockUseStatsClicks.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			comparisonRows: { rows: primaryRows, hasComparison: false },
			hasComparison: false,
			isLoading: false,
			isFetching: false,
		} as ReturnType< typeof useStatsClicks > );
	} );

	it( 'requests the full summarized Clicks report for the selected date range', () => {
		const paramsWithStaleChartPeriod = { ...reportParams, period: 'month' as const };
		const { result } = renderHook( () => useClicksReportRecords( paramsWithStaleChartPeriod ) );

		expect( mockUseStatsClicks ).toHaveBeenCalledWith( {
			...paramsWithStaleChartPeriod,
			max: 0,
			summarize: 1,
			period: 'day',
		} );
		expect( result.current.rows ).toEqual( [
			expect.objectContaining( {
				clickedUrl: 'https://jetpack.com/',
				clicks: 13,
			} ),
		] );
		expect( result.current.rows[ 0 ] ).not.toHaveProperty( 'previousClicks' );
		expect( result.current.hasComparison ).toBe( false );
	} );

	it( 'returns matched comparison values when comparison is enabled', () => {
		mockUseStatsClicks.mockReturnValue( {
			primary: { data: report },
			comparison: { data: report },
			comparisonRows: { rows: comparisonRows, hasComparison: true },
			hasComparison: true,
			isLoading: false,
			isFetching: false,
		} as ReturnType< typeof useStatsClicks > );

		const { result } = renderHook( () =>
			useClicksReportRecords( {
				...reportParams,
				comp: '1',
				compare_from: '2026-07-07',
				compare_to: '2026-07-08',
			} )
		);

		expect( result.current.rows ).toEqual( [
			expect.objectContaining( {
				clickedUrl: 'https://jetpack.com/',
				clicks: 13,
				previousClicks: 10,
			} ),
		] );
		expect( result.current.hasComparison ).toBe( true );
	} );

	it( 'preserves the report loading state while comparison data loads', () => {
		mockUseStatsClicks.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			comparisonRows: { rows: primaryRows, hasComparison: false },
			hasComparison: false,
			isLoading: true,
			isFetching: true,
		} as ReturnType< typeof useStatsClicks > );

		const { result } = renderHook( () => useClicksReportRecords( reportParams ) );

		expect( result.current.isLoading ).toBe( true );
		expect( result.current.isFetching ).toBe( true );
		expect( result.current.rows ).toHaveLength( 1 );
	} );

	it( 'surfaces active fetching after the initial load has settled', () => {
		mockUseStatsClicks.mockReturnValue( {
			primary: { data: report },
			comparison: { data: report },
			comparisonRows: { rows: comparisonRows, hasComparison: true },
			hasComparison: true,
			isLoading: false,
			isFetching: true,
		} as ReturnType< typeof useStatsClicks > );

		const { result } = renderHook( () => useClicksReportRecords( reportParams ) );

		expect( result.current.isLoading ).toBe( false );
		expect( result.current.isFetching ).toBe( true );
	} );

	it( 'surfaces error and refetch from the report', () => {
		const refetch = jest.fn();
		mockUseStatsClicks.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			comparisonRows: { rows: primaryRows, hasComparison: false },
			hasComparison: false,
			isLoading: false,
			isFetching: false,
			isError: true,
			refetch,
		} as unknown as ReturnType< typeof useStatsClicks > );

		const { result } = renderHook( () => useClicksReportRecords( reportParams ) );

		expect( result.current.isError ).toBe( true );
		expect( result.current.refetch ).toBe( refetch );
	} );
} );
