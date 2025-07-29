/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { ChartProvider, ChartIdProvider } from '../../../providers/chart-context';
import { ThemeProvider } from '../../../providers/theme';
import { BarChart } from '../../bar-chart';
import { ChartLegend } from '../chart-legend';

describe( 'ChartLegend', () => {
	const mockLegendItems = [
		{ label: 'Series A', value: '60%', color: '#3858E9' },
		{ label: 'Series B', value: '40%', color: '#80C8FF' },
	];

	const mockBarChartData = [
		{
			label: 'Series A',
			data: [
				{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
				{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
			],
		},
		{
			label: 'Series B',
			data: [
				{ date: new Date( '2024-01-01' ), value: 15, label: 'Jan 1' },
				{ date: new Date( '2024-01-02' ), value: 25, label: 'Jan 2' },
			],
		},
	];

	describe( 'Standalone Usage', () => {
		test( 'renders with explicit items prop (classic standalone mode)', () => {
			render(
				<ThemeProvider>
					<ChartLegend items={ mockLegendItems } orientation="horizontal" />
				</ThemeProvider>
			);

			expect( screen.getByRole( 'list' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Series A' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Series B' ) ).toBeInTheDocument();
		} );

		test( 'works without any context or chartId (graceful degradation)', () => {
			render(
				<ThemeProvider>
					<ChartLegend items={ mockLegendItems } orientation="vertical" />
				</ThemeProvider>
			);

			expect( screen.getByRole( 'list' ) ).toBeInTheDocument();
			const legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );
		} );
	} );

	describe( 'Context Integration', () => {
		test( 'gets chartId from ChartIdProvider context', () => {
			render(
				<ThemeProvider>
					<ChartProvider>
						<ChartIdProvider chartId="test-chart-id">
							<ChartLegend orientation="horizontal" />
						</ChartIdProvider>
					</ChartProvider>
				</ThemeProvider>
			);

			// Should render even without items (will be empty but structure exists)
			// The key test is that it doesn't crash and can access context
			expect( screen.queryByRole( 'list' ) ).not.toBeInTheDocument(); // No items, so no list
		} );

		test( 'explicit chartId prop overrides context chartId', () => {
			render(
				<ThemeProvider>
					<ChartProvider>
						<ChartIdProvider chartId="context-chart-id">
							<ChartLegend
								chartId="explicit-chart-id"
								items={ mockLegendItems }
								orientation="horizontal"
							/>
						</ChartIdProvider>
					</ChartProvider>
				</ThemeProvider>
			);

			expect( screen.getByRole( 'list' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Series A' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Chart Context Integration', () => {
		test( 'standalone legend retrieves data from chart context using chartId', () => {
			render(
				<ThemeProvider>
					<ChartProvider>
						{ /* Chart with hidden legend that registers data in context */ }
						<BarChart
							chartId="standalone-test-chart"
							data={ mockBarChartData }
							width={ 400 }
							height={ 300 }
							showLegend={ false }
						/>
						{ /* Standalone legend that should get data from context */ }
						<ChartLegend chartId="standalone-test-chart" orientation="horizontal" />
					</ChartProvider>
				</ThemeProvider>
			);

			// Should render legend with data from the chart
			expect( screen.getByRole( 'list' ) ).toBeInTheDocument();

			// Should show both series from the chart
			const legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );

			expect( screen.getByText( 'Series A' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Series B' ) ).toBeInTheDocument();
		} );

		test( 'multiple standalone legends can reference the same chart', () => {
			render(
				<ThemeProvider>
					<ChartProvider>
						<BarChart
							chartId="shared-chart"
							data={ mockBarChartData }
							width={ 400 }
							height={ 300 }
							showLegend={ false }
						/>
						{ /* Two separate standalone legends referencing the same chart */ }
						<ChartLegend chartId="shared-chart" orientation="horizontal" />
						<ChartLegend chartId="shared-chart" orientation="vertical" />
					</ChartProvider>
				</ThemeProvider>
			);

			const legends = screen.getAllByRole( 'list' );
			expect( legends ).toHaveLength( 2 );

			// Both should show the same data
			const allSeriesA = screen.getAllByText( 'Series A' );
			const allSeriesB = screen.getAllByText( 'Series B' );
			expect( allSeriesA ).toHaveLength( 2 );
			expect( allSeriesB ).toHaveLength( 2 );
		} );
	} );

	describe( 'Fallback Behavior', () => {
		test( 'renders nothing when no items and no valid chartId context', () => {
			render(
				<ThemeProvider>
					<ChartProvider>
						<ChartLegend chartId="non-existent-chart" orientation="horizontal" />
					</ChartProvider>
				</ThemeProvider>
			);

			// Should not render anything when no chart data exists for the chartId
			expect( screen.queryByRole( 'list' ) ).not.toBeInTheDocument();
		} );

		test( 'context data takes precedence over explicit items prop when chartId is provided', () => {
			render(
				<ThemeProvider>
					<ChartProvider>
						<BarChart
							chartId="precedence-test"
							data={ mockBarChartData }
							width={ 400 }
							height={ 300 }
							showLegend={ false }
						/>
						<ChartLegend
							chartId="precedence-test"
							items={ [ { label: 'Override', value: '100%', color: '#FF0000' } ] }
							orientation="horizontal"
						/>
					</ChartProvider>
				</ThemeProvider>
			);

			// Should show the context data, not the explicit items (context takes precedence)
			expect( screen.getByText( 'Series A' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Series B' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Override' ) ).not.toBeInTheDocument();
		} );

		test( 'explicit items prop works when no chartId context is available', () => {
			render(
				<ThemeProvider>
					<ChartProvider>
						<ChartLegend
							items={ [ { label: 'Standalone', value: '100%', color: '#FF0000' } ] }
							orientation="horizontal"
						/>
					</ChartProvider>
				</ThemeProvider>
			);

			// Should show the explicit items when no context data is available
			expect( screen.getByText( 'Standalone' ) ).toBeInTheDocument();
		} );
	} );
} );
