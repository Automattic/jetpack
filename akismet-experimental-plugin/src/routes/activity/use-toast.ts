/**
 * Lightweight notice helper for the Activity tab. Surfaces a snackbar
 * via `@wordpress/notices` when a mutation action is suppressed by the
 * preview-mode guardrail (AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS off).
 */
import { dispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Show the "preview mode — action disabled" snackbar.
 *
 * @param actionLabel - The label of the action that was suppressed.
 */
export function showPreviewModeNotice( actionLabel: string ): void {
	void dispatch( noticesStore ).createNotice(
		'info',
		sprintf(
			/* translators: %s: action label, e.g. "Not spam". */
			__(
				'Preview mode — “%s” is disabled. Define AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS in wp-config to enable.',
				'akismet'
			),
			actionLabel
		),
		{ type: 'snackbar', isDismissible: true }
	);
}
