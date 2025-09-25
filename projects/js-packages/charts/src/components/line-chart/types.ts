import type { BaseChartProps, DataPointDate, SeriesData, AnnotationStyles } from '../../types';
import type { GlyphProps } from '@visx/xychart';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
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

export type RenderLineStartGlyphProps< Datum extends object > = GlyphProps< Datum > & {
	glyphStyle?: SVGProps< SVGCircleElement >;
};

export interface LineChartProps extends BaseChartProps< SeriesData[] > {
	withGradientFill: boolean;
	smoothing?: boolean;
	curveType?: CurveType;
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	withStartGlyphs?: boolean;
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode;
	glyphStyle?: SVGProps< SVGCircleElement >;
	withLegendGlyph?: boolean;
	withTooltipCrosshairs?: {
		showVertical?: boolean;
		showHorizontal?: boolean;
	};
	children?: ReactNode;
}

export type TooltipDatum = {
	key: string;
	value: number;
};
