import { __, sprintf } from '@wordpress/i18n';
import { Button, Dialog, Stack, Text } from '@wordpress/ui';
import type { ReactElement } from 'react';

type BodyProps = {
	onCancel: () => void;
	onConfirm: () => void;
	isDeleting?: boolean;
};

/**
 * Delete-confirmation body: warning text plus Cancel/Delete buttons.
 *
 * @param props            - Component props.
 * @param props.onCancel   - Called when the user cancels.
 * @param props.onConfirm  - Called when the user confirms the delete.
 * @param props.isDeleting - Disables the buttons while the delete is in flight.
 * @return The confirmation body element.
 */
export default function DeleteVideoConfirmationModal( {
	onCancel,
	onConfirm,
	isDeleting = false,
}: BodyProps ): ReactElement {
	return (
		<Stack direction="column" gap="lg">
			<Text>{ __( 'This action cannot be undone.', 'jetpack-videopress-pkg' ) }</Text>
			<Stack direction="row" gap="sm" justify="flex-end">
				<Button variant="outline" onClick={ onCancel } disabled={ isDeleting }>
					{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
				</Button>
				<Button
					variant="solid"
					onClick={ onConfirm }
					loading={ isDeleting }
					disabled={ isDeleting }
				>
					{ __( 'Delete', 'jetpack-videopress-pkg' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

/**
 * Delete-confirmation header text, pluralised by video count.
 *
 * @param count - Number of videos being deleted.
 * @return The header text.
 */
export function getDeleteVideoConfirmationTitle( count: number ): string {
	if ( count === 1 ) {
		return __( 'Delete video', 'jetpack-videopress-pkg' );
	}
	return sprintf(
		/* translators: %d: number of videos being deleted. */
		__( 'Delete %d videos', 'jetpack-videopress-pkg' ),
		count
	);
}

type DialogProps = {
	isOpen: boolean;
	count: number;
	onCancel: () => void;
	onConfirm: () => void;
	isDeleting?: boolean;
};

/**
 * Standalone delete-confirmation dialog for the Video details page.
 *
 * @param props            - Component props.
 * @param props.isOpen     - Whether the dialog is open.
 * @param props.count      - Number of videos being deleted, for pluralised copy.
 * @param props.onCancel   - Called when the user cancels or dismisses the dialog.
 * @param props.onConfirm  - Called when the user confirms the delete.
 * @param props.isDeleting - Disables the buttons while the delete is in flight.
 * @return The dialog element, or null while closed.
 */
export function DeleteVideoConfirmationDialog( {
	isOpen,
	count,
	onCancel,
	onConfirm,
	isDeleting,
}: DialogProps ): ReactElement | null {
	if ( ! isOpen ) {
		return null;
	}
	return (
		<Dialog.Root
			open
			onOpenChange={ open => {
				if ( ! open ) {
					onCancel();
				}
			} }
		>
			<Dialog.Popup size="small">
				<Dialog.Header>
					<Dialog.Title>{ getDeleteVideoConfirmationTitle( count ) }</Dialog.Title>
					<Dialog.CloseIcon label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				<Dialog.Content>
					<DeleteVideoConfirmationModal
						onCancel={ onCancel }
						onConfirm={ onConfirm }
						isDeleting={ isDeleting }
					/>
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
