import { filterVideoFiles } from '../../src/dashboard/components/upload-dropzone/video-files';
import type { FreeTierState } from '../../src/dashboard/hooks/use-free-tier';

// The file-type filter this builds on moved next to the shared UploadDropzone
// (components/upload-dropzone/video-files) once /upload and Home needed to
// reject the same files: a route module can't be imported from another route's
// bundle. What stays here is the Library's plan arithmetic on top of it.

// Free-tier facts the drop decision needs — the subset of `FreeTierState`
// consumed when deciding what a drop is allowed to upload. Derived via `Pick`
// (a type-only import, so this stays a pure, hook-free module) so it tracks
// `FreeTierState` automatically instead of drifting from it. Note the absence
// of `isAtLimit`: the decision derives the cap from these primitives rather
// than trusting that flag, so an unlimited plan can never be treated as capped.
export type DropPlanFreeTier = Pick<
	FreeTierState,
	'isFree' | 'isUnlimited' | 'limit' | 'videoCount'
>;

// Outcome of inspecting a drop. The component maps each `kind` to a
// (translated) notice and/or kicks off uploads; keeping i18n out of here
// makes the branching logic unit-testable without asserting on copy.
export type DropDecision =
	| { kind: 'no-videos' }
	| { kind: 'at-limit' }
	| { kind: 'ok'; toUpload: File[]; skipped: number };

/**
 * Decide what a dropped file set should do, given the current free-tier
 * state. Pure so the filtering + plan-limit math can be tested in isolation
 * from the route component and the upload/notice side effects.
 *
 * Async because the file filter reads each file's leading bytes to verify the
 * container (a `.txt` renamed `.mp4` reports `video/mp4` in Chromium, so the
 * MIME type cannot settle it) — see components/upload-dropzone/video-files.
 *
 * @param files    - The raw files dropped onto the DropZone.
 * @param freeTier - The relevant free-tier facts from useFreeTier().
 * @return The drop decision: no videos, at the limit, or an upload plan.
 */
export async function planVideoDrop(
	files: File[],
	freeTier: DropPlanFreeTier
): Promise< DropDecision > {
	// Deliberately ahead of the plan-limit branch below: a file that isn't a
	// video must be told so whatever the plan state, or the answer to "why was
	// this refused" becomes "you're out of videos", which is the wrong fact.
	const videoFiles = await filterVideoFiles( files );
	if ( videoFiles.length === 0 ) {
		return { kind: 'no-videos' };
	}

	// Only the free, non-unlimited tier caps how many videos can be hosted;
	// paid and grandfathered-unlimited plans take everything. Deriving the cap
	// from these primitives (rather than trusting a precomputed `isAtLimit`)
	// guarantees an unlimited plan is never treated as capped.
	const isCapped = freeTier.isFree && ! freeTier.isUnlimited;
	if ( ! isCapped ) {
		return { kind: 'ok', toUpload: videoFiles, skipped: 0 };
	}

	const remaining = Math.max( 0, freeTier.limit - freeTier.videoCount );
	if ( remaining === 0 ) {
		return { kind: 'at-limit' };
	}

	const toUpload = videoFiles.slice( 0, remaining );
	return { kind: 'ok', toUpload, skipped: videoFiles.length - toUpload.length };
}
