import type { FreeTierState } from '../../src/dashboard/hooks/use-free-tier';

// Fallback accepted-upload extensions, used only when the server-provided
// allow-list is absent (unit tests, or a render before the initial state is
// inlined). Mirrors the server's `Admin_UI::get_allowed_video_extensions()`
// keys so behaviour matches the backend even on the fallback path. The live
// list is read from `JPVIDEOPRESS_INITIAL_STATE.allowedVideoExtensions`.
const FALLBACK_VIDEO_EXTENSIONS = [
	'3g2',
	'3gp',
	'3gp2',
	'3gpp',
	'avi',
	'm4v',
	'mov',
	'mp4',
	'mpe',
	'mpeg',
	'mpg',
	'ogv',
	'wmv',
];

/**
 * The set of accepted upload extensions, sourced from the server's
 * authoritative allow-list (`Admin_UI::get_allowed_video_extensions()`, inlined
 * as `JPVIDEOPRESS_INITIAL_STATE.allowedVideoExtensions`). Falls back to the
 * static list when the initial state isn't present (tests / pre-hydration).
 * Read lazily so it always reflects the current initial state.
 *
 * @return Lower-cased accepted extensions (without the leading dot).
 */
function getAllowedExtensions(): Set< string > {
	const map =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
			? JPVIDEOPRESS_INITIAL_STATE?.allowedVideoExtensions
			: undefined;
	const extensions =
		map && Object.keys( map ).length ? Object.keys( map ) : FALLBACK_VIDEO_EXTENSIONS;
	return new Set( extensions.map( extension => extension.toLowerCase() ) );
}

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
 * Filter a dropped file set down to the video types the VideoPress backend
 * accepts. A file qualifies when its extension is in the server's allow-list
 * (so we accept exactly what the backend supports — e.g. `.mov`, but not
 * `.webm`, rather than guessing client-side). A reported MIME type is also
 * required to be `video/*`, so a non-video file renamed to a video extension
 * (e.g. a `.mp4`-renamed PDF) is rejected. Keeps the drop handler from trying
 * to upload images, PDFs, or unsupported video containers.
 *
 * @param files - The files dropped onto the DropZone.
 * @return Only the files the backend accepts.
 */
export function filterVideoFiles( files: File[] ): File[] {
	const allowed = getAllowedExtensions();
	return files.filter( file => {
		// A reported MIME type must be a video type — blocks a non-video file
		// (e.g. application/pdf) renamed to a video extension.
		if ( file.type && ! file.type.startsWith( 'video/' ) ) {
			return false;
		}
		const name = file.name.toLowerCase();
		const dot = name.lastIndexOf( '.' );
		const extension = dot === -1 ? '' : name.slice( dot + 1 );
		return allowed.has( extension );
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
