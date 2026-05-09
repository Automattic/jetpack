import { __ } from '@wordpress/i18n';
import { Button, Dialog } from '@wordpress/ui';
import type { ReactElement } from 'react';

type Props = {
	isOpen: boolean;
	onClose: () => void;
};

/**
 * Help modal explaining how to add chapters via the Description field.
 * Triggered from VideoDetailsCard. Same copy as the legacy
 * `learn-how-notice` component, rebuilt on `@wordpress/ui` `Dialog.*`.
 *
 * @param props         - Component props.
 * @param props.isOpen  - Whether the dialog is open.
 * @param props.onClose - Called when the user dismisses the dialog.
 * @return The dialog element.
 */
export default function ChaptersHelpModal( { isOpen, onClose }: Props ): ReactElement {
	return (
		<Dialog.Root
			open={ isOpen }
			onOpenChange={ open => {
				if ( ! open ) {
					onClose();
				}
			} }
		>
			<Dialog.Popup size="medium">
				<Dialog.Header>
					<Dialog.Title>{ __( 'Chapters in VideoPress', 'jetpack-videopress-pkg' ) }</Dialog.Title>
					<Dialog.CloseIcon label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				<p>
					{ __(
						'Chapters are a great way to split up longer videos and organize them into different sections.',
						'jetpack-videopress-pkg'
					) }
				</p>
				<p>
					{ __(
						'They allow your visitors to see what each section is about and skip to their favorite parts.',
						'jetpack-videopress-pkg'
					) }
				</p>
				<p>
					<strong>
						{ __( 'How to add Chapters to your VideoPress videos', 'jetpack-videopress-pkg' ) }
					</strong>
				</p>
				<ol>
					<li>
						{ __(
							'In the Description, add a list of timestamps and titles.',
							'jetpack-videopress-pkg'
						) }
					</li>
					<li>
						{ __(
							'Make sure that the first timestamp starts with 00:00.',
							'jetpack-videopress-pkg'
						) }
					</li>
					<li>
						{ __(
							'Add at least three chapters entries and as many as you need.',
							'jetpack-videopress-pkg'
						) }
					</li>
					<li>
						{ __(
							'Add your chapters entries in consecutive order, with at least 10-second intervals between each.',
							'jetpack-videopress-pkg'
						) }
					</li>
				</ol>
				<p>
					<strong>{ __( 'Example', 'jetpack-videopress-pkg' ) }</strong>
				</p>
				<p>00:00 Intro</p>
				<p>00:24 Mountains arise</p>
				<p>02:38 Coming back home</p>
				<p>03:04 Credits</p>
				<Dialog.Footer>
					<Dialog.Action render={ <Button /> }>
						{ __( 'Got it, thanks', 'jetpack-videopress-pkg' ) }
					</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
