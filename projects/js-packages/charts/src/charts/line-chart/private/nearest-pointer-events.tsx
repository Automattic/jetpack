import { bisector } from '@visx/vendor/d3-array';
import { DataContext, useEventEmitter } from '@visx/xychart';
import { useCallback, useContext, useMemo } from 'react';
import type { EventHandlerParams } from '@visx/xychart';

type EmittedPointer = Parameters< NonNullable< Parameters< typeof useEventEmitter >[ 1 ] > >[ 0 ];
type PointerParams = EventHandlerParams< object >;
type PointerHandler = ( params: PointerParams ) => void;
type Scale = ( ( value: unknown ) => unknown ) & { invert?: ( position: number ) => unknown };
type Candidate = { params: PointerParams; isMissing: boolean };

/**
 * Find the datum nearest a pointer along x, in one series sorted by x.
 *
 * @param data      - The series' registered data, in ascending x order.
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
	const indexes =
		typeof xScale.invert === 'function'
			? [ bisector( xAccessor ).left( data, xScale.invert( x ) ) ].flatMap( index => [
					index - 1,
					index,
				] )
			: data.map( ( _datum, index ) => index );

	return indexes
		.filter( index => index >= 0 && index < data.length )
		.reduce(
			( best, index ) => {
				const distance = Math.abs( Number( xScale( xAccessor( data[ index ] ) ) ) - x );
				return distance < best.distance ? { index, distance } : best;
			},
			{ index: -1, distance: Infinity }
		);
}

/**
 * Pick the candidate to report: the closest placed reading, else the closest bucket with no reading along x.
 *
 * @param candidates - One candidate per series.
 * @return The chosen candidate's params, or undefined when there are none.
 */
function pickNearest( candidates: Candidate[] ): PointerParams | undefined {
	const placed = candidates
		.map( ( { params } ) => params )
		.filter( params => Number.isFinite( params.distanceY ) );
	const missing = candidates
		.filter( ( { isMissing } ) => isMissing )
		.map( ( { params } ) => params );
	// Same metric as visx's TooltipProvider, so a callback names the datum the tooltip shows.
	const distance = ( params: PointerParams ) =>
		placed.length
			? Math.hypot( params.distanceX ?? 0, params.distanceY ?? 0 )
			: ( params.distanceX ?? 0 );

	return ( placed.length ? placed : missing ).reduce< PointerParams | undefined >(
		( best, params ) => ( ! best || distance( params ) < distance( best ) ? params : best ),
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
				const value = entry.yAccessor( datum );
				candidates.push( {
					params: {
						event: params.event,
						svgPoint: point,
						key,
						datum,
						index,
						distanceX: distance,
						distanceY: Math.abs( Number( ( yScale as Scale )( value ) ) - point.y ),
					},
					isMissing: value == null,
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
