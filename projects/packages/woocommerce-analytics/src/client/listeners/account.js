/* global jQuery */

/**
 * Attach event listeners for my account page
 *
 * @param {object} analytics - Analytics object
 */
export function initListeners( analytics ) {
	jQuery( '.woocommerce-MyAccount-navigation-link--customer-logout' ).on( 'click', function () {
		analytics.recordEvent( 'my_account_tab_click', {
			tab: 'logout',
		} );
	} );
}
