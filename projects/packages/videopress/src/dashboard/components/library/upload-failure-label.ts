import { __ } from '@wordpress/i18n';
import type { UploadFailureReason } from '../../types/library';

export type UploadFailureLabel = {
	/** What went wrong, in the terms every failed upload shares. */
	summary: string;
	/** What to blame it on, when the failure was attributed to something specific. */
	cause?: string;
};

/**
 * Describe a failed upload for the library.
 *
 * Returned in two parts rather than one string because the two views that render
 * a failure have different room for it: the table's title pill can carry a single
 * joined line, while the grid's thumbnail overlay is a narrow column above a Retry
 * button and needs the cause on its own second line. Both call this so the wording
 * can't drift apart again.
 *
 * @param {UploadFailureReason} failureReason - What the failure was attributed to, if anything.
 * @return {UploadFailureLabel} The summary, plus a cause when one was established.
 */
export function getUploadFailureLabel( failureReason?: UploadFailureReason ): UploadFailureLabel {
	const summary = __( 'Upload failed', 'jetpack-videopress-pkg' );

	// The connection notice above the library carries the diagnosis and the
	// reconnect button, so a row only has to say which problem it belongs to.
	if ( failureReason === 'connection' ) {
		return { summary, cause: __( 'Jetpack connection issue', 'jetpack-videopress-pkg' ) };
	}

	return { summary };
}
