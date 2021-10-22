/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import DecorativeCard from '../../decorative-card';
import disconnectImage from '../images/disconnect-confirm.jpg';

/**
 * Shows the step that confirms the site has been disconnected, asks if user would like to provide feedback.
 *
 * @param {Function} props.onExit - Callback used to close the modal.
 * @param {Function} props.onProvideFeedback - Callback used to change the state if user would like to provide feedback.
 * @param {string} props.assetBaseUrl - Base URL for where webpack-ed images will be stored for the consumer of this component.
 * @returns {React.Component} - StepDisconnectConfirm Component
 */

const StepDisconnectConfirm = props => {
	const { onExit, onProvideFeedback, assetBaseUrl } = props;

	return (
		<div className="jp-disconnect-dialog__content">
			<DecorativeCard icon="unlink" imageUrl={ assetBaseUrl + disconnectImage } />

			<div className="jp-disconnect-dialog__step-copy jp-disconnect-dialog__step-copy--narrow">
				<h1>
					{ createInterpolateElement(
						__( 'Jetpack has been <br/>successfully disconnected.', 'jetpack' ),
						{
							br: <br />,
						}
					) }
				</h1>

				<p>
					{ __(
						'We’re sorry to see you go. Here at Jetpack, we’re always striving to provide the best experience for our customers. Please take our short survey (2 minutes, promise)',
						'jetpack'
					) }
					.
				</p>
				<p>
					<Button
						isPrimary
						onClick={ onProvideFeedback }
						className="jp-disconnect-dialog__btn-back-to-wp"
					>
						{ __( 'Help us improve', 'jetpack' ) }
					</Button>
				</p>
				<a
					className="jp-disconnect-dialog__link jp-disconnect-dialog__link--bold"
					href="#"
					onClick={ onExit }
				>
					{ __( 'No thank you', 'jetpack' ) }
				</a>
			</div>
		</div>
	);
};

export default StepDisconnectConfirm;
