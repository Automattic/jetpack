/**
 * Small confirmation dialog used by the Studio editor for Save / Discard /
 * Restore original. Built on `@wordpress/ui` `Dialog.*` like the playlist
 * modals; the caller owns the copy so one component covers all three flows.
 */
import { __ } from '@wordpress/i18n';
import { Button, Dialog, Text } from '@wordpress/ui';
import { STUDIO_DIALOG_CLASS } from '../studio-dialog';
import type { ReactElement } from 'react';

type Props = {
	isOpen: boolean;
	title: string;
	message: string;
	confirmLabel: string;
	/** Disables both buttons while the confirmed action is in flight. */
	isBusy?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

/**
 * The Studio editor's confirmation dialog.
 *
 * @param props              - Component props.
 * @param props.isOpen       - Whether the dialog is open.
 * @param props.title        - Dialog title.
 * @param props.message      - Body copy explaining the consequence.
 * @param props.confirmLabel - Label of the confirming button.
 * @param props.isBusy       - Whether the confirmed action is in flight.
 * @param props.onConfirm    - Called when the user confirms.
 * @param props.onCancel     - Called when the user cancels or dismisses.
 * @return The dialog element.
 */
export default function StudioEditorConfirmDialog( {
	isOpen,
	title,
	message,
	confirmLabel,
	isBusy = false,
	onConfirm,
	onCancel,
}: Props ): ReactElement {
	return (
		<Dialog.Root
			open={ isOpen }
			onOpenChange={ open => {
				if ( ! open ) {
					onCancel();
				}
			} }
		>
			<Dialog.Popup className={ STUDIO_DIALOG_CLASS } size="small">
				<Dialog.Header>
					<Dialog.Title>{ title }</Dialog.Title>
					<Dialog.CloseIcon label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				{ /*
				 * Dialog.Popup is an unpadded flex column; body padding comes
				 * from the Dialog.Content region, which also owns scrolling
				 * when the body outgrows the popup.
				 */ }
				<Dialog.Content>
					<Text>{ message }</Text>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="outline" onClick={ onCancel } disabled={ isBusy }>
						{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
					</Button>
					<Button onClick={ onConfirm } disabled={ isBusy }>
						{ confirmLabel }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
