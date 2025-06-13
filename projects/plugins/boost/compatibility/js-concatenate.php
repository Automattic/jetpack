<?php
/**
 * Exclude known scripts that causes problem when concatenated.
 */

namespace Automattic\Jetpack_Boost\Compatibility\JS_Concatenate;

function maybe_do_not_concat( $do_concat, $handle ) {
	$excluded_handles = array(
		// Plugin: `event-tickets`
		'tribe-tickets-block',
		'tribe-tickets-provider',
		// Plugin: `woocommerce-shipping`
		'woocommerce-shipping-checkout-address-validation',
		// Plugin: `depay-payments-for-woocommerce`
		'DEPAY_WC_WIDGETS',
		// Plugin: `woocommerce-bookings`
		'wc-bookings-booking-form',
	);

	if ( in_array( $handle, $excluded_handles, true ) ) {
		return false;
	}

	return $do_concat;
}

add_filter( 'js_do_concat', __NAMESPACE__ . '\maybe_do_not_concat', 10, 2 );
