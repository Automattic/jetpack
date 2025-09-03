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
			// Use getAllByText since 'A' appears in both chart and legend
			const labels = screen.getAllByText( 'A' );
			expect( labels.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'Legend Positioning', () => {
		test( 'renders legend when showLegend is true', () => {
			renderWithTheme( {
				showLegend: true,
				legendPosition: 'top',
			} );

			// Check that legend container is rendered using accessible queries
			const legend = screen.getByRole( 'list' );
			expect( legend ).toBeInTheDocument();
			expect( legend ).toHaveAttribute( 'data-testid', 'legend-horizontal' );
		} );

		test( 'renders correct number of legend items', () => {
			renderWithTheme( {
				showLegend: true,
				legendPosition: 'top',
			} );

			// Use getAllByTestId to find legend items
			const legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );
		} );

		test( 'chart renders with legend at top position', () => {
			renderWithTheme( {
				showLegend: true,
				legendPosition: 'top',
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
				legendPosition: 'bottom',
			} );

			// Verify the chart renders without errors when legend is at bottom
			expect( screen.getByRole( 'list' ) ).toBeInTheDocument();

			// Verify chart content is still rendered
			const chartLabels = screen.getAllByText( /^[AB]$/ );
			expect( chartLabels.length ).toBeGreaterThanOrEqual( 2 );
		} );
	} );

	describe( 'Label Visibility', () => {
		test( 'shows labels by default', () => {
			renderWithTheme();
			// Labels should be visible by default
			const labels = screen.getAllByText( /^[AB]$/ );
			expect( labels.length ).toBeGreaterThanOrEqual( 2 );
		} );

		test( 'hides labels when showLabels is false', () => {
			renderWithTheme( { showLabels: false } );

			// When showLabels is false, the chart should not display the data labels
			// We filter out measurement elements by checking that text is not inside measurement element
			const labelElements = screen.queryAllByText( ( content, element ) => {
				// Check if this text element is not the measurement element
				return (
					( content === 'A' || content === 'B' ) &&
					element?.id !== '__react_svg_text_measurement_id'
				);
			} );

			// Labels should not be present in the rendered output (excluding measurement text)
			expect( labelElements ).toHaveLength( 0 );
		} );

		test( 'shows labels when showLabels is explicitly true', () => {
			renderWithTheme( { showLabels: true } );
			// Labels should be visible
			const labels = screen.getAllByText( /^[AB]$/ );
			expect( labels.length ).toBeGreaterThanOrEqual( 2 );
		} );

		test( 'shows labels for backward compatibility when prop not specified', () => {
			// Render without showLabels prop to test backward compatibility
			render(
				<ThemeProvider>
					<PieChart size={ 500 } data={ defaultProps.data } />
				</ThemeProvider>
			);

			// Should find label text using Testing Library queries
			const labels = screen.getAllByText( /^[AB]$/ );
			expect( labels.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'Legend Value Display', () => {
		const testData = [
			{ label: 'Windows', value: 80000, valueDisplay: '80K', percentage: 60 },
			{ label: 'MacOS', value: 30000, valueDisplay: '30K', percentage: 23 },
			{ label: 'Linux', value: 22000, valueDisplay: '22K', percentage: 17 },
		];

		test( 'shows percentage values by default when showLegend and showValues are enabled', () => {
			renderWithTheme( {
				data: testData,
				showLegend: true,
				// legendValueDisplay defaults to 'percentage'
			} );

			// Should display percentage values (using formatPercentage which shows "60%", "23%", "17%")
			expect( screen.getByText( '60%' ) ).toBeInTheDocument();
			expect( screen.getByText( '23%' ) ).toBeInTheDocument();
			expect( screen.getByText( '17%' ) ).toBeInTheDocument();
		} );

		test( 'shows raw values when legendValueDisplay is set to "value"', () => {
			renderWithTheme( {
				data: testData,
				showLegend: true,
				legendValueDisplay: 'value',
			} );

			// Should display raw numeric values
			expect( screen.getByText( '80000' ) ).toBeInTheDocument();
			expect( screen.getByText( '30000' ) ).toBeInTheDocument();
			expect( screen.getByText( '22000' ) ).toBeInTheDocument();
		} );

		test( 'shows formatted values when legendValueDisplay is set to "valueDisplay"', () => {
			renderWithTheme( {
				data: testData,
				showLegend: true,
				legendValueDisplay: 'valueDisplay',
			} );

			// Should display formatted values (valueDisplay field)
			expect( screen.getByText( '80K' ) ).toBeInTheDocument();
			expect( screen.getByText( '30K' ) ).toBeInTheDocument();
			expect( screen.getByText( '22K' ) ).toBeInTheDocument();
		} );

		test( 'shows no values when legendValueDisplay is set to "none"', () => {
			renderWithTheme( {
				data: testData,
				showLegend: true,
				showLabels: false, // Disable pie slice labels to avoid confusion
				legendValueDisplay: 'none',
			} );

			// Should not display any values in legend
			expect( screen.queryByText( '60%' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( '80000' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( '80K' ) ).not.toBeInTheDocument();

			// Legend should have the correct number of items (labels only, no values)
			const legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 3 );
		} );
	} );
} );
