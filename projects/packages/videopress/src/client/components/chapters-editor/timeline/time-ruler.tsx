/**
 * Time ruler track for the chapters editor timeline.
 *
 * Renders a mono label at each adaptive tick ({@link useRulerTicks});
 * the matching full-height gridlines are drawn by the timeline shell from
 * the same tick positions. Purely presentational — pointer handling
 * (scrubbing) lives on the timeline's content wrapper.
 */
import { formatTimecode, msToPx } from '../state/time-utils';
import { useRulerTicks } from './use-ruler-ticks';
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
export default function TimeRuler( { durationMs, pxPerMs }: Props ): ReactElement {
	const ticks = useRulerTicks( durationMs, pxPerMs );

	return (
		<div className="vp-chapters-timeline__ruler" data-testid="chapters-timeline-ruler">
			{ ticks.map( ms => (
				<div
					key={ ms }
					className="vp-chapters-timeline__ruler-tick"
					data-testid="chapters-timeline-ruler-tick"
					style={ { transform: `translateX(${ msToPx( ms, pxPerMs ) }px)` } }
				>
					<span className="vp-chapters-timeline__ruler-label">{ formatTimecode( ms ) }</span>
				</div>
			) ) }
		</div>
	);
}
