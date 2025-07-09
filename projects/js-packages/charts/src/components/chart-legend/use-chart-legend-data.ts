import { useMemo } from 'react';
import type { ChartLegendOptions } from './types';
import type { SeriesData, ChartTheme, DataPoint, DataPointPercentage } from '../../types';
import type { LegendItemWithGlyph, LegendItemWithoutGlyph } from '../legend/types';

// Overload for SeriesData[]
export function useChartLegendData(
	data: SeriesData[],
	theme: ChartTheme,
	options?: ChartLegendOptions
): LegendItemWithGlyph[] | LegendItemWithoutGlyph[];

// Overload for DataPoint[] or DataPointPercentage[]
export function useChartLegendData(
	data: DataPoint[] | DataPointPercentage[],
	theme: ChartTheme,
	options?: ChartLegendOptions
): LegendItemWithGlyph[] | LegendItemWithoutGlyph[];

/**
 * Converts chart data to legend items with proper typing based on glyph usage
 * @param data    - Chart data (SeriesData[], DataPoint[], or DataPointPercentage[])
 * @param theme   - Chart theme containing colors and optional glyphs
 * @param options - Configuration options for legend item generation
 * @return Array of legend items with proper typing for glyph usage
 */
export function useChartLegendData(
	data: SeriesData[] | DataPoint[] | DataPointPercentage[],
	theme: ChartTheme,
	options: ChartLegendOptions = {}
): LegendItemWithGlyph[] | LegendItemWithoutGlyph[] {
	return useMemo( () => {
		// Check if it's SeriesData[] by checking if first item has a data property
		const isSeriesData = data.length > 0 && 'data' in data[ 0 ];

		// Check if any item will have a glyph to determine return type
		const hasGlyphs = options.withGlyph && ( theme.glyphs || options.renderGlyph );

		if ( isSeriesData ) {
			const seriesData = data as SeriesData[];
			if ( hasGlyphs ) {
				return seriesData.map( ( group, index ) => ( {
					label: group.label,
					value: options.showValues ? '' : '', // SeriesData doesn't have a value property
					color: group.options?.stroke ?? theme.colors[ index % theme.colors.length ],
					shapeStyle: group.options?.legendShapeStyle,
					renderGlyph: theme.glyphs?.[ index ] ?? options.renderGlyph!,
					glyphSize: options.glyphSize ?? 4,
				} ) ) as LegendItemWithGlyph[];
			}
			return seriesData.map( ( group, index ) => ( {
				label: group.label,
				value: options.showValues ? '' : '', // SeriesData doesn't have a value property
				color: group.options?.stroke ?? theme.colors[ index % theme.colors.length ],
				shapeStyle: group.options?.legendShapeStyle,
				glyphSize: options.glyphSize ?? 4,
			} ) ) as LegendItemWithoutGlyph[];
		}
		// Handle DataPoint[] or DataPointPercentage[]
		const pointData = data as DataPoint[] | DataPointPercentage[];
		if ( hasGlyphs ) {
			return pointData.map( ( item, index ) => ( {
				label: item.label,
				value: options.showValues
					? ( 'valueDisplay' in item ? item.valueDisplay : item.value.toString() ) ||
					  item.value.toString()
					: '',
				color: theme.colors[ index % theme.colors.length ],
				shapeStyle: undefined,
				renderGlyph: theme.glyphs?.[ index ] ?? options.renderGlyph!,
				glyphSize: options.glyphSize ?? 4,
			} ) ) as LegendItemWithGlyph[];
		}
		return pointData.map( ( item, index ) => ( {
			label: item.label,
			value: options.showValues
				? ( 'valueDisplay' in item ? item.valueDisplay : item.value.toString() ) ||
				  item.value.toString()
				: '',
			color: theme.colors[ index % theme.colors.length ],
			shapeStyle: undefined,
			glyphSize: options.glyphSize ?? 4,
		} ) ) as LegendItemWithoutGlyph[];
	}, [ data, theme, options ] );
}
