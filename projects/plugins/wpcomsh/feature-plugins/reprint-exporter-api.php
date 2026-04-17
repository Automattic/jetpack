<?php
/**
 * Reprint Exporter API — wpcomsh integration for the reprint-exporter package.
 *
 * Exposes export endpoints at ?reprint-api.
 *
 * The entire feature is gated on the reprint_exporter_enabled site
 * option, which defaults to off. No admin UI exposes the option, so
 * customers never see the feature unless ops flips it on (e.g. via
 * wp-cli). When the option is off, neither the ?reprint-api handler
 * nor the REST route is reachable.
 *
 * Data flow has two phases that use different auth and network paths:
 *
 * 1. Secret rotation via the generic Jetpack REST proxy.
 *    Studio uses the pass-through proxy that ships with Jetpack.
 *    There is no dedicated /wpcom/v2/sites/{id}/reprint/... public-api
 *    endpoint:
 *
 *        POST https://public-api.wordpress.com/rest/v1.1/jetpack-blogs/{site_id}/rest-api?http_envelope=1
 *        Authorization: Bearer <WPCOM OAuth token>
 *        Content-Type: application/json
 *
 *        { "path": "/wpcomsh/v1/reprint/rotate-export-secret" }
 *
 *    WPCOM then verifies the OAuth token, maps the caller to a user on the
 *    target site, and re-issues the request internally against
 *    /wpcomsh/v1/reprint/rotate-export-secret. The route's permission
 *    callback (is_super_admin()) runs against the mapped user. On
 *    success the site generates a random secret, stores it in the
 *    reprint_exporter_secret option, and returns it.
 *
 *    That secret is later used to authenticate export requests via HMAC.
 *
 * 2. Export streaming — the client (now holding the shared secret)
 *    talks directly to the site at ?reprint-api using HMAC-signed requests.
 *
 *    This exchange bypasses the public API entirely because:
 *       - public-api doesn't support streaming
 *       - more hops = more complexity, more latency, more request serving
 *         policies to satisfy
 *
 * @package wpcomsh
 */

// -- WordPress hooks ----------------------------------------------------------

/**
 * Handles the ?reprint-api request.
 *
 * Hooked on `parse_request` so it runs before WordPress resolves the
 * query and renders a template. If the query parameter is absent or
 * the feature isn't enabled for this site, the function returns
 * immediately and normal WordPress execution continues.
 *
 * @codeCoverageIgnore — calls exit().
 */
function wpcomsh_reprint_handle_request() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! isset( $_GET['reprint-api'] ) ) {
		return;
	}

	if ( ! _should_expose_reprint_exporter_on_this_site() ) {
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
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$request_method = isset( $_SERVER['REQUEST_METHOD'] ) ? strtoupper( (string) wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) : '';
	if ( 'OPTIONS' === $request_method ) {
		header( 'Allow: GET, POST, OPTIONS' );
		exit;
	}

	// -- Authenticate via HMAC ------------------------------------------------
	// Site_Export_* classes come from the wp-php-toolkit/reprint-exporter
	// Composer package and are registered in the Jetpack autoloader's
	// classmap, which wpcomsh.php bootstraps before any hooks fire.
	$secret = get_option( 'reprint_exporter_secret', '' );
	if ( ! is_string( $secret ) || '' === $secret ) {
		_reprint_exporter_error( 503, 'Export not configured. Please rotate the shared secret via POST /wpcomsh/v1/reprint/rotate-export-secret.' );
	}

	// Verify the request's HMAC signature using Site_Export_HMAC_Server
	// from the reprint-exporter package.
	// 300s tolerance on the request timestamp — rejects anything older
	// to limit the replay window for captured requests.
	$hmac_server = new Site_Export_HMAC_Server( $secret, 300 );
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
 * Only registers when the feature is enabled on this site. The route
 * itself lives in Reprint_Exporter_Rest_Controller; this function just
 * instantiates it behind the availability gate so customers never see
 * the route in the REST index.
 */
function wpcomsh_reprint_rest_init() {
	if ( ! _should_expose_reprint_exporter_on_this_site() ) {
		return;
	}

	require_once __DIR__ . '/class-reprint-exporter-rest-controller.php';
	( new Reprint_Exporter_Rest_Controller() )->register_routes();
}
add_action( 'rest_api_init', 'wpcomsh_reprint_rest_init' );

// -- Helpers ------------------------------------------------------------------

/**
 * Whether the reprint exporter endpoints are exposed on this site.
 *
 * Controlled by the reprint_exporter_enabled site option. Defaults to
 * disabled — flip the option to 1 (e.g. via wp-cli) to enable the
 * feature on a specific site. No admin UI exposes this option, so it
 * stays off for customers unless ops turns it on deliberately.
 *
 * @return bool
 */
function _should_expose_reprint_exporter_on_this_site(): bool {
	return (bool) get_option( 'reprint_exporter_enabled', false );
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
