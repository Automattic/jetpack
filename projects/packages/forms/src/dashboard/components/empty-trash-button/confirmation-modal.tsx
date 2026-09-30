/**
 * External dependencies
 */
import { formatNumber } from '@automattic/number-formatters';
import { useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { AlertDialog } from '@wordpress/ui';

interface EmptyTrashConfirmationModalProps {
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	totalItemsTrash: number;
	selectedResponsesCount: number;
}

/**
 * Confirmation modal for emptying trash.
 *
 * @param {object}   props                        - Component props.
 * @param {boolean}  props.isOpen                 - Whether the modal is open.
 * @param {Function} props.onCancel               - Function to call when the user cancels.
 * @param {Function} props.onConfirm              - Function to call when the user confirms.
 * @param {number}   props.totalItemsTrash        - The total number of trash items.
 * @param {number}   props.selectedResponsesCount - The number of selected responses.
 * @return {JSX.Element} The confirmation modal.
 */
export default function EmptyTrashConfirmationModal( {
	isOpen,
	onCancel,
	onConfirm,
	totalItemsTrash,
	selectedResponsesCount,
}: EmptyTrashConfirmationModalProps ): JSX.Element {
	const handleOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onCancel();
			}
		},
		[ onCancel ]
	);

	// Discard the handler's promise: it closes the dialog itself, so a spinner would only flash.
	const handleConfirm = useCallback( () => {
		onConfirm();
	}, [ onConfirm ] );

	const description =
		selectedResponsesCount > 0
			? sprintf(
					// translators: %s: the number of responses in the trash.
					_n(
						'%s response in trash will be deleted forever. This action cannot be undone.',
						'All %s responses in trash will be deleted forever. This action cannot be undone.',
						totalItemsTrash || 0,
						'jetpack-forms'
					),
					formatNumber( totalItemsTrash )
				)
			: __(
					'All responses in trash will be deleted forever. This action cannot be undone.',
					'jetpack-forms'
				);

	return (
		<AlertDialog.Root open={ isOpen } onOpenChange={ handleOpenChange } onConfirm={ handleConfirm }>
			<AlertDialog.Popup
				intent="irreversible"
				title={ __( 'Delete forever', 'jetpack-forms' ) }
				description={ description }
				confirmButtonText={ __( 'Delete', 'jetpack-forms' ) }
				cancelButtonText={ __( 'Cancel', 'jetpack-forms' ) }
			/>
		</AlertDialog.Root>
	);
}
