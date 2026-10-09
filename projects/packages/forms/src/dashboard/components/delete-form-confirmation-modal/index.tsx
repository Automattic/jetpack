/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { AlertDialog } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import useDismissHandler from '../../hooks/use-dismiss-handler';
import type { JSX } from 'react';

interface DeleteFormConfirmationModalProps {
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	count?: number;
}

/**
 * Confirmation modal for permanently deleting forms.
 *
 * @param {object}   props           - Component props.
 * @param {boolean}  props.isOpen    - Whether the modal is open.
 * @param {Function} props.onCancel  - Function to call when the user cancels.
 * @param {Function} props.onConfirm - Function to call when the user confirms. It must close the modal by setting `isOpen` to false.
 * @param {number}   props.count     - The number of forms to delete.
 * @return {JSX.Element} The confirmation modal.
 */
export default function DeleteFormConfirmationModal( {
	isOpen,
	onCancel,
	onConfirm,
	count = 1,
}: DeleteFormConfirmationModalProps ): JSX.Element {
	const handleOpenChange = useDismissHandler( onCancel );

	const description =
		count === 1
			? __(
					'This will permanently delete this form. This action cannot be undone.',
					'jetpack-forms'
				)
			: sprintf(
					/* translators: %d: number of forms */
					_n(
						'This will permanently delete %d form. This action cannot be undone.',
						'This will permanently delete %d forms. This action cannot be undone.',
						count,
						'jetpack-forms'
					),
					count
				);

	return (
		<AlertDialog.Root open={ isOpen } onOpenChange={ handleOpenChange } onConfirm={ onConfirm }>
			<AlertDialog.Popup
				intent="irreversible"
				title={ __( 'Delete permanently', 'jetpack-forms' ) }
				description={ description }
				confirmButtonText={ __( 'Delete permanently', 'jetpack-forms' ) }
			/>
		</AlertDialog.Root>
	);
}
