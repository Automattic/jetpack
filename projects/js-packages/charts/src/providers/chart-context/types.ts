import { CSSProperties, ReactNode } from 'react';
import type { BaseLegendItem } from '../../components/legend';
import type {
	BarStyles,
	ChartType,
	CompleteChartTheme,
	DataPointPercentage,
	LegendShape,
	SeriesData,
} from '../../types';
import type { GlyphProps, LineStyles } from '@visx/xychart';

export interface ChartRegistration {
	legendItems: BaseLegendItem[];
	chartType: ChartType;
	metadata?: Record< string, unknown >;
}

export type GetElementStylesParams = {
	index: number;
	data?: SeriesData | DataPointPercentage;
	overrideColor?: string;
	legendShape?: LegendShape< SeriesData[], number >;
};

export type ElementStyles = {
	color: string;
	lineStyles: LineStyles;
	barStyles: BarStyles;
	glyph: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode;
	shapeStyles: CSSProperties & LineStyles;
};

export interface GlobalChartsContextValue {
	charts: Map< string, ChartRegistration >;
	registerChart: ( id: string, data: ChartRegistration ) => void;
	unregisterChart: ( id: string ) => void;
	getChartData: ( id: string ) => ChartRegistration | undefined;
	theme: CompleteChartTheme;
	getElementStyles: ( params: GetElementStylesParams ) => ElementStyles;
	// Series visibility management shared by charts, legends, and programmatic controls.
	toggleSeriesVisibility: ( chartId: string, seriesLabel: string ) => void;
	// Absolute counterpart to the toggle, for callers that know the target state.
	// Note: with `legend.collapseGroups`, a grouped legend item reads its visibility from
	// only the first series in its group (see base-legend.tsx). Setting visibility on a
	// different member of the group changes that series without updating what the legend
	// item displays, until the group is next clicked (which converges the whole group).
	setSeriesVisibility: ( chartId: string, seriesLabel: string, visible: boolean ) => void;
	// Replaces a chart's entire hidden set. Used to apply `defaultHiddenSeries` at mount.
	setChartHiddenSeries: ( chartId: string, seriesLabels: string[] ) => void;
	isSeriesVisible: ( chartId: string, seriesLabel: string ) => boolean;
	getHiddenSeries: ( chartId: string ) => Set< string >;
	isColorPaletteResolved: boolean;
}
