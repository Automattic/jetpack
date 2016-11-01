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
 * @since 4.3.0
 */
class Jetpack_Core_Json_Api_Endpoints {

	/**
	 * @var string Generic error message when user is not allowed to perform an action.
	 */
	public static $user_permissions_error_msg;

	/**
	 * @var array Roles that can access Stats once they're granted access.
	 */
	public static $stats_roles;

	/**
	 * Declare the Jetpack REST API endpoints.
	 *
	 * @since 4.3.0
	 */
	public static function register_endpoints() {

		// Load API endpoint base classes
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-xmlrpc-consumer-endpoint.php';

		// Load API endpoints
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-module-endpoints.php';

		self::$user_permissions_error_msg = esc_html__(
			'You do not have the correct user permissions to perform this action.
			Please contact your site admin if you think this is a mistake.',
			'jetpack'
		);

		self::$stats_roles = array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' );

		// Get current connection status of Jetpack
		register_rest_route( 'jetpack/v4', '/connection', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::jetpack_connection_status',
		) );

		// Fetches a fresh connect URL
		register_rest_route( 'jetpack/v4', '/connection/url', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::build_connect_url',
			'permission_callback' => __CLASS__ . '::connect_url_permission_callback',
		) );

		// Get current user connection data
		register_rest_route( 'jetpack/v4', '/connection/data', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_user_connection_data',
			'permission_callback' => __CLASS__ . '::get_user_connection_data_permission_callback',
		) );

		// Disconnect site from WordPress.com servers
		register_rest_route( 'jetpack/v4', '/connection', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::disconnect_site',
			'permission_callback' => __CLASS__ . '::disconnect_site_permission_callback',
		) );

		// Disconnect/unlink user from WordPress.com servers
		register_rest_route( 'jetpack/v4', '/connection/user', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::unlink_user',
			'permission_callback' => __CLASS__ . '::link_user_permission_callback',
			'args' => array(
				'id' => array(
					'default' => get_current_user_id(),
					'validate_callback' => __CLASS__  . '::validate_posint',
				),
			),
		) );

		// Get current site data
		register_rest_route( 'jetpack/v4', '/site', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_site_data',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
		) );

		// Return all modules
		self::route(
			'module/all',
			'Jetpack_Core_API_Module_List_Endpoint',
			WP_REST_Server::READABLE
		);

		// Activate many modules
		self::route(
			'/module/all/active',
			'Jetpack_Core_API_Module_List_Endpoint',
			WP_REST_Server::EDITABLE,
			NULL,
			array(
				'modules' => array(
					'default'           => '',
					'type'              => 'array',
					'required'          => true,
					'validate_callback' => __CLASS__ . '::validate_module_list',
				),
				'active' => array(
					'default'           => true,
					'type'              => 'boolean',
					'required'          => false,
					'validate_callback' => __CLASS__ . '::validate_boolean',
				),
			)
		);

		Jetpack::load_xml_rpc_client();

		// Return a single module and update it when needed
		self::route(
			'/module/(?P<slug>[a-z\-]+)',
			'Jetpack_Core_API_Module_Endpoint',
			WP_REST_Server::READABLE,
			new Jetpack_IXR_Client( array( 'user_id' => get_current_user_id() ) )
		);

		// Activate and deactivate a module
		self::route(
			'/module/(?P<slug>[a-z\-]+)/active',
			'Jetpack_Core_API_Module_Toggle_Endpoint',
			WP_REST_Server::EDITABLE,
			new Jetpack_IXR_Client(),
			array(
				'active' => array(
					'default'           => true,
					'type'              => 'boolean',
					'required'          => true,
					'validate_callback' => __CLASS__ . '::validate_boolean',
				),
			)
		);

		// Update a module
		self::route(
			'/module/(?P<slug>[a-z\-]+)',
			'Jetpack_Core_API_Module_Endpoint',
			WP_REST_Server::EDITABLE,
			new Jetpack_IXR_Client( array( 'user_id' => get_current_user_id() ) ),
			self::get_module_updating_parameters()
		);

		// Get data for a specific module, i.e. Protect block count, WPCOM stats,
		// Akismet spam count, etc.
		self::route(
			'/module/(?P<slug>[a-z\-]+)/data',
			'Jetpack_Core_API_Module_Data_Endpoint',
			WP_REST_Server::READABLE,
			NULL,
			array(
				'range' => array(
					'default'           => 'day',
					'type'              => 'string',
					'required'          => false,
					'validate_callback' => __CLASS__ . '::validate_string',
				),
			)
		);

		// Reset all Jetpack options
		register_rest_route( 'jetpack/v4', '/options/(?P<options>[a-z\-]+)', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::reset_jetpack_options',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Return miscellaneous settings
		register_rest_route( 'jetpack/v4', '/settings', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_settings',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
		) );

		// Update miscellaneous setting
		register_rest_route( 'jetpack/v4', '/settings', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::update_setting',
			'permission_callback' => __CLASS__ . '::update_settings_permission_check',
		) );

		// Jumpstart
		register_rest_route( 'jetpack/v4', '/jumpstart', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::jumpstart_toggle',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
			'args' => array(
				'active' => array(
					'required' => true,
					'validate_callback' => __CLASS__  . '::validate_boolean',
				),
			),
		) );

		// Updates: get number of plugin updates available
		register_rest_route( 'jetpack/v4', '/updates/plugins', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_plugin_update_count',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
		) );

		// Dismiss Jetpack Notices
		register_rest_route( 'jetpack/v4', '/notice/(?P<notice>[a-z\-_]+)', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::dismiss_notice',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
		) );

		// Plugins: get list of all plugins.
		register_rest_route( 'jetpack/v4', '/plugins', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_plugins',
			'permission_callback' => __CLASS__ . '::activate_plugins_permission_check',
		) );

		// Plugins: check if the plugin is active.
		register_rest_route( 'jetpack/v4', '/plugin/(?P<plugin>[a-z\/\.\-_]+)', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_plugin',
			'permission_callback' => __CLASS__ . '::activate_plugins_permission_check',
		) );
	}

	public static function route( $path, $classname, $method,
		$constructor_arguments = NULL,
		$endpoint_arguments = NULL
	) {
		if ( ! empty( $constructor_arguments ) ) {
			$endpoint = new $classname( $constructor_arguments );
		} else {
			$endpoint = new $classname();
		}

		$parameters = array(
			'methods' => $method,
			'callback' => array( $endpoint, 'process' ),
			'permission_callback' => array( $endpoint, 'can_request' )
		);

		if ( ! empty( $endpoint_arguments ) ) {
			$parameters['args'] = $endpoint_arguments;
		}

		register_rest_route( 'jetpack/v4', $path, $parameters );
	}

	/**
	 * Handles dismissing of Jetpack Notices
	 *
	 * @since 4.3.0
	 *
	 * @return array|wp-error
	 */
	public static function dismiss_notice( $data ) {
		$notice = $data['notice'];
		$param = $data->get_json_params();

		if ( ! isset( $param['dismissed'] ) || $param['dismissed'] !== true ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Invalid parameter "dismissed".', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( isset( $notice ) && ! empty( $notice ) ) {
			switch( $notice ) {
				case 'feedback_dash_request':
				case 'welcome':
					$notices = get_option( 'jetpack_dismissed_notices', array() );
					$notices[ $notice ] = true;
					update_option( 'jetpack_dismissed_notices', $notices );
					return rest_ensure_response( get_option( 'jetpack_dismissed_notices', array() ) );

				default:
					return new WP_Error( 'invalid_param', esc_html__( 'Invalid parameter "notice".', 'jetpack' ), array( 'status' => 404 ) );
			}
		}

		return new WP_Error( 'required_param', esc_html__( 'Missing parameter "notice".', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Verify that the user can disconnect the site.
	 *
	 * @since 4.3.0
	 *
	 * @return bool|WP_Error True if user is able to disconnect the site.
	 */
	public static function disconnect_site_permission_callback() {
		if ( current_user_can( 'jetpack_disconnect' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_jetpack_disconnect', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );

	}

	/**
	 * Verify that the user can get a connect/link URL
	 *
	 * @since 4.3.0
	 *
	 * @return bool|WP_Error True if user is able to disconnect the site.
	 */
	public static function connect_url_permission_callback() {
		if ( current_user_can( 'jetpack_connect_user' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_jetpack_disconnect', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );

	}

	/**
	 * Verify that a user can use the link endpoint.
	 *
	 * @since 4.3.0
	 *
	 * @return bool|WP_Error True if user is able to link to WordPress.com
	 */
	public static function link_user_permission_callback() {
		if ( current_user_can( 'jetpack_connect_user' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_link_user', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that a user can get the data about the current user.
	 * Only those who can connect.
	 *
	 * @since 4.3.0
	 *
	 * @uses Jetpack::is_user_connected();
	 *
	 * @return bool|WP_Error True if user is able to unlink.
	 */
	public static function get_user_connection_data_permission_callback() {
		if ( current_user_can( 'jetpack_connect_user' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_unlink_user', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that a user can use the unlink endpoint.
	 * Either needs to be an admin of the site, or for them to be currently linked.
	 *
	 * @since 4.3.0
	 *
	 * @uses Jetpack::is_user_connected();
	 *
	 * @return bool|WP_Error True if user is able to unlink.
	 */
	public static function unlink_user_permission_callback() {
		if ( current_user_can( 'jetpack_connect' ) || Jetpack::is_user_connected( get_current_user_id() ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_unlink_user', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that user can manage Jetpack modules.
	 *
	 * @since 4.3.0
	 *
	 * @return bool Whether user has the capability 'jetpack_manage_modules'.
	 */
	public static function manage_modules_permission_check() {
		if ( current_user_can( 'jetpack_manage_modules' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_manage_modules', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that user can update Jetpack modules.
	 *
	 * @since 4.3.0
	 *
	 * @return bool Whether user has the capability 'jetpack_configure_modules'.
	 */
	public static function configure_modules_permission_check() {
		if ( current_user_can( 'jetpack_configure_modules' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_configure_modules', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that user can view Jetpack admin page.
	 *
	 * @since 4.3.0
	 *
	 * @return bool Whether user has the capability 'jetpack_admin_page'.
	 */
	public static function view_admin_page_permission_check() {
		if ( current_user_can( 'jetpack_admin_page' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_view_admin', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that user can update Jetpack options.
	 *
	 * @since 4.3.0
	 *
	 * @return bool Whether user has the capability 'jetpack_admin_page'.
	 */
	public static function update_settings_permission_check() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_manage_settings', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that user can view Jetpack admin page and can activate plugins.
	 *
	 * @since 4.3.0
	 *
	 * @return bool Whether user has the capability 'jetpack_admin_page' and 'activate_plugins'.
	 */
	public static function activate_plugins_permission_check() {
		if ( current_user_can( 'jetpack_admin_page', 'activate_plugins' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_activate_plugins', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Contextual HTTP error code for authorization failure.
	 *
	 * Taken from rest_authorization_required_code() in WP-API plugin until is added to core.
	 * @see https://github.com/WP-API/WP-API/commit/7ba0ae6fe4f605d5ffe4ee85b1cd5f9fb46900a6
	 *
	 * @since 4.3.0
	 *
	 * @return int
	 */
	public static function rest_authorization_required_code() {
		return is_user_logged_in() ? 403 : 401;
	}

	/**
	 * Get connection status for this Jetpack site.
	 *
	 * @since 4.3.0
	 *
	 * @return bool True if site is connected
	 */
	public static function jetpack_connection_status() {
		return rest_ensure_response( array(
				'isActive'  => Jetpack::is_active(),
				'isStaging' => Jetpack::is_staging_site(),
				'devMode'   => array(
					'isActive' => Jetpack::is_development_mode(),
					'constant' => defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG,
					'url'      => site_url() && false === strpos( site_url(), '.' ),
					'filter'   => apply_filters( 'jetpack_development_mode', false ),
				),
			)
		);
	}

	/**
	 * Disconnects Jetpack from the WordPress.com Servers
	 *
	 * @uses Jetpack::disconnect();
	 * @since 4.3.0
	 * @return bool|WP_Error True if Jetpack successfully disconnected.
	 */
	public static function disconnect_site( $data ) {
		$param = $data->get_json_params();

		if ( ! isset( $param['isActive'] ) || $param['isActive'] !== false ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Invalid Parameter', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( Jetpack::is_active() ) {
			Jetpack::disconnect();
			return rest_ensure_response( array( 'code' => 'success' ) );
		}

		return new WP_Error( 'disconnect_failed', esc_html__( 'Was not able to disconnect the site.  Please try again.', 'jetpack' ), array( 'status' => 400 ) );
	}

	/**
	 * Gets a new connect URL with fresh nonce
	 *
	 * @uses Jetpack::disconnect();
	 * @since 4.3.0
	 * @return bool|WP_Error True if Jetpack successfully disconnected.
	 */
	public static function build_connect_url() {
		if ( require_once( ABSPATH . 'wp-admin/includes/plugin.php' ) ) {
			$url = Jetpack::init()->build_connect_url( true, false, false );
			return rest_ensure_response( $url );
		}

		return new WP_Error( 'build_connect_url_failed', esc_html__( 'Unable to build the connect URL.  Please reload the page and try again.', 'jetpack' ), array( 'status' => 400 ) );
	}

	/**
	 * Get miscellaneous settings for this Jetpack installation, like Holiday Snow.
	 *
	 * @since 4.3.0
	 *
	 * @return object $response {
	 *     Array of miscellaneous settings.
	 *
	 *     @type bool $holiday-snow Did Jack steal Christmas?
	 * }
	 */
	public static function get_settings() {
		$response = array(
			jetpack_holiday_snow_option_name() => get_option( jetpack_holiday_snow_option_name() ) == 'letitsnow',
		);
		return rest_ensure_response( $response );
	}

	/**
	 * Get miscellaneous user data related to the connection. Similar data available in old "My Jetpack".
	 * Information about the master/primary user.
	 * Information about the current user.
	 *
	 * @since 4.3.0
	 *
	 * @return object
	 */
	public static function get_user_connection_data() {
		require_once( JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class.jetpack-react-page.php' );

		$response = array(
//			'othersLinked' => Jetpack::get_other_linked_admins(),
			'currentUser'  => jetpack_current_user_data(),
		);
		return rest_ensure_response( $response );
	}



	/**
	 * Update a single miscellaneous setting for this Jetpack installation, like Holiday Snow.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data
	 *
	 * @return object Jetpack miscellaneous settings.
	 */
	public static function update_setting( $data ) {
		// Get parameters to update the module.
		$param = $data->get_json_params();

		// Exit if no parameters were passed.
		if ( ! is_array( $param ) ) {
			return new WP_Error( 'missing_setting', esc_html__( 'Missing setting.', 'jetpack' ), array( 'status' => 404 ) );
		}

		// Get option name and value.
		$option = key( $param );
		$value  = current( $param );

		// Log success or not
		$updated = false;

		switch ( $option ) {
			case jetpack_holiday_snow_option_name():
				$updated = update_option( $option, ( true == (bool) $value ) ? 'letitsnow' : '' );
				break;
		}

		if ( $updated ) {
			return rest_ensure_response( array(
				'code' 	  => 'success',
				'message' => esc_html__( 'Setting updated.', 'jetpack' ),
				'value'   => $value,
			) );
		}

		return new WP_Error( 'setting_not_updated', esc_html__( 'The setting was not updated.', 'jetpack' ), array( 'status' => 400 ) );
	}

	/**
	 * Unlinks a user from the WordPress.com Servers.
	 * Default $data['id'] will default to current_user_id if no value is given.
	 *
	 * Example: '/unlink?id=1234'
	 *
	 * @since 4.3.0
	 * @uses  Jetpack::unlink_user
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type int $id ID of user to unlink.
	 * }
	 *
	 * @return bool|WP_Error True if user successfully unlinked.
	 */
	public static function unlink_user( $data ) {
		$param = $data->get_json_params();

		if ( ! isset( $param['linked'] ) || $param['linked'] !== false ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Invalid Parameter', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( isset( $data['id'] ) && Jetpack::unlink_user( $data['id'] ) ) {
			return rest_ensure_response(
				array(
					'code' => 'success'
				)
			);
		}

		return new WP_Error( 'unlink_user_failed', esc_html__( 'Was not able to unlink the user.  Please try again.', 'jetpack' ), array( 'status' => 400 ) );
	}

	/**
	 * Get site data, including for example, the site's current plan.
	 *
	 * @since 4.3.0
	 *
	 * @return array Array of Jetpack modules.
	 */
	public static function get_site_data() {

		if ( $site_id = Jetpack_Options::get_option( 'id' ) ) {
			$response = Jetpack_Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d', $site_id ), '1.1' );

			if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
				return new WP_Error( 'site_data_fetch_failed', esc_html__( 'Failed fetching site data. Try again later.', 'jetpack' ), array( 'status' => 400 ) );
			}

			return rest_ensure_response( array(
					'code' => 'success',
					'message' => esc_html__( 'Site data correctly received.', 'jetpack' ),
					'data' => wp_remote_retrieve_body( $response ),
				)
			);
		}

		return new WP_Error( 'site_id_missing', esc_html__( 'The ID of this site does not exist.', 'jetpack' ), array( 'status' => 404 ) );
	}


	/**
	 * Reset Jetpack options
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $options Available options to reset are options|modules
	 * }
	 *
	 * @return bool|WP_Error True if options were reset. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function reset_jetpack_options( $data ) {
		$param = $data->get_json_params();

		if ( ! isset( $param['reset'] ) || $param['reset'] !== true ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Invalid Parameter', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( isset( $data['options'] ) ) {
			$data = $data['options'];

			switch( $data ) {
				case ( 'options' ) :
					$options_to_reset = Jetpack::get_jetpack_options_for_reset();

					// Reset the Jetpack options
					foreach ( $options_to_reset['jp_options'] as $option_to_reset ) {
						Jetpack_Options::delete_option( $option_to_reset );
					}

					foreach ( $options_to_reset['wp_options'] as $option_to_reset ) {
						delete_option( $option_to_reset );
					}

					// Reset to default modules
					$default_modules = Jetpack::get_default_modules();
					Jetpack::update_active_modules( $default_modules );

					// Jumpstart option is special
					Jetpack_Options::update_option( 'jumpstart', 'new_connection' );
					return rest_ensure_response( array(
						'code' 	  => 'success',
						'message' => esc_html__( 'Jetpack options reset.', 'jetpack' ),
					) );
					break;

				case 'modules':
					$default_modules = Jetpack::get_default_modules();
					Jetpack::update_active_modules( $default_modules );
					return rest_ensure_response( array(
						'code' 	  => 'success',
						'message' => esc_html__( 'Modules reset to default.', 'jetpack' ),
					) );
					break;

				default:
					return new WP_Error( 'invalid_param', esc_html__( 'Invalid Parameter', 'jetpack' ), array( 'status' => 404 ) );
			}
		}

		return new WP_Error( 'required_param', esc_html__( 'Missing parameter "type".', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Toggles activation or deactivation of the JumpStart
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 * }
	 *
	 * @return bool|WP_Error True if toggling Jumpstart succeeded. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function jumpstart_toggle( $data ) {
		$param = $data->get_json_params();

		if ( $param[ 'active' ] ) {
			return self::jumpstart_activate( $data );
		} else {
			return self::jumpstart_deactivate( $data );
		}
	}

	/**
	 * Activates a series of valid Jetpack modules and initializes some options.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 * }
	 *
	 * @return bool|WP_Error True if Jumpstart succeeded. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function jumpstart_activate( $data ) {
		$modules = Jetpack::get_available_modules();
		$activate_modules = array();
		foreach ( $modules as $module ) {
			$module_info = Jetpack::get_module( $module );
			if ( isset( $module_info['feature'] ) && is_array( $module_info['feature'] ) && in_array( 'Jumpstart', $module_info['feature'] ) ) {
				$activate_modules[] = $module;
			}
		}

		// Collect success/error messages like modules that are properly activated.
		$result = array(
			'activated_modules' => array(),
			'failed_modules'    => array(),
		);

		// Update the jumpstart option
		if ( 'new_connection' === Jetpack_Options::get_option( 'jumpstart' ) ) {
			$result['jumpstart_activated'] = Jetpack_Options::update_option( 'jumpstart', 'jumpstart_activated' );
		}

		// Check for possible conflicting plugins
		$module_slugs_filtered = Jetpack::init()->filter_default_modules( $activate_modules );

		foreach ( $module_slugs_filtered as $module_slug ) {
			Jetpack::log( 'activate', $module_slug );
			if ( Jetpack::activate_module( $module_slug, false, false ) ) {
				$result['activated_modules'][] = $module_slug;
			} else {
				$result['failed_modules'][] = $module_slug;
			}
		}

		// Set the default sharing buttons and set to display on posts if none have been set.
		$sharing_services = get_option( 'sharing-services' );
		$sharing_options  = get_option( 'sharing-options' );
		if ( empty( $sharing_services['visible'] ) ) {
			// Default buttons to set
			$visible = array(
				'twitter',
				'facebook',
				'google-plus-1',
			);
			$hidden = array();

			// Set some sharing settings
			$sharing = new Sharing_Service();
			$sharing_options['global'] = array(
				'button_style'  => 'icon',
				'sharing_label' => $sharing->default_sharing_label,
				'open_links'    => 'same',
				'show'          => array( 'post' ),
				'custom'        => isset( $sharing_options['global']['custom'] ) ? $sharing_options['global']['custom'] : array()
			);

			$result['sharing_options']  = update_option( 'sharing-options', $sharing_options );
			$result['sharing_services'] = update_option( 'sharing-services', array( 'visible' => $visible, 'hidden' => $hidden ) );
		}

		// If all Jumpstart modules were activated
		if ( empty( $result['failed_modules'] ) ) {
			return rest_ensure_response( array(
				'code' 	  => 'success',
				'message' => esc_html__( 'Jumpstart done.', 'jetpack' ),
				'data'    => $result,
			) );
		}

		return new WP_Error( 'jumpstart_failed', esc_html( sprintf( _n( 'Jumpstart failed activating this module: %s.', 'Jumpstart failed activating these modules: %s.', count( $result['failed_modules'] ), 'jetpack' ), join( ', ', $result['failed_modules'] ) ) ), array( 'status' => 400 ) );
	}

	/**
	 * Dismisses Jumpstart so user is not prompted to go through it again.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 * }
	 *
	 * @return bool|WP_Error True if Jumpstart was disabled or was nothing to dismiss. Otherwise, a WP_Error instance with a message.
	 */
	public static function jumpstart_deactivate( $data ) {

		// If dismissed, flag the jumpstart option as such.
		if ( 'new_connection' === Jetpack_Options::get_option( 'jumpstart' ) ) {
			if ( Jetpack_Options::update_option( 'jumpstart', 'jumpstart_dismissed' ) ) {
				return rest_ensure_response( array(
					'code' 	  => 'success',
					'message' => esc_html__( 'Jumpstart dismissed.', 'jetpack' ),
				) );
			} else {
				return new WP_Error( 'jumpstart_failed_dismiss', esc_html__( 'Jumpstart could not be dismissed.', 'jetpack' ), array( 'status' => 400 ) );
			}
		}

		// If this was not a new connection and there was nothing to dismiss, don't fail.
		return rest_ensure_response( array(
			'code' 	  => 'success',
			'message' => esc_html__( 'Nothing to dismiss. This was not a new connection.', 'jetpack' ),
		) );
	}

	/**
	 * Get the query parameters for module updating.
	 *
	 * @since 4.3.0
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
	 * @since 4.3.0
	 *
	 * @param string $module Module slug. If empty, it's assumed we're updating a module and we'll try to get its slug.
	 * @param bool $cache Whether to cache the options or return always fresh.
	 *
	 * @return array
	 */
	public static function get_module_available_options( $module = '' ) {
		$options = array();

		if ( empty( $module ) ) {
			$module = self::get_module_requested();
		}

		switch ( $module ) {

			// Carousel
			case 'carousel':
				$options = array(
					'carousel_background_color' => array(
						'description'        => esc_html__( 'Background color.', 'jetpack' ),
						'type'               => 'string',
						'default'            => 'black',
						'enum'				 => array(
							'black' => esc_html__( 'Black', 'jetpack' ),
							'white' => esc_html__( 'White', 'jetpack' ),
						),
						'validate_callback'  => __CLASS__ . '::validate_list_item',
					),
					'carousel_display_exif' => array(
						'description'        => wp_kses( sprintf( __( 'Show photo metadata (<a href="http://en.wikipedia.org/wiki/Exchangeable_image_file_format" target="_blank">Exif</a>) in carousel, when available.', 'jetpack' ) ), array( 'a' => array( 'href' => true, 'target' => true ) )  ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
				);
				break;

			// Comments
			case 'comments':
				$options = array(
					'highlander_comment_form_prompt' => array(
						'description'        => esc_html__( 'Greeting Text', 'jetpack' ),
						'type'               => 'string',
						'default'            => esc_html__( 'Leave a Reply', 'jetpack' ),
						'sanitize_callback'  => 'sanitize_text_field',
					),
					'jetpack_comment_form_color_scheme' => array(
						'description'        => esc_html__( "Color Scheme", 'jetpack' ),
						'type'               => 'string',
						'default'            => 'light',
						'enum'				 => array(
							'light'       => esc_html__( 'Light', 'jetpack' ),
							'dark'        => esc_html__( 'Dark', 'jetpack' ),
							'transparent' => esc_html__( 'Transparent', 'jetpack' ),
						),
						'validate_callback'  => __CLASS__ . '::validate_list_item',
					),
				);
				break;

			// Custom Content Types
			case 'custom-content-types':
				$options = array(
					'jetpack_portfolio' => array(
						'description'        => esc_html__( 'Enable or disable Jetpack portfolio post type.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'jetpack_portfolio_posts_per_page' => array(
						'description'        => esc_html__( 'Number of entries to show at most in Portfolio pages.', 'jetpack' ),
						'type'               => 'integer',
						'default'            => 10,
						'validate_callback'  => __CLASS__ . '::validate_posint',
					),
					'jetpack_testimonial' => array(
						'description'        => esc_html__( 'Enable or disable Jetpack testimonial post type.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'jetpack_testimonial_posts_per_page' => array(
						'description'        => esc_html__( 'Number of entries to show at most in Testimonial pages.', 'jetpack' ),
						'type'               => 'integer',
						'default'            => 10,
						'validate_callback'  => __CLASS__ . '::validate_posint',
					),
				);
				break;

			// Galleries
			case 'tiled-gallery':
				$options = array(
					'tiled_galleries' => array(
						'description'        => esc_html__( 'Display all your gallery pictures in a cool mosaic.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
				);
				break;

			// Gravatar Hovercards
			case 'gravatar-hovercards':
				$options = array(
					'gravatar_disable_hovercards' => array(
						'description'        => esc_html__( "View people's profiles when you mouse over their Gravatars", 'jetpack' ),
						'type'               => 'string',
						'default'            => 'enabled',
						// Not visible. This is used as the checkbox value.
						'enum'				 => array(
							'enabled' => esc_html__( 'Enabled', 'jetpack' ),
							'disabled' => esc_html__( 'Disabled', 'jetpack' ),
						),
						'validate_callback'  => __CLASS__ . '::validate_list_item',
					),
				);
				break;

			// Infinite Scroll
			case 'infinite-scroll':
				$options = array(
					'infinite_scroll' => array(
						'description'        => esc_html__( 'To infinity and beyond', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 1,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'infinite_scroll_google_analytics' => array(
						'description'        => esc_html__( 'Use Google Analytics with Infinite Scroll', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
				);
				break;

			// Likes
			case 'likes':
				$options = array(
					'wpl_default' => array(
						'description'        => esc_html__( 'WordPress.com Likes are', 'jetpack' ),
						'type'               => 'string',
						'default'            => 'on',
						'enum'				 => array(
							'on'  => esc_html__( 'On for all posts', 'jetpack' ),
							'off' => esc_html__( 'Turned on per post', 'jetpack' ),
						),
						'validate_callback'  => __CLASS__ . '::validate_list_item',
					),
					'social_notifications_like' => array(
						'description'        => esc_html__( 'Send email notification when someone likes a post', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 1,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
				);
				break;

			// Markdown
			case 'markdown':
				$options = array(
					'wpcom_publish_comments_with_markdown' => array(
						'description'        => esc_html__( 'Use Markdown for comments.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
				);
				break;

			// Mobile Theme
			case 'minileven':
				$options = array(
					'wp_mobile_excerpt' => array(
						'description'        => esc_html__( 'Excerpts', 'jetpack' ),
						'type'               => 'string',
						'default'            => 'disabled',
						'enum'				 => array(
							'enabled'  => esc_html__( 'Enable excerpts on front page and on archive pages', 'jetpack' ),
							'disabled' => esc_html__( 'Show full posts on front page and on archive pages', 'jetpack' ),
						),
						'validate_callback'  => __CLASS__ . '::validate_list_item',
					),
					'wp_mobile_featured_images' => array(
						'description'        => esc_html__( 'Featured Images', 'jetpack' ),
						'type'               => 'string',
						'default'            => 'disabled',
						'enum'				 => array(
							'enabled' => esc_html__( 'Display featured images', 'jetpack' ),
							'disabled'  => esc_html__( 'Hide all featured images', 'jetpack' ),
						),
						'validate_callback'  => __CLASS__ . '::validate_list_item',
					),
					'wp_mobile_app_promos' => array(
						'description'        => esc_html__( 'Show a promo for the WordPress mobile apps in the footer of the mobile theme.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
				);
				break;

			// Monitor
			case 'monitor':
				$options = array(
					'monitor_receive_notifications' => array(
						'description'        => esc_html__( 'Receive Monitor Email Notifications.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
				);
				break;

			// Post by Email
			case 'post-by-email':
				$options = array(
					'post_by_email_address' => array(
						'description'       => esc_html__( 'Email Address', 'jetpack' ),
						'type'              => 'string',
						'default'           => '',
						'enum'              => array(
							'create'     => esc_html__( 'Create Post by Email address', 'jetpack' ),
							'regenerate' => esc_html__( 'Regenerate Post by Email address', 'jetpack' ),
							'delete'     => esc_html__( 'Delete Post by Email address', 'jetpack' ),
						),
						'validate_callback' => __CLASS__ . '::validate_list_item',
					),
				);
				break;

			// Protect
			case 'protect':
				$options = array(
					'jetpack_protect_key' => array(
						'description'        => esc_html__( 'Protect API key', 'jetpack' ),
						'type'               => 'string',
						'default'            => '',
						'validate_callback'  => __CLASS__ . '::validate_alphanum',
					),
					'jetpack_protect_global_whitelist' => array(
						'description'        => esc_html__( 'Protect global whitelist', 'jetpack' ),
						'type'               => 'string',
						'default'            => '',
						'validate_callback'  => __CLASS__ . '::validate_string',
						'sanitize_callback'  => 'esc_textarea',
					),
				);
				break;

			// Sharing
			case 'sharedaddy':
				$options = array(
					'sharing_services' => array(
						'description'        => esc_html__( 'Enabled Services and those hidden behind a button', 'jetpack' ),
						'type'               => 'array',
						'default'            => array(
							'visible' => array( 'twitter', 'facebook', 'google-plus-1' ),
							'hidden'  => array(),
						),
						'validate_callback'  => __CLASS__ . '::validate_services',
					),
					'button_style' => array(
						'description'       => esc_html__( 'Button Style', 'jetpack' ),
						'type'              => 'string',
						'default'           => 'icon',
						'enum'              => array(
							'icon-text' => esc_html__( 'Icon + text', 'jetpack' ),
							'icon'      => esc_html__( 'Icon only', 'jetpack' ),
							'text'      => esc_html__( 'Text only', 'jetpack' ),
							'official'  => esc_html__( 'Official buttons', 'jetpack' ),
						),
						'validate_callback' => __CLASS__ . '::validate_list_item',
					),
					'sharing_label' => array(
						'description'        => esc_html__( 'Sharing Label', 'jetpack' ),
						'type'               => 'string',
						'default'            => '',
						'validate_callback'  => __CLASS__ . '::validate_string',
						'sanitize_callback'  => 'esc_html',
					),
					'show' => array(
						'description'        => esc_html__( 'Views where buttons are shown', 'jetpack' ),
						'type'               => 'array',
						'default'            => array( 'post' ),
						'validate_callback'  => __CLASS__ . '::validate_sharing_show',
					),
					'jetpack-twitter-cards-site-tag' => array(
						'description'        => esc_html__( "The Twitter username of the owner of this site's domain.", 'jetpack' ),
						'type'               => 'string',
						'default'            => '',
						'validate_callback'  => __CLASS__ . '::validate_twitter_username',
						'sanitize_callback'  => 'esc_html',
					),
					'sharedaddy_disable_resources' => array(
						'description'        => esc_html__( 'Disable CSS and JS', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'custom' => array(
						'description'        => esc_html__( 'Custom sharing services added by user.', 'jetpack' ),
						'type'               => 'array',
						'default'            => array(
							'sharing_name' => '',
							'sharing_url'  => '',
							'sharing_icon' => '',
						),
						'validate_callback'  => __CLASS__ . '::validate_custom_service',
					),
					// Not an option, but an action that can be perfomed on the list of custom services passing the service ID.
					'sharing_delete_service' => array(
						'description'        => esc_html__( 'Delete custom sharing service.', 'jetpack' ),
						'type'               => 'string',
						'default'            => '',
						'validate_callback'  => __CLASS__ . '::validate_custom_service_id',
					),
				);
				break;

			// SSO
			case 'sso':
				$options = array(
					'jetpack_sso_require_two_step' => array(
						'description'        => esc_html__( 'Require Two-Step Authentication', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'jetpack_sso_match_by_email' => array(
						'description'        => esc_html__( 'Match by Email', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
				);
				break;

			// Site Icon
			case 'site-icon':
				$options = array(
					'site_icon_id' => array(
						'description'        => esc_html__( 'Site Icon ID', 'jetpack' ),
						'type'               => 'integer',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_posint',
					),
					'site_icon_url' => array(
						'description'        => esc_html__( 'Site Icon URL', 'jetpack' ),
						'type'               => 'string',
						'default'            => '',
						'sanitize_callback'  => 'esc_url',
					),
				);
				break;

			// Subscriptions
			case 'subscriptions':
				$options = array(
					'stb_enabled' => array(
						'description'        => esc_html__( "Show a <em>'follow blog'</em> option in the comment form", 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 1,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'stc_enabled' => array(
						'description'        => esc_html__( "Show a <em>'follow comments'</em> option in the comment form", 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 1,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
				);
				break;

			// Related Posts
			case 'related-posts':
				$options = array(
					'show_headline' => array(
						'description'        => esc_html__( 'Show a "Related" header to more clearly separate the related section from posts', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 1,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'show_thumbnails' => array(
						'description'        => esc_html__( 'Use a large and visually striking layout', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
				);
				break;

			// Spelling and Grammar - After the Deadline
			case 'after-the-deadline':
				$options = array(
					'onpublish' => array(
						'description'        => esc_html__( 'Proofread when a post or page is first published.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'onupdate' => array(
						'description'        => esc_html__( 'Proofread when a post or page is updated.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'Bias Language' => array(
						'description'        => esc_html__( 'Bias Language', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'Cliches' => array(
						'description'        => esc_html__( 'Clichés', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'Complex Expression' => array(
						'description'        => esc_html__( 'Complex Phrases', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'Diacritical Marks' => array(
						'description'        => esc_html__( 'Diacritical Marks', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'Double Negative' => array(
						'description'        => esc_html__( 'Double Negatives', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'Hidden Verbs' => array(
						'description'        => esc_html__( 'Hidden Verbs', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'Jargon Language' => array(
						'description'        => esc_html__( 'Jargon', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'Passive voice' => array(
						'description'        => esc_html__( 'Passive Voice', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'Phrases to Avoid' => array(
						'description'        => esc_html__( 'Phrases to Avoid', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'Redundant Expression' => array(
						'description'        => esc_html__( 'Redundant Phrases', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'guess_lang' => array(
						'description'        => esc_html__( 'Use automatically detected language to proofread posts and pages', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'ignored_phrases' => array(
						'description'        => esc_html__( 'Add Phrase to be ignored', 'jetpack' ),
						'type'               => 'string',
						'default'            => '',
						'sanitize_callback'  => 'esc_html',
					),
					'unignore_phrase' => array(
						'description'        => esc_html__( 'Remove Phrase from being ignored', 'jetpack' ),
						'type'               => 'string',
						'default'            => '',
						'sanitize_callback'  => 'esc_html',
					),
				);
				break;

			// Verification Tools
			case 'verification-tools':
				$options = array(
					'google' => array(
						'description'        => esc_html__( 'Google Search Console', 'jetpack' ),
						'type'               => 'string',
						'default'            => '',
						'validate_callback'  => __CLASS__ . '::validate_alphanum',
					),
					'bing' => array(
						'description'        => esc_html__( 'Bing Webmaster Center', 'jetpack' ),
						'type'               => 'string',
						'default'            => '',
						'validate_callback'  => __CLASS__ . '::validate_alphanum',
					),
					'pinterest' => array(
						'description'        => esc_html__( 'Pinterest Site Verification', 'jetpack' ),
						'type'               => 'string',
						'default'            => '',
						'validate_callback'  => __CLASS__ . '::validate_alphanum',
					),
				);
				break;

			// Stats
			/*
				Example:
				'admin_bar' => true
				'roles' => array ( 'administrator', 'editor' )
				'count_roles' => array ( 'editor' )
				'blog_id' => false
				'do_not_track' => true
				'hide_smile' => true
				'version' => '9'
			*/
			case 'stats':
				$options = array(
					'admin_bar' => array(
						'description'        => esc_html__( 'Put a chart showing 48 hours of views in the admin bar.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 1,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'roles' => array(
						'description'       => esc_html__( 'Select the roles that will be able to view stats reports.', 'jetpack' ),
						'type'              => 'array',
						'default'           => array( 'administrator' ),
						'validate_callback' => __CLASS__ . '::validate_stats_roles',
						'sanitize_callback' => __CLASS__ . '::sanitize_stats_allowed_roles',
					),
					'count_roles' => array(
						'description'       => esc_html__( 'Count the page views of registered users who are logged in.', 'jetpack' ),
						'type'              => 'array',
						'default'           => array( 'administrator' ),
						'validate_callback' => __CLASS__ . '::validate_stats_roles',
					),
					'blog_id' => array(
						'description'        => esc_html__( 'Blog ID.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 0,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'do_not_track' => array(
						'description'        => esc_html__( 'Do not track.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 1,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'hide_smile' => array(
						'description'        => esc_html__( 'Hide the stats smiley face image.', 'jetpack' ),
						'type'               => 'boolean',
						'default'            => 1,
						'validate_callback'  => __CLASS__ . '::validate_boolean',
					),
					'version' => array(
						'description'        => esc_html__( 'Version.', 'jetpack' ),
						'type'               => 'integer',
						'default'            => 9,
						'validate_callback'  => __CLASS__ . '::validate_posint',
					),
				);
				break;
		}

		return $options;
	}

	/**
	 * Validates that the parameter is either a pure boolean or a numeric string that can be mapped to a boolean.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool
	 */
	public static function validate_boolean( $value, $request, $param ) {
		if ( ! is_bool( $value ) && ! ( ( ctype_digit( $value ) || is_numeric( $value ) ) && in_array( $value, array( 0, 1 ) ) ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be true, false, 0 or 1.', 'jetpack' ), $param ) );
		}
		return true;
	}

	/**
	 * Validates that the parameter is a positive integer.
	 *
	 * @since 4.3.0
	 *
	 * @param int $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
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
	 * @since 4.3.0
	 *
	 * @param string $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool
	 */
	public static function validate_list_item( $value = '', $request, $param ) {
		$attributes = $request->get_attributes();
		if ( ! isset( $attributes['args'][ $param ] ) || ! is_array( $attributes['args'][ $param ] ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s not recognized', 'jetpack' ), $param ) );
		}
		$args = $attributes['args'][ $param ];
		if ( ! empty( $args['enum'] ) ) {

			// If it's an associative array, use the keys to check that the value is among those admitted.
			$enum = ( count( array_filter( array_keys( $args['enum'] ), 'is_string' ) ) > 0 ) ? array_keys( $args['enum'] ) : $args['enum'];
			if ( ! in_array( $value, $enum ) ) {
				return new WP_Error( 'invalid_param_value', sprintf(
					/* Translators: first variable is the parameter passed to endpoint that holds the list item, the second is a list of admitted values. */
					esc_html__( '%1$s must be one of %2$s', 'jetpack' ), $param, implode( ', ', $enum )
				) );
			}
		}
		return true;
	}

	/**
	 * Validates that the parameter belongs to a list of admitted values.
	 *
	 * @since 4.3.0
	 *
	 * @param string $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool
	 */
	public static function validate_module_list( $value = '', $request, $param ) {
		if ( ! is_array( $value ) ) {
			return new WP_Error( 'invalid_param_value', sprintf( esc_html__( '%s must be an array', 'jetpack' ), $param ) );
		}

		$modules = Jetpack::get_available_modules();

		if ( count( array_intersect( $value, $modules ) ) != count( $value ) ) {
			return new WP_Error( 'invalid_param_value', sprintf( esc_html__( '%s must be a list of valid modules', 'jetpack' ), $param ) );
		}

		return true;
	}

	/**
	 * Validates that the parameter is an alphanumeric or empty string (to be able to clear the field).
	 *
	 * @since 4.3.0
	 *
	 * @param string $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool
	 */
	public static function validate_alphanum( $value = '', $request, $param ) {
		if ( ! empty( $value ) && ( ! is_string( $value ) || ! preg_match( '/[a-z0-9]+/i', $value ) ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be an alphanumeric string.', 'jetpack' ), $param ) );
		}
		return true;
	}

	/**
	 * Validates that the parameter is among the roles allowed for Stats.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool
	 */
	public static function validate_stats_roles( $value, $request, $param ) {
		if ( ! empty( $value ) && ! array_intersect( self::$stats_roles, $value ) ) {
			return new WP_Error( 'invalid_param', sprintf(
				/* Translators: first variable is the name of a parameter passed to endpoint holding the role that will be checked, the second is a list of roles allowed to see stats. The parameter is checked against this list. */
				esc_html__( '%1$s must be %2$s.', 'jetpack' ), $param, join( ', ', self::$stats_roles )
			) );
		}
		return true;
	}

	/**
	 * Validates that the parameter is among the views where the Sharing can be displayed.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool
	 */
	public static function validate_sharing_show( $value, $request, $param ) {
		$views = array( 'index', 'post', 'page', 'attachment', 'jetpack-portfolio' );
		if ( ! array_intersect( $views, $value ) ) {
			return new WP_Error( 'invalid_param', sprintf(
				/* Translators: first variable is the name of a parameter passed to endpoint holding the post type where Sharing will be displayed, the second is a list of post types where Sharing can be displayed */
				esc_html__( '%1$s must be %2$s.', 'jetpack' ), $param, join( ', ', $views )
			) );
		}
		return true;
	}

	/**
	 * Validates that the parameter is among the views where the Sharing can be displayed.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool $value {
	 *     Value to check received by request.
	 *
	 *     @type array $visible List of slug of services to share to that are displayed directly in the page.
	 *     @type array $hidden  List of slug of services to share to that are concealed in a folding menu.
	 * }
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool
	 */
	public static function validate_services( $value, $request, $param ) {
		if ( ! is_array( $value ) || ! isset( $value['visible'] ) || ! isset( $value['hidden'] ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be an array with visible and hidden items.', 'jetpack' ), $param ) );
		}

		// Allow to clear everything.
		if ( empty( $value['visible'] ) && empty( $value['hidden'] ) ) {
			return true;
		}

		if ( ! class_exists( 'Sharing_Service' ) && ! @include( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Failed loading required dependency Sharing_Service.', 'jetpack' ) );
		}
		$sharer = new Sharing_Service();
		$services = array_keys( $sharer->get_all_services() );

		if (
			( ! empty( $value['visible'] ) && ! array_intersect( $value['visible'], $services ) )
			||
			( ! empty( $value['hidden'] ) && ! array_intersect( $value['hidden'], $services ) ) )
		{
			return new WP_Error( 'invalid_param', sprintf(
				/* Translators: placeholder 1 is a parameter holding the services passed to endpoint, placeholder 2 is a list of all Jetpack Sharing services */
				esc_html__( '%1$s visible and hidden items must be a list of %2$s.', 'jetpack' ), $param, join( ', ', $services )
			) );
		}
		return true;
	}

	/**
	 * Validates that the parameter has enough information to build a custom sharing button.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool
	 */
	public static function validate_custom_service( $value, $request, $param ) {
		if ( ! is_array( $value ) || ! isset( $value['sharing_name'] ) || ! isset( $value['sharing_url'] ) || ! isset( $value['sharing_icon'] ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be an array with sharing name, url and icon.', 'jetpack' ), $param ) );
		}

		// Allow to clear everything.
		if ( empty( $value['sharing_name'] ) && empty( $value['sharing_url'] ) && empty( $value['sharing_icon'] ) ) {
			return true;
		}

		if ( ! class_exists( 'Sharing_Service' ) && ! @include( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Failed loading required dependency Sharing_Service.', 'jetpack' ) );
		}

		if ( ( ! empty( $value['sharing_name'] ) && ! is_string( $value['sharing_name'] ) )
		|| ( ! empty( $value['sharing_url'] ) && ! is_string( $value['sharing_url'] ) )
		|| ( ! empty( $value['sharing_icon'] ) && ! is_string( $value['sharing_icon'] ) ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s needs sharing name, url and icon.', 'jetpack' ), $param ) );
		}
		return true;
	}

	/**
	 * Validates that the parameter is a custom sharing service ID like 'custom-1461976264'.
	 *
	 * @since 4.3.0
	 *
	 * @param string $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool
	 */
	public static function validate_custom_service_id( $value = '', $request, $param ) {
		if ( ! empty( $value ) && ( ! is_string( $value ) || ! preg_match( '/custom\-[0-1]+/i', $value ) ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( "%s must be a string prefixed with 'custom-' and followed by a numeric ID.", 'jetpack' ), $param ) );
		}

		if ( ! class_exists( 'Sharing_Service' ) && ! @include( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Failed loading required dependency Sharing_Service.', 'jetpack' ) );
		}
		$sharer = new Sharing_Service();
		$services = array_keys( $sharer->get_all_services() );

		if ( ! empty( $value ) && ! in_array( $value, $services ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s is not a registered custom sharing service.', 'jetpack' ), $param ) );
		}

		return true;
	}

	/**
	 * Validates that the parameter is a Twitter username or empty string (to be able to clear the field).
	 *
	 * @since 4.3.0
	 *
	 * @param string $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool
	 */
	public static function validate_twitter_username( $value = '', $request, $param ) {
		if ( ! empty( $value ) && ( ! is_string( $value ) || ! preg_match( '/^@?\w{1,15}$/i', $value ) ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be a Twitter username.', 'jetpack' ), $param ) );
		}
		return true;
	}

	/**
	 * Validates that the parameter is a string.
	 *
	 * @since 4.3.0
	 *
	 * @param string $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool
	 */
	public static function validate_string( $value = '', $request, $param ) {
		if ( ! is_string( $value ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be a string.', 'jetpack' ), $param ) );
		}
		return true;
	}

	/**
	 * If for some reason the roles allowed to see Stats are empty (for example, user tampering with checkboxes),
	 * return an array with only 'administrator' as the allowed role and save it for 'roles' option.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool $value Value to check.
	 *
	 * @return bool
	 */
	public static function sanitize_stats_allowed_roles( $value ) {
		if ( empty( $value ) ) {
			return array( 'administrator' );
		}
		return $value;
	}

	/**
	 * Get the currently accessed route and return the module slug in it.
	 *
	 * @since 4.3.0
	 *
	 * @param string $route Regular expression for the endpoint with the module slug to return.
	 *
	 * @return array
	 */
	public static function get_module_requested( $route = '/module/(?P<slug>[a-z\-]+)' ) {

		if ( empty( $GLOBALS['wp']->query_vars['rest_route'] ) ) {
			return '';
		}

		preg_match( "#$route#", $GLOBALS['wp']->query_vars['rest_route'], $module );

		if ( empty( $module['slug'] ) ) {
			return '';
		}

		return $module['slug'];
	}

	/**
	 * Adds extra information for modules.
	 *
	 * @since 4.3.0
	 *
	 * @param string      $modules Can be a single module or a list of modules.
	 * @param null|string $slug    Slug of the module in the first parameter.
	 *
	 * @return array
	 */
	public static function prepare_modules_for_response( $modules = '', $slug = null ) {
		if ( get_option( 'permalink_structure' ) ) {
			$sitemap_url = home_url( '/sitemap.xml' );
			$news_sitemap_url = home_url( '/news-sitemap.xml' );
		} else {
			$sitemap_url = home_url( '/?jetpack-sitemap=true' );
			$news_sitemap_url = home_url( '/?jetpack-news-sitemap=true' );
		}
		/** This filter is documented in modules/sitemaps/sitemaps.php */
		$sitemap_url = apply_filters( 'jetpack_sitemap_location', $sitemap_url );
		/** This filter is documented in modules/sitemaps/sitemaps.php */
		$news_sitemap_url = apply_filters( 'jetpack_news_sitemap_location', $news_sitemap_url );

		if ( is_null( $slug ) && isset( $modules['sitemaps'] ) ) {
			// Is a list of modules
			$modules['sitemaps']['extra']['sitemap_url'] = $sitemap_url;
			$modules['sitemaps']['extra']['news_sitemap_url'] = $news_sitemap_url;
		} elseif ( 'sitemaps' == $slug ) {
			// It's a single module
			$modules['extra']['sitemap_url'] = $sitemap_url;
			$modules['extra']['news_sitemap_url'] = $news_sitemap_url;
		}
		return $modules;
	}

	/**
	 * Remove 'validate_callback' item from options available for module.
	 * Fetch current option value and add to array of module options.
	 * Prepare values of module options that need special handling, like those saved in wpcom.
	 *
	 * @since 4.3.0
	 *
	 * @param string $module Module slug.
	 * @return array
	 */
	public static function prepare_options_for_response( $module = '' ) {
		$options = self::get_module_available_options( $module );

		if ( ! is_array( $options ) || empty( $options ) ) {
			return $options;
		}

		foreach ( $options as $key => $value ) {

			if ( isset( $options[ $key ]['validate_callback'] ) ) {
				unset( $options[ $key ]['validate_callback'] );
			}

			$default_value = isset( $options[ $key ]['default'] ) ? $options[ $key ]['default'] : '';

			$current_value = get_option( $key, $default_value );

			$options[ $key ]['current_value'] = self::cast_value( $current_value, $options[ $key ] );
		}

		// Some modules need special treatment.
		switch ( $module ) {

			case 'monitor':
				// Status of user notifications
				$options['monitor_receive_notifications']['current_value'] = self::cast_value( self::get_remote_value( 'monitor', 'monitor_receive_notifications' ), $options['monitor_receive_notifications'] );
				break;

			case 'post-by-email':
				// Email address
				$options['post_by_email_address']['current_value'] = self::cast_value( self::get_remote_value( 'post-by-email', 'post_by_email_address' ), $options['post_by_email_address'] );
				break;

			case 'protect':
				// Protect
				$options['jetpack_protect_key']['current_value'] = get_site_option( 'jetpack_protect_key', false );
				if ( ! function_exists( 'jetpack_protect_format_whitelist' ) ) {
					@include( JETPACK__PLUGIN_DIR . 'modules/protect/shared-functions.php' );
				}
				$options['jetpack_protect_global_whitelist']['current_value'] = jetpack_protect_format_whitelist();
				break;

			case 'related-posts':
				// It's local, but it must be broken apart since it's saved as an array.
				$options = self::split_options( $options, Jetpack_Options::get_option( 'relatedposts' ) );
				break;

			case 'verification-tools':
				// It's local, but it must be broken apart since it's saved as an array.
				$options = self::split_options( $options, get_option( 'verification_services_codes' ) );
				break;

			case 'sharedaddy':
				// It's local, but it must be broken apart since it's saved as an array.
				if ( ! class_exists( 'Sharing_Service' ) && ! @include( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
					break;
				}
				$sharer = new Sharing_Service();
				$options = self::split_options( $options, $sharer->get_global_options() );
				$options['sharing_services']['current_value'] = $sharer->get_blog_services();
				break;

			case 'site-icon':
				// Return site icon ID and URL to make it more complete.
				$options['site_icon_id']['current_value'] = Jetpack_Options::get_option( 'site_icon_id' );
				if ( ! function_exists( 'jetpack_site_icon_url' ) ) {
					@include( JETPACK__PLUGIN_DIR . 'modules/site-icon/site-icon-functions.php' );
				}
				$options['site_icon_url']['current_value'] = jetpack_site_icon_url();
				break;

			case 'after-the-deadline':
				if ( ! function_exists( 'AtD_get_options' ) ) {
					@include( JETPACK__PLUGIN_DIR . 'modules/after-the-deadline.php' );
				}
				$atd_options = array_merge( AtD_get_options( get_current_user_id(), 'AtD_options' ), AtD_get_options( get_current_user_id(), 'AtD_check_when' ) );
				unset( $atd_options['name'] );
				foreach ( $atd_options as $key => $value ) {
					$options[ $key ]['current_value'] = self::cast_value( $value, $options[ $key ] );
				}
				$atd_options = AtD_get_options( get_current_user_id(), 'AtD_guess_lang' );
				$options['guess_lang']['current_value'] = self::cast_value( isset( $atd_options['true'] ), $options[ 'guess_lang' ] );
				$options['ignored_phrases']['current_value'] = AtD_get_setting( get_current_user_id(), 'AtD_ignored_phrases' );
				unset( $options['unignore_phrase'] );
				break;

			case 'minileven':
				$options['wp_mobile_excerpt']['current_value'] =
					1 === intval( $options['wp_mobile_excerpt']['current_value'] ) ?
					'enabled' : 'disabled';

				$options['wp_mobile_featured_images']['current_value'] =
					1 === intval( $options['wp_mobile_featured_images']['current_value'] ) ?
					'enabled' : 'disabled';
				break;

			case 'stats':
				// It's local, but it must be broken apart since it's saved as an array.
				if ( ! function_exists( 'stats_get_options' ) ) {
					@include( JETPACK__PLUGIN_DIR . 'modules/stats.php' );
				}
				$options = self::split_options( $options, stats_get_options() );
				break;
		}

		return $options;
	}

	/**
	 * Splits module options saved as arrays like relatedposts or verification_services_codes into separate options to be returned in the response.
	 *
	 * @since 4.3.0
	 *
	 * @param array  $separate_options Array of options admitted by the module.
	 * @param array  $grouped_options Option saved as array to be splitted.
	 * @param string $prefix Optional prefix for the separate option keys.
	 *
	 * @return array
	 */
	public static function split_options( $separate_options, $grouped_options, $prefix = '' ) {
		if ( is_array( $grouped_options ) ) {
			foreach ( $grouped_options as $key => $value ) {
				$option_key = $prefix . $key;
				if ( isset( $separate_options[ $option_key ] ) ) {
					$separate_options[ $option_key ]['current_value'] = self::cast_value( $grouped_options[ $key ], $separate_options[ $option_key ] );
				}
			}
		}
		return $separate_options;
	}

	/**
	 * Perform a casting to the value specified in the option definition.
	 *
	 * @since 4.3.0
	 *
	 * @param mixed $value Value to cast to the proper type.
	 * @param array $definition Type to cast the value to.
	 *
	 * @return bool|float|int|string
	 */
	public static function cast_value( $value, $definition ) {
		if ( $value === 'NULL' ) {
			return null;
		}

		if ( isset( $definition['type'] ) ) {
			switch ( $definition['type'] ) {
				case 'boolean':
					if ( 'true' === $value ) {
						return true;
					} elseif ( 'false' === $value ) {
						return false;
					}
					return (bool) $value;
					break;

				case 'integer':
					return (int) $value;
					break;

				case 'float':
					return (float) $value;
					break;

				case 'string':
					return (string) $value;
					break;
			}
		}
		return $value;
	}

	/**
	 * Get a value not saved locally.
	 *
	 * @since 4.3.0
	 *
	 * @param string $module Module slug.
	 * @param string $option Option name.
	 *
	 * @return bool Whether user is receiving notifications or not.
	 */
	public static function get_remote_value( $module, $option ) {

		if ( in_array( $module, array( 'post-by-email' ), true ) ) {
			$option .= get_current_user_id();
		}

		// If option doesn't exist, 'does_not_exist' will be returned.
		$value = get_option( $option, 'does_not_exist' );

		// If option exists, just return it.
		if ( 'does_not_exist' !== $value ) {
			return $value;
		}

		// Only check a remote option if Jetpack is connected.
		if ( ! Jetpack::is_active() ) {
			return false;
		}

		// If the module is inactive, load the class to use the method.
		if ( ! did_action( 'jetpack_module_loaded_' . $module ) ) {
			// Class can't be found so do nothing.
			if ( ! @include( Jetpack::get_module_path( $module ) ) ) {
				return false;
			}
		}

		// Do what is necessary for each module.
		switch ( $module ) {
			case 'monitor':
				$monitor = new Jetpack_Monitor();
				$value = $monitor->user_receives_notifications( false );
				break;

			case 'post-by-email':
				$post_by_email = new Jetpack_Post_By_Email();
				$value = $post_by_email->get_post_by_email_address();
				if ( $value === null ) {
					$value = 'NULL'; // sentinel value so it actually gets set
				}
				break;
		}

		// Normalize value to boolean.
		if ( is_wp_error( $value ) || is_null( $value ) ) {
			$value = false;
		}

		// Save option to use it next time.
		update_option( $option, $value );

		return $value;
	}

	/**
	 * Get number of plugin updates available.
	 *
	 * @since 4.3.0
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
	 * Returns a list of all plugins in the site.
	 *
	 * @since 4.2.0
	 * @uses get_plugins()
	 *
	 * @return array
	 */
	private static function core_get_plugins() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		/** This filter is documented in wp-admin/includes/class-wp-plugins-list-table.php */
		$plugins = apply_filters( 'all_plugins', get_plugins() );

		if ( is_array( $plugins ) && ! empty( $plugins ) ) {
			foreach ( $plugins as $plugin_slug => $plugin_data ) {
				$plugins[ $plugin_slug ]['active'] = self::core_is_plugin_active( $plugin_slug );
			}
			return $plugins;
		}

		return array();
	}

	/**
	 * Checks if the queried plugin is active.
	 *
	 * @since 4.2.0
	 * @uses is_plugin_active()
	 *
	 * @return bool
	 */
	private static function core_is_plugin_active( $plugin ) {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		return is_plugin_active( $plugin );
	}

	/**
	 * Get plugins data in site.
	 *
	 * @since 4.2.0
	 *
	 * @return WP_REST_Response|WP_Error List of plugins in the site. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function get_plugins() {
		$plugins = self::core_get_plugins();

		if ( ! empty( $plugins ) ) {
			return rest_ensure_response( $plugins );
		}

		return new WP_Error( 'not_found', esc_html__( 'Unable to list plugins.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Get data about the queried plugin. Currently it only returns whether the plugin is active or not.
	 *
	 * @since 4.2.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Plugin slug with the syntax 'plugin-directory/plugin-main-file.php'.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function get_plugin( $data ) {

		$plugins = self::core_get_plugins();

		if ( empty( $plugins ) ) {
			return new WP_Error( 'no_plugins_found', esc_html__( 'This site has no plugins.', 'jetpack' ), array( 'status' => 404 ) );
		}

		$plugin = stripslashes( $data['plugin'] );

		if ( ! in_array( $plugin, array_keys( $plugins ) ) ) {
			return new WP_Error( 'plugin_not_found', esc_html( sprintf( __( 'Plugin %s is not installed.', 'jetpack' ), $plugin ) ), array( 'status' => 404 ) );
		}

		$plugin_data = $plugins[ $plugin ];

		$plugin_data['active'] = self::core_is_plugin_active( $plugin );

		return rest_ensure_response( array(
			'code'    => 'success',
			'message' => esc_html__( 'Plugin found.', 'jetpack' ),
			'data'    => $plugin_data
		) );
	}

} // class end
