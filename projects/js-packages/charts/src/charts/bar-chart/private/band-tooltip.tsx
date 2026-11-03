import { DataContext, TooltipContext, useEventEmitter } from '@visx/xychart';
import { useCallback, useContext, useMemo } from 'react';
import { createGroupScale } from './band-scale';
import type { BandScale } from './band-scale';
import type { BarChartProps } from '../types';

type PointerHandler = NonNullable< Parameters< typeof useEventEmitter >[ 1 ] >;
type PointerSelection = Parameters< NonNullable< BarChartProps[ 'onPointerUp' ] > >[ 0 ];

/**
 * Find a category by its painted center, including outer padding and reversed ranges.
 * @param data     - Registered series points.
 * @param accessor - Category accessor.
 * @param scale    - Rendered category band scale.
 * @param position - Pointer coordinate on the category axis.
 * @return Index of the nearest category, or -1 when none is registered.
 */
export function nearestBandIndex< Datum >(
	data: Datum[],
	accessor: ( datum: Datum ) => unknown,
	scale: BandScale,
	position: number
): number {
	let nearest = -1;
	let distance = Infinity;
	data.forEach( ( datum, index ) => {
		const start = scale( accessor( datum ) );
		if ( start === undefined ) {
			return;
		}
		const candidate = Math.abs( start + scale.bandwidth() / 2 - position );
		if ( candidate < distance ) {
			distance = candidate;
			nearest = index;
		}
	} );
	return nearest;
}

/**
 * Correct visx's range-based band inversion, which omits outer padding.
 * @param root0               - Registered series selection.
 * @param root0.keys          - Visible series keys, back to front where bars overlap.
 * @param root0.slots         - Where series share slots: the slots of a category, in the order the band lays them out, and the slot each series sits in.
 * @param root0.groupPadding  - Padding between grouped bars.
 * @param root0.withTooltips  - Whether pointer events update the tooltip.
 * @param root0.onPointerDown - Receives the corrected pointer-down datum.
 * @param root0.onPointerUp   - Receives the corrected pointer-up datum.
 * @param root0.onPointerMove - Receives the corrected datum under a moving pointer.
 * @return No visual content.
 */
export function BandTooltip( {
	keys,
	slots,
	groupPadding,
	withTooltips,
	onPointerDown,
	onPointerUp,
	onPointerMove,
}: {
	keys: string[];
	slots?: { keys: string[]; slotOf: ( key: string ) => string };
	groupPadding: number;
	onPointerMove?: ( selection: PointerSelection ) => void;
} & Pick< BarChartProps, 'withTooltips' | 'onPointerDown' | 'onPointerUp' > ) {
	const { xScale, yScale, dataRegistry, horizontal } = useContext( DataContext );
	const { showTooltip, hideTooltip, updateTooltip } = useContext( TooltipContext );
	const scale = ( horizontal ? yScale : xScale ) as BandScale | undefined;
	const bandwidth = scale?.bandwidth?.() ?? 0;
	const groupScale = useMemo(
		() => createGroupScale( slots?.keys ?? keys, bandwidth, groupPadding ),
		[ slots, keys, bandwidth, groupPadding ]
	);
	const getSelections = useCallback(
		( params: Parameters< PointerHandler >[ 0 ] ) => {
			const point = params?.svgPoint;
			if ( ! point || ! scale?.bandwidth ) {
				return [];
			}
			const position = horizontal ? point.y : point.x;
			const selections: PointerSelection[] = [];
			const bands: number[] = [];
			for ( const key of keys ) {
				const entry = dataRegistry?.get( key );
				if ( ! entry ) {
					continue;
				}
				const accessor = horizontal ? entry.yAccessor : entry.xAccessor;
				const index = nearestBandIndex( entry.data, accessor, scale, position );
				if ( index < 0 ) {
					continue;
				}
				const datum = entry.data[ index ];
				const band = Number( scale( accessor( datum ) ) );
				const start = band + Number( groupScale( slots ? slots.slotOf( key ) : key ) );
				const end = start + groupScale.step();
				const distance =
					position >= start && position <= end ? 0 : Math.abs( position - ( start + end ) / 2 );
				bands.push( band );
				selections.push( {
					event: params.event,
					key,
					datum,
					index,
					svgPoint: point,
					distanceX: horizontal ? 0 : distance,
					distanceY: horizontal ? distance : 0,
				} );
			}
			if ( ! slots ) {
				return selections;
			}
			// A series without a datum at the hovered category must not lend the tooltip a neighbor's.
			const bandDistance = ( band: number ) => Math.abs( band + scale.bandwidth() / 2 - position );
			const hoveredBand = bands.reduce< number | undefined >(
				( best, band ) =>
					best === undefined || bandDistance( band ) < bandDistance( best ) ? band : best,
				undefined
			);
			return selections.filter( ( _, index ) => bands[ index ] === hoveredBand );
		},
		[ scale, dataRegistry, horizontal, keys, slots, groupScale ]
	);
	const handlePointer = useCallback< PointerHandler >(
		params => {
			const selections = getSelections( params );
			const nearest = selections.reduce(
				( best, selection ) => {
					const distance = ( value: typeof selection ) =>
						Math.hypot( value.distanceX, value.distanceY );
					return ! best || distance( selection ) <= distance( best ) ? selection : best;
				},
				undefined as ( typeof selections )[ number ] | undefined
			);
			if ( params?.event.type === 'pointermove' && nearest ) {
				onPointerMove?.( nearest );
			}
			if ( withTooltips && params?.event.type !== 'pointerup' ) {
				if ( slots ) {
					// visx merges each datum into the previous tooltip's, which would keep a bar the pointer has left.
					updateTooltip( state => ( { ...state, tooltipData: undefined } ) );
				}
				selections.forEach( showTooltip );
			}
			const callback = params?.event.type === 'pointerdown' ? onPointerDown : onPointerUp;
			if ( params?.event.type === 'pointermove' || ! callback ) {
				return;
			}
			if ( nearest ) {
				callback( nearest );
			}
		},
		[
			getSelections,
			withTooltips,
			slots,
			showTooltip,
			updateTooltip,
			onPointerDown,
			onPointerUp,
			onPointerMove,
		]
	);
	useEventEmitter( 'pointermove', withTooltips ? handlePointer : undefined );
	// Slotted bars subscribe to no events, so nothing else closes the tooltip when the pointer leaves.
	useEventEmitter( 'pointerout', withTooltips && slots ? hideTooltip : undefined );
	useEventEmitter( 'pointerdown', handlePointer );
	useEventEmitter( 'pointerup', onPointerUp ? handlePointer : undefined );
	return null;
}
