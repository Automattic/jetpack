<?php
/**
 * Helpers for the WordPress.com fatal-error screen.
 *
 * Every function in this file must be safe to call from the fatal-error
 * handler, which runs after a previous fatal. That means:
 *
 *   - No reliance on plugins / themes being loaded.
 *   - No reliance on pluggable.php being loaded (we bootstrap what we need).
 *   - Defensive try/catch where a helper might touch the database, since the
 *     underlying fatal may itself be DB-related.
 *   - Silent failure (return empty/null) rather than re-throwing — we don't
 *     want to turn a rendering problem into another fatal.
 *
 * @package wpcomsh
 */

/**
 * Determine whether the fatal-screen viewer is a logged-in admin.
 *
 * The fatal handler can fire before pluggable.php loads and before cookie
 * constants are defined. We manually bootstrap `wp_cookie_constants()` and
 * the user/capability files; if anything fails we return false so details
 * never leak to anonymous viewers.
 *
 * @return bool
 */
function wpcomsh_fatal_is_admin() {
	try {
		if ( ! defined( 'LOGGED_IN_COOKIE' ) ) {
			require_once ABSPATH . 'wp-includes/default-constants.php';
			wp_cookie_constants();
		}
		require_once ABSPATH . 'wp-includes/class-wp-user.php';
		require_once ABSPATH . 'wp-includes/user.php';
		require_once ABSPATH . 'wp-includes/capabilities.php';
		require_once ABSPATH . 'wp-includes/pluggable.php';
		$user_id = wp_validate_auth_cookie( '', 'logged_in' );
		return $user_id && user_can( $user_id, 'manage_options' );
	} catch ( \Throwable $e ) {
		return false;
	}
}

/**
 * Identify the plugin associated with a fatal, using the error's absolute
 * file path. Looks up the plugin header (Name, Version, Description) so the
 * screen can name the likely cause.
 *
 * @param array $error Error details from WP_Fatal_Error_Handler.
 * @return array{name:string, version:string, description:string, basename:string, kind:string}|null
 */
function wpcomsh_fatal_identify_plugin( $error ) {
	if ( empty( $error['file'] ) ) {
		return null;
	}
	$abs_file = (string) $error['file'];

	list( $slug, $base_dir, $kind ) = wpcomsh_fatal_classify_plugin_path( $abs_file );
	if ( ! $slug || ! $base_dir ) {
		return null;
	}

	try {
		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$candidates = glob( $base_dir . '/' . $slug . '/*.php' );
		if ( ! is_array( $candidates ) ) {
			return null;
		}
		foreach ( $candidates as $candidate ) {
			$data = get_plugin_data( $candidate, false, false );
			if ( ! empty( $data['Name'] ) ) {
				return array(
					'name'        => (string) $data['Name'],
					'version'     => isset( $data['Version'] ) ? (string) $data['Version'] : '',
					'description' => isset( $data['Description'] ) ? wp_strip_all_tags( (string) $data['Description'] ) : '',
					'basename'    => $slug . '/' . basename( $candidate ),
					'kind'        => $kind,
				);
			}
		}
	} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- identification is best-effort; swallow and return null.
		return null;
	}
	return null;
}

/**
 * Map an absolute file path to a plugin slug + base dir + kind
 * ("plugins" or "mu-plugins"). Returned as a list: [ slug, base_dir, kind ].
 *
 * @param string $abs_file Absolute path reported by the fatal handler.
 * @return array{0:string,1:string,2:string}
 */
function wpcomsh_fatal_classify_plugin_path( $abs_file ) {
	if ( 0 === strpos( $abs_file, WP_PLUGIN_DIR . '/' ) ) {
		return array(
			strtok( substr( $abs_file, strlen( WP_PLUGIN_DIR ) + 1 ), '/' ),
			WP_PLUGIN_DIR,
			'plugins',
		);
	}
	if ( 0 === strpos( $abs_file, WPMU_PLUGIN_DIR . '/' ) ) {
		return array(
			strtok( substr( $abs_file, strlen( WPMU_PLUGIN_DIR ) + 1 ), '/' ),
			WPMU_PLUGIN_DIR,
			'mu-plugins',
		);
	}
	return array( '', '', '' );
}

/**
 * Build a signed URL that the fatal-plugin-deactivator endpoint can validate
 * without relying on pluggable functions or WP nonces.
 *
 * Signature: HMAC over (plugin, expiry, logged_in cookie) using AUTH_SALT.
 * Binding to the cookie ensures the link can't be replayed by another user
 * or after the admin logs out, and can't be forged without AUTH_SALT.
 *
 * @param string $plugin_basename Plugin file relative to WP_PLUGIN_DIR (e.g. "akismet/akismet.php").
 * @return string Signed URL, or '' when prerequisites are missing.
 */
function wpcomsh_fatal_build_deactivate_url( $plugin_basename ) {
	if ( ! defined( 'AUTH_SALT' ) || ! defined( 'LOGGED_IN_COOKIE' ) ) {
		return '';
	}
	if ( empty( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
		return '';
	}
	// The cookie is used only as a per-session secret inside an HMAC we
	// never output, so sanitization is irrelevant here — we need its exact
	// byte-for-byte value to match at verification time.
	$cookie_value = (string) wp_unslash( $_COOKIE[ LOGGED_IN_COOKIE ] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$exp          = time() + 5 * MINUTE_IN_SECONDS;
	$sig          = hash_hmac(
		'sha256',
		$plugin_basename . '|' . $exp . '|' . $cookie_value,
		(string) AUTH_SALT
	);
	return add_query_arg(
		array(
			'wpcomsh_deactivate' => rawurlencode( $plugin_basename ),
			'wpcomsh_exp'        => $exp,
			'wpcomsh_sig'        => $sig,
		),
		home_url( '/' )
	);
}

/**
 * Generate a recovery-mode URL using core's link service.
 *
 * Returns empty on multisite — core's `WP_Fatal_Error_Handler::handle()` only
 * initializes recovery mode when `! is_multisite()`, so the key store stays
 * empty and the URL would never validate (e.g. WordPress.com Atomic).
 *
 * @return string URL, or '' when unavailable.
 */
function wpcomsh_fatal_build_recovery_url() {
	if ( is_multisite() ) {
		return '';
	}
	try {
		require_once ABSPATH . 'wp-includes/class-wp-recovery-mode-cookie-service.php';
		require_once ABSPATH . 'wp-includes/class-wp-recovery-mode-key-service.php';
		require_once ABSPATH . 'wp-includes/class-wp-recovery-mode-link-service.php';
		$service = new WP_Recovery_Mode_Link_Service(
			new WP_Recovery_Mode_Cookie_Service(),
			new WP_Recovery_Mode_Key_Service()
		);
		return (string) $service->generate_url();
	} catch ( \Throwable $e ) {
		return '';
	}
}
