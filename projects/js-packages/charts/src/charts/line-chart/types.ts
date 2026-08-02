import type {
	BaseChartProps,
	DataPointDate,
	SeriesData,
	SeriesChartLegendConfig,
	AnnotationStyles,
	DataPoint,
} from '../../types';
import type { RenderTooltipParams } from '../../visx/types';
import type { GlyphProps } from '@visx/xychart';
import type { ReactNode, SVGProps, FC } from 'react';

export type LineChartAnnotationProps = {
	datum: DataPointDate;
	title: string;
	subtitle?: string;
	subjectType?: 'circle' | 'line-vertical' | 'line-horizontal';
	styles?: AnnotationStyles;
	testId?: string;
	renderLabel?: FC< { title: string; subtitle?: string } >;
	renderLabelPopover?: FC< { title: string; subtitle?: string } >;
};

export type CurveType = 'smooth' | 'linear' | 'monotone';

export type RenderLineGlyphProps< Datum extends object > = GlyphProps< Datum > & {
	glyphStyle?: SVGProps< SVGCircleElement >;
	position?: 'start' | 'end';
};

export interface LineChartProps extends BaseChartProps< SeriesData[] > {
	/**
	 * Legend configuration. Supports `collapseGroups` on top of the shared options.
	 */
	legend?: SeriesChartLegendConfig;
	withGradientFill: boolean;
	smoothing?: boolean;
	curveType?: CurveType;
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	withStartGlyphs?: boolean;
	withEndGlyphs?: boolean;
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode;
	glyphStyle?: SVGProps< SVGCircleElement >;
	withLegendGlyph?: boolean;
	withTooltipCrosshairs?: {
		showVertical?: boolean;
		showHorizontal?: boolean;
	};
	/**
	 * Enable drag-to-zoom on the X axis. The user drags horizontally to
	 * select a range; the X axis rescales to that range. A small reset
	 * button appears in the top-right of the chart while zoomed.
	 */
	zoomable?: boolean;
	/**
	 * Whether the Y axis rescales to fit only the visible series when series are
	 * hidden or shown through the interactive legend.
	 * Defaults to `true` (the pre-existing behaviour). Set to `false` to pin the Y
	 * axis to the full data extent so hiding series does not move the chart's
	 * baseline — useful for comparison charts. Matches `AreaChart`.
	 * @default true
	 */
	rescaleYOnVisibilityChange?: boolean;
	children?: ReactNode;
}

export type TooltipDatum = {
	key: string;
	value: number;
};

export type LineChartGlyphProps = {
	data: SeriesData;
	index: number;
	color: string;
	renderGlyph: < Datum extends object >( props: RenderLineGlyphProps< Datum > ) => ReactNode;
	accessors: {
		xAccessor: ( d: DataPointDate | DataPoint ) => Date;
		yAccessor: ( d: DataPointDate | DataPoint ) => number | null;
	};
	glyphStyle?: SVGProps< SVGCircleElement >;
	position: 'start' | 'end';
};
