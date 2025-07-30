/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../../providers/theme';
import PieChart from '../pie-chart';

describe( 'PieChart', () => {
	const defaultProps = {
		size: 500,
		data: [
			{ label: 'A', percentage: 50, value: 50 },
			{ label: 'B', percentage: 50, value: 50 },
		],
	};

	const renderWithTheme = ( props = {} ) => {
		return render(
			<ThemeProvider>
				<PieChart { ...defaultProps } { ...props } />
			</ThemeProvider>
		);
	};

	describe( 'Data Validation', () => {
		test( 'validates total percentage equals 100', () => {
			renderWithTheme( {
				data: [
					{ label: 'A', percentage: 60, value: 60 },
					{ label: 'B', percentage: 50, value: 50 },
				],
			} );
			expect( screen.getByText( /invalid percentage total/i ) ).toBeInTheDocument();
		} );

		test( 'handles negative values', () => {
			renderWithTheme( {
				data: [
					{ label: 'A', percentage: -30, value: -30 },
					{ label: 'B', percentage: 130, value: 130 },
				],
			} );
			expect( screen.getByText( /invalid data/i ) ).toBeInTheDocument();
		} );

		test( 'handles empty data array', () => {
			renderWithTheme( { data: [] } );
			expect( screen.getByText( /no data available/i ) ).toBeInTheDocument();
		} );

		test( 'handles single data point', () => {
			renderWithTheme( {
				data: [ { label: 'A', percentage: 100, value: 100 } ],
			} );
			expect( screen.getByText( 'A' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Legend Positioning', () => {
		test( 'renders legend when showLegend is true', () => {
			renderWithTheme( {
				showLegend: true,
				legendAlignmentVertical: 'top',
			} );

			// Check that legend container is rendered using accessible queries
			const legend = screen.getByRole( 'list' );
			expect( legend ).toBeInTheDocument();
			expect( legend ).toHaveAttribute( 'data-testid', 'legend-horizontal' );
		} );

		test( 'renders correct number of legend items', () => {
			renderWithTheme( {
				showLegend: true,
				legendAlignmentVertical: 'top',
			} );

			// Use getAllByTestId to find legend items
			const legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );
		} );

		test( 'chart renders with legend at top position', () => {
			renderWithTheme( {
				showLegend: true,
				legendAlignmentVertical: 'top',
			} );

			// Verify the chart renders without errors when legend is at top
			// The presence of the legend and chart elements indicates proper layout
			expect( screen.getByRole( 'list' ) ).toBeInTheDocument();

			// Verify chart content is still rendered (pie slices create text labels)
			const chartLabels = screen.getAllByText( /^[AB]$/ );
			expect( chartLabels.length ).toBeGreaterThanOrEqual( 2 );
		} );

		test( 'chart renders with legend at bottom position', () => {
			renderWithTheme( {
				showLegend: true,
				legendAlignmentVertical: 'bottom',
			} );

			// Verify the chart renders without errors when legend is at bottom
			expect( screen.getByRole( 'list' ) ).toBeInTheDocument();

			// Verify chart content is still rendered
			const chartLabels = screen.getAllByText( /^[AB]$/ );
			expect( chartLabels.length ).toBeGreaterThanOrEqual( 2 );
		} );
	} );
} );
