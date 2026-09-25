/**
 * Shared tick positions for the timeline's ruler labels and gridlines.
 *
 * One labelled tick per adaptive step ({@link pickRulerStep}) across the
 * master duration, so labels keep readable spacing at every zoom level. The
 * ruler track and the shell's gridline layer both consume this hook with the
 * same `pxPerMs`, which is what keeps a gridline under every label instead
 * of two independently drifting sets of verticals.
 */
import { useMemo } from 'react';
import { pickRulerStep } from '../state/time-utils';

/**
 * Compute the tick times for a duration at a scale.
 *
 * @param durationMs - Master duration in ms.
 * @param pxPerMs    - Scale from `getPxPerMs`.
 * @return Tick positions in ms; empty without a usable scale or duration.
 */
export function useRulerTicks( durationMs: number, pxPerMs: number ): number[] {
	return useMemo( () => {
		if ( durationMs <= 0 || pxPerMs <= 0 ) {
			return [];
		}
		const step = pickRulerStep( pxPerMs );
		const result: number[] = [];
		for ( let ms = 0; ms <= durationMs; ms += step ) {
			result.push( ms );
		}
		return result;
	}, [ durationMs, pxPerMs ] );
}
