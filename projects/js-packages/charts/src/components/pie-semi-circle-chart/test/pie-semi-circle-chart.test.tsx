import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
		renderPieChart( { data: mockData, withTooltips: true } );
		const segment = screen.getAllByTestId( 'pie-segment' )[ 0 ];

		await userEvent.hover( segment );

		expect( screen.getByText( 'Category A' ) ).toBeInTheDocument();
		expect( screen.getByText( '30%' ) ).toBeInTheDocument();
	} );

	it( 'hides tooltip on mouse leave', async () => {
		renderPieChart( { data: mockData, withTooltips: true } );
		const segment = screen.getAllByTestId( 'pie-segment' )[ 0 ];

		await userEvent.hover( segment );
		expect( screen.getByText( 'Category A' ) ).toBeInTheDocument();

		await userEvent.unhover( segment );
		expect( screen.queryByText( 'Category A' ) ).not.toBeInTheDocument();
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
		const size = 400;
		renderPieChart( { data: mockData, size } );
		const svg = screen.getByTestId( 'pie-chart-svg' );

		expect( svg ).toHaveAttribute( 'width', size.toString() );
		expect( svg ).toHaveAttribute( 'height', ( size / 2 ).toString() );
		expect( svg ).toHaveAttribute( 'viewBox', `0 0 ${ size } ${ size / 2 }` );
	} );
} );
