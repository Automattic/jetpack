import { DecorativeCard } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import disconnectImage from '../images/disconnect-confirm.jpg';

/**
 * Shows the step that confirms the site has been disconnected, asks if user would like to provide feedback.
 * Will only show option to provide feedback if the canProvideFeedback prop is true.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} - StepDisconnectConfirm Component
 */
const StepDisconnectConfirm = props => {
	const { onExit, canProvideFeedback, onProvideFeedback } = props;

	return (
		<div className="jp-connection__disconnect-dialog__content">
			<DecorativeCard icon="unlink" imageUrl={ disconnectImage } />

			<div className="jp-connection__disconnect-dialog__step-copy jp-connection__disconnect-dialog__step-copy--narrow">
				<h1>
					{ createInterpolateElement(
						__( 'Jetpack has been <br/>successfully disconnected.', 'jetpack' ),
						{
							br: <br />,
						}
					) }
				</h1>

				{ canProvideFeedback && (
					<>
						<p>
							{ __(
								'We’re sorry to see you go. Here at Jetpack, we’re always striving to provide the best experience for our customers. Please take our short survey (2 minutes, promise).',
								'jetpack'
							) }
						</p>
						<p>
							<Button
								variant="primary"
								onClick={ onProvideFeedback }
								className="jp-connection__disconnect-dialog__btn-back-to-wp"
							>
								{ __( 'Help us improve', 'jetpack' ) }
							</Button>
						</p>
						<a
							className="jp-connection__disconnect-dialog__link jp-connection__disconnect-dialog__link--bold"
							href="#"
							onClick={ onExit }
						>
							{ __( 'No thank you', 'jetpack' ) }
						</a>
					</>
				) }

				{ ! canProvideFeedback && (
					<>
						<p>
							<Button
								variant="primary"
								onClick={ onExit }
								className="jp-connection__disconnect-dialog__btn-back-to-wp"
							>
								{ __( 'Back to my website', 'jetpack' ) }
							</Button>
						</p>
					</>
				) }
			</div>
		</div>
	);
};

StepDisconnectConfirm.propTypes = {
	/** Callback used to close the modal. */
	onExit: PropTypes.func,
	/** Callback used to change the state if user would like to provide feedback. */
	onProvideFeedback: PropTypes.func,
	/** Does the app have the necessary information to collect a survey response? */
	canProvideFeedback: PropTypes.bool,
};

export default StepDisconnectConfirm;
