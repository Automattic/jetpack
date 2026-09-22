import { DataContext, useEventEmitter } from '@visx/xychart';
import { useCallback, useContext, useMemo } from 'react';
import type { EventHandlerParams } from '@visx/xychart';

type EmittedPointer = Parameters< NonNullable< Parameters< typeof useEventEmitter >[ 1 ] > >[ 0 ];
type PointerHandler = ( params: EventHandlerParams< object > ) => void;
type Scale = ( value: unknown ) => unknown;
type Candidate = EventHandlerParams< object >;

/**
 * Find the datum nearest a pointer along x, in one series.
 *
 * @param data      - The series' registered data.
 * @param xAccessor - Reads a datum's x value.
 * @param xScale    - The chart's x scale.
 * @param x         - Pointer x in SVG coordinates.
 * @return Index of the nearest datum and its distance, or index -1 when none has a position.
 */
function nearestByX(
	data: object[],
	xAccessor: ( datum: object ) => unknown,
	xScale: Scale,
	x: number
): { index: number; distance: number } {
	let index = -1;
	let distance = Infinity;
	data.forEach( ( datum, candidateIndex ) => {
		const candidate = Math.abs( Number( xScale( xAccessor( datum ) ) ) - x );
		if ( candidate < distance ) {
			distance = candidate;
			index = candidateIndex;
		}
	} );
	return { index, distance };
}

/**
 * Pick the candidate to report: the closest with a reading, else the closest along x.
 *
 * @param candidates - One candidate per series; a bucket with no reading has a NaN `distanceY`.
 * @return The chosen candidate, or undefined when there are none.
 */
function pickNearest( candidates: Candidate[] ): Candidate | undefined {
	const withReading = candidates.filter( candidate => Number.isFinite( candidate.distanceY ) );
	const pool = withReading.length ? withReading : candidates;
	const distance = ( candidate: Candidate ) =>
		withReading.length
			? Math.hypot( candidate.distanceX ?? 0, candidate.distanceY ?? 0 )
			: ( candidate.distanceX ?? 0 );
	return pool.reduce< Candidate | undefined >(
		( best, candidate ) =>
			! best || distance( candidate ) < distance( best ) ? candidate : best,
		undefined
	);
}

/**
 * Report pointer events at the nearest datum, including a bucket with no reading.
 *
 * visx's own nearest search measures y distance too, which is NaN for a null value, so a pointer
 * over a bucket where no series has a reading fires no event at all.
 *
 * @param props               - Handlers to call.
 * @param props.onPointerDown - Receives the nearest datum on pointer down.
 * @param props.onPointerMove - Receives the nearest datum on pointer move.
 * @param props.onPointerUp   - Receives the nearest datum on pointer up.
 * @return No visual content.
 */
export function NearestPointerEvents( {
	onPointerDown,
	onPointerMove,
	onPointerUp,
}: {
	onPointerDown?: PointerHandler;
	onPointerMove?: PointerHandler;
	onPointerUp?: PointerHandler;
} ) {
	const { xScale, yScale, dataRegistry } = useContext( DataContext );

	const findNearest = useCallback(
		( params: EmittedPointer ) => {
			const point = params?.svgPoint;
			if ( ! point || ! xScale || ! yScale || ! dataRegistry ) {
				return undefined;
			}
			const candidates: Candidate[] = [];
			for ( const key of dataRegistry.keys() ) {
				const entry = dataRegistry.get( key );
				if ( ! entry ) {
					continue;
				}
				const { index, distance } = nearestByX(
					entry.data,
					entry.xAccessor,
					xScale as Scale,
					point.x
				);
				if ( index < 0 ) {
					continue;
				}
				const datum = entry.data[ index ];
				candidates.push( {
					event: params.event,
					svgPoint: point,
					key,
					datum,
					index,
					distanceX: distance,
					distanceY: Math.abs(
						Number( ( yScale as Scale )( entry.yAccessor( datum ) ) ) - point.y
					),
				} );
			}
			return pickNearest( candidates );
		},
		[ xScale, yScale, dataRegistry ]
	);

	const handlers = useMemo( () => {
		const report = ( handler?: PointerHandler ) =>
			handler &&
			( ( params: EmittedPointer ) => {
				const nearest = findNearest( params );
				if ( nearest ) {
					handler( nearest );
				}
			} );
		return {
			pointerdown: report( onPointerDown ),
			pointermove: report( onPointerMove ),
			pointerup: report( onPointerUp ),
		};
	}, [ findNearest, onPointerDown, onPointerMove, onPointerUp ] );

	useEventEmitter( 'pointerdown', handlers.pointerdown );
	useEventEmitter( 'pointermove', handlers.pointermove );
	useEventEmitter( 'pointerup', handlers.pointerup );
	return null;
}
