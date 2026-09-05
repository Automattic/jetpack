import { Button, Dialog, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { WidgetGridAnimation } from '../widget-grid-animation';
import styles from './onboarding-welcome-modal.module.scss';

/** How the reader closed the modal without starting: the close button, Escape or a click outside. */
export type OnboardingDismissReason = 'close' | 'escape' | 'outside' | 'other';

// Base UI names the cause on `onOpenChange`; these are the three a reader can produce.
const DISMISS_REASONS: Record< string, OnboardingDismissReason > = {
	'close-press': 'close',
	'escape-key': 'escape',
	'outside-press': 'outside',
};

type OpenChangeDetails = {
	reason?: string;
};

export type OnboardingWelcomeModalProps = {
	/** The consumer owns the open state; the modal only reports what the reader chose. */
	open: boolean;

	/** The reader pressed Get started and wants the tour. */
	onStart: () => void;

	/** The reader closed the modal instead, and how. */
	onDismiss: ( reason: OnboardingDismissReason ) => void;
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
	// The tour button closes through its own handler, so any close reaching
	// here came from the chrome.
	const handleOpenChange = useCallback(
		( nextOpen: boolean, details?: OpenChangeDetails ) => {
			if ( ! nextOpen ) {
				onDismiss( DISMISS_REASONS[ details?.reason ?? '' ] ?? 'other' );
			}
		},
		[ onDismiss ]
	);

	return (
		<Dialog.Root open={ open } onOpenChange={ handleOpenChange }>
			<Dialog.Popup size="small">
				<Dialog.CloseIcon className={ styles.close } />
				{ /* The stage lives in the scroll region so the copy and the button
				     stay reachable on short viewports; the footer stays pinned. */ }
				<Dialog.Content>
					<div className={ styles.stage }>
						<WidgetGridAnimation />
					</div>
					<Stack direction="column" gap="md">
						<Dialog.Title>
							{ __( 'Welcome to the new Traffic page', 'jetpack-premium-analytics-pkg' ) }
						</Dialog.Title>
						<Dialog.Description>
							{ __(
								"It's built from widgets you can move and resize, so the page can match how you read your site. This is an early version and we'll keep adding new tabs and features in regular updates.",
								'jetpack-premium-analytics-pkg'
							) }
						</Dialog.Description>
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="solid" onClick={ onStart }>
						{ __( 'Take a quick tour', 'jetpack-premium-analytics-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
