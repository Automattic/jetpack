<?php
/**
 * Sitewide plan-expiry notices: shared infrastructure loader.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// @codeCoverageIgnoreStart
require_once __DIR__ . '/class-expiry-data.php';
require_once __DIR__ . '/class-expiry-notice-dismiss.php';
// @codeCoverageIgnoreEnd

// @codeCoverageIgnoreStart -- shadowed by the test stub in tests/lib/functions-wordpress.php.
if ( ! function_exists( 'wpcom_expiry_get_purchases' ) ) {
	/**
	 * Source of purchase data for the expiry-notices feature. Pre-definable
	 * by a test mu-plugin without redeclaring `wpcom_get_site_purchases()`
	 * (which has no `function_exists` guard upstream and would fatal).
	 *
	 * @return array
	 *
	 * @phan-suppress PhanRedefineFunction -- phan sees both this and the test stub as definitions even though only one loads at runtime.
	 */
	function wpcom_expiry_get_purchases() {
		if ( function_exists( 'wpcom_get_site_purchases' ) ) {
			return wpcom_get_site_purchases();
		}
		return array();
	}
}
// @codeCoverageIgnoreEnd

/**
 * Register the dismiss meta keys. Gated on admin / REST so we don't pay the
 * register_meta cost on every front-end request.
 */
function wpcom_expiry_notices_register_meta() {
	if ( ! is_admin() && ! ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}
	\Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss::register_user_meta();
}
add_action( 'init', 'wpcom_expiry_notices_register_meta' ); // @codeCoverageIgnore
