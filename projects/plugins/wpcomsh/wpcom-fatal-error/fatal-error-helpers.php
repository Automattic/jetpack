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
 * Resolve the current request's logged-in user id, bootstrapping just enough
 * of WordPress for capability checks to work from the fatal handler.
 *
 * The fatal handler can fire before pluggable.php loads and before cookie
 * constants are defined. We manually bootstrap `wp_cookie_constants()` and
 * the user/capability files; if anything fails we return 0 so details never
 * leak to anonymous viewers.
 *
 * Returns the user id so callers can apply granular capability checks
 * (`manage_options`, `deactivate_plugin`, `resume_plugins`) via `user_can()`.
 *
 * @return int User id, or 0 when no authenticated user could be resolved.
 */
function wpcomsh_fatal_current_user_id() {
	try {
		if ( ! defined( 'LOGGED_IN_COOKIE' ) ) {
			require_once ABSPATH . 'wp-includes/default-constants.php';
			wp_cookie_constants();
		}
		require_once ABSPATH . 'wp-includes/class-wp-user.php';
		require_once ABSPATH . 'wp-includes/user.php';
		require_once ABSPATH . 'wp-includes/capabilities.php';
		require_once ABSPATH . 'wp-includes/pluggable.php';
		return (int) wp_validate_auth_cookie( '', 'logged_in' );
	} catch ( \Throwable $e ) {
		return 0;
	}
}

/**
 * Identify the extension (plugin, mu-plugin, or theme) associated with a
 * fatal, using the error's absolute file path. Looks up the Name / Version
 * / Description headers so the screen can name the likely cause.
 *
 * `basename` is the plugin basename (e.g. "akismet/akismet.php") for
 * plugins and mu-plugins, and the theme stylesheet slug for themes — the
 * screen uses it to build the appropriate action (signed deactivation
 * form for plugins, themes.php link for themes). `slug` is the directory
 * slug (e.g. "akismet") and is what the cross-site signature groups on,
 * so a single extension collapses to one row instead of one per entry
 * file.
 *
 * @param array $error Error details from WP_Fatal_Error_Handler.
 * @return array{name:string, version:string, description:string, slug:string, basename:string, kind:string}|null
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
		if ( 'themes' === $kind ) {
			$theme = wp_get_theme( $slug );
			if ( $theme->exists() ) {
				return array(
					'name'        => (string) $theme->get( 'Name' ),
					'version'     => (string) $theme->get( 'Version' ),
					'description' => wp_strip_all_tags( (string) $theme->get( 'Description' ) ),
					'slug'        => $slug,
					'basename'    => $slug,
					'kind'        => $kind,
				);
			}
			return null;
		}

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
					'slug'        => $slug,
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
 * Build a transportable fatal-error signature for the identified
 * extension. Thin wrapper around wpcom_build_fatal_error_signature() in
 * jetpack-mu-wpcom — kept here so the fatal-error module has its own
 * call site and can defend against the helper being unavailable.
 *
 * Why the manual require: wpcomsh's fatal-error module loads from
 * `wpcomsh.php` line 1, before composer's autoloader runs and before
 * jetpack-mu-wpcom's `Jetpack_Mu_Wpcom::init()` has loaded its shared
 * helpers. By the time the `wp_php_error_message` filter fires (during
 * a fatal, deep into the request) the autoloader is normally up, but
 * we can't rely on it: an early fatal in mu-plugin land can fire before
 * any of that. A direct require by relative vendor path keeps this safe.
 *
 * Returns null when there's no identified extension or the helper file
 * isn't reachable; the screen and email then simply omit the signature.
 *
 * @param array|null $plugin Extension metadata from wpcomsh_fatal_identify_plugin().
 * @return string|null Base64url-encoded signature token, or null.
 */
function wpcomsh_fatal_build_signature( $plugin ) {
	if ( ! is_array( $plugin ) || empty( $plugin['slug'] ) || empty( $plugin['kind'] ) ) {
		return null;
	}

	if ( ! function_exists( 'wpcom_build_fatal_error_signature' ) ) {
		$helper = __DIR__ . '/../vendor/automattic/jetpack-mu-wpcom/src/common/fatal-error-signature.php';
		if ( is_readable( $helper ) ) {
			require_once $helper;
		}
	}

	if ( ! function_exists( 'wpcom_build_fatal_error_signature' ) ) {
		return null;
	}

	return wpcom_build_fatal_error_signature(
		array(
			'kind'    => (string) $plugin['kind'],
			'slug'    => (string) $plugin['slug'],
			'version' => isset( $plugin['version'] ) ? (string) $plugin['version'] : '',
		)
	);
}

/**
 * Map an absolute file path to an extension slug + base dir + kind
 * ("plugins", "mu-plugins", or "themes"). Returned as a list:
 * [ slug, base_dir, kind ].
 *
 * The theme root is resolved via `get_theme_root()` so symlinked or
 * relocated theme directories still match.
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
	if ( function_exists( 'get_theme_root' ) ) {
		$theme_root = (string) get_theme_root();
		if ( '' !== $theme_root && 0 === strpos( $abs_file, $theme_root . '/' ) ) {
			return array(
				strtok( substr( $abs_file, strlen( $theme_root ) + 1 ), '/' ),
				$theme_root,
				'themes',
			);
		}
	}
	return array( '', '', '' );
}

/**
 * Build the form action + signed fields the fatal-plugin-deactivator endpoint
 * validates, without relying on pluggable functions or WP nonces.
 *
 * Signature: HMAC over (plugin, expiry, logged_in cookie) using AUTH_SALT.
 * Binding to the cookie ensures the request can't be replayed by another
 * user or after the admin logs out, and can't be forged without AUTH_SALT.
 *
 * Returned as form fields (rather than a signed URL) so the screen can submit
 * via POST — destructive actions should not live in a GET-able link.
 *
 * @param string $plugin_basename Plugin file relative to WP_PLUGIN_DIR (e.g. "akismet/akismet.php").
 * @return array{action:string,fields:array<string,string>}|null Form data, or null when prerequisites are missing.
 */
function wpcomsh_fatal_build_deactivate_form( $plugin_basename ) {
	if ( ! defined( 'AUTH_SALT' ) || ! defined( 'LOGGED_IN_COOKIE' ) ) {
		return null;
	}
	if ( empty( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
		return null;
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
	return array(
		'action' => home_url( '/' ),
		'fields' => array(
			'wpcomsh_deactivate' => $plugin_basename,
			'wpcomsh_exp'        => (string) $exp,
			'wpcomsh_sig'        => $sig,
		),
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

/**
 * Collect environment details (WordPress / PHP / active theme) shown in
 * the fatal-error screen's Environment section and reused by the
 * recovery-mode email. Helps support triage without making the recipient
 * hunt for them.
 *
 * Each entry is a ready-to-print "Label: value" line; the template renders
 * them inside a <pre>, so line-for-line layout matters.
 *
 * @return string[]
 */
function wpcomsh_fatal_get_environment_lines() {
	global $wp_version;

	$lines = array();

	$lines[] = sprintf( 'WordPress: %s', isset( $wp_version ) ? (string) $wp_version : 'unknown' );
	$lines[] = sprintf( 'PHP: %s', PHP_VERSION );

	try {
		$theme = wp_get_theme();
		if ( $theme && $theme->exists() ) {
			$lines[] = sprintf( 'Theme: %s %s', (string) $theme->get( 'Name' ), (string) $theme->get( 'Version' ) );
		}
	} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- best-effort; omit theme on failure.
		// Fall through.
	}

	return $lines;
}
