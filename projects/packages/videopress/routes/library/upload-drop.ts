import type { FreeTierState } from '../../src/dashboard/hooks/use-free-tier';

// Fallback video extensions, used only when a dropped file carries no MIME
// type (some OS/browser combinations leave `File.type` empty). The primary
// check is the `video/*` MIME prefix — the same contract the header file
// picker enforces via `accept="video/*"` — so e.g. `.mov` (video/quicktime)
// is accepted. We deliberately don't read the server's
// `allowedVideoExtensions` here: it's exposed on the legacy
// `window.jetpackVideoPressInitialState` global, which the modernized
// dashboard doesn't define, so relying on it rejected every drop.
const FALLBACK_VIDEO_EXTENSIONS = [
	'3g2',
	'3gp',
	'avi',
	'm4v',
	'mkv',
	'mov',
	'mp4',
	'mpeg',
	'mpg',
	'ogv',
	'webm',
	'wmv',
];

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
 * Filter a dropped file set down to videos. When the browser reports a MIME
 * type, it is authoritative: the file qualifies only if it is `video/*` (the
 * same contract the header file picker enforces via `accept="video/*"`, so
 * `.mov` → video/quicktime is accepted, while a renamed PDF is not). Only when
 * the browser reports *no* MIME type does it fall back to the file extension.
 * Keeps the drop handler from trying to upload images, PDFs, etc.
 *
 * @param files - The files dropped onto the DropZone.
 * @return Only the files that look like videos.
 */
export function filterVideoFiles( files: File[] ): File[] {
	return files.filter( file => {
		// A reported MIME type is authoritative — don't let a video extension
		// override a non-video type (e.g. a `.mp4`-renamed `application/pdf`).
		if ( file.type ) {
			return file.type.startsWith( 'video/' );
		}
		const name = file.name.toLocaleLowerCase();
		return FALLBACK_VIDEO_EXTENSIONS.some( extension => name.endsWith( `.${ extension }` ) );
	} );
}

/**
 * Decide what a dropped file set should do, given the current free-tier
 * state. Pure so the filtering + plan-limit math can be tested in isolation
 * from the route component and the upload/notice side effects.
 *
 * @param files    - The raw files dropped onto the DropZone.
 * @param freeTier - The relevant free-tier facts from useFreeTier().
 * @return The drop decision: no videos, at the limit, or an upload plan.
 */
export function planVideoDrop( files: File[], freeTier: DropPlanFreeTier ): DropDecision {
	const videoFiles = filterVideoFiles( files );
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
