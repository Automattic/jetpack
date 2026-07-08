/**
 * Skip engine for previewing an edit session on top of the original master.
 *
 * The player always plays the untouched master; on every time update the UI
 * asks this resolver whether the playhead needs to jump (skip a cut, snap
 * into the trim window) or whether playback of the edited output has ended.
 */
import type { EditSession } from './edit-session';

/**
 * What the player should do at the current position: nothing (both fields
 * absent), seek, and/or treat playback as ended.
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
 * Before the trim window: seek to its start. At or past the trim end: ended
 * (with a clamping seek when overshot). Inside a cut (when cut preview is
 * on): seek to the cut's end, or end playback when the cut runs into the
 * trim end.
 *
 * Trim boundaries are always enforced; `previewCutsEnabled` only toggles cut
 * skipping so the user can compare against the uncut window.
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
	const ms = Math.round( currentMs );
	const { trimStartMs, trimEndMs, cuts } = session;

	if ( ms < trimStartMs ) {
		return { seekTo: trimStartMs };
	}
	if ( ms >= trimEndMs ) {
		return ms > trimEndMs ? { ended: true, seekTo: trimEndMs } : { ended: true };
	}
	if ( ! previewCutsEnabled ) {
		return {};
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
		return {};
	}
	if ( target >= trimEndMs ) {
		return { ended: true, seekTo: trimEndMs };
	}
	return { seekTo: target };
}
