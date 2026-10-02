import { ProgressBar, VisuallyHidden } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Text } from '@wordpress/ui';

export type UploadProgressStatus =
	'pending' | 'uploading' | 'saving' | 'loading' | 'failed' | 'details-error' | 'loading-error';

type Props = {
	status: UploadProgressStatus;
	fileName: string;
	progress?: number;
	onRetry?: () => void;
};

/**
 * Show upload progress in the space reserved for the VideoPress player.
 *
 * @param props          - Component props.
 * @param props.status   - Upload or processing phase.
 * @param props.fileName - Original filename.
 * @param props.progress - Uploaded fraction, from zero to one.
 * @param props.onRetry  - Retry the failed operation.
 * @return The player placeholder.
 */
export default function UploadProgress( { status, fileName, progress = 0, onRetry }: Props ) {
	const messages: Record< UploadProgressStatus, string > = {
		pending: __( 'Waiting to upload…', 'jetpack-videopress-pkg' ),
		uploading:
			progress >= 1
				? __( 'Finishing upload…', 'jetpack-videopress-pkg' )
				: __( 'Uploading…', 'jetpack-videopress-pkg' ),
		saving: __( 'Saving video details…', 'jetpack-videopress-pkg' ),
		loading: __( 'Preparing video…', 'jetpack-videopress-pkg' ),
		failed: __( 'The upload failed. Your edits are still here.', 'jetpack-videopress-pkg' ),
		'details-error': __(
			'Your video uploaded, but its details couldn’t be saved. Your edits are still here.',
			'jetpack-videopress-pkg'
		),
		'loading-error': __(
			'Your video uploaded, but its details couldn’t be loaded.',
			'jetpack-videopress-pkg'
		),
	};
	const failed = status === 'failed' || status === 'details-error' || status === 'loading-error';
	const retryLabels = {
		failed: __( 'Retry upload', 'jetpack-videopress-pkg' ),
		'details-error': __( 'Retry saving details', 'jetpack-videopress-pkg' ),
		'loading-error': __( 'Retry loading details', 'jetpack-videopress-pkg' ),
	};
	const uploading = status === 'uploading' && progress < 1;
	const message = uploading
		? sprintf(
				/* translators: %d: upload progress percentage. */
				__( 'Uploading %d%%', 'jetpack-videopress-pkg' ),
				Math.round( progress * 100 )
			)
		: messages[ status ];

	return (
		<div className="vp-video-details__upload-progress">
			{ /* Announce phase changes without speaking every progress tick. */ }
			<VisuallyHidden>
				<span role={ failed ? 'alert' : 'status' }>{ messages[ status ] }</span>
			</VisuallyHidden>
			<Text className="vp-video-details__upload-name">{ fileName }</Text>
			<Text className="vp-video-details__upload-status" aria-hidden="true">
				{ message }
			</Text>
			{ ! failed && (
				<ProgressBar
					className="vp-video-details__upload-bar"
					aria-label={ __( 'Upload progress', 'jetpack-videopress-pkg' ) }
					value={ uploading ? Math.round( progress * 100 ) : undefined }
				/>
			) }
			{ failed && onRetry && (
				<Button variant="outline" onClick={ onRetry }>
					{ retryLabels[ status ] }
				</Button>
			) }
		</div>
	);
}
