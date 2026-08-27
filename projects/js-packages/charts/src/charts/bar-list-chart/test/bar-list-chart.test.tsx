import { render, screen } from '@testing-library/react';
import {
	marketingChannelsComparison as salesByChannel,
	salesByProduct,
} from '../../../stories/sample-data';
import BarListChart from '../bar-list-chart';

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

	describe( 'single-series bar tint', () => {
		// visx renders the bars, so they carry no attribute of our own to query by.
		/* eslint-disable testing-library/no-node-access */
		const barFills = () =>
			Array.from(
				screen.getByRole( 'grid' ).querySelectorAll< SVGRectElement >( '.visx-bar-group rect' )
			).map( bar => bar.getAttribute( 'fill' ) );
		/* eslint-enable testing-library/no-node-access */

		// `lightenHexColor( '#3858e9', 1 - BAR_TINT_TOWARD_SERIES )` — the catalog seed travelling
		// 40% from white toward the series colour. Asserted as a literal so a change to the tint has
		// to be made deliberately here rather than tracking the implementation.
		const TINTED_SEED = '#afbcf6';

		test( 'tints the bar so the label it carries stays readable', () => {
			renderChart();
			expect( barFills() ).not.toHaveLength( 0 );
			barFills().forEach( fill => expect( fill ).toBe( TINTED_SEED ) );
		} );

		test( 'leaves a series carrying its own stroke at full strength', () => {
			renderChart( {
				data: salesByProduct.map( series => ( {
					...series,
					options: { ...series.options, stroke: '#ff0000' },
				} ) ),
			} );
			expect( barFills() ).not.toHaveLength( 0 );
			barFills().forEach( fill => expect( fill ).toBe( '#ff0000' ) );
		} );

		test( 'leaves multi-series bars at full strength, where the label is lifted clear', () => {
			renderChart( { data: salesByChannel } );
			expect( barFills() ).not.toHaveLength( 0 );
			expect( barFills() ).not.toContain( TINTED_SEED );
		} );
	} );
} );
