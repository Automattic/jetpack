/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The shared confirmation dialogs.
 *
 * @package
 */

import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- Experimental API; stable ConfirmDialog not yet exported by @wordpress/components.
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
				<ConfirmDialog
					title={ __( 'Delete Payment Button', 'jetpack-paypal-payments' ) }
					confirmButtonText={ __( 'Delete Permanently', 'jetpack-paypal-payments' ) }
					onConfirm={ executeDeleteButton }
					onCancel={ () => setShowDeleteConfirm( false ) }
				>
					{ __(
						'This will permanently delete your payment button. Any links, QR codes, or embedded buttons using this payment will stop working and cannot be recovered.',
						'jetpack-paypal-payments'
					) }
				</ConfirmDialog>
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
