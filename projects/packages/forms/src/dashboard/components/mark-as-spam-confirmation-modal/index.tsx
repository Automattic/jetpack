/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { AlertDialog } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import useDismissHandler from '../../hooks/use-dismiss-handler';
import type { JSX } from 'react';

interface MarkAsSpamConfirmationModalProps {
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => Promise< void | { error: string } >;
	message: string;
}

/**
 * Confirmation modal for marking a response as spam.
 *
 * @param {object}   props           - Component props.
 * @param {boolean}  props.isOpen    - Whether the modal is open.
 * @param {Function} props.onCancel  - Function to call when the user cancels.
 * @param {Function} props.onConfirm - Function to call when the user confirms. It must close the modal by setting `isOpen` to false once it succeeds, or resolve to `{ error }` to show that message instead.
 * @param {string}   props.message   - The confirmation question.
 * @return {JSX.Element} The confirmation modal.
 */
export default function MarkAsSpamConfirmationModal( {
	isOpen,
	onCancel,
	onConfirm,
	message,
}: MarkAsSpamConfirmationModalProps ): JSX.Element {
	const handleOpenChange = useDismissHandler( onCancel );

	return (
		<AlertDialog.Root open={ isOpen } onOpenChange={ handleOpenChange } onConfirm={ onConfirm }>
			<AlertDialog.Popup title={ __( 'Mark as spam', 'jetpack-forms' ) } description={ message } />
		</AlertDialog.Root>
	);
}
