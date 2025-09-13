import { useMemo } from 'react';
import { useGlobalChartsTheme } from '../../../providers';
import { getItemShapeStyles, getSeriesStroke, formatPercentage } from '../../../utils';
import type { ChartTheme, SeriesData, DataPointDate, DataPointPercentage } from '../../../types';
import type { BaseLegendItem } from '../types';
import type { LegendShape } from '@visx/legend/lib/types';
import type { GlyphProps } from '@visx/xychart';
import type { ReactNode } from 'react';

export type LegendValueDisplay = 'percentage' | 'value' | 'valueDisplay' | 'none';

export interface ChartLegendOptions {
	withGlyph?: boolean;
	glyphSize?: number;
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode;
	showValues?: boolean;
	legendValueDisplay?: LegendValueDisplay;
}

/**
 * Formats the value for a data point based on its type and display preference
 * @param point              - The data point to format
 * @param showValues         - Whether to show values or return empty string
 * @param legendValueDisplay - What type of value to display
 * @return Formatted value string
 */
function formatPointValue(
	point: DataPointDate | DataPointPercentage,
	showValues: boolean,
	legendValueDisplay: LegendValueDisplay = 'percentage'
): string {
	if ( ! showValues || legendValueDisplay === 'none' ) {
		return '';
	}

	// Handle DataPointPercentage (pie chart data)
	if ( 'percentage' in point ) {
		const percentagePoint = point as DataPointPercentage;
		switch ( legendValueDisplay ) {
			case 'percentage':
				return formatPercentage( percentagePoint.percentage );
			case 'value':
				return percentagePoint.value.toString();
			case 'valueDisplay':
				return percentagePoint.valueDisplay || percentagePoint.value.toString();
			default:
				return '';
		}
	}

	// Handle DataPointDate (time series data)
	if ( 'value' in point ) {
		return point.value.toString();
	}

	return '';
}

/**
 * Processes SeriesData into legend items
 * @param seriesData  - The series data to process
 * @param theme       - The chart theme for colors
 * @param showValues  - Whether to show values in legend
 * @param withGlyph   - Whether to include glyph rendering
 * @param glyphSize   - Size of the glyph
 * @param renderGlyph - Component to render the glyph
 * @param legendShape - The shape to use for the legend
 * @return Array of processed legend items
 */
function processSeriesData(
	seriesData: SeriesData[],
	theme: ChartTheme,
	showValues: boolean,
	withGlyph: boolean,
	glyphSize: number,
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode,
	legendShape?: LegendShape< SeriesData[], number >
): BaseLegendItem[] {
	const mapper = ( series: SeriesData, index: number ) => {
		const { shapeStyles } = getItemShapeStyles( series, index, theme, legendShape );
		const baseItem = {
			label: series.label,
			value: showValues ? series.data?.length?.toString() || '0' : '',
			color: getSeriesStroke( series, index, theme.colors ),
			shapeStyle: shapeStyles,
			group: series.group,
			index,
			overrideColor: series.options?.stroke,
		};

		if ( withGlyph && renderGlyph ) {
			return {
				...baseItem,
				glyphSize,
				renderGlyph,
			};
		}

		return baseItem;
	};

	return seriesData.map( mapper );
}

/**
 * Processes point data into legend items
 * @param pointData          - The point data to process
 * @param theme              - The chart theme for colors
 * @param showValues         - Whether to show values in legend
 * @param legendValueDisplay - What type of value to display
 * @param withGlyph          - Whether to include glyph rendering
 * @param glyphSize          - Size of the glyph
 * @param renderGlyph        - Component to render the glyph
 * @return Array of processed legend items
 */
function processPointData(
	pointData: ( DataPointDate | DataPointPercentage )[],
	theme: ChartTheme,
	showValues: boolean,
	legendValueDisplay: LegendValueDisplay,
	withGlyph: boolean,
	glyphSize: number,
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode
): BaseLegendItem[] {
	const mapper = ( point: DataPointDate | DataPointPercentage, index: number ) => {
		const baseItem = {
			label: point.label,
			value: formatPointValue( point, showValues, legendValueDisplay ),
			color: ( point as DataPointPercentage ).color ?? theme.colors[ index % theme.colors.length ],
			group: ( point as DataPointPercentage ).group,
			index,
			overrideColor: ( point as DataPointPercentage ).color,
		};

		if ( withGlyph && renderGlyph ) {
			const itemWithGlyph = {
				...baseItem,
				glyphSize,
				renderGlyph,
			};

			return itemWithGlyph;
		}

		return baseItem;
	};

	return pointData.map( mapper );
}

/**
 * Hook to transform chart data into legend items
 * @param data        - The chart data to transform
 * @param options     - Configuration options for legend generation
 * @param legendShape - The shape type for legend items (string literal or React component)
 * @return Array of legend items ready for display
 */
export function useChartLegendItems<
	T extends SeriesData[] | DataPointDate[] | DataPointPercentage[],
>(
	data: T,
	options: ChartLegendOptions = {},
	legendShape?: LegendShape< SeriesData[], number >
): BaseLegendItem[] {
	const {
		showValues = false,
		legendValueDisplay = 'percentage',
		withGlyph = false,
		glyphSize = 8,
		renderGlyph,
	} = options;
	const theme = useGlobalChartsTheme();

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
				legendShape
			);
		}

		// Handle DataPointDate or DataPointPercentage (single data points)
		return processPointData(
			data as ( DataPointDate | DataPointPercentage )[],
			theme,
			showValues,
			legendValueDisplay,
			withGlyph,
			glyphSize,
			renderGlyph
		);
	}, [
		data,
		theme,
		showValues,
		legendValueDisplay,
		withGlyph,
		glyphSize,
		renderGlyph,
		legendShape,
	] );
}
