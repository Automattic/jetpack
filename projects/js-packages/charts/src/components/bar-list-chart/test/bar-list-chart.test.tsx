/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import BarListChart from '../bar-list-chart';
import { salesByChannel, salesByProduct } from '../stories/sample-data';

const defaultProps = {
	width: 500,
	height: 300,
	data: salesByProduct,
};

const renderChart = ( props = {} ) => {
	return render( <BarListChart { ...defaultProps } { ...props } /> );
};

describe( 'BarListChart', () => {
	test( 'renders with single series data', () => {
		renderChart();
		expect( screen.getByText( /Behemoth hat/ ) ).toBeInTheDocument();
		expect( screen.getByText( '32.4K' ) ).toBeInTheDocument();
	} );

	test( 'renders with multi-series data', () => {
		renderChart( { data: salesByChannel } );
		expect( screen.getByText( /Organic search/ ) ).toBeInTheDocument();
		expect( screen.getByText( '50K' ) ).toBeInTheDocument();
	} );

	test( 'shows legend when showLegend is true', () => {
		renderChart( { data: salesByChannel, showLegend: true } );
		expect( screen.getByText( 'Jan 21-Aug 8, 2024' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Jan 21-Aug 8, 2023' ) ).toBeInTheDocument();
	} );

	test( 'renders with custom labelComponent', () => {
		renderChart( {
			options: {
				labelComponent: ( { label } ) => <span data-testid="custom-label">Label: { label }</span>,
				yScale: {},
				xScale: {},
			},
			data: salesByProduct,
		} );
		const labelNodes = screen.getAllByTestId( 'custom-label' );
		expect( labelNodes ).toHaveLength( salesByProduct[ 0 ].data.length );
		expect( labelNodes[ 0 ] ).toHaveTextContent( 'Label: Behemoth hat' );
	} );

	test( 'renders with custom valueComponent', () => {
		renderChart( {
			options: {
				valueComponent: ( { value } ) => <span data-testid="custom-value">Value: { value }</span>,
				yScale: {},
				xScale: {},
			},
			data: salesByProduct,
		} );
		const valueNodes = screen.getAllByTestId( 'custom-value' );
		expect( valueNodes ).toHaveLength( salesByProduct[ 0 ].data.length );
		expect( valueNodes[ 0 ] ).toHaveTextContent( 'Value: 32400' );
	} );

	test( 'handles empty data array', () => {
		renderChart( { data: [] } );
		expect( screen.queryByText( 'Behemoth hat ' ) ).not.toBeInTheDocument();
	} );
} );
