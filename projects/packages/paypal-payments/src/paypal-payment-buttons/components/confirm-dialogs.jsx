/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The shared confirmation dialogs.
 *
 * @package
 */

import { Button, CheckboxControl, Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// PayPal's certification checklist prescribes this sentence for the log-out confirmation.
const disconnectWarning = __(
	'Disconnecting your PayPal account will prevent you from offering PayPal services and products on your website. Do you wish to continue?',
	'jetpack-paypal-payments'
);

/**
 * The delete confirmation. PayPal cannot pause or restore a payment button, so
 * the merchant has to acknowledge that before the delete button is enabled.
 *
 * @param {object}   props           - Component props.
 * @param {Function} props.onConfirm - Delete the payment link.
 * @param {Function} props.onCancel  - Close without deleting.
 * @return {Element} The dialog.
 */
export function DeleteLinkDialog( { onConfirm, onCancel } ) {
	const [ acknowledged, setAcknowledged ] = useState( false );

	return (
		<Modal
			title={ __( 'Delete payment button', 'jetpack-paypal-payments' ) }
			onRequestClose={ onCancel }
			size="medium"
			className="jetpack-paypal-payment-buttons__delete-dialog"
		>
			<p>
				{ __(
					'This permanently deletes the payment button from your PayPal account. PayPal cannot pause, deactivate, or restore it.',
					'jetpack-paypal-payments'
				) }
			</p>
			<p>
				{ __(
					'Anyone who opens the link afterwards, whether from this block, another post, an email, or a printed QR code, lands on a PayPal "not found" page instead of a checkout.',
					'jetpack-paypal-payments'
				) }
			</p>
			<CheckboxControl
				__nextHasNoMarginBottom
				label={ __( 'I understand this cannot be undone.', 'jetpack-paypal-payments' ) }
				checked={ acknowledged }
				onChange={ setAcknowledged }
			/>
			<div className="jetpack-paypal-payment-buttons__delete-dialog-actions">
				<Button variant="tertiary" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack-paypal-payments' ) }
				</Button>
				<Button variant="primary" isDestructive disabled={ ! acknowledged } onClick={ onConfirm }>
					{ __( 'Delete permanently', 'jetpack-paypal-payments' ) }
				</Button>
			</div>
		</Modal>
	);
}

/**
 * The account menu's log-out confirmation.
 *
 * @param {object}   props           - Component props.
 * @param {Function} props.onConfirm - Log out of PayPal.
 * @param {Function} props.onCancel  - Close without logging out.
 * @return {Element} The dialog.
 */
export function LogOutDialog( { onConfirm, onCancel } ) {
	return (
		<Modal
			title={ __( 'Log out from PayPal', 'jetpack-paypal-payments' ) }
			onRequestClose={ onCancel }
			size="medium"
			className="jetpack-paypal-payment-buttons__log-out-dialog"
		>
			<p>{ disconnectWarning }</p>
			<p>
				{ __(
					'You won’t be able to add, edit, or view payment buttons while using WordPress after you log out of PayPal.',
					'jetpack-paypal-payments'
				) }
			</p>
			<div className="jetpack-paypal-payment-buttons__log-out-dialog-actions">
				<Button __next40pxDefaultSize variant="tertiary" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack-paypal-payments' ) }
				</Button>
				<Button __next40pxDefaultSize variant="primary" onClick={ onConfirm }>
					{ __( 'Log out', 'jetpack-paypal-payments' ) }
				</Button>
			</div>
		</Modal>
	);
}

/**
 * The unsaved-changes confirmation, for leaving a saved link's form with changes
 * the post has not saved.
 *
 * @param {object}   props           - Component props.
 * @param {boolean}  props.canSave   - Whether the form is valid, so the post can be saved.
 * @param {boolean}  props.isSaving  - Whether the post is being saved; the dialog stays up until it is.
 * @param {Function} props.onSave    - Save the post, then leave.
 * @param {Function} props.onDiscard - Put the link back as it was, then leave.
 * @param {Function} props.onCancel  - Close and stay on the form.
 * @return {Element} The dialog.
 */
export function UnsavedChangesDialog( { canSave, isSaving, onSave, onDiscard, onCancel } ) {
	return (
		<Modal
			title={ __( 'Changes made', 'jetpack-paypal-payments' ) }
			onRequestClose={ () => ! isSaving && onCancel() }
			size="medium"
			className="jetpack-paypal-payment-buttons__unsaved-dialog"
		>
			<p>
				{ __(
					'Do you want to save before leaving? If not, all the changes you’ve made will be lost.',
					'jetpack-paypal-payments'
				) }
			</p>
			<div className="jetpack-paypal-payment-buttons__unsaved-dialog-actions">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onDiscard }
					disabled={ isSaving }
				>
					{ __( 'Don’t save', 'jetpack-paypal-payments' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ onSave }
					disabled={ ! canSave || isSaving }
					isBusy={ isSaving }
				>
					{ __( 'Save', 'jetpack-paypal-payments' ) }
				</Button>
			</div>
		</Modal>
	);
}

/**
 * The confirmation dialogs for destructive actions — delete and log out.
 *
 * @param {object}   props                      - Component props.
 * @param {boolean}  props.showDeleteConfirm    - Whether the delete confirmation is open.
 * @param {Function} props.setShowDeleteConfirm - Setter for the delete confirmation.
 * @param {boolean}  props.showLogOutConfirm    - Whether the log-out confirmation is open.
 * @param {Function} props.setShowLogOutConfirm - Setter for the log-out confirmation.
 * @param {Function} props.executeDeleteButton  - Delete the payment link after the user confirms.
 * @param {Function} props.executeDisconnect    - Disconnect PayPal after the user confirms.
 * @return {Element} The confirmation dialogs.
 */
export default function ConfirmDialogs( {
	showDeleteConfirm,
	setShowDeleteConfirm,
	showLogOutConfirm,
	setShowLogOutConfirm,
	executeDeleteButton,
	executeDisconnect,
} ) {
	return (
		<>
			{ showLogOutConfirm && (
				<LogOutDialog
					onConfirm={ () => {
						setShowLogOutConfirm( false );
						executeDisconnect();
					} }
					onCancel={ () => setShowLogOutConfirm( false ) }
				/>
			) }
			{ showDeleteConfirm && (
				<DeleteLinkDialog
					onConfirm={ executeDeleteButton }
					onCancel={ () => setShowDeleteConfirm( false ) }
				/>
			) }
		</>
	);
}
