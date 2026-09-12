/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The block inspector sidebar.
 *
 * @package
 */

import { InspectorControls } from '@wordpress/block-editor';
import { Button, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * The Settings tab — connection info.
 *
 * Embed as and everything that styles the output live in the Styles tab, in
 * components/format-controls.jsx.
 *
 * @param {object}   props                    - Component props.
 * @param {string}   props.resourceId         - The PayPal resource ID attribute.
 * @param {boolean}  props.isConnected        - Whether the site is connected to PayPal.
 * @param {string}   props.environment        - 'production' or 'sandbox'.
 * @param {Function} props.setShowReconnect   - Setter for the reconnect request.
 * @param {boolean}  props.isBusy             - Whether a create or update request is in flight.
 * @param {Function} props.handleDeleteButton - Delete the PayPal payment.
 * @param {Function} props.handleDisconnect   - Disconnect the PayPal account.
 * @param {boolean}  props.hasButton          - Whether the block has a saved button.
 * @return {Element} The Settings tab.
 */
export default function PayPalInspectorControls( {
	resourceId,
	isConnected,
	environment,
	setShowReconnect,
	isBusy,
	handleDeleteButton,
	handleDisconnect,
	hasButton,
} ) {
	return (
		<InspectorControls>
			{ hasButton && (
				<PanelBody
					title={ __( 'PayPal Connection', 'jetpack-paypal-payments' ) }
					initialOpen={ false }
				>
					<p>
						{ __( 'Resource ID:', 'jetpack-paypal-payments' ) } <code>{ resourceId }</code>
					</p>
					<p>
						{ __( 'Environment:', 'jetpack-paypal-payments' ) } <strong>{ environment }</strong>
					</p>
					<div className="jetpack-paypal-payment-buttons__destructive-actions">
						<Button
							variant="secondary"
							isDestructive
							onClick={ handleDeleteButton }
							disabled={ isBusy || ! isConnected }
						>
							{ __( 'Delete Button', 'jetpack-paypal-payments' ) }
						</Button>
						{ isConnected ? (
							<Button variant="secondary" isDestructive onClick={ handleDisconnect }>
								{ __( 'Disconnect', 'jetpack-paypal-payments' ) }
							</Button>
						) : (
							<Button variant="secondary" onClick={ () => setShowReconnect( true ) }>
								{ __( 'Reconnect', 'jetpack-paypal-payments' ) }
							</Button>
						) }
					</div>
				</PanelBody>
			) }

			{ ! hasButton && (
				<PanelBody
					title={ __( 'PayPal Connection', 'jetpack-paypal-payments' ) }
					initialOpen={ false }
				>
					<p>
						{ __( 'Environment:', 'jetpack-paypal-payments' ) } <strong>{ environment }</strong>
					</p>
					{ isConnected ? (
						<Button variant="secondary" isDestructive onClick={ handleDisconnect }>
							{ __( 'Disconnect PayPal', 'jetpack-paypal-payments' ) }
						</Button>
					) : (
						<Button variant="secondary" onClick={ () => setShowReconnect( true ) }>
							{ __( 'Reconnect PayPal', 'jetpack-paypal-payments' ) }
						</Button>
					) }
				</PanelBody>
			) }
		</InspectorControls>
	);
}
