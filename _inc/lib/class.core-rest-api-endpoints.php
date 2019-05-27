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
// Load API endpoints that are synced with WP.com
// Each of these is a class that will register its own routes on 'rest_api_init'.
require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/load-wpcom-endpoints.php';

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
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-site-endpoints.php';
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-widgets-endpoints.php';

		self::$user_permissions_error_msg = esc_html__(
			'You do not have the correct user permissions to perform this action.
			Please contact your site admin if you think this is a mistake.',
			'jetpack'
		);

		self::$stats_roles = array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' );

		Jetpack::load_xml_rpc_client();
		$ixr_client = new Jetpack_IXR_Client( array( 'user_id' => get_current_user_id() ) );
		$core_api_endpoint = new Jetpack_Core_API_Data( $ixr_client );
		$module_list_endpoint = new Jetpack_Core_API_Module_List_Endpoint();
		$module_data_endpoint = new Jetpack_Core_API_Module_Data_Endpoint();
		$module_toggle_endpoint = new Jetpack_Core_API_Module_Toggle_Endpoint( new Jetpack_IXR_Client() );
		$site_endpoint = new Jetpack_Core_API_Site_Endpoint();
		$widget_endpoint = new Jetpack_Core_API_Widget_Endpoint();

		register_rest_route( 'jetpack/v4', 'plans', array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => __CLASS__ . '::get_plans',
			'permission_callback' => __CLASS__ . '::connect_url_permission_callback',

		) );

		register_rest_route( 'jetpack/v4', '/jitm', array(
			'methods'  => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_jitm_message',
		) );

		register_rest_route( 'jetpack/v4', '/jitm', array(
			'methods'  => WP_REST_Server::CREATABLE,
			'callback' => __CLASS__ . '::delete_jitm_message'
		) );

		// Register a site
		register_rest_route( 'jetpack/v4', '/verify_registration', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::verify_registration',
		) );

		// Authorize a remote user
		register_rest_route( 'jetpack/v4', '/remote_authorize', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::remote_authorize',
		) );

		// Get current connection status of Jetpack
		register_rest_route( 'jetpack/v4', '/connection', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::jetpack_connection_status',
		) );

		// Test current connection status of Jetpack
		register_rest_route( 'jetpack/v4', '/connection/test', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::jetpack_connection_test',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Endpoint specific for privileged servers to request detailed debug information.
		register_rest_route( 'jetpack/v4', '/connection/test-wpcom/', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::jetpack_connection_test_for_external',
			'permission_callback' => __CLASS__ . '::view_jetpack_connection_test_check',
		) );

		register_rest_route( 'jetpack/v4', '/rewind', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_rewind_data',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
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

		// Set the connection owner
		register_rest_route( 'jetpack/v4', '/connection/owner', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::set_connection_owner',
			'permission_callback' => __CLASS__ . '::set_connection_owner_permission_callback',
		) );

		// Current user: get or set tracking settings.
		register_rest_route( 'jetpack/v4', '/tracking/settings', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_user_tracking_settings',
				'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
			),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::update_user_tracking_settings',
				'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
				'args'                => array(
					'tracks_opt_out' => array( 'type' => 'boolean' ),
				),
			),
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
			'permission_callback' => __CLASS__ . '::unlink_user_permission_callback',
		) );

		// Get current site data
		register_rest_route( 'jetpack/v4', '/site', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_site_data',
			'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
		) );

		// Get current site data
		register_rest_route( 'jetpack/v4', '/site/features', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array( $site_endpoint, 'get_features' ),
			'permission_callback' => array( $site_endpoint , 'can_request' ),
		) );

		// Get Activity Log data for this site.
		register_rest_route( 'jetpack/v4', '/site/activity', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::get_site_activity',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Confirm that a site in identity crisis should be in staging mode
		register_rest_route( 'jetpack/v4', '/identity-crisis/confirm-safe-mode', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::confirm_safe_mode',
			'permission_callback' => __CLASS__ . '::identity_crisis_mitigation_permission_check',
		) );

		// IDC resolve: create an entirely new shadow site for this URL.
		register_rest_route( 'jetpack/v4', '/identity-crisis/start-fresh', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::start_fresh_connection',
			'permission_callback' => __CLASS__ . '::identity_crisis_mitigation_permission_check',
		) );

		// Handles the request to migrate stats and subscribers during an identity crisis.
		register_rest_route( 'jetpack/v4', 'identity-crisis/migrate', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::migrate_stats_and_subscribers',
			'permissison_callback' => __CLASS__ . '::identity_crisis_mitigation_permission_check',
		) );

		// Return all modules
		register_rest_route( 'jetpack/v4', '/module/all', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array( $module_list_endpoint, 'process' ),
			'permission_callback' => array( $module_list_endpoint, 'can_request' ),
		) );

		// Activate many modules
		register_rest_route( 'jetpack/v4', '/module/all/active', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => array( $module_list_endpoint, 'process' ),
			'permission_callback' => array( $module_list_endpoint, 'can_request' ),
			'args' => array(
				'modules' => array(
					'default'           => '',
					'type'              => 'array',
					'items'             => array(
						'type'          => 'string',
					),
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
		) );

		// Return a single module and update it when needed
		register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array( $core_api_endpoint, 'process' ),
			'permission_callback' => array( $core_api_endpoint, 'can_request' ),
		) );

		// Activate and deactivate a module
		register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)/active', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => array( $module_toggle_endpoint, 'process' ),
			'permission_callback' => array( $module_toggle_endpoint, 'can_request' ),
			'args' => array(
				'active' => array(
					'default'           => true,
					'type'              => 'boolean',
					'required'          => true,
					'validate_callback' => __CLASS__ . '::validate_boolean',
				),
			)
		) );

		// Update a module
		register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => array( $core_api_endpoint, 'process' ),
			'permission_callback' => array( $core_api_endpoint, 'can_request' ),
			'args' => self::get_updateable_parameters( 'any' )
		) );

		// Get data for a specific module, i.e. Protect block count, WPCOM stats,
		// Akismet spam count, etc.
		register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)/data', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array( $module_data_endpoint, 'process' ),
			'permission_callback' => array( $module_data_endpoint, 'can_request' ),
			'args' => array(
				'range' => array(
					'default'           => 'day',
					'type'              => 'string',
					'required'          => false,
					'validate_callback' => __CLASS__ . '::validate_string',
				),
			)
		) );

		// Check if the API key for a specific service is valid or not
		register_rest_route( 'jetpack/v4', '/module/(?P<service>[a-z\-]+)/key/check', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array( $module_data_endpoint, 'key_check' ),
			'permission_callback' => __CLASS__ . '::update_settings_permission_check',
			'sanitize_callback' => 'sanitize_text_field',
		) );

		register_rest_route( 'jetpack/v4', '/module/(?P<service>[a-z\-]+)/key/check', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => array( $module_data_endpoint, 'key_check' ),
			'permission_callback' => __CLASS__ . '::update_settings_permission_check',
			'sanitize_callback' => 'sanitize_text_field',
			'args' => array(
				'api_key' => array(
					'default'           => '',
					'type'              => 'string',
					'validate_callback' => __CLASS__ . '::validate_alphanum',
				),
			)
		) );

		// Update any Jetpack module option or setting
		register_rest_route( 'jetpack/v4', '/settings', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => array( $core_api_endpoint, 'process' ),
			'permission_callback' => array( $core_api_endpoint, 'can_request' ),
			'args' => self::get_updateable_parameters( 'any' )
		) );

		// Update a module
		register_rest_route( 'jetpack/v4', '/settings/(?P<slug>[a-z\-]+)', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => array( $core_api_endpoint, 'process' ),
			'permission_callback' => array( $core_api_endpoint, 'can_request' ),
			'args' => self::get_updateable_parameters()
		) );

		// Return all module settings
		register_rest_route( 'jetpack/v4', '/settings/', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array( $core_api_endpoint, 'process' ),
			'permission_callback' => array( $core_api_endpoint, 'can_request' ),
		) );

		// Reset all Jetpack options
		register_rest_route( 'jetpack/v4', '/options/(?P<options>[a-z\-]+)', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::reset_jetpack_options',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
		) );

		// Return current Jumpstart status
		register_rest_route( 'jetpack/v4', '/jumpstart', array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => __CLASS__ . '::jumpstart_status',
			'permission_callback' => __CLASS__ . '::update_settings_permission_check',
		) );

		// Update Jumpstart
		register_rest_route( 'jetpack/v4', '/jumpstart', array(
			'methods'             => WP_REST_Server::EDITABLE,
			'callback'            => __CLASS__ . '::jumpstart_toggle',
			'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
			'args'                => array(
				'active' => array(
					'required'          => true,
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

		// Widgets: get information about a widget that supports it.
		register_rest_route( 'jetpack/v4', '/widgets/(?P<id>[0-9a-z\-_]+)', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array( $widget_endpoint, 'process' ),
			'permission_callback' => array( $widget_endpoint, 'can_request' ),
		) );

		// Site Verify: check if the site is verified, and a get verification token if not
		register_rest_route( 'jetpack/v4', '/verify-site/(?P<service>[a-z\-_]+)', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::is_site_verified_and_token',
			'permission_callback' => __CLASS__ . '::update_settings_permission_check',
		) );

		register_rest_route( 'jetpack/v4', '/verify-site/(?P<service>[a-z\-_]+)/(?<keyring_id>[0-9]+)', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => __CLASS__ . '::is_site_verified_and_token',
			'permission_callback' => __CLASS__ . '::update_settings_permission_check',
		) );

		// Site Verify: tell a service to verify the site
		register_rest_route( 'jetpack/v4', '/verify-site/(?P<service>[a-z\-_]+)', array(
			'methods' => WP_REST_Server::EDITABLE,
			'callback' => __CLASS__ . '::verify_site',
			'permission_callback' => __CLASS__ . '::update_settings_permission_check',
			'args' => array(
				'keyring_id' => array(
					'required'          => true,
					'type'              => 'integer',
					'validate_callback' => __CLASS__  . '::validate_posint',
				),
			)
		) );

		// Get and set API keys.
		// Note: permission_callback intentionally omitted from the GET method.
		// Map block requires open access to API keys on the front end.
		register_rest_route(
			'jetpack/v4',
			'/service-api-keys/(?P<service>[a-z\-_]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_service_api_key',
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => __CLASS__ . '::update_service_api_key',
					'permission_callback' => array( 'WPCOM_REST_API_V2_Endpoint_Service_API_Keys','edit_others_posts_check' ),
					'args'                => array(
						'service_api_key' => array(
							'required' => true,
							'type'     => 'text',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => __CLASS__ . '::delete_service_api_key',
					'permission_callback' => array( 'WPCOM_REST_API_V2_Endpoint_Service_API_Keys','edit_others_posts_check' ),
				),
			)
		);
	}

	public static function get_plans( $request ) {
		$request = Jetpack_Client::wpcom_json_api_request_as_user(
			'/plans?_locale=' . get_user_locale(),
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => Jetpack::current_user_ip( true ),
				),
			)
		);

		$body = wp_remote_retrieve_body( $request );
		if ( 200 === wp_remote_retrieve_response_code( $request ) ) {
			$data = $body;
		} else {
			// something went wrong so we'll just return the response without caching
			return $body;
		}

		return $data;
	}

	/**
	 * Asks for a jitm, unless they've been disabled, in which case it returns an empty array
	 *
	 * @param $request WP_REST_Request
	 *
	 * @return array An array of jitms
	 */
	public static function get_jitm_message( $request ) {
		require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-jitm.php' );

		$jitm = Jetpack_JITM::init();

		if ( ! $jitm ) {
			return array();
		}

		return $jitm->get_messages( $request['message_path'], urldecode_deep( $request['query'] ) );
	}

	/**
	 * Dismisses a jitm
	 * @param $request WP_REST_Request The request
	 *
	 * @return bool Always True
	 */
	public static function delete_jitm_message( $request ) {
		require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-jitm.php' );

		$jitm = Jetpack_JITM::init();

		if ( ! $jitm ) {
			return true;
		}

		return $jitm->dismiss( $request['id'], $request['feature_class'] );
	}

	/**
	 * Handles verification that a site is registered
	 *
	 * @since 5.4.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array|wp-error
	 */
	public static function verify_registration( $request ) {
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-xmlrpc-server.php';
		$xmlrpc_server = new Jetpack_XMLRPC_Server();
		$result = $xmlrpc_server->verify_registration( array( $request['secret_1'], $request['state'] ) );

		if ( is_a( $result, 'IXR_Error' ) ) {
			$result = new WP_Error( $result->code, $result->message );
		}

		return $result;
	}


	/**
	 * Checks if this site has been verified using a service - only 'google' supported at present - and a specfic
	 *  keyring to use to get the token if it is not
	 *
	 * Returns 'verified' = true/false, and a token if 'verified' is false and site is ready for verification
	 *
	 * @since 6.6.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array|wp-error
	 */
	public static function is_site_verified_and_token( $request ) {
		/**
		 * Return an error if the site uses a Maintenance / Coming Soon plugin
		 * and if the plugin is configured to make the site private.
		 *
		 * We currently handle the following plugins:
		 * - https://github.com/mojoness/mojo-marketplace-wp-plugin (used by bluehost)
		 * - https://wordpress.org/plugins/mojo-under-construction
		 * - https://wordpress.org/plugins/under-construction-page
		 * - https://wordpress.org/plugins/ultimate-under-construction
		 * - https://wordpress.org/plugins/coming-soon
		 *
		 * You can handle this in your own plugin thanks to the `jetpack_is_under_construction_plugin` filter.
		 * If the filter returns true, we will consider the site as under construction.
		 */
		$mm_coming_soon                       = get_option( 'mm_coming_soon', null );
		$under_construction_activation_status = get_option( 'underConstructionActivationStatus', null );
		$ucp_options                          = get_option( 'ucp_options', array() );
		$uuc_settings                         = get_option( 'uuc_settings', array() );
		$csp4                                 = get_option( 'seed_csp4_settings_content', array() );
		if (
			( Jetpack::is_plugin_active( 'mojo-marketplace-wp-plugin/mojo-marketplace.php' ) && 'true' === $mm_coming_soon )
			|| Jetpack::is_plugin_active( 'mojo-under-construction/mojo-contruction.php' ) && 1 == $under_construction_activation_status // WPCS: loose comparison ok.
			|| ( Jetpack::is_plugin_active( 'under-construction-page/under-construction.php' ) && isset( $ucp_options['status'] ) && 1 == $ucp_options['status'] ) // WPCS: loose comparison ok.
			|| ( Jetpack::is_plugin_active( 'ultimate-under-construction/ultimate-under-construction.php' ) && isset( $uuc_settings['enable'] ) && 1 == $uuc_settings['enable'] ) // WPCS: loose comparison ok.
			|| ( Jetpack::is_plugin_active( 'coming-soon/coming-soon.php' ) &&  isset( $csp4['status'] ) && ( 1 == $csp4['status'] || 2 == $csp4['status'] ) ) // WPCS: loose comparison ok.
			/**
			 * Allow plugins to mark a site as "under construction".
			 *
			 * @since 6.7.0
			 *
			 * @param false bool Is the site under construction? Default to false.
			 */
			|| true === apply_filters( 'jetpack_is_under_construction_plugin', false )
		) {
			return new WP_Error( 'forbidden', __( 'Site is under construction and cannot be verified', 'jetpack' ) );
		}

		Jetpack::load_xml_rpc_client();
 		$xml = new Jetpack_IXR_Client( array(
 			'user_id' => get_current_user_id(),
		) );

		$args = array(
			'user_id' => get_current_user_id(),
			'service' => $request[ 'service' ],
		);

		if ( isset( $request[ 'keyring_id' ] ) ) {
			$args[ 'keyring_id' ] = $request[ 'keyring_id' ];
		}

		$xml->query( 'jetpack.isSiteVerified', $args );

		if ( $xml->isError() ) {
			return new WP_Error( 'error_checking_if_site_verified_google', sprintf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() ) );
		} else {
			return $xml->getResponse();
		}
	}



	public static function verify_site( $request ) {
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id(),
		) );

		$params = $request->get_json_params();

		$xml->query( 'jetpack.verifySite', array(
				'user_id' => get_current_user_id(),
				'service' => $request[ 'service' ],
				'keyring_id' => $params[ 'keyring_id' ],
			)
		);

		if ( $xml->isError() ) {
			return new WP_Error( 'error_verifying_site_google', sprintf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() ) );
		} else {
			$response = $xml->getResponse();

			if ( ! empty( $response['errors'] ) ) {
				$error = new WP_Error;
				$error->errors = $response['errors'];
				return $error;
			}

			return $response;
		}
	}

	/**
	 * Handles verification that a site is registered
	 *
	 * @since 5.4.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array|wp-error
	 */
	 public static function remote_authorize( $request ) {
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-xmlrpc-server.php';
		$xmlrpc_server = new Jetpack_XMLRPC_Server();
		$result = $xmlrpc_server->remote_authorize( $request );

		if ( is_a( $result, 'IXR_Error' ) ) {
			$result = new WP_Error( $result->code, $result->message );
		}

		return $result;
	 }

	/**
	 * Handles dismissing of Jetpack Notices
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array|wp-error
	 */
	public static function dismiss_notice( $request ) {
		$notice = $request['notice'];

		if ( ! isset( $request['dismissed'] ) || $request['dismissed'] !== true ) {
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

		return new WP_Error( 'invalid_user_permission_user_connection_data', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Check that user has permission to change the master user.
	 *
	 * @since 6.2.0
	 *
	 * @return bool|WP_Error True if user is able to change master user.
	 */
	public static function set_connection_owner_permission_callback() {
		if ( get_current_user_id() === Jetpack_Options::get_option( 'master_user' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_set_connection_owner', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that a user can use the /connection/user endpoint. Has to be a registered user and be currently linked.
	 *
	 * @since 4.3.0
	 *
	 * @uses Jetpack::is_user_connected();
	 *
	 * @return bool|WP_Error True if user is able to unlink.
	 */
	public static function unlink_user_permission_callback() {
		if ( current_user_can( 'jetpack_connect_user' ) && Jetpack::is_user_connected( get_current_user_id() ) ) {
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
	 * Verify that user can mitigate an identity crisis.
	 *
	 * @since 4.4.0
	 *
	 * @return bool Whether user has capability 'jetpack_disconnect'.
	 */
	public static function identity_crisis_mitigation_permission_check() {
		if ( current_user_can( 'jetpack_disconnect' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_identity_crisis', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that user can update Jetpack general settings.
	 *
	 * @since 4.3.0
	 *
	 * @return bool Whether user has the capability 'update_settings_permission_check'.
	 */
	public static function update_settings_permission_check() {
		if ( current_user_can( 'jetpack_configure_modules' ) ) {
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
		if ( current_user_can( 'jetpack_admin_page' ) && current_user_can( 'activate_plugins' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_activate_plugins', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
	}

	/**
	 * Verify that user can edit other's posts (Editors and Administrators).
	 *
	 * @return bool Whether user has the capability 'edit_others_posts'.
	 */
	public static function edit_others_posts_check() {
		if ( current_user_can( 'edit_others_posts' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_edit_others_posts', self::$user_permissions_error_msg, array( 'status' => self::rest_authorization_required_code() ) );
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
	 * Test connection status for this Jetpack site.
	 *
	 * @since 6.8.0
	 *
	 * @return array|WP_Error WP_Error returned if connection test does not succeed.
	 */
	public static function jetpack_connection_test() {
		jetpack_require_lib( 'debugger' );
		$cxntests = new Jetpack_Cxn_Tests();

		if ( $cxntests->pass() ) {
			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => __( 'All connection tests passed.', 'jetpack' ),
				)
			);
		} else {
			return $cxntests->output_fails_as_wp_error();
		}
	}

	/**
	 * Test connection permission check method.
	 *
	 * @since 7.1.0
	 *
	 * @return bool
	 */
	public static function view_jetpack_connection_test_check() {
		if ( ! isset( $_GET['signature'], $_GET['timestamp'], $_GET['url'] ) ) {
			return false;
		}
		$signature = base64_decode( $_GET['signature'] );

		$signature_data = wp_json_encode(
			array(
				'rest_route' => $_GET['rest_route'],
				'timestamp' => intval( $_GET['timestamp'] ),
				'url' => wp_unslash( $_GET['url'] ),
			)
		);

		if (
			! function_exists( 'openssl_verify' )
			|| ! openssl_verify(
				$signature_data,
				$signature,
				JETPACK__DEBUGGER_PUBLIC_KEY
			)
		) {
			return false;
		}

		// signature timestamp must be within 5min of current time
		if ( abs( time() - intval( $_GET['timestamp'] ) ) > 300 ) {
			return false;
		}

		return true;
	}

	/**
	 * Test connection status for this Jetpack site, encrypt the results for decryption by a third-party.
	 *
	 * @since 7.1.0
	 *
	 * @return array|mixed|object|WP_Error
	 */
	public static function jetpack_connection_test_for_external() {
		// Since we are running this test for inclusion in the WP.com testing suite, let's not try to run them as part of these results.
		add_filter( 'jetpack_debugger_run_self_test', '__return_false' );
		jetpack_require_lib( 'debugger' );
		$cxntests = new Jetpack_Cxn_Tests();

		if ( $cxntests->pass() ) {
			$result = array(
				'code'    => 'success',
				'message' => __( 'All connection tests passed.', 'jetpack' ),
			);
		} else {
			$error  = $cxntests->output_fails_as_wp_error(); // Using this so the output is similar both ways.
			$errors = array();

			// Borrowed from WP_REST_Server::error_to_response().
			foreach ( (array) $error->errors as $code => $messages ) {
				foreach ( (array) $messages as $message ) {
					$errors[] = array(
						'code'    => $code,
						'message' => $message,
						'data'    => $error->get_error_data( $code ),
					);
				}
			}

			$result = $errors[0];
			if ( count( $errors ) > 1 ) {
				// Remove the primary error.
				array_shift( $errors );
				$result['additional_errors'] = $errors;
			}
		}

		$result = wp_json_encode( $result );

		$encrypted = $cxntests->encrypt_string_for_wpcom( $result );

		if ( ! $encrypted || ! is_array( $encrypted ) ) {
			return rest_ensure_response(
				array(
					'code'    => 'action_required',
					'message' => 'Please request results from the in-plugin debugger',
				)
			);
		}

		return rest_ensure_response(
			array(
				'code'  => 'response',
				'debug' => array(
					'data' => $encrypted['data'],
					'key'  => $encrypted['key'],
				),
			)
		);
	}

	public static function rewind_data() {
		$site_id = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			return new WP_Error( 'site_id_missing' );
		}

		$response = Jetpack_Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d/rewind', $site_id ) .'?force=wpcom', '2', array(), null, 'wpcom' );

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'rewind_data_fetch_failed' );
		}

		$body = wp_remote_retrieve_body( $response );

		return json_decode( $body );
	}

	/**
	 * Get rewind data
	 *
	 * @since 5.7.0
	 *
	 * @return array Array of rewind properties.
	 */
	public static function get_rewind_data() {
		$rewind_data = self::rewind_data();

		if ( ! is_wp_error( $rewind_data ) ) {
			return rest_ensure_response( array(
					'code' => 'success',
					'message' => esc_html__( 'Backup & Scan data correctly received.', 'jetpack' ),
					'data' => wp_json_encode( $rewind_data ),
				)
			);
		}

		if ( $rewind_data->get_error_code() === 'rewind_data_fetch_failed' ) {
			return new WP_Error( 'rewind_data_fetch_failed', esc_html__( 'Failed fetching rewind data. Try again later.', 'jetpack' ), array( 'status' => 400 ) );
		}

		if ( $rewind_data->get_error_code() === 'site_id_missing' ) {
			return new WP_Error( 'site_id_missing', esc_html__( 'The ID of this site does not exist.', 'jetpack' ), array( 'status' => 404 ) );
		}

		return new WP_Error(
			'error_get_rewind_data',
			esc_html__( 'Could not retrieve Backup & Scan data.', 'jetpack' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Disconnects Jetpack from the WordPress.com Servers
	 *
	 * @uses Jetpack::disconnect();
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return bool|WP_Error True if Jetpack successfully disconnected.
	 */
	public static function disconnect_site( $request ) {

		if ( ! isset( $request['isActive'] ) || $request['isActive'] !== false ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Invalid Parameter', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( Jetpack::is_active() ) {
			Jetpack::disconnect();
			return rest_ensure_response( array( 'code' => 'success' ) );
		}

		return new WP_Error( 'disconnect_failed', esc_html__( 'Was not able to disconnect the site.  Please try again.', 'jetpack' ), array( 'status' => 400 ) );
	}

	/**
	 * Gets a new connect raw URL with fresh nonce.
	 *
	 * @uses Jetpack::disconnect();
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return string|WP_Error A raw URL if the connection URL could be built; error message otherwise.
	 */
	public static function build_connect_url() {
		$url = Jetpack::init()->build_connect_url( true, false, false );
		if ( $url ) {
			return rest_ensure_response( $url );
		}

		return new WP_Error( 'build_connect_url_failed', esc_html__( 'Unable to build the connect URL.  Please reload the page and try again.', 'jetpack' ), array( 'status' => 400 ) );
	}

	/**
	 * Get miscellaneous user data related to the connection. Similar data available in old "My Jetpack".
	 * Information about the master/primary user.
	 * Information about the current user.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
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
	 * Change the master user.
	 *
	 * @since 6.2.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return bool|WP_Error True if owner successfully changed.
	 */
	public static function set_connection_owner( $request ) {
		if ( ! isset( $request['owner'] ) ) {
			return new WP_Error(
				'invalid_param',
				esc_html__( 'Invalid Parameter', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$new_owner_id = $request['owner'];
		if ( ! user_can( $new_owner_id, 'administrator' ) ) {
			return new WP_Error(
				'new_owner_not_admin',
				esc_html__( 'New owner is not admin', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		if ( $new_owner_id === get_current_user_id() ) {
			return new WP_Error(
				'new_owner_is_current_user',
				esc_html__( 'New owner is same as current user', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		if ( ! Jetpack::is_user_connected( $new_owner_id ) ) {
			return new WP_Error(
				'new_owner_not_connected',
				esc_html__( 'New owner is not connected', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		// Update the master user in Jetpack
		$updated = Jetpack_Options::update_option( 'master_user', $new_owner_id );

		// Notify WPCOM about the master user change
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id(),
		) );
		$xml->query( 'jetpack.switchBlogOwner', array(
			'new_blog_owner' => $new_owner_id,
		) );

		if ( $updated && ! $xml->isError() ) {
			return rest_ensure_response(
				array(
					'code' => 'success',
				)
			);
		}
		return new WP_Error(
			'error_setting_new_owner',
			esc_html__( 'Could not confirm new owner.', 'jetpack' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Unlinks current user from the WordPress.com Servers.
	 *
	 * @since 4.3.0
	 * @uses  Jetpack::unlink_user
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return bool|WP_Error True if user successfully unlinked.
	 */
	public static function unlink_user( $request ) {

		if ( ! isset( $request['linked'] ) || $request['linked'] !== false ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Invalid Parameter', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( Jetpack::unlink_user() ) {
			return rest_ensure_response(
				array(
					'code' => 'success'
				)
			);
		}

		return new WP_Error( 'unlink_user_failed', esc_html__( 'Was not able to unlink the user.  Please try again.', 'jetpack' ), array( 'status' => 400 ) );
	}

	/**
	 * Gets current user's tracking settings.
	 *
	 * @since 6.0.0
	 *
	 * @param  WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return WP_REST_Response|WP_Error Response, else error.
	 */
	public static function get_user_tracking_settings( $request ) {
		if ( ! Jetpack::is_user_connected() ) {
			$response = array(
				'tracks_opt_out' => true, // Default to opt-out if not connected to wp.com.
			);
		} else {
			$response = Jetpack_Client::wpcom_json_api_request_as_user(
				'/jetpack-user-tracking',
				'v2',
				array(
					'method'  => 'GET',
					'headers' => array(
						'X-Forwarded-For' => Jetpack::current_user_ip( true ),
					),
				)
			);
			if ( ! is_wp_error( $response ) ) {
				$response = json_decode( wp_remote_retrieve_body( $response ), true );
			}
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Updates current user's tracking settings.
	 *
	 * @since 6.0.0
	 *
	 * @param  WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return WP_REST_Response|WP_Error Response, else error.
	 */
	public static function update_user_tracking_settings( $request ) {
		if ( ! Jetpack::is_user_connected() ) {
			$response = array(
				'tracks_opt_out' => true, // Default to opt-out if not connected to wp.com.
			);
		} else {
			$response = Jetpack_Client::wpcom_json_api_request_as_user(
				'/jetpack-user-tracking',
				'v2',
				array(
					'method'  => 'PUT',
					'headers' => array(
						'Content-Type'    => 'application/json',
						'X-Forwarded-For' => Jetpack::current_user_ip( true ),
					),
				),
				wp_json_encode( $request->get_params() )
			);
			if ( ! is_wp_error( $response ) ) {
				$response = json_decode( wp_remote_retrieve_body( $response ), true );
			}
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Fetch site data from .com including the site's current plan.
	 *
	 * @since 5.5.0
	 *
	 * @return array Array of site properties.
	 */
	public static function site_data() {
		$site_id = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			new WP_Error( 'site_id_missing' );
		}

		$args = array( 'headers' => array() );

		// Allow use a store sandbox. Internal ref: PCYsg-IA-p2.
		if ( isset( $_COOKIE ) && isset( $_COOKIE['store_sandbox'] ) ) {
			$secret                    = $_COOKIE['store_sandbox'];
			$args['headers']['Cookie'] = "store_sandbox=$secret;";
		}

		$response = Jetpack_Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d', $site_id ) .'?force=wpcom', '1.1', $args );

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'site_data_fetch_failed' );
		}

		Jetpack_Plan::update_from_sites_response( $response );

		$body = wp_remote_retrieve_body( $response );

		return json_decode( $body );
	}
	/**
	 * Get site data, including for example, the site's current plan.
	 *
	 * @since 4.3.0
	 *
	 * @return array Array of site properties.
	 */
	public static function get_site_data() {
		$site_data = self::site_data();

		if ( ! is_wp_error( $site_data ) ) {
			return rest_ensure_response( array(
					'code' => 'success',
					'message' => esc_html__( 'Site data correctly received.', 'jetpack' ),
					'data' => json_encode( $site_data ),
				)
			);
		}
		if ( $site_data->get_error_code() === 'site_data_fetch_failed' ) {
			return new WP_Error( 'site_data_fetch_failed', esc_html__( 'Failed fetching site data. Try again later.', 'jetpack' ), array( 'status' => 400 ) );
		}

		if ( $site_data->get_error_code() === 'site_id_missing' ) {
			return new WP_Error( 'site_id_missing', esc_html__( 'The ID of this site does not exist.', 'jetpack' ), array( 'status' => 404 ) );
		}
	}

	/**
	 * Fetch AL data for this site and return it.
	 *
	 * @since 7.4
	 *
	 * @return array|WP_Error
	 */
	public static function get_site_activity() {
		$site_id = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			return new WP_Error(
				'site_id_missing',
				esc_html__( 'Site ID is missing.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$response = Jetpack_Client::wpcom_json_api_request_as_user( "/sites/$site_id/activity", '2', array(
			'method'  => 'GET',
			'headers' => array(
				'X-Forwarded-For' => Jetpack::current_user_ip( true ),
			),
		), null, 'wpcom' );
		$response_code = wp_remote_retrieve_response_code( $response );

		if ( 200 !== $response_code ) {
			return new WP_Error(
				'activity_fetch_failed',
				esc_html__( 'Could not retrieve site activity.', 'jetpack' ),
				array( 'status' => $response_code )
			);
		}

		$data = json_decode( wp_remote_retrieve_body( $response ) );

		if ( ! isset( $data->current->orderedItems ) ) {
			return new WP_Error(
				'activity_not_found',
				esc_html__( 'No activity found', 'jetpack' ),
				array( 'status' => 204 ) // no content
			);
		}

		return rest_ensure_response( array(
				'code' => 'success',
				'data' => $data->current->orderedItems,
			)
		);
	}

	/**
	 * Handles identity crisis mitigation, confirming safe mode for this site.
	 *
	 * @since 4.4.0
	 *
	 * @return bool | WP_Error True if option is properly set.
	 */
	public static function confirm_safe_mode() {
		$updated = Jetpack_Options::update_option( 'safe_mode_confirmed', true );
		if ( $updated ) {
			return rest_ensure_response(
				array(
					'code' => 'success'
				)
			);
		}
		return new WP_Error(
			'error_setting_jetpack_safe_mode',
			esc_html__( 'Could not confirm safe mode.', 'jetpack' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Handles identity crisis mitigation, migrating stats and subscribers from old url to this, new url.
	 *
	 * @since 4.4.0
	 *
	 * @return bool | WP_Error True if option is properly set.
	 */
	public static function migrate_stats_and_subscribers() {
		if ( Jetpack_Options::get_option( 'sync_error_idc' ) && ! Jetpack_Options::delete_option( 'sync_error_idc' ) ) {
			return new WP_Error(
				'error_deleting_sync_error_idc',
				esc_html__( 'Could not delete sync error option.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		if ( Jetpack_Options::get_option( 'migrate_for_idc' ) || Jetpack_Options::update_option( 'migrate_for_idc', true ) ) {
			return rest_ensure_response(
				array(
					'code' => 'success'
				)
			);
		}
		return new WP_Error(
			'error_setting_jetpack_migrate',
			esc_html__( 'Could not confirm migration.', 'jetpack' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * This IDC resolution will disconnect the site and re-connect to a completely new
	 * and separate shadow site than the original.
	 *
	 * It will first will disconnect the site without phoning home as to not disturb the production site.
	 * It then builds a fresh connection URL and sends it back along with the response.
	 *
	 * @since 4.4.0
	 * @return bool|WP_Error
	 */
	public static function start_fresh_connection() {
		// First clear the options / disconnect.
		Jetpack::disconnect();
		return self::build_connect_url();
	}

	/**
	 * Reset Jetpack options
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $options Available options to reset are options|modules
	 * }
	 *
	 * @return bool|WP_Error True if options were reset. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function reset_jetpack_options( $request ) {

		if ( ! isset( $request['reset'] ) || $request['reset'] !== true ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Invalid Parameter', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( isset( $request['options'] ) ) {
			$data = $request['options'];

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
	 * Retrieves the current status of Jumpstart.
	 *
	 * @since 4.5.0
	 *
	 * @return bool
	 */
	public static function jumpstart_status() {
		return array(
			'status' => Jetpack_Options::get_option( 'jumpstart' )
		);
	}

	/**
	 * Toggles activation or deactivation of the JumpStart
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return bool|WP_Error True if toggling Jumpstart succeeded. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function jumpstart_toggle( $request ) {

		if ( $request[ 'active' ] ) {
			return self::jumpstart_activate( $request );
		} else {
			return self::jumpstart_deactivate( $request );
		}
	}

	/**
	 * Activates a series of valid Jetpack modules and initializes some options.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return bool|WP_Error True if Jumpstart succeeded. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function jumpstart_activate( $request ) {
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
			);
			$hidden = array();

			// Set some sharing settings
			if ( class_exists( 'Sharing_Service' ) ) {
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
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return bool|WP_Error True if Jumpstart was disabled or was nothing to dismiss. Otherwise, a WP_Error instance with a message.
	 */
	public static function jumpstart_deactivate( $request ) {

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
	 * Get the query parameters to update module options or general settings.
	 *
	 * @since 4.3.0
	 * @since 4.4.0 Accepts a $selector parameter.
	 *
	 * @param string $selector Selects a set of options to update, Can be empty, a module slug or 'any'.
	 *
	 * @return array
	 */
	public static function get_updateable_parameters( $selector = '' ) {
		$parameters = array(
			'context'     => array(
				'default' => 'edit',
			),
		);

		return array_merge( $parameters, self::get_updateable_data_list( $selector ) );
	}

	/**
	 * Returns a list of module options or general settings that can be updated.
	 *
	 * @since 4.3.0
	 * @since 4.4.0 Accepts 'any' as a parameter which will make it return the entire list.
	 *
	 * @param string|array $selector Module slug, 'any', or an array of parameters.
	 *                               If empty, it's assumed we're updating a module and we'll try to get its slug.
	 *                               If 'any' the full list is returned.
	 *                               If it's an array of parameters, includes the elements by matching keys.
	 *
	 * @return array
	 */
	public static function get_updateable_data_list( $selector = '' ) {

		$options = array(

			// Carousel
			'carousel_background_color' => array(
				'description'       => esc_html__( 'Color scheme.', 'jetpack' ),
				'type'              => 'string',
				'default'           => 'black',
				'enum'              => array(
					'black',
					'white',
				),
				'enum_labels' => array(
					'black' => esc_html__( 'Black', 'jetpack' ),
					'white' => esc_html__( 'White', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'carousel',
			),
			'carousel_display_exif' => array(
				'description'       => wp_kses( sprintf( __( 'Show photo metadata (<a href="http://en.wikipedia.org/wiki/Exchangeable_image_file_format" target="_blank">Exif</a>) in carousel, when available.', 'jetpack' ) ), array( 'a' => array( 'href' => true, 'target' => true ) ) ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'carousel',
			),

			// Comments
			'highlander_comment_form_prompt' => array(
				'description'       => esc_html__( 'Greeting Text', 'jetpack' ),
				'type'              => 'string',
				'default'           => esc_html__( 'Leave a Reply', 'jetpack' ),
				'sanitize_callback' => 'sanitize_text_field',
				'jp_group'          => 'comments',
			),
			'jetpack_comment_form_color_scheme' => array(
				'description'       => esc_html__( "Color scheme", 'jetpack' ),
				'type'              => 'string',
				'default'           => 'light',
				'enum'              => array(
					'light',
					'dark',
					'transparent',
				),
				'enum_labels' => array(
					'light'       => esc_html__( 'Light', 'jetpack' ),
					'dark'        => esc_html__( 'Dark', 'jetpack' ),
					'transparent' => esc_html__( 'Transparent', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'comments',
			),

			// Custom Content Types
			'jetpack_portfolio' => array(
				'description'       => esc_html__( 'Enable or disable Jetpack portfolio post type.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'custom-content-types',
			),
			'jetpack_portfolio_posts_per_page' => array(
				'description'       => esc_html__( 'Number of entries to show at most in Portfolio pages.', 'jetpack' ),
				'type'              => 'integer',
				'default'           => 10,
				'validate_callback' => __CLASS__ . '::validate_posint',
				'jp_group'          => 'custom-content-types',
			),
			'jetpack_testimonial' => array(
				'description'       => esc_html__( 'Enable or disable Jetpack testimonial post type.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'custom-content-types',
			),
			'jetpack_testimonial_posts_per_page' => array(
				'description'       => esc_html__( 'Number of entries to show at most in Testimonial pages.', 'jetpack' ),
				'type'              => 'integer',
				'default'           => 10,
				'validate_callback' => __CLASS__ . '::validate_posint',
				'jp_group'          => 'custom-content-types',
			),

			// Galleries
			'tiled_galleries' => array(
				'description'       => esc_html__( 'Display all your gallery pictures in a cool mosaic.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'tiled-gallery',
			),

			'gravatar_disable_hovercards' => array(
				'description'       => esc_html__( "View people's profiles when you mouse over their Gravatars", 'jetpack' ),
				'type'              => 'string',
				'default'           => 'enabled',
				// Not visible. This is used as the checkbox value.
				'enum'              => array(
					'enabled',
					'disabled',
				),
				'enum_labels' => array(
					'enabled'  => esc_html__( 'Enabled', 'jetpack' ),
					'disabled' => esc_html__( 'Disabled', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'gravatar-hovercards',
			),

			// Infinite Scroll
			'infinite_scroll' => array(
				'description'       => esc_html__( 'To infinity and beyond', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'infinite-scroll',
			),
			'infinite_scroll_google_analytics' => array(
				'description'       => esc_html__( 'Use Google Analytics with Infinite Scroll', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'infinite-scroll',
			),

			// Likes
			'wpl_default' => array(
				'description'       => esc_html__( 'WordPress.com Likes are', 'jetpack' ),
				'type'              => 'string',
				'default'           => 'on',
				'enum'              => array(
					'on',
					'off',
				),
				'enum_labels' => array(
					'on'  => esc_html__( 'On for all posts', 'jetpack' ),
					'off' => esc_html__( 'Turned on per post', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'likes',
			),
			'social_notifications_like' => array(
				'description'       => esc_html__( 'Send email notification when someone likes a post', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'likes',
			),

			// Markdown
			'wpcom_publish_comments_with_markdown' => array(
				'description'       => esc_html__( 'Use Markdown for comments.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'markdown',
			),
			'wpcom_publish_posts_with_markdown' => array(
				'description'       => esc_html__( 'Use Markdown for posts.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'markdown',
			),

			// Mobile Theme
			'wp_mobile_excerpt' => array(
				'description'       => esc_html__( 'Excerpts', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'minileven',
			),
			'wp_mobile_featured_images' => array(
				'description'       => esc_html__( 'Featured Images', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'minileven',
			),
			'wp_mobile_app_promos' => array(
				'description'       => esc_html__( 'Show a promo for the WordPress mobile apps in the footer of the mobile theme.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'minileven',
			),

			// Monitor
			'monitor_receive_notifications' => array(
				'description'       => esc_html__( 'Receive Monitor Email Notifications.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'monitor',
			),

			// Post by Email
			'post_by_email_address' => array(
				'description'       => esc_html__( 'Email Address', 'jetpack' ),
				'type'              => 'string',
				'default'           => 'noop',
				'enum'              => array(
					'noop',
					'create',
					'regenerate',
					'delete',
				),
				'enum_labels' => array(
					'noop'       => '',
					'create'     => esc_html__( 'Create Post by Email address', 'jetpack' ),
					'regenerate' => esc_html__( 'Regenerate Post by Email address', 'jetpack' ),
					'delete'     => esc_html__( 'Delete Post by Email address', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'post-by-email',
			),

			// Protect
			'jetpack_protect_key' => array(
				'description'       => esc_html__( 'Protect API key', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_alphanum',
				'jp_group'          => 'protect',
			),
			'jetpack_protect_global_whitelist' => array(
				'description'       => esc_html__( 'Protect global whitelist', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_string',
				'sanitize_callback' => 'esc_textarea',
				'jp_group'          => 'protect',
			),

			// Sharing
			'sharing_services' => array(
				'description'       => esc_html__( 'Enabled Services and those hidden behind a button', 'jetpack' ),
				'type'              => 'object',
				'default'           => array(
					'visible' => array( 'twitter', 'facebook', 'google-plus-1' ),
					'hidden'  => array(),
				),
				'validate_callback' => __CLASS__ . '::validate_services',
				'jp_group'          => 'sharedaddy',
			),
			'button_style' => array(
				'description'       => esc_html__( 'Button Style', 'jetpack' ),
				'type'              => 'string',
				'default'           => 'icon',
				'enum'              => array(
					'icon-text',
					'icon',
					'text',
					'official',
				),
				'enum_labels' => array(
					'icon-text' => esc_html__( 'Icon + text', 'jetpack' ),
					'icon'      => esc_html__( 'Icon only', 'jetpack' ),
					'text'      => esc_html__( 'Text only', 'jetpack' ),
					'official'  => esc_html__( 'Official buttons', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'sharedaddy',
			),
			'sharing_label' => array(
				'description'       => esc_html__( 'Sharing Label', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_string',
				'sanitize_callback' => 'esc_html',
				'jp_group'          => 'sharedaddy',
			),
			'show' => array(
				'description'       => esc_html__( 'Views where buttons are shown', 'jetpack' ),
				'type'              => 'array',
				'items'             => array(
					'type' => 'string'
				),
				'default'           => array( 'post' ),
				'validate_callback' => __CLASS__ . '::validate_sharing_show',
				'jp_group'          => 'sharedaddy',
			),
			'jetpack-twitter-cards-site-tag' => array(
				'description'       => esc_html__( "The Twitter username of the owner of this site's domain.", 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_twitter_username',
				'sanitize_callback' => 'esc_html',
				'jp_group'          => 'sharedaddy',
			),
			'sharedaddy_disable_resources' => array(
				'description'       => esc_html__( 'Disable CSS and JS', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'sharedaddy',
			),
			'custom' => array(
				'description'       => esc_html__( 'Custom sharing services added by user.', 'jetpack' ),
				'type'              => 'object',
				'default'           => array(
					'sharing_name' => '',
					'sharing_url'  => '',
					'sharing_icon' => '',
				),
				'validate_callback' => __CLASS__ . '::validate_custom_service',
				'jp_group'          => 'sharedaddy',
			),
			// Not an option, but an action that can be perfomed on the list of custom services passing the service ID.
			'sharing_delete_service' => array(
				'description'       => esc_html__( 'Delete custom sharing service.', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_custom_service_id',
				'jp_group'          => 'sharedaddy',
			),

			// SSO
			'jetpack_sso_require_two_step' => array(
				'description'       => esc_html__( 'Require Two-Step Authentication', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'sso',
			),
			'jetpack_sso_match_by_email' => array(
				'description'       => esc_html__( 'Match by Email', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'sso',
			),

			// Subscriptions
			'stb_enabled' => array(
				'description'       => esc_html__( "Show a <em>'follow blog'</em> option in the comment form", 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'stc_enabled' => array(
				'description'       => esc_html__( "Show a <em>'follow comments'</em> option in the comment form", 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),

			// Related Posts
			'show_headline' => array(
				'description'       => esc_html__( 'Highlight related content with a heading', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'related-posts',
			),
			'show_thumbnails' => array(
				'description'       => esc_html__( 'Show a thumbnail image where available', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'related-posts',
			),

			// Verification Tools
			'google' => array(
				'description'       => esc_html__( 'Google Search Console', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_verification_service',
				'jp_group'          => 'verification-tools',
			),
			'bing' => array(
				'description'       => esc_html__( 'Bing Webmaster Center', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_verification_service',
				'jp_group'          => 'verification-tools',
			),
			'pinterest' => array(
				'description'       => esc_html__( 'Pinterest Site Verification', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_verification_service',
				'jp_group'          => 'verification-tools',
			),
			'yandex' => array(
				'description'       => esc_html__( 'Yandex Site Verification', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_verification_service',
				'jp_group'          => 'verification-tools',
			),
			'enable_header_ad' => array(
				'description'        => esc_html__( 'Display an ad unit at the top of each page.', 'jetpack' ),
				'type'               => 'boolean',
				'default'            => 1,
				'validate_callback'  => __CLASS__ . '::validate_boolean',
				'jp_group'           => 'wordads',
			),
			'wordads_approved' => array(
				'description'        => esc_html__( 'Is site approved for WordAds?', 'jetpack' ),
				'type'               => 'boolean',
				'default'            => 0,
				'validate_callback'  => __CLASS__ . '::validate_boolean',
				'jp_group'           => 'wordads',
			),
			'wordads_second_belowpost' => array(
				'description'        => esc_html__( 'Display second ad below post?', 'jetpack' ),
				'type'               => 'boolean',
				'default'            => 1,
				'validate_callback'  => __CLASS__ . '::validate_boolean',
				'jp_group'           => 'wordads',
			),
			'wordads_display_front_page' => array(
				'description'        => esc_html__( 'Display ads on the front page?', 'jetpack' ),
				'type'               => 'boolean',
				'default'            => 1,
				'validate_callback'  => __CLASS__ . '::validate_boolean',
				'jp_group'           => 'wordads',
			),
			'wordads_display_post' => array(
				'description'        => esc_html__( 'Display ads on posts?', 'jetpack' ),
				'type'               => 'boolean',
				'default'            => 1,
				'validate_callback'  => __CLASS__ . '::validate_boolean',
				'jp_group'           => 'wordads',
			),
			'wordads_display_page' => array(
				'description'        => esc_html__( 'Display ads on pages?', 'jetpack' ),
				'type'               => 'boolean',
				'default'            => 1,
				'validate_callback'  => __CLASS__ . '::validate_boolean',
				'jp_group'           => 'wordads',
			),
			'wordads_display_archive' => array(
				'description'        => esc_html__( 'Display ads on archive pages?', 'jetpack' ),
				'type'               => 'boolean',
				'default'            => 1,
				'validate_callback'  => __CLASS__ . '::validate_boolean',
				'jp_group'           => 'wordads',
			),
			'wordads_custom_adstxt' => array(
				'description'        => esc_html__( 'Custom ads.txt entries', 'jetpack' ),
				'type'               => 'string',
				'default'            => '',
				'validate_callback'  => __CLASS__ . '::validate_string',
				'sanitize_callback'  => 'sanitize_textarea_field',
				'jp_group'           => 'wordads',
			),

			// Google Analytics
			'google_analytics_tracking_id' => array(
				'description'        => esc_html__( 'Google Analytics', 'jetpack' ),
				'type'               => 'string',
				'default'            => '',
				'validate_callback'  => __CLASS__ . '::validate_alphanum',
				'jp_group'           => 'google-analytics',
			),

			// Stats
			'admin_bar' => array(
				'description'       => esc_html__( 'Put a chart showing 48 hours of views in the admin bar.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'stats',
			),
			'roles' => array(
				'description'       => esc_html__( 'Select the roles that will be able to view stats reports.', 'jetpack' ),
				'type'              => 'array',
				'items'             => array(
					'type' => 'string'
				),
				'default'           => array( 'administrator' ),
				'validate_callback' => __CLASS__ . '::validate_stats_roles',
				'sanitize_callback' => __CLASS__ . '::sanitize_stats_allowed_roles',
				'jp_group'          => 'stats',
			),
			'count_roles' => array(
				'description'       => esc_html__( 'Count the page views of registered users who are logged in.', 'jetpack' ),
				'type'              => 'array',
				'items'             => array(
					'type' => 'string'
				),
				'default'           => array( 'administrator' ),
				'validate_callback' => __CLASS__ . '::validate_stats_roles',
				'jp_group'          => 'stats',
			),
			'blog_id' => array(
				'description'       => esc_html__( 'Blog ID.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'stats',
			),
			'do_not_track' => array(
				'description'       => esc_html__( 'Do not track.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'stats',
			),
			'hide_smile' => array(
				'description'       => esc_html__( 'Hide the stats smiley face image.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'stats',
			),
			'version' => array(
				'description'       => esc_html__( 'Version.', 'jetpack' ),
				'type'              => 'integer',
				'default'           => 9,
				'validate_callback' => __CLASS__ . '::validate_posint',
				'jp_group'          => 'stats',
			),

			// Akismet - Not a module, but a plugin. The options can be passed and handled differently.
			'akismet_show_user_comments_approved' => array(
				'description'       => '',
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'settings',
			),

			'wordpress_api_key' => array(
				'description'       => '',
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_alphanum',
				'jp_group'          => 'settings',
			),

			// Apps card on dashboard
			'dismiss_dash_app_card' => array(
				'description'       => '',
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'settings',
			),

			// Empty stats card dismiss
			'dismiss_empty_stats_card' => array(
				'description'       => '',
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'settings',
			),

			'lang_id' => array(
				'description' => esc_html__( 'Primary language for the site.', 'jetpack' ),
				'type' => 'string',
				'default' => 'en_US',
				'jp_group' => 'settings',
			),

			'onboarding' => array(
				'description'       => '',
				'type'              => 'object',
				'default'           => array(
					'siteTitle'          => '',
					'siteDescription'    => '',
					'siteType'           => 'personal',
					'homepageFormat'     => 'posts',
					'addContactForm'     => 0,
					'businessAddress'    => array(
						'name'   => '',
						'street' => '',
						'city'   => '',
						'state'  => '',
						'zip'    => '',
					),
					'installWooCommerce' => false,
				),
				'validate_callback' => __CLASS__ . '::validate_onboarding',
				'jp_group'          => 'settings',
			),

		);

		// Add modules to list so they can be toggled
		$modules = Jetpack::get_available_modules();
		if ( is_array( $modules ) && ! empty( $modules ) ) {
			$module_args = array(
				'description'       => '',
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'modules',
			);
			foreach( $modules as $module ) {
				$options[ $module ] = $module_args;
			}
		}

		if ( is_array( $selector ) ) {

			// Return only those options whose keys match $selector keys
			return array_intersect_key( $options, $selector );
		}

		if ( 'any' === $selector ) {

			// Toggle module or update any module option or any general setting
			return $options;
		}

		// We're updating the options for a single module.
		if ( empty( $selector ) ) {
			$selector = self::get_module_requested();
		}
		$selected = array();
		foreach ( $options as $option => $attributes ) {

			// Not adding an isset( $attributes['jp_group'] ) because if it's not set, it must be fixed, otherwise options will fail.
			if ( $selector === $attributes['jp_group'] ) {
				$selected[ $option ] = $attributes;
			}
		}
		return $selected;
	}

	/**
	 * Validates that the parameters are proper values that can be set during Jetpack onboarding.
	 *
	 * @since 5.4.0
	 *
	 * @param array           $onboarding_data Values to check.
	 * @param WP_REST_Request $request         The request sent to the WP REST API.
	 * @param string          $param           Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_onboarding( $onboarding_data, $request, $param ) {
		if ( ! is_array( $onboarding_data ) ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Not valid onboarding data.', 'jetpack' ) );
		}
		foreach ( $onboarding_data as $value ) {
			if ( is_string( $value ) ) {
				$onboarding_choice = self::validate_string( $value, $request, $param );
			} elseif ( is_array( $value ) ) {
				$onboarding_choice = self::validate_onboarding( $value, $request, $param );
			} else {
				$onboarding_choice = self::validate_boolean( $value, $request, $param );
			}
			if ( is_wp_error( $onboarding_choice ) ) {
				return $onboarding_choice;
			}
		}
		return true;
	}

	/**
	 * Validates that the parameter is either a pure boolean or a numeric string that can be mapped to a boolean.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
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
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
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
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
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
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
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
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_alphanum( $value = '', $request, $param ) {
		if ( ! empty( $value ) && ( ! is_string( $value ) || ! preg_match( '/^[a-z0-9]+$/i', $value ) ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be an alphanumeric string.', 'jetpack' ), $param ) );
		}
		return true;
	}

	/**
	 * Validates that the parameter is a tag or id for a verification service, or an empty string (to be able to clear the field).
	 *
	 * @since 4.6.0
	 *
	 * @param string $value Value to check.
	 * @param WP_REST_Request $request
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_verification_service( $value = '', $request, $param ) {
		if ( ! empty( $value ) && ! ( is_string( $value ) && ( preg_match( '/^[a-z0-9_-]+$/i', $value ) || jetpack_verification_get_code( $value ) !== false ) ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be an alphanumeric string or a verification tag.', 'jetpack' ), $param ) );
		}
		return true;
	}

	/**
	 * Validates that the parameter is among the roles allowed for Stats.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
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
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_sharing_show( $value, $request, $param ) {
		$views = array( 'index', 'post', 'page', 'attachment', 'jetpack-portfolio' );
		if ( ! is_array( $value ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be an array of post types.', 'jetpack' ), $param ) );
		}
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
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_services( $value, $request, $param ) {
		if ( ! is_array( $value ) || ! isset( $value['visible'] ) || ! isset( $value['hidden'] ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be an array with visible and hidden items.', 'jetpack' ), $param ) );
		}

		// Allow to clear everything.
		if ( empty( $value['visible'] ) && empty( $value['hidden'] ) ) {
			return true;
		}

		if ( ! class_exists( 'Sharing_Service' ) && ! include_once( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
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
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_custom_service( $value, $request, $param ) {
		if ( ! is_array( $value ) || ! isset( $value['sharing_name'] ) || ! isset( $value['sharing_url'] ) || ! isset( $value['sharing_icon'] ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be an array with sharing name, url and icon.', 'jetpack' ), $param ) );
		}

		// Allow to clear everything.
		if ( empty( $value['sharing_name'] ) && empty( $value['sharing_url'] ) && empty( $value['sharing_icon'] ) ) {
			return true;
		}

		if ( ! class_exists( 'Sharing_Service' ) && ! include_once( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
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
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_custom_service_id( $value = '', $request, $param ) {
		if ( ! empty( $value ) && ( ! is_string( $value ) || ! preg_match( '/custom\-[0-1]+/i', $value ) ) ) {
			return new WP_Error( 'invalid_param', sprintf( esc_html__( "%s must be a string prefixed with 'custom-' and followed by a numeric ID.", 'jetpack' ), $param ) );
		}

		if ( ! class_exists( 'Sharing_Service' ) && ! include_once( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
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
	 * @return bool|WP_Error
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
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
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
	 * @return bool|array
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
	 * @return array|string
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
	 * @param string|array $modules Can be a single module or a list of modules.
	 * @param null|string  $slug    Slug of the module in the first parameter.
	 *
	 * @return array|string
	 */
	public static function prepare_modules_for_response( $modules = '', $slug = null ) {
		global $wp_rewrite;

		/** This filter is documented in modules/sitemaps/sitemaps.php */
		$location = apply_filters( 'jetpack_sitemap_location', '' );

		if ( $wp_rewrite->using_index_permalinks() ) {
			$sitemap_url = home_url( '/index.php' . $location . '/sitemap.xml' );
			$news_sitemap_url = home_url( '/index.php' . $location . '/news-sitemap.xml' );
		} else if ( $wp_rewrite->using_permalinks() ) {
			$sitemap_url = home_url( $location . '/sitemap.xml' );
			$news_sitemap_url = home_url( $location . '/news-sitemap.xml' );
		} else {
			$sitemap_url = home_url( $location . '/?jetpack-sitemap=sitemap.xml' );
			$news_sitemap_url = home_url( $location . '/?jetpack-sitemap=news-sitemap.xml' );
		}

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
		$options = self::get_updateable_data_list( $module );

		if ( ! is_array( $options ) || empty( $options ) ) {
			return $options;
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
					include_once( JETPACK__PLUGIN_DIR . 'modules/protect/shared-functions.php' );
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

			case 'google-analytics':
				$wga = get_option( 'jetpack_wga' );
				$code = '';
				if ( is_array( $wga ) && array_key_exists( 'code', $wga ) ) {
					 $code = $wga[ 'code' ];
				}
				$options[ 'google_analytics_tracking_id' ][ 'current_value' ] = $code;
				break;

			case 'sharedaddy':
				// It's local, but it must be broken apart since it's saved as an array.
				if ( ! class_exists( 'Sharing_Service' ) && ! include_once( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
					break;
				}
				$sharer = new Sharing_Service();
				$options = self::split_options( $options, $sharer->get_global_options() );
				$options['sharing_services']['current_value'] = $sharer->get_blog_services();
				$other_sharedaddy_options = array( 'jetpack-twitter-cards-site-tag', 'sharedaddy_disable_resources', 'sharing_delete_service' );
				foreach ( $other_sharedaddy_options as $key ) {
					$default_value = isset( $options[ $key ]['default'] ) ? $options[ $key ]['default'] : '';
					$current_value = get_option( $key, $default_value );
					$options[ $key ]['current_value'] = self::cast_value( $current_value, $options[ $key ] );
				}
				break;

			case 'stats':
				// It's local, but it must be broken apart since it's saved as an array.
				if ( ! function_exists( 'stats_get_options' ) ) {
					include_once( JETPACK__PLUGIN_DIR . 'modules/stats.php' );
				}
				$options = self::split_options( $options, stats_get_options() );
				break;
			default:
				// These option are just stored as plain WordPress options.
				foreach ( $options as $key => $value ) {
					$default_value = isset( $options[ $key ]['default'] ) ? $options[ $key ]['default'] : '';
					$current_value = get_option( $key, $default_value );
					$options[ $key ]['current_value'] = self::cast_value( $current_value, $options[ $key ] );
				}
		}
		// At this point some options have current_value not set because they're options
		// that only get written on update, so we set current_value to the default one.
		foreach ( $options as $key => $value ) {
			// We don't need validate_callback in the response
			if ( isset( $options[ $key ]['validate_callback'] ) ) {
				unset( $options[ $key ]['validate_callback'] );
			}
			$default_value = isset( $options[ $key ]['default'] ) ? $options[ $key ]['default'] : '';
			if ( ! array_key_exists( 'current_value', $options[ $key ] ) ) {
				$options[ $key ]['current_value'] = self::cast_value( $default_value, $options[ $key ] );
			}
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

		// Do what is necessary for each module.
		switch ( $module ) {
			case 'monitor':
				// Load the class to use the method. If class can't be found, do nothing.
				if ( ! class_exists( 'Jetpack_Monitor' ) && ! include_once( Jetpack::get_module_path( $module ) ) ) {
					return false;
				}
				$value = Jetpack_Monitor::user_receives_notifications( false );
				break;

			case 'post-by-email':
				// Load the class to use the method. If class can't be found, do nothing.
				if ( ! class_exists( 'Jetpack_Post_By_Email' ) && ! include_once( Jetpack::get_module_path( $module ) ) ) {
					return false;
				}
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
	 * Deprecated - Get third party plugin API keys.
	 * @deprecated
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Plugin slug with the syntax 'plugin-directory/plugin-main-file.php'.
	 * }
	 */
	public static function get_service_api_key( $request ) {
		_deprecated_function( __METHOD__, 'jetpack-6.9.0', 'WPCOM_REST_API_V2_Endpoint_Service_API_Keys::get_service_api_key' );
		return WPCOM_REST_API_V2_Endpoint_Service_API_Keys::get_service_api_key( $request );
	}

	/**
	 * Deprecated - Update third party plugin API keys.
	 * @deprecated
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Plugin slug with the syntax 'plugin-directory/plugin-main-file.php'.
	 * }
	 */
	public static function update_service_api_key( $request ) {
		_deprecated_function( __METHOD__, 'jetpack-6.9.0', 'WPCOM_REST_API_V2_Endpoint_Service_API_Keys::update_service_api_key' );
		return WPCOM_REST_API_V2_Endpoint_Service_API_Keys::update_service_api_key( $request ) ;
	}

	/**
	 * Deprecated - Delete a third party plugin API key.
	 * @deprecated
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Plugin slug with the syntax 'plugin-directory/plugin-main-file.php'.
	 * }
	 */
	public static function delete_service_api_key( $request ) {
		_deprecated_function( __METHOD__, 'jetpack-6.9.0', 'WPCOM_REST_API_V2_Endpoint_Service_API_Keys::delete_service_api_key' );
		return WPCOM_REST_API_V2_Endpoint_Service_API_Keys::delete_service_api_key( $request );
	}

	/**
	 * Deprecated - Validate the service provided in /service-api-keys/ endpoints.
	 * To add a service to these endpoints, add the service name to $valid_services
	 * and add '{service name}_api_key' to the non-compact return array in get_option_names(),
	 * in class-jetpack-options.php
	 * @deprecated
	 *
	 * @param string $service The service the API key is for.
	 * @return string Returns the service name if valid, null if invalid.
	 */
	public static function validate_service_api_service( $service = null ) {
		_deprecated_function( __METHOD__, 'jetpack-6.9.0', 'WPCOM_REST_API_V2_Endpoint_Service_API_Keys::validate_service_api_service' );
		return WPCOM_REST_API_V2_Endpoint_Service_API_Keys::validate_service_api_service( $service );
	}

	/**
	 * Error response for invalid service API key requests with an invalid service.
	 */
	public static function service_api_invalid_service_response() {
		_deprecated_function( __METHOD__, 'jetpack-6.9.0', 'WPCOM_REST_API_V2_Endpoint_Service_API_Keys::service_api_invalid_service_response' );
		return WPCOM_REST_API_V2_Endpoint_Service_API_Keys::service_api_invalid_service_response();
	}

	/**
	 * Deprecated - Validate API Key
	 * @deprecated
	 *
	 * @param string $key The API key to be validated.
	 * @param string $service The service the API key is for.
	 *
	 */
	public static function validate_service_api_key( $key = null, $service = null ) {
		_deprecated_function( __METHOD__, 'jetpack-6.9.0', 'WPCOM_REST_API_V2_Endpoint_Service_API_Keys::validate_service_api_key' );
		return WPCOM_REST_API_V2_Endpoint_Service_API_Keys::validate_service_api_key( $key , $service  );
	}

	/**
	 * Deprecated - Validate Mapbox API key
	 * Based loosely on https://github.com/mapbox/geocoding-example/blob/master/php/MapboxTest.php
	 * @deprecated
	 *
	 * @param string $key The API key to be validated.
	 */
	public static function validate_service_api_key_mapbox( $key ) {
		_deprecated_function( __METHOD__, 'jetpack-6.9.0', 'WPCOM_REST_API_V2_Endpoint_Service_API_Keys::validate_service_api_key' );
		return WPCOM_REST_API_V2_Endpoint_Service_API_Keys::validate_service_api_key_mapbox( $key );

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
		if ( ! function_exists( 'is_plugin_active' ) ) {
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
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Plugin slug with the syntax 'plugin-directory/plugin-main-file.php'.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function get_plugin( $request ) {

		$plugins = self::core_get_plugins();

		if ( empty( $plugins ) ) {
			return new WP_Error( 'no_plugins_found', esc_html__( 'This site has no plugins.', 'jetpack' ), array( 'status' => 404 ) );
		}

		$plugin = stripslashes( $request['plugin'] );

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
