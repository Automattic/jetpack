import { DataContext, TooltipContext, useEventEmitter } from '@visx/xychart';
import { useCallback, useContext } from 'react';

/**
 * Find a category by its painted centre, including outer padding and reversed ranges.
 * @param data     - Registered series points.
 * @param accessor - Category accessor.
 * @param scale    - Rendered category band scale.
 * @param position - Pointer coordinate on the category axis.
 * @return Index of the nearest category, or -1 when none is registered.
 */
export function nearestBandIndex< Datum >(
	data: Datum[],
	accessor: ( datum: Datum ) => unknown,
	scale: ( ( value: unknown ) => number | undefined ) & { bandwidth: () => number },
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
 * @param root0      - Registered series selection.
 * @param root0.keys - Visible series keys.
 * @return No visual content.
 */
export function BandTooltip( { keys }: { keys: string[] } ) {
	const { xScale, yScale, dataRegistry, horizontal } = useContext( DataContext );
	const { showTooltip } = useContext( TooltipContext );
	const handlePointer = useCallback< NonNullable< Parameters< typeof useEventEmitter >[ 1 ] > >(
		params => {
			const point = params?.svgPoint;
			const scale = ( horizontal ? yScale : xScale ) as Parameters< typeof nearestBandIndex >[ 2 ];
			if ( ! point || ! scale?.bandwidth ) {
				return;
			}
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
				showTooltip( {
					key,
					datum,
					index,
					svgPoint: point,
					distanceX: Math.abs( Number( xScale?.( entry.xAccessor( datum ) ) ) - point.x ),
					distanceY: Math.abs( Number( yScale?.( entry.yAccessor( datum ) ) ) - point.y ),
				} );
			}
		},
		[ xScale, yScale, dataRegistry, horizontal, keys, showTooltip ]
	);
	useEventEmitter( 'pointermove', handlePointer );
	useEventEmitter( 'pointerdown', handlePointer );
	return null;
}
