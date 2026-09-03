import { Tooltip, defaultStyles } from '@visx/tooltip';
import { DataContext, TooltipContext } from '@visx/xychart';
import { useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { BoundedTooltip } from './private/bounded-tooltip';
import type { RenderTooltipGlyphProps, XyChartTooltipProps } from '../../visx/types';
import type { TooltipContextType } from '@visx/xychart';
import type { CSSProperties, ReactNode } from 'react';

const CROSSHAIR_STROKE_WIDTH = 1.5;
const DEFAULT_GLYPH_RADIUS = 4;
const FALLBACK_COLOR = '#222';
// Above the chart's own overlays (the zoom reset button sits at 2). The chart
// wrapper isolates its stacking context, so this never competes with page chrome.
const DEFAULT_TOOLTIP_Z_INDEX = 3;
// Portal-era options, accepted for compatibility and dropped before the box
// renders: it sits in the chart wrapper and moves with it, and nothing
// measures it any more.
const PORTAL_OPTIONS = new Set( [ 'scroll', 'debounce', 'resizeObserverPolyfill' ] );

type ScaleFn = ( value: unknown ) => number | undefined;

const isValidNumber = ( value: unknown ): value is number =>
	typeof value === 'number' && Number.isFinite( value );

// Band scales place a datum at the start of its band; snapping targets the band's centre.
// A d3 scale is a function that carries `bandwidth` as a property.
const scaleBandwidth = ( scale: unknown ): number => {
	const bandwidth = ( scale as { bandwidth?: unknown } | null | undefined )?.bandwidth;
	return typeof bandwidth === 'function' ? Number( bandwidth() ) : 0;
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
	/** The SVG's HTML parent once found. The box waits for it; the SVG overlay does not. */
	container: HTMLElement | null;
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
	zIndex = DEFAULT_TOOLTIP_Z_INDEX,
	...rest
}: XyChartTooltipContentProps< Datum > ) => {
	const tooltipProps = Object.fromEntries(
		Object.entries( rest ).filter( ( [ key ] ) => ! PORTAL_OPTIONS.has( key ) )
	) as Omit< typeof rest, 'scroll' | 'debounce' | 'resizeObserverPolyfill' >;
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

	const tooltipContent = renderTooltip ? renderTooltip( { ...tooltipContext, colorScale } ) : null;
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
		const labelColor = theme?.htmlLabel?.color ?? FALLBACK_COLOR;
		// visx colours a lone nearest-datum glyph like the gridlines and series glyphs like labels.
		const fallbackColor = showSeriesGlyphs ? labelColor : theme?.gridStyles?.stroke ?? labelColor;
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
			// The group carries the position and the renderer draws at the origin,
			// as with visx's portal: a renderer that ignores `x` and `y` still lands
			// on its datum.
			glyphs.push(
				<g
					key={ key }
					className="visx-tooltip-glyph"
					data-testid={ `xy-chart-tooltip-glyph-group-${ key }` }
					transform={ `translate(${ left }, ${ top })` }
				>
					{ renderGlyph( {
						key,
						color: colorScale?.( key ) ?? fallbackColor,
						datum,
						index,
						size,
						x: 0,
						y: 0,
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

	const TooltipComponent = detectBounds ? BoundedTooltip : Tooltip;
	const boxStyle: CSSProperties = {
		...defaultStyles,
		zIndex,
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
			{ container &&
				createPortal(
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
 * be `position: relative` with the SVG at its origin, and `isolation: isolate`:
 * the box is placed with the SVG-local coordinates visx reports, and the
 * isolation keeps the box's `zIndex` from competing with page chrome. The box
 * flips and clamps to stay inside the nearest ancestor that clips its overflow
 * (or the viewport), so it may extend past the chart wrapper but is never cut
 * off unless that ancestor is smaller than the box itself.
 *
 * @param props - visx's `Tooltip` options. `scroll`, `debounce` and `resizeObserverPolyfill` are accepted and ignored.
 * @return An anchor in the SVG, plus the overlay and the tooltip box while the tooltip is open.
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
			{ tooltipContext?.tooltipOpen && (
				<XyChartTooltipContent
					{ ...props }
					tooltipContext={ tooltipContext }
					container={ container }
				/>
			) }
		</>
	);
};
