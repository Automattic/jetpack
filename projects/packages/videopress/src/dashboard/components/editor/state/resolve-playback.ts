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

	let playbackEndMs = trimEndMs;
	if ( previewCutsEnabled ) {
		for ( let i = cuts.length - 1; i >= 0; i-- ) {
			if ( cuts[ i ].endMs >= playbackEndMs && cuts[ i ].startMs < playbackEndMs ) {
				playbackEndMs = cuts[ i ].startMs;
			}
		}
	}
	// Trim and cut ends are exclusive: keep the stopped preview inside the retained footage.
	const stopMs =
		playbackEndMs < session.durationMs
			? Math.max( session.trimStartMs, playbackEndMs - 1 )
			: playbackEndMs;
	if ( ms >= stopMs ) {
		return ms === stopMs ? { ended: true } : { ended: true, seekTo: stopMs };
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
	return { seekTo: target };
}
