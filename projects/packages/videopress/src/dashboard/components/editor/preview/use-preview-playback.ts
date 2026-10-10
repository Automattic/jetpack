import { usePreviewPlayback as useMediaPlayback } from '../../../../client/components/chapters-editor/preview/use-preview-playback';
import { resolvePlayback } from '../state/resolve-playback';
import type { EditSession } from '../state/edit-session';

/**
 * Preview edits on the original timeline while allowing unrestricted paused seeks.
 *
 * @param session        - The edits to preview.
 * @param videoElementId - The preview element to recover after a router ref handoff.
 * @return Playback state and transport controls.
 */
export function usePreviewPlayback( session: EditSession, videoElementId?: string ) {
	return useMediaPlayback( {
		videoElementId,
		fallbackDurationMs: session.durationMs,
		restartMs: session.trimStartMs,
		resolvePlayback: ms => resolvePlayback( ms, session, true ),
	} );
}
