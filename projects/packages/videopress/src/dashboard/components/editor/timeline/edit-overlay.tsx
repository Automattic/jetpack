/**
 * The edit-overlay layer: an absolutely-positioned sheet spanning all timeline tracks that
 * renders the trim shrouds/handles and the cut segments on top of them.
 */
import { useRef } from 'react';
import StudioEditorCutSegment from './cut-segment';
import StudioEditorTrimHandles from './trim-handles';
import type { HistoryAction } from '../../../../client/components/chapters-editor/state/history';
import type { EditSession, EditSessionAction } from '../state/edit-session';
import type { PointerEvent as ReactPointerEvent, ReactElement, RefObject } from 'react';

type Props = {
	scrollerEl?: HTMLElement | null;
	onGestureStart?: () => void;
	onGestureEnd?: () => void;
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
};

/**
 * The overlay sheet with trim and cut UI.
 *
 * @param props                - Component props.
 * @param props.onGestureStart - Pause playback for an edit gesture.
 * @param props.onGestureEnd   - Finish an edit gesture.
 * @param props.session        - The edit session.
 * @param props.currentMs      - Live playhead position in ms.
 * @param props.pxPerMs        - Scale from `getPxPerMs`.
 * @param props.scrollerEl     - Timeline viewport for drag scrolling.
 * @param props.contentRef     - The timeline's scaled content element.
 * @param props.dispatch       - Dispatch into the history-wrapped reducer.
 * @return The overlay element.
 */
export default function StudioEditorEditOverlay( {
	onGestureStart,
	onGestureEnd,
	session,
	currentMs,
	pxPerMs,
	contentRef,
	scrollerEl,
	dispatch,
}: Props ): ReactElement {
	const activePointerRef = useRef< number | null >( null );
	const endGesture = ( event: ReactPointerEvent< HTMLElement > ) => {
		if ( activePointerRef.current === event.pointerId ) {
			activePointerRef.current = null;
			onGestureEnd?.();
		}
	};

	return (
		<div
			className="vp-studio-timeline__overlay"
			data-testid="studio-timeline-overlay"
			onPointerDownCapture={ event => {
				if ( event.button === 0 && activePointerRef.current === null ) {
					activePointerRef.current = event.pointerId;
					onGestureStart?.();
				}
			} }
			onPointerUpCapture={ endGesture }
			onPointerCancelCapture={ endGesture }
			onLostPointerCaptureCapture={ endGesture }
		>
			<StudioEditorTrimHandles
				session={ session }
				pxPerMs={ pxPerMs }
				contentRef={ contentRef }
				dispatch={ dispatch }
			/>
			{ session.cuts.map( cut => (
				<StudioEditorCutSegment
					key={ cut.id }
					cut={ cut }
					scrollerEl={ scrollerEl }
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
