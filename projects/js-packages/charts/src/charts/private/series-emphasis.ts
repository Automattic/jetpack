import { useMemo } from 'react';
import { warnOnce } from '../../utils/warn-once';
import type { SeriesData } from '../../types';

/** How much of a series shows while another one is brought out. */
export const DIMMED_SERIES_OPACITY = 0.2;

/** Reads the opacity a series draws at, or undefined for full strength. */
export type GetSeriesOpacity = ( label: string ) => number | undefined;

/**
 * Resolves `emphasizedSeries` against the data.
 *
 * @param data             - The chart's series.
 * @param emphasizedSeries - The label to bring out; null for none.
 * @return An opacity reader once the host passes the prop at all, so the bars keep their
 * identity while the emphasis comes and goes; undefined while the prop is omitted.
 */
export function useSeriesEmphasis(
	data: SeriesData[],
	emphasizedSeries: string | null | undefined
): GetSeriesOpacity | undefined {
	const known =
		emphasizedSeries != null && data.some( series => series.label === emphasizedSeries );
	if ( emphasizedSeries != null && ! known ) {
		warnOnce(
			`series-emphasis-${ emphasizedSeries }`,
			`emphasizedSeries "${ emphasizedSeries }" matches no series label, so nothing is dimmed.`
		);
	}

	return useMemo( () => {
		if ( emphasizedSeries === undefined ) {
			return undefined;
		}
		return ( label: string ) =>
			known && label !== emphasizedSeries ? DIMMED_SERIES_OPACITY : undefined;
	}, [ emphasizedSeries, known ] );
}
