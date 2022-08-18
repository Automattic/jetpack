/**
 * External dependencies
 */
import { Button, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { PlaceholderWrapper } from '../../edit.js';

const getErrorMessage = uploadErrorData => {
	if ( ! uploadErrorData ) {
		return '';
	}

	let errorMessage =
		uploadErrorData?.data?.message ||
		__( 'Failed to upload your video. Please try again.', 'jetpack' );

	// Let's give this error a better message.
	if ( errorMessage === 'Invalid Mime' ) {
		errorMessage = (
			<>
				{ __( 'The format of the video you uploaded is not supported.', 'jetpack' ) }
				&nbsp;
				<ExternalLink
					href="https://wordpress.com/support/videopress/recommended-video-settings/"
					target="_blank"
					rel="noreferrer"
				>
					{ __( 'Check the recommended video settings.', 'jetpack' ) }
				</ExternalLink>
			</>
		);
	}

	return errorMessage;
};
const UploadError = ( { errorData, onRetry, onCancel } ) => {
	const message = getErrorMessage( errorData );

	return (
		<PlaceholderWrapper errorMessage={ message } onNoticeRemove={ onCancel }>
			<div className="videopress-uploader__error-actions">
				<Button variant="primary" onClick={ onRetry }>
					{ __( 'Try again', 'jetpack' ) }
				</Button>
				<Button variant="secondary" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack' ) }
				</Button>
			</div>
		</PlaceholderWrapper>
	);
};

export default UploadError;
