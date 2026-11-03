import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import { selectedBarRingBounds as selectedRing } from '../../../test-utils/selected-bar-ring';
import { BarChartUnresponsive } from '../bar-chart';
import type { SeriesData } from '../../../types';
import type { BarChartProps } from '../types';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

// The anchor the tooltip snaps to, before the box is placed against bounds jsdom cannot measure.
const anchors: Array< { left?: number; top?: number } > = [];
jest.mock( '../../../components/tooltip/private/bounded-tooltip', () => {
	const actual = jest.requireActual( '../../../components/tooltip/private/bounded-tooltip' );
	return {
		...actual,
		BoundedTooltip: ( props: { left?: number; top?: number } ) => {
			anchors.push( { left: props.left, top: props.top } );
			return actual.BoundedTooltip( props );
		},
	};
} );
const lastAnchor = () => anchors[ anchors.length - 1 ];

const day = ( label: string, value: number | null ) => ( { label, value } );

const DATA: SeriesData[] = [
	{ label: 'Desktop', data: [ day( 'Mon', 100 ), day( 'Tue', 50 ) ] },
	{ label: 'Mobile', data: [ day( 'Mon', 60 ), day( 'Tue', null ) ] },
	{ label: 'Tablet', data: [ day( 'Mon', 20 ), day( 'Tue', 10 ) ] },
];

type Rect = { x: number; y: number; width: number; height: number };

const barRects = () => screen.getAllByTestId( 'bar-chart-stacked-bar' );

// visx draws the axes and the pointer target; neither accepts a test id.
/* eslint-disable testing-library/no-node-access */
const pointer = ( type: string, clientX: number, clientY = 150 ) =>
	fireEvent(
		screen.getByRole( 'application' ).querySelector( 'svg > rect[fill="transparent"]' ),
		new MouseEvent( type, { bubbles: true, clientX, clientY } )
	);

// The x axis renders first; the value axis is the y axis unless the bars run horizontally.
const valueTicks = ( horizontal = false ) =>
	Array.from(
		screen
			.getByRole( 'application' )
			.querySelectorAll( '.visx-axis' )
			[ horizontal ? 0 : 1 ].querySelectorAll( '.visx-axis-tick text' )
	).map( tick => Number( tick.textContent?.replace( /,/g, '' ) ) );

// The x axis sits on the bottom edge of the plot, placed by its group's transform.
const plotBottom = () => {
	const transform =
		screen.getByRole( 'application' ).querySelector( '.visx-axis' )?.getAttribute( 'transform' ) ??
		'';
	return Number( transform.match( /translate\(\s*[-\d.]+,\s*([-\d.]+)\)/ )?.[ 1 ] );
};

const categoryTicks = () =>
	Array.from(
		screen
			.getByRole( 'application' )
			.querySelectorAll( '.visx-axis' )[ 0 ]
			.querySelectorAll( '.visx-axis-tick line' )
	).map( tick => Number( tick.getAttribute( 'x1' ) ) );
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

const center = ( { x, width }: Rect ) => x + width / 2;
const middle = ( { y, height }: Rect ) => y + height / 2;

const union = ( rects: Rect[] ): Rect => {
	const x = Math.min( ...rects.map( r => r.x ) );
	const y = Math.min( ...rects.map( r => r.y ) );
	return {
		x,
		y,
		width: Math.max( ...rects.map( r => r.x + r.width ) ) - x,
		height: Math.max( ...rects.map( r => r.y + r.height ) ) - y,
	};
};

const rounded = ( rect: Rect ) =>
	Object.fromEntries(
		Object.entries( rect ).map( ( [ side, value ] ) => [ side, value.toFixed( 1 ) ] )
	);

describe( 'BarChart stacked layout', () => {
	const screenTransform = Object.getOwnPropertyDescriptor( SVGElement.prototype, 'getScreenCTM' );
	beforeAll( () => {
		// jsdom lacks the SVG transform used by visx to convert pointer coordinates.
		Object.defineProperty( SVGElement.prototype, 'getScreenCTM', {
			configurable: true,
			value: () => null,
		} );
	} );

	beforeEach( () => {
		anchors.length = 0;
	} );

	afterAll( () => {
		if ( screenTransform ) {
			Object.defineProperty( SVGElement.prototype, 'getScreenCTM', screenTransform );
		} else {
			Reflect.deleteProperty( SVGElement.prototype, 'getScreenCTM' );
		}
	} );

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

	it( 'centers each stack on its category', () => {
		renderStacked();

		const [ monday, tuesday ] = categoryTicks();
		expect( center( barOf( 'Desktop' ) ) ).toBeCloseTo( monday );
		expect( center( barOf( 'Desktop', 1 ) ) ).toBeCloseTo( tuesday );
	} );

	it( 'scales the value axis to the tallest stack', () => {
		renderStacked();

		// The tallest single bar is 100; the Monday stack reaches 180 and must not run off the top.
		expect( Math.max( ...valueTicks() ) ).toBeGreaterThan( 100 );
		expect( barOf( 'Tablet' ).y ).toBeGreaterThanOrEqual( 0 );
	} );

	it( 'keeps the stack inside a caller domain that leaves out zero', () => {
		renderStacked( { options: { yScale: { domain: [ 50, 200 ] } } } );

		const desktop = barOf( 'Desktop' );
		expect( desktop.y + desktop.height ).toBeCloseTo( plotBottom() );
	} );

	it( 'leaves comparison series out of the bars, colors and legend, and says so', () => {
		const warn = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
		const fills = () => barRects().map( bar => bar.getAttribute( 'fill' ) );
		const { unmount } = renderStacked( { showLegend: true } );
		const plainFills = fills();
		unmount();

		renderStacked( {
			showLegend: true,
			data: [
				...DATA,
				{ label: 'Previous', options: { type: 'comparison' }, data: [ day( 'Mon', 500 ) ] },
			],
		} );

		expect( fills() ).toEqual( plainFills );
		expect( screen.queryByText( 'Previous' ) ).not.toBeInTheDocument();
		expect( warn ).toHaveBeenCalledWith( expect.stringContaining( 'comparison series' ) );
		warn.mockRestore();
	} );

	it( 'ignores showZeroValues, so a zero adds nothing to the stack, and says so', () => {
		const warn = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
		const data: SeriesData[] = [
			{ label: 'A', data: [ day( 'Mon', 100 ) ] },
			{ label: 'B', data: [ day( 'Mon', 0 ) ] },
			{ label: 'C', data: [ day( 'Mon', 20 ) ] },
		];
		renderStacked( { data, showZeroValues: true } );

		expect( barIn( data, 'B' ).height ).toBeCloseTo( 0 );
		const c = barIn( data, 'C' );
		expect( c.y + c.height ).toBeCloseTo( barIn( data, 'A' ).y );
		expect( warn ).toHaveBeenCalledWith( expect.stringContaining( 'showZeroValues' ) );
		warn.mockRestore();
	} );

	it( 'adds the barClassName classes to stacked bars', () => {
		renderStacked( {
			barClassName: datum => ( datum.label === 'Mon' ? 'is-monday' : undefined ),
		} );

		expect( barRects().filter( bar => bar.classList.contains( 'is-monday' ) ) ).toHaveLength( 3 );
	} );

	it( 'lists every series at the hovered category, top first, with a total', async () => {
		renderStacked();

		pointer( 'pointermove', center( barOf( 'Desktop' ) ) );
		const tooltip = await screen.findByRole( 'tooltip' );
		expect( tooltip ).toHaveTextContent( /Mon.*Tablet: 20.*Mobile: 60.*Desktop: 100.*Total: 180/ );
	} );

	it( 'lists a series without a reading as no data, and totals the readings', async () => {
		const user = userEvent.setup();
		renderStacked();

		await user.tab();
		await user.keyboard( '{ArrowRight}{ArrowRight}' );
		expect( screen.getByTestId( 'chart-tooltip-1' ) ).toHaveTextContent(
			/Tue.*Tablet: 10.*Mobile: No data.*Desktop: 50.*Total: 60/
		);
	} );

	it( 'totals negative and positive readings together', async () => {
		const user = userEvent.setup();
		renderStacked( {
			data: [
				{ label: 'A', data: [ day( 'Mon', 10 ) ] },
				{ label: 'B', data: [ day( 'Mon', -5 ) ] },
			],
		} );

		await user.tab();
		await user.keyboard( '{ArrowRight}' );
		expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( 'Total: 5' );
		expect( Math.min( ...valueTicks() ) ).toBeLessThan( 0 );
	} );

	it( 'leaves the total out when a category has one reading', async () => {
		const user = userEvent.setup();
		renderStacked( {
			data: [
				{ label: 'A', data: [ day( 'Mon', 5 ), day( 'Tue', 7 ) ] },
				{ label: 'B', data: [ day( 'Mon', 3 ), day( 'Tue', null ) ] },
			],
		} );

		await user.tab();
		await user.keyboard( '{ArrowRight}{ArrowRight}' );
		const tooltip = screen.getByTestId( 'chart-tooltip-1' );
		expect( tooltip ).toHaveTextContent( 'A: 7' );
		expect( tooltip ).toHaveTextContent( 'B: No data' );
		expect( tooltip ).not.toHaveTextContent( 'Total' );
	} );

	it.each( [ 'vertical', 'horizontal' ] as const )(
		'steps the keyboard one category at a time, outlining the whole %s stack',
		async orientation => {
			const user = userEvent.setup();
			renderStacked( { orientation } );

			await user.tab();
			await user.keyboard( '{ArrowRight}' );
			expect( rounded( selectedRing() ) ).toEqual(
				rounded( union( [ 'Desktop', 'Mobile', 'Tablet' ].map( label => barOf( label ) ) ) )
			);

			await user.keyboard( '{ArrowRight}' );
			expect( rounded( selectedRing() ) ).toEqual(
				rounded( union( [ 'Desktop', 'Tablet' ].map( label => barOf( label, 1 ) ) ) )
			);
		}
	);

	// Monday's top segment is the shorter one, but Monday's stack is the taller one.
	const ANCHOR_DATA: SeriesData[] = [
		{ label: 'Desktop', data: [ day( 'Mon', 100 ), day( 'Tue', 20 ) ] },
		{ label: 'Tablet', data: [ day( 'Mon', 5 ), day( 'Tue', 10 ) ] },
	];

	it.each( [
		[ 'vertical', 'top', ( mon: number, tue: number ) => expect( mon ).toBeLessThan( tue ) ],
		[ 'horizontal', 'left', ( mon: number, tue: number ) => expect( mon ).toBeGreaterThan( tue ) ],
	] as const )(
		'anchors the keyboard tooltip at the top of the %s stack',
		async ( orientation, side, compare ) => {
			const user = userEvent.setup();
			renderStacked( { orientation, data: ANCHOR_DATA } );

			await user.tab();
			await user.keyboard( '{ArrowRight}' );
			const mon = Number( lastAnchor()[ side ] );
			await user.keyboard( '{ArrowRight}' );
			const tue = Number( lastAnchor()[ side ] );

			compare( mon, tue );
		}
	);

	it( 'restacks and rescales when a series is hidden from the legend, and again when restored', async () => {
		const user = userEvent.setup();
		renderStacked( { showLegend: true, legend: { interactive: true } } );
		const mobile = screen.getByRole( 'button', { name: /Mobile/ } );
		const topTick = Math.max( ...valueTicks() );

		await user.click( mobile );
		const withoutMobile = DATA.filter( series => series.label !== 'Mobile' );
		const tablet = barIn( withoutMobile, 'Tablet' );
		expect( tablet.y + tablet.height ).toBeCloseTo( barIn( withoutMobile, 'Desktop' ).y );
		expect( Math.max( ...valueTicks() ) ).not.toBe( topTick );

		await user.click( mobile );
		const restored = barOf( 'Mobile' );
		expect( restored.y + restored.height ).toBeCloseTo( barOf( 'Desktop' ).y );
		expect( Math.max( ...valueTicks() ) ).toBe( topTick );
	} );

	it( 'anchors the hovered tooltip at the stack top when its top series has no reading there', async () => {
		const data: SeriesData[] = [
			{ label: 'Desktop', data: [ day( 'Mon', 100 ), day( 'Tue', 50 ) ] },
			{ label: 'Mobile', data: [ day( 'Mon', 60 ), day( 'Tue', 40 ) ] },
			{ label: 'Tablet', data: [ day( 'Mon', 20 ), day( 'Tue', null ) ] },
		];
		renderStacked( { data } );
		const tuesday = barIn( data, 'Desktop', 1 );

		for ( const clientY of [ 10, 250 ] ) {
			pointer( 'pointermove', center( tuesday ), clientY );
			await expect( screen.findByRole( 'tooltip' ) ).resolves.toBeInTheDocument();
			expect( Number( lastAnchor().top ) ).toBeCloseTo( barIn( data, 'Mobile', 1 ).y );
		}
	} );

	const POINTER_DATA: SeriesData[] = [
		{ label: 'Desktop', data: [ day( 'Mon', 100 ), day( 'Tue', 50 ) ] },
		{ label: 'Mobile', data: [ day( 'Mon', 60 ), day( 'Tue', 40 ) ] },
		{ label: 'Tablet', data: [ day( 'Mon', 20 ), day( 'Tue', null ) ] },
	];
	const on = ( label: string ) => () => {
		const bar = barIn( POINTER_DATA, label, 1 );
		return [ center( bar ), middle( bar ) ] as const;
	};

	it.each( [
		[ 'vertical', 'Desktop', on( 'Desktop' ) ],
		[ 'vertical', 'Mobile', on( 'Mobile' ) ],
		// Above the stack, where the top series has no reading on Tuesday.
		[ 'vertical', 'Mobile', () => [ center( barIn( POINTER_DATA, 'Desktop', 1 ) ), 5 ] as const ],
		[ 'horizontal', 'Desktop', on( 'Desktop' ) ],
		[ 'horizontal', 'Mobile', on( 'Mobile' ) ],
	] as const )(
		'reports, on a %s stack, %s for a pointer over its segment',
		( orientation, key, at ) => {
			const onPointerUp = jest.fn();
			renderStacked( { data: POINTER_DATA, orientation, onPointerUp } );

			pointer( 'pointerup', ...at() );
			expect( onPointerUp ).toHaveBeenLastCalledWith(
				expect.objectContaining( {
					key,
					datum: POINTER_DATA.find( series => series.label === key )?.data[ 1 ],
				} )
			);
		}
	);

	it.each( [
		[ 'vertical', 'top', 'bottom' ],
		[ 'horizontal', 'right', 'left' ],
	] as const )(
		'marks only the outer end of each %s stack for rounding',
		( orientation, positiveEnd, negativeEnd ) => {
			const data: SeriesData[] = [
				{ label: 'A', data: [ day( 'Mon', 10 ), day( 'Tue', 8 ) ] },
				{ label: 'B', data: [ day( 'Mon', -5 ), day( 'Tue', 4 ) ] },
				{ label: 'C', data: [ day( 'Mon', 6 ), day( 'Tue', null ) ] },
			];
			renderStacked( { data, orientation } );

			// Each series' bars, Mon then Tue, skipping C's missing Tuesday.
			expect( barRects().map( bar => bar.getAttribute( 'data-stack-end' ) ) ).toEqual( [
				null,
				null,
				negativeEnd,
				positiveEnd,
				positiveEnd,
			] );
		}
	);
} );
