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
	resizeObserverPolyfill?: UseTooltipPortalOptions[ 'polyfill' ];
} & Omit< VisxTooltipProps, 'left' | 'top' | 'children' > &
	Pick< UseTooltipPortalOptions, 'debounce' | 'detectBounds' | 'scroll' | 'zIndex' >;

export type { LineStyles, GridStyles } from '@visx/xychart';
