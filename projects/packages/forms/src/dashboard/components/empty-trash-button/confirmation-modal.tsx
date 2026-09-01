/**
 * External dependencies
 */
import { formatNumber } from '@automattic/number-formatters';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __, _n, sprintf } from '@wordpress/i18n';

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
	return (
		<ConfirmDialog
			onCancel={ onCancel }
			onConfirm={ onConfirm }
			isOpen={ isOpen }
			confirmButtonText={ __( 'Delete', 'jetpack-forms' ) }
		>
			<h3>{ __( 'Delete forever', 'jetpack-forms' ) }</h3>
			<p>
				{ selectedResponsesCount > 0
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
					  ) }
			</p>
		</ConfirmDialog>
	);
}
