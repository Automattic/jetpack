import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import { useGlobalChartsContext } from '../../../providers/chart-context/hooks/use-global-charts-context';
import { selectedBarRingBounds as selectedRing } from '../../../test-utils/selected-bar-ring';
import { BarChartUnresponsive } from '../bar-chart';
import { useBarColors, type GetBarColors } from '../use-bar-colors';
import type { GlobalChartsContextValue } from '../../../providers/chart-context/types';
import type { SeriesData } from '../../../types';
import type { BarChartProps } from '../types';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

const day = ( label: string, value: number ) => ( { label, value } );

const DATA: SeriesData[] = [
	{ label: 'Views', group: 'views', data: [ day( 'Mon', 100 ), day( 'Tue', 120 ) ] },
	{
		label: 'Previous views',
		group: 'views',
		options: { type: 'comparison' },
		data: [ day( 'Mon', 80 ), day( 'Tue', 90 ) ],
	},
	{ label: 'Visitors', group: 'visitors', data: [ day( 'Mon', 40 ), day( 'Tue', 50 ) ] },
	{
		label: 'Previous visitors',
		group: 'visitors',
		options: { type: 'comparison' },
		data: [ day( 'Mon', 30 ), day( 'Tue', 35 ) ],
	},
];

// A shorter comparison period leaves the last category without a bar there.
const WITHOUT_LAST_PREVIOUS_VISITORS = DATA.map( series =>
	series.label === 'Previous visitors' ? { ...series, data: series.data.slice( 0, 1 ) } : series
);

type Rect = { x: number; y: number; width: number; height: number };

// visx draws the bars and owns the pointer capture rect; neither accepts a test id.
/* eslint-disable testing-library/no-node-access */
const barRects = () =>
	Array.from( screen.getByRole( 'application' ).querySelectorAll( '.visx-bar-group rect' ) );

const pointer = ( type: string, clientX: number, clientY = 150 ) =>
	fireEvent(
		screen.getByRole( 'application' ).querySelector( 'svg > rect[fill="transparent"]' ),
		new MouseEvent( type, { bubbles: true, clientX, clientY } )
	);
/* eslint-enable testing-library/no-node-access */

const geometry = ( element: Element ): Rect => ( {
	x: Number( element.getAttribute( 'x' ) ),
	y: Number( element.getAttribute( 'y' ) ),
	width: Number( element.getAttribute( 'width' ) ),
	height: Number( element.getAttribute( 'height' ) ),
} );

// Back to front, each series' bars in category order.
const BAR_ORDER = [ 'Views', 'Previous views', 'Visitors', 'Previous visitors' ];
const barOf = ( label: string, category = 0 ) =>
	geometry( barRects()[ BAR_ORDER.indexOf( label ) * 2 + category ] );
const center = ( { x, width }: Rect ) => x + width / 2;

let context: GlobalChartsContextValue;
let getBarColors: GetBarColors;
const Grab = () => {
	context = useGlobalChartsContext();
	getBarColors = useBarColors();
	return null;
};

const renderOverlap = ( props: Partial< BarChartProps > = {} ) =>
	render(
		<GlobalChartsProvider>
			<Grab />
			<BarChartUnresponsive
				width={ 500 }
				height={ 300 }
				data={ DATA }
				layout="overlap"
				withTooltips
				{ ...props }
			/>
		</GlobalChartsProvider>
	);

describe( 'BarChart overlap layout', () => {
	const screenTransform = Object.getOwnPropertyDescriptor( SVGElement.prototype, 'getScreenCTM' );
	beforeAll( () => {
		// jsdom lacks the SVG transform used by visx to convert pointer coordinates.
		Object.defineProperty( SVGElement.prototype, 'getScreenCTM', {
			configurable: true,
			value: () => null,
		} );
	} );

	afterAll( () => {
		if ( screenTransform ) {
			Object.defineProperty( SVGElement.prototype, 'getScreenCTM', screenTransform );
		} else {
			Reflect.deleteProperty( SVGElement.prototype, 'getScreenCTM' );
		}
	} );

	it( 'centers the later group, half as thick, on the earlier one, with the comparisons in a slot beside them', () => {
		renderOverlap();

		expect( barRects() ).toHaveLength( 8 );
		const views = barOf( 'Views' );
		const visitors = barOf( 'Visitors' );
		const previousViews = barOf( 'Previous views' );

		expect( visitors.width ).toBeCloseTo( views.width / 2 );
		expect( center( visitors ) ).toBeCloseTo( center( views ) );
		expect( center( barOf( 'Previous visitors' ) ) ).toBeCloseTo( center( previousViews ) );
		expect( previousViews.x ).toBeGreaterThan( views.x + views.width );
	} );

	it( 'fills each bar opaque, in the colors useBarColors reports for the layout', () => {
		renderOverlap();

		const colors = getBarColors( DATA, { layout: 'overlap' } );
		expect( new Set( colors ).size ).toBe( 4 );
		BAR_ORDER.forEach( ( label, order ) => {
			const bar = barRects()[ order * 2 ];
			expect( bar ).toHaveAttribute( 'fill', colors[ DATA.findIndex( s => s.label === label ) ] );
			expect( bar ).not.toHaveAttribute( 'opacity' );
		} );
	} );

	it( 'lists its composition legend in slot order, its swatches colored as its bars', () => {
		renderOverlap( { chartId: 'overlap-legend', children: <BarChartUnresponsive.Legend /> } );

		const order = [ 0, 2, 1, 3 ];
		expect( screen.getAllByTestId( 'legend-item' ).map( item => item.textContent ) ).toEqual(
			order.map( index => DATA[ index ].label )
		);
		const colors = getBarColors( DATA, { layout: 'overlap' } );
		expect(
			context
				.getChartData( 'overlap-legend' )
				?.legendItems.map( ( { label, color } ) => [ label, color ] )
		).toEqual( order.map( index => [ DATA[ index ].label, colors[ index ] ] ) );
	} );

	it( 'keeps a comparison in its slot while its primary is hidden', () => {
		const view = renderOverlap( { chartId: 'all-shown' } );
		const { x, width } = barOf( 'Previous views' );
		view.unmount();

		renderOverlap( { chartId: 'some-hidden', defaultHiddenSeries: [ 'Views', 'Visitors' ] } );
		const bar = geometry( barRects()[ 0 ] );

		expect( bar.x ).toBeCloseTo( x );
		expect( bar.width ).toBeCloseTo( width );
	} );

	it( 'widens a group to the full slot while the group behind it is hidden, in its own color', () => {
		const view = renderOverlap( { chartId: 'all-shown' } );
		const views = barOf( 'Views' );
		const visitorsFill = barRects()[ 4 ].getAttribute( 'fill' );
		view.unmount();

		renderOverlap( { chartId: 'some-hidden', defaultHiddenSeries: [ 'Views', 'Previous views' ] } );
		const visitors = barRects()[ 0 ];

		expect( geometry( visitors ).x ).toBeCloseTo( views.x );
		expect( geometry( visitors ).width ).toBeCloseTo( views.width );
		expect( visitors ).toHaveAttribute( 'fill', visitorsFill );
	} );

	it( 'lists only the hovered category, and reports the front bar of the hovered slot', async () => {
		const onPointerUp = jest.fn();
		renderOverlap( { onPointerUp } );

		pointer( 'pointermove', center( barOf( 'Views' ) ) );
		const tooltip = await screen.findByRole( 'tooltip' );
		[ 'Views: 100', 'Previous views: 80', 'Visitors: 40', 'Previous visitors: 30' ].forEach( row =>
			expect( tooltip ).toHaveTextContent( row )
		);
		expect( tooltip ).not.toHaveTextContent( '120' );

		pointer( 'pointerup', center( barOf( 'Views' ) ) );
		expect( onPointerUp ).toHaveBeenCalledWith( expect.objectContaining( { key: 'Visitors' } ) );
	} );

	it( "drops the previous category's bars when the pointer moves on", async () => {
		renderOverlap( { data: WITHOUT_LAST_PREVIOUS_VISITORS } );

		pointer( 'pointermove', center( barOf( 'Views' ) ) );
		await expect( screen.findByRole( 'tooltip' ) ).resolves.toHaveTextContent(
			'Previous visitors: 30'
		);
		pointer( 'pointermove', center( barOf( 'Views', 1 ) ) );

		await waitFor( () =>
			expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Views: 120' )
		);
		expect( screen.getByRole( 'tooltip' ) ).not.toHaveTextContent( 'Previous visitors' );
	} );

	it( 'continues the keyboard from the hovered category when the front series starts later', async () => {
		const user = userEvent.setup();
		renderOverlap( {
			data: DATA.map( series =>
				series.label === 'Visitors' ? { ...series, data: series.data.slice( 1 ) } : series
			),
		} );

		await user.tab();
		await user.keyboard( '{ArrowRight}' );
		// Back to front, the late Visitors series draws only its Tuesday bar.
		pointer( 'pointermove', center( geometry( barRects()[ 4 ] ) ) );
		await user.keyboard( '{ArrowRight}' );

		expect( selectedRing().x ).toBeCloseTo( barOf( 'Previous views', 1 ).x );
	} );

	it( 'steps the keyboard one slot at a time, outlining the whole slot', async () => {
		const user = userEvent.setup();
		renderOverlap();

		await user.tab();
		await user.keyboard( '{ArrowRight}' );
		const views = barOf( 'Views' );
		const ring = selectedRing();
		expect( ring.x ).toBeCloseTo( views.x );
		expect( ring.width ).toBeCloseTo( views.width );
		expect( ring.y ).toBeCloseTo( views.y );
		expect( ring.height ).toBeCloseTo( views.height );

		await user.keyboard( '{ArrowRight}' );
		expect( selectedRing().x ).toBeCloseTo( barOf( 'Previous views' ).x );
	} );

	it( 'lists every bar at the selected category in the keyboard tooltip, and reaches a slot whose front bar a shorter series leaves out', async () => {
		const user = userEvent.setup();
		renderOverlap( { data: WITHOUT_LAST_PREVIOUS_VISITORS } );

		await user.tab();
		await user.keyboard( '{ArrowRight}' );
		expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( 'Previous visitors: 30' );
		await user.keyboard( '{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}' );

		const tooltip = screen.getByTestId( 'chart-tooltip-3' );
		[ 'Views: 120', 'Previous views: 90', 'Visitors: 50' ].forEach( row =>
			expect( tooltip ).toHaveTextContent( row )
		);
		expect( tooltip ).not.toHaveTextContent( 'Previous visitors' );
		expect( selectedRing().x ).toBeCloseTo( barOf( 'Previous views', 1 ).x );
	} );

	it( 'reaches every category a slot draws from the keyboard when its groups cover different categories', async () => {
		const user = userEvent.setup();
		const onDatumActivate = jest.fn();
		renderOverlap( {
			onDatumActivate,
			data: [
				{ label: 'Views', group: 'views', data: [ day( 'Mon', 100 ), day( 'Tue', 120 ) ] },
				{ label: 'Visitors', group: 'visitors', data: [ day( 'Tue', 50 ), day( 'Wed', 60 ) ] },
			],
		} );

		await user.tab();
		await user.keyboard( '{ArrowRight}{Enter}{ArrowRight}{Enter}{ArrowRight}{Enter}' );

		expect(
			onDatumActivate.mock.calls.map( ( [ { key, datum } ] ) => [ key, datum.label ] )
		).toEqual( [
			[ 'Views', 'Mon' ],
			[ 'Visitors', 'Tue' ],
			[ 'Visitors', 'Wed' ],
		] );
	} );

	it( 'steps the keyboard through categories in band order when the back series has no reading at one', async () => {
		const user = userEvent.setup();
		const onDatumActivate = jest.fn();
		renderOverlap( {
			onDatumActivate,
			data: [
				{
					label: 'Views',
					group: 'views',
					data: [ day( 'Mon', 100 ), { label: 'Tue', value: null }, day( 'Wed', 120 ) ],
				},
				{
					label: 'Previous views',
					group: 'views',
					options: { type: 'comparison' },
					data: [ day( 'Mon', 80 ), day( 'Tue', 90 ), day( 'Wed', 70 ) ],
				},
			],
		} );

		await user.tab();
		await user.keyboard( '{ArrowRight}{Enter}'.repeat( 5 ) );

		expect(
			onDatumActivate.mock.calls.map( ( [ { key, datum } ] ) => `${ key } ${ datum.label }` )
		).toEqual( [
			'Views Mon',
			'Previous views Mon',
			'Previous views Tue',
			'Views Wed',
			'Previous views Wed',
		] );
	} );

	it.each( [
		[
			'keyboard',
			async () => {
				const user = userEvent.setup();
				await user.tab();
				await user.keyboard( '{ArrowRight}' );
				return screen.getByTestId( 'chart-tooltip-0' );
			},
		],
		[
			'hover',
			() => {
				pointer( 'pointermove', center( barOf( 'Views' ) ) );
				return screen.findByRole( 'tooltip' );
			},
		],
	] )(
		'lists a series with no reading at the category as No data in the %s tooltip',
		async ( _case, openTooltip ) => {
			renderOverlap( {
				data: DATA.map( series =>
					series.label === 'Visitors'
						? { ...series, data: [ { label: 'Mon', value: null }, day( 'Tue', 50 ) ] }
						: series
				),
			} );

			const tooltip = await openTooltip();
			expect( tooltip ).toHaveTextContent( 'Views: 100' );
			expect( tooltip ).toHaveTextContent( 'Visitors: No data' );
		}
	);
} );
