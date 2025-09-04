import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';
import type { CircleSubjectProps } from '@visx/annotation/lib/components/CircleSubject';
import type { ConnectorProps } from '@visx/annotation/lib/components/Connector';
import type { LabelProps } from '@visx/annotation/lib/components/Label';
import type { LineSubjectProps } from '@visx/annotation/lib/components/LineSubject';
import type { GlyphProps } from '@visx/xychart';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import type { ReactNode, SVGProps, FC } from 'react';

export type AnnotationStyles = {
	circleSubject?: Omit< CircleSubjectProps, 'x' | 'y' > & { fill?: string };
	lineSubject?: Omit< LineSubjectProps, 'x' | 'y' >;
	connector?: Omit< ConnectorProps, 'x' | 'y' | 'dx' | 'dy' >;
	label?: Omit< LabelProps, 'title' | 'subtitle' | 'x' | 'y' > & {
		x?: number | 'start' | 'end';
		y?: number | 'start' | 'end';
	};
};

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
