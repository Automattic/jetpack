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
	setSeriesVisibility: ( chartId: string, seriesLabel: string, visible: boolean ) => void;
	setChartHiddenSeries: ( chartId: string, seriesLabels: readonly string[] ) => void;
	/** Applies a chart's defaults once. A no-op for a chart that has already been seeded. */
	seedChartHiddenSeries: ( chartId: string, seriesLabels: readonly string[] ) => void;
	/** Whether this chart's defaults have already been seeded, in this or an earlier mount. */
	hasSeededChart: ( chartId: string ) => boolean;
	isSeriesVisible: ( chartId: string, seriesLabel: string ) => boolean;
	getHiddenSeries: ( chartId: string ) => Set< string >;
	isColorPaletteResolved: boolean;
}
