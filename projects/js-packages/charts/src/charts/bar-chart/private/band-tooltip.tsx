import { DataContext, TooltipContext, useEventEmitter } from '@visx/xychart';
import { useCallback, useContext, useMemo } from 'react';
import { createGroupScale } from './band-scale';
import type { BandScale } from './band-scale';
import type { BarChartProps } from '../bar-chart';

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
 * @param root0.keys          - Visible series keys.
 * @param root0.groupPadding  - Padding between grouped bars.
 * @param root0.withTooltips  - Whether pointer events update the tooltip.
 * @param root0.onPointerDown - Receives the corrected pointer-down datum.
 * @param root0.onPointerUp   - Receives the corrected pointer-up datum.
 * @return No visual content.
 */
export function BandTooltip( {
	keys,
	groupPadding,
	withTooltips,
	onPointerDown,
	onPointerUp,
}: { keys: string[]; groupPadding: number } & Pick<
	BarChartProps,
	'withTooltips' | 'onPointerDown' | 'onPointerUp'
> ) {
	const { xScale, yScale, dataRegistry, horizontal } = useContext( DataContext );
	const { showTooltip } = useContext( TooltipContext );
	const scale = ( horizontal ? yScale : xScale ) as BandScale | undefined;
	const bandwidth = scale?.bandwidth?.() ?? 0;
	const groupScale = useMemo(
		() => createGroupScale( keys, bandwidth, groupPadding ),
		[ keys, bandwidth, groupPadding ]
	);
	const getSelections = useCallback(
		( params: Parameters< PointerHandler >[ 0 ] ) => {
			const point = params?.svgPoint;
			if ( ! point || ! scale?.bandwidth ) {
				return [];
			}
			const selections: PointerSelection[] = [];
			for ( const key of keys ) {
				const entry = dataRegistry?.get( key );
				if ( ! entry ) {
					continue;
				}
				const accessor = horizontal ? entry.yAccessor : entry.xAccessor;
				const index = nearestBandIndex(
					entry.data,
					accessor,
					scale,
					horizontal ? point.y : point.x
				);
				if ( index < 0 ) {
					continue;
				}
				const datum = entry.data[ index ];
				const start = Number( scale( accessor( datum ) ) ) + Number( groupScale( key ) );
				const end = start + groupScale.step();
				const position = horizontal ? point.y : point.x;
				const distance =
					position >= start && position <= end ? 0 : Math.abs( position - ( start + end ) / 2 );
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
			return selections;
		},
		[ scale, dataRegistry, horizontal, keys, groupScale ]
	);
	const handlePointer = useCallback< PointerHandler >(
		params => {
			const selections = getSelections( params );
			if ( withTooltips && params?.event.type !== 'pointerup' ) {
				selections.forEach( showTooltip );
			}
			const callback = params?.event.type === 'pointerdown' ? onPointerDown : onPointerUp;
			if ( params?.event.type === 'pointermove' || ! callback ) {
				return;
			}
			const nearest = selections.reduce(
				( best, selection ) => {
					const distance = ( value: typeof selection ) =>
						Math.hypot( value.distanceX, value.distanceY );
					return ! best || distance( selection ) <= distance( best ) ? selection : best;
				},
				undefined as ( typeof selections )[ number ] | undefined
			);
			if ( nearest ) {
				callback( nearest );
			}
		},
		[ getSelections, withTooltips, showTooltip, onPointerDown, onPointerUp ]
	);
	useEventEmitter( 'pointermove', withTooltips ? handlePointer : undefined );
	useEventEmitter( 'pointerdown', handlePointer );
	useEventEmitter( 'pointerup', onPointerUp ? handlePointer : undefined );
	return null;
}
