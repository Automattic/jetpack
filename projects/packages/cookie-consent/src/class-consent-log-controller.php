<?php
/**
 * Consent Log REST controller.
 * Handles cookie consent logging for GDPR compliance.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

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
	private const DB_VERSION = '0.0.1';

	/**
	 * Default retention period in days.
	 *
	 * @var int
	 */
	private const DEFAULT_RETENTION_DAYS = 30;

	/**
	 * Default consent types.
	 *
	 * @var array
	 */
	private const DEFAULT_CONSENT_TYPES = array( 'functional', 'analytics', 'marketing' );

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

		return $instance;
	}

	/**
	 * Get the full table name with WordPress prefix.
	 *
	 * @return string
	 */
	private function get_table_name() {
		global $wpdb;
		return $wpdb->prefix . self::TABLE_NAME;
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
		$table_name      = $this->get_table_name();
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table_name} (
			id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			consent_id varchar(36) DEFAULT NULL,
			event_type varchar(50) NOT NULL,
			customer_id bigint(20) UNSIGNED NOT NULL DEFAULT 0,
			ip_address varchar(45) DEFAULT NULL,
			url text DEFAULT NULL,
			consent_types longtext DEFAULT NULL,
			date_created datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
			date_created_gmt datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
			PRIMARY KEY (id),
			KEY consent_id (consent_id),
			KEY customer_id (customer_id),
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
				array(
					// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- `register_rest_route()` requires mixed key/no-key for `$args`, and then https://github.com/phan/phan/issues/4852 puts the error on the wrong line.
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_consent_log' ),
					'permission_callback' => '__return_true', // Allow unauthenticated access.
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
							'validate_callback' => 'rest_validate_request_arg',
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
				array(
					// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- `register_rest_route()` requires mixed key/no-key for `$args`, and then https://github.com/phan/phan/issues/4852 puts the error on the wrong line.
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_consent_logs' ),
					'permission_callback' => array( $this, 'check_read_permission' ),
					'args'                => array(
						'customer_id' => array(
							'type'              => 'integer',
							'description'       => __( 'Filter by WordPress user ID.', 'jetpack-cookie-consent' ),
							'validate_callback' => 'rest_validate_request_arg',
							'sanitize_callback' => 'absint',
						),
						'before'      => array(
							'type'              => 'string',
							'format'            => 'date-time',
							'description'       => __( 'Filter logs created before this date (ISO 8601 format).', 'jetpack-cookie-consent' ),
							'validate_callback' => 'rest_validate_request_arg',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'after'       => array(
							'type'              => 'string',
							'format'            => 'date-time',
							'description'       => __( 'Filter logs created after this date (ISO 8601 format).', 'jetpack-cookie-consent' ),
							'validate_callback' => 'rest_validate_request_arg',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'page'        => array(
							'type'              => 'integer',
							'description'       => __( 'Current page of the collection.', 'jetpack-cookie-consent' ),
							'default'           => 1,
							'validate_callback' => 'rest_validate_request_arg',
							'sanitize_callback' => 'absint',
						),
						'per_page'    => array(
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

		/**
		 * Filter the allowed consent types.
		 *
		 * @param array $allowed_types Array of allowed consent type keys.
		 */
		$allowed_types = apply_filters(
			'jetpack_cookie_consent_allowed_consent_types',
			self::DEFAULT_CONSENT_TYPES
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

		$data = array(
			'consent_id'       => $consent_id,
			'event_type'       => $request->get_param( 'event_type' ),
			'customer_id'      => get_current_user_id(),
			'ip_address'       => $this->get_client_ip(),
			'url'              => $request->get_param( 'url' ),
			'consent_types'    => $consent_json,
			'date_created'     => $current_time_local,
			'date_created_gmt' => $current_time_gmt,
		);

		$result = $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			$this->get_table_name(),
			$data,
			array( '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s' )
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
	 * Get consent logs with filtering and pagination.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_consent_logs( WP_REST_Request $request ) {
		global $wpdb;
		$table_name = $this->get_table_name();

		// Build WHERE clause.
		$where  = array( '1=1' );
		$values = array();

		if ( $request->get_param( 'customer_id' ) ) {
			$where[]  = 'customer_id = %d';
			$values[] = $request->get_param( 'customer_id' );
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
	 * Get client IP address from server variables.
	 *
	 * @return string|null
	 */
	private function get_client_ip() {
		$ip_keys = array(
			'HTTP_CF_CONNECTING_IP', // Cloudflare.
			'HTTP_X_FORWARDED_FOR',  // Proxy.
			'HTTP_X_REAL_IP',        // Nginx proxy.
			'REMOTE_ADDR',           // Direct connection.
		);

		foreach ( $ip_keys as $key ) {
			if ( ! empty( $_SERVER[ $key ] ) ) {
				$ip = sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) );
				// Handle multiple IPs (X-Forwarded-For can contain multiple IPs).
				if ( strpos( $ip, ',' ) !== false ) {
					$ip = trim( explode( ',', $ip )[0] );
				}
				if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
					return $ip;
				}
			}
		}

		return null;
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
					'customer_id'      => array(
						'description' => __( 'The WordPress user ID.', 'jetpack-cookie-consent' ),
						'type'        => 'integer',
						'context'     => array( 'view' ),
						'readonly'    => true,
					),
					'ip_address'       => array(
						'description' => __( 'The client IP address.', 'jetpack-cookie-consent' ),
						'type'        => 'string',
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

		$table_name = $this->get_table_name();
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
	public function unschedule_cleanup() {
		$timestamp = wp_next_scheduled( self::CLEANUP_HOOK );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, self::CLEANUP_HOOK );
		}
	}
}
