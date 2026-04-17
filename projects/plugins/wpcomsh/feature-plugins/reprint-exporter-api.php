<?php
/**
 * Reprint Exporter API — wpcomsh integration for the reprint-exporter package.
 *
 * Exposes export endpoints at ?reprint-api for Automatticians proxying
 * in through the a8c proxy.
 *
 * The entire feature is currently gated behind a proxied-Automattician
 * check so it cannot be reached by customers while the end-to-end Studio
 * flow is still being built. Once that ships, the gate can be relaxed.
 *
 * Data flow has two phases that use different auth and network paths:
 *
 * 1. Secret provisioning via the generic Jetpack REST proxy. There is
 *    no dedicated /wpcom/v2/sites/{id}/reprint/... public-api endpoint.
 *    Studio uses the pass-through proxy that ships with Jetpack, which
 *    takes a `path` in the POST body and forwards it to the site as a
 *    REST call. The actual request Studio makes:
 *
 *        POST https://public-api.wordpress.com/rest/v1.1/jetpack-blogs/{site_id}/rest-api?http_envelope=1
 *        Authorization: Bearer <WPCOM OAuth token>
 *        Content-Type: application/json
 *
 *        { "path": "/wpcomsh/v1/reprint/rotate-export-secret" }
 *
 *    WPCOM verifies the OAuth token, maps the caller to a user on the
 *    target site, and re-issues the request internally against
 *    /wpcomsh/v1/reprint/rotate-export-secret. The route's permission
 *    callback (is_super_admin()) runs against the mapped user. On
 *    success the site generates a 64-byte hex secret via random_bytes(32),
 *    stores it in the reprint_exporter_secret option, and returns it.
 *
 *    http_envelope=1 makes the proxy wrap non-2xx site responses in a
 *    200 envelope, which is what Studio's schema expects.
 *
 * 2. Export streaming — the client (now holding the shared secret)
 *    talks directly to the site at ?reprint-api, bypassing the public
 *    API entirely. Each request is signed with HMAC using the shared
 *    secret from step 1 — the X-Auth-Signature, X-Auth-Nonce,
 *    X-Auth-Timestamp, and X-Auth-Content-Hash headers are verified by
 *    Site_Export_HMAC_Server from the reprint-exporter package. This
 *    direct connection avoids the public API's request size and timeout
 *    limits, which matter for large exports.
 *
 * HMAC verification is handled by Site_Export_HMAC_Server from the
 * wp-php-toolkit/reprint-exporter package. The actual export logic
 * (SQL dumps, file streaming, multipart responses) lives entirely
 * in the package — this file only handles wpcomsh-specific concerns:
 * CORS, HMAC secret management, the proxied-Automattician gate, and
 * the REST route for secret rotation.
 *
 * @package wpcomsh
 */

// -- Constants ----------------------------------------------------------------

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
 * the caller is not a proxied Automattician, the function returns
 * immediately and normal WordPress execution continues.
 *
 * @codeCoverageIgnore — calls exit().
 */
function wpcomsh_reprint_handle_request() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! isset( $_GET['reprint-api'] ) ) {
		return;
	}

	if ( ! _reprint_exporter_is_available() ) {
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
	$wpcomsh_root       = dirname( __DIR__ );
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
	$secret = get_option( REPRINT_EXPORTER_SECRET_OPTION, '' );
	if ( ! is_string( $secret ) || '' === $secret ) {
		_reprint_exporter_error( 503, 'Export not configured. Please rotate the shared secret via POST /wpcomsh/v1/reprint/rotate-export-secret.' );
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
 * Registers the reprint REST route.
 *
 * Only registers when the caller is a proxied Automattician. The route
 * itself lives in Reprint_Exporter_Rest_Controller; this function just
 * instantiates it behind the availability gate so customers never see
 * the route in the REST index.
 */
function wpcomsh_reprint_rest_init() {
	if ( ! _reprint_exporter_is_available() ) {
		return;
	}

	require_once __DIR__ . '/class-reprint-exporter-rest-controller.php';
	( new Reprint_Exporter_Rest_Controller() )->register_routes();
}
add_action( 'rest_api_init', 'wpcomsh_reprint_rest_init' );

// -- Helpers ------------------------------------------------------------------

/**
 * Whether the reprint exporter endpoints are available to the current request.
 *
 * Available only for Automatticians proxying in through the a8c proxy.
 * This keeps the feature completely dark to customers while the end-to-end
 * Studio flow is still being built. The check is filterable so site
 * operators (and tests) can override it — e.g. enable it permanently on a
 * dedicated internal site by returning true from the filter.
 *
 * @return bool
 */
function _reprint_exporter_is_available(): bool {
	$is_proxied = isset( $_SERVER['A8C_PROXIED_REQUEST'] )
		? (bool) sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
		: ( defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST );

	$is_proxied_automattician = $is_proxied
		&& function_exists( '\is_automattician' )
		&& \is_automattician( get_current_user_id() );

	/**
	 * Filters whether the reprint exporter endpoints are available.
	 *
	 * Defaults to true only for Automatticians proxying through a8c while
	 * the feature is still being rolled out. Override in site-specific code
	 * or in tests to enable/disable without the proxy header.
	 *
	 * @param bool $available Whether the endpoints are available.
	 */
	return (bool) apply_filters( 'wpcomsh_reprint_exporter_available', $is_proxied_automattician );
}

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
