import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import PieSemiCircleChart from '../pie-semi-circle-chart';

// Mock useParentSize so the responsive wrapper returns predictable dimensions in tests
jest.mock( '@visx/responsive', () => ( {
	useParentSize: jest.fn( () => ( {
		parentRef: { current: null },
		width: 400,
		height: 200,
	} ) ),
} ) );

// Mock data for testing
const mockData = [
	{
		label: 'Category A',
		value: 30,
		valueDisplay: '30%',
	},
	{
		label: 'Category B',
		value: 70,
		valueDisplay: '70%',
	},
];

// Helper function to render component with providers
const renderPieChart = ( props, children = undefined ) =>
	render(
		<GlobalChartsProvider>
			<PieSemiCircleChart { ...props }>{ children }</PieSemiCircleChart>
		</GlobalChartsProvider>
	);

describe( 'PieSemiCircleChart', () => {
	it( 'renders basic chart with data', () => {
		renderPieChart( { data: mockData } );
		const segments = screen.getAllByTestId( 'pie-segment' );
		expect( segments ).toHaveLength( 2 );
	} );

	it( 'renders label and note when provided', () => {
		const label = 'Chart Title';
		const note = 'Additional Info';
		renderPieChart( { data: mockData, label, note } );

		expect( screen.getByText( label ) ).toBeInTheDocument();
		expect( screen.getByText( note ) ).toBeInTheDocument();
	} );

	it( 'shows legend when showLegend is true', () => {
		renderPieChart( { data: mockData, showLegend: true } );

		expect( screen.getByText( 'Category A' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Category B' ) ).toBeInTheDocument();
		expect( screen.getByText( '30%' ) ).toBeInTheDocument();
		expect( screen.getByText( '70%' ) ).toBeInTheDocument();
	} );

	it( 'shows tooltip on segment hover when withTooltips is true', async () => {
		const user = userEvent.setup();
		const testData = [
			{ label: 'MacOS', value: 30000, valueDisplay: '30K' },
			{ label: 'Linux', value: 22000, valueDisplay: '22K' },
			{ label: 'Windows', value: 80000, valueDisplay: '80K' },
		];

		renderPieChart( { data: testData, withTooltips: true, width: 400 } );

		const segments = screen.getAllByTestId( 'pie-segment' );
		const firstSegment = segments[ 0 ];

		// Wrap hover interaction in act()
		await user.hover( firstSegment );

		// Check for tooltip by looking for the specific tooltip role
		const tooltip = screen.getByRole( 'tooltip' );
		expect( tooltip ).toHaveTextContent( 'MacOS' );
		expect( tooltip ).toHaveTextContent( '30K' );
	} );

	it( 'hides tooltip on mouse leave', async () => {
		const user = userEvent.setup();
		const testData = [
			{ label: 'MacOS', value: 30000, valueDisplay: '30K' },
			{ label: 'Linux', value: 22000, valueDisplay: '22K' },
			{ label: 'Windows', value: 80000, valueDisplay: '80K' },
		];

		renderPieChart( { data: testData, withTooltips: true, width: 400 } );

		const segments = screen.getAllByTestId( 'pie-segment' );
		const firstSegment = segments[ 0 ];

		await user.hover( firstSegment );

		// Wait for tooltip to be visible - it should show in the BaseTooltip component
		const tooltip = await screen.findByRole( 'tooltip' );
		expect( tooltip ).toHaveTextContent( 'MacOS' );

		await user.unhover( firstSegment );

		// Verify tooltip is gone - checking for the tooltip role specifically
		await waitFor( () => {
			expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'renders custom tooltip when renderTooltip prop is provided', async () => {
		const user = userEvent.setup();
		const testData = [
			{ label: 'MacOS', value: 30000, valueDisplay: '30K' },
			{ label: 'Linux', value: 22000, valueDisplay: '22K' },
			{ label: 'Windows', value: 80000, valueDisplay: '80K' },
		];

		const customTooltipRenderer = jest.fn( ( { tooltipData } ) => (
			<div role="tooltip" data-testid="custom-tooltip">
				Custom: { tooltipData.label } - { tooltipData.value }
			</div>
		) );

		renderPieChart( {
			data: testData,
			withTooltips: true,
			width: 400,
			renderTooltip: customTooltipRenderer,
		} );

		const segments = screen.getAllByTestId( 'pie-segment' );
		await user.hover( segments[ 0 ] );

		await waitFor( () => {
			expect( screen.getByTestId( 'custom-tooltip' ) ).toBeInTheDocument();
		} );

		const customTooltip = screen.getByTestId( 'custom-tooltip' );
		expect( customTooltip ).toHaveTextContent( 'Custom: MacOS - 30000' );
		expect( customTooltipRenderer ).toHaveBeenCalled();

		// Verify the renderer received correct parameters
		expect( customTooltipRenderer ).toHaveBeenCalledWith(
			expect.objectContaining( {
				tooltipData: expect.objectContaining( {
					label: 'MacOS',
					value: 30000,
				} ),
			} )
		);
		// Verify percentage is calculated (approximately 22.73%)
		const callArgs = customTooltipRenderer.mock.calls[ 0 ][ 0 ];
		expect( callArgs.tooltipData.percentage ).toBeCloseTo( 22.73, 1 );
	} );

	it( 'applies custom className', () => {
		const customClass = 'custom-chart';
		renderPieChart( { data: mockData, className: customClass } );
		expect( screen.getByTestId( 'pie-chart-container' ) ).toHaveClass( customClass );
	} );

	it( 'renders with different thickness values', () => {
		const { rerender } = renderPieChart( { data: mockData, thickness: 0.2, width: 400 } );
		const thinSegment = screen.getAllByTestId( 'pie-segment' )[ 0 ];
		const thinPathD = thinSegment.getAttribute( 'd' );

		rerender(
			<GlobalChartsProvider>
				<PieSemiCircleChart data={ mockData } thickness={ 0.8 } width={ 400 } />
			</GlobalChartsProvider>
		);
		const thickSegment = screen.getAllByTestId( 'pie-segment' )[ 0 ];
		const thickPathD = thickSegment.getAttribute( 'd' );

		expect( thinPathD ).not.toBe( thickPathD );
	} );

	it( 'renders with correct dimensions from measured container', () => {
		// Mock returns width:400, height:200 — chart should render at 400×200 (2:1 ratio)
		render( <PieSemiCircleChart data={ mockData } /> );

		const svg = screen.getByTestId( 'pie-chart-svg' );

		expect( svg ).toHaveAttribute( 'width', '400' );
		expect( svg ).toHaveAttribute( 'height', '200' );
		expect( svg ).toHaveAttribute( 'viewBox', '0 0 400 200' );
	} );

	describe( 'Data Validation', () => {
		test( 'handles empty data array', () => {
			renderPieChart( { data: [] } );
			expect( screen.getByText( 'No data available' ) ).toBeInTheDocument();
		} );

		test( 'handles zero total value', () => {
			renderPieChart( {
				data: [
					{ label: 'A', value: 0 },
					{ label: 'B', value: 0 },
				],
			} );
			expect(
				screen.getByText( 'Invalid data: Total value must be greater than 0' )
			).toBeInTheDocument();
		} );

		test( 'handles single data point', () => {
			renderPieChart( {
				data: [ { label: 'Single', value: 100 } ],
			} );
			expect( screen.getByTestId( 'pie-segment' ) ).toBeInTheDocument();
		} );

		test( 'handles negative values', () => {
			renderPieChart( {
				data: [
					{ label: 'A', value: -30 },
					{ label: 'B', value: 130 },
				],
			} );
			expect(
				screen.getByText( 'Invalid data: Negative values are not allowed' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Responsive wrapper', () => {
		it( 'fills parent container (height:100%) by default', () => {
			render( <PieSemiCircleChart data={ mockData } /> );
			const wrapper = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapper ).toHaveStyle( { height: '100%' } );
		} );

		it( 'constrains chart to 2:1 ratio from measured dimensions', () => {
			// Mock returns width:400, height:200, so chart renders at 400×200 (2:1 ratio)
			render( <PieSemiCircleChart data={ mockData } /> );
			const svg = screen.getByTestId( 'pie-chart-svg' );
			expect( svg ).toHaveAttribute( 'width', '400' );
			expect( svg ).toHaveAttribute( 'height', '200' );
		} );

		it( 'constrains chart width when container height is shorter than 2:1 ratio', () => {
			// If parent height is 100px, chart should be at most 200×100 (not 400×200)
			const { useParentSize } = jest.requireMock( '@visx/responsive' );
			useParentSize.mockReturnValueOnce( {
				parentRef: { current: null },
				width: 400,
				height: 100,
			} );
			render( <PieSemiCircleChart data={ mockData } /> );
			const svg = screen.getByTestId( 'pie-chart-svg' );
			// chartWidth = min(400, 100*2) = 200, chartHeight = 100
			expect( svg ).toHaveAttribute( 'width', '200' );
			expect( svg ).toHaveAttribute( 'height', '100' );
		} );
	} );

	describe( 'Composition Legend', () => {
		test( 'renders composition legend as child component', () => {
			renderPieChart( { data: mockData }, <PieSemiCircleChart.Legend /> );

			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
			expect( screen.getByText( 'Category A' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Category B' ) ).toBeInTheDocument();
		} );

		test( 'renders composition legend regardless of showLegend value', () => {
			renderPieChart( { data: mockData, showLegend: false }, <PieSemiCircleChart.Legend /> );

			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
		} );

		test( 'renders composition legend in top position', () => {
			renderPieChart( { data: mockData }, <PieSemiCircleChart.Legend position="top" /> );

			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );

			// Legend should appear before the chart SVG in DOM order
			const html = document.body.innerHTML;
			expect( html.indexOf( 'data-testid="legend-horizontal"' ) ).toBeLessThan(
				html.indexOf( 'data-testid="pie-chart-svg"' )
			);
		} );
	} );

	describe( 'Interactive Legend', () => {
		test( 'filters segments when interactive legend is enabled and segment is toggled', async () => {
			const user = userEvent.setup();
			const testData = [
				{ label: 'Segment A', value: 50 },
				{ label: 'Segment B', value: 50 },
			];

			renderPieChart( {
				data: testData,
				showLegend: true,
				legend: { interactive: true },
				chartId: 'test-interactive-semi-circle-chart',
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

			renderPieChart( {
				data: testData,
				showLegend: true,
				legend: { interactive: true },
				chartId: 'test-all-hidden-semi-circle-chart',
			} );

			// Hide both segments
			const legendItems = screen.getAllByRole( 'button' );
			await user.click( legendItems[ 0 ] );
			await user.click( legendItems[ 1 ] );

			// Should show empty state message
			await waitFor( () => {
				expect( screen.getByText( /all segments are hidden/i ) ).toBeInTheDocument();
			} );

			// Should not render any segments
			expect( screen.queryAllByTestId( 'pie-segment' ) ).toHaveLength( 0 );
		} );

		test( 'does not filter segments when legendInteractive is false', () => {
			const testData = [
				{ label: 'Segment A', value: 50 },
				{ label: 'Segment B', value: 50 },
			];

			renderPieChart( {
				data: testData,
				showLegend: true,
				legend: { interactive: false },
				chartId: 'test-non-interactive-semi-circle-chart',
			} );

			// Legend items should not be buttons
			const buttons = screen.queryAllByRole( 'button' );
			expect( buttons ).toHaveLength( 0 );

			// All segments should be visible
			const segments = screen.getAllByTestId( 'pie-segment' );
			expect( segments ).toHaveLength( 2 );
		} );
	} );
} );
