import { useCallback } from 'react';
import { useGlobalChartsContext } from '../../providers/chart-context/hooks/use-global-charts-context';
import { BACKGROUND_FALLBACK } from '../../providers/chart-context/private/catalog-pointers';
import { isValidHexColor } from '../../utils/color-utils';
import { getGroupedBarColors } from './private/grouped-bars';
import {
	getOverlapBarColors,
	isComparisonSeries,
	neutralWithContrast,
} from './private/overlap-bars';
import type { BarChartLayout, SeriesData } from '../../types';

export type GetBarColors = (
	series: SeriesData[],
	options?: { layout?: BarChartLayout }
) => string[];

/**
 * Reads the colors `BarChart` fills series with, so a custom tooltip or legend can match the bars.
 *
 * @return A function from series and a layout to each series' bar color, by index.
 */
export function useBarColors(): GetBarColors {
	const {
		getElementStyles,
		backgroundColor = BACKGROUND_FALLBACK,
		theme,
	} = useGlobalChartsContext();
	const comparisonOpacity = theme.barChart?.barStyles?.comparison?.opacity;

	return useCallback< GetBarColors >(
		( series, { layout = 'grouped' } = {} ) => {
			const colors = series.map( ( data, index ) => getElementStyles( { data, index } ).color );

			if ( layout === 'stacked' ) {
				// Comparisons share one bar: no palette slot, and the first stroke set among them, else a contrast gray.
				const primaries = series.filter( data => ! isComparisonSeries( data ) );
				const stroked = series.findIndex(
					data => isComparisonSeries( data ) && data.options?.stroke
				);
				const firstComparison = series.findIndex( isComparisonSeries );
				const comparisonColor =
					stroked === -1 && isValidHexColor( backgroundColor )
						? neutralWithContrast( backgroundColor )
						: colors[ stroked === -1 ? firstComparison : stroked ];
				return series.map( data =>
					isComparisonSeries( data )
						? comparisonColor
						: getElementStyles( { data, index: primaries.indexOf( data ) } ).color
				);
			}

			if ( layout !== 'overlap' ) {
				// The deprecated comparison opacity keeps the translucent bars in their series colors.
				return comparisonOpacity === undefined
					? getGroupedBarColors( series, colors, backgroundColor )
					: colors;
			}

			return getOverlapBarColors(
				series,
				colors,
				[ getElementStyles( { index: 0 } ).color, getElementStyles( { index: 1 } ).color ],
				backgroundColor
			);
		},
		[ getElementStyles, backgroundColor, comparisonOpacity ]
	);
}
