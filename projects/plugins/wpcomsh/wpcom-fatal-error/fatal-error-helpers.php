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
 * `basename` is the plugin basename for plugins/mu-plugins and the
 * theme stylesheet slug for themes — used to build the deactivate
 * action. `slug` is the directory slug, used by the signature so a
 * single extension collapses to one row.
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
 * Log that an admin clicked the "Deactivate" button on the fatal-error screen.
 * Identifies the extension from its basename so the deactivate event carries
 * the same shape as the signature event; falls through silently if the plugin
 * file is no longer on disk.
 *
 * @param string $plugin_basename Plugin basename relative to WP_PLUGIN_DIR (e.g. "akismet/akismet.php").
 * @return void
 */
function wpcomsh_fatal_log_deactivate( $plugin_basename ) {
	if ( ! is_string( $plugin_basename ) || '' === $plugin_basename ) {
		return;
	}

	$plugin = wpcomsh_fatal_identify_plugin( array( 'file' => WP_PLUGIN_DIR . '/' . $plugin_basename ) );
	if ( ! is_array( $plugin ) ) {
		return;
	}

	wpcomsh_fatal_log_event( $plugin, 'wpcomsh_fatal_deactivate' );
}

/**
 * Emit a fatal-error event via WPCOMSH_Log::unsafe_direct_log_logstash(),
 * alongside the decoded signature parts so consumers don't have to decode
 * the signature themselves.
 *
 * Callable from both the fatal-screen render path and the deactivator
 * endpoint at mu-plugin load time. The deactivator path runs before
 * constants.php, so we resolve the wpcomsh root via `dirname(__DIR__)`
 * rather than WPCOMSH__PLUGIN_DIR_PATH.
 *
 * Manual require with `class_exists( …, false )` skips the autoloader during
 * fatal handling, where its filesystem reads could compound a bad state.
 *
 * Best-effort: silently no-ops if either dependency is unreachable. A logging
 * failure must never escalate into a second fatal.
 *
 * @param array|null $plugin  Extension metadata from wpcomsh_fatal_identify_plugin().
 * @param string     $message Event message slug (e.g. `wpcomsh_fatal_signature`, `wpcomsh_fatal_deactivate`).
 * @return void
 */
function wpcomsh_fatal_log_event( $plugin, $message ) {
	if ( ! is_array( $plugin ) || empty( $plugin['slug'] ) || empty( $plugin['kind'] ) ) {
		return;
	}

	$wpcomsh_root = dirname( __DIR__ );

	if ( ! function_exists( 'wpcom_build_fatal_error_signature' ) ) {
		$helper = $wpcomsh_root . '/jetpack_vendor/automattic/jetpack-mu-wpcom/src/common/fatal-error-signature.php';
		if ( is_readable( $helper ) ) {
			require_once $helper;
		}
	}
	if ( ! function_exists( 'wpcom_build_fatal_error_signature' ) ) {
		return;
	}

	$signature = wpcom_build_fatal_error_signature( wpcomsh_fatal_normalize_plugin_parts( $plugin ) );
	if ( null === $signature ) {
		return;
	}

	// Dedup per (message, signature) for 5 min so a persistent fatal doesn't
	// emit one log row + one outbound HTTP per visitor. $message is part of
	// the key so a deactivate event isn't suppressed by a recent signature
	// event for the same extension.
	$cache_key = 'wpcomsh_fatal_event:' . hash( 'sha256', $message . '|' . $signature );
	try {
		if ( ! wp_cache_add( $cache_key, 1, 'wpcomsh', 5 * MINUTE_IN_SECONDS ) ) {
			return;
		}
	} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- fail open: a cache failure should not block telemetry.
		// Fall through and log.
	}

	if ( ! class_exists( 'WPCOMSH_Log', false ) ) {
		$log_file = $wpcomsh_root . '/class-wpcomsh-log.php';
		if ( is_readable( $log_file ) ) {
			require_once $log_file;
		}
	}
	if ( ! class_exists( 'WPCOMSH_Log', false ) ) {
		return;
	}

	$properties = array( 'signature' => $signature );

	// `get_site_url()` runs the `site_url` / `option_siteurl` filters, so a
	// misbehaving filter could throw — keep the lookup in its own guard so
	// the rest of the signature still makes it to logstash.
	try {
		$properties['site_url'] = get_site_url();
	} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- best-effort; omit site_url if a filter misbehaves.
		// Fall through.
	}

	// Prefer the constant: it's set on Atomic and avoids the apply_filters()
	// dispatch inside wpcomsh_get_atomic_site_id(). Fall back to the helper
	// only when the constant isn't defined; guard the call because the helper
	// runs the `wpcomsh_get_atomic_site_id` filter, and a misbehaving callback
	// must not bubble out of this best-effort logger.
	$atomic_site_id = defined( 'ATOMIC_SITE_ID' ) ? (int) ATOMIC_SITE_ID : 0;
	if ( 0 === $atomic_site_id && function_exists( 'wpcomsh_get_atomic_site_id' ) ) {
		try {
			$atomic_site_id = (int) wpcomsh_get_atomic_site_id();
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- best-effort; omit atomic_site_id if a filter misbehaves.
			// Fall through.
		}
	}
	if ( $atomic_site_id > 0 ) {
		$properties['atomic_site_id'] = $atomic_site_id;
	}

	// Round-trip through the decoder so the logged parts always agree
	// with the signature.
	if ( function_exists( 'wpcom_decode_fatal_error_signature' ) ) {
		$parts = wpcom_decode_fatal_error_signature( $signature );
		if ( is_array( $parts ) ) {
			$properties['kind']              = $parts['kind'];
			$properties['slug']              = $parts['slug'];
			$properties['extension_version'] = $parts['version'];
			$properties['wp_version']        = $parts['wp'];
			$properties['php_version']       = $parts['php'];
		}
	}

	try {
		\WPCOMSH_Log::unsafe_direct_log_logstash(
			'atomic_extension_conflict',
			$message,
			array(
				'severity'   => 'critical',
				'properties' => $properties,
			)
		);
	} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- best-effort; never escalate a logging failure into another fatal.
		// Swallow.
	}
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
 * Coerce a plugin-info array (or null) into the canonical kind/slug/version
 * triple, with missing keys defaulting to ''. Used wherever we need to feed
 * those three fields into a signature, log, or template — so the empty-key
 * handling stays in one place.
 *
 * @param array|null $plugin Extension info from wpcomsh_fatal_identify_plugin(), or null.
 * @return array{kind:string,slug:string,version:string}
 */
function wpcomsh_fatal_normalize_plugin_parts( $plugin ) {
	$plugin = is_array( $plugin ) ? $plugin : array();
	return array(
		'kind'    => isset( $plugin['kind'] ) ? (string) $plugin['kind'] : '',
		'slug'    => isset( $plugin['slug'] ) ? (string) $plugin['slug'] : '',
		'version' => isset( $plugin['version'] ) ? (string) $plugin['version'] : '',
	);
}

/**
 * Map an extension kind to the recovery-mode capability that gates it.
 * Theme-origin fatals need `resume_themes`; everything else (plugins,
 * mu-plugins, unknown) needs `resume_plugins`.
 *
 * @param string $kind Extension kind from wpcomsh_fatal_identify_plugin().
 * @return string Core capability slug.
 */
function wpcomsh_fatal_recovery_cap_for_kind( $kind ) {
	return 'themes' === $kind ? 'resume_themes' : 'resume_plugins';
}

/**
 * Sign a payload bound to the current logged-in session.
 *
 * The HMAC covers `parts | exp | logged_in_cookie`, using AUTH_SALT. Binding
 * to the cookie means a leaked URL/form can't be replayed across sessions
 * (or after the admin logs out), and can't be forged without AUTH_SALT.
 *
 * Returns '' when prerequisites are missing (no AUTH_SALT, no cookie); the
 * caller treats that as "can't sign right now" and skips rendering.
 *
 * Centralized here so the sign + verify sides can't diverge on payload
 * shape — every part list passed in is the canonical input to the matching
 * `wpcomsh_fatal_verify_signed_payload()` call.
 *
 * Cookie-host implication: the HMAC verifies only on requests where
 * LOGGED_IN_COOKIE is sent. On installs where WP_SITEURL and WP_HOME are on
 * different hosts (and no explicit COOKIE_DOMAIN is set), that cookie is
 * host-only to wherever wp-login.php lives. Wrapper URLs/forms must target
 * site_url(), not home_url(), or the verifier silently fails.
 *
 * @param string[] $parts Ordered string parts to bind into the signature.
 * @param int      $exp   Absolute unix timestamp at which the signature expires.
 * @return string Lowercase hex sha256 HMAC, or '' when unavailable.
 */
function wpcomsh_fatal_sign_payload( array $parts, $exp ) {
	if ( ! defined( 'AUTH_SALT' ) || ! defined( 'LOGGED_IN_COOKIE' ) ) {
		return '';
	}
	if ( empty( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
		return '';
	}
	// Per-session secret inside an HMAC we never output; needs the exact
	// byte-for-byte cookie value to match at verify time.
	$cookie_value = (string) wp_unslash( $_COOKIE[ LOGGED_IN_COOKIE ] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$payload      = implode( '|', array_merge( $parts, array( (string) (int) $exp, $cookie_value ) ) );
	return hash_hmac( 'sha256', $payload, (string) AUTH_SALT );
}

/**
 * Verify an HMAC produced by wpcomsh_fatal_sign_payload().
 *
 * Bootstraps cookie constants because the signed-URL endpoints run at
 * mu-plugin load time, before wp-settings.php defines them. Returns false on
 * any failure — missing AUTH_SALT/cookie, expired timestamp, or HMAC
 * mismatch — so callers can `if ( ! verify(...) ) return;` as a single gate.
 *
 * @param string   $sig   Signature from the request.
 * @param string[] $parts Ordered string parts the URL claims to have signed.
 * @param int      $exp   Expiry timestamp from the request.
 * @return bool True iff the signature is valid for this session and unexpired.
 */
function wpcomsh_fatal_verify_signed_payload( $sig, array $parts, $exp ) {
	if ( ! is_string( $sig ) || '' === $sig || (int) $exp < time() ) {
		return false;
	}
	if ( ! defined( 'LOGGED_IN_COOKIE' ) && function_exists( 'wp_cookie_constants' ) ) {
		wp_cookie_constants();
	}
	$expected = wpcomsh_fatal_sign_payload( $parts, (int) $exp );
	return '' !== $expected && hash_equals( $expected, $sig );
}

/**
 * Build the form action + signed fields the fatal-plugin-deactivator endpoint
 * validates, without relying on pluggable functions or WP nonces.
 *
 * Returned as form fields (rather than a signed URL) so the screen can submit
 * via POST — destructive actions should not live in a GET-able link.
 *
 * Posts to site_url() (admin/login host); see wpcomsh_fatal_sign_payload()
 * for the cookie-host rationale.
 *
 * @param string $plugin_basename Plugin file relative to WP_PLUGIN_DIR (e.g. "akismet/akismet.php").
 * @return array{action:string,fields:array<string,string>}|null Form data, or null when prerequisites are missing.
 */
function wpcomsh_fatal_build_deactivate_form( $plugin_basename ) {
	$exp = time() + 5 * MINUTE_IN_SECONDS;
	$sig = wpcomsh_fatal_sign_payload( array( $plugin_basename ), $exp );
	if ( '' === $sig ) {
		return null;
	}
	return array(
		'action' => site_url( '/' ),
		'fields' => array(
			'wpcomsh_deactivate' => $plugin_basename,
			'wpcomsh_exp'        => (string) $exp,
			'wpcomsh_sig'        => $sig,
		),
	);
}

/**
 * Build the wrapper URL the fatal screen renders for "Enter recovery mode".
 *
 * The link doesn't point at core's recovery URL directly. It points at a
 * signed `site_url('/')` query that fatal-recovery-click.php intercepts at
 * mu-plugin load time so we can log the click and *then* mint a fresh
 * recovery URL on the redirect. Plugin metadata is embedded so the click
 * endpoint can emit a per-extension signature event without re-identifying
 * from disk.
 *
 * Targets site_url() (admin/login host); see wpcomsh_fatal_sign_payload()
 * for the cookie-host rationale.
 *
 * Returns '' when prerequisites are missing (multisite, no cookie, no
 * AUTH_SALT) — the template treats '' as "hide the link".
 *
 * @param array|null $plugin Extension info from wpcomsh_fatal_identify_plugin(), or null.
 * @return string Wrapper URL, or '' when unavailable.
 */
function wpcomsh_fatal_build_recovery_link( $plugin ) {
	if ( is_multisite() ) {
		return '';
	}
	$parts = wpcomsh_fatal_normalize_plugin_parts( $plugin );
	// Day-long TTL: navigation-only action; further bounded by LOGGED_IN_COOKIE.
	$exp = time() + DAY_IN_SECONDS;
	$sig = wpcomsh_fatal_sign_payload( array_values( $parts ), $exp );
	if ( '' === $sig ) {
		return '';
	}

	return add_query_arg(
		array(
			'wpcomsh_recovery'      => '1',
			'wpcomsh_recovery_kind' => $parts['kind'],
			'wpcomsh_recovery_slug' => $parts['slug'],
			'wpcomsh_recovery_ver'  => $parts['version'],
			'wpcomsh_recovery_exp'  => (string) $exp,
			'wpcomsh_recovery_sig'  => $sig,
		),
		site_url( '/' )
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
