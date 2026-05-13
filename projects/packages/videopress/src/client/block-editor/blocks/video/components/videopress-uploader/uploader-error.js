/**
 * External dependencies
 */
import { getRequiredPlan, getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { PlaceholderWrapper } from '../../edit';

const getErrorMessage = uploadErrorData => {
	if ( ! uploadErrorData ) {
		return '';
	}

	const errorMessage =
		uploadErrorData?.data?.message ||
		__( 'Failed to upload your video. Please try again.', 'jetpack-videopress-pkg' );

	// Check if site needs upgrade for VideoPress (same check as paid block banner)
	const needsUpgrade = !! getRequiredPlan( 'videopress/video' );

	// "Invalid Mime" on sites without VideoPress = plan doesn't include video uploads
	if ( errorMessage === 'Invalid Mime' && needsUpgrade ) {
		return createInterpolateElement(
			__(
				'Your plan does not include video uploads. <upgradeLink>Upgrade to upload videos</upgradeLink>.',
				'jetpack-videopress-pkg'
			),
			{
				upgradeLink: (
					<Link openInNewTab href={ `https://wordpress.com/plans/${ getSiteFragment() }` } />
				),
			}
		);
	}

	// "Invalid Mime" on sites WITH VideoPress = actual format issue
	if ( errorMessage === 'Invalid Mime' ) {
		return createInterpolateElement(
			__(
				'The format of the video you uploaded is not supported. <settingsLink>Check the recommended video settings.</settingsLink>',
				'jetpack-videopress-pkg'
			),
			{
				settingsLink: (
					<Link
						openInNewTab
						href="https://wordpress.com/support/videopress/recommended-video-settings/"
					/>
				),
			}
		);
	}

	return errorMessage;
};
const UploadError = ( { errorData, onRetry, onCancel } ) => {
	const message = getErrorMessage( errorData );

	return (
		<PlaceholderWrapper errorMessage={ message } onNoticeRemove={ onCancel }>
			<div className="videopress-uploader-progress__error-actions">
				<Button variant="primary" onClick={ onRetry }>
					{ __( 'Try again', 'jetpack-videopress-pkg' ) }
				</Button>
				<Button variant="secondary" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
				</Button>
			</div>
		</PlaceholderWrapper>
	);
};

export default UploadError;
