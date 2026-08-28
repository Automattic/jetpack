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
	 * Flip the tooltip box so it stays inside the chart wrapper. (It used to keep
	 * a body-level portal inside the viewport.)
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
	 * @deprecated Accepted and ignored. Nothing measures the box any more, so
	 * there is no measurement to debounce.
	 */
	debounce?: number;
	/**
	 * @deprecated Accepted and ignored. No ResizeObserver is used.
	 */
	resizeObserverPolyfill?: UseTooltipPortalOptions[ 'polyfill' ];
} & Omit< VisxTooltipProps, 'left' | 'top' | 'children' | 'applyPositionStyle' >;

export type { LineStyles, GridStyles } from '@visx/xychart';
