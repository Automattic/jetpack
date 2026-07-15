/**
 * External dependencies
 */
import { useStatsTopAuthors } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useAuthorsReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsNormalizedReport,
	StatsTopAuthorsItem,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsTopAuthors: jest.fn(),
} ) );

const mockUseStatsTopAuthors = useStatsTopAuthors as jest.MockedFunction<
	typeof useStatsTopAuthors
>;

const report: StatsNormalizedReport< StatsTopAuthorsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-09T23:59:59+00:00',
			items: [
				{
					id: 42,
					label: 'Ada Lovelace',
					views: 7,
					icon: 'https://example.com/ada.png',
				},
			],
		},
		{
			time_interval: '2026-07-10',
			date_start: '2026-07-10T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
			items: [
				{
					id: 42,
					label: 'Ada Lovelace',
					views: 6,
					icon: 'https://example.com/ada.png',
				},
			],
		},
	],
};

describe( 'useAuthorsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsTopAuthors.mockReset();
		mockUseStatsTopAuthors.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsTopAuthors > );
	} );

	it( 'keeps the request day-bucketed while grouping only the chart by week', () => {
		const params: ReportParams = {
			from: '2026-07-09',
			to: '2026-07-10',
			interval: 'day',
		};
		const { result: dayResult } = renderHook( () => useAuthorsReportRecords( params, 'day' ) );
		const { result: weekResult } = renderHook( () => useAuthorsReportRecords( params, 'week' ) );

		expect( mockUseStatsTopAuthors ).toHaveBeenLastCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( weekResult.current.chart.primary.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-07-06',
				date_start: '2026-07-06T00:00:00+00:00',
				date_end: '2026-07-10T23:59:59+00:00',
				views: 13,
			} ),
		] );
		expect( weekResult.current.chart.primary.summary ).toEqual( {
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
		} );
		expect( weekResult.current.authors.rows ).toEqual( dayResult.current.authors.rows );
	} );
} );
