<?php
/**
 * Reprint export support for Jetpack on Pressable and WordPress.com (Atomic).
 *
 * Mirrors the behavior shipped in wpcomsh for WordPress.com on Atomic, but
 * hosted in Jetpack so it also serves Pressable and can eventually replace the
 * wpcomsh copy. It exposes an HMAC-authenticated, time-limited full-site export
 * endpoint backed by the wp-php-toolkit/reprint-exporter package.
 *
 * On Atomic this runs alongside the wpcomsh copy without colliding: it uses a
 * distinct query var (?reprint-api-jetpack) and REST namespace (jetpack/v4/*), so
 * clients can migrate off the old ?reprint-api / wpcomsh/v1 surface at their
 * own pace.
 *
 * Gating, in two phases that use different auth and network paths:
 *
 * 1. Secret rotation via the generic Jetpack REST proxy. The
 *    /jetpack/v4/reprint/rotate-export-secret route only accepts
 *    Jetpack-signed requests, so it can only be invoked through the
 *    WordPress.com public API proxy. On success the site generates a random
 *    secret, stores it in the `reprint_exporter_secret` option, opens the
 *    export window, and returns the secret.
 *
 * 2. Export streaming — the client (now holding the shared secret) talks
 *    directly to the site at ?reprint-api-jetpack using HMAC-signed requests. This
 *    bypasses the public API entirely because public-api does not support
 *    streaming and extra hops add latency and complexity.
 *
 * The whole feature is gated behind the host check (overridable via the
 * `jetpack_reprint_export_available` filter), so generic self-hosted Jetpack
 * sites never register or expose any of it.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Reprint_Export;

use Automattic\Jetpack\Status\Host;

/**
 * Reprint exporter for Jetpack (Pressable and WordPress.com/Atomic).
 */
class Reprint_Exporter {

	/**
	 * Option holding the per-site HMAC shared secret.
	 *
	 * @var string
	 */
	const SECRET_OPTION = 'reprint_exporter_secret';

	/**
	 * Option holding the unix timestamp of the last time the export window
	 * was opened. The window is a sliding 60-minute one.
	 *
	 * @var string
	 */
	const ENABLED_OPTION = 'reprint_exporter_enabled';

	/**
	 * Clock-skew tolerance, in seconds, allowed for HMAC signatures.
	 *
	 * @var int
	 */
	const HMAC_CLOCK_SKEW = 300;

	/**
	 * Registers the WordPress hooks. Only ever called on sites where
	 * is_available() is true (see Jetpack bootstrap).
	 */
	public static function init() {
		add_action( 'parse_request', array( new self(), 'handle_request' ), 0 );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
	}

	/**
	 * Whether Reprint export support is available on the current site.
	 *
	 * Defaults to true on Pressable and WordPress.com (Atomic) hosts, false
	 * everywhere else. The filter acts as both an override for testing and an
	 * emergency kill switch.
	 *
	 * On Atomic this coexists with the copy shipped in wpcomsh: the two use
	 * different query vars (?reprint-api-jetpack here vs ?reprint-api there) and
	 * REST namespaces (jetpack/v4 vs wpcomsh/v1), so both can run side by side
	 * while clients migrate to the Jetpack surface. Atomic detection uses
	 * is_atomic_platform() rather than is_woa_site() so it keeps working once
	 * wpcomsh (and its reprint copy) is removed.
	 *
	 * @return bool
	 */
	public static function is_available() {
		$host      = new Host();
		$available = $host->is_pressable() || $host->is_atomic_platform();

		/**
		 * Filters whether Jetpack Reprint export support is available on the
		 * current site.
		 *
		 * Default: true on Pressable and WordPress.com (Atomic), false elsewhere.
		 *
		 * @since 16.1
		 *
		 * @param bool $available Whether Reprint export support is available.
		 */
		return (bool) apply_filters( 'jetpack_reprint_export_available', $available );
	}

	/**
	 * Registers the secret-rotation REST route.
	 */
	public static function register_rest_routes() {
		( new REST_Controller() )->register_routes();
	}

	/**
	 * Handles the ?reprint-api-jetpack request.
	 *
	 * Hooked on `parse_request` at priority 0 so we run before WordPress
	 * resolves the query and long before any template output (important on
	 * Private Sites, whose template_redirect hooks redirect + exit).
	 *
	 * @param \WP $wp The WordPress environment instance.
	 */
	public function handle_request( $wp ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['reprint-api-jetpack'] ) ) {
			return;
		}

		// Defense in depth: the hook is only registered when available, but
		// re-check so the filter kill switch also short-circuits live requests.
		if ( ! self::is_available() ) {
			return;
		}

		// Only respond on the root path, matching the wpcomsh behavior.
		if ( '' !== $wp->request ) {
			return;
		}

		// Sliding activation window: the export stays open only for 60
		// minutes since the last accepted request, so an idle site
		// auto-closes the gate. HMAC verification happens separately below.
		if ( ! self::is_export_window_open() ) {
			return;
		}

		// -- CORS -------------------------------------------------------------
		// Allow CORS from any origin. The export client (e.g. Playground)
		// runs on many different deployments and new ones appear regularly.
		// Since every export request requires a dedicated HMAC secret, the
		// origin header is not a meaningful security boundary — an attacker
		// without the secret cannot export anything regardless of origin.
		//
		// Must run before authentication: browsers send the OPTIONS preflight
		// without credentials, so auth must not be required for that method.
		if ( ! headers_sent() ) {
			header( 'Access-Control-Allow-Origin: *' );
			header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
			header( 'Access-Control-Allow-Headers: *' );
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$request_method = isset( $_SERVER['REQUEST_METHOD'] ) ? strtoupper( $_SERVER['REQUEST_METHOD'] ) : '';
		if ( 'OPTIONS' === $request_method ) {
			if ( ! headers_sent() ) {
				header( 'Allow: GET, POST, OPTIONS' );
			}
			$this->terminate();
			return;
		}

		// -- Authenticate via HMAC --------------------------------------------
		$secret = get_option( self::SECRET_OPTION, '' );
		if ( ! is_string( $secret ) || '' === $secret ) {
			$this->error( 503, 'Export not configured. Please rotate the shared secret via POST /jetpack/v4/reprint/rotate-export-secret.' );
			return;
		}

		$auth_error = $this->verify_hmac( $secret );
		if ( null !== $auth_error ) {
			$this->error( 403, $auth_error );
			return;
		}

		// Bump the timestamp now that we know this request is legit.
		self::open_export_window();

		// WordPress is already loaded at this point. Run Reprint!
		$this->serve_export();
		$this->terminate();
	}

	/**
	 * Gate for the export handler: the enabled option must hold a unix
	 * timestamp within the last 60 minutes.
	 *
	 * @return bool
	 */
	public static function is_export_window_open() {
		$enabled_at = (int) get_option( self::ENABLED_OPTION, 0 );
		return $enabled_at > 0 && ( time() - $enabled_at ) <= HOUR_IN_SECONDS;
	}

	/**
	 * Opens (or slides forward) the 60-minute export window by stamping the
	 * enabled option with the current time.
	 *
	 * Shared by the REST enable/rotate routes and the request handler's
	 * post-auth bump, so the window is opened the same way everywhere.
	 *
	 * @return int The unix timestamp the window was opened at.
	 */
	public static function open_export_window() {
		$now = time();
		update_option( self::ENABLED_OPTION, $now );
		return $now;
	}

	/**
	 * Verifies the HMAC signature of the current request.
	 *
	 * Seam for tests to override without instantiating the real server.
	 *
	 * @param string $secret The per-site shared secret.
	 * @return string|null Error message on failure, null on success.
	 */
	protected function verify_hmac( $secret ) {
		$hmac_server = new \Site_Export_HMAC_Server( $secret, self::HMAC_CLOCK_SKEW );
		return $hmac_server->verify_globals();
	}

	/**
	 * Streams the export response.
	 *
	 * Seam for tests to override so they don't perform a real export.
	 */
	protected function serve_export() {
		\Site_Export_HTTP_Server::serve( array( 'default_directory' => ABSPATH ) );
	}

	/**
	 * Sends a JSON error response and terminates.
	 *
	 * @param int    $code    HTTP status code.
	 * @param string $message Error description.
	 */
	protected function error( $code, $message ) {
		if ( ! headers_sent() ) {
			http_response_code( $code );
			header( 'Content-Type: application/json' );
		}
		// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
		echo json_encode(
			array(
				'error' => $message,
				'code'  => $code,
			),
			JSON_FORCE_OBJECT
		);
		$this->terminate();
	}

	/**
	 * Terminates the request.
	 *
	 * Seam wrapping exit() so tests (which redefine exit via patchwork) can
	 * assert termination without killing the process.
	 */
	protected function terminate() {
		exit;
	}
}
