<?php
/**
 * HMAC-authenticated, time-limited Reprint export for Pressable and Atomic
 * sites.
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
	 * Jetpack-specific option holding the per-site HMAC shared secret.
	 *
	 * @var string
	 */
	const SECRET_OPTION = 'jetpack_reprint_exporter_secret';

	/**
	 * Jetpack-specific option holding the unix timestamp of the last time the
	 * export window was opened. The window is a sliding 60-minute one.
	 *
	 * @var string
	 */
	const ENABLED_OPTION = 'jetpack_reprint_exporter_enabled';

	/**
	 * Clock-skew tolerance, in seconds, allowed for HMAC signatures.
	 *
	 * @var int
	 */
	const HMAC_CLOCK_SKEW = 300;

	/**
	 * Whether the exporter is in the middle of one of its own option writes.
	 *
	 * @var bool
	 */
	private static $writing_own_options = false;

	/**
	 * Initializes Reprint export where it is available.
	 */
	public static function maybe_init() {
		self::protect_options();

		if ( self::is_available() ) {
			self::init();
		}
	}

	/**
	 * Blocks writes to the two export options from anywhere but this class.
	 *
	 * Whoever sets both can export the whole site, since they pick the secret
	 * and can then sign their own requests. Allowed by where the write came
	 * from, not by who is logged in: the usual arbitrary-option-write bug is a
	 * form missing its nonce, running in an administrator's own session.
	 */
	public static function protect_options() {
		foreach ( array( self::SECRET_OPTION, self::ENABLED_OPTION ) as $option ) {
			// Last word: a later filter must not be able to reinstate the value.
			add_filter( "pre_update_option_{$option}", array( __CLASS__, 'veto_foreign_update' ), PHP_INT_MAX, 2 );
		}

		// add_option() has no filter that can cancel a write, only actions either
		// side of the insert, so stopping the request is the only lever.
		add_action( 'add_option', array( __CLASS__, 'veto_foreign_add' ), 10, 1 );
	}

	/**
	 * Cancels a foreign update by handing back the value already stored.
	 *
	 * @param mixed $value     The incoming value.
	 * @param mixed $old_value The value currently stored.
	 * @return mixed The incoming value for our own writes, the stored one otherwise.
	 */
	public static function veto_foreign_update( $value, $old_value ) {
		return self::is_own_option_write() ? $value : $old_value;
	}

	/**
	 * Stops the request when something else tries to create either option.
	 *
	 * @param string $option The option being added.
	 */
	public static function veto_foreign_add( $option ) {
		if ( self::SECRET_OPTION !== $option && self::ENABLED_OPTION !== $option ) {
			return;
		}

		if ( self::is_own_option_write() ) {
			return;
		}

		wp_die(
			esc_html__( 'Reprint export options can only be written by Jetpack itself.', 'jetpack' ),
			esc_html__( 'Forbidden', 'jetpack' ),
			array( 'response' => 403 )
		);
	}

	/**
	 * Whether this write is made by the exporter.
	 *
	 * @return bool
	 */
	private static function is_own_option_write() {
		return self::$writing_own_options;
	}

	/**
	 * Writes one of the export options with the guard held open.
	 *
	 * @param string $option   Option name.
	 * @param mixed  $value    Value to store.
	 * @return bool Whether the value was changed.
	 */
	private static function write_option( $option, $value ) {
		self::$writing_own_options = true;
		try {
			return update_option( $option, $value, false );
		} finally {
			self::$writing_own_options = false;
		}
	}

	/**
	 * Discards any stored export credentials.
	 *
	 * Writes made while Jetpack is inactive or disconnected escape
	 * protect_options(), so clear at each of those boundaries — activation and
	 * both connection transitions — and anything planted during a gap is gone
	 * before the gap closes. Costs a real client one rotation. Per-blog on
	 * multisite, since each hook fires for one site.
	 */
	public static function discard_credentials() {
		delete_option( self::SECRET_OPTION );
		delete_option( self::ENABLED_OPTION );
	}

	/**
	 * Stores a freshly minted shared secret.
	 *
	 * @param string $secret The new secret.
	 * @return bool Whether the secret was stored.
	 */
	public static function store_secret( $secret ) {
		return self::write_option( self::SECRET_OPTION, $secret );
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
	 * Pressable and WordPress.com (Atomic) only. The filter can switch it off
	 * there; it cannot switch it on anywhere else.
	 *
	 * @return bool
	 */
	public static function is_available() {
		if ( ! ( Constants::is_true( 'IS_PRESSABLE' ) || ( new Host() )->is_woa_site() ) ) {
			return false;
		}

		/**
		 * Filters whether Jetpack Reprint export support is available on the
		 * current site.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $available Whether Reprint export support is available.
		 */
		return (bool) apply_filters( 'jetpack_reprint_export_available', true );
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

		// Any origin: the client may run in a browser (Playground) from
		// deployments we cannot know ahead of time, and origin is no boundary
		// when every request needs the HMAC secret anyway. Preflights come
		// before HMAC because browsers send them without credentials, and
		// before the window check so a lapsed client can reach the 409 below.
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$request_method = isset( $_SERVER['REQUEST_METHOD'] ) ? strtoupper( $_SERVER['REQUEST_METHOD'] ) : '';
		if ( 'OPTIONS' === $request_method ) {
			$this->send_cors_headers();
			if ( ! headers_sent() ) {
				header( 'Allow: GET, POST, OPTIONS' );
			}
			$this->terminate();
			return;
		}

		// Without a valid signature a closed window answers nothing, so an idle
		// site stays indistinguishable from one that never had the feature.
		$window_open = self::is_export_window_open();

		$secret = get_option( self::SECRET_OPTION, '' );
		if ( ! is_string( $secret ) || '' === $secret ) {
			if ( ! $window_open ) {
				return;
			}
			$this->error( 503, 'Export not configured. Please rotate the shared secret via POST /jetpack/v4/reprint/rotate-export-secret.' );
			return;
		}

		$auth_error = $this->verify_hmac( $secret );
		if ( null !== $auth_error ) {
			if ( ! $window_open ) {
				return;
			}
			$this->error( 403, $auth_error );
			return;
		}

		// Signature checks out, so say which state this is: still here, only
		// needing re-arming, rather than gone.
		if ( ! $window_open ) {
			$this->error( 409, 'Export window closed. Re-open it via POST /jetpack/v4/reprint/enable-export.' );
			return;
		}

		// An export spans many requests and can run past the hour, so keep the
		// window open while a client is working.
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
		self::write_option( self::ENABLED_OPTION, $now );
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
		$this->send_cors_headers();
		\Site_Export_HTTP_Server::serve( array( 'default_directory' => ABSPATH ) );
	}

	/**
	 * Emits the CORS headers the export client needs.
	 *
	 * Sent only with responses we actually produce, so a request that falls
	 * through to WordPress does not pick them up. See handle_request() for why
	 * any origin is allowed.
	 */
	protected function send_cors_headers() {
		if ( headers_sent() ) {
			return;
		}

		header( 'Access-Control-Allow-Origin: *' );
		header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
		header( 'Access-Control-Allow-Headers: *' );
	}

	/**
	 * Sends a JSON error response and terminates.
	 *
	 * @param int    $code    HTTP status code.
	 * @param string $message Error description.
	 */
	protected function error( $code, $message ) {
		$this->send_cors_headers();
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
	 * Seam wrapping exit() so a test double can record that the request ended
	 * and still assert what happened on the way out.
	 */
	protected function terminate() {
		exit;
	}
}
