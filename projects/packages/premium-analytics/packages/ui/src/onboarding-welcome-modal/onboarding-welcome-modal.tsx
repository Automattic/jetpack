import { Button, Dialog, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { WidgetGridAnimation } from '../widget-grid-animation';
import styles from './onboarding-welcome-modal.module.scss';

export type OnboardingWelcomeModalProps = {
	/** The consumer owns the open state; the modal only reports what the reader chose. */
	open: boolean;

	/** The reader pressed Get started and wants the tour. */
	onStart: () => void;

	/** The reader closed the modal instead: the close button, Escape or a click outside. */
	onDismiss: () => void;
};

/**
 * The first step of the onboarding: a dialog that introduces the new Stats
 * over the widget grid animation and hands off to the tour.
 */
export function OnboardingWelcomeModal( {
	open,
	onStart,
	onDismiss,
}: OnboardingWelcomeModalProps ) {
	// Get started closes through its own handler, so any close reaching here
	// came from the chrome.
	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen ) {
				onDismiss();
			}
		},
		[ onDismiss ]
	);

	return (
		<Dialog.Root open={ open } onOpenChange={ handleOpenChange }>
			<Dialog.Popup size="small">
				<div className={ styles.stage }>
					<WidgetGridAnimation />
					<Dialog.CloseIcon className={ styles.close } />
				</div>
				<Dialog.Content>
					<Stack direction="column" gap="md">
						<Dialog.Title>
							{ __( 'Introducing an updated experience', 'jetpack-premium-analytics-pkg' ) }
						</Dialog.Title>
						<Dialog.Description>
							{ __(
								'We are excited to introduce a new experience for your Jetpack Stats. More consistent and more versatile. Now you are able to decide how to display your data.',
								'jetpack-premium-analytics-pkg'
							) }
						</Dialog.Description>
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="solid" onClick={ onStart }>
						{ __( 'Get started', 'jetpack-premium-analytics-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
