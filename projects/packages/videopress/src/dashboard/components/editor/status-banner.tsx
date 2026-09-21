import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import type { EditsJob } from '../../types/edits';
import type { ReactElement } from 'react';

type Props = {
	/** The job from the latest edits response, if loaded. */
	job?: EditsJob;
	/** Whether the local session conflicts with the server revision. */
	conflict: boolean;
	/** Re-submit the current session (failed banner). */
	onRetry?: () => void;
	/** Refetch and re-baseline on the server state (conflict banner). */
	onReloadLatest: () => void;
	onCheckStatus: () => void;
};

/**
 * The Studio editor's status banner.
 *
 * @param props                - Component props.
 * @param props.job            - The job from the latest edits response.
 * @param props.conflict       - Whether a revision conflict is active.
 * @param props.onRetry        - Called when Retry is activated.
 * @param props.onReloadLatest - Called when "Reload latest" is activated.
 * @param props.onCheckStatus  - Refresh a processing job.
 * @return The banner element, or null when there is nothing to report.
 */
export default function StudioEditorStatusBanner( {
	job,
	conflict,
	onRetry,
	onReloadLatest,
	onCheckStatus,
}: Props ): ReactElement | null {
	const processing = job?.status === 'processing';
	if ( ! conflict && ! processing && job?.status !== 'failed' ) {
		return null;
	}
	let message =
		job?.error?.message ||
		__( 'Something went wrong applying your edits.', 'jetpack-videopress-pkg' );
	let action = onRetry;
	let label: string = __( 'Retry', 'jetpack-videopress-pkg' );
	let intent: 'error' | 'warning' | 'info' = 'error';
	if ( conflict ) {
		message = __(
			'This video was edited somewhere else since you opened the editor.',
			'jetpack-videopress-pkg'
		);
		action = onReloadLatest;
		label = __( 'Reload latest', 'jetpack-videopress-pkg' );
		intent = 'warning';
	} else if ( processing ) {
		message = __( 'Applying edits…', 'jetpack-videopress-pkg' );
		action = onCheckStatus;
		label = __( 'Check status', 'jetpack-videopress-pkg' );
		intent = 'info';
	}
	return (
		<Notice.Root intent={ intent } className="vp-video-editor__notice" spokenMessage={ message }>
			<Notice.Description>
				{ message }
				{ processing && ! conflict && (
					<progress
						className="vp-video-editor__progress"
						aria-label={ message }
						max={ 1 }
						value={ job.progress ?? undefined }
					/>
				) }
			</Notice.Description>
			{ action && (
				<Notice.Actions>
					<Notice.ActionButton onClick={ action }>{ label }</Notice.ActionButton>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}
