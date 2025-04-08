import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { ThemeProvider } from '../../../providers/theme';
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
		<ThemeProvider>
			<PieSemiCircleChart { ...props } />
		</ThemeProvider>
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
			{ label: 'MacOS', value: 30000, valueDisplay: '30K', percentage: 5 },
			{ label: 'Linux', value: 22000, valueDisplay: '22K', percentage: 1 },
			{ label: 'Windows', value: 80000, valueDisplay: '80K', percentage: 2 },
		];

		renderPieChart( { data: testData, withTooltips: true } );

		const segments = screen.getAllByTestId( 'pie-segment' );
		const firstSegment = segments[ 0 ];

		// Wrap hover interaction in act()
		await act( async () => {
			await user.hover( firstSegment );
		} );

		// Check for tooltip content with flexible text matching
		const tooltipText = screen.getByText( content => {
			return content.includes( 'MacOS' ) || content.includes( '30K' );
		} );
		expect( tooltipText ).toBeInTheDocument();
	} );

	it( 'hides tooltip on mouse leave', async () => {
		const user = userEvent.setup();
		const testData = [
			{ label: 'MacOS', value: 30000, valueDisplay: '30K', percentage: 5 },
			{ label: 'Linux', value: 22000, valueDisplay: '22K', percentage: 1 },
			{ label: 'Windows', value: 80000, valueDisplay: '80K', percentage: 2 },
		];

		renderPieChart( { data: testData, withTooltips: true } );

		const segments = screen.getAllByTestId( 'pie-segment' );
		const firstSegment = segments[ 0 ];

		await act( async () => {
			await user.hover( firstSegment );
		} );

		// More flexible text matching
		const tooltipText = screen.getByText( content => {
			return content.includes( 'MacOS' ) || content.includes( '30K' );
		} );
		expect( tooltipText ).toBeInTheDocument();

		await act( async () => {
			await user.unhover( firstSegment );
		} );

		// More flexible text matching for absence
		const tooltipAfterUnhover = screen.queryByText( content => {
			return content.includes( 'MacOS' ) || content.includes( '30K' );
		} );
		expect( tooltipAfterUnhover ).not.toBeInTheDocument();
	} );

	it( 'applies custom className', () => {
		const customClass = 'custom-chart';
		renderPieChart( { data: mockData, className: customClass } );
		expect( screen.getByTestId( 'pie-chart-container' ) ).toHaveClass( customClass );
	} );

	it( 'renders with different thickness values', () => {
		const { rerender } = renderPieChart( { data: mockData, thickness: 0.2 } );
		const thinSegment = screen.getAllByTestId( 'pie-segment' )[ 0 ];
		const thinPathD = thinSegment.getAttribute( 'd' );

		rerender(
			<ThemeProvider>
				<PieSemiCircleChart data={ mockData } thickness={ 0.8 } />
			</ThemeProvider>
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
} );
