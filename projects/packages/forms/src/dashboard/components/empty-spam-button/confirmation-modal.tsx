/**
 * External dependencies
 */
import { formatNumber } from '@automattic/number-formatters';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __, _n, sprintf } from '@wordpress/i18n';

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
 * @param {Function} props.onConfirm              - Function to call when the user confirms.
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
					  ) }
			</p>
		</ConfirmDialog>
	);
}
