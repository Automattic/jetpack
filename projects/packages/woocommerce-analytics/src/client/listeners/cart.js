/* global jQuery */

/**
 * Attach event listeners for cart page
 *
 * @param {object} analytics - Analytics object
 */
export function initListeners( analytics ) {
	/**
	 * On the cart page, add an event listener for product removal clicks.
	 * We listen at div.woocommerce because the cart 'form' contents get forcibly
	 * updated, and subsequent removals from cart would then not have this click
	 * handler attached.
	 */
	jQuery( 'div.woocommerce' ).on( 'click', 'a.remove', function () {
		const productID = jQuery( this ).data( 'product_id' );
		const quantity = jQuery( this ).parent().parent().find( '.qty' ).val();
		const productDetails = {
			id: productID,
			quantity: quantity ? quantity : '1',
		};
		analytics.recordEvent( 'remove_from_cart', {
			pi: productDetails.id,
			pq: productDetails.quantity,
		} );
	} );
}
