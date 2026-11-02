import { useCallback, useMemo } from 'react';
import { isSameCategory } from './use-overlap-slots';
import type { OverlapSlots } from './use-overlap-slots';
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
 * Lays out the keyboard stops: one per slot and category in an overlap layout, else one per primary bar, series-major within each category.
 *
 * @param overlapSlots   - The overlap layout, or undefined for a grouped one.
 * @param primaryEntries - The visible primary series.
 * @return The stops.
 */
export function useBarStops(
	overlapSlots: OverlapSlots | undefined,
	primaryEntries: SeriesEntry[]
): BarStops {
	const series = useMemo(
		() => ( overlapSlots ? [] : primaryEntries.map( entry => entry.series ) ),
		[ overlapSlots, primaryEntries ]
	);

	const count =
		overlapSlots?.positions.length ??
		Math.max( 0, ...series.map( item => item.data.length ) ) * series.length;

	const key = useMemo(
		() => JSON.stringify( overlapSlots?.keys ?? series.map( item => item.label ) ),
		[ overlapSlots, series ]
	);

	const barAt = useCallback(
		( stop: number ): StopBar | undefined => {
			if ( overlapSlots ) {
				const position = overlapSlots.positions[ stop ];
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
		[ overlapSlots, series ]
	);

	const stopOf = useCallback(
		( seriesKey: string, dataPointIndex: number ): number | undefined => {
			if ( overlapSlots ) {
				const hovered = overlapSlots.entries.find( entry => entry.series.label === seriesKey )
					?.series.data[ dataPointIndex ] as DataPointDate | undefined;
				const slotKey = overlapSlots.slotOf( seriesKey );
				const stop = hovered
					? overlapSlots.positions.findIndex(
							position => position.slotKey === slotKey && isSameCategory( position.datum, hovered )
						)
					: -1;
				return stop >= 0 ? stop : undefined;
			}
			const seriesIndex = series.findIndex( item => item.label === seriesKey );
			return seriesIndex >= 0 ? dataPointIndex * series.length + seriesIndex : undefined;
		},
		[ overlapSlots, series ]
	);

	return { count, key, barAt, stopOf };
}
