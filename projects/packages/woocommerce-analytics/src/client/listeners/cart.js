/* global jQuery */

/**
 * Attach event listeners for cart page
 *
 * @param {Function} recordEvent - Record event function
 */
export function initListeners( recordEvent ) {
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
		recordEvent( 'remove_from_cart', {
			pi: productDetails.id,
			pq: productDetails.quantity,
		} );
	} );

	/**
	 * Trigger cart remove event.
	 */
	function trigger_cart_remove() {
		const cartItems = document.querySelectorAll( '.cart_item' );
		[ ...cartItems ].forEach( function ( item ) {
			const qtyInput = item.querySelector( 'input.qty' );
			if ( qtyInput && qtyInput.value === '0' ) {
				const productRemoveLink = item.querySelector( '.product-remove a' );
				const productID = productRemoveLink ? productRemoveLink.dataset.product_id : null;
				recordEvent( 'remove_from_cart', {
					pi: productID,
				} );
			}
		} );
	}

	/**
	 * Listen for clicks on the "Update Cart" button to know if an item has been removed by
	 * updating its quantity to zero
	 */
	document
		.querySelector( 'button[name=update_cart]' )
		?.addEventListener( 'click', trigger_cart_remove );

	// The duplicated listener is needed because updated_wc_div replaces all the DOM and then the initial listener stops working.
	document.body.onupdated_wc_div = function () {
		document
			.querySelector( 'button[name=update_cart]' )
			?.addEventListener( 'click', trigger_cart_remove );
	};
}
