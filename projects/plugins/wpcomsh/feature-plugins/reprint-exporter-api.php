<?php
/**
 * Reprint Exporter API — wpcomsh integration for the reprint-exporter package.
 *
 * Exposes export endpoints at ?reprint-api.
 *
 * Two-tier gate, both tied to the reprint_exporter_enabled site option
 * (unix timestamp, fresh within 60 minutes; ?reprint-api bumps it on
 * every accepted request):
 *
 * * rotate-secret REST route needs only the fresh option; auth is the
 *   public API + is_super_admin().
 * * ?reprint-api export additionally requires a proxied Automattician,
 *   so the streaming endpoint stays internal-only until Studio ships.
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
 * Hooked on `parse_request` so we run before WordPress resolves the
 * query and long before any template output (important on Private
 * Sites, whose template_redirect hooks redirect + exit). If the query
 * parameter is absent, the URL isn't the site root, or the feature
 * isn't enabled for this site, the function returns immediately and
 * normal WordPress execution continues.
 *
 * @param WP $wp The WordPress environment instance.
 *
 * @codeCoverageIgnore — calls exit().
 */
function wpcomsh_reprint_handle_request( $wp ) {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! isset( $_GET['reprint-api'] ) ) {
		return;
	}

	// Homepage guard. WP's parse_request takes $_SERVER['REQUEST_URI'],
	// strips the path component of home_url() (so a subdirectory install
	// at /subdir/ behaves the same as a root install at /), normalizes
	// the rest, and stores the result in $wp->request. An empty string
	// therefore means "the request hit the site root", independent of
	// host, port, or where WordPress lives. is_front_page() / is_home()
	// would be the wrong tool here anyway — they read state from the
	// main query, which parse_request runs before.
	if ( '' !== $wp->request ) {
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
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
	$request_method = isset( $_SERVER['REQUEST_METHOD'] ) ? strtoupper( $_SERVER['REQUEST_METHOD'] ) : '';
	if ( 'OPTIONS' === $request_method ) {
		header( 'Allow: GET, POST, OPTIONS' );
		exit;
	}

	// -- Authenticate via HMAC ------------------------------------------------
	$secret = get_option( 'reprint_exporter_secret', '' );
	if ( ! is_string( $secret ) || '' === $secret ) {
		_reprint_exporter_error( 503, 'Export not configured. Please rotate the shared secret via POST /wpcomsh/v1/reprint/rotate-export-secret.' );
	}

	// HMAC signatures tolerate up to 5 minutes of clock skew.
	$hmac_server = new Site_Export_HMAC_Server( $secret, 300 );
	$auth_error  = $hmac_server->verify_globals();
	if ( null !== $auth_error ) {
		_reprint_exporter_error( 403, $auth_error );
	}

	// Sliding activation window — the reprint_exporter_enabled option
	// only keeps the feature open for 60 minutes since the last accepted
	// request, so an idle site auto-closes the gate. Bump the timestamp
	// now that we know this request is legit.
	update_option( 'reprint_exporter_enabled', time() );

	// WordPress is already loaded at this point.
	// Let's run Reprint!
	Site_Export_HTTP_Server::serve( array( 'default_directory' => ABSPATH ) );
	exit;
}
add_action( 'parse_request', 'wpcomsh_reprint_handle_request', 0 );

/**
 * Registers the reprint REST route when the activation option is fresh.
 *
 * The proxied-Automattician check doesn't apply here — public-api-proxied
 * requests don't carry A8C_PROXIED_REQUEST, and gating on it would lock
 * Studio out. Auth on the route is the public API + is_super_admin().
 */
function wpcomsh_reprint_rest_init() {
	if ( ! _reprint_exporter_is_currently_activated() ) {
		return;
	}

	require_once __DIR__ . '/class-reprint-exporter-rest-controller.php';
	( new Reprint_Exporter_Rest_Controller() )->register_routes();
}
add_action( 'rest_api_init', 'wpcomsh_reprint_rest_init' );

// -- Helpers ------------------------------------------------------------------

/**
 * True when reprint_exporter_enabled holds a unix timestamp within the
 * last 60 minutes. Gate for the rotate-secret REST route.
 *
 * @return bool
 */
function _reprint_exporter_is_currently_activated(): bool {
	$enabled_at = (int) get_option( 'reprint_exporter_enabled', 0 );
	return $enabled_at > 0 && ( time() - $enabled_at ) <= HOUR_IN_SECONDS;
}

/**
 * Stricter gate for the ?reprint-api export handler: activation window
 * (above) AND a proxied-Automattician request.
 *
 * @return bool
 */
function _should_expose_reprint_exporter_on_this_site(): bool {
	if ( ! _reprint_exporter_is_currently_activated() ) {
		return false;
	}

	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
	$is_proxied = isset( $_SERVER['A8C_PROXIED_REQUEST'] )
		? (bool) $_SERVER['A8C_PROXIED_REQUEST']
		: ( defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST );

	return $is_proxied
		&& function_exists( '\is_automattician' )
		&& \is_automattician( get_current_user_id() );
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
