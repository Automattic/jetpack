/* global jQuery */

/**
 * Attach event listeners for my account page
 *
 * @param {Function} recordEvent - Record event function
 */
export function initListeners( recordEvent ) {
	jQuery( '.woocommerce-MyAccount-navigation-link--customer-logout' ).on( 'click', function () {
		recordEvent( 'my_account_tab_click', {
			tab: 'logout',
		} );
	} );
}
