/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The account header and its menu.
 *
 * @package
 */

import { getAdminUrl } from '@automattic/jetpack-script-data';
import { DropdownMenu, MenuGroup, MenuItem, VisuallyHidden } from '@wordpress/components';
import { createPortal } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { external, home, login, moreVertical } from '@wordpress/icons';
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

// PayPal's help article on issuing refunds. The block does not refund through the API,
// so PayPal's certification asks that sellers be pointed at how to do it themselves.
const REFUND_HELP_URL = 'https://www.paypal.com/us/cshelp/article/how-do-i-issue-a-refund-help101';

// The admin page that lists every payment link on the site.
const MANAGE_LINKS_PATH = 'admin.php?page=paypal-payment-links';

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

	// Screen reader text for the items that open in a new tab.
	const opensInNewTab = (
		<VisuallyHidden as="span">
			{
				/* translators: accessibility text */
				__( '(opens in a new tab)', 'jetpack-paypal-payments' )
			}
		</VisuallyHidden>
	);

	// The line under Log out: the email, with "Sandbox" in front for a sandbox account.
	let logOutInfo = accountEmail || undefined;
	if ( environment === 'sandbox' ) {
		logOutInfo = accountEmail
			? sprintf(
					/* translators: %s: the connected PayPal account's email. Sandbox is PayPal's test environment. */
					__( 'Sandbox • %s', 'jetpack-paypal-payments' ),
					accountEmail
				)
			: /* translators: PayPal's test environment */
				__( 'Sandbox', 'jetpack-paypal-payments' );
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
								{ opensInNewTab }
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
								{ opensInNewTab }
							</MenuItem>
							<MenuItem
								icon={ external }
								iconPosition="left"
								href={ REFUND_HELP_URL }
								target="_blank"
								rel="noopener noreferrer"
								onClick={ onClose }
							>
								{ __( 'How to issue a refund', 'jetpack-paypal-payments' ) }
								{ opensInNewTab }
							</MenuItem>
							<MenuItem
								icon={ home }
								iconPosition="left"
								href={ getAdminUrl( MANAGE_LINKS_PATH ) }
								target="_blank"
								rel="noopener noreferrer"
								onClick={ onClose }
							>
								{ __( 'Manage all links and buttons', 'jetpack-paypal-payments' ) }
								{ opensInNewTab }
							</MenuItem>
						</MenuGroup>
						{ /* A second group, so MenuGroup draws the divider the design has here. */ }
						<MenuGroup>
							<MenuItem
								isDestructive
								icon={ login }
								iconPosition="left"
								info={ logOutInfo }
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
