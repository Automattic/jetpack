import {
	useStatsUtm,
	type ReportParams,
	type StatsUtmParam,
} from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useUtmReportRecords } from './use-report-records';
import type { UtmReportTabId } from './tabs';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useStatsUtm: jest.fn(),
} ) );

const mockUseStatsUtm = useStatsUtm as jest.MockedFunction< typeof useStatsUtm >;

const REPORT_PARAMS = {
	from: '2026-06-01',
	to: '2026-06-07',
	interval: 'day',
} as ReportParams;

const TABS = [
	[ 'source-medium', 'utm_source,utm_medium' ],
	[ 'campaign-source-medium', 'utm_campaign,utm_source,utm_medium' ],
	[ 'source', 'utm_source' ],
	[ 'medium', 'utm_medium' ],
	[ 'campaign', 'utm_campaign' ],
] as const satisfies ReadonlyArray< readonly [ UtmReportTabId, StatsUtmParam ] >;

describe( 'useUtmReportRecords', () => {
	beforeEach( () => {
		mockUseStatsUtm.mockReset();
		mockUseStatsUtm.mockReturnValue( {
			primary: { data: undefined },
			comparisonRows: { rows: [], hasComparison: false },
			isLoading: false,
		} as never );
	} );

	it.each( TABS )( 'only enables the %s request', ( activeTab, activeUtmParam ) => {
		renderHook( () => useUtmReportRecords( activeTab, REPORT_PARAMS ) );

		expect( mockUseStatsUtm ).toHaveBeenCalledTimes( TABS.length );
		TABS.forEach( ( [ , utmParam ], index ) => {
			const [ params, options ] = mockUseStatsUtm.mock.calls[ index ];

			expect( params ).toMatchObject( {
				utmParam,
				max: 0,
				summarize: 0,
				query_top_posts: true,
			} );
			expect( options ).toEqual( { enabled: utmParam === activeUtmParam } );
		} );
	} );

	it( 'builds comparison-aware UTM parent and post rows from the active report', () => {
		mockUseStatsUtm.mockImplementation(
			( _params, options ) =>
				( {
					primary: { data: undefined },
					comparisonRows: {
						rows: options?.enabled
							? [
									{
										label: 'newsletter / email',
										value: 18,
										previousValue: 10,
										paramValues: '["newsletter","email"]',
										children: [
											{
												id: 41,
												label: 'Landing page',
												value: 12,
												previousValue: 8,
												href: 'https://example.com/landing/',
												page: '/stats/post/41',
												actions: [],
												children: null,
											},
										],
									},
							  ]
							: [],
						hasComparison: options?.enabled ?? false,
					},
					isLoading: false,
				} ) as never
		);

		const { result } = renderHook( () => useUtmReportRecords( 'source-medium', REPORT_PARAMS ) );

		expect( result.current.rows ).toEqual( [
			expect.objectContaining( {
				label: 'newsletter / email',
				views: 18,
				previousViews: 10,
				isGroup: true,
			} ),
			expect.objectContaining( {
				label: 'Landing page',
				postId: 41,
				views: 12,
				previousViews: 8,
				groupLabel: 'newsletter / email',
			} ),
		] );
	} );

	it( 'surfaces error and refetch from the active report', () => {
		const refetch = jest.fn();
		mockUseStatsUtm.mockImplementation(
			( _params, options ) =>
				( {
					primary: { data: undefined },
					comparisonRows: { rows: [], hasComparison: false },
					isLoading: false,
					isError: options?.enabled ?? false,
					refetch: options?.enabled ? refetch : jest.fn(),
				} ) as never
		);

		const { result } = renderHook( () => useUtmReportRecords( 'source', REPORT_PARAMS ) );

		expect( result.current.isError ).toBe( true );
		expect( result.current.refetch ).toBe( refetch );
	} );
} );
