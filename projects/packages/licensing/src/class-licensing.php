<?php
/**
 * A Terms of Service class for Jetpack.
 *
 * @package automattic/jetpack-licensing
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Status\Visitor;
use Jetpack_IXR_ClientMulticall;
use Jetpack_Options;
use WP_Error;

/**
 * Class Licensing.
 * Helper class that is responsible for attaching licenses to the current site.
 *
 * @since 1.1.1
 */
class Licensing {
	/**
	 * Name of the WordPress option that holds all known Jetpack licenses.
	 *
	 * @const string
	 */
	const LICENSES_OPTION_NAME = 'jetpack_licenses';

	/**
	 * Name of the WordPress transient that holds the last license attaching error, if any.
	 *
	 * @const string
	 */
	const ERROR_TRANSIENT_NAME = 'jetpack_licenses_error';

	/**
	 * Holds the singleton instance of this class.
	 *
	 * @var self
	 */
	protected static $instance = false;

	/**
	 * Singleton.
	 *
	 * @static
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Initialize.
	 *
	 * @return void
	 */
	public function initialize() {
		add_action( 'add_option_' . self::LICENSES_OPTION_NAME, array( $this, 'attach_stored_licenses' ) );
		add_action( 'update_option_' . self::LICENSES_OPTION_NAME, array( $this, 'attach_stored_licenses' ) );
		add_action( 'jetpack_authorize_ending_authorized', array( $this, 'attach_stored_licenses_on_connection' ) );
		add_action( 'rest_api_init', array( $this, 'register_endpoints' ) );
	}

	/**
	 * Get Jetpack connection manager instance.
	 *
	 * @return Connection_Manager
	 */
	protected function connection() {
		static $connection;

		if ( null === $connection ) {
			$connection = new Connection_Manager();
		}

		return $connection;
	}

	/**
	 * Get the last license attach request error that has occurred, if any.
	 *
	 * @return string Human-readable error message or an empty string.
	 */
	public function last_error() {
		return Jetpack_Options::get_option( 'licensing_error', '' );
	}

	/**
	 * Log an error to be surfaced to the user at a later time.
	 *
	 * @param string $error Human-readable error message.
	 * @return void
	 */
	public function log_error( $error ) {
		$substr = function_exists( 'mb_substr' ) ? 'mb_substr' : 'substr';
		Jetpack_Options::update_option( 'licensing_error', $substr( $error, 0, 1024 ) );
	}

	/**
	 * Get all stored licenses.
	 *
	 * @return string[] License keys.
	 */
	public function stored_licenses() {
		$licenses = (array) get_option( self::LICENSES_OPTION_NAME, array() );
		$licenses = array_filter( $licenses, 'is_scalar' );
		$licenses = array_map( 'strval', $licenses );
		$licenses = array_filter( $licenses );

		return $licenses;
	}

	/**
	 * Append a license
	 *
	 * @param string $license A jetpack license key.
	 * @return bool True if the option was updated with the new license, false otherwise.
	 */
	public function append_license( $license ) {
		$licenses = $this->stored_licenses();

		array_push( $licenses, $license );

		return update_option( self::LICENSES_OPTION_NAME, $licenses );
	}

	/**
	 * Make an authenticated WP.com XMLRPC multicall request to attach the provided license keys.
	 *
	 * @param string[] $licenses License keys to attach.
	 * @return Jetpack_IXR_ClientMulticall
	 */
	protected function attach_licenses_request( array $licenses ) {
		$xml = new Jetpack_IXR_ClientMulticall( array( 'timeout' => 30 ) );

		foreach ( $licenses as $license ) {
			$xml->addCall( 'jetpack.attachLicense', $license );
		}

		$xml->query();

		return $xml;
	}

	/**
	 * Attach the given licenses.
	 *
	 * @param string[] $licenses Licenses to attach.
	 * @return array|WP_Error Results for each license (which may include WP_Error instances) or a WP_Error instance.
	 */
	public function attach_licenses( array $licenses ) {
		if ( ! $this->connection()->has_connected_owner() ) {
			return new WP_Error( 'not_connected', __( 'Jetpack doesn\'t have a connected owner.', 'jetpack-licensing' ) );
		}

		if ( empty( $licenses ) ) {
			return array();
		}

		$xml = $this->attach_licenses_request( $licenses );

		if ( $xml->isError() ) {
			$error = new WP_Error( 'request_failed', __( 'License attach request failed.', 'jetpack-licensing' ) );
			$error->add( $xml->getErrorCode(), $xml->getErrorMessage() );
			return $error;
		}

		$results = array_map(
			function ( $response ) {
				if ( isset( $response['faultCode'] ) || isset( $response['faultString'] ) ) {
					return new WP_Error( $response['faultCode'], $response['faultString'] );
				}

				return $response;
			},
			(array) $xml->getResponse()
		);

		return $results;
	}

	/**
	 * Attach all stored licenses.
	 *
	 * @return array|WP_Error Results for each license (which may include WP_Error instances) or a WP_Error instance.
	 */
	public function attach_stored_licenses() {
		$licenses = $this->stored_licenses();
		$results  = $this->attach_licenses( $licenses );

		if ( is_wp_error( $results ) ) {
			if ( 'request_failed' === $results->get_error_code() ) {
				$this->log_error(
					__( 'Failed to attach your Jetpack license(s). Please try reconnecting Jetpack.', 'jetpack-licensing' )
				);
			}

			return $results;
		}

		$failed = array();

		foreach ( $results as $index => $result ) {
			if ( isset( $licenses[ $index ] ) && is_wp_error( $result ) ) {
				$failed[] = $licenses[ $index ];
			}
		}

		if ( ! empty( $failed ) ) {
			$this->log_error(
				sprintf(
					/* translators: %s is a comma-separated list of license keys. */
					__( 'The following Jetpack licenses are invalid, already in use, or revoked: %s', 'jetpack-licensing' ),
					implode( ', ', $failed )
				)
			);
		}

		return $results;
	}

	/**
	 * Attach all stored licenses during connection flow for the connection owner.
	 *
	 * @return void
	 */
	public function attach_stored_licenses_on_connection() {
		if ( $this->connection()->is_connection_owner() ) {
			$this->attach_stored_licenses();
		}
	}

	/**
	 * Is the current user allowed to use the Licensing Input UI?
	 *
	 * @since 1.4.0
	 * @return bool
	 */
	public static function is_licensing_input_enabled() {
		/**
		 * Filter that checks if the user is allowed to see the Licensing UI. `true` enables it.
		 *
		 * @since 1.4.0
		 *
		 * @param bool False by default.
		 */
		return apply_filters( 'jetpack_licensing_ui_enabled', false ) && current_user_can( 'jetpack_connect_user' );
	}

	/**
	 * Gets the user-licensing activation notice dismissal info.
	 *
	 * @since 10.4.0
	 * @return array
	 */
	public function get_license_activation_notice_dismiss() {

		$default = array(
			'last_detached_count' => null,
			'last_dismissed_time' => null,
		);

		if ( $this->connection()->is_user_connected() && $this->connection()->is_connection_owner() ) {
			return Jetpack_Options::get_option( 'licensing_activation_notice_dismiss', $default );
		}

		return $default;
	}

	/**
	 * Declare the endpoints for the licensing package.
	 *
	 * @since 10.9.0
	 */
	public function register_endpoints() {
		/*
		 * Get and update the last licensing error message.
		 */
		register_rest_route(
			'jetpack/v4',
			'/licensing/error',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_licensing_error',
					'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => __CLASS__ . '::update_licensing_error',
					'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
					'args'                => array(
						'error' => array(
							'required'          => true,
							'type'              => 'string',
							'validate_callback' => __CLASS__ . '::validate_string',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/licensing/set-license',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::set_jetpack_license',
				'permission_callback' => __CLASS__ . '::set_jetpack_license_key_permission_check',
				'args'                => array(
					'license' => array(
						'required'          => true,
						'type'              => 'string',
						'validate_callback' => __CLASS__ . '::validate_string',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
		/**
		 * Get Jetpack user licenses.
		 */
		register_rest_route(
			'jetpack/v4',
			'licensing/user/licenses',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_user_licenses',
				'permission_callback' => __CLASS__ . '::user_licensing_permission_check',
			)
		);

		/**
		 * Get Jetpack user license counts.
		 */
		register_rest_route(
			'jetpack/v4',
			'licensing/user/counts',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_user_license_counts',
				'permission_callback' => __CLASS__ . '::user_licensing_permission_check',
			)
		);

		/**
		 * Update user-licensing activation notice dismiss info.
		 */
		register_rest_route(
			'jetpack/v4',
			'licensing/user/activation-notice-dismiss',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::update_licensing_activation_notice_dismiss',
				'permission_callback' => __CLASS__ . '::user_licensing_permission_check',
				'args'                => array(
					'last_detached_count' => array(
						'required'          => true,
						'type'              => 'integer',
						'validate_callback' => __CLASS__ . '::validate_non_neg_int',
					),
				),
			)
		);

		/**
		 * Attach licenses to user account
		 */
		register_rest_route(
			'jetpack/v4',
			'/licensing/attach-licenses',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::attach_jetpack_licenses',
				'permission_callback' => __CLASS__ . '::user_licensing_permission_check',
				'args'                => array(
					'licenses' => array(
						'required' => true,
						'type'     => 'array',
						'items'    => array(
							'type' => 'string',
						),
					),
				),
			)
		);
	}

	/**
	 * Verify that the user can set a Jetpack license key
	 *
	 * @since 9.5.0
	 *
	 * @return bool|WP_Error True if user is able to set a Jetpack license key
	 */
	public static function set_jetpack_license_key_permission_check() {
		if ( self::instance()->is_licensing_input_enabled() ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_set_jetpack_license_key', self::$user_permissions_error_msg, array( 'status' => rest_authorization_required_code() ) );

	}

	/**
	 * Verify that user can view and update user-licensing data.
	 *
	 * @return bool Whether the user is currently connected and they are the connection owner.
	 */
	public static function user_licensing_permission_check() {
		$connection_manager = new Connection_Manager( 'jetpack' );

		if ( $connection_manager->is_user_connected() && $connection_manager->is_connection_owner() ) {
			return true;
		}

		return new WP_Error( 'invalid_permission_manage_user_licenses', REST_Connector::get_user_permissions_error_msg(), array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Update the last licensing error message.
	 *
	 * @since 9.0.0
	 *
	 * @param WP_REST_Request $request The request.
	 *
	 * @return bool true.
	 */
	public static function update_licensing_error( $request ) {
		self::instance()->log_error( $request['error'] );

		return true;
	}

	/**
	 * Get the last licensing error message, if any.
	 *
	 * @since 9.0.0
	 *
	 * @return string Licensing error message or empty string.
	 */
	public static function get_licensing_error() {
		return self::instance()->last_error();
	}

	/**
	 * Set a Jetpack license
	 *
	 * @since 9.6.0
	 *
	 * @param WP_REST_Request $request The request.
	 *
	 * @return WP_REST_Response|WP_Error A response object if the option was successfully updated, or a WP_Error if it failed.
	 */
	public static function set_jetpack_license( $request ) {
		$license = trim( sanitize_text_field( $request['license'] ) );

		if ( self::instance()->append_license( $license ) ) {
			return rest_ensure_response( array( 'code' => 'success' ) );
		}

		return new WP_Error(
			'setting_license_key_failed',
			esc_html__( 'Could not set this license key. Please try again.', 'jetpack-licensing' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Gets the users licenses.
	 *
	 * @since 10.4.0
	 *
	 * @return string|WP_Error A JSON object of user licenses if the request was successful, or a WP_Error otherwise.
	 */
	public static function get_user_licenses() {
		$wpcom_request = Client::wpcom_json_api_request_as_user(
			'/jetpack-licensing/user/licenses',
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'Content-Type'    => 'application/json',
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 === $response_code ) {
			$licenses = json_decode( wp_remote_retrieve_body( $wpcom_request ) );
			return $licenses;
		} else {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack-licensing' ),
				array( 'status' => $response_code )
			);
		}
	}

	/**
	 * Gets the users licenses counts.
	 *
	 * @since 10.4.0
	 *
	 * @return string|WP_Error A JSON object of user license counts if the request was successful, or a WP_Error otherwise.
	 */
	public static function get_user_license_counts() {
		$wpcom_request = Client::wpcom_json_api_request_as_user(
			'/jetpack-licensing/user/licenses/counts',
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'Content-Type'    => 'application/json',
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 === $response_code ) {
			$license_counts = json_decode( wp_remote_retrieve_body( $wpcom_request ) );
			return $license_counts;
		} else {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack-licensing' ),
				array( 'status' => $response_code )
			);
		}
	}

	/**
	 * Update the user-licenses activation notice dismissal data.
	 *
	 * @since 10.4.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array|WP_Error
	 */
	public static function update_licensing_activation_notice_dismiss( $request ) {

		if ( ! isset( $request['last_detached_count'] ) ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Missing parameter "last_detached_count".', 'jetpack-licensing' ), array( 'status' => 404 ) );
		}

		$default             = array(
			'last_detached_count' => null,
			'last_dismissed_time' => null,
		);
		$last_detached_count = ( '' === $request['last_detached_count'] )
			? $default['last_detached_count']
			: $request['last_detached_count'];
		$last_dismissed_time = ( '' === $request['last_detached_count'] )
			? $default['last_dismissed_time']
			// Use UTC timezone and convert to ISO8601 format(DateTime::W3C) for best compatibility with JavaScript Date in all browsers.
			: ( new DateTime( 'NOW', new DateTimeZone( 'UTC' ) ) )->format( DateTime::W3C );

		$notice_data = array(
			'last_detached_count' => $last_detached_count,
			'last_dismissed_time' => $last_dismissed_time,
		);

		Jetpack_Options::update_option( 'licensing_activation_notice_dismiss', $notice_data, true );
		return rest_ensure_response( $notice_data );
	}

	/**
	 * Attach Jetpack licenses
	 *
	 * @since 10.4.0
	 *
	 * @param WP_REST_Request $request The request.
	 *
	 * @return WP_REST_Response|WP_Error A response object
	 */
	public static function attach_jetpack_licenses( $request ) {
		$licenses = array_map(
			function ( $license ) {
				return trim( sanitize_text_field( $license ) );
			},
			$request['licenses']
		);
		return rest_ensure_response( self::instance()->attach_licenses( $licenses ) );
	}
}
