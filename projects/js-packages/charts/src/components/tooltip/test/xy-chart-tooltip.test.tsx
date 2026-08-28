import { render, screen, waitFor } from '@testing-library/react';
import { BarSeries, LineSeries, TooltipContext, XYChart } from '@visx/xychart';
import { useContext, useEffect } from 'react';
import { XyChartTooltip } from '../xy-chart-tooltip';
import type { XyChartTooltipProps } from '../../../visx/types';
import type { EventHandlerParams } from '@visx/xychart';

type Datum = { x: number; y: number };

const SERIES_A: Datum[] = [
	{ x: 0, y: 0 },
	{ x: 5, y: 50 },
	{ x: 10, y: 100 },
];
const SERIES_B: Datum[] = [
	{ x: 0, y: 100 },
	{ x: 5, y: 25 },
	{ x: 10, y: 0 },
];

const xAccessor = ( d: Datum ) => d.x;
const yAccessor = ( d: Datum ) => d.y;

type BandDatum = { x: string; y: number };
const BAND_DATA: BandDatum[] = [
	{ x: 'a', y: 50 },
	{ x: 'b', y: 80 },
];
const bandXAccessor = ( d: BandDatum ) => d.x;
const bandYAccessor = ( d: BandDatum ) => d.y;
const renderBarTooltip = () => <span>bar</span>;
const BAND_PARAMS = [
	{ key: 'bars', index: 0, datum: BAND_DATA[ 0 ], svgPoint: { x: 20, y: 90 } },
] as unknown as EventHandlerParams< Datum >[];

// The pointer sits on A's datum, 25px above B's, so A is the nearest datum.
const BOTH_SERIES: EventHandlerParams< Datum >[] = [
	{
		key: 'A',
		index: 1,
		datum: SERIES_A[ 1 ],
		svgPoint: { x: 100, y: 50 },
		distanceX: 0,
		distanceY: 0,
	},
	{
		key: 'B',
		index: 1,
		datum: SERIES_B[ 1 ],
		svgPoint: { x: 100, y: 50 },
		distanceX: 0,
		distanceY: 25,
	},
];

// Opens the tooltip the way a pointer event would, once the series have registered.
const OpenTooltip = ( { params }: { params: EventHandlerParams< Datum >[] } ) => {
	const tooltipContext = useContext( TooltipContext );
	useEffect( () => {
		params.forEach( p => tooltipContext?.showTooltip( p ) );
		// The context object changes identity on every tooltip update; re-running would loop.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
	return null;
};

const renderTooltip: XyChartTooltipProps< Datum >[ 'renderTooltip' ] = ( { tooltipData } ) => (
	<span>{ `nearest:${ tooltipData?.nearestDatum?.key ?? '' }` }</span>
);

const NO_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };

// 200x100 chart; with no margin x maps 0..10 to 0..200px and y maps 0..100 to 100..0px.
const renderChart = (
	tooltipProps: Partial< XyChartTooltipProps< Datum > > = {},
	params: EventHandlerParams< Datum >[] = [
		{ key: 'A', index: 1, datum: SERIES_A[ 1 ], svgPoint: { x: 123, y: 45 } },
	],
	margin = NO_MARGIN
) =>
	render(
		<div data-testid="wrapper" style={ { position: 'relative' } }>
			<XYChart
				width={ 200 }
				height={ 100 }
				margin={ margin }
				xScale={ { type: 'linear', domain: [ 0, 10 ] } }
				yScale={ { type: 'linear', domain: [ 0, 100 ] } }
			>
				<LineSeries dataKey="A" data={ SERIES_A } xAccessor={ xAccessor } yAccessor={ yAccessor } />
				<LineSeries dataKey="B" data={ SERIES_B } xAccessor={ xAccessor } yAccessor={ yAccessor } />
				<XyChartTooltip
					renderTooltip={ renderTooltip }
					data-testid="tooltip-box"
					{ ...tooltipProps }
				/>
				<OpenTooltip params={ params } />
			</XYChart>
		</div>
	);

describe( 'XyChartTooltip', () => {
	test( 'renders the tooltip box inside the chart wrapper, not in a body-level portal', async () => {
		const { container } = renderChart();

		const box = await screen.findByTestId( 'tooltip-box' );

		expect( box ).toHaveTextContent( 'nearest:A' );
		expect( screen.getByTestId( 'wrapper' ) ).toContainElement( box );
		// A body-level portal would sit outside the render root.
		expect( container ).toContainElement( box );
	} );

	test( 'places the box at the pointer position when snapping is off', async () => {
		renderChart();

		// TooltipWithBounds moves the box through a transform from (0, 0), after its 10px offsets.
		await expect( screen.findByTestId( 'tooltip-box' ) ).resolves.toHaveStyle( {
			transform: 'translate(133px, 55px)',
		} );
	} );

	test( 'snaps the box to the nearest datum', async () => {
		renderChart( { snapTooltipToDatumX: true, snapTooltipToDatumY: true } );

		// Datum (5, 50) sits at (100px, 50px); the default 10px offsets apply after snapping.
		await waitFor( () =>
			expect( screen.getByTestId( 'tooltip-box' ) ).toHaveStyle( {
				transform: 'translate(110px, 60px)',
			} )
		);
	} );

	test( 'draws one glyph per series in the SVG at the datum position', async () => {
		renderChart( { showSeriesGlyphs: true }, BOTH_SERIES );

		const glyphA = await screen.findByTestId( 'xy-chart-tooltip-glyph-A' );
		const glyphB = await screen.findByTestId( 'xy-chart-tooltip-glyph-B' );

		// The group is placed at the datum; the glyph itself draws at the origin.
		expect( screen.getByTestId( 'xy-chart-tooltip-glyph-group-A' ) ).toHaveAttribute(
			'transform',
			'translate(100, 50)'
		);
		expect( screen.getByTestId( 'xy-chart-tooltip-glyph-group-B' ) ).toHaveAttribute(
			'transform',
			'translate(100, 75)'
		);
		expect( glyphA ).toHaveAttribute( 'cx', '0' );
		expect( glyphA ).toHaveAttribute( 'cy', '0' );
		expect( glyphB ).toHaveAttribute( 'cx', '0' );
		expect( glyphB ).toHaveAttribute( 'cy', '0' );
		// Drawn into the chart SVG, not portaled out as HTML.
		expect( glyphA ).toBeInstanceOf( SVGElement );
	} );

	test( 'hands the glyph renderer the origin, like visx, and marks the nearest datum', async () => {
		const renderGlyph = jest.fn( () => null );
		renderChart( { showSeriesGlyphs: true, renderGlyph }, BOTH_SERIES );

		await waitFor( () => expect( renderGlyph ).toHaveBeenCalledTimes( 2 ) );

		const calls = renderGlyph.mock.calls as unknown as Array<
			[ { key: string; x: number; y: number; isNearestDatum: boolean; datum: Datum } ]
		>;
		const byKey = Object.fromEntries( calls.map( ( [ p ] ) => [ p.key, p ] ) );
		// A renderer written against visx's Tooltip ignores x and y, so both stay 0.
		expect( byKey.A ).toMatchObject( { x: 0, y: 0, datum: SERIES_A[ 1 ] } );
		expect( byKey.B ).toMatchObject( { x: 0, y: 0, datum: SERIES_B[ 1 ] } );
		expect( byKey.A.isNearestDatum ).toBe( true );
		expect( byKey.B.isNearestDatum ).toBe( false );
	} );

	test( 'centres a band-scale datum in its band', async () => {
		render(
			<div style={ { position: 'relative' } }>
				<XYChart
					width={ 200 }
					height={ 100 }
					margin={ NO_MARGIN }
					xScale={ { type: 'band', domain: [ 'a', 'b' ], paddingInner: 0, paddingOuter: 0 } }
					yScale={ { type: 'linear', domain: [ 0, 100 ] } }
				>
					<BarSeries
						dataKey="bars"
						data={ BAND_DATA }
						xAccessor={ bandXAccessor }
						yAccessor={ bandYAccessor }
					/>
					<XyChartTooltip
						renderTooltip={ renderBarTooltip }
						data-testid="tooltip-box"
						snapTooltipToDatumX
						snapTooltipToDatumY
						showDatumGlyph
					/>
					<OpenTooltip params={ BAND_PARAMS } />
				</XYChart>
			</div>
		);

		// Band 'a' spans 0..100px; the datum sits at its centre, 50px, not its start.
		await waitFor( () =>
			expect( screen.getByTestId( 'xy-chart-tooltip-glyph-group-bars' ) ).toHaveAttribute(
				'transform',
				'translate(50, 50)'
			)
		);
		expect( screen.getByTestId( 'tooltip-box' ) ).toHaveStyle( {
			transform: 'translate(60px, 60px)',
		} );
	} );

	test( 'draws the crosshairs across the plot area, inside the margins, at the snapped position', async () => {
		renderChart(
			{
				snapTooltipToDatumX: true,
				snapTooltipToDatumY: true,
				showVerticalCrosshair: true,
				showHorizontalCrosshair: true,
			},
			undefined,
			{ top: 10, right: 20, bottom: 30, left: 40 }
		);

		const vertical = await screen.findByTestId( 'xy-chart-tooltip-crosshair-vertical' );
		const horizontal = await screen.findByTestId( 'xy-chart-tooltip-crosshair-horizontal' );

		// Plot area is 140x60 at (40, 10); datum (5, 50) sits at its centre, (110, 40).
		expect( vertical ).toHaveAttribute( 'x1', '110' );
		expect( vertical ).toHaveAttribute( 'y1', '10' );
		expect( vertical ).toHaveAttribute( 'y2', '70' );
		expect( horizontal ).toHaveAttribute( 'y1', '40' );
		expect( horizontal ).toHaveAttribute( 'x1', '40' );
		expect( horizontal ).toHaveAttribute( 'x2', '180' );
	} );

	test( 'stacks the box above the chart overlays, with zIndex as the override', async () => {
		const { unmount } = renderChart();
		await expect( screen.findByTestId( 'tooltip-box' ) ).resolves.toHaveStyle( { zIndex: '3' } );
		unmount();

		renderChart( { zIndex: 9 } );
		await expect( screen.findByTestId( 'tooltip-box' ) ).resolves.toHaveStyle( { zIndex: '9' } );
	} );

	test( 'accepts the portal-era options without passing them to the box', async () => {
		renderChart( { scroll: true, debounce: 50, resizeObserverPolyfill: undefined } );

		const box = await screen.findByTestId( 'tooltip-box' );

		expect( box ).not.toHaveAttribute( 'scroll' );
		expect( box ).not.toHaveAttribute( 'debounce' );
	} );

	test( 'renders no box when there is no tooltip renderer', async () => {
		renderChart( { renderTooltip: undefined } );

		await expect( screen.findByTestId( 'xy-chart-tooltip-anchor' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'tooltip-box' ) ).not.toBeInTheDocument();
	} );

	test( 'renders nothing when the tooltip content is empty', async () => {
		renderChart( { renderTooltip: () => null, showSeriesGlyphs: true }, BOTH_SERIES );

		// The anchor is the only thing rendered while there is nothing to show.
		await expect( screen.findByTestId( 'xy-chart-tooltip-anchor' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'tooltip-box' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'xy-chart-tooltip-glyph-A' ) ).not.toBeInTheDocument();
	} );

	test( 'renders nothing while the tooltip is closed', () => {
		renderChart( { showSeriesGlyphs: true, showVerticalCrosshair: true }, [] );

		expect( screen.queryByTestId( 'tooltip-box' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'xy-chart-tooltip-glyph-A' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'xy-chart-tooltip-crosshair-vertical' ) ).not.toBeInTheDocument();
	} );
} );
