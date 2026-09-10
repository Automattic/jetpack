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
	/**
	 * Collapse series that share a `group` into a single legend item, labelled by the group's
	 * primary series. Off by default, so every series gets its own item.
	 */
	collapseGroups?: boolean;
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

type SeriesGroupMember = { series: SeriesData; index: number };

/**
 * Buckets series by their `group`, preserving first-appearance order. Series with no group — or a
 * group value unique to them — end up in a bucket of their own. Whether a multi-series bucket then
 * collapses to a single legend item is decided by the caller: with `collapseGroups` on, every
 * multi-member bucket collapses, and the comparison pattern only decides which member represents it.
 * @param seriesData - The series data to group
 * @return Ordered groups, each holding its member series with their original indices
 */
function groupSeriesForLegend( seriesData: SeriesData[] ): SeriesGroupMember[][] {
	const groups: SeriesGroupMember[][] = [];
	const groupIndexByKey = new Map< string, number >();

	seriesData.forEach( ( series, index ) => {
		const member: SeriesGroupMember = { series, index };
		const key = series.group;

		if ( key === undefined ) {
			groups.push( [ member ] );
			return;
		}

		const existing = groupIndexByKey.get( key );
		if ( existing === undefined ) {
			groupIndexByKey.set( key, groups.length );
			groups.push( [ member ] );
		} else {
			groups[ existing ].push( member );
		}
	} );

	return groups;
}

/**
 * Builds a single legend item from a representative series, tagging it with the series it controls
 * @param member           - The series (with its original index) that provides the label/colour
 * @param seriesLabels     - Every series label this item toggles (grouped) or just its own
 * @param getElementStyles - Function to get element styles
 * @param showValues       - Whether to show values in legend
 * @param withGlyph        - Whether to include glyph rendering
 * @param glyphSize        - Size of the glyph
 * @param renderGlyph      - Component to render the glyph
 * @param legendShape      - The shape type for legend items (string literal or React component)
 * @return The processed legend item
 */
function buildSeriesLegendItem(
	member: SeriesGroupMember,
	seriesLabels: string[],
	getElementStyles: ( params: GetElementStylesParams ) => ElementStyles,
	showValues: boolean,
	withGlyph: boolean,
	glyphSize: number,
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode,
	legendShape?: LegendShape< SeriesData[], number >
): BaseLegendItem {
	const { color, glyph, shapeStyles } = getElementStyles( {
		data: member.series,
		index: member.index,
		legendShape,
	} );

	const baseItem: BaseLegendItem = {
		label: member.series.label,
		value: showValues ? member.series.data?.length?.toString() || '0' : '',
		color,
		shapeStyle: shapeStyles,
		seriesLabels,
	};

	return applyGlyphToLegendItem( baseItem, withGlyph, glyph, renderGlyph, glyphSize );
}

/**
 * Processes SeriesData into legend items. Every series keeps its own legend entry unless
 * `collapseGroups` is set, in which case series sharing a `group` collapse to one item labelled by
 * the group's primary (its first non-comparison member).
 * @param seriesData       - The series data to process
 * @param getElementStyles - Function to get element styles
 * @param showValues       - Whether to show values in legend
 * @param withGlyph        - Whether to include glyph rendering
 * @param glyphSize        - Size of the glyph
 * @param collapseGroups   - Whether series sharing a group collapse to a single item
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
	collapseGroups: boolean,
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode,
	legendShape?: LegendShape< SeriesData[], number >
): BaseLegendItem[] {
	const buildItem = ( member: SeriesGroupMember, seriesLabels: string[] ) =>
		buildSeriesLegendItem(
			member,
			seriesLabels,
			getElementStyles,
			showValues,
			withGlyph,
			glyphSize,
			renderGlyph,
			legendShape
		);

	// Without collapsing there is no reason to bucket by group — mapping series directly keeps the
	// original order, which matters for charts that already interleave grouped series for colour.
	if ( ! collapseGroups ) {
		return seriesData.map( ( series, index ) => buildItem( { series, index }, [ series.label ] ) );
	}

	return groupSeriesForLegend( seriesData ).flatMap( members => {
		if ( members.length > 1 ) {
			const primary =
				members.find( ( { series } ) => series.options?.type !== 'comparison' ) ?? members[ 0 ];

			// Primary first so the interactive visibility check reads the series that owns the swatch.
			const seriesLabels = [
				primary.series.label,
				...members.filter( member => member !== primary ).map( ( { series } ) => series.label ),
			];

			return [ buildItem( primary, seriesLabels ) ];
		}

		return members.map( member => buildItem( member, [ member.series.label ] ) );
	} );
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
		collapseGroups = false,
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
				collapseGroups,
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
		collapseGroups,
		renderGlyph,
		legendShape,
	] );
}
