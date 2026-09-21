import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import type { useCopySession } from './use-copy-session';

type Props = { session: ReturnType< typeof useCopySession >; onReload: () => void };

/**
 * Report copy progress and preserve safe retries when the acceptance response is lost.
 *
 * @param props          - Component props.
 * @param props.session  - Copy request lifecycle.
 * @param props.onReload - Reload a conflicting source revision.
 * @return Copy status, or nothing before a request.
 */
export default function CopyStatusBanner( { session, onReload }: Props ) {
	if ( ! session.request ) {
		return null;
	}
	let message: string = __(
		'Creating your new video… Your current video stays unchanged.',
		'jetpack-videopress-pkg'
	);
	let action;
	if ( session.conflict ) {
		message = __(
			'The source video changed. Reload the latest edits before creating a copy.',
			'jetpack-videopress-pkg'
		);
		action = (
			<Notice.ActionButton onClick={ onReload }>
				{ __( 'Reload latest', 'jetpack-videopress-pkg' ) }
			</Notice.ActionButton>
		);
	} else if ( session.failed || session.rejected ) {
		message =
			( session.rejected && session.error?.message ) ||
			__(
				'The new video could not be created. Your current video and edits are unchanged.',
				'jetpack-videopress-pkg'
			);
	} else if ( ! session.submitting ) {
		if ( session.needsAssistance ) {
			message = __(
				'We could not confirm whether the new video was created. Your current video is unchanged. Check its status, and contact support if it remains unconfirmed.',
				'jetpack-videopress-pkg'
			);
		} else if (
			session.recoverable ||
			( ( session.error || session.status.isError ) && ! session.status.data )
		) {
			message = __(
				'We could not confirm the new video’s status. Retry or check its status to continue safely.',
				'jetpack-videopress-pkg'
			);
		}
		action = (
			<>
				{ ! session.needsAssistance &&
					( session.recoverable || ( session.error && ! session.status.data ) ) && (
						<Notice.ActionButton onClick={ () => void session.retry() }>
							{ __( 'Retry', 'jetpack-videopress-pkg' ) }
						</Notice.ActionButton>
					) }
				<Notice.ActionButton onClick={ () => void session.status.refetch() }>
					{ __( 'Check status', 'jetpack-videopress-pkg' ) }
				</Notice.ActionButton>
			</>
		);
	}
	const terminalError = session.failed || session.rejected;
	const uncertain =
		session.needsAssistance || session.recoverable || session.error || session.status.isError;
	let intent: 'error' | 'warning' | 'info' = 'info';
	if ( terminalError ) {
		intent = 'error';
	} else if ( session.conflict || uncertain ) {
		intent = 'warning';
	}
	return (
		<Notice.Root intent={ intent } className="vp-video-editor__notice" spokenMessage={ message }>
			<Notice.Description>
				{ message }
				{ ! terminalError && ! session.conflict && ! uncertain && (
					<progress
						className="vp-video-editor__progress"
						aria-label={ __( 'Creating video', 'jetpack-videopress-pkg' ) }
						max={ 1 }
						value={ session.status.data?.job.progress || undefined }
					/>
				) }
			</Notice.Description>
			{ action && <Notice.Actions>{ action }</Notice.Actions> }
			{ terminalError && <Notice.CloseIcon onClick={ session.clear } /> }
		</Notice.Root>
	);
}
