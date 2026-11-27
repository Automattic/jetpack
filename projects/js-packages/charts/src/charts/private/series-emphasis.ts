import { useMemo } from 'react';
import { DIMMED_SERIES_OPACITY } from '../../constants';
import { warnOnce } from '../../utils/warn-once';
import type { SeriesData } from '../../types';

/** Reads the opacity a series draws at, or undefined for full strength. */
export type GetSeriesOpacity = ( label: string ) => number | undefined;

/**
 * Resolves `emphasizedSeries` against the primary series.
 *
 * @param data             - The chart's series.
 * @param emphasizedSeries - The label to bring out; null or undefined for none.
 * @return An opacity reader. A label no primary series carries dims nothing and warns once, but
 * not before the data has arrived.
 */
export function useSeriesEmphasis(
	data: SeriesData[],
	emphasizedSeries: string | null | undefined
): GetSeriesOpacity {
	const known =
		emphasizedSeries != null &&
		data.some(
			series => series.options?.type !== 'comparison' && series.label === emphasizedSeries
		);
	if ( emphasizedSeries != null && data.length && ! known ) {
		warnOnce(
			`series-emphasis-${ emphasizedSeries }`,
			`emphasizedSeries "${ emphasizedSeries }" matches no primary series label, so nothing is dimmed.`
		);
	}

	return useMemo(
		() => ( label: string ) =>
			known && label !== emphasizedSeries ? DIMMED_SERIES_OPACITY : undefined,
		[ emphasizedSeries, known ]
	);
}
