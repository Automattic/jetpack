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

// Free-tier facts the drop decision needs. Mirrors the subset of
// `FreeTierState` (use-free-tier.ts) consumed when deciding what a drop is
// allowed to upload.
export type DropPlanFreeTier = {
	isAtLimit: boolean;
	isFree: boolean;
	isUnlimited: boolean;
	limit: number;
	videoCount: number;
};

// Outcome of inspecting a drop. The component maps each `kind` to a
// (translated) notice and/or kicks off uploads; keeping i18n out of here
// makes the branching logic unit-testable without asserting on copy.
export type DropDecision =
	| { kind: 'no-videos' }
	| { kind: 'at-limit' }
	| { kind: 'ok'; toUpload: File[]; skipped: number };

/**
 * Filter a dropped file set down to videos. A file qualifies when its MIME
 * type is `video/*` (covers `.mov` → video/quicktime, `.mp4`, `.webm`, …) or,
 * when the browser reports no MIME type, when its name ends in a known video
 * extension. Keeps the drop handler from trying to upload images, PDFs, etc.
 *
 * @param files - The files dropped onto the DropZone.
 * @return Only the files that look like videos.
 */
export function filterVideoFiles( files: File[] ): File[] {
	return files.filter( file => {
		if ( file.type.startsWith( 'video/' ) ) {
			return true;
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

	if ( freeTier.isAtLimit ) {
		return { kind: 'at-limit' };
	}

	// Free (non-unlimited) plans cap how many videos can be hosted, so only
	// accept as many as there's room for. Paid/unlimited plans take everything.
	const remaining =
		freeTier.isFree && ! freeTier.isUnlimited
			? Math.max( 0, freeTier.limit - freeTier.videoCount )
			: Infinity;
	const toUpload = videoFiles.slice( 0, remaining );

	return { kind: 'ok', toUpload, skipped: videoFiles.length - toUpload.length };
}
