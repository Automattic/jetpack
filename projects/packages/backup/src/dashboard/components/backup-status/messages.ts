import { __ } from '@wordpress/i18n';

// How a backup run ended, shared by the banners that show it and the hook that announces it.

/**
 * The sentence for a run that made a new restore point.
 *
 * @return The sentence.
 */
export function backupReadyText(): string {
	return __( 'Your backup is ready.', 'jetpack-backup-pkg' );
}

/**
 * The sentence for a new restore point with some files missing, its link marked `<a>`.
 *
 * @return The sentence.
 */
export function completedWithWarningsText(): string {
	return __(
		'Backup is completed with some files missing. See your <a>backup in the cloud</a> for more details.',
		'jetpack-backup-pkg'
	);
}

/**
 * The sentence for a failed attempt that WordPress.com will retry.
 *
 * @return The sentence.
 */
export function willRetryText(): string {
	return __( "Your latest backup didn't complete. We'll try again shortly.", 'jetpack-backup-pkg' );
}

/**
 * The sentence for a failed attempt with no retry, on a site that has older restore points.
 *
 * @return The sentence.
 */
export function failedRunText(): string {
	return __(
		"Your latest backup didn't complete. Your earlier backups can still be restored.",
		'jetpack-backup-pkg'
	);
}

/**
 * The sentence for a site whose backups keep failing and has no restore point.
 *
 * @return The sentence.
 */
export function noGoodBackupsText(): string {
	/* translators: sentence form of the takeover panel's heading, which is the same words without the full stop. */
	return __( 'We are having trouble backing up your site.', 'jetpack-backup-pkg' );
}
