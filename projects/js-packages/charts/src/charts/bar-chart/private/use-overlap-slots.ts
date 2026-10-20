import { useMemo } from 'react';
import {
	COMPARISON_SLOT,
	PRIMARY_SLOT,
	getOverlapPlacements,
} from '../../../providers/chart-context/private/overlap-bars';
import { isBarRendered } from './value-domain';
import type { SelectedBar } from './selected-bar-ring';
import type { SlotMember } from './slot-tooltip-members';
import type { DataPointDate, SeriesData } from '../../../types';

type SeriesEntry = { series: SeriesData; index: number };

export type OverlapSlots = {
	/** The visible series, back to front. */
	entries: SeriesEntry[];
	keys: string[];
	/** The slots of a category, in the order the band lays them out. */
	slotKeys: string[];
	slotOf: ( key: string ) => string;
	thicknessOf: ( key: string ) => number;
	/** One keyboard stop per slot, carried by its visible series with the most categories, front-most on a tie, so every drawn slot is reachable. */
	stops: SeriesEntry[];
	/** The keyboard index space: each stop's data points, category by category, skipping points a stop does not have, in the order `XYChartTooltip` walks them. */
	positions: StopPosition[];
};

export type StopPosition = { stop: number; dataPointIndex: number };

export type SelectedSlot = SelectedBar & { index: number; members: SlotMember[] };

/**
 * Whether two data points sit at the same category: the same label, or the same date.
 *
 * @param point    - A data point.
 * @param category - The data point naming the category.
 * @return Whether `point` is at `category`.
 */
export function isSameCategory( point: DataPointDate, category: DataPointDate ): boolean {
	return category.label != null
		? point.label === category.label
		: !! category.date && !! point.date && point.date.getTime() === category.date.getTime();
}

/**
 * Lays out the visible series of an overlap layout in slots and layers.
 *
 * @param enabled              - Whether the chart draws an overlap layout.
 * @param seriesWithVisibility - Every series, with its index and whether it is visible.
 * @return The layout, or undefined when the chart is not an overlap layout.
 */
export function useOverlapSlots(
	enabled: boolean,
	seriesWithVisibility: ( SeriesEntry & { isVisible: boolean } )[]
): OverlapSlots | undefined {
	return useMemo( () => {
		if ( ! enabled ) {
			return undefined;
		}

		const placements = getOverlapPlacements( seriesWithVisibility.map( ( { series } ) => series ) );
		const entries = seriesWithVisibility
			.filter( ( { isVisible } ) => isVisible )
			.map( ( { series, index } ) => ( { series, index } ) )
			.sort( ( a, b ) => placements[ a.index ].layer - placements[ b.index ].layer );
		const placementByKey = new Map(
			entries.map( ( { series, index } ) => [ series.label, placements[ index ] ] )
		);
		const slotOf = ( key: string ): string => placementByKey.get( key )?.slot ?? PRIMARY_SLOT;
		const thicknessOf = ( key: string ): number => placementByKey.get( key )?.thickness ?? 1;
		const hasPrimaries = placements.some( ( { slot } ) => slot === PRIMARY_SLOT );
		const showsComparisons = entries.some(
			( { series } ) => slotOf( series.label ) === COMPARISON_SLOT
		);
		const slotKeys = [
			...( hasPrimaries ? [ PRIMARY_SLOT ] : [] ),
			...( showsComparisons ? [ COMPARISON_SLOT ] : [] ),
		];

		const stops = slotKeys.flatMap( slot => {
			const stop = entries
				.filter( ( { series } ) => slotOf( series.label ) === slot )
				.reduce< SeriesEntry | undefined >(
					( longest, entry ) =>
						longest && longest.series.data.length > entry.series.data.length ? longest : entry,
					undefined
				);
			return stop ? [ stop ] : [];
		} );

		return {
			entries,
			keys: entries.map( ( { series } ) => series.label ),
			slotKeys,
			slotOf,
			thicknessOf,
			stops,
			positions: getStopPositions( stops ),
		};
	}, [ enabled, seriesWithVisibility ] );
}

/**
 * Lists every data point of the stops, category by category.
 *
 * @param stops - The keyboard stops.
 * @return The positions, in keyboard order.
 */
function getStopPositions( stops: SeriesEntry[] ): StopPosition[] {
	const length = Math.max( 0, ...stops.map( ( { series } ) => series.data.length ) );
	const positions: StopPosition[] = [];

	for ( let dataPointIndex = 0; dataPointIndex < length; dataPointIndex++ ) {
		stops.forEach( ( { series }, stop ) => {
			if ( dataPointIndex < series.data.length ) {
				positions.push( { stop, dataPointIndex } );
			}
		} );
	}

	return positions;
}

/**
 * The slot a keyboard index selects, and every bar at its category.
 *
 * @param slots         - The overlap layout.
 * @param selectedIndex - The keyboard index into `slots.positions`.
 * @return The selected slot, or undefined when nothing is selected or drawn there.
 */
export function getSelectedSlot(
	slots: OverlapSlots | undefined,
	selectedIndex: number | undefined
): SelectedSlot | undefined {
	const position = selectedIndex === undefined ? undefined : slots?.positions[ selectedIndex ];

	if ( ! slots || ! position ) {
		return undefined;
	}

	const { dataPointIndex } = position;
	const stop = slots.stops[ position.stop ]?.series;
	const category = stop?.data[ dataPointIndex ] as DataPointDate | undefined;

	if ( ! stop || ! category ) {
		return undefined;
	}

	const slotKey = slots.slotOf( stop.label );
	const members = slots.entries.flatMap( ( { series } ) => {
		const datum = ( series.data as DataPointDate[] ).find( point =>
			isSameCategory( point, category )
		);
		return datum ? [ { key: series.label, datum } ] : [];
	} );
	const slotBars = members.filter(
		( { key, datum } ) => slots.slotOf( key ) === slotKey && isBarRendered( datum )
	);

	if ( ! slotBars.length ) {
		return undefined;
	}

	return {
		data: slotBars.map( ( { datum } ) => datum ),
		slotKey,
		thickness: Math.max( ...slotBars.map( ( { key } ) => slots.thicknessOf( key ) ) ),
		index: dataPointIndex,
		members,
	};
}
