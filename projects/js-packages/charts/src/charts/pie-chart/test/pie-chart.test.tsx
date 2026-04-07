import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import PieChart from '../pie-chart';

describe( 'PieChart', () => {
	const defaultProps = {
		size: 500,
		data: [
			{ label: 'A', value: 50 },
			{ label: 'B', value: 50 },
		],
	};

	const renderWithTheme = ( props = {} ) => {
		return render(
			<GlobalChartsProvider>
				<PieChart { ...defaultProps } { ...props } />
			</GlobalChartsProvider>
		);
	};

	describe( 'Data Validation', () => {
		test( 'validates total value is greater than 0', () => {
			renderWithTheme( {
				data: [
					{ label: 'A', value: 0 },
					{ label: 'B', value: 0 },
				],
			} );
			expect( screen.getByText( /invalid data/i ) ).toBeInTheDocument();
		} );

		test( 'handles negative values', () => {
			renderWithTheme( {
				data: [
					{ label: 'A', value: -30 },
					{ label: 'B', value: 130 },
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
				data: [ { label: 'A', value: 100 } ],
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
				legend: { position: 'top' },
			} );

			// Check that legend container is rendered using accessible queries
			const legend = screen.getByRole( 'list' );
			expect( legend ).toBeInTheDocument();
			expect( legend ).toHaveAttribute( 'data-testid', 'legend-horizontal' );
		} );

		test( 'renders correct number of legend items', () => {
			renderWithTheme( {
				showLegend: true,
				legend: { position: 'top' },
			} );

			// Use getAllByTestId to find legend items
			const legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );
		} );

		test( 'chart renders with legend at top position', () => {
			renderWithTheme( {
				showLegend: true,
				legend: { position: 'top' },
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
				legend: { position: 'bottom' },
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
				<GlobalChartsProvider>
					<PieChart size={ 500 } data={ defaultProps.data } />
				</GlobalChartsProvider>
			);

			// Should find label text using Testing Library queries
			const labels = screen.getAllByText( /^[AB]$/ );
			expect( labels.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'Legend Value Display', () => {
		// Values that give clean percentages: 60/100=60%, 23/100=23%, 17/100=17%
		const testData = [
			{ label: 'Windows', value: 60, valueDisplay: '60' },
			{ label: 'MacOS', value: 23, valueDisplay: '23' },
			{ label: 'Linux', value: 17, valueDisplay: '17' },
		];

		test( 'shows percentage values by default when showLegend and showValues are enabled', () => {
			renderWithTheme( {
				data: testData,
				showLegend: true,
				// legendValueDisplay defaults to 'percentage'
			} );

			// Should display calculated percentages from values
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

			// Should display localized numeric values
			expect( screen.getByText( '60' ) ).toBeInTheDocument();
			expect( screen.getByText( '23' ) ).toBeInTheDocument();
			expect( screen.getByText( '17' ) ).toBeInTheDocument();
		} );

		test( 'shows formatted values when legendValueDisplay is set to "valueDisplay"', () => {
			renderWithTheme( {
				data: testData,
				showLegend: true,
				legendValueDisplay: 'valueDisplay',
			} );

			// Should display formatted values (valueDisplay field)
			expect( screen.getByText( '60' ) ).toBeInTheDocument();
			expect( screen.getByText( '23' ) ).toBeInTheDocument();
			expect( screen.getByText( '17' ) ).toBeInTheDocument();
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

	describe( 'Tooltip Functionality', () => {
		// Values: 80000 + 30000 = 110000
		// Windows: 80000/110000 = 72.727...%
		// MacOS: 30000/110000 = 27.272...%
		const testData = [
			{ label: 'Windows', value: 80000, valueDisplay: '80K' },
			{ label: 'MacOS', value: 30000, valueDisplay: '30K' },
		];

		test( 'does not show tooltip when withTooltips is false', async () => {
			const user = userEvent.setup();
			renderWithTheme( {
				data: testData,
				withTooltips: false,
			} );

			const segments = screen.getAllByTestId( 'pie-segment' );
			await user.hover( segments[ 0 ] );

			// Should not find tooltip
			expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
		} );

		test( 'shows tooltip on hover when withTooltips is true', async () => {
			const user = userEvent.setup();
			renderWithTheme( {
				data: testData,
				withTooltips: true,
			} );

			const segments = screen.getAllByTestId( 'pie-segment' );
			await user.hover( segments[ 0 ] );

			// Wait for tooltip to appear
			await waitFor( () => {
				expect( screen.getByRole( 'tooltip' ) ).toBeInTheDocument();
			} );

			const tooltip = screen.getByRole( 'tooltip' );
			expect( tooltip ).toHaveTextContent( 'Windows: 80K' );
		} );

		test( 'hides tooltip on mouse leave', async () => {
			const user = userEvent.setup();
			renderWithTheme( {
				data: testData,
				withTooltips: true,
			} );

			const segments = screen.getAllByTestId( 'pie-segment' );
			await user.hover( segments[ 0 ] );

			// Wait for tooltip to appear
			await waitFor( () => {
				expect( screen.getByRole( 'tooltip' ) ).toBeInTheDocument();
			} );

			await user.unhover( segments[ 0 ] );

			// Wait for tooltip to disappear
			await waitFor( () => {
				expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
			} );
		} );

		test( 'shows different tooltip content for different segments', async () => {
			const user = userEvent.setup();
			renderWithTheme( {
				data: testData,
				withTooltips: true,
			} );

			const segments = screen.getAllByTestId( 'pie-segment' );

			// Test first segment
			await user.hover( segments[ 0 ] );
			await waitFor( () => {
				expect( screen.getByRole( 'tooltip' ) ).toBeInTheDocument();
			} );
			expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Windows: 80K' );

			await user.unhover( segments[ 0 ] );
			await waitFor( () => {
				expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
			} );

			// Test second segment
			await user.hover( segments[ 1 ] );
			await waitFor( () => {
				expect( screen.getByRole( 'tooltip' ) ).toBeInTheDocument();
			} );
			expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'MacOS: 30K' );
		} );

		test( 'tooltip shows valueDisplay when available, falls back to value', async () => {
			const user = userEvent.setup();
			const dataWithoutValueDisplay = [ { label: 'Test', value: 42 } ];

			renderWithTheme( {
				data: dataWithoutValueDisplay,
				withTooltips: true,
			} );

			const segments = screen.getAllByTestId( 'pie-segment' );
			await user.hover( segments[ 0 ] );

			await waitFor( () => {
				expect( screen.getByRole( 'tooltip' ) ).toBeInTheDocument();
			} );
			expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Test: 42' );
		} );

		test( 'renders custom tooltip when renderTooltip prop is provided', async () => {
			const user = userEvent.setup();
			const customTooltipRenderer = jest.fn( ( { tooltipData } ) => (
				<div role="tooltip" data-testid="custom-tooltip">
					Custom: { tooltipData.label } - { tooltipData.value }
				</div>
			) );

			renderWithTheme( {
				data: testData,
				withTooltips: true,
				renderTooltip: customTooltipRenderer,
			} );

			const segments = screen.getAllByTestId( 'pie-segment' );
			await user.hover( segments[ 0 ] );

			await waitFor( () => {
				expect( screen.getByTestId( 'custom-tooltip' ) ).toBeInTheDocument();
			} );

			const customTooltip = screen.getByTestId( 'custom-tooltip' );
			expect( customTooltip ).toHaveTextContent( 'Custom: Windows - 80000' );
			expect( customTooltipRenderer ).toHaveBeenCalled();

			// Verify the renderer received correct parameters
			// Percentage is calculated from values: 80000 / (80000 + 30000) = 72.727...%
			expect( customTooltipRenderer ).toHaveBeenCalledWith(
				expect.objectContaining( {
					tooltipData: expect.objectContaining( {
						label: 'Windows',
						value: 80000,
					} ),
				} )
			);
			// Verify percentage is calculated (approximately 72.73%)
			const callArgs = customTooltipRenderer.mock.calls[ 0 ][ 0 ];
			expect( callArgs.tooltipData.percentage ).toBeCloseTo( 72.73, 1 );
		} );
	} );

	describe( 'Interactive Legend', () => {
		test( 'filters segments when interactive legend is enabled and segment is toggled', async () => {
			const user = userEvent.setup();
			const testData = [
				{ label: 'Segment A', value: 50 },
				{ label: 'Segment B', value: 50 },
			];

			renderWithTheme( {
				data: testData,
				showLegend: true,
				legend: { interactive: true },
				chartId: 'test-interactive-pie-chart',
			} );

			// Initially both segments should be visible
			let segments = screen.getAllByTestId( 'pie-segment' );
			expect( segments ).toHaveLength( 2 );

			// Click first legend item to hide segment A
			const legendItem = screen.getByRole( 'button', { name: /Segment A/i } );
			await user.click( legendItem );

			// Only one segment should remain
			await waitFor( () => {
				segments = screen.getAllByTestId( 'pie-segment' );
				expect( segments ).toHaveLength( 1 );
			} );

			// Legend item should be marked as hidden
			expect( legendItem ).toHaveAttribute( 'aria-pressed', 'false' );
		} );

		test( 'shows empty state when all segments are hidden', async () => {
			const user = userEvent.setup();
			const testData = [
				{ label: 'Segment A', value: 50 },
				{ label: 'Segment B', value: 50 },
			];

			renderWithTheme( {
				data: testData,
				showLegend: true,
				legend: { interactive: true },
				chartId: 'test-all-hidden-pie-chart',
			} );

			// Initially should have 2 segments
			expect( screen.getAllByTestId( 'pie-segment' ) ).toHaveLength( 2 );

			// Hide both segments by clicking legend items
			const legendItems = screen.getAllByRole( 'button' );
			await user.click( legendItems[ 0 ] );

			// Wait for first segment to be hidden
			await waitFor( () => {
				expect( screen.getAllByTestId( 'pie-segment' ) ).toHaveLength( 1 );
			} );

			await user.click( legendItems[ 1 ] );

			// Wait for all segments to be hidden
			await waitFor( () => {
				expect( screen.queryAllByTestId( 'pie-segment' ) ).toHaveLength( 0 );
			} );

			// Empty state should appear
			expect( screen.getByText( /all segments are hidden/i ) ).toBeInTheDocument();

			// Legend items should still be present (just marked inactive)
			expect( screen.getAllByRole( 'button' ) ).toHaveLength( 2 );
		} );

		test( 'does not filter segments when legendInteractive is false', () => {
			const testData = [
				{ label: 'Segment A', value: 50 },
				{ label: 'Segment B', value: 50 },
			];

			renderWithTheme( {
				data: testData,
				showLegend: true,
				legend: { interactive: false },
				chartId: 'test-non-interactive-pie-chart',
			} );

			// Legend items should not be buttons
			const buttons = screen.queryAllByRole( 'button' );
			expect( buttons ).toHaveLength( 0 );

			// All segments should be visible
			const segments = screen.getAllByTestId( 'pie-segment' );
			expect( segments ).toHaveLength( 2 );
		} );

		test( 'maintains consistent colors when segments are hidden', async () => {
			const user = userEvent.setup();
			const testData = [
				{ label: 'Segment A', value: 30 },
				{ label: 'Segment B', value: 40 },
				{ label: 'Segment C', value: 30 },
			];

			renderWithTheme( {
				data: testData,
				showLegend: true,
				legend: { interactive: true },
				chartId: 'test-color-consistency-pie-chart',
			} );

			// Get initial segment colors
			const initialSegments = screen.getAllByTestId( 'pie-segment' );
			const segmentBColor = initialSegments[ 1 ].getAttribute( 'fill' );

			// Hide Segment A
			const legendItemA = screen.getByRole( 'button', { name: /Segment A/i } );
			await user.click( legendItemA );

			// Segment B should maintain its color (now it's the first visible segment)
			await waitFor( () => {
				expect( screen.getAllByTestId( 'pie-segment' ) ).toHaveLength( 2 );
			} );

			const remainingSegments = screen.getAllByTestId( 'pie-segment' );
			expect( remainingSegments[ 0 ] ).toHaveAttribute( 'fill', segmentBColor );
		} );

		test( 'recalculates legend percentages when segments are hidden', async () => {
			const user = userEvent.setup();
			const testData = [
				{ label: 'Segment A', value: 25 },
				{ label: 'Segment B', value: 50 },
				{ label: 'Segment C', value: 25 },
			];

			renderWithTheme( {
				data: testData,
				showLegend: true,
				legend: { interactive: true },
				legendValueDisplay: 'percentage',
				chartId: 'test-percentage-recalc-pie-chart',
			} );

			// Initially, legend should show original percentages
			const legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 3 );
			expect( screen.getAllByText( '25%' ) ).toHaveLength( 2 ); // A and C both 25%
			expect( screen.getByText( '50%' ) ).toBeInTheDocument();

			// Hide Segment A (25%)
			const legendItemA = screen.getByRole( 'button', { name: /Segment A/i } );
			await user.click( legendItemA );

			// Now B and C should recalculate: B = 50/75 = 66.67%, C = 25/75 = 33.33%
			await waitFor( () => {
				expect( screen.getByText( /66\.6/ ) ).toBeInTheDocument();
			} );

			// All 3 legend items should remain (hidden items stay in legend)
			const remainingItems = screen.getAllByTestId( 'legend-item' );
			expect( remainingItems ).toHaveLength( 3 );

			// Segment A should still show original 25% (hidden items don't recalculate)
			expect( legendItemA ).toHaveAttribute( 'aria-pressed', 'false' );
			expect( screen.getAllByText( '25%' ) ).toHaveLength( 1 ); // Only A shows 25%

			// Segment B should now show ~67% (50 out of remaining 75)
			expect( screen.getByText( /66\.6/ ) ).toBeInTheDocument();

			// Segment C should now show ~33% (25 out of remaining 75)
			expect( screen.getByText( /33\.3/ ) ).toBeInTheDocument();
		} );
	} );
} );
