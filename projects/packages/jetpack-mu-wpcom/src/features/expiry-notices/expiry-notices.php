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
 * Whether the new expiry notices are switched on for this site.
 *
 * The rollout that gated this is finished, so the answer is yes unless something
 * says otherwise. Kept as a function rather than inlined because it is the one
 * predicate both halves of the swap read: the notices themselves, and the
 * suppression of the ones they replace -- wpcomsh's Atomic banner here, and the
 * legacy plan-renew prompt on the WordPress.com side. They must never disagree,
 * or a site ends up showing both notices or neither.
 */
function wpcom_expiry_notices_is_enabled_for_site(): bool {
	/**
	 * Filters whether the new expiry notices are enabled for this site.
	 *
	 * Both the new notices and the suppression of the ones they replace read
	 * this, so overriding it moves the whole swap together. Left in place after
	 * the rollout as the way to hold a single site back.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $enabled    Whether the site is on the new expiry notices.
	 * @param int  $percentage Share of sites the rollout targets. Always 100 now
	 *                         that it is complete; passed so that callbacks
	 *                         declaring both parameters keep working.
	 */
	return (bool) apply_filters( 'wpcom_expiry_notices_enabled', true, 100 );
}

/**
 * Load the wp-admin banner, unless something has held this site back.
 *
 * On `init` rather than at file load. This file is required on `plugins_loaded`,
 * and both of the banner's own hooks fire later still, so waiting keeps the
 * require off the bootstrap at no cost.
 */
function wpcom_expiry_notices_maybe_load_admin_banner() {
	if ( is_admin() && wpcom_expiry_notices_is_enabled_for_site() ) {
		require_once __DIR__ . '/admin-banner.php';
	}
}
add_action( 'init', 'wpcom_expiry_notices_maybe_load_admin_banner' ); // @codeCoverageIgnore

/**
 * Register the dismiss meta keys. Gated on admin / REST so we don't pay the
 * register_meta cost on every front-end request.
 */
function wpcom_expiry_notices_register_meta() {
	if ( ! is_admin() && ! ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}
	if ( ! wpcom_expiry_notices_is_enabled_for_site() ) {
		return;
	}
	\Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss::register_user_meta();
}
add_action( 'init', 'wpcom_expiry_notices_register_meta' ); // @codeCoverageIgnore
