import { render, screen, waitFor } from '@testing-library/react';
import { LineSeries, TooltipContext, XYChart } from '@visx/xychart';
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

const BOTH_SERIES: EventHandlerParams< Datum >[] = [
	{ key: 'A', index: 1, datum: SERIES_A[ 1 ], svgPoint: { x: 100, y: 50 } },
	{ key: 'B', index: 1, datum: SERIES_B[ 1 ], svgPoint: { x: 100, y: 75 } },
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

// 200x100 plot with no margin: x maps 0..10 to 0..200px, y maps 0..100 to 100..0px.
const renderChart = (
	tooltipProps: Partial< XyChartTooltipProps< Datum > > = {},
	params: EventHandlerParams< Datum >[] = [
		{ key: 'A', index: 1, datum: SERIES_A[ 1 ], svgPoint: { x: 123, y: 45 } },
	]
) =>
	render(
		<div data-testid="wrapper" style={ { position: 'relative' } }>
			<XYChart
				width={ 200 }
				height={ 100 }
				margin={ { top: 0, right: 0, bottom: 0, left: 0 } }
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

		expect( glyphA ).toHaveAttribute( 'cx', '100' );
		expect( glyphA ).toHaveAttribute( 'cy', '50' );
		expect( glyphB ).toHaveAttribute( 'cx', '100' );
		expect( glyphB ).toHaveAttribute( 'cy', '75' );
		// Drawn into the chart SVG, not portaled out as HTML.
		expect( glyphA ).toBeInstanceOf( SVGElement );
	} );

	test( 'hands the glyph renderer the datum position and marks the nearest datum', async () => {
		const renderGlyph = jest.fn( () => null );
		renderChart( { showSeriesGlyphs: true, renderGlyph }, BOTH_SERIES );

		await waitFor( () => expect( renderGlyph ).toHaveBeenCalledTimes( 2 ) );

		const calls = renderGlyph.mock.calls as unknown as Array<
			[ { key: string; x: number; y: number; isNearestDatum: boolean; datum: Datum } ]
		>;
		const byKey = Object.fromEntries( calls.map( ( [ p ] ) => [ p.key, p ] ) );
		expect( byKey.A ).toMatchObject( { x: 100, y: 50, datum: SERIES_A[ 1 ] } );
		expect( byKey.B ).toMatchObject( { x: 100, y: 75, datum: SERIES_B[ 1 ] } );
		expect( [ byKey.A.isNearestDatum, byKey.B.isNearestDatum ].filter( Boolean ) ).toHaveLength(
			1
		);
	} );

	test( 'draws the crosshairs across the plot area at the snapped position', async () => {
		renderChart( {
			snapTooltipToDatumX: true,
			snapTooltipToDatumY: true,
			showVerticalCrosshair: true,
			showHorizontalCrosshair: true,
		} );

		const vertical = await screen.findByTestId( 'xy-chart-tooltip-crosshair-vertical' );
		const horizontal = await screen.findByTestId( 'xy-chart-tooltip-crosshair-horizontal' );

		expect( vertical ).toHaveAttribute( 'x1', '100' );
		expect( vertical ).toHaveAttribute( 'y1', '0' );
		expect( vertical ).toHaveAttribute( 'y2', '100' );
		expect( horizontal ).toHaveAttribute( 'y1', '50' );
		expect( horizontal ).toHaveAttribute( 'x1', '0' );
		expect( horizontal ).toHaveAttribute( 'x2', '200' );
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
