import { formatNumber } from '@automattic/number-formatters';
import { useMemo } from 'react';
import {
	useGlobalChartsContext,
	type GetElementStylesParams,
	type ElementStyles,
} from '../../../providers';
import { formatPercentage } from '../../../utils';
import type {
	SeriesData,
	DataPointDate,
	DataPointPercentageCalculated,
	LegendShape,
} from '../../../types';
import type { BaseLegendItem } from '../types';
import type { GlyphProps } from '@visx/xychart';
import type { ReactNode } from 'react';

export type LegendValueDisplay = 'percentage' | 'value' | 'valueDisplay' | 'none';

export interface ChartLegendOptions {
	withGlyph?: boolean;
	glyphSize?: number;
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode;
	showValues?: boolean;
	legendValueDisplay?: LegendValueDisplay;
	legendShape?: LegendShape< SeriesData[], number >;
}

/**
 * Formats the value for a data point based on its type and display preference
 * @param point              - The data point to format
 * @param showValues         - Whether to show values or return empty string
 * @param legendValueDisplay - What type of value to display
 * @return Formatted value string
 */
function formatPointValue(
	point: DataPointDate | DataPointPercentageCalculated,
	showValues: boolean,
	legendValueDisplay: LegendValueDisplay = 'percentage'
): string {
	if ( ! showValues || legendValueDisplay === 'none' ) {
		return '';
	}

	// Handle DataPointPercentageCalculated (pie chart data with calculated percentage)
	if ( 'percentage' in point ) {
		switch ( legendValueDisplay ) {
			case 'percentage':
				return formatPercentage( point.percentage );
			case 'value':
				return formatNumber( point.value );
			case 'valueDisplay':
				return point.valueDisplay || formatNumber( point.value );
			default:
				return '';
		}
	}

	// Handle DataPointDate (time series data)
	if ( 'value' in point ) {
		return point.value !== null ? formatNumber( point.value ) : '';
	}

	return '';
}

/**
 * Applies glyph configuration to a legend item if needed
 * @param baseItem    - The base legend item
 * @param withGlyph   - Whether to include glyph rendering
 * @param glyph       - Glyph component from theme
 * @param renderGlyph - Custom glyph render function
 * @param glyphSize   - Size of the glyph
 * @return The legend item with glyph configuration applied if applicable
 */
function applyGlyphToLegendItem(
	baseItem: BaseLegendItem,
	withGlyph: boolean,
	glyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode,
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode,
	glyphSize?: number
): BaseLegendItem {
	if ( withGlyph ) {
		const glyphToUse = glyph || renderGlyph;
		if ( glyphToUse ) {
			return {
				...baseItem,
				glyphSize,
				renderGlyph: glyphToUse,
			};
		}
	}

	return baseItem;
}

/**
 * Processes SeriesData into legend items
 * @param seriesData       - The series data to process
 * @param getElementStyles - Function to get element styles
 * @param showValues       - Whether to show values in legend
 * @param withGlyph        - Whether to include glyph rendering
 * @param glyphSize        - Size of the glyph
 * @param renderGlyph      - Component to render the glyph
 * @param legendShape      - The shape type for legend items (string literal or React component)
 * @return Array of processed legend items
 */
function processSeriesData(
	seriesData: SeriesData[],
	getElementStyles: ( params: GetElementStylesParams ) => ElementStyles,
	showValues: boolean,
	withGlyph: boolean,
	glyphSize: number,
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode,
	legendShape?: LegendShape< SeriesData[], number >
): BaseLegendItem[] {
	const mapper = ( series: SeriesData, index: number ) => {
		const { color, glyph, shapeStyles } = getElementStyles( {
			data: series,
			index,
			legendShape,
		} );

		const baseItem: BaseLegendItem = {
			label: series.label,
			value: showValues ? series.data?.length?.toString() || '0' : '',
			color,
			shapeStyle: shapeStyles,
		};

		return applyGlyphToLegendItem( baseItem, withGlyph, glyph, renderGlyph, glyphSize );
	};

	return seriesData.map( mapper );
}

/**
 * Processes point data into legend items
 * @param pointData          - The point data to process
 * @param getElementStyles   - Function to get element styles
 * @param showValues         - Whether to show values in legend
 * @param legendValueDisplay - What type of value to display
 * @param withGlyph          - Whether to include glyph rendering
 * @param glyphSize          - Size of the glyph
 * @param renderGlyph        - Component to render the glyph
 * @param legendShape        - The shape type for legend items (string literal or React component)
 * @return Array of processed legend items
 */
function processPointData(
	pointData: ( DataPointDate | DataPointPercentageCalculated )[],
	getElementStyles: ( params: GetElementStylesParams ) => ElementStyles,
	showValues: boolean,
	legendValueDisplay: LegendValueDisplay,
	withGlyph: boolean,
	glyphSize: number,
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode,
	legendShape?: LegendShape< SeriesData[], number >
): BaseLegendItem[] {
	const mapper = ( point: DataPointDate | DataPointPercentageCalculated, index: number ) => {
		const { color, glyph, shapeStyles } = getElementStyles( {
			data: point as DataPointPercentageCalculated,
			index,
			legendShape,
		} );

		const baseItem: BaseLegendItem = {
			label: point.label,
			value: formatPointValue( point, showValues, legendValueDisplay ),
			color,
			shapeStyle: shapeStyles,
		};

		return applyGlyphToLegendItem( baseItem, withGlyph, glyph, renderGlyph, glyphSize );
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
	T extends SeriesData[] | DataPointDate[] | DataPointPercentageCalculated[],
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
	const { getElementStyles } = useGlobalChartsContext();

	return useMemo( () => {
		if ( ! data || ! Array.isArray( data ) || data.length === 0 ) {
			return [];
		}

		// Handle SeriesData (multiple series with data points)
		if ( 'data' in data[ 0 ] ) {
			return processSeriesData(
				data as SeriesData[],
				getElementStyles,
				showValues,
				withGlyph,
				glyphSize,
				renderGlyph,
				legendShape
			);
		}

		// Handle DataPointDate or DataPointPercentageCalculated (single data points)
		return processPointData(
			data as ( DataPointDate | DataPointPercentageCalculated )[],
			getElementStyles,
			showValues,
			legendValueDisplay,
			withGlyph,
			glyphSize,
			renderGlyph,
			legendShape
		);
	}, [
		data,
		getElementStyles,
		showValues,
		legendValueDisplay,
		withGlyph,
		glyphSize,
		renderGlyph,
		legendShape,
	] );
}
