/**
 * External dependencies
 */
import { formatNumber } from '@automattic/number-formatters';
import { __, _n, sprintf } from '@wordpress/i18n';
import { AlertDialog } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import useDismissHandler from '../../hooks/use-dismiss-handler';
import type { JSX } from 'react';

interface EmptySpamConfirmationModalProps {
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	totalItemsSpam: number;
	selectedResponsesCount: number;
}

/**
 * Confirmation modal for emptying spam.
 *
 * @param {object}   props                        - Component props.
 * @param {boolean}  props.isOpen                 - Whether the modal is open.
 * @param {Function} props.onCancel               - Function to call when the user cancels.
 * @param {Function} props.onConfirm              - Function to call when the user confirms. It must close the modal by setting `isOpen` to false.
 * @param {number}   props.totalItemsSpam         - The total number of spam items.
 * @param {number}   props.selectedResponsesCount - The number of selected responses.
 * @return {JSX.Element} The confirmation modal.
 */
export default function EmptySpamConfirmationModal( {
	isOpen,
	onCancel,
	onConfirm,
	totalItemsSpam,
	selectedResponsesCount,
}: EmptySpamConfirmationModalProps ): JSX.Element {
	const handleOpenChange = useDismissHandler( onCancel );

	const description =
		selectedResponsesCount > 0
			? sprintf(
					// translators: %s: the number of responses in spam
					_n(
						'%s response in spam will be deleted forever. This action cannot be undone.',
						'All %s responses in spam will be deleted forever. This action cannot be undone.',
						totalItemsSpam || 0,
						'jetpack-forms'
					),
					formatNumber( totalItemsSpam )
				)
			: __(
					'All responses in spam will be deleted forever. This action cannot be undone.',
					'jetpack-forms'
				);

	return (
		<AlertDialog.Root open={ isOpen } onOpenChange={ handleOpenChange } onConfirm={ onConfirm }>
			<AlertDialog.Popup
				intent="irreversible"
				title={ __( 'Delete forever', 'jetpack-forms' ) }
				description={ description }
				confirmButtonText={ __( 'Delete', 'jetpack-forms' ) }
			/>
		</AlertDialog.Root>
	);
}
