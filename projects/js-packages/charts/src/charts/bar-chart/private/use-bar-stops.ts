import { useCallback, useMemo } from 'react';
import { isSameCategory } from './category';
import type { BarSlots } from './use-bar-slots';
import type { DataPointDate, SeriesData } from '../../../types';

type SeriesEntry = { series: SeriesData; index: number };

/** A bar the keyboard can stop at. */
export type StopBar = { datum: DataPointDate; index: number; key: string };

export type BarStops = {
	count: number;
	/** Changes when the stops do, so keyboard navigation starts over. */
	key: string;
	barAt: ( stop: number ) => StopBar | undefined;
	stopOf: ( key: string, dataPointIndex: number ) => number | undefined;
};

/**
 * Lays out the keyboard stops: one per slot and category in a slotted layout, else one per primary bar, series-major within each category.
 *
 * @param barSlots       - The overlap or stacked slots, or undefined for a grouped layout.
 * @param primaryEntries - The visible primary series.
 * @return The stops.
 */
export function useBarStops(
	barSlots: BarSlots | undefined,
	primaryEntries: SeriesEntry[]
): BarStops {
	const series = useMemo(
		() => ( barSlots ? [] : primaryEntries.map( entry => entry.series ) ),
		[ barSlots, primaryEntries ]
	);

	const count =
		barSlots?.positions.length ??
		Math.max( 0, ...series.map( item => item.data.length ) ) * series.length;

	const key = useMemo(
		() => JSON.stringify( barSlots?.keys ?? series.map( item => item.label ) ),
		[ barSlots, series ]
	);

	const barAt = useCallback(
		( stop: number ): StopBar | undefined => {
			if ( barSlots ) {
				const position = barSlots.positions[ stop ];
				return (
					position && {
						datum: position.datum,
						index: position.dataPointIndex,
						key: position.key,
					}
				);
			}
			if ( ! series.length ) {
				return undefined;
			}
			const index = Math.floor( stop / series.length );
			const item = series[ stop % series.length ];
			const datum = item?.data[ index ] as DataPointDate | undefined;
			return item && datum ? { datum, index, key: item.label } : undefined;
		},
		[ barSlots, series ]
	);

	const stopOf = useCallback(
		( seriesKey: string, dataPointIndex: number ): number | undefined => {
			if ( barSlots ) {
				const hovered = barSlots.entries.find( entry => entry.series.label === seriesKey )?.series
					.data[ dataPointIndex ] as DataPointDate | undefined;
				const slotKey = barSlots.slotOf( seriesKey );
				const stop = hovered
					? barSlots.positions.findIndex(
							position => position.slotKey === slotKey && isSameCategory( position.datum, hovered )
						)
					: -1;
				return stop >= 0 ? stop : undefined;
			}
			const seriesIndex = series.findIndex( item => item.label === seriesKey );
			return seriesIndex >= 0 ? dataPointIndex * series.length + seriesIndex : undefined;
		},
		[ barSlots, series ]
	);

	return { count, key, barAt, stopOf };
}
