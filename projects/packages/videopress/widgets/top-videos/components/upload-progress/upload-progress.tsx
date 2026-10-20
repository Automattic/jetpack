/**
 * External dependencies
 */
import { Stack } from '@automattic/jetpack-premium-analytics-sdk';
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, video as videoIcon } from '@wordpress/icons';
import { Progress, Text, VisuallyHidden } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import './upload-progress.scss';

export type UploadProgressProps =
	| { file: File; status: 'uploading'; progress: number; onRetry?: never }
	| { file: File; status: 'failed'; progress?: never; onRetry: () => void };

/**
 * The file in flight: its name, a phase message and a progress bar, or a Retry.
 *
 * @param props          - Component props.
 * @param props.file     - The file being uploaded.
 * @param props.status   - Whether the upload is running or has failed.
 * @param props.progress - Uploaded fraction, from zero to one.
 * @param props.onRetry  - Starts the failed upload again.
 * @return The progress block.
 */
export function UploadProgress( { file, status, progress = 0, onRetry }: UploadProgressProps ) {
	const failed = status === 'failed';
	const percent = Math.round( progress * 100 );
	const phaseMessage = failed
		? __( 'The upload failed. Please try again.', 'jetpack-videopress-pkg' )
		: __( 'Uploading…', 'jetpack-videopress-pkg' );
	let message: string = phaseMessage;
	if ( ! failed && progress >= 1 ) {
		message = __( 'Finishing upload…', 'jetpack-videopress-pkg' );
	} else if ( ! failed ) {
		message = sprintf(
			/* translators: %d: upload progress percentage. */
			__( 'Uploading %d%%', 'jetpack-videopress-pkg' ),
			percent
		);
	}

	return (
		<Stack direction="column" align="center" gap="sm" className="vp-top-videos-upload-progress">
			{ /* Announce the phase, not every progress tick. */ }
			<VisuallyHidden>
				<span role={ failed ? 'alert' : 'status' }>{ phaseMessage }</span>
			</VisuallyHidden>
			<Icon icon={ videoIcon } size={ 40 } className="vp-top-videos-upload-progress__icon" />
			<Text variant="body-md" className="vp-top-videos-upload-progress__name">
				{ file.name }
			</Text>
			<Text variant="body-md" className="vp-top-videos-upload-progress__message" aria-hidden="true">
				{ message }
			</Text>
			{ failed ? (
				<Button variant="secondary" __next40pxDefaultSize onClick={ onRetry }>
					{ __( 'Retry upload', 'jetpack-videopress-pkg' ) }
				</Button>
			) : (
				<Progress.Root
					className="vp-top-videos-upload-progress__bar"
					aria-label={ __( 'Upload progress', 'jetpack-videopress-pkg' ) }
					value={ progress >= 1 ? null : percent }
				>
					<Progress.Track>
						<Progress.Indicator />
					</Progress.Track>
				</Progress.Root>
			) }
		</Stack>
	);
}
