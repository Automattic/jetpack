import { DecorativeCard } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Link, Stack } from '@wordpress/ui';
import disconnectImage from '../images/disconnect-confirm.jpg';
import type { MouseEvent } from 'react';

interface StepDisconnectConfirmProps {
	/** Callback used to close the modal. */
	onExit: ( e?: MouseEvent< HTMLElement > ) => void;
	/** Callback used to change the state if user would like to provide feedback. */
	onProvideFeedback: ( e?: MouseEvent< HTMLElement > ) => void;
	/** Does the app have the necessary information to collect a survey response? */
	canProvideFeedback?: boolean;
}

/**
 * Shows the step that confirms the site has been disconnected, asks if user would like to provide feedback.
 * Will only show option to provide feedback if the canProvideFeedback prop is true.
 *
 * @param {StepDisconnectConfirmProps} props - The properties.
 * @return {import('react').ReactNode} - StepDisconnectConfirm Component
 */
const StepDisconnectConfirm = ( {
	onExit,
	canProvideFeedback,
	onProvideFeedback,
}: StepDisconnectConfirmProps ) => {
	return (
		<div className="jp-connection__disconnect-dialog__content">
			<DecorativeCard icon="unlink" imageUrl={ disconnectImage } />

			<Stack
				className="jp-connection__disconnect-dialog__copy jp-connection__disconnect-dialog__step-copy jp-connection__disconnect-dialog__step-copy--narrow"
				direction="column"
				align="center"
				gap="xl"
			>
				<h1>
					{ createInterpolateElement(
						__( 'Jetpack has been <br/>successfully disconnected.', 'jetpack-connection-js' ),
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
								'jetpack-connection-js'
							) }
						</p>
						<Button
							onClick={ onProvideFeedback }
							className="jp-connection__disconnect-dialog__btn-back-to-wp"
						>
							{ __( 'Help us improve', 'jetpack-connection-js' ) }
						</Button>
						<Link
							className="jp-connection__disconnect-dialog__link jp-connection__disconnect-dialog__link--bold"
							href="#"
							onClick={ onExit }
						>
							{ __( 'No thank you', 'jetpack-connection-js' ) }
						</Link>
					</>
				) }

				{ ! canProvideFeedback && (
					<Button onClick={ onExit } className="jp-connection__disconnect-dialog__btn-back-to-wp">
						{ __( 'Back to my website', 'jetpack-connection-js' ) }
					</Button>
				) }
			</Stack>
		</div>
	);
};

export default StepDisconnectConfirm;
