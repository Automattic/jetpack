/**
 * Skip engine for previewing an edit session on top of the original master.
 */
import type { EditSession } from './edit-session';

/**
 * What the player should do at the current position: nothing (both fields absent), seek, and/or
 * treat playback as ended.
 */
export interface PlaybackResolution {
	/** Position to seek to, in master-timeline ms. */
	seekTo?: number;
	/** True when the edited output has finished playing. */
	ended?: boolean;
}

/**
 * Resolve the playhead position against the session.
 *
 * @param currentMs          - Player position in ms (fractions are rounded).
 * @param session            - The edit session.
 * @param previewCutsEnabled - Whether cut skipping is active.
 * @return The action the player should take, if any.
 */
export function resolvePlayback(
	currentMs: number,
	session: EditSession,
	previewCutsEnabled: boolean
): PlaybackResolution {
	const ms = Math.max( session.trimStartMs, Math.round( currentMs ) );
	const { trimEndMs, cuts } = session;

	if ( ms >= trimEndMs ) {
		return ms > trimEndMs ? { ended: true, seekTo: trimEndMs } : { ended: true };
	}
	if ( ! previewCutsEnabled ) {
		return Math.round( currentMs ) < session.trimStartMs ? { seekTo: ms } : {};
	}

	// Session cuts are sorted and merged, but walk defensively in case a
	// hand-built session has touching cuts.
	let target = ms;
	let skipped = false;
	for ( const cut of cuts ) {
		if ( cut.startMs <= target && target < cut.endMs ) {
			target = cut.endMs;
			skipped = true;
		}
	}
	if ( ! skipped ) {
		return Math.round( currentMs ) < session.trimStartMs ? { seekTo: ms } : {};
	}
	if ( target >= trimEndMs ) {
		return { ended: true, seekTo: trimEndMs };
	}
	return { seekTo: target };
}
