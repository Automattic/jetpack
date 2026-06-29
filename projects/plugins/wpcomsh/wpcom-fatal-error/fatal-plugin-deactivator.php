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
	// Nonces aren't usable here (pluggable.php hasn't loaded yet); the HMAC
	// check below is the actual auth gate. The presence check + regex below
	// only constrain the inputs before they're trusted.
	// phpcs:disable WordPress.Security.NonceVerification.Missing
	if ( empty( $_POST['wpcomsh_deactivate'] ) || empty( $_POST['wpcomsh_sig'] ) || empty( $_POST['wpcomsh_exp'] ) ) {
		return;
	}
	$plugin = sanitize_text_field( wp_unslash( $_POST['wpcomsh_deactivate'] ) );
	$sig    = sanitize_text_field( wp_unslash( $_POST['wpcomsh_sig'] ) );
	$exp    = (int) $_POST['wpcomsh_exp'];
	// phpcs:enable WordPress.Security.NonceVerification.Missing

	// Reject malformed plugin paths (no traversal; slug/file.php only).
	if ( ! preg_match( '#^[a-zA-Z0-9][a-zA-Z0-9_.-]*/[a-zA-Z0-9][a-zA-Z0-9_.-]*\.php$#', $plugin ) ) {
		return;
	}

	if ( ! wpcomsh_fatal_verify_payload( $plugin, $exp, $sig ) ) {
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

	// Logged via WPCOMSH_Log's shutdown drain, which runs after the redirect's
	// exit — the queued payload still ships.
	wpcomsh_fatal_log_deactivate( $plugin );

	// Persist + redirect immediately at mu-plugin load, before core enters the
	// regular plugin-include pass. Deferring this to plugins_loaded would mean
	// any *other* broken plugin in active_plugins fatals before our callback
	// runs — the option update never lands and the user is stuck looping on
	// the same fatal screen with no persisted state.
	$active = get_option( 'active_plugins', array() );
	if ( is_array( $active ) && in_array( $plugin, $active, true ) ) {
		update_option( 'active_plugins', array_values( array_diff( $active, array( $plugin ) ) ) );
	}

	// pluggable.php was loaded by wpcomsh_fatal_current_user_id() above, so
	// wp_safe_redirect is available even though we're still in mu-plugin time.
	wp_safe_redirect(
		add_query_arg(
			array( 'wpcomsh_deactivated' => rawurlencode( $plugin ) ),
			admin_url( 'plugins.php' )
		)
	);
	exit;
}

wpcomsh_fatal_maybe_deactivate_plugin();
