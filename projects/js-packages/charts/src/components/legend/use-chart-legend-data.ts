import { LineStyles } from '@visx/xychart';
import { CSSProperties, useContext, useMemo } from 'react';
import { useGlobalChartTheme } from '../../hooks';
import { GlobalChartsContext, type ChartContextValue } from '../../providers/chart-context';
import { getSeriesStyles, getItemShapeStyles } from '../../utils/get-styles';
import type { LegendItemWithGlyph, LegendItemWithoutGlyph } from './types';
import type { ChartTheme, SeriesData, DataPointDate, DataPointPercentage } from '../../types';
import type { LegendShape } from '@visx/legend/lib/types';

export interface ChartLegendOptions {
	withGlyph?: boolean;
	glyphSize?: number;
	renderGlyph?: React.ComponentType< unknown >;
	showValues?: boolean;
}

/**
 * Formats the value for a data point based on its type
 * @param point      - The data point to format
 * @param showValues - Whether to show values or return empty string
 * @return Formatted value string
 */
function formatPointValue(
	point: DataPointDate | DataPointPercentage,
	showValues: boolean
): string {
	if ( ! showValues ) {
		return '';
	}

	if ( 'percentage' in point ) {
		return `${ point.percentage }%`;
	} else if ( 'value' in point ) {
		return point.value.toString();
	}

	return '';
}

/**
 * Creates a base legend item with common properties
 * @param label      - The label for the legend item
 * @param value      - The value for the legend item
 * @param color      - The color for the legend item
 * @param shapeStyle - The shape style for the legend item
 * @return Base legend item object
 */
function createBaseLegendItem(
	label: string,
	value: string,
	color: string,
	shapeStyle?: CSSProperties & LineStyles
): Omit< LegendItemWithGlyph, 'glyphSize' | 'renderGlyph' > {
	return {
		label,
		value,
		color,
		shapeStyle,
	};
}

/**
 * Processes SeriesData into legend items
 * @param seriesData        - The series data to process
 * @param theme             - The chart theme for colors
 * @param showValues        - Whether to show values in legend
 * @param withGlyph         - Whether to include glyph rendering
 * @param glyphSize         - Size of the glyph
 * @param renderGlyph       - Component to render the glyph
 * @param legendShape       - The shape to use for the legend
 * @param resolveGroupColor - Optional resolver from ChartContext for stable group colors
 * @return Array of processed legend items
 */
function processSeriesData(
	seriesData: SeriesData[],
	theme: ChartTheme,
	showValues: boolean,
	withGlyph: boolean,
	glyphSize: number,
	renderGlyph?: React.ComponentType< unknown >,
	legendShape?: LegendShape< SeriesData[], number >,
	resolveGroupColor?: ChartContextValue[ 'resolveGroupColor' ]
): LegendItemWithGlyph[] | LegendItemWithoutGlyph[] {
	const mapper = ( series: SeriesData, index: number ) => {
		const { stroke } = getSeriesStyles( series, index, theme, resolveGroupColor );
		const { shapeStyles } = getItemShapeStyles( series, index, theme, legendShape );
		const baseItem = createBaseLegendItem(
			series.label,
			showValues ? series.data?.length?.toString() || '0' : '',
			stroke,
			shapeStyles
		);

		if ( withGlyph && renderGlyph ) {
			return {
				...baseItem,
				glyphSize,
				renderGlyph,
			} as LegendItemWithGlyph;
		}

		return baseItem;
	};

	return seriesData.map( mapper ) as LegendItemWithGlyph[] | LegendItemWithoutGlyph[];
}

/**
 * Processes point data into legend items
 * @param pointData         - The point data to process
 * @param theme             - The chart theme for colors
 * @param showValues        - Whether to show values in legend
 * @param withGlyph         - Whether to include glyph rendering
 * @param glyphSize         - Size of the glyph
 * @param renderGlyph       - Component to render the glyph
 * @param resolveGroupColor - Optional resolver from ChartContext for stable group colors
 * @return Array of processed legend items
 */
function processPointData(
	pointData: ( DataPointDate | DataPointPercentage )[],
	theme: ChartTheme,
	showValues: boolean,
	withGlyph: boolean,
	glyphSize: number,
	renderGlyph?: React.ComponentType< unknown >,
	resolveGroupColor?: ChartContextValue[ 'resolveGroupColor' ]
): LegendItemWithGlyph[] | LegendItemWithoutGlyph[] {
	const mapper = ( point: DataPointDate | DataPointPercentage, index: number ) => {
		// Use resolveGroupColor for stable group colors if available
		const color = resolveGroupColor
			? resolveGroupColor( {
					group: ( point as DataPointPercentage & { group?: string } ).group || point.label,
					index,
			  } )
			: theme.colors[ index % theme.colors.length ];

		const baseItem = createBaseLegendItem(
			point.label,
			formatPointValue( point, showValues ),
			color
		);

		if ( withGlyph && renderGlyph ) {
			return {
				...baseItem,
				glyphSize,
				renderGlyph,
			} as LegendItemWithGlyph;
		}

		return baseItem as LegendItemWithoutGlyph;
	};

	return pointData.map( mapper ) as LegendItemWithGlyph[] | LegendItemWithoutGlyph[];
}

/**
 * Hook to transform chart data into legend items
 * @param data        - The chart data to transform
 * @param options     - Configuration options for legend generation
 * @param legendShape - The shape type for legend items (string literal or React component)
 * @return Array of legend items ready for display
 */
export function useChartLegendData<
	T extends SeriesData[] | DataPointDate[] | DataPointPercentage[],
>(
	data: T,
	options: ChartLegendOptions = {},
	legendShape?: LegendShape< SeriesData[], number >
): LegendItemWithGlyph[] | LegendItemWithoutGlyph[] {
	const { showValues = false, withGlyph = false, glyphSize = 8, renderGlyph } = options;
	const chartCtx = useContext( GlobalChartsContext );
	const resolveGroupColor = chartCtx?.resolveGroupColor;
	const theme = useGlobalChartTheme();

	return useMemo( () => {
		if ( ! data || ! Array.isArray( data ) || data.length === 0 ) {
			return [];
		}

		// Handle SeriesData (multiple series with data points)
		if ( 'data' in data[ 0 ] ) {
			return processSeriesData(
				data as SeriesData[],
				theme,
				showValues,
				withGlyph,
				glyphSize,
				renderGlyph,
				legendShape,
				resolveGroupColor
			);
		}

		// Handle DataPointDate or DataPointPercentage (single data points)
		return processPointData(
			data as ( DataPointDate | DataPointPercentage )[],
			theme,
			showValues,
			withGlyph,
			glyphSize,
			renderGlyph,
			resolveGroupColor
		);
	}, [
		data,
		theme,
		showValues,
		withGlyph,
		glyphSize,
		renderGlyph,
		legendShape,
		resolveGroupColor,
	] );
}
