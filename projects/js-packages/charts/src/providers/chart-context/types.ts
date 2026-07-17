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
	// Resolve a theme color or CSS variable to a hex string in the provider's scope.
	// Resolves at call time so it tracks ambient theme changes (e.g. a light/dark switch).
	resolveThemeColor: ( value: string ) => string;
	// Series visibility management for interactive legends
	toggleSeriesVisibility: ( chartId: string, seriesLabel: string ) => void;
	isSeriesVisible: ( chartId: string, seriesLabel: string ) => boolean;
	getHiddenSeries: ( chartId: string ) => Set< string >;
	isColorPaletteResolved: boolean;
}
