import { DecorativeCard } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import disconnectImage from '../images/disconnect-thanks.jpg';
import type { MouseEvent } from 'react';

interface StepThankYouProps {
	/** Callback function to close the disconnect modal. */
	onExit: ( e?: MouseEvent< HTMLElement > ) => void;
}

/**
 * Show the "thank you" step following survey submission
 *
 * @param {StepThankYouProps} props - The properties.
 * @return {import('react').ReactNode} - The StepThankYou Component
 */
const StepThankYou = ( { onExit }: StepThankYouProps ) => {
	return (
		<div className="jp-connection__disconnect-dialog__content">
			<DecorativeCard format="vertical" imageUrl={ disconnectImage } />

			<Stack
				className="jp-connection__disconnect-dialog__copy"
				direction="column"
				align="center"
				gap="xl"
			>
				<h1>{ __( 'Thank you!', 'jetpack-connection-js' ) }</h1>
				<Text className="jp-connection__disconnect-dialog__large-text">
					{ createInterpolateElement(
						__(
							'Your answer has been submitted. <br/>Thanks for your input on how we can improve Jetpack.',
							'jetpack-connection-js'
						),
						{
							br: <br />,
						}
					) }
				</Text>
				<Button onClick={ onExit } className="jp-connection__disconnect-dialog__btn-back-to-wp">
					{ __( 'Back to my website', 'jetpack-connection-js' ) }
				</Button>
			</Stack>
		</div>
	);
};

export default StepThankYou;
