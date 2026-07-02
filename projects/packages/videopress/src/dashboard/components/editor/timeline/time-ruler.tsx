/**
 * Time ruler track for the Studio editor timeline.
 *
 * Renders labelled ticks at an adaptive step ({@link pickRulerStep}) so labels
 * keep readable spacing at every zoom level. Purely presentational — pointer
 * handling (scrubbing) lives on the timeline's content wrapper.
 */
import { useMemo } from 'react';
import { formatTimecode, msToPx, pickRulerStep } from '../state/time-utils';
import type { ReactElement } from 'react';

type Props = {
	/** Master duration in ms. */
	durationMs: number;
	/** Scale from `getPxPerMs`. */
	pxPerMs: number;
};

/**
 * The ruler track: one labelled tick per step across the master duration.
 *
 * @param props            - Component props.
 * @param props.durationMs - Master duration in ms.
 * @param props.pxPerMs    - Scale from `getPxPerMs`.
 * @return The ruler element.
 */
export default function StudioEditorTimeRuler( { durationMs, pxPerMs }: Props ): ReactElement {
	const ticks = useMemo( () => {
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

	return (
		<div className="vp-studio-timeline__ruler" data-testid="studio-timeline-ruler">
			{ ticks.map( ms => (
				<div
					key={ ms }
					className="vp-studio-timeline__ruler-tick"
					data-testid="studio-timeline-ruler-tick"
					style={ { transform: `translateX(${ msToPx( ms, pxPerMs ) }px)` } }
				>
					<span className="vp-studio-timeline__ruler-label">{ formatTimecode( ms ) }</span>
				</div>
			) ) }
		</div>
	);
}
