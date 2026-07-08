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
 * Ensure there's memory headroom to render the screen without OOMing.
 *
 * Returns false when the headroom can't be secured, so the caller falls back
 * to core's lighter screen.
 *
 * @return bool
 */
function wpcomsh_fatal_ensure_render_memory() {
	$needed = 2 * MB_IN_BYTES;
	$usage  = memory_get_usage( true );
	$limit  = wp_convert_hr_to_bytes( (string) ini_get( 'memory_limit' ) );
	if ( $limit <= 0 || $limit - $usage >= $needed ) {
		return true; // Unlimited, or already enough headroom.
	}
	return false !== @ini_set( 'memory_limit', (string) ( $usage + $needed ) ); // phpcs:ignore WordPress.PHP.IniSet.memory_limit_Disallowed,WordPress.PHP.NoSilencedErrors.Discouraged -- bounded bump in the fatal handler; a refused raise is handled by the return value.
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
	} catch ( \Throwable $e ) { // identification is best-effort; swallow and return null.
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
 * Bucket the in-flight HTTP request into a coarse kind for telemetry,
 * along with the path and method. Kind drives dedup; path and method
 * ride on the row for drill-down.
 *
 * Buckets, in priority order: `cron`, `ajax`, `rest`, `wp-login`,
 * `wp-admin`, `home`, `other`. Order matters because `admin-ajax.php`
 * lives under `/wp-admin/`, so the more-specific buckets win first.
 *
 * Best-effort: option lookups (`admin_url()`, `home_url()`) are wrapped
 * in try/catch so a misbehaving filter can't bubble out of the fatal
 * handler.
 *
 * @return array{kind:string,path:string,method:string}
 */
function wpcomsh_fatal_request_context() {
	static $cached = null;
	if ( null !== $cached ) {
		return $cached;
	}

	// REQUEST_URI is fed only to wp_parse_url for path extraction; the raw
	// value is never echoed, rendered, or stored. sanitize_text_field would
	// drop legitimate path bytes via wp_check_invalid_utf8.
	$req_uri  = wp_unslash( $_SERVER['REQUEST_URI'] ?? '' ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- path-only extraction; see comment.
	$raw_path = (string) wp_parse_url( $req_uri, PHP_URL_PATH );
	$path     = rtrim( $raw_path, '/' );

	static $allowed_methods = array( 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS' );
	$method_raw             = strtoupper( (string) wp_unslash( $_SERVER['REQUEST_METHOD'] ?? '' ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- whitelisted below.
	$method                 = in_array( $method_raw, $allowed_methods, true ) ? $method_raw : 'UNKNOWN';

	// Bucket priority: cron / ajax / rest / wp-login win before wp-admin
	// because admin-ajax.php lives under /wp-admin/. Constants (not the
	// `wp_doing_cron` / `wp_doing_ajax` wrappers) are checked because the
	// wrappers run filters — a callback registered by the fataling code, or
	// by a plugin coincidentally loaded on this request, must not bubble out
	// of the fatal handler and prevent the recovery screen from rendering.
	// Path suffixes catch the early-fatal case where the constant hasn't
	// been defined yet (e.g. a plugin-load fatal on /wp-cron.php before
	// wp-cron.php sets DOING_CRON).
	$kind = 'other';
	if ( ( defined( 'DOING_CRON' ) && DOING_CRON ) || str_ends_with( $path, '/wp-cron.php' ) ) {
		$kind = 'cron';
	} elseif ( ( defined( 'DOING_AJAX' ) && DOING_AJAX ) || str_ends_with( $path, '/admin-ajax.php' ) ) {
		$kind = 'ajax';
	} elseif ( ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || str_contains( $path, '/wp-json/' ) || str_ends_with( $path, '/wp-json' ) ) {
		$kind = 'rest';
	} elseif ( str_ends_with( $path, '/wp-login.php' ) ) {
		$kind = 'wp-login';
	} else {
		try {
			$admin_path = rtrim( (string) wp_parse_url( admin_url(), PHP_URL_PATH ), '/' );
			if ( '' !== $admin_path && str_starts_with( $path . '/', $admin_path . '/' ) ) {
				$kind = 'wp-admin';
			} else {
				$home_path = rtrim( (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH ), '/' );
				if ( $home_path === $path ) {
					$kind = 'home';
				}
			}
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- best-effort: option lookup must not bubble during fatal handling.
			// Fall through with $kind = 'other'.
		}
	}

	$cached = array(
		'kind'   => $kind,
		'path'   => '' === $path ? '/' : $path,
		'method' => $method,
	);
	return $cached;
}

/**
 * Emit a fatal-error event keyed on a suspected extension. Builds the
 * signature, dedups per (message, signature, request_kind) for 1 hour,
 * and routes through `wpcomsh_fatal_emit_logstash` so the recovery-login
 * event can share the same dispatch tail.
 *
 * @param array|null $plugin  Extension metadata from wpcomsh_fatal_identify_plugin().
 * @param string     $message Event message slug (e.g. `wpcomsh_fatal_signature`, `wpcomsh_fatal_deactivate`).
 * @return void
 */
function wpcomsh_fatal_log_event( $plugin, $message ) {
	if ( ! is_array( $plugin ) || empty( $plugin['slug'] ) || empty( $plugin['kind'] ) ) {
		return;
	}

	if ( ! function_exists( 'wpcom_build_fatal_error_signature' ) ) {
		$helper = dirname( __DIR__ ) . '/jetpack_vendor/automattic/jetpack-mu-wpcom/src/common/fatal-error-signature.php';
		if ( is_readable( $helper ) ) {
			require_once $helper;
		}
	}
	if ( ! function_exists( 'wpcom_build_fatal_error_signature' ) ) {
		return;
	}

	$signature = wpcom_build_fatal_error_signature(
		array(
			'kind'    => (string) $plugin['kind'],
			'slug'    => (string) $plugin['slug'],
			'version' => isset( $plugin['version'] ) ? (string) $plugin['version'] : '',
		)
	);
	if ( null === $signature ) {
		return;
	}

	$context = wpcomsh_fatal_request_context();

	// Dedup per (message, signature, request_kind) for 1 hour. $message keeps
	// a deactivate event from being suppressed by a recent signature event for
	// the same extension. request_kind splits site-wide breakage (multiple
	// kinds per signature) from a single broken endpoint (one kind), which the
	// in-request handler can't otherwise tell. TTL stays short of core's 24h
	// `recovery_mode_email_rate_limit` so a legitimate re-send surfaces.
	if ( ! wpcomsh_fatal_dedup_acquire( 'wpcomsh_fatal_event:' . hash( 'sha256', $message . '|' . $signature . '|' . $context['kind'] ), HOUR_IN_SECONDS ) ) {
		return;
	}

	$properties = array(
		'signature'      => $signature,
		'request_kind'   => $context['kind'],
		'request_path'   => $context['path'],
		'request_method' => $context['method'],
	);

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

	wpcomsh_fatal_emit_logstash( $message, $properties );
}

/**
 * Dispatch a fatal-flow event to the `atomic_extension_conflict` logstash
 * bucket, after merging in the shared site identifiers (`site_url`,
 * `atomic_site_id`) callers always want attached.
 *
 * Manual require with `class_exists( …, false )` skips the autoloader
 * during fatal handling, where its filesystem reads could compound a bad
 * state. Resolves the wpcomsh root via `dirname(__DIR__)` so the
 * deactivator endpoint can call this at mu-plugin file-load time, before
 * constants.php has run.
 *
 * Best-effort: silently no-ops when WPCOMSH_Log is unreachable, and never
 * lets a dispatch failure bubble out — telemetry must not escalate a
 * recovery flow into a second fatal.
 *
 * @param string                    $message    Event message slug.
 * @param array<string,scalar|null> $properties Event-specific properties; site_url + atomic_site_id are added when missing.
 * @return void
 */
function wpcomsh_fatal_emit_logstash( $message, $properties = array() ) {
	if ( ! class_exists( 'WPCOMSH_Log', false ) ) {
		$log_file = dirname( __DIR__ ) . '/class-wpcomsh-log.php';
		if ( is_readable( $log_file ) ) {
			require_once $log_file;
		}
	}
	if ( ! class_exists( 'WPCOMSH_Log', false ) ) {
		return;
	}

	// `get_site_url()` runs the `site_url` / `option_siteurl` filters, so a
	// misbehaving filter could throw — keep the lookup in its own guard so
	// the rest of the event still makes it to logstash.
	if ( ! isset( $properties['site_url'] ) ) {
		try {
			$properties['site_url'] = get_site_url();
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- best-effort; omit site_url if a filter misbehaves.
			// Fall through.
		}
	}

	// Prefer the constant: it's set on Atomic and avoids the apply_filters()
	// dispatch inside wpcomsh_get_atomic_site_id(). Fall back to the helper
	// only when the constant isn't defined; guard the call because the helper
	// runs the `wpcomsh_get_atomic_site_id` filter, and a misbehaving callback
	// must not bubble out.
	if ( ! isset( $properties['atomic_site_id'] ) ) {
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
 * Mint a `(exp, sig)` payload that the deactivator endpoint verifies
 * before acting.
 *
 * Signature: HMAC over (`$payload_prefix`, expiry, logged_in cookie) using
 * AUTH_SALT. Binding to the cookie means the payload is tied to the admin's
 * active session — it can't be replayed after logout, can't be replayed by
 * another user, and can't be forged without AUTH_SALT. Nonces aren't usable
 * here because the verifying endpoint runs before pluggable.php loads.
 *
 * `$payload_prefix` is a domain separator so a signature minted for one
 * action can't be replayed against another.
 *
 * Default TTL is short (five minutes) because the deactivator action is
 * destructive and we want fresh intent.
 *
 * @param string $payload_prefix Action-specific prefix mixed into the HMAC.
 * @param int    $ttl            Validity window in seconds.
 * @return array{exp:int,sig:string}|null Signed payload, or null when prerequisites are missing.
 */
function wpcomsh_fatal_sign_payload( $payload_prefix, $ttl = 5 * MINUTE_IN_SECONDS ) {
	if ( ! defined( 'AUTH_SALT' ) || ! defined( 'LOGGED_IN_COOKIE' ) ) {
		return null;
	}
	if ( empty( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
		return null;
	}
	// The cookie is used only as a per-session secret inside an HMAC we
	// never output, so sanitization is irrelevant — we need its exact
	// byte-for-byte value to match at verification time.
	$cookie_value = (string) wp_unslash( $_COOKIE[ LOGGED_IN_COOKIE ] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$exp          = time() + $ttl;
	return array(
		'exp' => $exp,
		'sig' => hash_hmac( 'sha256', $payload_prefix . '|' . $exp . '|' . $cookie_value, (string) AUTH_SALT ),
	);
}

/**
 * Counterpart to `wpcomsh_fatal_sign_payload()`: validate that the supplied
 * `$exp` / `$sig` came from this site (HMAC over the same payload prefix
 * keyed on AUTH_SALT) and the same authenticated session (logged_in cookie
 * mixed into the HMAC), and that the payload hasn't expired.
 *
 * Bootstraps cookie constants on demand so the helper is callable from
 * mu-plugin-time endpoints, before wp-settings.php's cookie_constants()
 * runs. Returns false on any prerequisite or comparison failure — callers
 * treat that as "reject the request."
 *
 * @param string $payload_prefix Action-specific prefix mixed into the HMAC.
 * @param int    $exp            Expiry timestamp from the signed payload.
 * @param string $sig            Signature presented by the request.
 * @return bool
 */
function wpcomsh_fatal_verify_payload( $payload_prefix, $exp, $sig ) {
	if ( ! defined( 'AUTH_SALT' ) ) {
		return false;
	}
	// Cookie constants (LOGGED_IN_COOKIE etc.) are defined later in
	// wp-settings.php — between muplugins_loaded and active_plugins
	// iteration. At mu-plugin load time they don't exist yet, but
	// wp_cookie_constants() is already available.
	if ( ! defined( 'LOGGED_IN_COOKIE' ) && function_exists( 'wp_cookie_constants' ) ) {
		wp_cookie_constants();
	}
	if ( ! defined( 'LOGGED_IN_COOKIE' ) ) {
		return false;
	}
	if ( $exp < time() ) {
		return false;
	}
	// Cookie is the per-session secret; sanitization would destroy the
	// byte-for-byte match against the value present at sign time.
	$cookie_value = isset( $_COOKIE[ LOGGED_IN_COOKIE ] )
		? (string) wp_unslash( $_COOKIE[ LOGGED_IN_COOKIE ] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	if ( '' === $cookie_value ) {
		return false;
	}
	$expected = hash_hmac( 'sha256', $payload_prefix . '|' . $exp . '|' . $cookie_value, (string) AUTH_SALT );
	return hash_equals( $expected, (string) $sig );
}

/**
 * Try to claim a 5-minute (by default) cache lock so the same event /
 * action proceeds at most once per TTL window. Wraps `wp_cache_add()` in
 * a try/catch because object-cache backends can throw on unreachable
 * upstreams; a cache outage MUST fail open (return true) so telemetry and
 * recovery actions don't silently disappear during an incident.
 *
 * Caller is responsible for namespacing the key. Returns true when the
 * caller acquired the lock — proceed; false when another caller already
 * did within the window — short-circuit.
 *
 * @param string $key Cache key.
 * @param int    $ttl Lock TTL in seconds.
 * @return bool
 */
function wpcomsh_fatal_dedup_acquire( $key, $ttl = 5 * MINUTE_IN_SECONDS ) {
	try {
		return (bool) wp_cache_add( $key, 1, 'wpcomsh', $ttl );
	} catch ( \Throwable $e ) { // fail open: a cache outage shouldn't silence telemetry or block real actions.
		return true;
	}
}

/**
 * Build the form action + signed fields the fatal-plugin-deactivator endpoint
 * validates, without relying on pluggable functions or WP nonces.
 *
 * Returned as form fields (rather than a signed URL) so the screen can submit
 * via POST — destructive actions should not live in a GET-able link.
 *
 * @param string $plugin_basename Plugin file relative to WP_PLUGIN_DIR (e.g. "akismet/akismet.php").
 * @return array{action:string,fields:array<string,string>}|null Form data, or null when prerequisites are missing.
 */
function wpcomsh_fatal_build_deactivate_form( $plugin_basename ) {
	$signed = wpcomsh_fatal_sign_payload( $plugin_basename );
	if ( null === $signed ) {
		return null;
	}
	return array(
		'action' => home_url( '/' ),
		'fields' => array(
			'wpcomsh_deactivate' => $plugin_basename,
			'wpcomsh_exp'        => (string) $signed['exp'],
			'wpcomsh_sig'        => $signed['sig'],
		),
	);
}

/**
 * Build the URL the fatal-error screen renders behind its "Enter
 * recovery mode" link. The endpoint at fatal-recovery-redirect.php
 * verifies the nonce + capability, then 302s to a freshly-generated
 * core recovery URL — so the recovery key store doesn't pick up a row
 * per fatal-screen pageview, only per actual click.
 *
 * The nonce binds the URL to (action, user_id, session_token, tick)
 * via `wp_create_nonce()`, so a CSRF-style navigation can't reach the
 * endpoint without first extracting the nonce from the rendered
 * screen. The deactivator endpoint keeps its custom HMAC because it
 * runs at mu-plugin file-load time, before pluggable.php loads and
 * `wp_create_nonce` / `wp_verify_nonce` are callable.
 *
 * @param int $user_id Cookie-resolved user the link is being rendered for. Pinning
 *                     `$current_user` to this id before minting the nonce makes
 *                     sure verification (which sets the same id) sees a
 *                     matching signature — without it, an ambient `$current_user`
 *                     that differs from the cookie-bound admin (e.g. a request
 *                     that called `wp_set_current_user( 0 )` earlier) would mint
 *                     a nonce for the wrong user and the click would silently
 *                     no-op.
 * @return string Redirect URL, or '' when prerequisites are missing.
 */
function wpcomsh_fatal_build_recovery_redirect_url( $user_id ) {
	if ( is_multisite() || ! $user_id ) {
		return '';
	}
	// Build on `site_url()` rather than `home_url()`: the recovery flow
	// requires LOGGED_IN_COOKIE, which on host-only cookie setups (no
	// COOKIE_DOMAIN) is bound to the host where wp-login.php ran — i.e.
	// `site_url()`'s host. A wrapper URL on `home_url()` would arrive
	// without the cookie on installs where the two hosts differ, and the
	// endpoint would silently reject the click.
	//
	// `site_url()` runs the `site_url` / `option_siteurl` filters and
	// `wp_set_current_user()` fires the `set_current_user` action; a
	// callback belonging to the fataling extension could throw and
	// re-fatal the screen — drop the link rather than escalate.
	try {
		wp_set_current_user( $user_id );
		wpcomsh_fatal_pin_recover_nonce_life();
		return add_query_arg(
			array(
				'wpcomsh_recover' => '1',
				'_wpnonce'        => wp_create_nonce( 'wpcomsh_recover' ),
			),
			site_url( '/' )
		);
	} catch ( \Throwable $e ) {
		return '';
	}
}

/**
 * Register a `nonce_life` filter at `PHP_INT_MAX` that pins `DAY_IN_SECONDS`
 * for the `wpcomsh_recover` action only, so the tick used at mint time
 * (screen render, after plugins load) and verify time (mu-plugin file load,
 * before plugins iterate) always agrees. Without this, a regular plugin
 * that unconditionally filters `nonce_life` at default priority would
 * shift the mint-side tick but not the verify-side tick (its callback
 * isn't registered yet at mu-plugin time), and the click would silently
 * fail verification.
 *
 * Idempotent (named callback) so call sites can invoke this lazily, just
 * before `wp_create_nonce` / `wp_verify_nonce` — keeps the filter out of
 * `nonce_life` dispatch on requests that don't touch the recovery flow.
 *
 * @return void
 */
function wpcomsh_fatal_pin_recover_nonce_life() {
	add_filter( 'nonce_life', '_wpcomsh_fatal_recover_nonce_life', PHP_INT_MAX, 2 );
}

/**
 * Filter callback for `wpcomsh_fatal_pin_recover_nonce_life()`. Returns
 * `DAY_IN_SECONDS` for the `wpcomsh_recover` action and the upstream
 * value for everything else.
 *
 * `$action = null` so a one-arg `apply_filters( 'nonce_life', $life )` from
 * plugin code (allowed by the public filter contract) doesn't trip an
 * ArgumentCountError under PHP 8+.
 *
 * @param int         $life   Upstream nonce lifetime.
 * @param string|null $action Action passed to `wp_nonce_tick()`.
 * @return int
 */
function _wpcomsh_fatal_recover_nonce_life( $life, $action = null ) {
	return 'wpcomsh_recover' === $action ? DAY_IN_SECONDS : $life;
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
