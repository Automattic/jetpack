/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import {
	pickMetricTileLayout,
	readColumnSpan,
	useMetricTileLayout,
} from '../use-metric-tile-layout';

describe( 'pickMetricTileLayout', () => {
	// Height-1 and height-2 bodies at the dashboard's 200px rows.
	const SHORT = 118;
	const TALL = 326;

	it( 'stacks a one-column widget whose rows have room', () => {
		expect(
			pickMetricTileLayout( { width: 766, height: TALL, tileCount: 4, columnSpan: 1 } )
		).toBe( 'stacked' );
	} );

	it( 'compacts a one-column widget whose rows do not have room', () => {
		expect(
			pickMetricTileLayout( { width: 400, height: SHORT, tileCount: 4, columnSpan: 1 } )
		).toBe( 'compact' );
	} );

	it( 'keeps a one-column widget a list however wide it is', () => {
		expect(
			pickMetricTileLayout( { width: 1200, height: TALL, tileCount: 4, columnSpan: 1 } )
		).toBe( 'stacked' );
	} );

	it( 'grids a multi-column widget with room for every tile row', () => {
		expect(
			pickMetricTileLayout( { width: 580, height: TALL, tileCount: 4, columnSpan: 2 } )
		).toBe( 'grid' );
	} );

	it( 'rows a multi-column widget too short for the grid', () => {
		expect(
			pickMetricTileLayout( { width: 1200, height: SHORT, tileCount: 4, columnSpan: 3 } )
		).toBe( 'row' );
	} );

	it( 'counts an odd tile as its own grid row', () => {
		expect( pickMetricTileLayout( { width: 580, height: 200, tileCount: 3, columnSpan: 2 } ) ).toBe(
			'grid'
		);
		expect( pickMetricTileLayout( { width: 580, height: 200, tileCount: 5, columnSpan: 2 } ) ).toBe(
			'row'
		);
	} );

	it( 'falls back to the width outside a dashboard grid', () => {
		expect(
			pickMetricTileLayout( { width: 360, height: TALL, tileCount: 4, columnSpan: null } )
		).toBe( 'stacked' );
		expect(
			pickMetricTileLayout( { width: 380, height: TALL, tileCount: 4, columnSpan: null } )
		).toBe( 'grid' );
	} );

	it( 'treats no tiles as one row', () => {
		expect(
			pickMetricTileLayout( { width: 360, height: 70, tileCount: 0, columnSpan: null } )
		).toBe( 'stacked' );
	} );
} );

describe( 'readColumnSpan', () => {
	it( 'reads the nearest grid item span above the element', () => {
		render(
			<div style={ { display: 'grid' } }>
				<div style={ { gridColumnEnd: 'span 2' } }>
					<div>
						<div data-testid="probe" />
					</div>
				</div>
			</div>
		);

		expect( readColumnSpan( screen.getByTestId( 'probe' ) ) ).toBe( 2 );
	} );

	it( 'returns null outside a grid item', () => {
		render(
			<div>
				<div data-testid="probe" />
			</div>
		);

		const span = readColumnSpan( screen.getByTestId( 'probe' ) );

		expect( span ).toBeNull();
	} );
} );

describe( 'useMetricTileLayout', () => {
	function Probe( { tileCount }: { tileCount: number } ) {
		const [ ref, layout ] = useMetricTileLayout< HTMLDivElement >( tileCount );
		return <div ref={ ref } data-testid="probe" data-layout={ layout } />;
	}

	function mockElementSize( width: number, height: number ) {
		jest.spyOn( HTMLElement.prototype, 'getBoundingClientRect' ).mockReturnValue( {
			width,
			height,
			top: 0,
			left: 0,
			right: width,
			bottom: height,
			x: 0,
			y: 0,
			toJSON: () => ( {} ),
		} );
	}

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'exposes the layout for the measured box and column span', () => {
		mockElementSize( 580, 326 );
		render(
			<div style={ { gridColumnEnd: 'span 2' } }>
				<Probe tileCount={ 4 } />
			</div>
		);

		expect( screen.getByTestId( 'probe' ) ).toHaveAttribute( 'data-layout', 'grid' );
	} );

	it( 'picks the list for a one-column widget of the same size', () => {
		mockElementSize( 580, 326 );
		render(
			<div style={ { gridColumnEnd: 'span 1' } }>
				<Probe tileCount={ 4 } />
			</div>
		);

		expect( screen.getByTestId( 'probe' ) ).toHaveAttribute( 'data-layout', 'stacked' );
	} );
} );
