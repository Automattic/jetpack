<?php
/**
 * One-shot deactivation endpoint surfaced by the fatal error screen.
 *
 * The admin-facing fatal screen can offer a "Deactivate this plugin" button;
 * clicking it lands here. We run as early as possible in the request (at file
 * load time, before the regular plugin-include pass) so we can:
 *
 *   1) Persist the removal in the active_plugins option.
 *   2) Redirect the admin to wp-admin/plugins.php and exit immediately —
 *      no further plugins are included in this request, so a *second* broken
 *      plugin in active_plugins can't fatal before we save and redirect.
 *
 * Security model:
 *
 * We cannot use wp_create_nonce() / check_admin_referer() because pluggable.php
 * hasn't loaded yet at this point in the request. Instead, the URL is signed
 * with an HMAC over (plugin, expiry, logged_in_cookie_value) using AUTH_SALT.
 * Requiring the current logged-in cookie in the signature binds the URL to a
 * specific authenticated session — a leaked URL can't be replayed after the
 * admin logs out, and cannot be forged without AUTH_SALT.
 *
 * @package wpcomsh
 */

/**
 * Validate the request and, if trusted, persist the deactivation and redirect
 * to wp-admin/plugins.php before the regular plugin-load pass runs.
 *
 * @return void
 */
function wpcomsh_fatal_maybe_deactivate_plugin() {
	// Nonces aren't usable in this endpoint (pluggable.php hasn't loaded yet);
	// we validate an HMAC signature below instead. The early-return check only
	// reads the parameter *presence* — actual values are validated after.
	// phpcs:ignore WordPress.Security.NonceVerification.Missing
	if ( empty( $_POST['wpcomsh_deactivate'] ) || empty( $_POST['wpcomsh_sig'] ) || empty( $_POST['wpcomsh_exp'] ) ) {
		return;
	}
	if ( ! defined( 'AUTH_SALT' ) ) {
		return;
	}
	// Cookie constants (LOGGED_IN_COOKIE etc.) are defined later in wp-settings.php
	// — between muplugins_loaded and active_plugins iteration. At mu-plugin load
	// time they don't exist yet, but wp_cookie_constants() is already available.
	if ( ! defined( 'LOGGED_IN_COOKIE' ) && function_exists( 'wp_cookie_constants' ) ) {
		wp_cookie_constants();
	}
	if ( ! defined( 'LOGGED_IN_COOKIE' ) ) {
		return;
	}

	// Nonces aren't usable here because pluggable.php hasn't loaded yet — we
	// validate an HMAC signature below instead. Inputs are constrained by
	// regex / cast to int before being trusted.
	// phpcs:disable WordPress.Security.NonceVerification.Missing
	$plugin = isset( $_POST['wpcomsh_deactivate'] ) ? sanitize_text_field( wp_unslash( $_POST['wpcomsh_deactivate'] ) ) : '';
	$sig    = isset( $_POST['wpcomsh_sig'] ) ? sanitize_text_field( wp_unslash( $_POST['wpcomsh_sig'] ) ) : '';
	$exp    = isset( $_POST['wpcomsh_exp'] ) ? (int) $_POST['wpcomsh_exp'] : 0;
	// phpcs:enable WordPress.Security.NonceVerification.Missing

	// Reject expired or malformed plugin paths (no traversal; slug/file.php only).
	if ( $exp < time() ) {
		return;
	}
	if ( ! preg_match( '#^[a-zA-Z0-9][a-zA-Z0-9_.-]*/[a-zA-Z0-9][a-zA-Z0-9_.-]*\.php$#', $plugin ) ) {
		return;
	}

	// The cookie is used only as a per-session secret inside an HMAC we
	// never output; sanitization would destroy the byte-for-byte match.
	$cookie_value = isset( $_COOKIE[ LOGGED_IN_COOKIE ] )
		? (string) wp_unslash( $_COOKIE[ LOGGED_IN_COOKIE ] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	if ( '' === $cookie_value ) {
		return;
	}

	$expected = hash_hmac( 'sha256', $plugin . '|' . $exp . '|' . $cookie_value, (string) AUTH_SALT );
	if ( ! hash_equals( $expected, $sig ) ) {
		return;
	}

	// HMAC proves the request originated from a screen we rendered to the same
	// authenticated session, but we still want core's per-plugin capability
	// gate (matches wp-admin/plugins.php). user_can() needs the user/cap stack
	// loaded, which the helper bootstraps for us.
	$user_id = wpcomsh_fatal_current_user_id();
	if ( ! $user_id || ! user_can( $user_id, 'deactivate_plugin', $plugin ) ) {
		return;
	}

	// Persist + redirect immediately at mu-plugin load, before core enters the
	// regular plugin-include pass. Deferring this to plugins_loaded would mean
	// any *other* broken plugin in active_plugins fatals before our callback
	// runs — the option update never lands and the user is stuck looping on
	// the same fatal screen with no persisted state.
	$active = get_option( 'active_plugins', array() );
	if ( is_array( $active ) && in_array( $plugin, $active, true ) ) {
		update_option( 'active_plugins', array_values( array_diff( $active, array( $plugin ) ) ) );
	}

	// pluggable.php (and therefore wp_safe_redirect) isn't loaded yet at
	// mu-plugin time. We're redirecting to a known same-origin admin URL, so
	// a plain Location header is sufficient — no host whitelist needed.
	header(
		'Location: ' . admin_url( 'plugins.php?wpcomsh_deactivated=' . rawurlencode( $plugin ) )
	);
	exit;
}

wpcomsh_fatal_maybe_deactivate_plugin();
