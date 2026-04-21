<?php
/**
 * One-shot deactivation endpoint surfaced by the fatal error screen.
 *
 * The admin-facing fatal screen can offer a "Deactivate this plugin" button;
 * clicking it lands here. We run as early as possible in the request (at file
 * load time, before other plugins load) so we can:
 *
 *   1) Filter option_active_plugins for the current request — the broken
 *      plugin never runs, so we don't re-fatal before reaching the redirect.
 *   2) Persist the removal in the active_plugins option.
 *   3) Redirect the admin to wp-admin/plugins.php.
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
 * Validate the request and, if trusted, short-circuit the offending plugin
 * and persist its removal before the regular plugin-load pass runs.
 *
 * @return void
 */
function wpcomsh_fatal_maybe_deactivate_plugin() {
	// Nonces aren't usable in this endpoint (pluggable.php hasn't loaded yet);
	// we validate an HMAC signature below instead. The early-return check only
	// reads the parameter *presence* — actual values are validated after.
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( empty( $_GET['wpcomsh_deactivate'] ) || empty( $_GET['wpcomsh_sig'] ) || empty( $_GET['wpcomsh_exp'] ) ) {
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
	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	$plugin = isset( $_GET['wpcomsh_deactivate'] ) ? sanitize_text_field( wp_unslash( $_GET['wpcomsh_deactivate'] ) ) : '';
	$sig    = isset( $_GET['wpcomsh_sig'] ) ? sanitize_text_field( wp_unslash( $_GET['wpcomsh_sig'] ) ) : '';
	$exp    = isset( $_GET['wpcomsh_exp'] ) ? (int) $_GET['wpcomsh_exp'] : 0;
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

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

	$expected = hash_hmac( 'sha256', $plugin . '|' . $exp . '|' . $cookie_value, AUTH_SALT );
	if ( ! hash_equals( $expected, $sig ) ) {
		return;
	}

	// Drop the plugin from active_plugins for THIS request before core reads it.
	$filter_callback = function ( $active ) use ( $plugin ) {
		if ( is_array( $active ) ) {
			return array_values( array_diff( $active, array( $plugin ) ) );
		}
		return $active;
	};
	add_filter( 'option_active_plugins', $filter_callback );

	// Persist the removal and redirect as soon as the option layer is usable.
	// Remove our own filter first — otherwise get_option() returns the
	// already-stripped list and the in_array() check below fails, leaving the
	// option in its original (broken) state for future requests.
	add_action(
		'plugins_loaded',
		function () use ( $plugin, $filter_callback ) {
			remove_filter( 'option_active_plugins', $filter_callback );
			$active = get_option( 'active_plugins', array() );
			if ( is_array( $active ) && in_array( $plugin, $active, true ) ) {
				update_option( 'active_plugins', array_values( array_diff( $active, array( $plugin ) ) ) );
			}
			wp_safe_redirect(
				add_query_arg(
					array( 'wpcomsh_deactivated' => rawurlencode( $plugin ) ),
					admin_url( 'plugins.php' )
				)
			);
			exit;
		},
		1
	);
}

wpcomsh_fatal_maybe_deactivate_plugin();
