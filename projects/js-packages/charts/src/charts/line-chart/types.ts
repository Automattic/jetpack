import type {
	BaseChartProps,
	DataPointDate,
	SeriesData,
	AnnotationStyles,
	DataPoint,
} from '../../types';
import type { GlyphProps } from '@visx/xychart';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import type { GapSize } from '@wordpress/theme';
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
	legendInteractive?: boolean;
	children?: ReactNode;
	/**
	 * Gap between chart elements (SVG, legend, children).
	 * Uses WordPress design system tokens.
	 * @default 'md'
	 */
	gap?: GapSize;
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
