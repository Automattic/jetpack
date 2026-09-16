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
 * The confirmation dialogs for destructive actions — delete and disconnect.
 *
 * @param {object}   props                          - Component props.
 * @param {boolean}  props.showDeleteConfirm        - Whether the delete confirmation is open.
 * @param {Function} props.setShowDeleteConfirm     - Setter for the delete confirmation.
 * @param {boolean}  props.showDisconnectConfirm    - Whether the disconnect confirmation is open.
 * @param {Function} props.setShowDisconnectConfirm - Setter for the disconnect confirmation.
 * @param {Function} props.executeDeleteButton      - Delete the payment after the user confirms.
 * @param {Function} props.executeDisconnect        - Disconnect PayPal after the user confirms.
 * @return {Element} The confirmation dialogs.
 */
export default function ConfirmDialogs( {
	showDeleteConfirm,
	setShowDeleteConfirm,
	showDisconnectConfirm,
	setShowDisconnectConfirm,
	executeDeleteButton,
	executeDisconnect,
} ) {
	return (
		<>
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
