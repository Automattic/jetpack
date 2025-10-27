import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Group } from '@visx/group';
import { Text } from '@visx/text';
import { act } from 'react';
import { GlobalChartsProvider } from '../../../providers';
import PieSemiCircleChart from '../pie-semi-circle-chart';

// Mock data for testing
const mockData = [
	{
		label: 'Category A',
		value: 30,
		valueDisplay: '30%',
		percentage: 30,
	},
	{
		label: 'Category B',
		value: 70,
		valueDisplay: '70%',
		percentage: 70,
	},
];

// Helper function to render component with providers
const renderPieChart = props =>
	render(
		<GlobalChartsProvider>
			<PieSemiCircleChart { ...props } />
		</GlobalChartsProvider>
	);

describe( 'PieSemiCircleChart', () => {
	it( 'renders basic chart with data', () => {
		renderPieChart( { data: mockData } );
		const segments = screen.getAllByTestId( 'pie-segment' );
		expect( segments ).toHaveLength( 2 );
	} );

	it( 'renders custom children content', () => {
		renderPieChart( {
			data: mockData,
			children: (
				<Group>
					<Text textAnchor="middle" y={ -40 }>
						Chart Title
					</Text>
					<Text textAnchor="middle" y={ -20 }>
						Additional Info
					</Text>
				</Group>
			),
		} );

		expect( screen.getByText( 'Chart Title' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Additional Info' ) ).toBeInTheDocument();
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
			{ label: 'MacOS', value: 30000, valueDisplay: '30K', percentage: 5 },
			{ label: 'Linux', value: 22000, valueDisplay: '22K', percentage: 1 },
			{ label: 'Windows', value: 80000, valueDisplay: '80K', percentage: 2 },
		];

		renderPieChart( { data: testData, withTooltips: true, width: 400 } );

		const segments = screen.getAllByTestId( 'pie-segment' );
		const firstSegment = segments[ 0 ];

		// Wrap hover interaction in act()
		await act( async () => {
			await user.hover( firstSegment );
		} );

		// Check for tooltip by looking for the specific tooltip role
		const tooltip = screen.getByRole( 'tooltip' );
		expect( tooltip ).toHaveTextContent( 'MacOS' );
		expect( tooltip ).toHaveTextContent( '30K' );
	} );

	it( 'hides tooltip on mouse leave', async () => {
		const user = userEvent.setup();
		const testData = [
			{ label: 'MacOS', value: 30000, valueDisplay: '30K', percentage: 5 },
			{ label: 'Linux', value: 22000, valueDisplay: '22K', percentage: 1 },
			{ label: 'Windows', value: 80000, valueDisplay: '80K', percentage: 2 },
		];

		renderPieChart( { data: testData, withTooltips: true, width: 400 } );

		const segments = screen.getAllByTestId( 'pie-segment' );
		const firstSegment = segments[ 0 ];

		await act( async () => {
			await user.hover( firstSegment );
		} );

		// Wait for tooltip to be visible - it should show in the BaseTooltip component
		const tooltip = await screen.findByRole( 'tooltip' );
		expect( tooltip ).toHaveTextContent( 'MacOS' );

		await act( async () => {
			await user.unhover( firstSegment );
		} );

		// Verify tooltip is gone - checking for the tooltip role specifically
		await waitFor( () => {
			expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
		} );
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

	it( 'renders with correct dimensions', () => {
		const width = 400;
		render( <PieSemiCircleChart data={ mockData } width={ width } /> );

		const svg = screen.getByTestId( 'pie-chart-svg' );

		expect( svg ).toHaveAttribute( 'width', width.toString() );
		expect( svg ).toHaveAttribute( 'height', ( width / 2 ).toString() );
		expect( svg ).toHaveAttribute( 'viewBox', `0 0 ${ width } ${ width / 2 }` );
	} );

	describe( 'Data Validation', () => {
		test( 'handles empty data array', () => {
			renderPieChart( { data: [] } );
			expect( screen.getByText( 'No data available' ) ).toBeInTheDocument();
		} );

		test( 'handles zero total percentage', () => {
			renderPieChart( {
				data: [
					{ label: 'A', value: 0, percentage: 0 },
					{ label: 'B', value: 0, percentage: 0 },
				],
			} );
			expect(
				screen.getByText( 'Invalid percentage total: Must be greater than 0' )
			).toBeInTheDocument();
		} );

		test( 'handles single data point', () => {
			renderPieChart( {
				data: [ { label: 'Single', value: 100, percentage: 50 } ],
			} );
			expect( screen.getByTestId( 'pie-segment' ) ).toBeInTheDocument();
		} );

		test( 'handles negative values', () => {
			renderPieChart( {
				data: [
					{ label: 'A', value: -30, percentage: -30 },
					{ label: 'B', value: 130, percentage: 130 },
				],
			} );
			expect(
				screen.getByText( 'Invalid data: Negative values are not allowed' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Composition API', () => {
		it( 'renders children with SVG content', () => {
			renderPieChart( {
				data: mockData,
				children: (
					<Group>
						<Text textAnchor="middle" y={ -40 }>
							Custom Title
						</Text>
					</Group>
				),
			} );

			expect( screen.getByText( 'Custom Title' ) ).toBeInTheDocument();
		} );

		it( 'renders PieSemiCircleChart.SVG compound component', () => {
			renderPieChart( {
				data: mockData,
				children: (
					<PieSemiCircleChart.SVG>
						<Group>
							<Text textAnchor="middle" y={ -50 }>
								SVG Component Title
							</Text>
						</Group>
					</PieSemiCircleChart.SVG>
				),
			} );

			expect( screen.getByText( 'SVG Component Title' ) ).toBeInTheDocument();
		} );

		it( 'renders PieSemiCircleChart.HTML compound component', () => {
			renderPieChart( {
				data: mockData,
				children: (
					<PieSemiCircleChart.HTML>
						<div data-testid="html-content">HTML Content</div>
					</PieSemiCircleChart.HTML>
				),
			} );

			expect( screen.getByTestId( 'html-content' ) ).toBeInTheDocument();
			expect( screen.getByText( 'HTML Content' ) ).toBeInTheDocument();
		} );

		it( 'renders mixed SVG and HTML compound components', () => {
			renderPieChart( {
				data: mockData,
				children: [
					<PieSemiCircleChart.SVG key="svg">
						<Group>
							<Text textAnchor="middle" y={ -50 }>
								SVG Title
							</Text>
						</Group>
					</PieSemiCircleChart.SVG>,
					<PieSemiCircleChart.HTML key="html">
						<div data-testid="footer">Chart Footer</div>
					</PieSemiCircleChart.HTML>,
				],
			} );

			expect( screen.getByText( 'SVG Title' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'footer' ) ).toBeInTheDocument();
		} );

		it( 'renders Legend as compound component', () => {
			renderPieChart( {
				data: mockData,
				children: <PieSemiCircleChart.Legend orientation="horizontal" />,
			} );

			expect( screen.getByText( 'Category A' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Category B' ) ).toBeInTheDocument();
		} );
	} );
} );
