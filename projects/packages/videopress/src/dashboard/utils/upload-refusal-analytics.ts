import analytics from '@automattic/jetpack-analytics';

export type UploadRefusalLocation = 'library_dropzone' | 'library_intake' | 'onboarding_intake';

export type UploadRefusal = {
	reason: 'file_validation' | 'plan_limit';
	counts?: { attempted: number; skipped: number };
};

/**
 * Record a client-side refusal without identifying the selected files.
 *
 * @param location - Handler that refused the action.
 * @param refusal  - Reason and counts, if files were supplied.
 */
export function recordUploadRefusal( location: UploadRefusalLocation, refusal: UploadRefusal ) {
	analytics.tracks.recordEvent( 'jetpack_videopress_upload_refused', {
		location,
		reason: refusal.reason,
		files_known: !! refusal.counts,
		...( refusal.counts
			? {
					attempted_files: refusal.counts.attempted,
					skipped_files: refusal.counts.skipped,
				}
			: {} ),
	} );
}
