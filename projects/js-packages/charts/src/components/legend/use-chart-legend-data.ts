import { useMemo } from 'react';
import type { LegendItemWithGlyph, LegendItemWithoutGlyph } from './types';
import type { ChartTheme, SeriesData, DataPointDate, DataPointPercentage } from '../../types';

export interface ChartLegendOptions {
	withGlyph?: boolean;
	glyphSize?: number;
	renderGlyph?: React.ComponentType< any >;
	showValues?: boolean;
}

/**
 * Formats the value for a data point based on its type
 * @param point
 * @param showValues
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
 * @param label
 * @param value
 * @param color
 */
function createBaseLegendItem(
	label: string,
	value: string,
	color: string
): Omit< LegendItemWithGlyph, 'glyphSize' | 'renderGlyph' > {
	return {
		label,
		value,
		color,
	};
}

/**
 * Processes SeriesData into legend items
 * @param seriesData
 * @param theme
 * @param showValues
 * @param withGlyph
 * @param glyphSize
 * @param renderGlyph
 */
function processSeriesData(
	seriesData: SeriesData[],
	theme: ChartTheme,
	showValues: boolean,
	withGlyph: boolean,
	glyphSize: number,
	renderGlyph?: React.ComponentType< any >
): LegendItemWithGlyph[] | LegendItemWithoutGlyph[] {
	const mapper = ( series: SeriesData, index: number ) => {
		const baseItem = createBaseLegendItem(
			series.label,
			showValues ? series.data?.length?.toString() || '0' : '',
			theme.colors[ index % theme.colors.length ]
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

	return seriesData.map( mapper ) as LegendItemWithGlyph[] | LegendItemWithoutGlyph[];
}

/**
 * Processes point data into legend items
 * @param pointData
 * @param theme
 * @param showValues
 * @param withGlyph
 * @param glyphSize
 * @param renderGlyph
 */
function processPointData(
	pointData: ( DataPointDate | DataPointPercentage )[],
	theme: ChartTheme,
	showValues: boolean,
	withGlyph: boolean,
	glyphSize: number,
	renderGlyph?: React.ComponentType< any >
): LegendItemWithGlyph[] | LegendItemWithoutGlyph[] {
	const mapper = ( point: DataPointDate | DataPointPercentage, index: number ) => {
		const baseItem = createBaseLegendItem(
			point.label,
			formatPointValue( point, showValues ),
			theme.colors[ index % theme.colors.length ]
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
 * @param data
 * @param theme
 * @param options
 */
export function useChartLegendData<
	T extends SeriesData[] | DataPointDate[] | DataPointPercentage[],
>(
	data: T,
	theme: ChartTheme,
	options: ChartLegendOptions = {}
): LegendItemWithGlyph[] | LegendItemWithoutGlyph[] {
	const { showValues = true, withGlyph = false, glyphSize = 8, renderGlyph } = options;

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
				renderGlyph
			);
		}

		// Handle DataPointDate or DataPointPercentage (single data points)
		return processPointData(
			data as ( DataPointDate | DataPointPercentage )[],
			theme,
			showValues,
			withGlyph,
			glyphSize,
			renderGlyph
		);
	}, [ data, theme, showValues, withGlyph, glyphSize, renderGlyph ] );
}
