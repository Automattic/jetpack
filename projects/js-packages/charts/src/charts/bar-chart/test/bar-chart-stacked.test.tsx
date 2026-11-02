import { render, screen } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import { BarChartUnresponsive } from '../bar-chart';
import type { SeriesData } from '../../../types';
import type { BarChartProps } from '../types';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

const day = ( label: string, value: number | null ) => ( { label, value } );

const DATA: SeriesData[] = [
	{ label: 'Desktop', data: [ day( 'Mon', 100 ), day( 'Tue', 50 ) ] },
	{ label: 'Mobile', data: [ day( 'Mon', 60 ), day( 'Tue', null ) ] },
	{ label: 'Tablet', data: [ day( 'Mon', 20 ), day( 'Tue', 10 ) ] },
];

type Rect = { x: number; y: number; width: number; height: number };

// visx draws the bars and the axes; neither accepts a test id.
/* eslint-disable testing-library/no-node-access */
const barRects = () =>
	Array.from( screen.getByRole( 'application' ).querySelectorAll( '.visx-bar-group rect' ) );

// The x axis renders first; the value axis is the y axis unless the bars run horizontally.
const valueTicks = ( horizontal = false ) =>
	Array.from(
		screen
			.getByRole( 'application' )
			.querySelectorAll( '.visx-axis' )
			[ horizontal ? 0 : 1 ].querySelectorAll( '.visx-axis-tick text' )
	).map( tick => Number( tick.textContent?.replace( /,/g, '' ) ) );
/* eslint-enable testing-library/no-node-access */

const geometry = ( element: Element ): Rect => ( {
	x: Number( element.getAttribute( 'x' ) ),
	y: Number( element.getAttribute( 'y' ) ),
	width: Number( element.getAttribute( 'width' ) ),
	height: Number( element.getAttribute( 'height' ) ),
} );

/**
 * A drawn bar: the series' bars follow each other in data order, each skipping a missing reading.
 *
 * @param data     - The series the chart draws.
 * @param label    - The series.
 * @param category - The category's index in that series.
 * @return The bar's geometry.
 */
const barIn = ( data: SeriesData[], label: string, category = 0 ): Rect => {
	let index = 0;
	for ( const series of data ) {
		const drawn = series.data.map( point => point.value !== null );
		if ( series.label === label ) {
			return geometry( barRects()[ index + drawn.slice( 0, category ).filter( Boolean ).length ] );
		}
		index += drawn.filter( Boolean ).length;
	}
	throw new Error( `No series ${ label }` );
};
const barOf = ( label: string, category = 0 ) => barIn( DATA, label, category );

const renderStacked = ( props: Partial< BarChartProps > = {} ) =>
	render(
		<GlobalChartsProvider>
			<BarChartUnresponsive
				width={ 500 }
				height={ 300 }
				data={ DATA }
				layout="stacked"
				withTooltips
				{ ...props }
			/>
		</GlobalChartsProvider>
	);

describe( 'BarChart stacked layout', () => {
	it( 'stacks each category bottom to top in data order, one bar wide', () => {
		renderStacked();

		expect( barRects() ).toHaveLength( 5 );
		const [ desktop, mobile, tablet ] = [ 'Desktop', 'Mobile', 'Tablet' ].map( label =>
			barOf( label )
		);
		expect( mobile.y + mobile.height ).toBeCloseTo( desktop.y );
		expect( tablet.y + tablet.height ).toBeCloseTo( mobile.y );
		expect( new Set( [ desktop.x, mobile.x, tablet.x ] ).size ).toBe( 1 );
		expect( new Set( [ desktop.width, mobile.width, tablet.width ] ).size ).toBe( 1 );
	} );

	it( 'sits a bar on the one below a missing reading', () => {
		renderStacked();

		const tablet = barOf( 'Tablet', 1 );
		expect( tablet.y + tablet.height ).toBeCloseTo( barOf( 'Desktop', 1 ).y );
	} );

	it( 'places the stack in the slot the overlap layout gives a lone series', () => {
		const view = renderStacked();
		const stacked = barOf( 'Desktop' );
		view.unmount();

		renderStacked( { layout: 'overlap', data: DATA.slice( 0, 1 ) } );
		const lone = geometry( barRects()[ 0 ] );

		expect( stacked.x ).toBeCloseTo( lone.x );
		expect( stacked.width ).toBeCloseTo( lone.width );
	} );

	it( 'scales the value axis to the tallest stack', () => {
		renderStacked();

		// The tallest single bar is 100; the Monday stack reaches 180 and must not run off the top.
		expect( Math.max( ...valueTicks() ) ).toBeGreaterThan( 100 );
		expect( barOf( 'Tablet' ).y ).toBeGreaterThanOrEqual( 0 );
	} );

	it( 'draws no comparison series, and says so', () => {
		const warn = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
		renderStacked( {
			data: [
				...DATA,
				{ label: 'Previous', options: { type: 'comparison' }, data: [ day( 'Mon', 500 ) ] },
			],
		} );

		expect( barRects() ).toHaveLength( 5 );
		expect( Math.max( ...valueTicks() ) ).toBeLessThan( 500 );
		expect( warn ).toHaveBeenCalledWith( expect.stringContaining( 'comparison series' ) );
		warn.mockRestore();
	} );

	it( 'adds the barClassName classes to stacked bars', () => {
		renderStacked( {
			barClassName: datum => ( datum.label === 'Mon' ? 'is-monday' : undefined ),
		} );

		expect( barRects().filter( bar => bar.classList.contains( 'is-monday' ) ) ).toHaveLength( 3 );
	} );
} );
