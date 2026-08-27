import { Tooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { DataContext, TooltipContext } from '@visx/xychart';
import { useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RenderTooltipGlyphProps, XyChartTooltipProps } from '../../visx/types';
import type { TooltipContextType } from '@visx/xychart';
import type { CSSProperties, ReactNode } from 'react';

const CROSSHAIR_STROKE_WIDTH = 1.5;
const DEFAULT_GLYPH_RADIUS = 4;
const FALLBACK_COLOR = '#222';

type ScaleFn = ( value: unknown ) => number | undefined;

const isValidNumber = ( value: unknown ): value is number =>
	typeof value === 'number' && Number.isFinite( value );

// Band scales place a datum at the start of its band; snapping targets the band's centre.
const scaleBandwidth = ( scale: unknown ): number => {
	if (
		scale &&
		typeof scale === 'object' &&
		'bandwidth' in scale &&
		typeof scale.bandwidth === 'function'
	) {
		return Number( scale.bandwidth() );
	}
	return 0;
};

const DefaultGlyph = < Datum extends object >( {
	x,
	y,
	size,
	color,
	glyphStyle,
	seriesKey,
}: Omit< RenderTooltipGlyphProps< Datum >, 'key' > & { seriesKey: string } ) => {
	const { theme } = useContext( DataContext ) || {};

	return (
		<circle
			data-testid={ `xy-chart-tooltip-glyph-${ seriesKey }` }
			cx={ x }
			cy={ y }
			r={ size }
			fill={ color }
			stroke={ theme?.backgroundColor }
			strokeWidth={ CROSSHAIR_STROKE_WIDTH }
			paintOrder="fill"
			{ ...glyphStyle }
		/>
	);
};

const defaultRenderGlyph = < Datum extends object >( {
	key,
	...props
}: RenderTooltipGlyphProps< Datum > ) => (
	<DefaultGlyph key={ key } seriesKey={ key } { ...props } />
);

type XyChartTooltipContentProps< Datum extends object > = XyChartTooltipProps< Datum > & {
	tooltipContext: TooltipContextType< Datum >;
	container: HTMLElement;
};

const XyChartTooltipContent = < Datum extends object >( {
	tooltipContext,
	container,
	renderTooltip,
	renderGlyph = defaultRenderGlyph,
	glyphStyle,
	snapTooltipToDatumX = false,
	snapTooltipToDatumY = false,
	showVerticalCrosshair = false,
	showHorizontalCrosshair = false,
	showDatumGlyph = false,
	showSeriesGlyphs = false,
	verticalCrosshairStyle,
	horizontalCrosshairStyle,
	detectBounds = true,
	...tooltipProps
}: XyChartTooltipContentProps< Datum > ) => {
	const {
		colorScale,
		theme,
		innerHeight = 0,
		innerWidth = 0,
		margin,
		xScale,
		yScale,
		dataRegistry,
	} = useContext( DataContext ) || {};

	const tooltipContent = renderTooltip( { ...tooltipContext, colorScale } );
	if ( tooltipContent == null ) {
		return null;
	}

	const scaleX = xScale as ScaleFn | undefined;
	const scaleY = yScale as ScaleFn | undefined;

	// Datum position in SVG coordinates, from the accessors the series registered.
	const getDatumLeftTop = ( key: string, datum: Datum ) => {
		const entry = dataRegistry?.get( key );
		const left =
			scaleX && entry?.xAccessor
				? Number( scaleX( entry.xAccessor( datum ) ) ) + scaleBandwidth( xScale ) / 2
				: undefined;
		const top =
			scaleY && entry?.yAccessor
				? Number( scaleY( entry.yAccessor( datum ) ) ) + scaleBandwidth( yScale ) / 2
				: undefined;
		return { left, top };
	};

	const nearestDatum = tooltipContext.tooltipData?.nearestDatum;
	let { tooltipLeft, tooltipTop } = tooltipContext;

	if ( nearestDatum && ( snapTooltipToDatumX || snapTooltipToDatumY ) ) {
		const { left, top } = getDatumLeftTop( nearestDatum.key, nearestDatum.datum );
		if ( snapTooltipToDatumX && isValidNumber( left ) ) {
			tooltipLeft = left;
		}
		if ( snapTooltipToDatumY && isValidNumber( top ) ) {
			tooltipTop = top;
		}
	}

	const glyphs: ReactNode[] = [];
	if ( showDatumGlyph || showSeriesGlyphs ) {
		const size = Number( glyphStyle?.radius ?? DEFAULT_GLYPH_RADIUS );
		const fallbackColor = theme?.htmlLabel?.color ?? FALLBACK_COLOR;
		let entries: Array< { key: string; datum: Datum; index: number } > = [];
		if ( showSeriesGlyphs ) {
			entries = Object.values( tooltipContext.tooltipData?.datumByKey ?? {} );
		} else if ( nearestDatum ) {
			entries = [ nearestDatum ];
		}

		for ( const { key, datum, index } of entries ) {
			const { left, top } = getDatumLeftTop( key, datum );
			if ( ! isValidNumber( left ) || ! isValidNumber( top ) ) {
				continue;
			}
			glyphs.push(
				<g key={ key } className="visx-tooltip-glyph">
					{ renderGlyph( {
						key,
						color: colorScale?.( key ) ?? fallbackColor,
						datum,
						index,
						size,
						x: left,
						y: top,
						glyphStyle,
						isNearestDatum: nearestDatum?.key === key,
					} ) }
				</g>
			);
		}
	}

	const crosshairStroke = theme?.gridStyles?.stroke ?? theme?.htmlLabel?.color ?? FALLBACK_COLOR;
	const marginTop = margin?.top ?? 0;
	const marginLeft = margin?.left ?? 0;

	const TooltipComponent = detectBounds ? TooltipWithBounds : Tooltip;
	const boxStyle: CSSProperties = {
		...defaultStyles,
		background: theme?.backgroundColor ?? 'white',
		boxShadow: `0 1px 2px ${
			theme?.htmlLabel?.color ? `${ theme.htmlLabel.color }55` : '#22222255'
		}`,
		...theme?.htmlLabel,
	};

	return (
		<>
			<g className="visx-tooltip-overlay" pointerEvents="none">
				{ showVerticalCrosshair && isValidNumber( tooltipLeft ) && (
					<line
						className="visx-crosshair visx-crosshair-vertical"
						data-testid="xy-chart-tooltip-crosshair-vertical"
						x1={ tooltipLeft }
						x2={ tooltipLeft }
						y1={ marginTop }
						y2={ marginTop + innerHeight }
						stroke={ crosshairStroke }
						strokeWidth={ CROSSHAIR_STROKE_WIDTH }
						{ ...verticalCrosshairStyle }
					/>
				) }
				{ showHorizontalCrosshair && isValidNumber( tooltipTop ) && (
					<line
						className="visx-crosshair visx-crosshair-horizontal"
						data-testid="xy-chart-tooltip-crosshair-horizontal"
						x1={ marginLeft }
						x2={ marginLeft + innerWidth }
						y1={ tooltipTop }
						y2={ tooltipTop }
						stroke={ crosshairStroke }
						strokeWidth={ CROSSHAIR_STROKE_WIDTH }
						{ ...horizontalCrosshairStyle }
					/>
				) }
				{ glyphs }
			</g>
			{ createPortal(
				<TooltipComponent
					left={ tooltipLeft }
					top={ tooltipTop }
					style={ boxStyle }
					applyPositionStyle
					{ ...tooltipProps }
				>
					{ tooltipContent }
				</TooltipComponent>,
				container
			) }
		</>
	);
};

/**
 * In-tree replacement for `@visx/xychart`'s `Tooltip`.
 *
 * visx renders its tooltip box, glyphs and crosshairs through portals appended
 * to `document.body`. That puts them in the page's root stacking context, where
 * they paint above every sticky or fixed element that lives inside a nested
 * stacking context, and no z-index on that element can change the order. This
 * component draws the glyphs and crosshairs straight into the chart SVG and
 * renders the tooltip box into the SVG's parent element, so all of them stack
 * as ordinary descendants of the chart.
 *
 * Render it as a child of `XYChart`. The element wrapping that `XYChart` must
 * be `position: relative` with the SVG at its origin: the box is placed with
 * the SVG-local coordinates visx reports, and `TooltipWithBounds` flips it to
 * stay inside that wrapper.
 *
 * @param props - Same options as visx's `Tooltip`, minus its portal settings.
 * @return The overlay and the portaled tooltip box, or nothing while the tooltip is closed.
 */
export const XyChartTooltip = < Datum extends object >( props: XyChartTooltipProps< Datum > ) => {
	const tooltipContext = useContext( TooltipContext ) as TooltipContextType< Datum > | null;
	const [ container, setContainer ] = useState< HTMLElement | null >( null );

	// Children of XYChart render inside its SVG, and the box needs an HTML parent.
	const anchorRef = useCallback( ( node: SVGGElement | null ) => {
		setContainer( node?.ownerSVGElement?.parentElement ?? null );
	}, [] );

	return (
		<>
			<g ref={ anchorRef } data-testid="xy-chart-tooltip-anchor" />
			{ tooltipContext?.tooltipOpen && container && (
				<XyChartTooltipContent
					{ ...props }
					tooltipContext={ tooltipContext }
					container={ container }
				/>
			) }
		</>
	);
};
