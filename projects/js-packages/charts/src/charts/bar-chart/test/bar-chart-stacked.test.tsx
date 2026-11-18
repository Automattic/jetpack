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

		// The tallest single bar is 100; a domain short of the 180 stack would clip Tablet's top segment.
		expect( barOf( 'Tablet' ).height / barOf( 'Desktop' ).height ).toBeCloseTo( 20 / 100 );
	} );

	it( 'widens small stacked totals so rounded value ticks stay distinct', () => {
		renderStacked( {
			data: [
				{ label: 'A', data: [ day( 'Mon', 0.1 ) ] },
				{ label: 'B', data: [ day( 'Mon', 0.15 ) ] },
			],
			options: {
				axis: { y: { tickDecimals: 0, tickFormat: value => Number( value ).toFixed( 0 ) } },
			},
		} );

		expect( valueTicks() ).toEqual( [ 0, 1 ] );
	} );

	it( 'keeps the stack inside a caller domain that leaves out zero', () => {
		renderStacked( { options: { yScale: { domain: [ 50, 200 ] } } } );

		const desktop = barOf( 'Desktop' );
		expect( desktop.y + desktop.height ).toBeCloseTo( plotBottom() );
	} );

	it.each< [ string, NonNullable< BarChartProps[ 'options' ] >[ 'yScale' ], string ] >( [
		[ 'a log scale', { type: 'log' }, 'log scale is ignored' ],
		[ 'a sqrt scale', { type: 'sqrt' }, 'sqrt scale is ignored' ],
		[ 'zero: false', { zero: false }, 'zero: false has no effect' ],
	] )( 'says %s on the value axis is ignored', ( _name, yScale, message ) => {
		const warn = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
		renderStacked( { options: { yScale } } );

		expect( warn ).toHaveBeenCalledWith( expect.stringContaining( message ) );
		warn.mockRestore();
	} );

	it.each( [ 'vertical', 'horizontal' ] as const )(
		'draws a %s stack on a linear value scale when a log scale is asked for',
		orientation => {
			const scale = orientation === 'horizontal' ? 'xScale' : 'yScale';
			const bars = ( options: BarChartProps[ 'options' ] ) => {
				const { unmount } = renderStacked( { orientation, options } );
				const drawn = barRects().map( geometry );
				unmount();
				return drawn;
			};

			expect( bars( { [ scale ]: { type: 'log', zero: false } } ) ).toEqual( bars( {} ) );
		}
	);

	it.each( [ 'vertical', 'horizontal' ] as const )(
		'anchors the %s tooltip at the drawn stack end when its total exceeds the caller domain',
		async orientation => {
			const user = userEvent.setup();
			const horizontal = orientation === 'horizontal';
			renderStacked( {
				orientation,
				options: horizontal
					? { xScale: { domain: [ 0, 100 ] } }
					: { yScale: { domain: [ 0, 100 ] } },
			} );

			await user.tab();
			await user.keyboard( '{ArrowRight}' );
			const desktop = barOf( 'Desktop' );
			expect( Number( lastAnchor()[ horizontal ? 'left' : 'top' ] ) ).toBeCloseTo(
				horizontal ? desktop.x + desktop.width : desktop.y
			);
			expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( 'Total: 180' );
		}
	);

	it.each( [
		[ 'vertical', 'height', 'top' ],
		[ 'horizontal', 'width', 'right' ],
	] as const )(
		'cuts a %s stack off at a caller domain it exceeds, and rounds the end that is drawn',
		( orientation, length, end ) => {
			renderStacked( {
				orientation,
				options:
					orientation === 'horizontal'
						? { xScale: { domain: [ 0, 100 ] } }
						: { yScale: { domain: [ 0, 100 ] } },
			} );

			expect( barOf( 'Mobile' )[ length ] ).toBeCloseTo( 0 );
			expect( barOf( 'Tablet' )[ length ] ).toBeCloseTo( 0 );
			// Desktop Mon, Desktop Tue, Mobile Mon, Tablet Mon, Tablet Tue.
			expect( barRects().map( bar => bar.getAttribute( 'data-stack-end' ) ) ).toEqual( [
				end,
				null,
				null,
				null,
				end,
			] );
		}
	);

	it.each< [ string, ( bar: Rect ) => string ] >( [
		[ 'vertical', bar => `0 ${ bar.y + bar.height }px` ],
		[ 'horizontal', bar => `${ bar.x }px 0` ],
	] )( 'grows a %s stack with negative readings from the zero line', ( orientation, origin ) => {
		const data: SeriesData[] = [
			{ label: 'A', data: [ day( 'Mon', 40 ) ] },
			{ label: 'B', data: [ day( 'Mon', -20 ) ] },
		];
		renderStacked( { data, orientation: orientation as BarChartProps[ 'orientation' ] } );

		expect( screen.getByTestId( 'bar-chart-stack-group' ) ).toHaveStyle( {
			transformOrigin: origin( barIn( data, 'A' ) ),
		} );
	} );

	// Each series' previous period, paired by group; Mon sums to 500 against a 180 stack.
	const WITH_PREVIOUS: SeriesData[] = [
		...DATA.map( series => ( { ...series, group: series.label } ) ),
		...[
			[ 'Desktop', 300, 40 ],
			[ 'Mobile', 150, 20 ],
			[ 'Tablet', 50, null ],
		].map( ( [ label, mon, tue ] ) => ( {
			label: `${ label } (prev)`,
			group: label as string,
			options: { type: 'comparison' as const },
			data: [ day( 'Mon', mon as number ), day( 'Tue', tue as number | null ) ],
		} ) ),
	];
	// The five primary bars come first, then the comparison total at Mon and Tue.
	const previousBar = ( category = 0, primaryBars = 5 ) =>
		geometry( barRects()[ primaryBars + category ] );

	it( 'sums the comparisons into one bar beside each stack, in one color, scaled with the stack', () => {
		const fills = () => barRects().map( bar => bar.getAttribute( 'fill' ) );
		const { unmount } = renderStacked();
		const plainFills = fills();
		unmount();

		renderStacked( { data: WITH_PREVIOUS } );

		expect( barRects() ).toHaveLength( 7 );
		const desktop = barIn( WITH_PREVIOUS, 'Desktop' );
		expect( previousBar().x ).toBeGreaterThanOrEqual( desktop.x + desktop.width );
		expect( previousBar().height / desktop.height ).toBeCloseTo( 500 / 100 );
		expect( fills().slice( 0, 5 ) ).toEqual( plainFills );
		expect( new Set( fills().slice( 5 ) ).size ).toBe( 1 );
	} );

	it( 'lists the comparison total after the stack total, named by the legend comparison item', async () => {
		renderStacked( {
			data: WITH_PREVIOUS,
			showLegend: true,
			legend: { comparisonItem: 'Prev. 7 days' },
		} );

		pointer( 'pointermove', center( previousBar() ) );
		const tooltip = await screen.findByRole( 'tooltip' );
		expect( tooltip ).toHaveTextContent(
			/Mon.*Tablet: 20.*Mobile: 60.*Desktop: 100.*Total: 180.*Prev\. 7 days: 500/
		);
		expect( screen.getByText( 'Prev. 7 days' ) ).toBeInTheDocument();
	} );

	it( 'stops on the comparison total after its stack, and rings it', async () => {
		const user = userEvent.setup();
		renderStacked( { data: WITH_PREVIOUS } );

		await user.tab();
		await user.keyboard( '{ArrowRight}{ArrowRight}' );
		expect( screen.getByTestId( 'chart-tooltip-1' ) ).toHaveTextContent(
			/Mon.*Total: 180.*Comparison period: 500/
		);
		expect( rounded( selectedRing() ) ).toEqual( rounded( previousBar() ) );
	} );

	it.each( [
		[ 'vertical', [ 300, 150, 50 ], 'top' ],
		[ 'horizontal', [ 300, 150, 50 ], 'right' ],
		[ 'vertical', [ -30, -20, 0 ], 'bottom' ],
		[ 'vertical', [ 30, -20, 0 ], 'both' ],
	] as const )(
		'rounds the outer end of a %s comparison total of %p as %s',
		( orientation, monday, end ) => {
			const data = WITH_PREVIOUS.map( series =>
				series.options?.type === 'comparison'
					? {
							...series,
							data: [
								day(
									'Mon',
									monday[ [ 'Desktop', 'Mobile', 'Tablet' ].indexOf( series.group as string ) ]
								),
							],
						}
					: series
			);
			renderStacked( { data, orientation } );

			expect( barRects()[ 5 ] ).toHaveAttribute( 'data-stack-end', end );
		}
	);

	it( 'shows the empty state once every stacked series is hidden, comparisons and all', () => {
		renderStacked( {
			data: WITH_PREVIOUS,
			showLegend: true,
			legend: { interactive: true },
			defaultHiddenSeries: DATA.map( series => series.label ),
		} );

		expect( screen.queryAllByTestId( 'bar-chart-stacked-bar' ) ).toHaveLength( 0 );
		expect( screen.getByText( /All series are hidden/ ) ).toBeInTheDocument();
	} );

	it( 'leaves the comparison item out of the legend while the comparisons are hidden', () => {
		renderStacked( {
			data: WITH_PREVIOUS,
			showLegend: true,
			legend: { comparisonItem: 'Prev. 7 days' },
			defaultHiddenSeries: WITH_PREVIOUS.slice( 3 ).map( series => series.label ),
		} );

		expect( barRects() ).toHaveLength( 5 );
		expect( screen.queryByText( 'Prev. 7 days' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps a comparison in the total while a primary of its group is shown', async () => {
		const user = userEvent.setup();
		const data: SeriesData[] = [
			{ label: 'Posts', group: 'web', data: [ day( 'Mon', 100 ) ] },
			{ label: 'Pages', group: 'web', data: [ day( 'Mon', 50 ) ] },
			{
				label: 'Web (prev)',
				group: 'web',
				options: { type: 'comparison' },
				data: [ day( 'Mon', 300 ) ],
			},
		];
		renderStacked( { data, showLegend: true, legend: { interactive: true } } );

		await user.click( screen.getByRole( 'button', { name: /Pages/ } ) );
		expect( previousBar( 0, 1 ).height / barIn( data, 'Posts' ).height ).toBeCloseTo( 300 / 100 );
	} );

	it( "drops a hidden series' comparison from the total", async () => {
		const user = userEvent.setup();
		renderStacked( { data: WITH_PREVIOUS, showLegend: true, legend: { interactive: true } } );

		await user.click( screen.getByRole( 'button', { name: /Mobile/ } ) );
		const desktop = barIn(
			WITH_PREVIOUS.filter( series => series.label !== 'Mobile' ),
			'Desktop'
		);
		expect( previousBar( 0, 4 ).height / desktop.height ).toBeCloseTo( 350 / 100 );
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

	const NEGATIVE_DATA: SeriesData[] = [
		{ label: 'Desktop', data: [ day( 'Mon', -100 ) ] },
		{ label: 'Tablet', data: [ day( 'Mon', -5 ) ] },
	];

	it.each< [ string, string, SeriesData[], 'top' | 'left', ( bar: Rect ) => number ] >( [
		[ 'vertical', 'positive', ANCHOR_DATA, 'top', bar => bar.y ],
		[ 'horizontal', 'positive', ANCHOR_DATA, 'left', bar => bar.x + bar.width ],
		[ 'vertical', 'all-negative', NEGATIVE_DATA, 'top', bar => bar.y + bar.height ],
		[ 'horizontal', 'all-negative', NEGATIVE_DATA, 'left', bar => bar.x ],
	] )(
		'anchors the keyboard tooltip at the drawn end of a %s %s stack',
		async ( orientation, _sign, data, side, end ) => {
			const user = userEvent.setup();
			renderStacked( { orientation: orientation as BarChartProps[ 'orientation' ], data } );

			await user.tab();
			await user.keyboard( '{ArrowRight}' );

			expect( Number( lastAnchor()[ side ] ) ).toBeCloseTo( end( barIn( data, 'Tablet' ) ) );
		}
	);

	it( 'outlines both sides of a stack with positive and negative readings', async () => {
		const user = userEvent.setup();
		const data: SeriesData[] = [
			{ label: 'A', data: [ day( 'Mon', 40 ) ] },
			{ label: 'B', data: [ day( 'Mon', -20 ) ] },
		];
		renderStacked( { data } );

		await user.tab();
		await user.keyboard( '{ArrowRight}' );
		expect( rounded( selectedRing() ) ).toEqual(
			rounded( union( [ barIn( data, 'A' ), barIn( data, 'B' ) ] ) )
		);
	} );

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
