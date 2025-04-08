import { render, screen } from '@testing-library/react';
import { scaleBand, scaleLinear } from '@visx/scale';
import GridControl from '../grid-control';

describe( 'GridControl', () => {
	const defaultProps = {
		width: 200,
		height: 200,
		xScale: scaleBand( { domain: [ 'A', 'B', 'C' ], range: [ 0, 100 ] } ),
		yScale: scaleLinear( { domain: [ 0, 100 ], range: [ 100, 0 ] } ),
	};

	test( 'renders x-axis grid lines', () => {
		render(
			<svg>
				<GridControl { ...defaultProps } gridVisibility="x" />
			</svg>
		);
		const xGridLines = screen.getAllByTestId( 'x-grid' );
		expect( xGridLines.length ).toBeGreaterThan( 0 );
		expect( screen.queryAllByTestId( 'y-grid' ) ).toHaveLength( 0 );
	} );

	test( 'renders y-axis grid lines', () => {
		render(
			<svg>
				<GridControl { ...defaultProps } gridVisibility="y" />
			</svg>
		);
		expect( screen.queryAllByTestId( 'x-grid' ) ).toHaveLength( 0 );
		const yGridLines = screen.getAllByTestId( 'y-grid' );
		expect( yGridLines.length ).toBeGreaterThan( 0 );
	} );

	test( 'renders both axes grid lines', () => {
		render(
			<svg>
				<GridControl { ...defaultProps } gridVisibility="xy" />
			</svg>
		);
		const xGridLines = screen.getAllByTestId( 'x-grid' );
		const yGridLines = screen.getAllByTestId( 'y-grid' );
		expect( xGridLines.length ).toBeGreaterThan( 0 );
		expect( yGridLines.length ).toBeGreaterThan( 0 );
	} );

	test( 'renders no grid lines when visibility is none', () => {
		render(
			<svg>
				<GridControl { ...defaultProps } gridVisibility="none" />
			</svg>
		);
		expect( screen.queryAllByTestId( 'x-grid' ) ).toHaveLength( 0 );
		expect( screen.queryAllByTestId( 'y-grid' ) ).toHaveLength( 0 );
	} );
} );
