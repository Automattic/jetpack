/**
 * Status banner for the Studio editor screen. Renders exactly one of:
 * conflict — the server's revision moved under local unsaved edits (409 on
 * save, or a background refetch); offers "Reload latest", which discards the
 * local session and re-baselines on the server state. processing — a
 * save/restore transcode job is running; shows progress while the timeline is
 * locked. failed — the last job failed; shows the server's error and a Retry
 * that re-submits the current session.
 *
 * Conflict wins over job state: it needs a user decision before anything
 * else on the screen is trustworthy.
 */
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import type { EditsJob } from '../../types/edits';
import type { ReactElement } from 'react';

type Props = {
	/** The job from the latest edits response, if loaded. */
	job?: EditsJob;
	/** Whether the local session conflicts with the server revision. */
	conflict: boolean;
	/** Re-submit the current session (failed banner). */
	onRetry: () => void;
	/** Refetch and re-baseline on the server state (conflict banner). */
	onReloadLatest: () => void;
};

/**
 * The Studio editor's status banner.
 *
 * @param props                - Component props.
 * @param props.job            - The job from the latest edits response.
 * @param props.conflict       - Whether a revision conflict is active.
 * @param props.onRetry        - Called when Retry is activated.
 * @param props.onReloadLatest - Called when "Reload latest" is activated.
 * @return The banner element, or null when there is nothing to report.
 */
export default function StudioEditorStatusBanner( {
	job,
	conflict,
	onRetry,
	onReloadLatest,
}: Props ): ReactElement | null {
	if ( conflict ) {
		return (
			<div className="vp-studio-editor__banner vp-studio-editor__banner--conflict" role="alert">
				<Stack direction="row" gap="md" align="center">
					<Text>
						{ __(
							'This video was edited somewhere else since you opened the editor.',
							'jetpack-videopress-pkg'
						) }
					</Text>
					<Button size="compact" variant="outline" onClick={ onReloadLatest }>
						{ __( 'Reload latest', 'jetpack-videopress-pkg' ) }
					</Button>
				</Stack>
			</div>
		);
	}

	if ( job?.status === 'processing' ) {
		return (
			<div className="vp-studio-editor__banner vp-studio-editor__banner--processing" role="status">
				<Stack direction="row" gap="md" align="center">
					<Text>{ __( 'Applying edits…', 'jetpack-videopress-pkg' ) }</Text>
					<progress
						className="vp-studio-editor__banner-progress"
						max={ 1 }
						// An indeterminate bar (no value) when the server didn't
						// report progress.
						value={ job.progress ?? undefined }
					/>
				</Stack>
			</div>
		);
	}

	if ( job?.status === 'failed' ) {
		return (
			<div className="vp-studio-editor__banner vp-studio-editor__banner--failed" role="alert">
				<Stack direction="row" gap="md" align="center">
					<Text>
						{ job.error?.message ||
							__( 'Something went wrong applying your edits.', 'jetpack-videopress-pkg' ) }
					</Text>
					<Button size="compact" variant="outline" onClick={ onRetry }>
						{ __( 'Retry', 'jetpack-videopress-pkg' ) }
					</Button>
				</Stack>
			</div>
		);
	}

	return null;
}
