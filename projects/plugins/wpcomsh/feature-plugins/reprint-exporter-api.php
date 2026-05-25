<?php
/**
 * Reprint Exporter API — wpcomsh integration for the reprint-exporter package.
 *
 * Exposes export endpoints at ?reprint-api.
 *
 * Gating:
 *
 * * rotate-secret REST route is always registered; its permission
 *   callback only accepts Jetpack-signed requests, so it can only be
 *   invoked through the WPCOM public API proxy.
 * * ?reprint-api export requires the reprint_exporter_enabled site
 *   option to be a unix timestamp within the last 60 minutes, AND a
 *   valid HMAC signature produced with the per-site shared secret.
 *   Each accepted request bumps the timestamp, so an idle site
 *   auto-closes the gate.
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
 * Sites, whose template_redirect hooks redirect + exit).
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
 * Registers the reprint REST route. Always on — auth is enforced in the
 * controller's permission callback, which only accepts Jetpack-signed
 * requests (i.e. calls coming through the public API).
 */
function wpcomsh_reprint_rest_init() {
	require_once __DIR__ . '/class-reprint-exporter-rest-controller.php';
	( new Reprint_Exporter_Rest_Controller() )->register_routes();
}
add_action( 'rest_api_init', 'wpcomsh_reprint_rest_init' );

/**
 * Inject reprint_exporter_enabled into the site settings update if
 * the caller sent it.
 *
 * This lives in wpcomsh, not in the Jetpack site-settings-endpoint.php,
 * because setting this option doesn't make sense in Jetpack context. It
 * is only meaningful in context of wpcomsh's reprint integration.
 *
 * @param array $input            Whitelisted/cast settings.
 * @param array $unfiltered_input Raw input from the request.
 * @return array
 */
function wpcomsh_reprint_inject_enabled_setting( $input, $unfiltered_input ) {
	if ( isset( $unfiltered_input['reprint_exporter_enabled'] ) ) {
		$input['reprint_exporter_enabled'] = (int) $unfiltered_input['reprint_exporter_enabled'];
	}
	return $input;
}
add_filter( 'rest_api_update_site_settings', 'wpcomsh_reprint_inject_enabled_setting', 10, 2 );

/**
 * Persist reprint_exporter_enabled when the settings endpoint processes
 * it. The default case in update_settings() does NOT call update_option
 * when a per-key filter is registered — the filter is expected to
 * handle persistence itself.
 *
 * @param mixed $value The value from the request.
 * @return int The persisted value (returned for the response body).
 */
function wpcomsh_reprint_update_enabled_setting( $value ) {
	$value = (int) $value;
	update_option( 'reprint_exporter_enabled', $value );
	return $value;
}
add_filter( 'site_settings_endpoint_update_reprint_exporter_enabled', 'wpcomsh_reprint_update_enabled_setting' );

// -- Helpers ------------------------------------------------------------------

/**
 * Gate for the ?reprint-api export handler: the reprint_exporter_enabled
 * option must hold a unix timestamp within the last 60 minutes. HMAC
 * verification happens separately in the request handler.
 *
 * @return bool
 */
function _should_expose_reprint_exporter_on_this_site(): bool {
	$enabled_at = (int) get_option( 'reprint_exporter_enabled', 0 );
	return $enabled_at > 0 && ( time() - $enabled_at ) <= HOUR_IN_SECONDS;
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
