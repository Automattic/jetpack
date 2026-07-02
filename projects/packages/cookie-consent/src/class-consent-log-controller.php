<?php
/**
 * Consent Log REST controller.
 * Handles cookie consent logging for GDPR compliance.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use Automattic\Jetpack\IP\Utils as IP_Utils;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * REST API Consent Log controller class.
 */
class Consent_Log_Controller extends WP_REST_Controller {

	/**
	 * Singleton instance.
	 *
	 * @var Consent_Log_Controller
	 */
	private static $instance = null;

	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'jetpack/v4/cookie-consent';

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'consent-log';

	/**
	 * Database table name (without prefix).
	 *
	 * @var string
	 */
	private const TABLE_NAME = 'jetpack_cookie_consent_logs';

	/**
	 * Database version.
	 *
	 * @var string
	 */
	private const DB_VERSION = '0.0.3';

	/**
	 * Default retention period in days.
	 *
	 * @var int
	 */
	private const DEFAULT_RETENTION_DAYS = 30;

	/**
	 * Default rate-limit window in seconds for the public create route.
	 *
	 * @var int
	 */
	private const RATE_LIMIT_WINDOW = 60;

	/**
	 * Default maximum create requests allowed per IP within RATE_LIMIT_WINDOW.
	 *
	 * @var int
	 */
	private const RATE_LIMIT_MAX = 100;

	/**
	 * Object-cache group for the per-IP rate-limit counters.
	 *
	 * @var string
	 */
	private const RATE_LIMIT_GROUP = 'jetpack_cookie_consent_rate_limit';

	/**
	 * Maximum stored length for the consent URL.
	 *
	 * @var int
	 */
	private const MAX_URL_LENGTH = 1024;

	/**
	 * Default IP address handling mode.
	 *
	 * @var string
	 */
	private const DEFAULT_IP_MODE = 'drop';

	/**
	 * Supported IP address handling modes.
	 *
	 * @var array
	 */
	private const IP_MODES = array( 'drop', 'hash', 'truncate', 'raw' );

	/**
	 * Cleanup cron hook name.
	 *
	 * @var string
	 */
	private const CLEANUP_HOOK = 'jetpack_cookie_consent_cleanup_consent_logs';

	/**
	 * Database version option name.
	 *
	 * @var string
	 */
	private const DB_VERSION_OPTION = 'jetpack_cookie_consent_consent_log_db_version';

	/**
	 * Initialize the controller: create the table, schedule cleanup,
	 * register REST routes, and wire the cleanup cron callback.
	 *
	 * @return Consent_Log_Controller
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		$instance = self::$instance;

		$instance->maybe_create_table();
		$instance->schedule_cleanup();

		add_action( 'rest_api_init', array( $instance, 'register_routes' ) );
		add_action( self::CLEANUP_HOOK, array( $instance, 'cleanup_expired_logs' ) );

		Consent_Log_Privacy::init();

		return $instance;
	}

	/**
	 * Get the full table name with WordPress prefix.
	 *
	 * @return string
	 */
	public static function get_table_name() {
		global $wpdb;
		return $wpdb->prefix . self::TABLE_NAME;
	}

	/**
	 * Remove scheduled events and optionally delete persisted consent logs.
	 *
	 * Consumers should call this from their uninstall hook. Consent logs are
	 * retained by default because they may be compliance records; pass true only
	 * when the consuming plugin has decided uninstall should delete them.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $delete_consent_logs Whether to drop the consent-log table.
	 */
	public static function uninstall( $delete_consent_logs = false ) {
		self::deactivate();

		if ( $delete_consent_logs ) {
			self::drop_table();
		}
	}

	/**
	 * Remove scheduled consent-log cleanup hooks.
	 *
	 * Consumers should call this from their deactivation hook when they want to
	 * stop background cleanup while retaining consent-log data.
	 *
	 * @since $$next-version$$
	 */
	public static function deactivate() {
		self::unschedule_cleanup();

		// Privacy filters are registered statically in init() regardless of the
		// singleton, so unhook them unconditionally (before the instance guard).
		Consent_Log_Privacy::deactivate();

		if ( null === self::$instance ) {
			return;
		}

		remove_action( 'rest_api_init', array( self::$instance, 'register_routes' ) );
		remove_action( self::CLEANUP_HOOK, array( self::$instance, 'cleanup_expired_logs' ) );
	}

	/**
	 * Create or upgrade the database table if needed.
	 */
	public function maybe_create_table() {
		$installed_version = get_option( self::DB_VERSION_OPTION, '0' );

		if ( version_compare( $installed_version, self::DB_VERSION, '<' ) ) {
			$this->create_table();
			update_option( self::DB_VERSION_OPTION, self::DB_VERSION );
		}
	}

	/**
	 * Create the consent logs database table.
	 */
	private function create_table() {
		global $wpdb;
		$table_name      = self::get_table_name();
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table_name} (
			id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			consent_id varchar(36) DEFAULT NULL,
			event_type varchar(50) NOT NULL,
			user_id bigint(20) UNSIGNED NOT NULL DEFAULT 0,
			ip_address varchar(64) DEFAULT NULL,
			url text DEFAULT NULL,
			consent_types longtext DEFAULT NULL,
			policy_version varchar(191) NOT NULL DEFAULT '1',
			banner_version varchar(191) NOT NULL DEFAULT '1',
			date_created datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
			date_created_gmt datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
			PRIMARY KEY (id),
			KEY consent_id (consent_id),
			KEY user_id (user_id),
			KEY event_type (event_type),
			KEY date_created_gmt (date_created_gmt)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	/**
	 * Register REST API routes.
	 */
	public function register_routes() {
		// Create consent log.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				0        => array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_consent_log' ),
					// Public, unauthenticated route — anonymous visitors submit consent. Abuse is
					// bounded by the per-IP rate limit reserved inside the handler (see
					// create_consent_log()), which can count each request exactly once and carry
					// 429 response headers, neither of which a permission_callback can do reliably.
					'permission_callback' => '__return_true',
					'args'                => array(
						'consent_id'    => array(
							'type'              => 'string',
							'description'       => __( 'Optional unique consent identifier (UUID v4 format).', 'jetpack-cookie-consent' ),
							'validate_callback' => array( $this, 'validate_uuid' ),
							'sanitize_callback' => 'sanitize_text_field',
						),
						'event_type'    => array(
							'type'              => 'string',
							'description'       => __( 'Type of consent event: accept_all, accept_selected, reject_all, auto_granted, or opt-out.', 'jetpack-cookie-consent' ),
							'required'          => true,
							'enum'              => array( 'accept_all', 'accept_selected', 'reject_all', 'auto_granted', 'opt-out' ),
							'validate_callback' => 'rest_validate_request_arg',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'url'           => array(
							'type'              => 'string',
							'description'       => __( 'URL where consent was given.', 'jetpack-cookie-consent' ),
							'validate_callback' => array( $this, 'validate_url' ),
							'sanitize_callback' => 'esc_url_raw',
						),
						'consent_types' => array(
							'type'              => 'object',
							'description'       => __( 'Consent status for different cookie types (e.g., {"functional": true, "analytics": false, "marketing": true}).', 'jetpack-cookie-consent' ),
							'validate_callback' => 'rest_validate_request_arg',
							'sanitize_callback' => array( $this, 'sanitize_consent_types' ),
						),
					),
				),
				'schema' => array( $this, 'get_create_consent_schema' ),
			)
		);

		// Get consent logs (admin only).
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				0        => array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_consent_logs' ),
					'permission_callback' => array( $this, 'check_read_permission' ),
					'args'                => array(
						'user_id'  => array(
							'type'              => 'integer',
							'description'       => __( 'Filter by WordPress user ID.', 'jetpack-cookie-consent' ),
							'validate_callback' => 'rest_validate_request_arg',
							'sanitize_callback' => 'absint',
						),
						'before'   => array(
							'type'              => 'string',
							'format'            => 'date-time',
							'description'       => __( 'Filter logs created before this date (ISO 8601 format).', 'jetpack-cookie-consent' ),
							'validate_callback' => 'rest_validate_request_arg',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'after'    => array(
							'type'              => 'string',
							'format'            => 'date-time',
							'description'       => __( 'Filter logs created after this date (ISO 8601 format).', 'jetpack-cookie-consent' ),
							'validate_callback' => 'rest_validate_request_arg',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'page'     => array(
							'type'              => 'integer',
							'description'       => __( 'Current page of the collection.', 'jetpack-cookie-consent' ),
							'default'           => 1,
							'validate_callback' => 'rest_validate_request_arg',
							'sanitize_callback' => 'absint',
						),
						'per_page' => array(
							'type'              => 'integer',
							'description'       => __( 'Maximum number of items to return (max 100).', 'jetpack-cookie-consent' ),
							'default'           => 50,
							'validate_callback' => 'rest_validate_request_arg',
							'sanitize_callback' => 'absint',
						),
					),
				),
				'schema' => array( $this, 'get_consent_logs_schema' ),
			)
		);
	}

	/**
	 * Check read permission for consent logs.
	 *
	 * @return bool
	 */
	public function check_read_permission() {
		return current_user_can( 'manage_privacy_options' );
	}

	/**
	 * Filterable rate-limit window in seconds.
	 *
	 * @return int
	 */
	private function get_rate_limit_window() {
		/**
		 * Filters the rate-limit window (seconds) for the consent-log create route.
		 *
		 * @param int $window Window length in seconds.
		 */
		$window = (int) apply_filters( 'jetpack_cookie_consent_rate_limit_window', self::RATE_LIMIT_WINDOW );
		return $window > 0 ? $window : self::RATE_LIMIT_WINDOW;
	}

	/**
	 * Filterable maximum create requests per IP within the window.
	 *
	 * @return int
	 */
	private function get_rate_limit_max() {
		/**
		 * Filters the maximum consent-log create requests per IP within the window.
		 *
		 * @param int $max Maximum number of requests.
		 */
		$max = (int) apply_filters( 'jetpack_cookie_consent_rate_limit_max', self::RATE_LIMIT_MAX );
		return $max > 0 ? $max : self::RATE_LIMIT_MAX;
	}

	/**
	 * Counter key for the per-IP rate-limit window.
	 *
	 * The current fixed-window slot is folded into the key, so each window is a distinct,
	 * self-expiring bucket and the counter never needs a separate reset step. A missing IP
	 * collapses to a single shared "unknown" bucket so it still can't be flooded.
	 *
	 * @param string|false $ip Client IP address.
	 * @return string
	 */
	private function rate_limit_key( $ip ) {
		$bucket = is_string( $ip ) && '' !== $ip ? $ip : 'unknown';
		$window = $this->get_rate_limit_window();
		$slot   = (int) floor( time() / $window );
		return 'jp_cc_rl_' . md5( $bucket ) . '_' . $slot;
	}

	/**
	 * Reserve one slot in the current per-IP rate-limit window.
	 *
	 * The check and increment happen as a single atomic operation so a burst of concurrent
	 * requests from one IP can't all read an under-limit count and slip past together (the
	 * read-then-write race a plain transient counter would have). Two backends:
	 *
	 * - Persistent object cache: wp_cache_add() seeds the counter + TTL and wp_cache_incr()
	 *   counts, both atomic at the cache server (Redis/Memcached INCR).
	 * - Plain DB (WordPress default): a single atomic UPDATE that only increments while under
	 *   the cap. The row lock serializes concurrent writers, so the limit holds exactly.
	 *
	 * @param string|false $ip Client IP address.
	 * @return bool True if the request fits within the limit; false if the limit is reached.
	 */
	private function reserve_rate_limit_slot( $ip ) {
		$key    = $this->rate_limit_key( $ip );
		$window = $this->get_rate_limit_window();
		$max    = $this->get_rate_limit_max();

		if ( wp_using_ext_object_cache() ) {
			wp_cache_add( $key, 0, self::RATE_LIMIT_GROUP, $window );
			$count = wp_cache_incr( $key, 1, self::RATE_LIMIT_GROUP );
			return is_int( $count ) && $count <= $max;
		}

		return $this->reserve_rate_limit_slot_db( $key, $window, $max );
	}

	/**
	 * DB-backed atomic slot reservation for sites without a persistent object cache.
	 *
	 * Stores the counter as a regular (non-autoloaded) transient row and increments it with a
	 * single atomic statement that bumps the value only while it's below the cap. add_option()
	 * is an atomic insert-if-absent, so concurrent first requests can't double-seed; the
	 * UPDATE's row lock then serializes the increments. The companion timeout row lets WP core
	 * (and purge_expired_rate_limit_transients()) reclaim the rows once the window passes.
	 *
	 * @param string $key    Rate-limit counter key (already window-scoped).
	 * @param int    $window Window length in seconds.
	 * @param int    $max    Maximum requests allowed in the window.
	 * @return bool True if a slot was reserved; false if the limit is reached.
	 */
	private function reserve_rate_limit_slot_db( $key, $window, $max ) {
		global $wpdb;

		$value_option   = '_transient_' . $key;
		$timeout_option = '_transient_timeout_' . $key;

		// Seed the window once. add_option() is a no-op (returns false) if the row already
		// exists, so a concurrent seeder can't reset an in-progress count. Not autoloaded.
		add_option( $timeout_option, (string) ( time() + $window ), '', false );
		add_option( $value_option, '0', '', false );

		$updated = $wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"UPDATE {$wpdb->options} SET option_value = option_value + 1 WHERE option_name = %s AND CAST( option_value AS UNSIGNED ) < %d",
				$value_option,
				$max
			)
		);

		return 1 === (int) $updated;
	}

	/**
	 * Seconds remaining until the current fixed-window slot resets.
	 *
	 * @return int
	 */
	private function seconds_until_window_reset() {
		$window = $this->get_rate_limit_window();
		return $window - ( time() % $window );
	}

	/**
	 * Build the 429 response for a rate-limited request, with the conventional headers.
	 *
	 * Returned from the handler (not a permission_callback) so it can carry headers — a
	 * WP_Error would have its `headers` data key dropped by core.
	 *
	 * @return WP_REST_Response
	 */
	private function rate_limited_response() {
		$retry_after = $this->seconds_until_window_reset();

		$response = new WP_REST_Response(
			array(
				'code'    => 'rest_too_many_requests',
				'message' => __( 'Too many requests.', 'jetpack-cookie-consent' ),
				'data'    => array( 'status' => 429 ),
			),
			429
		);

		$response->header( 'Retry-After', (string) $retry_after );
		$response->header( 'RateLimit-Limit', (string) $this->get_rate_limit_max() );
		$response->header( 'RateLimit-Remaining', '0' );
		$response->header( 'RateLimit-Reset', (string) $retry_after );

		return $response;
	}

	/**
	 * Validate the consent URL: must be a well-formed http(s) URL within the length cap.
	 *
	 * @param mixed           $value   The value to validate.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param   The parameter name.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public function validate_url( $value, $request, $param ) {
		// Allow empty values since url is optional.
		if ( empty( $value ) ) {
			return true;
		}

		// The URL is the visitor's own page address, stored only for the audit log and
		// never fetched server-side, so validate it cheaply: a string within the length
		// cap that parses as an http(s) URL with a host. wp_http_validate_url() is avoided
		// on purpose — it's an SSRF guard for outbound requests and would run a DNS lookup
		// and reject legitimate same-site URLs (mapped domains, private-IP dev/staging
		// hosts, non-standard ports) on this high-frequency public endpoint.
		$scheme = is_string( $value ) ? wp_parse_url( $value, PHP_URL_SCHEME ) : null;
		$host   = is_string( $value ) ? wp_parse_url( $value, PHP_URL_HOST ) : null;
		if (
			! is_string( $value )
			|| strlen( $value ) > self::MAX_URL_LENGTH
			|| ! in_array( strtolower( (string) $scheme ), array( 'http', 'https' ), true )
			|| empty( $host )
		) {
			return new WP_Error(
				'rest_invalid_param',
				sprintf(
					/* translators: %s: parameter name */
					__( '%s must be a valid URL.', 'jetpack-cookie-consent' ),
					$param
				),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Validate UUID format.
	 *
	 * @param mixed           $value   The value to validate.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param   The parameter name.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public function validate_uuid( $value, $request, $param ) {
		// Allow empty values since consent_id is optional.
		if ( empty( $value ) ) {
			return true;
		}

		// Use WordPress built-in UUID validation.
		if ( ! wp_is_uuid( $value ) ) {
			return new WP_Error(
				'rest_invalid_param',
				sprintf(
					/* translators: %s: parameter name */
					__( '%s must be a valid UUID format.', 'jetpack-cookie-consent' ),
					$param
				),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Sanitize consent types object.
	 *
	 * @param mixed $value The value to sanitize.
	 * @return array|null
	 */
	public function sanitize_consent_types( $value ) {
		if ( ! is_array( $value ) ) {
			return null;
		}

		$allowed_types = array_map(
			static function ( $category ) {
				return $category['key'];
			},
			Cookie_Consent::get_current_consent_categories()
		);

		$sanitized = array();
		foreach ( $value as $key => $status ) {
			$sanitized_key = sanitize_key( $key );
			// Only allow types in the allowed list.
			if ( in_array( $sanitized_key, $allowed_types, true ) ) {
				$sanitized[ $sanitized_key ] = rest_sanitize_boolean( $status );
			}
		}

		return $sanitized;
	}

	/**
	 * Create a consent log entry.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_consent_log( WP_REST_Request $request ) {
		global $wpdb;

		// Resolve the client IP once, for both the rate-limit counter and storage.
		$ip = $this->get_client_ip();

		// Atomically reserve a per-IP rate-limit slot before doing any work. This lives in the
		// handler (not a permission_callback, which WP can invoke more than once per request) so
		// each request counts exactly once and the 429 can carry response headers. It counts
		// attempts by design — an abuse/DoS guard should — and reserving up front (rather than
		// after the insert) is what makes the check-and-increment atomic and race-free.
		if ( ! $this->reserve_rate_limit_slot( $ip ) ) {
			return $this->rate_limited_response();
		}

		// Generate UUID if consent_id is not provided.
		$consent_id = $request->get_param( 'consent_id' );
		if ( empty( $consent_id ) ) {
			$consent_id = wp_generate_uuid4();
		}

		$current_time_gmt   = gmdate( 'Y-m-d H:i:s' );
		$current_time_local = wp_date( 'Y-m-d H:i:s' );

		// Get consent types and encode as JSON.
		$consent_types = $request->get_param( 'consent_types' );
		$consent_json  = ! empty( $consent_types ) ? wp_json_encode( $consent_types, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) : null;
		$log_versions  = $this->get_log_versions();

		$data = array(
			'consent_id'       => $consent_id,
			'event_type'       => $request->get_param( 'event_type' ),
			'user_id'          => get_current_user_id(),
			'ip_address'       => $this->get_consent_log_ip_address( $ip ),
			'url'              => $request->get_param( 'url' ),
			'consent_types'    => $consent_json,
			'policy_version'   => $log_versions['policy_version'],
			'banner_version'   => $log_versions['banner_version'],
			'date_created'     => $current_time_local,
			'date_created_gmt' => $current_time_gmt,
		);

		$result = $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			self::get_table_name(),
			$data,
			array( '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
		);

		if ( false === $result ) {
			return new WP_Error(
				'database_error',
				__( 'Failed to create consent log.', 'jetpack-cookie-consent' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( array( 'consent_id' => $consent_id ) );
	}

	/**
	 * Get the IP address value to persist for the consent log.
	 *
	 * @param string|null $ip_address Resolved client IP address.
	 * @return string|null
	 */
	private function get_consent_log_ip_address( $ip_address = null ) {
		// Guard against a null IP: format_ip_address_for_log() would otherwise hash the empty
		// string or hand null to wp_privacy_anonymize_ip() (which returns 0.0.0.0). The 'drop'
		// mode itself is already handled by that method's default branch.
		if ( null === $ip_address ) {
			return null;
		}

		return $this->format_ip_address_for_log( $ip_address, $this->get_ip_mode() );
	}

	/**
	 * Get the configured IP address handling mode.
	 *
	 * @return string
	 */
	private function get_ip_mode() {
		$config     = Cookie_Consent::get_config();
		$log_config = isset( $config['log'] ) && is_array( $config['log'] ) ? $config['log'] : array();
		$ip_mode    = isset( $log_config['ip_mode'] ) ? sanitize_key( $log_config['ip_mode'] ) : self::DEFAULT_IP_MODE;

		if ( ! in_array( $ip_mode, self::IP_MODES, true ) ) {
			return self::DEFAULT_IP_MODE;
		}

		return $ip_mode;
	}

	/**
	 * Format an IP address for the configured log storage mode.
	 *
	 * @param string $ip_address Valid IP address.
	 * @param string $ip_mode    IP address handling mode.
	 * @return string|null
	 */
	private function format_ip_address_for_log( $ip_address, $ip_mode ) {
		switch ( $ip_mode ) {
			case 'raw':
				return $ip_address;

			case 'hash':
				// 64-char hex digest; the ip_address column must stay at least varchar(64) to hold it.
				return hash_hmac( 'sha256', $ip_address, wp_salt( 'auth' ) );

			case 'truncate':
				return $this->truncate_ip_address( $ip_address );

			case 'drop':
			default:
				return null;
		}
	}

	/**
	 * Truncate an IP address so the full address is not persisted.
	 *
	 * @param string $ip_address Valid IP address.
	 * @return string|null
	 */
	private function truncate_ip_address( $ip_address ) {
		if ( function_exists( 'wp_privacy_anonymize_ip' ) ) {
			return wp_privacy_anonymize_ip( $ip_address );
		}

		if ( filter_var( $ip_address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
			$octets    = explode( '.', $ip_address );
			$octets[3] = '0';
			return implode( '.', $octets );
		}

		if ( filter_var( $ip_address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) ) {
			$packed = inet_pton( $ip_address );
			if ( false === $packed ) {
				return null;
			}

			$bytes = unpack( 'C*', $packed );
			if ( false === $bytes ) {
				return null;
			}

			for ( $i = 9; $i <= 16; $i++ ) {
				$bytes[ $i ] = 0;
			}

			$truncated = inet_ntop( pack( 'C*', ...array_values( $bytes ) ) );
			return false === $truncated ? null : $truncated;
		}

		return null;
	}

	/**
	 * Get consent logs with filtering and pagination.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_consent_logs( WP_REST_Request $request ) {
		global $wpdb;
		$table_name = self::get_table_name();

		// Build WHERE clause.
		$where  = array( '1=1' );
		$values = array();

		if ( $request->get_param( 'user_id' ) ) {
			$where[]  = 'user_id = %d';
			$values[] = $request->get_param( 'user_id' );
		}

		if ( $request->get_param( 'after' ) ) {
			$where[]  = 'date_created_gmt >= %s';
			$values[] = gmdate( 'Y-m-d H:i:s', strtotime( $request->get_param( 'after' ) ) );
		}

		if ( $request->get_param( 'before' ) ) {
			$where[]  = 'date_created_gmt <= %s';
			$values[] = gmdate( 'Y-m-d H:i:s', strtotime( $request->get_param( 'before' ) ) );
		}

		// Pagination. Clamp to safe lower bounds so per_page=0 can't divide by zero
		// and page=0 can't produce a negative OFFSET.
		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = max( 1, min( (int) $request->get_param( 'per_page' ), 100 ) ); // 1-100 per page.
		$offset   = ( $page - 1 ) * $per_page;

		// Count total.
		$where_clause = implode( ' AND ', $where );
		$count_query  = "SELECT COUNT(*) FROM {$table_name} WHERE {$where_clause}";
		if ( ! empty( $values ) ) {
			$count_query = $wpdb->prepare( $count_query, ...$values ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		}
		$total = (int) $wpdb->get_var( $count_query ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

		// Get records.
		$query    = "SELECT * FROM {$table_name} WHERE {$where_clause} ORDER BY date_created_gmt DESC LIMIT %d OFFSET %d";
		$values[] = $per_page;
		$values[] = $offset;
		$results  = $wpdb->get_results( $wpdb->prepare( $query, ...$values ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

		$response = rest_ensure_response( $results );
		$response->header( 'X-WP-Total', (string) $total );
		$response->header( 'X-WP-TotalPages', (string) ceil( $total / $per_page ) );

		return $response;
	}

	/**
	 * Get the client IP address.
	 *
	 * Delegates to the jetpack-ip package, which defaults to REMOTE_ADDR and only
	 * trusts a forwarded header when the site has explicitly configured a trusted
	 * proxy header — avoiding the spoofable-header pitfall of reading X-Forwarded-For
	 * unconditionally.
	 *
	 * @return string|null
	 */
	private function get_client_ip() {
		$ip = IP_Utils::get_ip();
		return is_string( $ip ) && '' !== $ip ? $ip : null;
	}

	/**
	 * Get configured log versions for proof-of-consent records.
	 *
	 * @return array
	 */
	private function get_log_versions() {
		$log_versions = Cookie_Consent::get_log_versions();

		return array(
			'policy_version' => $this->truncate_log_version( $log_versions['policy_version'] ),
			'banner_version' => $this->truncate_log_version( $log_versions['banner_version'] ),
		);
	}

	/**
	 * Truncate a normalized log version to the storage column length.
	 *
	 * Values arrive already sanitized and non-empty from
	 * Cookie_Consent::get_log_versions(); this only enforces the varchar(191)
	 * column limit. Use multibyte-aware truncation when available.
	 *
	 * @param string $version Normalized version value.
	 * @return string
	 */
	private function truncate_log_version( $version ) {
		if ( function_exists( 'mb_substr' ) ) {
			return mb_substr( $version, 0, 191 );
		}

		return substr( $version, 0, 191 );
	}

	/**
	 * Get the schema for the create consent endpoint.
	 *
	 * @return array
	 */
	public function get_create_consent_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'create_consent_log',
			'type'       => 'object',
			'properties' => array(
				'consent_id' => array(
					'description' => __( 'The unique consent identifier.', 'jetpack-cookie-consent' ),
					'type'        => 'string',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Get the schema for the get consent logs endpoint.
	 *
	 * @return array
	 */
	public function get_consent_logs_schema() {
		$schema = array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title'   => 'consent_logs',
			'type'    => 'array',
			'items'   => array(
				'type'       => 'object',
				'properties' => array(
					'id'               => array(
						'description' => __( 'The consent log ID.', 'jetpack-cookie-consent' ),
						'type'        => 'integer',
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
					'consent_id'       => array(
						'description' => __( 'The unique consent identifier.', 'jetpack-cookie-consent' ),
						'type'        => 'string',
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
					'event_type'       => array(
						'description' => __( 'Type of consent event.', 'jetpack-cookie-consent' ),
						'type'        => 'string',
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
					'user_id'          => array(
						'description' => __( 'The WordPress user ID.', 'jetpack-cookie-consent' ),
						'type'        => 'integer',
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
					'ip_address'       => array(
						'description' => __( 'The stored client IP address value.', 'jetpack-cookie-consent' ),
						'type'        => array( 'string', 'null' ),
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
					'url'              => array(
						'description' => __( 'URL where consent was given.', 'jetpack-cookie-consent' ),
						'type'        => 'string',
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
					'consent_types'    => array(
						'description' => __( 'Consent status for different cookie types as JSON string.', 'jetpack-cookie-consent' ),
						'type'        => 'string',
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
					'policy_version'   => array(
						'description' => __( 'Policy version in effect when consent was captured.', 'jetpack-cookie-consent' ),
						'type'        => 'string',
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
					'banner_version'   => array(
						'description' => __( 'Banner version in effect when consent was captured.', 'jetpack-cookie-consent' ),
						'type'        => 'string',
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
					'date_created'     => array(
						'description' => __( 'Date created in local time.', 'jetpack-cookie-consent' ),
						'type'        => 'string',
						'format'      => 'date-time',
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
					'date_created_gmt' => array(
						'description' => __( 'Date created in GMT.', 'jetpack-cookie-consent' ),
						'type'        => 'string',
						'format'      => 'date-time',
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
				),
			),
		);

		return $schema;
	}

	/**
	 * Cleanup expired consent logs (older than retention period).
	 * Deletes in batches to avoid performance issues with large datasets.
	 */
	public function cleanup_expired_logs() {
		global $wpdb;

		/**
		 * Filters the retention period for consent logs.
		 *
		 * @param int $retention_days The retention period in days.
		 */
		$retention_days = filter_var( apply_filters( 'jetpack_cookie_consent_log_retention_days', self::DEFAULT_RETENTION_DAYS ), FILTER_VALIDATE_INT );

		if ( false === $retention_days || $retention_days <= 0 ) {
			$retention_days = self::DEFAULT_RETENTION_DAYS;
		}

		// Calculate cutoff date in UTC.
		$cutoff_timestamp = time() - ( $retention_days * DAY_IN_SECONDS );
		$cutoff_date      = gmdate( 'Y-m-d H:i:s', $cutoff_timestamp );

		$table_name = self::get_table_name();
		$batch_size = 1000;

		// Delete in batches until all expired records are removed.
		do {
			$deleted = $wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				$wpdb->prepare(
					'DELETE FROM %i WHERE date_created_gmt < %s LIMIT %d',
					$table_name,
					$cutoff_date,
					$batch_size
				)
			);

			// Avoid infinite loop in case of errors.
			if ( false === $deleted ) {
				break;
			}
		} while ( $deleted === $batch_size );

		$this->purge_expired_rate_limit_transients();
	}

	/**
	 * Purge expired rate-limit transients left behind in the options table.
	 *
	 * DB-backed transients are only deleted lazily (on read after expiry), so a flood
	 * of distinct IPs can leave many stale rows in wp_options. When a persistent object
	 * cache is in use, transients live there and expire on their own, so there's nothing
	 * to purge.
	 */
	private function purge_expired_rate_limit_transients() {
		if ( wp_using_ext_object_cache() ) {
			return;
		}

		global $wpdb;

		$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"DELETE a, b FROM {$wpdb->options} a
				JOIN {$wpdb->options} b ON b.option_name = CONCAT( '_transient_', SUBSTRING( a.option_name, LENGTH( '_transient_timeout_' ) + 1 ) )
				WHERE a.option_name LIKE %s
				AND a.option_value < %d",
				$wpdb->esc_like( '_transient_timeout_jp_cc_rl_' ) . '%',
				time()
			)
		);
	}

	/**
	 * Schedule daily cleanup event using WP-Cron.
	 */
	public function schedule_cleanup() {
		// Only schedule if not already scheduled.
		if ( ! wp_next_scheduled( self::CLEANUP_HOOK ) ) {
			wp_schedule_event( time(), 'daily', self::CLEANUP_HOOK );
		}
	}

	/**
	 * Unschedule cleanup event.
	 * This method can be called on plugin deactivation.
	 */
	public static function unschedule_cleanup() {
		wp_clear_scheduled_hook( self::CLEANUP_HOOK );
	}

	/**
	 * Drop the consent logs table and clear its schema-version option.
	 */
	private static function drop_table() {
		global $wpdb;
		$table_name = self::get_table_name();

		$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table_name ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange
		delete_option( self::DB_VERSION_OPTION );
	}
}
