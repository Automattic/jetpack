/**
 * The edit-overlay layer: an absolutely-positioned sheet spanning all
 * timeline tracks that renders the trim shrouds/handles and the cut segments
 * on top of them.
 *
 * The layer itself is pointer-transparent (`pointer-events: none` in CSS) so
 * clicks on empty areas fall through to the timeline's scrub surface; only
 * the interactive children (handles, cut bodies, remove buttons) re-enable
 * pointer events.
 */
import StudioEditorCutSegment from './cut-segment';
import StudioEditorTrimHandles from './trim-handles';
import type { EditSession, EditSessionAction } from '../state/edit-session';
import type { HistoryAction } from '../state/history';
import type { ReactElement, RefObject } from 'react';

type Props = {
	/** The edit session. */
	session: EditSession;
	/** Live playhead position in master-timeline ms. */
	currentMs: number;
	/** Scale from `getPxPerMs`. */
	pxPerMs: number;
	/** The timeline's scaled content element, for pointer→ms math. */
	contentRef: RefObject< HTMLElement | null >;
	/** Dispatch into the history-wrapped session reducer. */
	dispatch: ( action: HistoryAction< EditSessionAction > ) => void;
	/** Seek the preview player to a master-timeline ms. */
	onSeek: ( ms: number ) => void;
};

/**
 * The overlay sheet with trim and cut UI.
 *
 * @param props            - Component props.
 * @param props.session    - The edit session.
 * @param props.currentMs  - Live playhead position in ms.
 * @param props.pxPerMs    - Scale from `getPxPerMs`.
 * @param props.contentRef - The timeline's scaled content element.
 * @param props.dispatch   - Dispatch into the history-wrapped reducer.
 * @param props.onSeek     - Seek the preview player.
 * @return The overlay element.
 */
export default function StudioEditorEditOverlay( {
	session,
	currentMs,
	pxPerMs,
	contentRef,
	dispatch,
	onSeek,
}: Props ): ReactElement {
	return (
		<div className="vp-studio-timeline__overlay" data-testid="studio-timeline-overlay">
			<StudioEditorTrimHandles
				session={ session }
				pxPerMs={ pxPerMs }
				contentRef={ contentRef }
				dispatch={ dispatch }
				onSeek={ onSeek }
			/>
			{ session.cuts.map( cut => (
				<StudioEditorCutSegment
					key={ cut.id }
					cut={ cut }
					session={ session }
					currentMs={ currentMs }
					pxPerMs={ pxPerMs }
					contentRef={ contentRef }
					dispatch={ dispatch }
				/>
			) ) }
		</div>
	);
}
