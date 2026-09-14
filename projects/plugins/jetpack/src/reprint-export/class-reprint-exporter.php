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
	 * Option holding the HMAC of the secret under AUTH_SALT.
	 *
	 * @var string
	 */
	const SECRET_HASH_OPTION = 'jetpack_reprint_exporter_secret_hash';

	/**
	 * Option holding the HMAC of the window timestamp under AUTH_SALT.
	 *
	 * @var string
	 */
	const ENABLED_HASH_OPTION = 'jetpack_reprint_exporter_enabled_hash';

	/**
	 * Clock-skew tolerance, in seconds, allowed for HMAC signatures.
	 *
	 * @var int
	 */
	const HMAC_CLOCK_SKEW = 300;

	/**
	 * Shortest AUTH_SALT the credential hashes will be keyed with, in bytes.
	 *
	 * @var int
	 */
	const MIN_SALT_LENGTH = 32;

	/**
	 * The value wp-config-sample.php ships in every salt constant.
	 *
	 * Shorter than MIN_SALT_LENGTH, so the length check already rejects it;
	 * kept for a localised template whose placeholder is not.
	 *
	 * @var string
	 */
	const SALT_PLACEHOLDER = 'put your unique phrase here';

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
	 * Blocks writes to the export options from anywhere but this class.
	 *
	 * Whoever sets both can export the whole site, since they pick the secret
	 * and can then sign their own requests. Allowed by where the write came
	 * from, not by who is logged in: the usual arbitrary-option-write bug is a
	 * form missing its nonce, running in an administrator's own session.
	 *
	 * This only guards writes made after it runs, at after_setup_theme, and
	 * module loading skips it entirely while Jetpack is inactive or
	 * disconnected. discard_credentials() clears anything left from those last
	 * two, but nothing catches a write made earlier in a normal request.
	 */
	public static function protect_options() {
		foreach ( self::guarded_options() as $option ) {
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
		if ( ! in_array( $option, self::guarded_options(), true ) ) {
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
	 * The options only this class may write.
	 *
	 * @return string[]
	 */
	private static function guarded_options() {
		return array(
			self::SECRET_OPTION,
			self::SECRET_HASH_OPTION,
			self::ENABLED_OPTION,
			self::ENABLED_HASH_OPTION,
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
	 * Reports an export event.
	 *
	 * @param string $event   Event name.
	 * @param array  $context Details of the event.
	 */
	public static function record_event( $event, array $context = array() ) {
		/**
		 * Fires when a Reprint export request ends in an export or an error.
		 *
		 * A request the handler ignores fires nothing, and no event carries the
		 * secret, a credential hash or the signature. An export with no secret_rotated
		 * or window_opened event before it used a secret this site did not
		 * create.
		 *
		 * @since 16.2
		 *
		 * @param string $event   Event name.
		 * @param array  $context Details of the event.
		 */
		do_action( 'jetpack_reprint_export_event', $event, $context );
	}

	/**
	 * Discards any stored export credentials.
	 *
	 * Clears whatever was written while protect_options() was not in place. Runs
	 * at plugin activation and when the site connects to or disconnects from
	 * WordPress.com. It does not catch a write made before after_setup_theme
	 * on a site that stays connected.
	 */
	public static function discard_credentials() {
		$had_any = false;
		foreach ( self::guarded_options() as $option ) {
			$had_any = delete_option( $option ) || $had_any;
		}

		if ( $had_any ) {
			// current_filter() rather than a parameter: jetpack_site_registered
			// passes a blog ID to its callbacks, which would land in one.
			self::record_event(
				'credentials_discarded',
				array( 'boundary' => current_filter() )
			);
		}
	}

	/**
	 * Stores a newly created shared secret together with its salt-keyed hash.
	 *
	 * Writes nothing without a usable AUTH_SALT: a secret without a hash would
	 * be refused at request time, and failing here is where provisioning can see it.
	 *
	 * @param string $secret The new secret.
	 * @return bool Whether the secret and its hash were written.
	 */
	public static function store_secret( $secret ) {
		$salt = self::get_usable_salt();
		if ( null === $salt ) {
			return false;
		}

		$secret_stored = self::write_option( self::SECRET_OPTION, $secret );
		$hash_stored   = self::write_option( self::SECRET_HASH_OPTION, self::compute_credential_hash( self::SECRET_HASH_OPTION, $secret, $salt ) );

		return $secret_stored && $hash_stored;
	}

	/**
	 * AUTH_SALT, when it is fit to key the credential hashes with, or null.
	 *
	 * The constant rather than wp_salt(): without one, that helper falls back
	 * to a salt kept in wp_options, the very table the hashes exist to distrust.
	 *
	 * @return string|null
	 */
	public static function get_usable_salt() {
		if ( ! Constants::is_defined( 'AUTH_SALT' ) ) {
			return null;
		}

		$salt = Constants::get_constant( 'AUTH_SALT' );
		if ( ! is_string( $salt ) || strlen( $salt ) < self::MIN_SALT_LENGTH || self::SALT_PLACEHOLDER === $salt ) {
			return null;
		}

		return $salt;
	}

	/**
	 * Computes the HMAC binding a stored credential to AUTH_SALT.
	 *
	 * The hash option's name goes into the message so the two hashes cannot
	 * stand in for each other: a copied window pair must not pass as a secret.
	 *
	 * @param string     $hash_option The option the hash is stored in.
	 * @param string|int $value      The stored value.
	 * @param string     $salt       AUTH_SALT, as returned by get_usable_salt().
	 * @return string
	 */
	private static function compute_credential_hash( $hash_option, $value, $salt ) {
		return hash_hmac( 'sha256', $hash_option . "\0" . (string) $value, $salt );
	}

	/**
	 * Whether the stored hash is the one AUTH_SALT gives for a stored credential.
	 *
	 * @param string     $hash_option The option the hash is stored in.
	 * @param string|int $value      The stored value.
	 * @return bool
	 */
	private static function credential_hash_matches( $hash_option, $value ) {
		$salt        = self::get_usable_salt();
		$stored_hash = get_option( $hash_option );
		if ( null === $salt || ! is_string( $stored_hash ) ) {
			return false;
		}

		return hash_equals( self::compute_credential_hash( $hash_option, $value, $salt ), $stored_hash );
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
		 * @since 16.2
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
		// before the window check so a client whose window has closed can reach
		// the 409 below.
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

		// A secret this class did not hash under the current AUTH_SALT is no
		// credential at all, so it never reaches signature verification.
		if ( ! self::credential_hash_matches( self::SECRET_HASH_OPTION, $secret ) ) {
			if ( ! $window_open ) {
				return;
			}
			self::record_event( 'credential_hash_mismatch' );
			$this->error( 503, 'Export credential invalidated: the stored secret does not match this site\'s AUTH_SALT. Please rotate the shared secret via POST /jetpack/v4/reprint/rotate-export-secret.' );
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

		self::record_event( 'export_served', array( 'endpoint' => $this->requested_endpoint() ) );
		$this->terminate();
	}

	/**
	 * The endpoint the client asked for, or 'unknown'.
	 *
	 * Matched against the set the export server accepts so an unexpected value
	 * cannot travel into a consumer's log.
	 *
	 * @return string
	 */
	protected function requested_endpoint() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$endpoint = isset( $_GET['endpoint'] ) ? sanitize_key( wp_unslash( $_GET['endpoint'] ) ) : '';

		$known = array( 'preflight', 'db_index', 'sql_chunk', 'file_index', 'file_fetch' );

		return in_array( $endpoint, $known, true ) ? $endpoint : 'unknown';
	}

	/**
	 * Whether the current export window is open.
	 *
	 * @param int|null $now Unix time to compare against, or null for the
	 *                      current time. Tests pass a fixed time.
	 * @return bool
	 */
	public static function is_export_window_open( $now = null ) {
		$enabled_at = (int) get_option( self::ENABLED_OPTION, 0 );
		$now        = null === $now ? time() : (int) $now;
		return $enabled_at > 0
			&& $enabled_at <= $now + self::HMAC_CLOCK_SKEW
			&& ( $now - $enabled_at ) <= HOUR_IN_SECONDS
			&& self::credential_hash_matches( self::ENABLED_HASH_OPTION, $enabled_at );
	}

	/**
	 * Opens the export window by stamping the enabled option with the current
	 * time and hashing the stamp.
	 *
	 * Writes nothing without a usable AUTH_SALT, like store_secret(): a stamp
	 * without a hash never reads as open, so both callers check first.
	 *
	 * @return int The unix timestamp the window was opened at.
	 */
	public static function open_export_window() {
		$now  = time();
		$salt = self::get_usable_salt();
		if ( null === $salt ) {
			return $now;
		}

		// Value then hash: a crash between them leaves a mismatch, which reads
		// as closed. Each skips an unchanged value, so a busy client costs at
		// most two writes per elapsed second.
		self::write_option( self::ENABLED_OPTION, $now );
		self::write_option( self::ENABLED_HASH_OPTION, self::compute_credential_hash( self::ENABLED_HASH_OPTION, $now, $salt ) );

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
		self::record_event(
			'export_refused',
			array(
				'code'   => $code,
				'reason' => $message,
			)
		);

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
