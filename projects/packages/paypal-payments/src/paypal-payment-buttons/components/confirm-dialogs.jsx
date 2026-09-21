/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The shared confirmation dialogs.
 *
 * @package
 */

import {
	Button,
	CheckboxControl,
	Modal,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- Experimental API; stable ConfirmDialog not yet exported by @wordpress/components.
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * The delete confirmation. PayPal cannot pause or restore a payment link, so
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
			title={ __( 'Delete payment link', 'jetpack-paypal-payments' ) }
			onRequestClose={ onCancel }
			size="medium"
			className="jetpack-paypal-payment-buttons__delete-dialog"
		>
			<p>
				{ __(
					'This permanently deletes the payment link from your PayPal account. PayPal cannot pause, deactivate, or restore it.',
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
 * The same disconnect the PayPal Connection panel runs, worded for the menu.
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
 * PayPal has not been sent.
 *
 * @param {object}   props           - Component props.
 * @param {boolean}  props.canSave   - Whether the form is valid, so the payment can be written.
 * @param {boolean}  props.isSaving  - Whether the payment is being written.
 * @param {Function} props.onSave    - Write the payment, then leave.
 * @param {Function} props.onDiscard - Put the link back as it was, then leave.
 * @param {Function} props.onCancel  - Close and stay on the form.
 * @return {Element} The dialog.
 */
export function UnsavedChangesDialog( { canSave, isSaving, onSave, onDiscard, onCancel } ) {
	return (
		<Modal
			title={ __( 'Changes made', 'jetpack-paypal-payments' ) }
			onRequestClose={ onCancel }
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
 * The confirmation dialogs for destructive actions — delete, disconnect and log out.
 *
 * @param {object}   props                          - Component props.
 * @param {boolean}  props.showDeleteConfirm        - Whether the delete confirmation is open.
 * @param {Function} props.setShowDeleteConfirm     - Setter for the delete confirmation.
 * @param {boolean}  props.showDisconnectConfirm    - Whether the disconnect confirmation is open.
 * @param {Function} props.setShowDisconnectConfirm - Setter for the disconnect confirmation.
 * @param {boolean}  props.showLogOutConfirm        - Whether the log-out confirmation is open.
 * @param {Function} props.setShowLogOutConfirm     - Setter for the log-out confirmation.
 * @param {Function} props.executeDeleteButton      - Delete the payment after the user confirms.
 * @param {Function} props.executeDisconnect        - Disconnect PayPal after the user confirms.
 * @return {Element} The confirmation dialogs.
 */
export default function ConfirmDialogs( {
	showDeleteConfirm,
	setShowDeleteConfirm,
	showDisconnectConfirm,
	setShowDisconnectConfirm,
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
			{ showDisconnectConfirm && (
				<ConfirmDialog
					title={ __( 'Disconnect PayPal Account', 'jetpack-paypal-payments' ) }
					confirmButtonText={ __( 'Disconnect', 'jetpack-paypal-payments' ) }
					onConfirm={ executeDisconnect }
					onCancel={ () => setShowDisconnectConfirm( false ) }
				>
					<div className="jetpack-paypal-payment-buttons__confirm-body">
						<p>
							{ __(
								'This disconnects PayPal for the whole site, not just this block.',
								'jetpack-paypal-payments'
							) }
						</p>
						<ul>
							<li>
								{ __(
									'Every payment button on this site will need PayPal reconnected before it can be edited or deleted.',
									'jetpack-paypal-payments'
								) }
							</li>
							<li>
								{ __(
									'Buttons you have already published keep working for buyers.',
									'jetpack-paypal-payments'
								) }
							</li>
						</ul>
					</div>
				</ConfirmDialog>
			) }
		</>
	);
}
