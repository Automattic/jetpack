/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportPerformanceChart } from '../report-performance-chart';
import type { StatsTimeSeriesReport } from '@jetpack-premium-analytics/data';

jest.mock( '../../../hooks', () => ( {
	useSeriesStyles: () => [],
} ) );

jest.mock( '../../chart-comparative-line', () => ( {
	ComparativeLineChart: ( { series }: { series: unknown[] } ) => (
		<div data-testid="comparative-line-chart">
			{ series.length === 0 ? 'No data available' : 'Chart' }
		</div>
	),
} ) );

jest.mock( '../../widget-loading-overlay', () => ( {
	WidgetLoadingOverlay: () => <div data-testid="loading-overlay">Loading</div>,
} ) );

const PRIMARY: StatsTimeSeriesReport = {
	summary: {
		date_start: '2026-06-01',
		date_end: '2026-06-01',
	},
	data: [
		{
			time_interval: '2026-06-01',
			date_start: '2026-06-01',
			date_end: '2026-06-01',
			label: '2026-06-01',
			value: 100,
			items: [],
			views: 100,
			visitors: 40,
			comments: 3,
			likes: 5,
		},
	],
};

describe( 'ReportPerformanceChart', () => {
	it( 'renders only the loading overlay while loading without data', () => {
		render( <ReportPerformanceChart interval="day" isLoading /> );

		expect( screen.getByTestId( 'loading-overlay' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'comparative-line-chart' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'No data available' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the chart and loading overlay while refetching existing data', () => {
		render( <ReportPerformanceChart interval="day" primary={ PRIMARY } isLoading /> );

		expect( screen.getByTestId( 'comparative-line-chart' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'loading-overlay' ) ).toBeInTheDocument();
	} );
} );
