/**
 * The chapter-segments track for the Chapters tool timeline: one segment per
 * chapter, spanning its start to the next chapter's start (the last runs to
 * the video end), with alternating fills and the selected chapter tinted.
 *
 * Pointer-down on a segment selects its chapter and deliberately does NOT
 * stop propagation: the same press bubbles to the shell's scrub surface, so
 * clicking a segment both selects it and scrubs the playhead to the click
 * (dragging keeps scrubbing) — "click = select + scrub" per the design.
 * Segments are presentation + pointer affordances only, like the trim tool's
 * cut bodies; the rows list below the strip is the accessible (keyboard/AT)
 * surface for the same operations.
 */
import { msToPx } from '../state/time-utils';
import type { ChaptersSession, ChaptersSessionAction } from '../state/chapters-session';
import type { HistoryAction } from '../state/history';
import type { ReactElement } from 'react';

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
export default function StudioChapterTrack( { session, pxPerMs, dispatch }: Props ): ReactElement {
	const { chapters, durationMs, selectedId } = session;

	return (
		<div className="vp-studio-chapters__track">
			{ chapters.map( ( chapter, index ) => {
				const endMs = index === chapters.length - 1 ? durationMs : chapters[ index + 1 ].startMs;
				const leftPx = msToPx( chapter.startMs, pxPerMs );
				const widthPx = Math.max( 0, msToPx( endMs, pxPerMs ) - leftPx );
				const classes = [
					'vp-studio-chapters__segment',
					index % 2 === 1 ? 'vp-studio-chapters__segment--alt' : '',
					chapter.id === selectedId ? 'vp-studio-chapters__segment--selected' : '',
				]
					.filter( Boolean )
					.join( ' ' );
				return (
					<div
						key={ chapter.id }
						className={ classes }
						data-testid={ `studio-chapters-segment-${ chapter.id }` }
						style={ { left: `${ leftPx }px`, width: `${ widthPx }px` } }
						onPointerDown={ () => dispatch( { type: 'SELECT', id: chapter.id } ) }
					>
						<span className="vp-studio-chapters__segment-title">{ chapter.title }</span>
					</div>
				);
			} ) }
		</div>
	);
}
