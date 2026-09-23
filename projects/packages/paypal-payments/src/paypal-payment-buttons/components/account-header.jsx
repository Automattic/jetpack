/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The account header and its menu.
 *
 * @package
 */

import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { createPortal } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external, login, moreVertical } from '@wordpress/icons';
import { useBlockCardNode } from '../hooks/use-block-card-node';
import PayPalIcon from '../icon';

// PayPal's settings for the no-code payment links this block creates, per environment.
const CHECKOUT_SETTINGS_URL = {
	sandbox: 'https://www.sandbox.paypal.com/ncp/settings',
	production: 'https://www.paypal.com/ncp/settings',
};

// PayPal's merchant activity list, per environment. The consumer list at
// /myaccount/transactions/ is a different page.
const TRANSACTIONS_URL = {
	sandbox: 'https://www.sandbox.paypal.com/unifiedtransactions/',
	production: 'https://www.paypal.com/unifiedtransactions/',
};

/**
 * The PayPal account header: the block's name and the account menu.
 *
 * The design puts this row where core draws its block card. Core offers no slot
 * there, so the row goes in by portal and editor.scss hides the card's contents.
 *
 * @param {object}   props              - Component props.
 * @param {boolean}  props.isSelected   - Whether this block is the selected one.
 * @param {string}   props.environment  - 'production' or 'sandbox'.
 * @param {string}   props.accountEmail - The connected PayPal email, if we have one.
 * @param {Function} props.onLogOut     - Open the log-out confirmation.
 * @return {Element|null} The header, inside the block card.
 */
export default function PayPalAccountHeader( { isSelected, environment, accountEmail, onLogOut } ) {
	const blockCard = useBlockCardNode( isSelected );

	if ( ! blockCard ) {
		return null;
	}

	return createPortal(
		<div className="jetpack-paypal-payment-buttons__account-header">
			<span className="jetpack-paypal-payment-buttons__account-header-icon">{ PayPalIcon }</span>
			<h2 className="jetpack-paypal-payment-buttons__account-header-title">
				{ __( 'PayPal Payment Button', 'jetpack-paypal-payments' ) }
			</h2>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'PayPal account options', 'jetpack-paypal-payments' ) }
				popoverProps={ {
					placement: 'bottom-end',
					className: 'jetpack-paypal-payment-buttons__account-menu',
				} }
				toggleProps={ { size: 'small' } }
			>
				{ ( { onClose } ) => (
					<>
						<MenuGroup>
							<MenuItem
								icon={ external }
								iconPosition="left"
								href={ CHECKOUT_SETTINGS_URL[ environment ] || CHECKOUT_SETTINGS_URL.production }
								target="_blank"
								rel="noopener noreferrer"
								onClick={ onClose }
							>
								{ __( 'Customize checkout settings', 'jetpack-paypal-payments' ) }
							</MenuItem>
							<MenuItem
								icon={ external }
								iconPosition="left"
								href={ TRANSACTIONS_URL[ environment ] || TRANSACTIONS_URL.production }
								target="_blank"
								rel="noopener noreferrer"
								onClick={ onClose }
							>
								{ __( 'View transactions', 'jetpack-paypal-payments' ) }
							</MenuItem>
						</MenuGroup>
						{ /* A second group, so MenuGroup draws the divider the design has here. */ }
						<MenuGroup>
							<MenuItem
								isDestructive
								icon={ login }
								iconPosition="left"
								info={ accountEmail || undefined }
								onClick={ () => {
									onClose();
									onLogOut();
								} }
							>
								{ __( 'Log out', 'jetpack-paypal-payments' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
		</div>,
		blockCard
	);
}
