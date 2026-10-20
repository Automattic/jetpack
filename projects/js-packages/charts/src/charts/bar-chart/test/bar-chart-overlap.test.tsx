import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import { useGlobalChartsContext } from '../../../providers/chart-context/hooks/use-global-charts-context';
import { BarChartUnresponsive } from '../bar-chart';
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
const Grab = () => {
	context = useGlobalChartsContext();
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

	it( 'fills each bar opaque, in the colors the charts context reports for the layout', () => {
		renderOverlap();

		const colors = context.getBarColors?.( DATA, { layout: 'overlap' } ) ?? [];
		expect( new Set( colors ).size ).toBe( 4 );
		BAR_ORDER.forEach( ( label, order ) => {
			const bar = barRects()[ order * 2 ];
			expect( bar ).toHaveAttribute( 'fill', colors[ DATA.findIndex( s => s.label === label ) ] );
			expect( bar ).not.toHaveAttribute( 'opacity' );
		} );
	} );

	it( 'lists its legend in slot order, its swatches colored as its bars', () => {
		renderOverlap( { chartId: 'overlap-legend' } );

		const colors = context.getBarColors?.( DATA, { layout: 'overlap' } ) ?? [];
		expect(
			context
				.getChartData( 'overlap-legend' )
				?.legendItems.map( ( { label, color } ) => [ label, color ] )
		).toEqual( [ 0, 2, 1, 3 ].map( index => [ DATA[ index ].label, colors[ index ] ] ) );
	} );

	it.each( [
		[
			'a comparison keeps its slot while its primary is hidden',
			[ 'Views', 'Visitors' ],
			'Previous views',
		],
		[
			'a group keeps its layer while the group behind it is hidden',
			[ 'Views', 'Previous views' ],
			'Visitors',
		],
	] )( '%s', ( _case, hidden, label ) => {
		const view = renderOverlap( { chartId: 'all-shown' } );
		const { x, width } = barOf( label );
		view.unmount();

		renderOverlap( { chartId: 'some-hidden', defaultHiddenSeries: hidden } );
		const visible = BAR_ORDER.filter( item => ! hidden.includes( item ) );
		const bar = geometry( barRects()[ visible.indexOf( label ) * 2 ] );

		expect( bar.x ).toBeCloseTo( x );
		expect( bar.width ).toBeCloseTo( width );
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

		expect( geometry( screen.getByTestId( 'bar-chart-selected-ring' ) ).x ).toBeCloseTo(
			barOf( 'Previous views', 1 ).x
		);
	} );

	it( 'steps the keyboard one slot at a time, outlining the whole slot', async () => {
		const user = userEvent.setup();
		renderOverlap();

		await user.tab();
		await user.keyboard( '{ArrowRight}' );
		const views = barOf( 'Views' );
		const ring = geometry( screen.getByTestId( 'bar-chart-selected-ring' ) );
		expect( ring.x ).toBeCloseTo( views.x );
		expect( ring.width ).toBeCloseTo( views.width );
		expect( ring.y ).toBeCloseTo( views.y );
		expect( ring.height ).toBeCloseTo( views.height );

		await user.keyboard( '{ArrowRight}' );
		expect( geometry( screen.getByTestId( 'bar-chart-selected-ring' ) ).x ).toBeCloseTo(
			barOf( 'Previous views' ).x
		);
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
		expect( geometry( screen.getByTestId( 'bar-chart-selected-ring' ) ).x ).toBeCloseTo(
			barOf( 'Previous views', 1 ).x
		);
	} );
} );
