import { useMemo } from 'react';
import { COMPARISON_SLOT, PRIMARY_SLOT, getOverlapPlacements } from './overlap-bars';
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
	/** The keyboard stops: every category a slot draws a bar at, category by category. */
	positions: StopPosition[];
};

/** A slot at one category, named by its front-most bar there. */
export type StopPosition = {
	slotKey: string;
	key: string;
	datum: DataPointDate;
	dataPointIndex: number;
};

export type SelectedSlot = SelectedBar & { members: SlotMember[] };

/**
 * Whether two data points sit at the same category: the same label, or the same date.
 *
 * @param point    - A data point.
 * @param category - The data point naming the category.
 * @return Whether `point` is at `category`.
 */
export function isSameCategory( point: DataPointDate, category: DataPointDate ): boolean {
	// An empty label falls back to the date, as the band axis's accessor does.
	return category.label
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

		const visible = seriesWithVisibility.filter( ( { isVisible } ) => isVisible );
		const placements = getOverlapPlacements( visible.map( ( { series } ) => series ) );
		const placed = visible
			.map( ( { series, index }, position ) => ( {
				entry: { series, index },
				placement: placements[ position ],
			} ) )
			.sort( ( a, b ) => a.placement.layer - b.placement.layer );
		const entries = placed.map( ( { entry } ) => entry );
		const placementByKey = new Map(
			placed.map( ( { entry, placement } ) => [ entry.series.label, placement ] )
		);
		const slotOf = ( key: string ): string => placementByKey.get( key )?.slot ?? PRIMARY_SLOT;
		const thicknessOf = ( key: string ): number => placementByKey.get( key )?.thickness ?? 1;
		const hasPrimaries = seriesWithVisibility.some(
			( { series } ) => series.options?.type !== 'comparison'
		);
		const showsComparisons = entries.some(
			( { series } ) => slotOf( series.label ) === COMPARISON_SLOT
		);
		const slotKeys = [
			...( hasPrimaries ? [ PRIMARY_SLOT ] : [] ),
			...( showsComparisons ? [ COMPARISON_SLOT ] : [] ),
		];

		return {
			entries,
			keys: entries.map( ( { series } ) => series.label ),
			slotKeys,
			slotOf,
			thicknessOf,
			positions: getStopPositions( entries, slotKeys, slotOf ),
		};
	}, [ enabled, seriesWithVisibility ] );
}

/**
 * The category a data point sits at, as a key two points share when `isSameCategory` holds.
 *
 * @param point - A data point.
 * @return The category key.
 */
function categoryKey( point: DataPointDate ): string {
	return point.label ? `label:${ point.label }` : `date:${ point.date?.getTime() }`;
}

/**
 * Lists a stop for every slot at every category that slot draws a bar at, category by category.
 *
 * @param entries  - The visible series, back to front.
 * @param slotKeys - The slots, in band order.
 * @param slotOf   - The slot a series sits in.
 * @return The positions, in keyboard order.
 */
function getStopPositions(
	entries: SeriesEntry[],
	slotKeys: string[],
	slotOf: ( key: string ) => string
): StopPosition[] {
	const categories = new Map< string, Map< string, StopPosition > >();

	entries.forEach( ( { series } ) => {
		( series.data as DataPointDate[] ).forEach( ( datum, dataPointIndex ) => {
			const key = categoryKey( datum );
			// A category with no reading still takes its place in the order, as it keeps its band.
			const slots = categories.get( key ) ?? new Map< string, StopPosition >();
			categories.set( key, slots );
			if ( ! isBarRendered( datum ) ) {
				return;
			}
			const slotKey = slotOf( series.label );
			// Later entries are in front, so the last one at a category names its slot.
			slots.set( slotKey, { slotKey, key: series.label, datum, dataPointIndex } );
		} );
	} );

	const ordered = [ ...categories.values() ].filter( slots => slots.size > 0 );
	const allDated = ordered.every( slots =>
		[ ...slots.values() ].every( ( { datum } ) => datum.label == null && datum.date )
	);
	if ( allDated ) {
		const time = ( slots: Map< string, StopPosition > ) =>
			[ ...slots.values() ][ 0 ].datum.date?.getTime() ?? 0;
		ordered.sort( ( a, b ) => time( a ) - time( b ) );
	}

	return ordered.flatMap( slots =>
		slotKeys.flatMap( slotKey => {
			const position = slots.get( slotKey );
			return position ? [ position ] : [];
		} )
	);
}

/**
 * Every bar at a category, each with its own data point index, the keyboard stop last.
 *
 * @param entries  - The visible series.
 * @param category - The data point naming the category.
 * @param stopKey  - The series the keyboard stop is on.
 * @return The category's bars; the last one shown becomes the tooltip's nearest datum.
 */
export function membersAt(
	entries: SeriesEntry[],
	category: DataPointDate,
	stopKey: string
): SlotMember[] {
	const members = entries.flatMap( ( { series } ) => {
		const index = ( series.data as DataPointDate[] ).findIndex( point =>
			isSameCategory( point, category )
		);
		return index === -1
			? []
			: [ { key: series.label, datum: series.data[ index ] as DataPointDate, index } ];
	} );

	return [
		...members.filter( ( { key } ) => key !== stopKey ),
		...members.filter( ( { key } ) => key === stopKey ),
	];
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

	const { slotKey, key: stopKey, datum: category } = position;
	const members = membersAt( slots.entries, category, stopKey );
	const slotBars = members.filter(
		( { key, datum } ) => isBarRendered( datum ) && slots.slotOf( key ) === slotKey
	);

	return {
		data: slotBars.map( ( { datum } ) => datum ),
		slotKey,
		thickness: Math.max( ...slotBars.map( ( { key } ) => slots.thicknessOf( key ) ) ),
		members,
	};
}
