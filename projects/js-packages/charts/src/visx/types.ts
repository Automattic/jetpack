import type { PickD3Scale } from '@visx/scale';
import type { TooltipProps as VisxTooltipProps, UseTooltipPortalOptions } from '@visx/tooltip';
import type { GlyphProps, TooltipContextType } from '@visx/xychart';
import type { ReactNode, SVGProps } from 'react';

export type RenderTooltipParams< Datum extends object > = TooltipContextType< Datum > & {
	colorScale?: PickD3Scale< 'ordinal', string, string >;
};

export interface RenderTooltipGlyphProps< Datum extends object > extends GlyphProps< Datum > {
	glyphStyle?: SVGProps< SVGCircleElement >;
	isNearestDatum: boolean;
}

export type XyChartTooltipProps< Datum extends object > = {
	renderTooltip: ( params: RenderTooltipParams< Datum > ) => ReactNode;
	renderGlyph?: ( params: RenderTooltipGlyphProps< Datum > ) => ReactNode;
	/**
	 * Keep the panel below the bottom x-axis, centered at the datum x and horizontally clamped.
	 * Vertical bounds do not move this placement; clipping ancestors can still cut it off.
	 * @default 'auto'
	 */
	tooltipPlacement?: 'auto' | 'below-axis';
	snapTooltipToDatumX?: boolean;
	snapTooltipToDatumY?: boolean;
	showVerticalCrosshair?: boolean;
	showHorizontalCrosshair?: boolean;
	showDatumGlyph?: boolean;
	showSeriesGlyphs?: boolean;
	verticalCrosshairStyle?: SVGProps< SVGLineElement >;
	horizontalCrosshairStyle?: SVGProps< SVGLineElement >;
	glyphStyle?: SVGProps< SVGCircleElement >;
	/**
	 * Flip and clamp automatic placement inside the nearest clipping ancestor or viewport.
	 * Below-axis placement always applies horizontal bounds only, regardless of this option.
	 * @default true
	 */
	detectBounds?: boolean;
	/**
	 * Stacking order of the tooltip box inside the chart wrapper, which isolates
	 * its stacking context: the value never competes with page chrome outside
	 * the chart.
	 * @default 3
	 */
	zIndex?: number;
	/**
	 * @deprecated Accepted and ignored. The box renders inside the chart wrapper
	 * and moves with it, so it needs no scroll tracking.
	 */
	scroll?: boolean;
	/**
	 * @deprecated Accepted and ignored. Layout-effect measurements are not debounced.
	 */
	debounce?: number;
	/**
	 * @deprecated Accepted and ignored. No ResizeObserver is used.
	 */
	resizeObserverPolyfill?: UseTooltipPortalOptions[ 'polyfill' ];
} & Omit< VisxTooltipProps, 'left' | 'top' | 'children' | 'applyPositionStyle' >;

export type { LineStyles, GridStyles } from '@visx/xychart';
