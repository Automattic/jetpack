/**
 * The chapter-segments track for the Chapters tool timeline: one segment per
 * chapter, spanning its start to the next chapter's start (the last runs to
 * the video end), with alternating fills and the selected chapter tinted.
 *
 * Pointer-down on a segment selects its chapter and deliberately does NOT
 * stop propagation: the same press bubbles to the shell's scrub surface, so
 * clicking a segment both selects it and scrubs the playhead to the click
 * (dragging keeps scrubbing) — "click = select + scrub" per the design.
 * Segments are presentation + pointer affordances only; the rows list below
 * the strip is the accessible (keyboard/AT) surface for the same
 * operations.
 */
import { msToPx } from '../state/time-utils';
import type { ChaptersSession, ChaptersSessionAction } from '../state/chapters-session';
import type { HistoryAction } from '../state/history';
import type { ReactElement } from 'react';

/**
 * Floor for a segment's rendered width, matching the marker bar
 * ($vp-chapters-marker-bar-width). Loaded descriptions can repeat a
 * timestamp — LOAD reflects the description as-is — which spans a segment
 * across zero time; at 0px it would be invisible AND unclickable while
 * still occupying a row below. A 4px sliver reads as degenerate, which is
 * the truth, and stays selectable so it can be fixed.
 */
const MIN_SEGMENT_WIDTH_PX = 4;

type Props = {
	/** The chapters session. */
	session: ChaptersSession;
	/** Scale from `getPxPerMs`. */
	pxPerMs: number;
	/** Dispatch into the history-wrapped chapters reducer. */
	dispatch: ( action: HistoryAction< ChaptersSessionAction > ) => void;
};

/**
 * The chapter-segments track.
 *
 * @param props          - Component props.
 * @param props.session  - The chapters session.
 * @param props.pxPerMs  - Scale from `getPxPerMs`.
 * @param props.dispatch - Dispatch into the history-wrapped reducer.
 * @return The track element.
 */
export default function ChapterTrack( { session, pxPerMs, dispatch }: Props ): ReactElement {
	const { chapters, durationMs, selectedId } = session;

	return (
		<div className="vp-chapters__track">
			{ chapters.map( ( chapter, index ) => {
				const endMs = index === chapters.length - 1 ? durationMs : chapters[ index + 1 ].startMs;
				const leftPx = msToPx( chapter.startMs, pxPerMs );
				const widthPx = Math.max( MIN_SEGMENT_WIDTH_PX, msToPx( endMs, pxPerMs ) - leftPx );
				const classes = [
					'vp-chapters__segment',
					index % 2 === 1 ? 'vp-chapters__segment--alt' : '',
					chapter.id === selectedId ? 'vp-chapters__segment--selected' : '',
				]
					.filter( Boolean )
					.join( ' ' );
				return (
					<div
						key={ chapter.id }
						className={ classes }
						data-testid={ `chapters-segment-${ chapter.id }` }
						style={ { left: `${ leftPx }px`, width: `${ widthPx }px` } }
						onPointerDown={ () => dispatch( { type: 'SELECT', id: chapter.id } ) }
					>
						<span className="vp-chapters__segment-title">{ chapter.title }</span>
					</div>
				);
			} ) }
		</div>
	);
}
