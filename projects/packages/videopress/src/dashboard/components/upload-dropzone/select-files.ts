import { _n, sprintf } from '@wordpress/i18n';

// Tags the first-run flow's uploads in the shared queue. The queue outlives
// any component, so the tag is the hand-off contract: the /upload stage
// re-finds its own items by it after a mid-flight remount, and Home's
// emptied-library dropzone starts uploads under it so the /upload stage
// adopts them on arrival. Lives here (not in a route) so both routes can
// import it without pulling each other's bundles.
export const UPLOAD_ONBOARDING_CONTEXT = 'upload-onboarding';

// The same flow's MULTI-file drops, which behave nothing like the single one:
// they navigate to the Library and are carried by its in-flight rows and the
// upload pill, with no surface of their own. Separating them is what keeps
// the single-upload moments — the /upload bridge's adoption, and the one-time
// "Your video is live" notice on /video/:id — from firing once per file
// of a batch.
export const UPLOAD_BATCH_CONTEXT = 'upload-batch';

export type PlanFileSelection = {
	files: File[];
	/**
	 * Set when the plan slice dropped files. Must be surfaced (a notice) —
	 * silently missing uploads read as a bug.
	 */
	discardedNotice?: string;
};

/**
 * Apply the plan's allowance to a file selection. The free tier includes one
 * video, so everything past the first is dropped by the slice; the notice
 * naming the dropped count rides along so every caller surfaces the same
 * message.
 *
 * @param selected      - The files the user dropped or picked.
 * @param allowMultiple - Whether the plan allows several files at once.
 * @return The files to upload, plus the notice when any were dropped.
 */
export function selectFilesForPlan( selected: File[], allowMultiple: boolean ): PlanFileSelection {
	const files = allowMultiple ? selected : selected.slice( 0, 1 );
	if ( files.length === selected.length ) {
		return { files };
	}
	const discarded = selected.length - files.length;
	return {
		files,
		discardedNotice: sprintf(
			/* translators: %d: number of selected videos not uploaded on the free plan. */
			_n(
				'The free plan includes one video — uploading your first. Upgrade to add %d more.',
				'The free plan includes one video — uploading your first. Upgrade to add the other %d.',
				discarded,
				'jetpack-videopress-pkg'
			),
			discarded
		),
	};
}
