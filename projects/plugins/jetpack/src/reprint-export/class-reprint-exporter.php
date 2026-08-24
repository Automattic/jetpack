<?php
/**
 * HMAC-authenticated, time-limited Reprint export for Pressable and Atomic
 * sites.
 *
 * On Atomic, this shares export options with wpcomsh while using distinct REST
 * and query-var surfaces, so both integrations can run simultaneously.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Reprint_Export;

use Automattic\Jetpack\Constants;
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
	 * Initializes Reprint export where it is available.
	 */
	public static function maybe_init() {
		if ( self::is_available() ) {
			self::init();
		}
	}

	/**
	 * Registers the WordPress hooks. Only ever called on sites where
	 * is_available() is true (see maybe_init()).
	 */
	public static function init() {
		add_action( 'parse_request', array( new self(), 'handle_request' ), 0 );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
	}

	/**
	 * Whether Reprint export support is available on the current site.
	 *
	 * Defaults to true on Pressable and WordPress.com (Atomic) hosts and false
	 * elsewhere. The filter can override this value.
	 *
	 * @return bool
	 */
	public static function is_available() {
		$available = Constants::is_true( 'IS_PRESSABLE' ) || ( new Host() )->is_atomic_platform();

		/**
		 * Filters whether Jetpack Reprint export support is available on the
		 * current site.
		 *
		 * Default: true on Pressable and WordPress.com (Atomic), false elsewhere.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $available Whether Reprint export support is available.
		 */
		return (bool) apply_filters( 'jetpack_reprint_export_available', $available );
	}

	/**
	 * Registers Reprint REST routes.
	 */
	public static function register_rest_routes() {
		( new REST_Controller() )->register_routes();
	}

	/**
	 * Handles the ?reprint-api-jetpack request.
	 *
	 * Runs before template redirects so export requests also work on private
	 * sites.
	 *
	 * @param \WP $wp The WordPress environment instance.
	 */
	public function handle_request( $wp ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['reprint-api-jetpack'] ) ) {
			return;
		}

		// Recheck availability so a filter can disable an already registered handler.
		if ( ! self::is_available() ) {
			return;
		}

		// Do not let the query var claim non-root WordPress routes.
		if ( '' !== $wp->request ) {
			return;
		}

		if ( ! self::is_export_window_open() ) {
			return;
		}

		// HMAC authentication, not Origin, controls access to exports.
		// Handle browser preflights before HMAC because they carry no credentials.
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

		// A Reprint export happens over many separate requests and a full
		// export can take longer than an hour. Keep the export window open
		// while a client is actively exporting.
		self::open_export_window();

		try {
			$this->serve_export();
		} catch ( \InvalidArgumentException $exception ) {
			$this->error( 400, $exception->getMessage() );
			return;
		}
		$this->terminate();
	}

	/**
	 * Whether the current export window is open.
	 *
	 * @return bool
	 */
	public static function is_export_window_open() {
		$enabled_at = (int) get_option( self::ENABLED_OPTION, 0 );
		$now        = time();
		return $enabled_at > 0
			&& $enabled_at <= $now + self::HMAC_CLOCK_SKEW
			&& ( $now - $enabled_at ) <= HOUR_IN_SECONDS;
	}

	/**
	 * Opens the export window by stamping the enabled option with the current
	 * time.
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
