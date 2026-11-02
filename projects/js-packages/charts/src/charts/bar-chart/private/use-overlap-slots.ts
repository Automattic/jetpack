import { useMemo } from 'react';
import { categoryKey, isSameCategory } from './category';
import { COMPARISON_SLOT, PRIMARY_SLOT, getOverlapPlacements } from './overlap-bars';
import { isBarRendered } from './value-domain';
import type { SelectedBar } from './selected-bar-ring';
import type { SlotMember } from './slot-tooltip-members';
import type { BarChartLayout, DataPointDate, SeriesData } from '../../../types';

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
 * Lays out the visible series in slots: overlap layers primaries and comparisons in two, stacked puts every primary in one.
 *
 * @param layout               - How the chart places its series in a category.
 * @param seriesWithVisibility - Every series, with its index and whether it is visible.
 * @return The slots, or undefined for a grouped layout.
 */
export function useOverlapSlots(
	layout: BarChartLayout,
	seriesWithVisibility: ( SeriesEntry & { isVisible: boolean } )[]
): OverlapSlots | undefined {
	return useMemo( () => {
		if ( layout === 'grouped' ) {
			return undefined;
		}

		const visible = seriesWithVisibility.filter( ( { isVisible } ) => isVisible );

		if ( layout === 'stacked' ) {
			// Bottom to top, so the top segment names each keyboard stop.
			const entries = visible
				.filter( ( { series } ) => series.options?.type !== 'comparison' )
				.map( ( { series, index } ) => ( { series, index } ) );
			const slotKeys = [ PRIMARY_SLOT ];
			const slotOf = () => PRIMARY_SLOT;
			return {
				entries,
				keys: entries.map( ( { series } ) => series.label ),
				slotKeys,
				slotOf,
				thicknessOf: () => 1,
				positions: getStopPositions( entries, slotKeys, slotOf ),
			};
		}
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
	}, [ layout, seriesWithVisibility ] );
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
