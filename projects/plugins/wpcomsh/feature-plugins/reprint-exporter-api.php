<?php
/**
 * Reprint Exporter API — wpcomsh integration for the reprint-exporter package.
 *
 * Exposes export endpoints at ?reprint-api when the "reprint"
 * Jetpack module is enabled. The legacy ?site-export-api query parameter
 * is still accepted for backward compatibility with existing clients.
 *
 * Data flow has two phases that use different auth and network paths:
 *
 * 1. Secret provisioning — Studio (or another client) calls the WPCOM
 *    public API at /wpcom/v2/sites/{id}/reprint/rotate-export-secret,
 *    authenticating with its regular WPCOM auth token. The proxy verifies
 *    the token, checks the caller is a super-admin, and forwards the
 *    request to the site's POST /wp/v2/reprint/rotate-export-secret
 *    REST route. The site generates a shared secret and returns it.
 *    (The old /wp/v2/streaming-export/rotate-secret path is still
 *    registered as a backward-compatible alias.)
 *
 * 2. Export streaming — the client talks directly to the site at
 *    ?reprint-api, bypassing the public API entirely. Each request is
 *    signed with HMAC using the shared secret from step 1 (X-Auth-
 *    Signature, X-Auth-Nonce, X-Auth-Timestamp, X-Auth-Content-Hash).
 *    The direct connection avoids the public API's request size and
 *    timeout limits, which matter for large exports.
 *
 * HMAC verification is handled by Site_Export_HMAC_Server from the
 * wp-php-toolkit/reprint-exporter package. The actual export logic
 * (SQL dumps, file streaming, multipart responses) lives entirely
 * in the package — this file only handles wpcomsh-specific concerns:
 * CORS, HMAC secret management, Jetpack module gating, and the
 * REST route for secret rotation.
 *
 * @package wpcomsh
 */

// -- Constants ----------------------------------------------------------------

if ( ! defined( 'REPRINT_EXPORTER_PLUGIN_DIR' ) ) {
	define( 'REPRINT_EXPORTER_PLUGIN_DIR', __DIR__ . '/' );
}
if ( ! defined( 'REPRINT_EXPORTER_SECRET_FILE' ) ) {
	define( 'REPRINT_EXPORTER_SECRET_FILE', REPRINT_EXPORTER_PLUGIN_DIR . 'secret.php' );
}
if ( ! defined( 'REPRINT_EXPORTER_SECRET_OPTION' ) ) {
	define( 'REPRINT_EXPORTER_SECRET_OPTION', 'reprint_exporter_secret' );
}

/**
 * Maximum age of a request timestamp in seconds.
 * Requests older than this are rejected to prevent replay attacks.
 */
if ( ! defined( 'REPRINT_EXPORTER_TIMESTAMP_TOLERANCE' ) ) {
	define( 'REPRINT_EXPORTER_TIMESTAMP_TOLERANCE', 300 );
}

// -- WordPress hooks ----------------------------------------------------------

/**
 * Handles the ?reprint-api request.
 *
 * Hooked on `parse_request` so it runs before WordPress resolves the
 * query and renders a template. If the query parameter is absent or
 * the Jetpack module is inactive, the function returns immediately
 * and normal WordPress execution continues.
 *
 * Accepts both ?reprint-api (canonical) and ?site-export-api (legacy)
 * so existing clients keep working while new ones migrate.
 *
 * @codeCoverageIgnore — calls exit().
 */
function wpcomsh_reprint_handle_request() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! isset( $_GET['reprint-api'] ) && ! isset( $_GET['site-export-api'] ) ) {
		return;
	}

	if ( ! class_exists( 'Jetpack' ) || ! Jetpack::is_module_active( 'reprint' ) ) {
		return;
	}

	// -- CORS -----------------------------------------------------------------
	// Allow CORS from any origin. Playground runs on many different
	// deployments (playground.wordpress.net, wasm.wordpress.net, local
	// dev servers, self-hosted instances, etc.) and new ones appear
	// regularly. Since every export request requires a dedicated HMAC
	// secret, the origin header adds no meaningful security boundary —
	// an attacker without the secret cannot export anything regardless
	// of origin.
	//
	// Emitted inline (not via Site_Export_HTTP_Server) so a site missing
	// the exporter package still returns usable CORS headers alongside
	// its 500 — otherwise the browser would block the 500 with a CORS
	// error and the admin would never see the underlying problem.
	//
	// Must run before authentication — browsers send OPTIONS preflight
	// without credentials, so auth must not be required for that method.
	header( 'Access-Control-Allow-Origin: *' );
	header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
	header( 'Access-Control-Allow-Headers: *' );
	$request_method = isset( $_SERVER['REQUEST_METHOD'] )
		? strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) )
		: '';
	if ( 'OPTIONS' === $request_method ) {
		header( 'Allow: GET, POST, OPTIONS' );
		exit;
	}

	// -- Load exporter runtime ------------------------------------------------
	// Looks for the reprint-exporter's export.php in wpcomsh's own vendor
	// directory (the normal Composer layout), falling back to the
	// wpcomsh-dev SFTP overlay when the production build doesn't include
	// the package yet.
	$wpcomsh_root       = dirname( REPRINT_EXPORTER_PLUGIN_DIR );
	$runtime_candidates = array(
		array(
			'autoload' => $wpcomsh_root . '/vendor/autoload.php',
			'export'   => $wpcomsh_root . '/vendor/wp-php-toolkit/reprint-exporter/src/export.php',
		),
	);

	// Staging / development fallback. wpcomsh is deployed to Atomic sites
	// by WP Cloud infrastructure, so the vendor directory above may not
	// contain the reprint-exporter package until a release ships it.
	// During development a developer can SFTP a full wpcomsh build
	// (with vendor/) into wp-content/mu-plugins/wpcomsh-dev/ and the
	// exporter will load from there instead.
	if ( defined( 'WPMU_PLUGIN_DIR' ) ) {
		$dev_root             = WPMU_PLUGIN_DIR . '/wpcomsh-dev';
		$runtime_candidates[] = array(
			'autoload' => $dev_root . '/vendor/autoload.php',
			'export'   => $dev_root . '/vendor/wp-php-toolkit/reprint-exporter/src/export.php',
		);
	}

	$runtime_found = false;
	foreach ( $runtime_candidates as $candidate ) {
		if ( file_exists( $candidate['autoload'] ) && file_exists( $candidate['export'] ) ) {
			require_once $candidate['autoload'];
			$runtime_found = true;
			break;
		}
	}

	if ( ! $runtime_found ) {
		_reprint_exporter_error(
			500,
			'Reprint Exporter runtime is incomplete. The wp-php-toolkit/reprint-exporter package may not be installed.'
		);
	}

	// -- Authenticate via HMAC ------------------------------------------------
	// Resolve the shared secret. The secret.php file override takes
	// precedence when present; otherwise the option-backed secret is used.
	$has_secret_file = file_exists( REPRINT_EXPORTER_SECRET_FILE );
	$secret          = null;

	if ( $has_secret_file ) {
		// A site operator can drop a secret.php file that returns a string
		// into the feature-plugins directory to hard-code the HMAC shared
		// secret. This is useful on environments where the database option
		// may not be available or where the secret must survive a database
		// reset. When present, it takes precedence over the option-backed
		// secret.
		$file_secret = require REPRINT_EXPORTER_SECRET_FILE;
		if ( is_string( $file_secret ) ) {
			$secret = $file_secret;
		}
	} elseif ( function_exists( 'get_option' ) ) {
		// This file can be loaded before WordPress is fully bootstrapped
		// (e.g., by the ?reprint-api handler on parse_request when
		// mu-plugins are still initializing). Guard against that.
		$option_secret = get_option( REPRINT_EXPORTER_SECRET_OPTION, '' );
		if ( is_string( $option_secret ) && '' !== $option_secret ) {
			$secret = $option_secret;
		}
	}

	if ( null === $secret ) {
		// Distinguish "secret.php file exists but is empty/invalid" from
		// "no secret configured at all" so the error message tells the
		// admin what to fix.
		if ( $has_secret_file ) {
			_reprint_exporter_error( 503, 'Invalid secret.php configuration. Please remove it or replace it with a valid shared secret.' );
		}
		_reprint_exporter_error( 503, 'Export not configured. Please rotate the shared secret via POST /wp/v2/reprint/rotate-export-secret.' );
	}

	// Verify the request's HMAC signature using Site_Export_HMAC_Server
	// from the reprint-exporter package.
	$hmac_server = new Site_Export_HMAC_Server( $secret, REPRINT_EXPORTER_TIMESTAMP_TOLERANCE );
	$auth_error  = $hmac_server->verify_globals();
	if ( null !== $auth_error ) {
		_reprint_exporter_error( 403, $auth_error );
	}

	// -- Dispatch -------------------------------------------------------------
	// WordPress is already loaded at this point — DB credentials,
	// $table_prefix, and the database layer (including the SQLite db.php
	// drop-in when present) are all available. Delegate config parsing,
	// cursor decoding, budget creation, and endpoint dispatch to the
	// package's HTTP server.
	Site_Export_HTTP_Server::serve( array( 'default_directory' => ABSPATH ) );
	exit;
}
add_action( 'parse_request', 'wpcomsh_reprint_handle_request', 0 );

/**
 * Registers the reprint REST routes.
 *
 * Only registers when the "reprint" Jetpack module is active.
 * Both the canonical /wp/v2/reprint/rotate-export-secret and the legacy
 * /wp/v2/streaming-export/rotate-secret paths are registered so existing
 * clients continue to work.
 */
function wpcomsh_reprint_rest_init() {
	if ( ! class_exists( 'Jetpack' ) || ! Jetpack::is_module_active( 'reprint' ) ) {
		return;
	}

	$route_args = array(
		array(
			'methods'             => 'POST',
			'callback'            => 'wpcomsh_reprint_rotate_secret_callback',
			'permission_callback' => 'wpcomsh_reprint_permission_callback',
		),
	);

	register_rest_route( 'wp/v2', '/reprint/rotate-export-secret', $route_args );

	// Back-compat alias — keep the old URL working for existing clients.
	register_rest_route( 'wp/v2', '/streaming-export/rotate-secret', $route_args );
}
add_action( 'rest_api_init', 'wpcomsh_reprint_rest_init' );

/**
 * Hide the reprint Jetpack module from non-Automatticians.
 *
 * Temporary gate — until the full Studio / wpcom proxy flow is live,
 * the module should not be visible or activatable by customers. Remove
 * this filter once the end-to-end flow ships.
 *
 * @param array $modules slug => introduced-version map.
 * @return array
 */
function wpcomsh_reprint_hide_module_for_non_automatticians( $modules ) {
	if ( function_exists( '\is_automattician' ) && \is_automattician( get_current_user_id() ) ) {
		return $modules;
	}

	unset( $modules['reprint'] );
	return $modules;
}
add_filter( 'jetpack_get_available_modules', 'wpcomsh_reprint_hide_module_for_non_automatticians' );

/**
 * Rotates the reprint shared secret.
 *
 * Generates a cryptographically random 64-character hex secret, stores it
 * in a WordPress option, and returns it. The caller can then use this
 * secret to authenticate export requests via HMAC without going through
 * the WPCOM REST API proxy.
 *
 * @return WP_REST_Response The new secret on success, or a 500 error.
 */
function wpcomsh_reprint_rotate_secret_callback() {
	$secret = bin2hex( random_bytes( 32 ) );

	// Not atomic: two concurrent rotate calls will both succeed, but
	// the first caller's secret will be overwritten by the second.
	// Acceptable for an admin-only endpoint that is called rarely.
	// Does not affect the secret.php file override — that must be
	// managed by the site operator directly on disk.
	$updated = function_exists( 'update_option' )
		&& (bool) update_option( REPRINT_EXPORTER_SECRET_OPTION, $secret, false );

	if ( ! $updated ) {
		return new WP_REST_Response(
			array( 'error' => 'Failed to persist the new secret. The database option update did not succeed.' ),
			500
		);
	}

	return new WP_REST_Response( array( 'secret' => $secret ), 200 );
}

/**
 * Permission callback for REST routes (rotate-secret).
 *
 * @return bool|WP_Error
 */
function wpcomsh_reprint_permission_callback() {
	if ( is_super_admin() ) {
		return true;
	}

	return new WP_Error(
		'rest_forbidden',
		__( 'Sorry, you are not allowed to access this endpoint.', 'wpcomsh' ),
		array( 'status' => 403 )
	);
}

// -- Helpers ------------------------------------------------------------------

/**
 * Sends a JSON error response and terminates.
 *
 * @param int    $code    HTTP status code.
 * @param string $message Error description.
 * @return never
 *
 * @codeCoverageIgnore — calls exit().
 */
function _reprint_exporter_error( int $code, string $message ): never {
	http_response_code( $code );
	header( 'Content-Type: application/json' );
	// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
	echo json_encode(
		array(
			'error' => $message,
			'code'  => $code,
		),
		JSON_FORCE_OBJECT
	);
	exit;
}
