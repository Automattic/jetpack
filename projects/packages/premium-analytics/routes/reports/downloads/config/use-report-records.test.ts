import { useStatsFileDownloads } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useDownloadsReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsFileDownloadsComparisonItem,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsFileDownloads: jest.fn(),
} ) );

const mockUseStatsFileDownloads = useStatsFileDownloads as jest.MockedFunction<
	typeof useStatsFileDownloads
>;

const row: StatsFileDownloadsComparisonItem = {
	label: '/files/report.pdf',
	shortLabel: 'report.pdf',
	link: 'https://example.com/files/report.pdf',
	downloads: 13,
	linkTitle: '/files/report.pdf',
	labelIcon: 'external',
	children: null,
};

const params: ReportParams = {
	from: '2026-07-09',
	to: '2026-07-10',
	interval: 'day',
};

describe( 'useDownloadsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsFileDownloads.mockReset();
		mockUseStatsFileDownloads.mockReturnValue( {
			primary: { data: undefined },
			comparison: { data: undefined },
			comparisonRows: { rows: [ row ], hasComparison: false },
			hasComparison: false,
			isLoading: false,
			isFetching: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsFileDownloads > );
	} );

	it( 'requests a summarized range and returns the shared comparison rows', () => {
		const paramsWithStaleChartPeriod = { ...params, period: 'month' as const };
		const { result } = renderHook( () => useDownloadsReportRecords( paramsWithStaleChartPeriod ) );

		expect( mockUseStatsFileDownloads ).toHaveBeenCalledWith( {
			...paramsWithStaleChartPeriod,
			max: 0,
			summarize: 1,
			period: 'day',
		} );
		expect( result.current.rows ).toEqual( [ row ] );
		expect( result.current.hasComparison ).toBe( false );
	} );

	it( 'preserves matched comparison downloads for the records table', () => {
		const comparisonRow = { ...row, previousDownloads: 9 };
		mockUseStatsFileDownloads.mockReturnValue( {
			primary: { data: undefined },
			comparison: { data: undefined },
			comparisonRows: { rows: [ comparisonRow ], hasComparison: true },
			hasComparison: true,
			isLoading: false,
			isFetching: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsFileDownloads > );

		const { result } = renderHook( () =>
			useDownloadsReportRecords( {
				...params,
				comp: '1',
				compare_from: '2026-07-07',
				compare_to: '2026-07-08',
			} )
		);

		expect( result.current.rows ).toEqual( [ comparisonRow ] );
		expect( result.current.hasComparison ).toBe( true );
	} );

	it( 'surfaces loading, fetching, error, and refetch from the report', () => {
		const refetch = jest.fn();
		mockUseStatsFileDownloads.mockReturnValue( {
			primary: { data: undefined },
			comparison: { data: undefined },
			comparisonRows: { rows: [], hasComparison: false },
			hasComparison: false,
			isLoading: true,
			isFetching: true,
			isError: true,
			refetch,
		} as unknown as ReturnType< typeof useStatsFileDownloads > );

		const { result } = renderHook( () => useDownloadsReportRecords( params ) );

		expect( result.current.isLoading ).toBe( true );
		expect( result.current.isFetching ).toBe( true );
		expect( result.current.isError ).toBe( true );
		expect( result.current.refetch ).toBe( refetch );
	} );
} );
