import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
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
			<Button size="compact" variant="outline" onClick={ onReload }>
				{ __( 'Reload latest', 'jetpack-videopress-pkg' ) }
			</Button>
		);
	} else if ( session.failed ) {
		message = __(
			'The new video could not be created. Your current video and edits are unchanged.',
			'jetpack-videopress-pkg'
		);
		action = (
			<Button size="compact" variant="outline" onClick={ session.clear }>
				{ __( 'Back to editing', 'jetpack-videopress-pkg' ) }
			</Button>
		);
	} else if ( ! session.submitting ) {
		if (
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
				{ ( session.recoverable || ( session.error && ! session.status.data ) ) && (
					<Button size="compact" variant="outline" onClick={ () => void session.retry() }>
						{ __( 'Retry', 'jetpack-videopress-pkg' ) }
					</Button>
				) }
				<Button size="compact" variant="outline" onClick={ () => void session.status.refetch() }>
					{ __( 'Check status', 'jetpack-videopress-pkg' ) }
				</Button>
			</>
		);
	}
	return (
		<div
			className="vp-video-editor__banner"
			role={ session.error || session.failed ? 'alert' : 'status' }
		>
			<Stack direction="row" gap="md" align="center">
				<Text>{ message }</Text>
				{ action }
			</Stack>
		</div>
	);
}
