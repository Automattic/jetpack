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
 * Share of sites the new expiry notices are switched on for, as a percentage.
 *
 * The notices replace older per-host banners, so this number governs both
 * sides of the swap: a site inside the share gets the new notices and must
 * have the old ones suppressed, a site outside keeps the old ones and must not
 * see the new. Every surface making that decision has to call
 * `wpcom_expiry_notices_is_enabled_for_site()` rather than re-derive it, or the
 * two halves drift and a site ends up with both notices or neither.
 */
function wpcom_expiry_notices_rollout_percentage(): int {
	return 0;
}

/**
 * The WP.com blog ID, or 0 when it can't be established.
 *
 * Deliberately not `get_wpcom_blog_id()`: that falls back to the *local* blog
 * ID on Atomic when `jetpack_options['id']` isn't readable, which is 1 on a
 * single-site install. A wrong-but-plausible ID is worse than none here — 1
 * lands inside every bucket, so each site with an unreadable option would
 * quietly join the rollout. Returning 0 keeps them out instead.
 */
function wpcom_expiry_notices_wpcom_blog_id(): int {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		return (int) get_current_blog_id();
	}

	$jetpack_options = get_option( 'jetpack_options' );
	if ( is_array( $jetpack_options ) && ! empty( $jetpack_options['id'] ) ) {
		return (int) $jetpack_options['id'];
	}

	return 0;
}

/**
 * Per-site override for the rollout, or null when the site hasn't got one.
 *
 * Set on individual sites to pull one into the rollout early, or hold one out,
 * regardless of the bucket its blog ID falls in. Three-state on purpose:
 * absent means "follow the share", which is not the same as "stay out", so
 * clearing the option returns a site to the normal rule rather than pinning it
 * off forever.
 *
 * Reading a missing option is served from the `notoptions` cache, so sites
 * without one pay nothing for this.
 */
function wpcom_expiry_notices_rollout_override(): ?bool {
	$override = get_option( 'wpcom_expiry_notices_enabled', null );
	if ( null === $override ) {
		return null;
	}

	if ( is_string( $override ) ) {
		$override = strtolower( trim( $override ) );
	}

	/*
	 * Parsed against known values rather than through wp_validate_boolean(),
	 * which reads every non-empty string as true -- "no" and "off" included.
	 * This option is typed by hand on individual sites, so a value meant to
	 * hold a site out that quietly opts it in is the wrong way to be wrong.
	 */
	if ( in_array( $override, array( true, 1, '1', 'true', 'yes', 'on' ), true ) ) {
		return true;
	}
	if ( in_array( $override, array( false, 0, '0', 'false', 'no', 'off' ), true ) ) {
		return false;
	}

	// An empty or unrecognised value is a mistake, not an instruction. Leave
	// the site on the normal rule rather than guessing which way it meant.
	return null;
}

/**
 * Whether this site is in the share of sites running the new expiry notices.
 *
 * Also narrows on the reader's locale, so despite the name this is not answered
 * from the site alone.
 *
 * Buckets on the blog ID modulo 100 rather than modulo the share itself, so
 * raising the percentage only ever adds sites. Modulo-the-share does not hold
 * that property — going from 10% as `id % 10 === 0` to 33% as `id % 3 === 0`
 * drops blog 10 — and a site that gained the new notices only to lose them
 * again would flip back to the old ones mid-rollout.
 */
function wpcom_expiry_notices_is_enabled_for_site(): bool {
	$percentage = wpcom_expiry_notices_rollout_percentage();
	$override   = wpcom_expiry_notices_rollout_override();

	if ( $percentage <= 0 ) {
		// Zero means zero, including for hand-picked sites. Checked before the
		// override so that stopping the rollout is one number, and no site
		// carrying the option stays on the new notices.
		$enabled = false;
	} elseif ( null !== $override ) {
		// Hand-picked, either way. Pulls a site in ahead of its bucket, or
		// holds one out of a bucket it already falls in.
		$enabled = $override;
	} elseif ( $percentage >= 100 ) {
		// Fully rolled out. Answered before resolving an ID so that a site
		// whose blog ID can't be read still gets the notices at the end of the
		// ramp, rather than being stranded outside it forever.
		$enabled = true;
	} else {
		$blog_id = wpcom_expiry_notices_wpcom_blog_id();
		$enabled = $blog_id > 0 && ( $blog_id % 100 ) < $percentage;
	}

	// Narrow the ramp again to readers in an English locale, while the
	// translations catch up.
	if ( $enabled ) {
		$locale  = get_user_locale();
		$enabled = 'en' === $locale || 0 === strpos( $locale, 'en_' );
	}

	/**
	 * Filters whether the new expiry notices are enabled for this site.
	 *
	 * Both the new notices and the suppression of the ones they replace read
	 * this, so an override moves the whole swap together. Shares its name with
	 * the per-site option and runs after it, so code can still override a site
	 * that has one set.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $enabled Whether the site is in the rollout.
	 * @param int  $percentage Share of sites the rollout currently targets.
	 */
	return (bool) apply_filters( 'wpcom_expiry_notices_enabled', $enabled, $percentage );
}

/**
 * Load the wp-admin banner for sites in the rollout.
 *
 * On `init` because the gate reads the user's locale, and the current user is
 * not settled when this file is required on `plugins_loaded`. The banner's own
 * hooks fire later still, so nothing is lost by waiting.
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
