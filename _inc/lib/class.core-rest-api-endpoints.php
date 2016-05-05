<?php
/**
 * Register WP REST API endpoints for Jetpack.
 *
 * @author Automattic
 */

/**
 * Disable direct access.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Load WP_Error for error messages.
require_once ABSPATH . '/wp-includes/class-wp-error.php';

// Register endpoints when WP REST API is initialized.
add_action( 'rest_api_init', array( 'Jetpack_Core_Json_Api_Endpoints', 'register_endpoints' ) );

/**
 * Class Jetpack_Core_Json_Api_Endpoints
 *
 * @since 4.0.0
 */
class Jetpack_Core_Json_Api_Endpoints {

	/**
	 * Declare the Jetpack REST API endpoints.
	 *
	 * @since 4.0.0
	 */
	public static function register_endpoints() {
		// Return all modules
		register_rest_route( 'jetpack/v4', '/modules', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_modules',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Return a single module
		register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_module',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Activate a module
		register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)/activate', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::activate_module',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Deactivate a module
		register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)/deactivate', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::deactivate_module',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Protect: get blocked count
		register_rest_route( 'jetpack/v4', '/module/protect/count/get', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::protect_get_blocked_count',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Akismet: get spam count
		register_rest_route( 'jetpack/v4', '/akismet/count/get', array(
			'methods'  => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::akismet_get_spam_count',
			'args'     => array(
				'date' => array(
					'default' => 'all',
					'required' => true,
					'sanitize_callback' => 'absint'
				),
			),
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Monitor: get last downtime
		register_rest_route( 'jetpack/v4', '/module/monitor/downtime/last', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::monitor_get_last_downtime',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Updates: get number of plugin updates available
		register_rest_route( 'jetpack/v4', '/updates/plugins', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_plugin_update_count',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Verification: get services that this site is verified with
		register_rest_route( 'jetpack/v4', '/module/verification-tools/services', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_verified_services',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );
	}


	/**
	 * Verify that user can manage Jetpack modules.
	 *
	 * @since 4.0.0
	 *
	 * @return bool Whether user has the capability 'jetpack_manage_module'.
	 */
	public static function manage_modules_permission_check() {
		return current_user_can( 'jetpack_manage_modules' );
	}

	/**
	 * Is Akismet registered and active?
	 *
	 * @since 4.0.0
	 *
	 * @return bool|WP_Error True if Akismet is active and registered. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function akismet_is_active_and_registered() {
		if ( ! Jetpack::is_plugin_active( 'akismet/akismet.php' ) ) {
			return new WP_Error( 'not-active', esc_html__( 'Please activate Akismet.', 'jetpack' ), array( 'status' => 404 ) );
		}

		// What about if Akismet is put in a sub-directory or maybe in mu-plugins?
		require_once WP_PLUGIN_DIR . '/akismet/class.akismet.php';
		require_once WP_PLUGIN_DIR . '/akismet/class.akismet-admin.php';
		$akismet_key = Akismet::verify_key( Akismet::get_api_key() );

		if ( ! $akismet_key || 'invalid' === $akismet_key || 'failed' === $akismet_key ) {
			return new WP_Error( 'akismet-no-key', esc_html__( 'No valid API key for Akismet', 'jetpack' ), array( 'status' => 404 ) );
		}

		return true;
	}

	/**
	 * Get a list of all Jetpack modules and their information.
	 *
	 * @since 4.0.0
	 *
	 * @return array Array of Jetpack modules.
	 */
	public static function get_modules() {
		require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php' );
		return Jetpack_Admin::init()->get_modules();
	}

	/**
	 * Get information about a specific and valid Jetpack module.
	 *
	 * @since 4.0.0
	 *
	 * @param array $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return mixed|void|WP_Error
	 */
	public static function get_module( $data ) {
		if ( Jetpack::is_module( $data['slug'] ) ) {
			return Jetpack::get_module( $data['slug'] );
		}

		return new WP_Error( 'not-found', esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * If it's a valid Jetpack module, activate it.
	 *
	 * @since 4.0.0
	 *
	 * @param array $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function activate_module( $data ) {
		if ( Jetpack::is_module( $data['slug'] ) ) {
			if ( Jetpack::activate_module( $data['slug'], false, false ) ) {
				return rest_ensure_response( array(
					'code' 	  => 'success',
					'message' => esc_html__( 'The requested Jetpack module was activated.', 'jetpack' ),
				) );
			}
			return rest_ensure_response( array(
				'code' 	  => 'error',
				'message' => esc_html__( 'The requested Jetpack module could not be activated.', 'jetpack' ),
			) );
		}

		return new WP_Error( 'not-found', esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * If it's a valid Jetpack module, deactivate it.
	 *
	 * @since 4.0.0
	 *
	 * @param array $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function deactivate_module( $data ) {
		if ( Jetpack::is_module( $data['slug'] ) ) {
			if ( Jetpack::deactivate_module( $data['slug'] ) ) {
				return rest_ensure_response( array(
					'code' 	  => 'success',
					'message' => esc_html__( 'The requested Jetpack module was deactivated.', 'jetpack' ),
				) );
			}
			return rest_ensure_response( array(
				'code' 	  => 'success',
				'message' => esc_html__( 'The requested Jetpack module was already inactive.', 'jetpack' ),
			) );
		}

		return new WP_Error( 'not-found', esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ), array( 'status' => 404 ) );
	}


	/**
	 * Get number of blocked intrusion attempts.
	 *
	 * @since 4.0.0
	 *
	 * @return mixed|WP_Error Number of blocked attempts if protection is enabled. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function protect_get_blocked_count() {
		if ( Jetpack::is_module_active( 'protect' ) ) {
			return get_site_option( 'jetpack_protect_blocked_attempts' );
		}

		return new WP_Error( 'not-active', esc_html__( 'The requested Jetpack module is not active.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Get number of spam messages blocked by Akismet.
	 *
	 * @since 4.0.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $date Date range to restrict results to.
	 * }
	 *
	 * @return int|string Number of spam blocked by Akismet. Otherwise, an error message.
	 */
	public static function akismet_get_spam_count( WP_REST_Request $data ) {
		if ( ! is_wp_error( $status = self::akismet_is_active_and_registered() ) ) {
			$count_data = Akismet_Admin::get_stats( Akismet::get_api_key() );
		} else {
			return $status->get_error_messages();
		}

		if ( 'all' === $data['date'] ) {
			return $count_data['all']->spam;
		}

		// Organize the requested date time to YYYY-MM
		$data['date'] = DateTime::createFromFormat( 'Ym', $data['date'] );
		return $count_data['6-months']->breakdown->{ $data['date']->format( 'Y-m' ) }->spam;
	}

	/**
	 * Get date of last downtime.
	 *
	 * @since 4.0.0
	 *
	 * @return mixed|WP_Error Number of days since last downtime. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function monitor_get_last_downtime() {
		if ( Jetpack::is_module_active( 'monitor' ) ) {
			$monitor       = new Jetpack_Monitor();
			$last_downtime = $monitor->monitor_get_last_downtime();
			if ( is_wp_error( $last_downtime ) ) {
				return $last_downtime;
			} else {
				return rest_ensure_response( array(
					'code' => 'success',
					'date' => human_time_diff( strtotime( $last_downtime ), strtotime( 'now' ) ),
				) );
			}
		}

		return new WP_Error( 'not-active', esc_html__( 'The requested Jetpack module is not active.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Get number of plugin updates available.
	 *
	 * @since 4.0.0
	 *
	 * @return mixed|WP_Error Number of plugin updates available. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function get_plugin_update_count() {
		$updates = wp_get_update_data();
		if ( isset( $updates['counts'] ) && isset( $updates['counts']['plugins'] ) ) {
			$count = $updates['counts']['plugins'];
			if ( 0 == $count ) {
				$response = array(
					'code'    => 'success',
					'message' => esc_html__( 'All plugins are up-to-date. Keep up the good work!', 'jetpack' ),
					'count'   => 0,
				);
			} else {
				$response = array(
					'code'    => 'updates-available',
					'message' => esc_html( sprintf( _n( '%s plugin need updating.', '%s plugins need updating.', $count, 'jetpack' ), $count ) ),
					'count'   => $count,
				);
			}
			return rest_ensure_response( $response );
		}

		return new WP_Error( 'not-found', esc_html__( 'Could not check updates for plugins on this site.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Get services that this site is verified with.
	 *
	 * @since 4.0.0
	 *
	 * @return mixed|WP_Error List of services that verified this site. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function get_verified_services() {
		if ( Jetpack::is_module_active( 'verification-tools' ) ) {
			$verification_services_codes = get_option( 'verification_services_codes' );
			if ( is_array( $verification_services_codes ) && ! empty( $verification_services_codes ) ) {
				$services = array();
				foreach ( jetpack_verification_services() as $name => $service ) {
					if ( is_array( $service ) && ! empty( $verification_services_codes[ $name ] ) ) {
						switch ( $name ) {
							case 'google':
								$services[] = 'Google';
								break;
							case 'bing':
								$services[] = 'Bing';
								break;
							case 'pinterest':
								$services[] = 'Pinterest';
								break;
						}
					}
				}
				if ( ! empty( $services ) ) {
					if ( 2 > count( $services ) ) {
						$message = esc_html( sprintf( __( 'Your site is verified with %s.', 'jetpack' ), $services[0] ) );
					} else {
						$copy_services = $services;
						$last = count( $copy_services ) - 1;
						$last_service = $copy_services[ $last ];
						unset( $copy_services[ $last ] );
						$message = esc_html( sprintf( __( 'Your site is verified with %s and %s.', 'jetpack' ), join( ', ', $copy_services ), $last_service ) );
					}
					return rest_ensure_response( array(
						'code'     => 'success',
						'message'  => $message,
						'services' => $services,
					) );
				}
			}
			return new WP_Error( 'empty', esc_html__( 'Site not verified with any service.', 'jetpack' ), array( 'status' => 404 ) );
		}

		return new WP_Error( 'not-active', esc_html__( 'The requested Jetpack module is not active.', 'jetpack' ), array( 'status' => 404 ) );
	}

} // class end