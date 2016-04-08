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
 * @since 4.1.0
 */
class Jetpack_Core_Json_Api_Endpoints {

	/**
	 * Declare the Jetpack REST API endpoints.
	 *
	 * @since 4.1.0
	 */
	public static function register_endpoints() {
		// Return all modules
		register_rest_route( 'jetpack/v4', '/modules', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_modules',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
		) );

		// Return a single module
		register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_module',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
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

		// Update a module
		register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)/update', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::update_module',
			'permission_callback' => __CLASS__ . '::configure_modules_permission_check',
			'args' => self::get_module_updating_parameters(),
		) );

		// Protect: get blocked count
		register_rest_route( 'jetpack/v4', '/module/protect/count/get', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::protect_get_blocked_count',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
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
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
		) );

		// Monitor: get last downtime
		register_rest_route( 'jetpack/v4', '/module/monitor/downtime/last', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::monitor_get_last_downtime',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
		) );

		// Updates: get number of plugin updates available
		register_rest_route( 'jetpack/v4', '/updates/plugins', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_plugin_update_count',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
		) );

		// Verification: get services that this site is verified with
		register_rest_route( 'jetpack/v4', '/module/verification-tools/services', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_verified_services',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
		) );

		// VaultPress: get date last backup or status and actions for user to take
		register_rest_route( 'jetpack/v4', '/module/vaultpress/backups/last', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::vaultpress_get_last_backup',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
		) );
	}

	/**
	 * Verify that user can manage Jetpack modules.
	 *
	 * @since 4.1.0
	 *
	 * @return bool Whether user has the capability 'jetpack_manage_modules'.
	 */
	public static function manage_modules_permission_check() {
		if ( current_user_can( 'jetpack_manage_modules' ) ) {
			return true;
		}

		return new WP_Error( 'cannot_manage', esc_html__( 'Sorry, you cannot manage Jetpack modules.', 'jetpack' ), array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that user can update Jetpack modules.
	 *
	 * @since 4.1.0
	 *
	 * @return bool Whether user has the capability 'jetpack_configure_modules'.
	 */
	public static function configure_modules_permission_check() {
		if ( current_user_can( 'jetpack_configure_modules' ) ) {
			return true;
		}

		return new WP_Error( 'cannot_configure', esc_html__( 'Sorry, you cannot configure Jetpack modules.', 'jetpack' ), array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that user can view Jetpack admin page.
	 *
	 * @since 4.1.0
	 *
	 * @return bool Whether user has the capability 'jetpack_admin_page'.
	 */
	public static function view_admin_page_permission_check() {
		if ( current_user_can( 'jetpack_admin_page' ) ) {
			return true;
		}

		return new WP_Error( 'cannot_view', esc_html__( 'Sorry, you cannot view this resource.', 'jetpack' ), array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Contextual HTTP error code for authorization failure.
	 *
	 * Taken from rest_authorization_required_code() in WP-API plugin until is added to core.
	 * @see https://github.com/WP-API/WP-API/commit/7ba0ae6fe4f605d5ffe4ee85b1cd5f9fb46900a6
	 *
	 * @since 4.1.0
	 *
	 * @return int
	 */
	public static function rest_authorization_required_code() {
		return is_user_logged_in() ? 403 : 401;
	}

	/**
	 * Is Akismet registered and active?
	 *
	 * @since 4.1.0
	 *
	 * @return bool|WP_Error True if Akismet is active and registered. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function akismet_is_active_and_registered() {
		if ( ! Jetpack::is_plugin_active( 'akismet/akismet.php' ) ) {
			return new WP_Error( 'not_active', esc_html__( 'Please activate Akismet.', 'jetpack' ), array( 'status' => 404 ) );
		}

		// What about if Akismet is put in a sub-directory or maybe in mu-plugins?
		require_once WP_PLUGIN_DIR . '/akismet/class.akismet.php';
		require_once WP_PLUGIN_DIR . '/akismet/class.akismet-admin.php';
		$akismet_key = Akismet::verify_key( Akismet::get_api_key() );

		if ( ! $akismet_key || 'invalid' === $akismet_key || 'failed' === $akismet_key ) {
			return new WP_Error( 'akismet_no_key', esc_html__( 'No valid API key for Akismet', 'jetpack' ), array( 'status' => 404 ) );
		}

		return true;
	}

	/**
	 * Get a list of all Jetpack modules and their information.
	 *
	 * @since 4.1.0
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
	 * @since 4.1.0
	 *
	 * @param WP_REST_Request $data {
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

		return new WP_Error( 'not_found', esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * If it's a valid Jetpack module, activate it.
	 *
	 * @since 4.1.0
	 *
	 * @param WP_REST_Request $data {
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
			return new WP_Error( 'activation_failed', esc_html__( 'The requested Jetpack module could not be activated.', 'jetpack' ), array( 'status' => 424 ) );
		}

		return new WP_Error( 'not_found', esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * If it's a valid Jetpack module, deactivate it.
	 *
	 * @since 4.1.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function deactivate_module( $data ) {
		if ( Jetpack::is_module( $data['slug'] ) ) {
			if ( ! Jetpack::is_module_active( $data['slug'] ) ) {
				return new WP_Error( 'already_inactive', esc_html__( 'The requested Jetpack module was already inactive.', 'jetpack' ), array( 'status' => 409 ) );
			}
			if ( Jetpack::deactivate_module( $data['slug'] ) ) {
				return rest_ensure_response( array(
					'code' 	  => 'success',
					'message' => esc_html__( 'The requested Jetpack module was deactivated.', 'jetpack' ),
				) );
			}
			return new WP_Error( 'deactivation_failed', esc_html__( 'The requested Jetpack module could not be deactivated.', 'jetpack' ), array( 'status' => 400 ) );
		}

		return new WP_Error( 'not_found', esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * If it's a valid Jetpack module and configuration parameters have been sent, update it.
	 *
	 * @since 4.1.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was updated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function update_module( $data ) {
		if ( Jetpack::is_module( $data['slug'] ) ) {
			if ( ! Jetpack::is_module_active( $data['slug'] ) ) {
				return new WP_Error( 'inactive', esc_html__( 'The requested Jetpack module is inactive.', 'jetpack' ), array( 'status' => 409 ) );
			}

			// Get parameters to update the module.
			$params = $data->get_body_params();

			// Exit if no parameters were passed.
			if ( ! is_array( $params ) ) {
				return new WP_Error( 'invalid_params', esc_html__( 'Missing or invalid parameters.', 'jetpack' ), array( 'status' => 404 ) );
			}

			// Go through each parameter, and if they're whitelisted, save its value.
			foreach ( $params as $key => $value ) {
				if ( in_array( $key, array_keys( self::get_module_available_options() ) ) ) {
					update_option( $key, $value );
				}
			}

			return rest_ensure_response( array(
				'code' 	  => 'success',
				'message' => esc_html__( 'The requested Jetpack module was updated.', 'jetpack' ),
			) );
		}

		return new WP_Error( 'not_found', esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Get the query parameters for module updating.
	 *
	 * @since 4.1.0
	 *
	 * @return array
	 */
	public static function get_module_updating_parameters() {
		$parameters = array(
			'context'     => array(
				'default' => 'edit',
			),
		);

		return array_merge( $parameters, self::get_module_available_options() );
	}

	/**
	 * Returns a list of module options that can be updated.
	 *
	 * @since 4.1.0
	 *
	 * @return array
	 */
	public static function get_module_available_options() {
		static $options;

		if ( ! isset( $options ) ) {
			$options = array(

				// Carousel
				'carousel_background_color' => array(
					'description'        => esc_html__( 'Carousel background color.', 'jetpack' ),
					'type'               => 'string',
					'default'            => 'black',
					'enum'				 => array( 'black', 'white' ),
					'validate_callback'  => __CLASS__ . '::validate_list_item',
				),
				'carousel_display_exif' => array(
					'description'        => esc_html__( 'Show photo metadata when available.', 'jetpack' ),
					'type'               => 'string',
					'default'            => '0',
					'validate_callback'  => __CLASS__ . '::validate_boolean',
				),

				// Custom Content Types
				'jetpack_portfolio' => array(
					'description'        => esc_html__( 'Enable or disable Jetpack portfolio post type.', 'jetpack' ),
					'type'               => 'string',
					'default'            => '0',
					'validate_callback'  => __CLASS__ . '::validate_boolean',
				),
				'jetpack_portfolio_posts_per_page' => array(
					'description'        => esc_html__( 'Number of entries to show at most in Portfolio pages.', 'jetpack' ),
					'type'               => 'integer',
					'default'            => '10',
					'validate_callback'  => __CLASS__ . '::validate_posint',
				),
				'jetpack_testimonial' => array(
					'description'        => esc_html__( 'Enable or disable Jetpack testimonial post type.', 'jetpack' ),
					'type'               => 'string',
					'default'            => '0',
					'validate_callback'  => __CLASS__ . '::validate_boolean',
				),
				'jetpack_testimonial_posts_per_page' => array(
					'description'        => esc_html__( 'Number of entries to show at most in Testimonial pages.', 'jetpack' ),
					'type'               => 'integer',
					'default'            => '10',
					'validate_callback'  => __CLASS__ . '::validate_posint',
				),
			);

		}

		return $options;
	}

	/**
	 * Validates that the parameter is either a pure boolean or a numeric string that can be mapped to a boolean.
	 *
	 * @since 4.1.0
	 *
	 * @param string|bool $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param
	 *
	 * @return bool
	 */
	public static function validate_boolean( $value, $request, $param ) {
		if ( ! is_bool( $value ) && ! ( ctype_digit( $value ) && in_array( $value, array( '0', '1' ) ) ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be true, false, 0 or 1.', 'jetpack' ), $param ) );
		}
		return true;
	}

	/**
	 * Validates that the parameter is a positive integer.
	 *
	 * @since 4.1.0
	 *
	 * @param int $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param
	 *
	 * @return bool
	 */
	public static function validate_posint( $value = 0, $request, $param ) {
		if ( ! is_numeric( $value ) || $value <= 0 ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be a positive integer.', 'jetpack' ), $param ) );
		}
		return true;
	}

	/**
	 * Validates that the parameter belongs to a list of admitted values.
	 *
	 * @since 4.1.0
	 *
	 * @param string $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param
	 *
	 * @return bool
	 */
	public static function validate_list_item( $value = '', $request, $param ) {
		$attributes = $request->get_attributes();
		if ( ! isset( $attributes['args'][ $param ] ) || ! is_array( $attributes['args'][ $param ] ) ) {
			return true;
		}
		$args = $attributes['args'][ $param ];
		if ( ! empty( $args['enum'] ) ) {
			if ( ! in_array( $value, $args['enum'] ) ) {
				return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be one of %s', 'jetpack' ), $param, implode( ', ', $args['enum'] ) ) );
			}
		}
		return true;
	}

	/**
	 * Get number of blocked intrusion attempts.
	 *
	 * @since 4.1.0
	 *
	 * @return mixed|WP_Error Number of blocked attempts if protection is enabled. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function protect_get_blocked_count() {
		if ( Jetpack::is_module_active( 'protect' ) ) {
			return get_site_option( 'jetpack_protect_blocked_attempts' );
		}

		return new WP_Error( 'not_active', esc_html__( 'The requested Jetpack module is not active.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Get number of spam messages blocked by Akismet.
	 *
	 * @since 4.1.0
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
	 * @since 4.1.0
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

		return new WP_Error( 'not_active', esc_html__( 'The requested Jetpack module is not active.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Get number of plugin updates available.
	 *
	 * @since 4.1.0
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

		return new WP_Error( 'not_found', esc_html__( 'Could not check updates for plugins on this site.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Get services that this site is verified with.
	 *
	 * @since 4.1.0
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

		return new WP_Error( 'not_active', esc_html__( 'The requested Jetpack module is not active.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Get date of last backup if it was completed. Otherwise a message prompting user to take action will be returned.
	 *
	 * @since 4.1.0
	 *
	 * @return mixed|WP_Error Number of days since last downtime. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function vaultpress_get_last_backup() {
		$active = Jetpack_Options::get_option( 'active_modules' );
		if ( is_array( $active ) && in_array( 'vaultpress', $active ) && class_exists( 'VaultPress' ) ) {
			$vaultpress = new VaultPress;
			$data = json_decode( base64_decode( $vaultpress->contact_service( 'plugin_data' ) ) );
			if ( is_wp_error( $data ) ) {
				return $data;
			} else {
				if ( isset( $data->errors ) && $data->errors->no_recent_backups ) {
					if ( is_object( $data->backups->in_progress ) ) {
						$response = array(
							'code'    => 'backup-in-progress',
							'message' => esc_html__( 'Your site is currently being backed-up.', 'jetpack' ),
							'backups' => $data->backups,
						);
					} else {
						$response = array(
							'code'    => 'no-recent-backups',
							'message' => esc_html__( "You don't have recent backups.", 'jetpack' ),
							'backups' => $data->backups,
						);
					}
				} elseif ( $data->backups->last_backup ) {
					$response = array(
						'code'    => 'success',
						'message' => esc_html( sprintf( __( 'Your site was successfully backed-up %s ago.', 'jetpack' ), human_time_diff( $data->backups->last_backup, current_time( 'timestamp' ) ) ) ),
						'backups' => $data->backups,
					);
				} else {
					$response = array(
						'code'    => 'last-backup-failed',
						'message' => esc_html__( 'Your last backup failed.', 'jetpack' ),
						'backups' => $data->backups,
					);
				}
				return rest_ensure_response( $response );
			}
		}

		return new WP_Error( 'not_active', esc_html__( 'The requested Jetpack module is not active.', 'jetpack' ), array( 'status' => 404 ) );
	}

} // class end