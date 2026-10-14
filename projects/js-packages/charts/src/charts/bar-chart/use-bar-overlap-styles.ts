import { useMemo } from 'react';
import { useGlobalChartsContext } from '../../providers';
import { CATALOG_POINTERS } from '../../providers/chart-context/private/catalog-pointers';
import { getOverlapColors } from './private/overlap-colors';
import type { BarLayout, BarOverlapStyles } from './types';
import type { DataPointDate, SeriesData } from '../../types';

export type BarOverlapOptions = {
	layout?: BarLayout;
	horizontal?: boolean;
	/** Whether the series with this label is shown; defaults to every series. */
	isVisible?: ( label: string ) => boolean;
};

const ALWAYS_VISIBLE = () => true;

const sumFiniteValues = ( series: SeriesData ) =>
	( series.data as DataPointDate[] ).reduce(
		( sum, point ) => sum + ( Number.isFinite( point.value ) ? ( point.value as number ) : 0 ),
		0
	);

/**
 * Resolves the overlap layout's paint, or null when the chart has to stay grouped.
 *
 * @param data               - Every series handed to the chart.
 * @param options            - Layout, orientation, and visibility.
 * @param options.layout     - The requested bar layout.
 * @param options.horizontal - Whether the bars run horizontally.
 * @param options.isVisible  - Whether the series with a label is shown.
 * @return The overlap styles, or null without a vertical layout of exactly two visible primaries.
 */
export function useBarOverlapStyles(
	data: SeriesData[],
	{ layout = 'grouped', horizontal = false, isVisible = ALWAYS_VISIBLE }: BarOverlapOptions
): BarOverlapStyles | null {
	const { getElementStyles, chartBackground } = useGlobalChartsContext();

	return useMemo( () => {
		if ( layout !== 'overlap' || horizontal ) {
			return null;
		}

		const indexed = data.map( ( series, index ) => ( { series, index } ) );
		const primaries = indexed.filter(
			( { series } ) => series.options?.type !== 'comparison' && isVisible( series.label )
		);

		if ( primaries.length !== 2 ) {
			return null;
		}

		const [ outer, inner ] = [ ...primaries ].sort(
			( a, b ) => sumFiniteValues( b.series ) - sumFiniteValues( a.series )
		);
		const colors = getOverlapColors( {
			outer: getElementStyles( { data: outer.series, index: outer.index } ).color,
			inner: getElementStyles( { data: inner.series, index: inner.index } ).color,
			background: chartBackground,
		} );

		if ( ! colors ) {
			return null;
		}

		// Unlike the grouped layout, an ungrouped comparison is not handed to a primary here.
		const comparisons = [ outer, inner ].flatMap( ( primary, ordinal ) =>
			indexed
				.filter(
					( { series } ) =>
						series.options?.type === 'comparison' &&
						series.group !== undefined &&
						series.group === primary.series.group &&
						isVisible( series.label )
				)
				.map( ( { series, index } ) => ( {
					label: series.label,
					primaryLabel: primary.series.label,
					stroke: series.options?.stroke ?? CATALOG_POINTERS.comparisonLine,
					lineStyles: getElementStyles( { data: series, index } ).lineStyles,
					marker: ordinal === 0 ? ( 'square' as const ) : ( 'circle' as const ),
				} ) )
		);

		return {
			outer: {
				label: outer.series.label,
				fill: colors.outerFill,
				outline: colors.outerOutline,
			},
			inner: { label: inner.series.label, fill: colors.innerFill },
			comparisons,
		};
	}, [ data, layout, horizontal, isVisible, getElementStyles, chartBackground ] );
}
