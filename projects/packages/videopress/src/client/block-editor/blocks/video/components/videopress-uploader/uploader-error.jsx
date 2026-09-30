/**
 * External dependencies
 */
import useConnectionErrorNotice from '@automattic/jetpack-connection/use-connection-error-notice';
import {
	getRequiredPlan,
	getSiteFragment,
	useUpgradeFlow,
} from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { isConnectionAttributedFailure } from '../../../../../hooks/use-resumable-uploader';
import { PlaceholderWrapper } from '../../edit';

const isUpgradeRequired = errorData => {
	const message = errorData?.data?.message;

	// The upload endpoint drops the quota code, so match its free-tier message only.
	return (
		message ===
			'You have used your free video. Upgrade to a VideoPress plan to unlock more videos and 1TB of storage.' ||
		message ===
			__(
				'You have used your free video. Upgrade to a VideoPress plan to unlock more videos and 1TB of storage.',
				'jetpack-videopress-pkg'
			) ||
		( message === 'Invalid Mime' && !! getRequiredPlan( 'videopress/video' ) )
	);
};

const UpgradeButton = () => {
	const [ checkoutUrl, goToCheckoutPage, isRedirecting ] = useUpgradeFlow(
		getRequiredPlan( 'videopress/video' ) || 'jetpack_videopress'
	);

	return (
		<Button
			variant="primary"
			href={ checkoutUrl }
			onClick={ goToCheckoutPage }
			isBusy={ isRedirecting }
			disabled={ isRedirecting }
		>
			{ __( 'Upgrade', 'jetpack-videopress-pkg' ) }
		</Button>
	);
};

const getErrorMessage = ( uploadErrorData, hasConnectionError ) => {
	if ( ! uploadErrorData ) {
		return '';
	}

	if ( isConnectionAttributedFailure( uploadErrorData?.code, hasConnectionError ) ) {
		return __(
			'Failed to upload your video. Check your Jetpack connection and try again.',
			'jetpack-videopress-pkg'
		);
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
	// The editor has no ConnectionError notice of its own, so this is read only
	// as corroboration for the message below, not to render anything.
	const { hasConnectionError } = useConnectionErrorNotice();
	const message = getErrorMessage( errorData, hasConnectionError );

	return (
		<PlaceholderWrapper errorMessage={ message } onNoticeRemove={ onCancel }>
			<div className="videopress-uploader-progress__error-actions">
				{ isUpgradeRequired( errorData ) ? (
					<UpgradeButton />
				) : (
					<Button variant="primary" onClick={ onRetry }>
						{ __( 'Try again', 'jetpack-videopress-pkg' ) }
					</Button>
				) }
				<Button variant="secondary" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
				</Button>
			</div>
		</PlaceholderWrapper>
	);
};

export default UploadError;
