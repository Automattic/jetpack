/**
 * External dependencies
 */
import {
	useStatsUtm,
	type ReportParams,
	type StatsUtmComparisonItem,
} from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import useUtmInsights from '../use-utm-insights';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useStatsUtm: jest.fn(),
} ) );

const mockUseStatsUtm = useStatsUtm as jest.MockedFunction< typeof useStatsUtm >;

const reportParams = {
	from: '2026-06-01',
	to: '2026-06-30',
	interval: 'day',
} as ReportParams;

describe( 'useUtmInsights', () => {
	beforeEach( () => {
		mockUseStatsUtm.mockReset();
	} );

	it( 'maps a UTM child post ID and URL into the widget drill-down row', () => {
		const rows: StatsUtmComparisonItem[] = [
			{
				label: 'newsletter / email',
				value: 18,
				children: [
					{
						id: 41,
						label: 'Landing page',
						value: 12,
						href: 'https://example.com/landing/',
						page: '/stats/post/41',
						actions: [],
						children: null,
					},
				],
			},
		];

		mockUseStatsUtm.mockReturnValue( {
			comparisonRows: { rows, hasComparison: false },
			hasComparison: false,
			isLoading: false,
			isFetching: false,
			isError: false,
			error: null,
			refetch: jest.fn(),
		} as never );

		const { result } = renderHook( () =>
			useUtmInsights( {
				reportParams,
				utmParam: 'utm_source,utm_medium',
				max: 5,
			} )
		);

		expect( result.current.data ).toEqual( [
			expect.objectContaining( {
				children: [
					expect.objectContaining( {
						postId: 41,
						label: 'Landing page',
						href: 'https://example.com/landing/',
					} ),
				],
			} ),
		] );
		expect( mockUseStatsUtm ).toHaveBeenCalledWith(
			expect.objectContaining( {
				utmParam: 'utm_source,utm_medium',
				max: 5,
			} ),
			{ maxRows: 5 }
		);
	} );
} );
