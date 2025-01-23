<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Register WP REST API endpoints for Jetpack.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Connection\SSO;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Jetpack_CRM_Data;
use Automattic\Jetpack\Plugins_Installer;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Status\Visitor;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection_Shared_Functions;
use Automattic\Jetpack\Waf\Waf_Compatibility;

// Disable direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Load WP_Error for error messages.
require_once ABSPATH . '/wp-includes/class-wp-error.php';

// Register endpoints when WP REST API is initialized.
add_action( 'rest_api_init', array( 'Jetpack_Core_Json_Api_Endpoints', 'register_endpoints' ) );
// Load API endpoints that are synced with WP.com
// Each of these is a class that will register its own routes on 'rest_api_init'.
require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/load-wpcom-endpoints.php';

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions/class-settings.php';

/**
 * Class Jetpack_Core_Json_Api_Endpoints
 *
 * @since 4.3.0
 */
class Jetpack_Core_Json_Api_Endpoints {
	/**
	 * Roles that can access Stats once they're granted access.
	 *
	 * @var array
	 */
	public static $stats_roles;

	/**
	 * Declare the Jetpack REST API endpoints.
	 *
	 * @since 4.3.0
	 */
	public static function register_endpoints() {

		// Load API endpoint base classes.
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-xmlrpc-consumer-endpoint.php';

		// Load API endpoints.
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-module-endpoints.php';
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-site-endpoints.php';
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-widgets-endpoints.php';

		self::$stats_roles = array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' );

		$ixr_client             = new Jetpack_IXR_Client( array( 'user_id' => get_current_user_id() ) );
		$core_api_endpoint      = new Jetpack_Core_API_Data( $ixr_client );
		$module_list_endpoint   = new Jetpack_Core_API_Module_List_Endpoint();
		$module_data_endpoint   = new Jetpack_Core_API_Module_Data_Endpoint();
		$module_toggle_endpoint = new Jetpack_Core_API_Module_Toggle_Endpoint( new Jetpack_IXR_Client() );
		$site_endpoint          = new Jetpack_Core_API_Site_Endpoint();
		$widget_endpoint        = new Jetpack_Core_API_Widget_Endpoint();

		/**
		 * TODO: Move me somewhere that makes more sense.
		 * Also give me permissions that aren't awful.
		 */
		register_rest_route(
			'jetpack/v4',
			'jetpack-ai-jwt',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::get_openai_jwt',
				'permission_callback' => function () {
					return ( new Connection_Manager( 'jetpack' ) )->is_user_connected() && current_user_can( 'edit_posts' );
				},
			)
		);

		register_rest_route(
			'jetpack/v4',
			'plans',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_plans',
				'permission_callback' => __CLASS__ . '::connect_url_permission_callback',
			)
		);

		register_rest_route(
			'jetpack/v4',
			'products',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_products',
				'permission_callback' => __CLASS__ . '::connect_url_permission_callback',
			)
		);

		register_rest_route(
			'jetpack/v4',
			'marketing/survey',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::submit_survey',
				'permission_callback' => __CLASS__ . '::disconnect_site_permission_callback',
			)
		);

		// Test current connection status of Jetpack.
		register_rest_route(
			'jetpack/v4',
			'/connection/test',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::jetpack_connection_test',
				'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
			)
		);

		// Endpoint specific for privileged servers to request detailed debug information.
		register_rest_route(
			'jetpack/v4',
			'/connection/test-wpcom/',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::jetpack_connection_test_for_external',
				'permission_callback' => __CLASS__ . '::view_jetpack_connection_test_check',
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/rewind',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_rewind_data',
				'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/scan',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_scan_state',
				'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
			)
		);

		// Fetches a fresh connect URL.
		register_rest_route(
			'jetpack/v4',
			'/connection/url',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::build_connect_url',
				'permission_callback' => __CLASS__ . '::connect_url_permission_callback',
				'args'                => array(
					'from'     => array( 'type' => 'string' ),
					'redirect' => array( 'type' => 'string' ),
				),
			)
		);

		// Current user: get or set tracking settings.
		register_rest_route(
			'jetpack/v4',
			'/tracking/settings',
			array(
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
			)
		);

		// Disconnect/unlink user from WordPress.com servers.
		register_rest_route(
			'jetpack/v4',
			'/connection/user',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::unlink_user',
				'permission_callback' => __CLASS__ . '::unlink_user_permission_callback',
			)
		);

		// Get current site data.
		register_rest_route(
			'jetpack/v4',
			'/site',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_data',
				'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
			)
		);

		// Get current site data.
		register_rest_route(
			'jetpack/v4',
			'/site/features',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $site_endpoint, 'get_features' ),
				'permission_callback' => array( $site_endpoint, 'can_request' ),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/site/products',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $site_endpoint, 'get_products' ),
				'permission_callback' => array( $site_endpoint, 'can_request' ),
			)
		);

		// Get current site purchases.
		register_rest_route(
			'jetpack/v4',
			'/site/purchases',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $site_endpoint, 'get_purchases' ),
				'permission_callback' => array( $site_endpoint, 'can_request' ),
			)
		);

		// Get current site benefits.
		register_rest_route(
			'jetpack/v4',
			'/site/benefits',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $site_endpoint, 'get_benefits' ),
				'permission_callback' => array( $site_endpoint, 'can_request' ),
			)
		);

		// Get Activity Log data for this site.
		register_rest_route(
			'jetpack/v4',
			'/site/activity',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_activity',
				'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
			)
		);

		// Return all modules.
		register_rest_route(
			'jetpack/v4',
			'/module/all',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $module_list_endpoint, 'process' ),
				'permission_callback' => array( $module_list_endpoint, 'can_request' ),
			)
		);

		// Activate many modules.
		register_rest_route(
			'jetpack/v4',
			'/module/all/active',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $module_list_endpoint, 'process' ),
				'permission_callback' => array( $module_list_endpoint, 'can_request' ),
				'args'                => array(
					'modules' => array(
						'default'           => '',
						'type'              => 'array',
						'items'             => array(
							'type' => 'string',
						),
						'required'          => true,
						'validate_callback' => __CLASS__ . '::validate_module_list',
					),
					'active'  => array(
						'default'           => true,
						'type'              => 'boolean',
						'required'          => false,
						'validate_callback' => __CLASS__ . '::validate_boolean',
					),
				),
			)
		);

		// Return a single module and update it when needed.
		register_rest_route(
			'jetpack/v4',
			'/module/(?P<slug>[a-z\-]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $core_api_endpoint, 'process' ),
				'permission_callback' => array( $core_api_endpoint, 'can_request' ),
			)
		);

		// Activate and deactivate a module.
		register_rest_route(
			'jetpack/v4',
			'/module/(?P<slug>[a-z\-]+)/active',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $module_toggle_endpoint, 'process' ),
				'permission_callback' => array( $module_toggle_endpoint, 'can_request' ),
				'args'                => array(
					'active' => array(
						'default'           => true,
						'type'              => 'boolean',
						'required'          => true,
						'validate_callback' => __CLASS__ . '::validate_boolean',
					),
				),
			)
		);

		// Update a module.
		register_rest_route(
			'jetpack/v4',
			'/module/(?P<slug>[a-z\-]+)',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $core_api_endpoint, 'process' ),
				'permission_callback' => array( $core_api_endpoint, 'can_request' ),
				'args'                => self::get_updateable_parameters( 'any' ),
			)
		);

		// Get data for a specific module, i.e. Protect block count, WPCOM stats,
		// Akismet spam count, etc.
		register_rest_route(
			'jetpack/v4',
			'/module/(?P<slug>[a-z\-]+)/data',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $module_data_endpoint, 'process' ),
				'permission_callback' => array( $module_data_endpoint, 'can_request' ),
				'args'                => array(
					'range' => array(
						'default'           => 'day',
						'type'              => 'string',
						'required'          => false,
						'validate_callback' => __CLASS__ . '::validate_string',
					),
				),
			)
		);

		// Check if the API key for a specific service is valid or not.
		register_rest_route(
			'jetpack/v4',
			'/module/(?P<service>[a-z\-]+)/key/check',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $module_data_endpoint, 'key_check' ),
				'permission_callback' => __CLASS__ . '::update_settings_permission_check',
				'sanitize_callback'   => 'sanitize_text_field',
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/module/(?P<service>[a-z\-]+)/key/check',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $module_data_endpoint, 'key_check' ),
				'permission_callback' => __CLASS__ . '::update_settings_permission_check',
				'sanitize_callback'   => 'sanitize_text_field',
				'args'                => array(
					'api_key' => array(
						'default'           => '',
						'type'              => 'string',
						'validate_callback' => __CLASS__ . '::validate_alphanum',
					),
				),
			)
		);

		// Update any Jetpack module option or setting.
		register_rest_route(
			'jetpack/v4',
			'/settings',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $core_api_endpoint, 'process' ),
				'permission_callback' => array( $core_api_endpoint, 'can_request' ),
				'args'                => self::get_updateable_parameters( 'any' ),
			)
		);

		// Update a module.
		register_rest_route(
			'jetpack/v4',
			'/settings/(?P<slug>[a-z\-]+)',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $core_api_endpoint, 'process' ),
				'permission_callback' => array( $core_api_endpoint, 'can_request' ),
				'args'                => self::get_updateable_parameters(),
			)
		);

		// Return all module settings.
		register_rest_route(
			'jetpack/v4',
			'/settings/',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $core_api_endpoint, 'process' ),
				'permission_callback' => array( $core_api_endpoint, 'can_request' ),
			)
		);

		// Reset all Jetpack options.
		register_rest_route(
			'jetpack/v4',
			'/options/(?P<options>[a-z\-]+)',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::reset_jetpack_options',
				'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
			)
		);

		// Updates: get number of plugin updates available.
		register_rest_route(
			'jetpack/v4',
			'/updates/plugins',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_plugin_update_count',
				'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
			)
		);

		// Dismiss Jetpack Notices.
		register_rest_route(
			'jetpack/v4',
			'/notice/(?P<notice>[a-z\-_]+)',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::dismiss_notice',
				'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
			)
		);

		/*
		 * Plugins: manage plugins on your site.
		 *
		 * @since 8.9.0
		 *
		 * @to-do: deprecate and switch to /wp/v2/plugins when WordPress 5.5 is the minimum required version.
		 * Noting that the `source` parameter is Jetpack-specific (not implemented in Core).
		 */
		register_rest_route(
			'jetpack/v4',
			'/plugins',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_plugins',
					'permission_callback' => __CLASS__ . '::activate_plugins_permission_check',
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => __CLASS__ . '::install_plugin',
					'permission_callback' => __CLASS__ . '::activate_plugins_permission_check',
					'args'                => array(
						'slug'   => array(
							'type'        => 'string',
							'required'    => true,
							'description' => __( 'WordPress.org plugin directory slug.', 'jetpack' ),
							'pattern'     => '[\w\-]+',
						),
						'status' => array(
							'description' => __( 'The plugin activation status.', 'jetpack' ),
							'type'        => 'string',
							'enum'        => is_multisite() ? array( 'inactive', 'active', 'network-active' ) : array( 'inactive', 'active' ),
							'default'     => 'inactive',
						),
						'source' => array(
							'required'          => false,
							'type'              => 'string',
							'validate_callback' => __CLASS__ . '::validate_string',
						),
					),
				),
			)
		);

		/*
		 * Plugins: activate a specific plugin.
		 *
		 * @since 8.9.0
		 *
		 * @to-do: deprecate and switch to /wp/v2/plugins when WordPress 5.5 is the minimum required version.
		 * Noting that the `source` parameter is Jetpack-specific (not implemented in Core).
		 */
		register_rest_route(
			'jetpack/v4',
			'/plugins/(?P<plugin>[^.\/]+(?:\/[^.\/]+)?)',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::activate_plugin',
				'permission_callback' => __CLASS__ . '::activate_plugins_permission_check',
				'args'                => array(
					'status' => array(
						'required'          => true,
						'type'              => 'string',
						'validate_callback' => __CLASS__ . '::validate_activate_plugin',
					),
					'source' => array(
						'required'          => false,
						'type'              => 'string',
						'validate_callback' => __CLASS__ . '::validate_string',
					),
				),
			)
		);

		// Plugins: check if the plugin is active.
		register_rest_route(
			'jetpack/v4',
			'/plugin/(?P<plugin>[a-z\/\.\-_]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_plugin',
				'permission_callback' => __CLASS__ . '::activate_plugins_permission_check',
			)
		);

		// Widgets: get information about a widget that supports it.
		register_rest_route(
			'jetpack/v4',
			'/widgets/(?P<id>[0-9a-z\-_]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $widget_endpoint, 'process' ),
				'permission_callback' => array( $widget_endpoint, 'can_request' ),
			)
		);

		// Site Verify: check if the site is verified, and a get verification token if not.
		register_rest_route(
			'jetpack/v4',
			'/verify-site/(?P<service>[a-z\-_]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::is_site_verified_and_token',
				'permission_callback' => __CLASS__ . '::update_settings_permission_check',
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/verify-site/(?P<service>[a-z\-_]+)/(?<keyring_id>[0-9]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::is_site_verified_and_token',
				'permission_callback' => __CLASS__ . '::update_settings_permission_check',
			)
		);

		// Site Verify: tell a service to verify the site.
		register_rest_route(
			'jetpack/v4',
			'/verify-site/(?P<service>[a-z\-_]+)',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::verify_site',
				'permission_callback' => __CLASS__ . '::update_settings_permission_check',
				'args'                => array(
					'keyring_id' => array(
						'required'          => true,
						'type'              => 'integer',
						'validate_callback' => __CLASS__ . '::validate_posint',
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/recommendations/data',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_recommendations_data',
					'permission_callback' => __CLASS__ . '::update_settings_permission_check',
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => __CLASS__ . '::update_recommendations_data',
					'permission_callback' => __CLASS__ . '::update_settings_permission_check',
					'args'                => array(
						'data' => array(
							'required'          => true,
							'type'              => 'object',
							'validate_callback' => __CLASS__ . '::validate_recommendations_data',
						),
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/recommendations/step',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_recommendations_step',
					'permission_callback' => __CLASS__ . '::update_settings_permission_check',
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => __CLASS__ . '::update_recommendations_step',
					'permission_callback' => __CLASS__ . '::update_settings_permission_check',
					'args'                => array(
						'step' => array(
							'required'          => true,
							'type'              => 'string',
							'validate_callback' => __CLASS__ . '::validate_string',
						),
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/recommendations/product-suggestions',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_recommendations_product_suggestions',
					'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/recommendations/upsell',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_recommendations_upsell',
					'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/recommendations/conditional',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_conditional_recommendations',
					'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
				),
			)
		);

		// Get site discount.
		register_rest_route(
			'jetpack/v4',
			'/site/discount',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_discount',
				'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
			)
		);

		/*
		 * Manage the Jetpack CRM plugin's integration with Jetpack contact forms.
		 */
		register_rest_route(
			'jetpack/v4',
			'jetpack_crm',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_jetpack_crm_data',
					'permission_callback' => __CLASS__ . '::jetpack_crm_data_permission_check',
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => __CLASS__ . '::activate_crm_jetpack_forms_extension',
					'permission_callback' => __CLASS__ . '::activate_crm_extensions_permission_check',
					'args'                => array(
						'extension' => array(
							'required' => true,
							'type'     => 'text',
						),
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'purchase-token',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_purchase_token',
					'permission_callback' => __CLASS__ . '::purchase_token_permission_check',
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => __CLASS__ . '::delete_purchase_token',
					'permission_callback' => __CLASS__ . '::purchase_token_permission_check',
				),
			)
		);

		/*
		 * Set the Jetpack Option `has_see_wc_connection_modal` to true
		 */
		register_rest_route(
			'jetpack/v4',
			'seen-wc-connection-modal',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::set_has_seen_wc_connection_modal',
				'permission_callback' => __CLASS__ . '::manage_modules_permission_check',
			)
		);

		// Get Jetpack introduction offers
		register_rest_route(
			'jetpack/v4',
			'/intro-offers',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_intro_offers',
				'permission_callback' => __CLASS__ . '::view_admin_page_permission_check',
			)
		);

		// Save subscriber token and redirect
		register_rest_route(
			'jetpack/v4',
			'/subscribers/auth',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::set_subscriber_cookie_and_redirect',
				'permission_callback' => '__return_true',
				'args'                => array(
					'redirect_url' => array(
						'required'          => true,
						'description'       => __( 'The URL to redirect to.', 'jetpack' ),
						'validate_callback' => 'wp_http_validate_url',
						'sanitize_callback' => 'sanitize_url',
						'type'              => 'string',
						'format'            => 'uri',
					),
				),
			)
		);

		/**
		 * Get the list of available Jetpack features.
		 *
		 * @since 13.9
		 */
		register_rest_route(
			'jetpack/v4',
			'/features/available',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( static::class, 'get_features_available' ),
				'permission_callback' => array( static::class, 'get_features_permission_check' ),
			)
		);

		/**
		 * Get the list of enabled Jetpack features.
		 *
		 * @since 13.9
		 */
		register_rest_route(
			'jetpack/v4',
			'/features/enabled',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( static::class, 'get_features_enabled' ),
				'permission_callback' => array( static::class, 'get_features_permission_check' ),
			)
		);
	}

	/**
	 * Ask WPCOM for a JWT token to use for OpenAI conversations.
	 * TODO: Clean me up. This is ugly hack code.
	 */
	public static function get_openai_jwt() {
		$blog_id = \Jetpack_Options::get_option( 'id' );

		$response = \Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			"/sites/$blog_id/jetpack-openai-query/jwt",
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json; charset=utf-8' ),
			),
			wp_json_encode( array() ),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$json = json_decode( wp_remote_retrieve_body( $response ) );

		if ( ! isset( $json->token ) ) {
			return new WP_Error( 'no-token', 'No token returned from WPCOM' );
		}

		return array(
			'token'   => $json->token,
			'blog_id' => $blog_id,
		);
	}

	/**
	 * Set subscriber cookie and redirect
	 *
	 * @param \WP_Rest_Request $request The URL to redirect to.
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public static function set_subscriber_cookie_and_redirect( $request ) {
		require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
		$subscription_service = \Automattic\Jetpack\Extensions\Premium_Content\subscription_service();
		$token                = $subscription_service->get_and_set_token_from_request();
		$payload              = $subscription_service->decode_token( $token );
		$is_valid_token       = ! empty( $payload );
		if ( $is_valid_token ) {
			return new WP_REST_Response( null, 302, array( 'location' => $request['redirect_url'] ) );
		}
		return new WP_Error( 'invalid-token', 'Invalid Token' );
	}

	/**
	 * Get the data for the recommendations
	 *
	 * @return array Recommendations data
	 */
	public static function get_recommendations_data() {
		return Jetpack_Recommendations::get_recommendations_data();
	}

	/**
	 * Update the data for the recommendations
	 *
	 * @param WP_REST_Request $request The request.
	 *
	 * @return bool true
	 */
	public static function update_recommendations_data( $request ) {
		$data = $request['data'];
		Jetpack_Recommendations::update_recommendations_data( $data );

		return true;
	}

	/**
	 * Get the data for the recommendations
	 *
	 * @return array Recommendations data
	 */
	public static function get_recommendations_step() {
		return Jetpack_Recommendations::get_recommendations_step();
	}

	/**
	 * Update the step for the recommendations
	 *
	 * @param WP_REST_Request $request The request.
	 *
	 * @return bool true
	 */
	public static function update_recommendations_step( $request ) {
		$step = $request['step'];
		Jetpack_Recommendations::update_recommendations_step( $step );

		return true;
	}

	/**
	 * Get product suggestions for the recommendations
	 *
	 * @return string|WP_Error The response from the wpcom product suggestions endpoint as a JSON object.
	 */
	public static function get_recommendations_product_suggestions() {
		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site_not_registered', esc_html__( 'Site not registered.', 'jetpack' ) );
		}

		$user_connected = ( new Connection_Manager( 'jetpack' ) )->is_user_connected( get_current_user_id() );
		if ( ! $user_connected ) {
			return wp_json_encode( array() );
		}

		$request_path  = sprintf( '/sites/%s/jetpack-recommendations/product-suggestions?locale=' . get_user_locale(), $blog_id );
		$wpcom_request = Client::wpcom_json_api_request_as_user(
			$request_path,
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 === $response_code ) {
			return json_decode( wp_remote_retrieve_body( $wpcom_request ) );
		} else {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => $response_code )
			);
		}
	}

	/**
	 * Get the upsell for the recommendations
	 *
	 * @return string The response from the wpcom upsell endpoint as a JSON object
	 */
	public static function get_recommendations_upsell() {
		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site_not_registered', esc_html__( 'Site not registered.', 'jetpack' ) );
		}

		$user_connected = ( new Connection_Manager( 'jetpack' ) )->is_user_connected( get_current_user_id() );
		if ( ! $user_connected ) {
			$response = array(
				'hide_upsell' => true,
			);

			return $response;
		}

		$request_path  = sprintf( '/sites/%s/jetpack-recommendations/upsell?locale=' . get_user_locale(), $blog_id );
		$wpcom_request = Client::wpcom_json_api_request_as_user(
			$request_path,
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 === $response_code ) {
			return json_decode( wp_remote_retrieve_body( $wpcom_request ) );
		} else {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => $response_code )
			);
		}
	}

	/**
	 * Get conditional recommendations data.
	 *
	 * @return array Conditional recommendations data.
	 */
	public static function get_conditional_recommendations() {
		return Jetpack_Recommendations::get_conditional_recommendations();
	}

	/**
	 * Validate the recommendations data
	 *
	 * @param array           $value Value to check received by request.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_recommendations_data( $value, $request, $param ) {
		if ( ! is_array( $value ) ) {
			/* translators: Name of a parameter that must be an object */
			return new WP_Error( 'invalid_param', sprintf( esc_html__( '%s must be an object.', 'jetpack' ), $param ) );
		}

		foreach ( $value as $answer ) {
			if ( is_array( $answer ) ) {
				$validate = self::validate_array_of_strings( $answer, $request, $param );
			} elseif ( is_string( $answer ) ) {
				$validate = self::validate_string( $answer, $request, $param );
			} elseif ( $answer === null ) {
				$validate = true;
			} else {
				$validate = self::validate_boolean( $answer, $request, $param );
			}

			if ( is_wp_error( $validate ) ) {
				return $validate;
			}
		}

		return true;
	}

	/**
	 * Return a purchase token used for site-connected (non user-authenticated) checkout.
	 *
	 * @return string|WP_Error The current purchase token or WP_Error with error details.
	 */
	public static function get_purchase_token() {
		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site_not_registered', esc_html__( 'Site not registered.', 'jetpack' ) );
		}

		return Jetpack_Options::get_option( 'purchase_token', '' );
	}

	/**
	 * Delete the current purchase token.
	 *
	 * @return boolean|WP_Error Whether the token was deleted or WP_Error with error details.
	 */
	public static function delete_purchase_token() {
		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site_not_registered', esc_html__( 'Site not registered.', 'jetpack' ) );
		}

		return Jetpack_Options::delete_option( 'purchase_token' );
	}

	/**
	 * Get list of Jetpack Plans.
	 *
	 * @param WP_REST_Request $request The request.
	 */
	public static function get_plans( $request ) {
		$request = Client::wpcom_json_api_request_as_user(
			'/plans?_locale=' . get_user_locale(),
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		$body = json_decode( wp_remote_retrieve_body( $request ) );
		if ( 200 === wp_remote_retrieve_response_code( $request ) ) {
			$data = $body;
		} else {
			// something went wrong so we'll just return the response without caching.
			return $body;
		}

		return $data;
	}

	/**
	 * Gets the WP.com products that are in use on wpcom.
	 * Similar to the WP.com plans that we currently in user on WPCOM.
	 *
	 * @param WP_REST_Request $request The request.
	 *
	 * @return string|WP_Error A JSON object of wpcom products if the request was successful, or a WP_Error otherwise.
	 */
	public static function get_products( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$wpcom_request = Client::wpcom_json_api_request_as_user(
			'/products?_locale=' . get_user_locale() . '&type=jetpack',
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 === $response_code ) {
			return json_decode( wp_remote_retrieve_body( $wpcom_request ) );
		} else {
			// Something went wrong so we'll just return the response without caching.
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => $response_code )
			);
		}
	}

	/**
	 * Send Survey details to WordPress.com.
	 *
	 * @param WP_REST_Request $request The request.
	 */
	public static function submit_survey( $request ) {
		$wpcom_request = Client::wpcom_json_api_request_as_user(
			'/marketing/survey',
			'v2',
			array(
				'method'  => 'POST',
				'headers' => array(
					'Content-Type'    => 'application/json',
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			),
			$request->get_json_params()
		);

		$wpcom_request_body = json_decode( wp_remote_retrieve_body( $wpcom_request ) );
		if ( 200 === wp_remote_retrieve_response_code( $wpcom_request ) ) {
			$data = $wpcom_request_body;
		} else {
			// something went wrong so we'll just return the response without caching.
			return $wpcom_request_body;
		}

		return $data;
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
	 * @return array|WP_Error
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
			|| Jetpack::is_plugin_active( 'mojo-under-construction/mojo-contruction.php' ) && 1 == $under_construction_activation_status // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
			|| ( Jetpack::is_plugin_active( 'under-construction-page/under-construction.php' ) && isset( $ucp_options['status'] ) && 1 == $ucp_options['status'] ) // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
			|| ( Jetpack::is_plugin_active( 'ultimate-under-construction/ultimate-under-construction.php' ) && isset( $uuc_settings['enable'] ) && 1 == $uuc_settings['enable'] ) // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
			|| ( Jetpack::is_plugin_active( 'coming-soon/coming-soon.php' ) && isset( $csp4['status'] ) && ( 1 == $csp4['status'] || 2 == $csp4['status'] ) ) // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
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

		$xml = new Jetpack_IXR_Client(
			array(
				'user_id' => get_current_user_id(),
			)
		);

		$args = array(
			'user_id' => get_current_user_id(),
			'service' => $request['service'],
		);

		if ( isset( $request['keyring_id'] ) ) {
			$args['keyring_id'] = $request['keyring_id'];
		}

		$xml->query( 'jetpack.isSiteVerified', $args );

		if ( $xml->isError() ) {
			return new WP_Error( 'error_checking_if_site_verified_google', sprintf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() ) );
		} else {
			return $xml->getResponse();
		}
	}

	/**
	 * Verify site with external service.
	 *
	 * @param WP_REST_Request $request The request.
	 */
	public static function verify_site( $request ) {
		$xml = new Jetpack_IXR_Client(
			array(
				'user_id' => get_current_user_id(),
			)
		);

		$params = $request->get_json_params();

		$xml->query(
			'jetpack.verifySite',
			array(
				'user_id'    => get_current_user_id(),
				'service'    => $request['service'],
				'keyring_id' => $params['keyring_id'],
			)
		);

		if ( $xml->isError() ) {
			return new WP_Error( 'error_verifying_site_google', sprintf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() ) );
		} else {
			$response = $xml->getResponse();

			if ( ! empty( $response['errors'] ) ) {
				$error         = new WP_Error();
				$error->errors = $response['errors'];
				return $error;
			}

			return $response;
		}
	}

	/**
	 * Handles dismissing of Jetpack Notices
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array|WP_Error
	 */
	public static function dismiss_notice( $request ) {
		$notice = $request['notice'];

		if ( ! isset( $request['dismissed'] ) || true !== $request['dismissed'] ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Invalid parameter "dismissed".', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( isset( $notice ) && ! empty( $notice ) ) {
			switch ( $notice ) {
				case 'feedback_dash_request':
				case 'welcome':
					$notices            = get_option( 'jetpack_dismissed_notices', array() );
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

		return new WP_Error(
			'invalid_user_permission_jetpack_disconnect',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
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

		return new WP_Error(
			'invalid_user_permission_jetpack_connect',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Verify that a user can use the /connection/user endpoint. Has to be a registered user and be currently linked.
	 *
	 * @since 4.3.0
	 *
	 * @uses Automattic\Jetpack\Connection\Manager::is_user_connected();)
	 *
	 * @return bool|WP_Error True if user is able to unlink.
	 */
	public static function unlink_user_permission_callback() {
		if ( current_user_can( 'jetpack_connect_user' ) && ( new Connection_Manager( 'jetpack' ) )->is_user_connected( get_current_user_id() ) ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_unlink_user',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
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

		return new WP_Error(
			'invalid_user_permission_manage_modules',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
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

		return new WP_Error(
			'invalid_user_permission_configure_modules',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
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

		return new WP_Error(
			'invalid_user_permission_view_admin',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
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

		return new WP_Error(
			'invalid_user_permission_manage_settings',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
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

		return new WP_Error(
			'invalid_user_permission_activate_plugins',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
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

		return new WP_Error(
			'invalid_user_permission_edit_others_posts',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Verify that site can view and delete the site's purchase token.
	 *
	 * @return bool Whether site has level-site auth or user has the capability 'manage_options'.
	 */
	public static function purchase_token_permission_check() {
		if ( Rest_Authentication::is_signed_with_blog_token() ) {
			return true;
		}

		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		return new WP_Error(
			'invalid_permission_manage_purchase_token',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
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
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/debugger.php';
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
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- This is verifying the trusted caller via a shared private key and timestamp.
		if ( ! isset( $_GET['signature'] ) || ! isset( $_GET['timestamp'] ) || ! isset( $_GET['url'] ) ) {
			return false;
		}
		$signature = base64_decode( wp_unslash( $_GET['signature'] ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		$signature_data = wp_json_encode(
			array(
				'rest_route' => isset( $_GET['rest_route'] ) ? filter_var( wp_unslash( $_GET['rest_route'] ) ) : null,
				'timestamp'  => (int) $_GET['timestamp'],
				'url'        => esc_url_raw( wp_unslash( $_GET['url'] ) ),
			)
		);

		if (
			! function_exists( 'openssl_verify' )
			|| 1 !== openssl_verify(
				$signature_data,
				$signature,
				JETPACK__DEBUGGER_PUBLIC_KEY
			)
		) {
			return false;
		}

		// signature timestamp must be within 5min of current time.
		if ( abs( time() - (int) $_GET['timestamp'] ) > 300 ) {
			return false;
		}

		// phpcs:enable WordPress.Security.NonceVerification.Recommended

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
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/debugger.php';
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

			$result = ( ! empty( $errors ) ) ? $errors[0] : null;
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
				'debug' => $encrypted,
			)
		);
	}

	/**
	 * Fetch information about the Rewind status of the site.
	 */
	public static function rewind_data() {
		$site_id = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			return new WP_Error( 'site_id_missing' );
		}

		if ( ! isset( $_GET['_cacheBuster'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$rewind_state = get_transient( 'jetpack_rewind_state' );
			if ( $rewind_state ) {
				return $rewind_state;
			}
		}

		$response = Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d/rewind', $site_id ) . '?force=wpcom', '2', array(), null, 'wpcom' );

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'rewind_data_fetch_failed' );
		}

		$body   = wp_remote_retrieve_body( $response );
		$result = json_decode( $body );
		set_transient( 'jetpack_rewind_state', $result, 30 * MINUTE_IN_SECONDS );

		return $result;
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
			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => esc_html__( 'Backup & Scan data correctly received.', 'jetpack' ),
					'data'    => wp_json_encode( $rewind_data ),
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
	 * Gets Scan state data.
	 *
	 * @since 8.5.0
	 *
	 * @return array|WP_Error Result from WPCOM API or error.
	 */
	public static function scan_state() {

		if ( ! isset( $_GET['_cacheBuster'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$scan_state = get_transient( 'jetpack_scan_state' );
			if ( ! empty( $scan_state ) ) {
				return $scan_state;
			}
		}
		$site_id = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			return new WP_Error( 'site_id_missing' );
		}
		// The default timeout was too short in come cases.
		add_filter( 'http_request_timeout', array( __CLASS__, 'increase_timeout_30' ), PHP_INT_MAX - 1 );
		$response = Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d/scan', $site_id ) . '?force=wpcom', '2', array(), null, 'wpcom' );
		remove_filter( 'http_request_timeout', array( __CLASS__, 'increase_timeout_30' ), PHP_INT_MAX - 1 );

		if ( wp_remote_retrieve_response_code( $response ) !== 200 ) {
			return new WP_Error( 'scan_state_fetch_failed' );
		}

		$body   = wp_remote_retrieve_body( $response );
		$result = json_decode( $body );
		set_transient( 'jetpack_scan_state', $result, 30 * MINUTE_IN_SECONDS );

		return $result;
	}

	/**
	 * Increases the request timeout value to 30 seconds.
	 *
	 * @return int Always returns 30.
	 */
	public static function increase_timeout_30() {
		return 30; // 30 Seconds
	}

	/**
	 * Get Scan state for API.
	 *
	 * @since 8.5.0
	 *
	 * @return WP_REST_Response|WP_Error REST response or error state.
	 */
	public static function get_scan_state() {
		$scan_state = self::scan_state();

		if ( ! is_wp_error( $scan_state ) ) {
			if ( ( new Host() )->is_woa_site() && ! empty( $scan_state->threats ) ) {
				$scan_state->threats = array();
			}
			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => esc_html__( 'Scan state correctly received.', 'jetpack' ),
					'data'    => wp_json_encode( $scan_state ),
				)
			);
		}

		if ( $scan_state->get_error_code() === 'scan_state_fetch_failed' ) {
			return new WP_Error( 'scan_state_fetch_failed', esc_html__( 'Failed fetching rewind data. Try again later.', 'jetpack' ), array( 'status' => 400 ) );
		}

		if ( $scan_state->get_error_code() === 'site_id_missing' ) {
			return new WP_Error( 'site_id_missing', esc_html__( 'The ID of this site does not exist.', 'jetpack' ), array( 'status' => 404 ) );
		}

		return new WP_Error(
			'error_get_rewind_data',
			esc_html__( 'Could not retrieve Scan state.', 'jetpack' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Disconnects Jetpack from the WordPress.com Servers
	 *
	 * @deprecated since Jetpack 10.0.0
	 * @see Automattic\Jetpack\Connection\REST_Connector::disconnect_site()
	 *
	 * @uses Jetpack::disconnect();
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return bool|WP_Error True if Jetpack successfully disconnected.
	 */
	public static function disconnect_site( $request ) {
		_deprecated_function( __METHOD__, 'jetpack-10.0.0', '\Automattic\Jetpack\Connection\REST_Connector::disconnect_site' );

		if ( ! isset( $request['isActive'] ) || false !== $request['isActive'] ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Invalid Parameter', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( Jetpack::is_connection_ready() ) {
			Jetpack::disconnect();
			return rest_ensure_response( array( 'code' => 'success' ) );
		}

		return new WP_Error( 'disconnect_failed', esc_html__( 'Was not able to disconnect the site. Please try again.', 'jetpack' ), array( 'status' => 400 ) );
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
	public static function build_connect_url( $request = array() ) {
		$from     = isset( $request['from'] ) ? $request['from'] : false;
		$redirect = isset( $request['redirect'] ) ? $request['redirect'] : false;

		$url = Jetpack::init()->build_connect_url( true, $redirect, $from );
		if ( $url ) {
			return rest_ensure_response( $url );
		}

		return new WP_Error( 'build_connect_url_failed', esc_html__( 'Unable to build the connect URL. Please reload the page and try again.', 'jetpack' ), array( 'status' => 400 ) );
	}

	/**
	 * Get miscellaneous user data related to the connection. Similar data available in old "My Jetpack".
	 * Information about the master/primary user.
	 * Information about the current user.
	 *
	 * @deprecated since Jetpack 10.0.0
	 * @see Automattic\Jetpack\Connection\REST_Connector::get_user_connection_data()
	 *
	 * @since 4.3.0
	 *
	 * @return object
	 */
	public static function get_user_connection_data() {
		_deprecated_function( __METHOD__, 'jetpack-10.0.0', '\Automattic\Jetpack\Connection\REST_Connector::get_user_connection_data' );

		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class.jetpack-react-page.php';

		$connection_owner   = ( new Connection_Manager() )->get_connection_owner();
		$owner_display_name = false === $connection_owner ? null : $connection_owner->data->display_name;

		$response = array(
			'currentUser'     => jetpack_current_user_data(),
			'connectionOwner' => $owner_display_name,
		);
		return rest_ensure_response( $response );
	}

	/**
	 * Unlinks current user from the WordPress.com Servers.
	 *
	 * @since 4.3.0
	 * @uses  Automattic\Jetpack\Connection\Manager->disconnect_user
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return bool|WP_Error True if user successfully unlinked.
	 */
	public static function unlink_user( $request ) {

		if ( ! isset( $request['linked'] ) || false !== $request['linked'] ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Invalid Parameter', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( ( new Connection_Manager( 'jetpack' ) )->disconnect_user() ) {
			return rest_ensure_response(
				array(
					'code' => 'success',
				)
			);
		}

		return new WP_Error( 'unlink_user_failed', esc_html__( 'Was not able to unlink the user. Please try again.', 'jetpack' ), array( 'status' => 400 ) );
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
	public static function get_user_tracking_settings( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! ( new Connection_Manager( 'jetpack' ) )->is_user_connected() ) {
			$response = array(
				'tracks_opt_out' => true, // Default to opt-out if not connected to wp.com.
			);
		} else {
			$response = Client::wpcom_json_api_request_as_user(
				'/jetpack-user-tracking',
				'v2',
				array(
					'method'  => 'GET',
					'headers' => array(
						'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
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
		if ( ! ( new Connection_Manager( 'jetpack' ) )->is_user_connected() ) {
			$response = array(
				'tracks_opt_out' => true, // Default to opt-out if not connected to wp.com.
			);
		} else {
			$response = Client::wpcom_json_api_request_as_user(
				'/jetpack-user-tracking',
				'v2',
				array(
					'method'  => 'PUT',
					'headers' => array(
						'Content-Type'    => 'application/json',
						'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
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
	 * Fetch site data from .com including the site's current plan and the site's products.
	 *
	 * @since 5.5.0
	 *
	 * @return stdClass|WP_Error
	 */
	public static function site_data() {
		$site_id = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			return new WP_Error( 'site_id_missing', '', array( 'api_error_code' => __( 'site_id_missing', 'jetpack' ) ) );
		}

		$args = array( 'headers' => array() );

		// Allow use a store sandbox. Internal ref: PCYsg-IA-p2.
		if ( isset( $_COOKIE ) && isset( $_COOKIE['store_sandbox'] ) ) {
			$secret                    = filter_var( wp_unslash( $_COOKIE['store_sandbox'] ) );
			$args['headers']['Cookie'] = "store_sandbox=$secret;";
		}

		$response = Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d', $site_id ) . '?force=wpcom', '1.1', $args );
		$body     = wp_remote_retrieve_body( $response );
		$data     = $body ? json_decode( $body ) : null;

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			$error_info = array(
				'api_error_code' => null,
				'api_http_code'  => wp_remote_retrieve_response_code( $response ),
			);

			if ( is_wp_error( $response ) ) {
				$error_info['api_error_code'] = $response->get_error_code() ? wp_strip_all_tags( $response->get_error_code() ) : null;
			} elseif ( $data && ! empty( $data->error ) ) {
				$error_info['api_error_code'] = $data->error;
			}

			return new WP_Error( 'site_data_fetch_failed', '', $error_info );
		}

		Jetpack_Plan::update_from_sites_response( $response );

		return $data;
	}
	/**
	 * Get site data, including for example, the site's current plan.
	 *
	 * @return WP_Error|WP_HTTP_Response|WP_REST_Response
	 * @since 4.3.0
	 */
	public static function get_site_data() {
		$site_data = self::site_data();

		if ( ! is_wp_error( $site_data ) ) {

			/**
			 * Fires when the site data was successfully returned from the /sites/%d wpcom endpoint.
			 *
			 * @since 8.7.0
			 */
			do_action( 'jetpack_get_site_data_success' );
			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => esc_html__( 'Site data correctly received.', 'jetpack' ),
					'data'    => wp_json_encode( $site_data ),
				)
			);
		}

		$error_data = $site_data->get_error_data();

		if ( empty( $error_data['api_error_code'] ) ) {
			$error_message = esc_html__( 'Failed fetching site data from WordPress.com. If the problem persists, try reconnecting Jetpack.', 'jetpack' );
		} else {
			/* translators: %s is an error code (e.g. `token_mismatch`) */
			$error_message = sprintf( esc_html__( 'Failed fetching site data from WordPress.com (%s). If the problem persists, try reconnecting Jetpack.', 'jetpack' ), $error_data['api_error_code'] );
		}

		return new WP_Error(
			$site_data->get_error_code(),
			$error_message,
			array(
				'status'         => 400,
				'api_error_code' => empty( $error_data['api_error_code'] ) ? null : $error_data['api_error_code'],
				'api_http_code'  => empty( $error_data['api_http_code'] ) ? null : $error_data['api_http_code'],
			)
		);
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

		$response      = Client::wpcom_json_api_request_as_user(
			"/sites/$site_id/activity",
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			),
			null,
			'wpcom'
		);
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
				array( 'status' => 204 ) // no content.
			);
		}

		return rest_ensure_response(
			array(
				'code' => 'success',
				'data' => $data->current->orderedItems,
			)
		);
	}

	/**
	 * Fetch the discount for this site and return it.
	 *
	 * @since 10.8
	 *
	 * @return array|WP_Error
	 */
	public static function get_site_discount() {
		$site_id = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			return new WP_Error(
				'site_id_missing',
				esc_html__( 'Site ID is missing.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$response = Client::wpcom_json_api_request_as_user(
			"/sites/$site_id/discount",
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		$response_code = wp_remote_retrieve_response_code( $response );
		$data          = json_decode( wp_remote_retrieve_body( $response ) );

		if ( 200 !== $response_code ) {
			return new WP_Error(
				'discount_fetch_failed',
				is_object( $data ) && property_exists( $data, 'error' ) ? $data->error : esc_html__( 'Could not retrieve site discount.', 'jetpack' ),
				array( 'status' => $response_code )
			);
		}

		if ( ! isset( $data ) ) {
			return new WP_Error(
				'discount_parse_error',
				esc_html__( 'Could not parse discount', 'jetpack' ),
				array( 'status' => 204 ) // no content.
			);
		}

		return rest_ensure_response(
			array(
				'code' => 'success',
				'data' => $data,
			)
		);
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

		if ( ! isset( $request['reset'] ) || true !== $request['reset'] ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Invalid Parameter', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( isset( $request['options'] ) ) {
			$data    = $request['options'];
			$message = '';

			switch ( $data ) {
				case ( 'options' ):
					$options_to_reset = Jetpack::get_jetpack_options_for_reset();

					// Reset the Jetpack options.
					foreach ( $options_to_reset['jp_options'] as $option_to_reset ) {
						Jetpack_Options::delete_option( $option_to_reset );
					}

					foreach ( $options_to_reset['wp_options'] as $option_to_reset ) {
						delete_option( $option_to_reset );
					}

					// Reset to default modules.
					$default_modules = Jetpack::get_default_modules();
					Jetpack::update_active_modules( $default_modules );
					$message = esc_html__( 'Jetpack options reset.', 'jetpack' );

					break;
				case 'modules':
					$default_modules = Jetpack::get_default_modules();
					Jetpack::update_active_modules( $default_modules );
					$message = esc_html__( 'Modules reset to default.', 'jetpack' );

					break;
				default:
					return new WP_Error( 'invalid_param', esc_html__( 'Invalid Parameter', 'jetpack' ), array( 'status' => 404 ) );
			}

			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => $message,
				)
			);
		}

		return new WP_Error( 'required_param', esc_html__( 'Missing parameter "type".', 'jetpack' ), array( 'status' => 404 ) );
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
			'context' => array(
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
			// Blocks.
			'jetpack_blocks_disabled'                   => array(
				'description'       => esc_html__( 'Jetpack Blocks disabled.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => false,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'settings',
			),

			// Carousel
			'carousel_background_color'                 => array(
				'description'       => esc_html__( 'Color scheme.', 'jetpack' ),
				'type'              => 'string',
				'default'           => 'black',
				'enum'              => array(
					'black',
					'white',
				),
				'enum_labels'       => array(
					'black' => esc_html__( 'Black', 'jetpack' ),
					'white' => esc_html__( 'White', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'carousel',
			),
			'carousel_display_exif'                     => array(
				'description'       => wp_kses(
					sprintf( __( 'Show photo metadata (<a href="https://en.wikipedia.org/wiki/Exchangeable_image_file_format" target="_blank">Exif</a>) in carousel, when available.', 'jetpack' ) ),
					array(
						'a' => array(
							'href'   => true,
							'target' => true,
						),
					)
				),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'carousel',
			),
			'carousel_display_comments'                 => array(
				'description'       => esc_html__( 'Show comments area in carousel', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'carousel',
			),

			// Comments.
			'highlander_comment_form_prompt'            => array(
				'description'       => esc_html__( 'Greeting Text', 'jetpack' ),
				'type'              => 'string',
				'default'           => esc_html__( 'Leave a Reply', 'jetpack' ),
				'sanitize_callback' => 'sanitize_text_field',
				'jp_group'          => 'comments',
			),
			'jetpack_comment_form_color_scheme'         => array(
				'description'       => esc_html__( 'Color scheme', 'jetpack' ),
				'type'              => 'string',
				'default'           => 'light',
				'enum'              => array(
					'light',
					'dark',
					'transparent',
				),
				'enum_labels'       => array(
					'light'       => esc_html__( 'Light', 'jetpack' ),
					'dark'        => esc_html__( 'Dark', 'jetpack' ),
					'transparent' => esc_html__( 'Transparent', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'comments',
			),

			// Custom Content Types.
			'jetpack_portfolio'                         => array(
				'description'       => esc_html__( 'Enable or disable Jetpack portfolio post type.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'custom-content-types',
			),
			'jetpack_portfolio_posts_per_page'          => array(
				'description'       => esc_html__( 'Number of entries to show at most in Portfolio pages.', 'jetpack' ),
				'type'              => 'integer',
				'default'           => 10,
				'validate_callback' => __CLASS__ . '::validate_posint',
				'jp_group'          => 'custom-content-types',
			),
			'jetpack_testimonial'                       => array(
				'description'       => esc_html__( 'Enable or disable Jetpack testimonial post type.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'custom-content-types',
			),
			'jetpack_testimonial_posts_per_page'        => array(
				'description'       => esc_html__( 'Number of entries to show at most in Testimonial pages.', 'jetpack' ),
				'type'              => 'integer',
				'default'           => 10,
				'validate_callback' => __CLASS__ . '::validate_posint',
				'jp_group'          => 'custom-content-types',
			),

			// WAF.
			'jetpack_waf_automatic_rules'               => array(
				'description'       => esc_html__( 'Enable automatic rules - Protect your site against untrusted traffic sources with automatic security rules.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => Waf_Compatibility::get_default_automatic_rules_option(),
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'waf',
			),
			'jetpack_waf_ip_block_list_enabled'         => array(
				'description'       => esc_html__( 'Block list - Block a specific request IP.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'waf',
			),
			'jetpack_waf_ip_block_list'                 => array(
				'description'       => esc_html__( 'Blocked IP addresses', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_string',
				'sanitize_callback' => 'esc_textarea',
				'jp_group'          => 'waf',
			),
			'jetpack_waf_ip_allow_list_enabled'         => array(
				'description'       => esc_html__( 'Allow list - Allow a specific request IP.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'settings',
			),
			'jetpack_waf_ip_allow_list'                 => array(
				'description'       => esc_html__( 'Always allowed IP addresses', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_string',
				'sanitize_callback' => 'esc_textarea',
				'jp_group'          => 'settings',
			),
			'jetpack_waf_share_data'                    => array(
				'description'       => esc_html__( 'Share basic data with Jetpack.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'waf',
			),
			'jetpack_waf_share_debug_data'              => array(
				'description'       => esc_html__( 'Share detailed data with Jetpack.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'waf',
			),
			// Galleries.
			'tiled_galleries'                           => array(
				'description'       => esc_html__( 'Display all your gallery pictures in a cool mosaic.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'tiled-gallery',
			),

			'gravatar_disable_hovercards'               => array(
				'description'       => esc_html__( "View people's profiles when you mouse over their Gravatars", 'jetpack' ),
				'type'              => 'string',
				'default'           => 'enabled',
				// Not visible. This is used as the checkbox value.
				'enum'              => array(
					'enabled',
					'disabled',
				),
				'enum_labels'       => array(
					'enabled'  => esc_html__( 'Enabled', 'jetpack' ),
					'disabled' => esc_html__( 'Disabled', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'gravatar-hovercards',
			),

			// Infinite Scroll.
			'infinite_scroll'                           => array(
				'description'       => esc_html__( 'To infinity and beyond', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'infinite-scroll',
			),
			'infinite_scroll_google_analytics'          => array(
				'description'       => esc_html__( 'Use Google Analytics with Infinite Scroll', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'infinite-scroll',
			),

			// Likes.
			'wpl_default'                               => array(
				'description'       => esc_html__( 'WordPress.com Likes are', 'jetpack' ),
				'type'              => 'string',
				'default'           => 'on',
				'enum'              => array(
					'on',
					'off',
				),
				'enum_labels'       => array(
					'on'  => esc_html__( 'On for all posts', 'jetpack' ),
					'off' => esc_html__( 'Turned on per post', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'likes',
			),
			'social_notifications_like'                 => array(
				'description'       => esc_html__( 'Send email notification when someone likes a post', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'likes',
			),

			// Markdown.
			'wpcom_publish_comments_with_markdown'      => array(
				'description'       => esc_html__( 'Use Markdown for comments.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'markdown',
			),
			'wpcom_publish_posts_with_markdown'         => array(
				'description'       => esc_html__( 'Use Markdown for posts.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'markdown',
			),

			// Monitor.
			'monitor_receive_notifications'             => array(
				'description'       => esc_html__( 'Receive Monitor Email Notifications.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'monitor',
			),

			// Post by Email.
			'post_by_email_address'                     => array(
				'description'       => esc_html__( 'Email Address', 'jetpack' ),
				'type'              => 'string',
				'default'           => 'noop',
				'enum'              => array(
					'noop',
					'create',
					'regenerate',
					'delete',
				),
				'enum_labels'       => array(
					'noop'       => '',
					'create'     => esc_html__( 'Create Post by Email address', 'jetpack' ),
					'regenerate' => esc_html__( 'Regenerate Post by Email address', 'jetpack' ),
					'delete'     => esc_html__( 'Delete Post by Email address', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'post-by-email',
			),

			// Protect.
			'jetpack_protect_key'                       => array(
				'description'       => esc_html__( 'Protect API key', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_alphanum',
				'jp_group'          => 'protect',
			),
			'jetpack_protect_global_whitelist'          => array(
				'description'       => esc_html__( 'Protect global IP allow list', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_string',
				'sanitize_callback' => 'esc_textarea',
				'jp_group'          => 'protect',
			),

			// Sharing.
			'sharing_services'                          => array(
				'description'       => esc_html__( 'Enabled Services and those hidden behind a button', 'jetpack' ),
				'type'              => 'object',
				'default'           => array(
					'visible' => array( 'facebook', 'x' ),
					'hidden'  => array(),
				),
				'validate_callback' => __CLASS__ . '::validate_services',
				'jp_group'          => 'sharedaddy',
			),
			'button_style'                              => array(
				'description'       => esc_html__( 'Button Style', 'jetpack' ),
				'type'              => 'string',
				'default'           => 'icon',
				'enum'              => array(
					'icon-text',
					'icon',
					'text',
					'official',
				),
				'enum_labels'       => array(
					'icon-text' => esc_html__( 'Icon + text', 'jetpack' ),
					'icon'      => esc_html__( 'Icon only', 'jetpack' ),
					'text'      => esc_html__( 'Text only', 'jetpack' ),
					'official'  => esc_html__( 'Official buttons', 'jetpack' ),
				),
				'validate_callback' => __CLASS__ . '::validate_list_item',
				'jp_group'          => 'sharedaddy',
			),
			'sharing_label'                             => array(
				'description'       => esc_html__( 'Sharing Label', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_string',
				'sanitize_callback' => 'esc_html',
				'jp_group'          => 'sharedaddy',
			),
			'show'                                      => array(
				'description'       => esc_html__( 'Views where buttons are shown', 'jetpack' ),
				'type'              => 'array',
				'items'             => array(
					'type' => 'string',
				),
				'default'           => array( 'post' ),
				'validate_callback' => __CLASS__ . '::validate_sharing_show',
				'jp_group'          => 'sharedaddy',
			),
			'jetpack-twitter-cards-site-tag'            => array(
				'description'       => esc_html__( "The Twitter username of the owner of this site's domain.", 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_twitter_username',
				'sanitize_callback' => 'esc_html',
				'jp_group'          => 'sharedaddy',
			),
			'sharedaddy_disable_resources'              => array(
				'description'       => esc_html__( 'Disable CSS and JS', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'sharedaddy',
			),
			'custom'                                    => array(
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
			// Not an option, but an action that can be performed on the list of custom services passing the service ID.
			'sharing_delete_service'                    => array(
				'description'       => esc_html__( 'Delete custom sharing service.', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_custom_service_id',
				'jp_group'          => 'sharedaddy',
			),

			// SSO.
			'jetpack_sso_require_two_step'              => array(
				'description'       => esc_html__( 'Require Two-Step Authentication', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => SSO\Helpers::is_require_two_step_checkbox_disabled(),
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'sso',
			),
			'jetpack_sso_match_by_email'                => array(
				'description'       => esc_html__( 'Match by Email', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'sso',
			),

			// Subscriptions.
			'stb_enabled'                               => array(
				'description'       => esc_html__( "Show a <em>'follow blog'</em> option in the comment form", 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'stc_enabled'                               => array(
				'description'       => esc_html__( "Show a <em>'follow comments'</em> option in the comment form", 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'wpcom_newsletter_categories'               => array(
				'description'       => esc_html__( 'Array of post category ids that are marked as newsletter categories', 'jetpack' ),
				'type'              => 'array',
				'default'           => array(),
				'validate_callback' => __CLASS__ . '::validate_array',
				'jp_group'          => 'subscriptions',
			),
			'wpcom_newsletter_categories_enabled'       => array(
				'description'       => esc_html__( 'Whether the newsletter categories are enabled or not', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'wpcom_featured_image_in_email'             => array(
				'description'       => esc_html__( 'Whether to include the featured image in the email or not', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'jetpack_gravatar_in_email'                 => array(
				'description'       => esc_html__( 'Whether to show author avatar in the email byline', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'jetpack_author_in_email'                   => array(
				'description'       => esc_html__( 'Whether to show author display name in the email byline', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'jetpack_post_date_in_email'                => array(
				'description'       => esc_html__( 'Whether to show date in the email byline', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'wpcom_subscription_emails_use_excerpt'     => array(
				'description'       => esc_html__( 'Whether to use the excerpt in the email or not', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'jetpack_subscriptions_reply_to'            => array(
				'description'       => esc_html__( 'Reply to email behaviour for newsletters emails', 'jetpack' ),
				'type'              => 'string',
				'default'           => Automattic\Jetpack\Modules\Subscriptions\Settings::$default_reply_to,
				'validate_callback' => __CLASS__ . '::validate_subscriptions_reply_to',
				'jp_group'          => 'subscriptions',
			),
			'jetpack_subscriptions_from_name'           => array(
				'description'       => esc_html__( 'From name for newsletters emails', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_subscriptions_reply_to_name',
				'jp_group'          => 'subscriptions',
			),
			'sm_enabled'                                => array(
				'description'       => esc_html__( 'Show popup Subscribe modal to readers.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'jetpack_subscribe_overlay_enabled'         => array(
				'description'       => esc_html__( 'Show subscribe overlay on homepage.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'jetpack_subscribe_floating_button_enabled' => array(
				'description'       => esc_html__( 'Show a floating subscribe button.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'jetpack_subscriptions_subscribe_post_end_enabled' => array(
				'description'       => esc_html__( 'Add Subscribe block at the end of each post.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'jetpack_subscriptions_login_navigation_enabled' => array(
				'description'       => esc_html__( 'Add Subscriber Login block to the navigation.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'jetpack_subscriptions_subscribe_navigation_enabled' => array(
				'description'       => esc_html__( 'Add Subscribe block to the navigation.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'social_notifications_subscribe'            => array(
				'description'       => esc_html__( 'Send email notification when someone subscribes to my blog', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'subscriptions',
			),
			'subscription_options'                      => array(
				'description'       => esc_html__( 'Three options used in subscription email templates: \'invitation\', \'welcome\' and \'comment_follow\'.', 'jetpack' ),
				'type'              => 'object',
				'default'           => array(
					'invitation'     => '',
					'welcome'        => '',
					'comment_follow' => '',
				),
				'validate_callback' => __CLASS__ . '::validate_subscription_options',
				'jp_group'          => 'subscriptions',
			),

			// Related Posts.
			'show_headline'                             => array(
				'description'       => esc_html__( 'Highlight related content with a heading', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'related-posts',
			),
			'show_thumbnails'                           => array(
				'description'       => esc_html__( 'Show a thumbnail image where available', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'related-posts',
			),

			// Search.
			'instant_search_enabled'                    => array(
				'description'       => esc_html__( 'Enable Instant Search', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'search',
			),

			'has_jetpack_search_product'                => array(
				'description'       => esc_html__( 'Has an active Jetpack Search product purchase', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'settings',
			),

			'search_auto_config'                        => array(
				'description'       => esc_html__( 'Trigger an auto config of instant search', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'search',
			),

			// Verification Tools.
			'google'                                    => array(
				'description'       => esc_html__( 'Google Search Console', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_verification_service',
				'jp_group'          => 'verification-tools',
			),
			'bing'                                      => array(
				'description'       => esc_html__( 'Bing Webmaster Center', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_verification_service',
				'jp_group'          => 'verification-tools',
			),
			'pinterest'                                 => array(
				'description'       => esc_html__( 'Pinterest Site Verification', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_verification_service',
				'jp_group'          => 'verification-tools',
			),
			'yandex'                                    => array(
				'description'       => esc_html__( 'Yandex Site Verification', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_verification_service',
				'jp_group'          => 'verification-tools',
			),
			'facebook'                                  => array(
				'description'       => esc_html__( 'Facebook Domain Verification', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_verification_service',
				'jp_group'          => 'verification-tools',
			),

			// WordAds.
			'enable_header_ad'                          => array(
				'description'       => esc_html__( 'Display an ad unit at the top of each page.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'wordads',
			),
			'wordads_approved'                          => array(
				'description'       => esc_html__( 'Is site approved for WordAds?', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'wordads',
			),
			'wordads_second_belowpost'                  => array(
				'description'       => esc_html__( 'Display second ad below post?', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'wordads',
			),
			'wordads_inline_enabled'                    => array(
				'description'       => esc_html__( 'Display inline ad within post content?', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'wordads',
			),
			'wordads_display_front_page'                => array(
				'description'       => esc_html__( 'Display ads on the front page?', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'wordads',
			),
			'wordads_display_post'                      => array(
				'description'       => esc_html__( 'Display ads on posts?', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'wordads',
			),
			'wordads_display_page'                      => array(
				'description'       => esc_html__( 'Display ads on pages?', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'wordads',
			),
			'wordads_display_archive'                   => array(
				'description'       => esc_html__( 'Display ads on archive pages?', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'wordads',
			),
			'wordads_custom_adstxt_enabled'             => array(
				'description'       => esc_html__( 'Custom ads.txt', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'wordads',
			),
			'wordads_custom_adstxt'                     => array(
				'description'       => esc_html__( 'Custom ads.txt entries', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_string',
				'sanitize_callback' => 'sanitize_textarea_field',
				'jp_group'          => 'wordads',
			),
			'wordads_ccpa_enabled'                      => array(
				'description'       => esc_html__( 'Enable support for California Consumer Privacy Act', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'wordads',
			),
			'wordads_ccpa_privacy_policy_url'           => array(
				'description'       => esc_html__( 'Privacy Policy URL', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_string',
				'sanitize_callback' => 'sanitize_text_field',
				'jp_group'          => 'wordads',
			),
			'wordads_cmp_enabled'                       => array(
				'description'       => esc_html__( 'Enable GDPR Consent Management Banner for WordAds', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'wordads',
			),

			// Google Analytics.
			'google_analytics_tracking_id'              => array(
				'description'       => esc_html__( 'Google Analytics', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_alphanum',
				'jp_group'          => 'google-analytics',
			),

			// Stats.
			'admin_bar'                                 => array(
				'description'       => esc_html__( 'Include a small chart in your admin bar with a 48-hour traffic snapshot.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'stats',
			),
			'enable_odyssey_stats'                      => array(
				'description'       => esc_html__( 'Preview the new Jetpack Stats experience (Experimental).', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'stats',
			),
			'roles'                                     => array(
				'description'       => esc_html__( 'Select the roles that will be able to view stats reports.', 'jetpack' ),
				'type'              => 'array',
				'items'             => array(
					'type' => 'string',
				),
				'default'           => array( 'administrator' ),
				'validate_callback' => __CLASS__ . '::validate_stats_roles',
				'sanitize_callback' => __CLASS__ . '::sanitize_stats_allowed_roles',
				'jp_group'          => 'stats',
			),
			'count_roles'                               => array(
				'description'       => esc_html__( 'Count the page views of registered users who are logged in.', 'jetpack' ),
				'type'              => 'array',
				'items'             => array(
					'type' => 'string',
				),
				'default'           => array( 'administrator' ),
				'validate_callback' => __CLASS__ . '::validate_stats_roles',
				'jp_group'          => 'stats',
			),
			'blog_id'                                   => array(
				'description'       => esc_html__( 'Blog ID.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'stats',
			),
			'do_not_track'                              => array(
				'description'       => esc_html__( 'Do not track.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'stats',
			),
			'version'                                   => array(
				'description'       => esc_html__( 'Version.', 'jetpack' ),
				'type'              => 'integer',
				'default'           => 9,
				'validate_callback' => __CLASS__ . '::validate_posint',
				'jp_group'          => 'stats',
			),
			'collapse_nudges'                           => array(
				'description'       => esc_html__( 'Collapse upgrade nudges', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'stats',
			),

			// Whether to share stats views with WordPress.com Reader.
			'wpcom_reader_views_enabled'                => array(
				'description'       => esc_html__( 'Show post views in the WordPress.com Reader.', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 1,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'settings',
			),

			// Akismet - Not a module, but a plugin. The options can be passed and handled differently.
			'akismet_show_user_comments_approved'       => array(
				'description'       => '',
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'settings',
			),

			'wordpress_api_key'                         => array(
				'description'       => '',
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => __CLASS__ . '::validate_alphanum',
				'jp_group'          => 'settings',
			),

			// Empty stats card dismiss.
			'dismiss_empty_stats_card'                  => array(
				'description'       => '',
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'settings',
			),

			// Backup Getting Started card on dashboard.
			'dismiss_dash_backup_getting_started'       => array(
				'description'       => '',
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'settings',
			),

			// Agencies Learn More card on dashboard.
			'dismiss_dash_agencies_learn_more'          => array(
				'description'       => '',
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'settings',
			),

			'lang_id'                                   => array(
				'description' => esc_html__( 'Primary language for the site.', 'jetpack' ),
				'type'        => 'string',
				'default'     => 'en_US',
				'jp_group'    => 'settings',
			),

			// SEO Tools.
			'advanced_seo_front_page_description'       => array(
				'description'       => esc_html__( 'Front page meta description.', 'jetpack' ),
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => 'Jetpack_SEO_Utils::sanitize_front_page_meta_description',
				'jp_group'          => 'seo-tools',
			),

			'advanced_seo_title_formats'                => array(
				'description'       => esc_html__( 'SEO page title structures.', 'jetpack' ),
				'type'              => 'object',
				'default'           => array(
					'archives'   => array(),
					'front_page' => array(),
					'groups'     => array(),
					'pages'      => array(),
					'posts'      => array(),
				),
				'jp_group'          => 'seo-tools',
				'validate_callback' => 'Jetpack_SEO_Titles::are_valid_title_formats',
				'sanitize_callback' => 'Jetpack_SEO_Titles::sanitize_title_formats',
			),

			// VideoPress.
			'videopress_private_enabled_for_site'       => array(
				'description'       => esc_html__( 'Video Privacy: Restrict views to members of this site', 'jetpack' ),
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'videopress',
			),
		);

		// Add modules to list so they can be toggled.
		$modules = Jetpack::get_available_modules();
		if ( is_array( $modules ) && ! empty( $modules ) ) {
			$module_args = array(
				'description'       => '',
				'type'              => 'boolean',
				'default'           => 0,
				'validate_callback' => __CLASS__ . '::validate_boolean',
				'jp_group'          => 'modules',
			);
			foreach ( $modules as $module ) {
				$options[ $module ] = $module_args;
			}
		}

		if ( is_array( $selector ) ) {

			// Return only those options whose keys match $selector keys.
			return array_intersect_key( $options, $selector );
		}

		if ( 'any' === $selector ) {

			// Toggle module or update any module option or any general setting.
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
	 * @deprecated since 13.9
	 *
	 * @param array           $onboarding_data Values to check.
	 * @param WP_REST_Request $request         The request sent to the WP REST API.
	 * @param string          $param           Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_onboarding( $onboarding_data, $request, $param ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		_deprecated_function( __METHOD__, '13.9' );
		return true;
	}

	/**
	 * Validates that the parameter is either a pure boolean or a numeric string that can be mapped to a boolean.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool     $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_boolean( $value, $request, $param ) {
		// phpcs:ignore WordPress.PHP.StrictInArray.MissingTrueStrict -- Other code depends on loose comparison here.
		if ( ! is_bool( $value ) && ! ( ctype_digit( (string) $value ) && in_array( $value, array( 0, 1 ) ) ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be true, false, 0 or 1.', 'jetpack' ),
					$param
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is a positive integer.
	 *
	 * @since 4.3.0
	 *
	 * @param int             $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_posint( $value, $request, $param ) {
		if ( ! is_numeric( $value ) || $value <= 0 ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be a positive integer.', 'jetpack' ),
					$param
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is a non-negative integer (includes 0).
	 *
	 * @since 10.4.0
	 *
	 * @param int             $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_non_neg_int( $value, $request, $param ) {
		if ( ! is_numeric( $value ) || $value < 0 ) {
			return new WP_Error(
				'invalid_param',
				/* translators: %s: The literal parameter name. Should not be translated. */
				sprintf( esc_html__( '%s must be a non-negative integer.', 'jetpack' ), $param )
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter belongs to a list of admitted values.
	 *
	 * @since 4.3.0
	 *
	 * @param string          $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_list_item( $value, $request, $param ) {
		$attributes = $request->get_attributes();
		if ( ! isset( $attributes['args'][ $param ] ) || ! is_array( $attributes['args'][ $param ] ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s not recognized', 'jetpack' ),
					$param
				)
			);
		}
		$args = $attributes['args'][ $param ];
		if ( ! empty( $args['enum'] ) ) {
			// If it's an associative array, use the keys to check that the value is among those admitted.
			$enum = ( count( array_filter( array_keys( $args['enum'] ), 'is_string' ) ) > 0 )
				? array_keys( $args['enum'] )
				: $args['enum'];
			$enum = array_map( 'strval', $enum );
			if ( ! in_array( $value, $enum, true ) ) {
				return new WP_Error(
					'invalid_param_value',
					sprintf(
					/* Translators: first variable is the parameter passed to endpoint that holds the list item, the second is a list of admitted values. */
						esc_html__( '%1$s must be one of %2$s', 'jetpack' ),
						$param,
						implode( ', ', $enum )
					)
				);
			}
		}
		return true;
	}

	/**
	 * Validates that the parameter belongs to a list of admitted values.
	 *
	 * @since 4.3.0
	 *
	 * @param string          $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_module_list( $value, $request, $param ) {
		if ( ! is_array( $value ) ) {
			return new WP_Error(
				'invalid_param_value',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be an array', 'jetpack' ),
					$param
				)
			);
		}

		$modules = Jetpack::get_available_modules();

		if ( count( array_intersect( $value, $modules ) ) !== count( $value ) ) {
			return new WP_Error(
				'invalid_param_value',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be a list of valid modules', 'jetpack' ),
					$param
				)
			);
		}

		return true;
	}

	/**
	 * Validates that the parameter is an alphanumeric or empty string (to be able to clear the field).
	 *
	 * @since 4.3.0
	 *
	 * @param string          $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_alphanum( $value, $request, $param ) {
		if ( ! empty( $value ) && ( ! is_string( $value ) || ! preg_match( '/^[a-z0-9]+$/i', $value ) ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be an alphanumeric string.', 'jetpack' ),
					$param
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is a tag or id for a verification service, or an empty string (to be able to clear the field).
	 *
	 * @since 4.6.0
	 *
	 * @param string          $value   Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param   Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_verification_service( $value, $request, $param ) {
		if ( ! empty( $value ) && ! ( is_string( $value ) && ( preg_match( '/^[a-z0-9_-]+$/i', $value ) || jetpack_verification_get_code( $value ) !== false ) ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a verification string used to verify a service like Google Webmaster Console. */
					esc_html__( '%s must be an alphanumeric string or a verification tag.', 'jetpack' ),
					$param
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is among the roles allowed for Stats.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool     $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_stats_roles( $value, $request, $param ) {
		if ( ! empty( $value ) && ! array_intersect( self::$stats_roles, $value ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: first variable is the name of a parameter passed to endpoint holding the role that will be checked, the second is a list of roles allowed to see stats. The parameter is checked against this list. */
					esc_html__( '%1$s must be %2$s.', 'jetpack' ),
					$param,
					implode( ', ', self::$stats_roles )
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is among the views where the Sharing can be displayed.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool     $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_sharing_show( $value, $request, $param ) {
		$views = array( 'index', 'post', 'page', 'attachment', 'jetpack-portfolio' );
		if ( ! is_array( $value ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be an array of post types.', 'jetpack' ),
					$param
				)
			);
		}
		if ( ! array_intersect( $views, $value ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: first variable is the name of a parameter passed to endpoint holding the post type where Sharing will be displayed, the second is a list of post types where Sharing can be displayed */
					esc_html__( '%1$s must be %2$s.', 'jetpack' ),
					$param,
					implode( ', ', $views )
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is among the valid reply-to types for subscriptions.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool     $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_subscriptions_reply_to( $value, $request, $param ) {
		require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions/class-settings.php';
		if ( ! empty( $value ) && ! Automattic\Jetpack\Modules\Subscriptions\Settings::is_valid_reply_to( $value ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be a valid type.', 'jetpack' ),
					$param
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is among the valid reply-to types for subscriptions.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool     $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_subscriptions_reply_to_name( $value, $request, $param ) {
		if ( ! empty( $value ) && ! is_string( $value ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be a valid type.', 'jetpack' ),
					$param
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is among the views where the Sharing can be displayed.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool     $value {
	 *         Value to check received by request.
	 *
	 *     @type array $visible List of slug of services to share to that are displayed directly in the page.
	 *     @type array $hidden  List of slug of services to share to that are concealed in a folding menu.
	 * }
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_services( $value, $request, $param ) {
		if ( ! is_array( $value ) || ! isset( $value['visible'] ) || ! isset( $value['hidden'] ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be an array with visible and hidden items.', 'jetpack' ),
					$param
				)
			);
		}

		// Allow to clear everything.
		if ( empty( $value['visible'] ) && empty( $value['hidden'] ) ) {
			return true;
		}

		if ( ! class_exists( 'Sharing_Service' ) && ! include_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Failed loading required dependency Sharing_Service.', 'jetpack' ) );
		}
		$sharer   = new Sharing_Service();
		$services = array_keys( $sharer->get_all_services() );

		if (
			( ! empty( $value['visible'] ) && ! array_intersect( $value['visible'], $services ) )
			||
			( ! empty( $value['hidden'] ) && ! array_intersect( $value['hidden'], $services ) ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: placeholder 1 is a parameter holding the services passed to endpoint, placeholder 2 is a list of all Jetpack Sharing services */
					esc_html__( '%1$s visible and hidden items must be a list of %2$s.', 'jetpack' ),
					$param,
					implode( ', ', $services )
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter has enough information to build a custom sharing button.
	 *
	 * @since 4.3.0
	 *
	 * @param string|bool     $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_custom_service( $value, $request, $param ) {
		if ( ! is_array( $value ) || ! isset( $value['sharing_name'] ) || ! isset( $value['sharing_url'] ) || ! isset( $value['sharing_icon'] ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be an array with sharing name, url and icon.', 'jetpack' ),
					$param
				)
			);
		}

		// Allow to clear everything.
		if ( empty( $value['sharing_name'] ) && empty( $value['sharing_url'] ) && empty( $value['sharing_icon'] ) ) {
			return true;
		}

		if ( ! class_exists( 'Sharing_Service' ) && ! include_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Failed loading required dependency Sharing_Service.', 'jetpack' ) );
		}

		if ( ( ! empty( $value['sharing_name'] ) && ! is_string( $value['sharing_name'] ) )
		|| ( ! empty( $value['sharing_url'] ) && ! is_string( $value['sharing_url'] ) )
		|| ( ! empty( $value['sharing_icon'] ) && ! is_string( $value['sharing_icon'] ) ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s needs sharing name, url and icon.', 'jetpack' ),
					$param
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is a custom sharing service ID like 'custom-1461976264'.
	 *
	 * @since 4.3.0
	 *
	 * @param string          $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_custom_service_id( $value, $request, $param ) {
		if ( ! empty( $value ) && ( ! is_string( $value ) || ! preg_match( '/custom\-[0-1]+/i', $value ) ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( "%s must be a string prefixed with 'custom-' and followed by a numeric ID.", 'jetpack' ),
					$param
				)
			);
		}

		if ( ! class_exists( 'Sharing_Service' ) && ! include_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Failed loading required dependency Sharing_Service.', 'jetpack' ) );
		}
		$sharer   = new Sharing_Service();
		$services = $sharer->get_all_services();

		if ( ! empty( $value ) && ! isset( $services[ $value ] ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s is not a registered custom sharing service.', 'jetpack' ),
					$param
				)
			);
		}

		return true;
	}

	/**
	 * Validates that the parameter is a Twitter username or empty string (to be able to clear the field).
	 *
	 * @since 4.3.0
	 *
	 * @param string          $value   Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param   Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_twitter_username( $value, $request, $param ) {
		if ( ! empty( $value ) && ( ! is_string( $value ) || ! preg_match( '/^@?\w{1,15}$/i', $value ) ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a twitter name. */
					esc_html__( '%s must be a Twitter username.', 'jetpack' ),
					$param
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is a string.
	 *
	 * @since 4.3.0
	 *
	 * @param string          $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_string( $value, $request, $param ) {
		if ( ! is_string( $value ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be a string.', 'jetpack' ),
					$param
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is an array of strings.
	 *
	 * @param array           $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to the endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_array_of_strings( $value, $request, $param ) {
		foreach ( $value as $array_item ) {
			$validate = self::validate_string( $array_item, $request, $param );
			if ( is_wp_error( $validate ) ) {
				return $validate;
			}
		}

		return true;
	}

	/**
	 * Validates the subscription_options parameter.
	 *
	 * @param array $values Value to check.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_subscription_options( $values ) {
		if ( is_object( $values ) ) {
			return new WP_Error(
				'invalid_param',
				/* Translators: subscription_options is a variable name, and shouldn't be translated. */
				esc_html__( 'subscription_options must be an object.', 'jetpack' )
			);
		}
		foreach ( array_keys( $values ) as $key ) {
			if ( ! in_array( $key, array( 'welcome', 'invitation', 'comment_follow' ), true ) ) {
				return new WP_Error(
					'invalid_param',
					sprintf(
						/* Translators: Placeholder is the invalid param being sent. */
						esc_html__( '%s is not one of the allowed members of subscription_options.', 'jetpack' ),
						$key
					)
				);
			}
		}
		return true;
	}

	/**
	 * Validates that the parameter is an array.
	 *
	 * @param array           $values Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to the endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_array( $values, $request, $param ) {
		if ( ! is_array( $values ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be an object.', 'jetpack' ),
					$param
				)
			);
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
			$sitemap_url      = home_url( '/index.php' . $location . '/sitemap.xml' );
			$news_sitemap_url = home_url( '/index.php' . $location . '/news-sitemap.xml' );
		} elseif ( $wp_rewrite->using_permalinks() ) {
			$sitemap_url      = home_url( $location . '/sitemap.xml' );
			$news_sitemap_url = home_url( $location . '/news-sitemap.xml' );
		} else {
			$sitemap_url      = home_url( $location . '/?jetpack-sitemap=sitemap.xml' );
			$news_sitemap_url = home_url( $location . '/?jetpack-sitemap=news-sitemap.xml' );
		}

		if ( $slug === null && isset( $modules['sitemaps'] ) ) {
			// Is a list of modules.
			$modules['sitemaps']['extra']['sitemap_url']      = $sitemap_url;
			$modules['sitemaps']['extra']['news_sitemap_url'] = $news_sitemap_url;
		} elseif ( 'sitemaps' === $slug ) {
			// It's a single module.
			$modules['extra']['sitemap_url']      = $sitemap_url;
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
				// Status of user notifications.
				$options['monitor_receive_notifications']['current_value'] = self::cast_value( self::get_remote_value( 'monitor', 'monitor_receive_notifications' ), $options['monitor_receive_notifications'] );
				break;

			case 'post-by-email':
				// Email address.
				$options['post_by_email_address']['current_value'] = self::cast_value( self::get_remote_value( 'post-by-email', 'post_by_email_address' ), $options['post_by_email_address'] );
				break;

			case 'protect':
				// Protect.
				$options['jetpack_protect_key']['current_value']              = get_site_option( 'jetpack_protect_key', false );
				$options['jetpack_protect_global_whitelist']['current_value'] = Brute_Force_Protection_Shared_Functions::format_allow_list();
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
				$wga  = get_option( 'jetpack_wga' );
				$code = '';
				if ( is_array( $wga ) && array_key_exists( 'code', $wga ) ) {
					$code = $wga['code'];
				}
				$options['google_analytics_tracking_id']['current_value'] = $code;
				break;

			case 'sharedaddy':
				// It's local, but it must be broken apart since it's saved as an array.
				if ( ! class_exists( 'Sharing_Service' ) && ! include_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) {
					break;
				}
				$sharer                                       = new Sharing_Service();
				$options                                      = self::split_options( $options, $sharer->get_global_options() );
				$options['sharing_services']['current_value'] = $sharer->get_blog_services();
				$other_sharedaddy_options                     = array( 'jetpack-twitter-cards-site-tag', 'sharedaddy_disable_resources', 'sharing_delete_service' );
				foreach ( $other_sharedaddy_options as $key ) {
					$default_value                    = isset( $options[ $key ]['default'] ) ? $options[ $key ]['default'] : '';
					$current_value                    = get_option( $key, $default_value );
					$options[ $key ]['current_value'] = self::cast_value( $current_value, $options[ $key ] );
				}
				break;

			case 'stats':
				// It's local, but it must be broken apart since it's saved as an array.
				$options = self::split_options( $options, Stats_Options::get_options() );
				break;
			default:
				// These option are just stored as plain WordPress options.
				foreach ( $options as $key => $value ) {
					$default_value                    = isset( $options[ $key ]['default'] ) ? $options[ $key ]['default'] : '';
					$current_value                    = get_option( $key, $default_value );
					$options[ $key ]['current_value'] = self::cast_value( $current_value, $options[ $key ] );
				}
		}
		// At this point some options have current_value not set because they're options
		// that only get written on update, so we set current_value to the default one.
		foreach ( $options as $key => $value ) {
			// We don't need validate_callback in the response.
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
		if ( 'NULL' === $value ) {
			return null;
		}

		if ( isset( $definition['type'] ) ) {
			switch ( $definition['type'] ) {
				case 'boolean':
					if ( 'true' === $value || 'on' === $value ) {
						return true;
					} elseif ( 'false' === $value || 'off' === $value ) {
						return false;
					}
					$value = (bool) $value;
					break;

				case 'integer':
					$value = (int) $value;
					break;

				case 'float':
					$value = (float) $value;
					break;

				case 'string':
					$value = (string) $value;
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
		if ( ! Jetpack::is_connection_ready() ) {
			return false;
		}

		// Do what is necessary for each module.
		switch ( $module ) {
			case 'monitor':
				// Load the class to use the method. If class can't be found, do nothing.
				if ( ! class_exists( 'Jetpack_Monitor' ) && ! include_once Jetpack::get_module_path( $module ) ) {
					return false;
				}
				$value = Jetpack_Monitor::user_receives_notifications( false );
				break;

			case 'post-by-email':
				// Load the class to use the method. If class can't be found, do nothing.
				if ( ! class_exists( 'Jetpack_Post_By_Email' ) && ! include_once Jetpack::get_module_path( $module ) ) {
					return false;
				}
				$value = Jetpack_Post_By_Email::init()->get_post_by_email_address();
				if ( null === $value ) {
					$value = 'NULL'; // sentinel value so it actually gets set.
				}
				break;
		}

		// Normalize value to boolean.
		if ( is_wp_error( $value ) || $value === null ) {
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
			if ( 0 === $count ) {
				$response = array(
					'code'    => 'success',
					'message' => esc_html__( 'All plugins are up-to-date. Keep up the good work!', 'jetpack' ),
					'count'   => 0,
				);
			} else {
				$response = array(
					'code'    => 'updates-available',
					'message' => esc_html(
						sprintf(
							/* Translators: placeholders are numbers. */
							_n( '%s plugin needs updating.', '%s plugins need updating.', $count, 'jetpack' ),
							$count
						)
					),
					'count'   => $count,
				);
			}
			return rest_ensure_response( $response );
		}

		return new WP_Error( 'not_found', esc_html__( 'Could not check updates for plugins on this site.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Get plugins data in site.
	 *
	 * @since 4.2.0
	 *
	 * @return WP_REST_Response|WP_Error List of plugins in the site. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function get_plugins() {
		$plugins = Plugins_Installer::get_plugins();

		if ( ! empty( $plugins ) ) {
			return rest_ensure_response( $plugins );
		}

		return new WP_Error( 'not_found', esc_html__( 'Unable to list plugins.', 'jetpack' ), array( 'status' => 404 ) );
	}

	/**
	 * Install a specific plugin and optionally activates it.
	 *
	 * @since 8.9.0
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug   Plugin slug.
	 *     @type string $status Plugin status.
	 *     @type string $source Where did the plugin installation request originate.
	 * }
	 *
	 * @return WP_REST_Response|WP_Error A response object if the installation and / or activation was successful, or a WP_Error object if it failed.
	 */
	public static function install_plugin( $request ) {
		$plugin = stripslashes( $request['slug'] );

		// Let's make sure the plugin isn't already installed.
		$plugin_id = Plugins_Installer::get_plugin_id_by_slug( $plugin );

		// If not installed, let's install now.
		if ( ! $plugin_id ) {
			$result = Plugins_Installer::install_plugin( $plugin );

			if ( is_wp_error( $result ) ) {
				return new WP_Error(
					'install_plugin_failed',
					sprintf(
						/* translators: %1$s: plugin name. -- %2$s: error message. */
						__( 'Unable to install %1$s: %2$s ', 'jetpack' ),
						$plugin,
						$result->get_error_message()
					),
					array( 'status' => 500 )
				);
			}
		}

		/*
		 * We may want to activate the plugin as well.
		 * Let's check for the status parameter in the request to find out.
		 * If none was passed (or something other than active), let's return now.
		 */
		if ( empty( $request['status'] ) || 'active' !== $request['status'] ) {
			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => esc_html(
						sprintf(
							/* translators: placeholder is a plugin name. */
							__( 'Installed %s', 'jetpack' ),
							$plugin
						)
					),
				)
			);
		}

		/*
		 * Proceed with plugin activation.
		 * Let's check again for the plugin's ID if we don't already have it.
		 */
		if ( ! $plugin_id ) {
			$plugin_id = Plugins_Installer::get_plugin_id_by_slug( $plugin );
			if ( ! $plugin_id ) {
				return new WP_Error(
					'unable_to_determine_installed_plugin',
					__( 'Unable to determine what plugin was installed.', 'jetpack' ),
					array( 'status' => 500 )
				);
			}
		}

		$source      = ! empty( $request['source'] ) ? stripslashes( $request['source'] ) : 'rest_api';
		$plugin_args = array(
			'plugin' => substr( $plugin_id, 0, - 4 ),
			'status' => 'active',
			'source' => $source,
		);
		return self::activate_plugin( $plugin_args );
	}

	/**
	 * Activate a specific plugin.
	 *
	 * @since 8.9.0
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $plugin Plugin long slug (slug/index-file)
	 *     @type string $status Plugin status. We only support active in Jetpack.
	 *     @type string $source Where did the plugin installation request originate.
	 * }
	 *
	 * @return WP_REST_Response|WP_Error A response object if the activation was successful, or a WP_Error object if the activation failed.
	 */
	public static function activate_plugin( $request ) {
		/*
		 * We need an "active" status parameter to be passed to the request
		 * just like the core plugins endpoind we'll eventually switch to.
		 */
		if ( empty( $request['status'] ) || 'active' !== $request['status'] ) {
			return new WP_Error(
				'missing_status_parameter',
				esc_html__( 'Status parameter missing.', 'jetpack' ),
				array( 'status' => 403 )
			);
		}

		$plugins = Plugins_Installer::get_plugins();

		if ( empty( $plugins ) ) {
			return new WP_Error( 'no_plugins_found', esc_html__( 'This site has no plugins.', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( empty( $request['plugin'] ) ) {
			return new WP_Error( 'no_plugin_specified', esc_html__( 'You did not specify a plugin.', 'jetpack' ), array( 'status' => 404 ) );
		}

		$plugin = $request['plugin'] . '.php';

		// Is the plugin installed?
		if ( ! array_key_exists( $plugin, $plugins ) ) {
			return new WP_Error(
				'plugin_not_found',
				esc_html(
					sprintf(
						/* translators: placeholder is a plugin slug. */
						__( 'Plugin %s is not installed.', 'jetpack' ),
						$plugin
					)
				),
				array( 'status' => 404 )
			);
		}

		// Is the plugin active already?
		$status = Plugins_Installer::get_plugin_status( $plugin );
		if ( in_array( $status, array( 'active', 'network-active' ), true ) ) {
			return new WP_Error(
				'plugin_already_active',
				esc_html(
					sprintf(
						/* translators: placeholder is a plugin slug. */
						__( 'Plugin %s is already active.', 'jetpack' ),
						$plugin
					)
				),
				array( 'status' => 404 )
			);
		}

		// Now try to activate the plugin.
		$activated = activate_plugin( $plugin );

		if ( is_wp_error( $activated ) ) {
			return $activated;
		} else {
			$source = ! empty( $request['source'] ) ? stripslashes( $request['source'] ) : 'rest_api';
			/**
			 * Fires when Jetpack installs a plugin for you.
			 *
			 * @since 8.9.0
			 *
			 * @param string $plugin_file Plugin file.
			 * @param string $source      Where did the plugin installation originate.
			 */
			do_action( 'jetpack_activated_plugin', $plugin, $source );
			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => sprintf(
						/* translators: placeholder is a plugin name. */
						esc_html__( 'Activated %s', 'jetpack' ),
						$plugin
					),
				)
			);
		}
	}

	/**
	 * Check if a plugin can be activated.
	 *
	 * @since 8.9.0
	 *
	 * @param string|bool     $value   Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param   Name of the parameter passed to endpoint holding $value.
	 */
	public static function validate_activate_plugin( $value, $request, $param ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return 'active' === $value;
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
		$plugins = Plugins_Installer::get_plugins();

		if ( empty( $plugins ) ) {
			return new WP_Error( 'no_plugins_found', esc_html__( 'This site has no plugins.', 'jetpack' ), array( 'status' => 404 ) );
		}

		$plugin = stripslashes( $request['plugin'] );

		if ( ! array_key_exists( $plugin, $plugins ) ) {
			return new WP_Error(
				'plugin_not_found',
				esc_html(
					sprintf(
						/* Translators: placeholder is a plugin name. */
						__( 'Plugin %s is not installed.', 'jetpack' ),
						$plugin
					)
				),
				array( 'status' => 404 )
			);
		}

		$plugin_data = $plugins[ $plugin ];

		$plugin_data['active'] = in_array( Plugins_Installer::get_plugin_status( $plugin ), array( 'active', 'network-active' ), true );

		return rest_ensure_response(
			array(
				'code'    => 'success',
				'message' => esc_html__( 'Plugin found.', 'jetpack' ),
				'data'    => $plugin_data,
			)
		);
	}

	/**
	 * Returns the Jetpack CRM data.
	 *
	 * @return WP_REST_Response A response object containing the Jetpack CRM data.
	 */
	public static function get_jetpack_crm_data() {
		$jetpack_crm_data = ( new Jetpack_CRM_Data() )->get_crm_data();
		return rest_ensure_response( $jetpack_crm_data );
	}

	/**
	 * Activates Jetpack CRM's Jetpack Forms extension.
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @return WP_REST_Response|WP_Error A response object if the extension activation was successful, or a WP_Error object if it failed.
	 */
	public static function activate_crm_jetpack_forms_extension( $request ) {
		if ( ! isset( $request['extension'] ) || 'jetpackforms' !== $request['extension'] ) {
			return new WP_Error( 'invalid_param', esc_html__( 'Missing or invalid extension parameter.', 'jetpack' ), array( 'status' => 404 ) );
		}

		$result = ( new Jetpack_CRM_Data() )->activate_crm_jetpackforms_extension();

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( array( 'code' => 'success' ) );
	}

	/**
	 * Verifies that the current user has the required permission for accessing the CRM data.
	 *
	 * @return true|WP_Error Returns true if the user has the required capability, else a WP_Error object.
	 */
	public static function jetpack_crm_data_permission_check() {
		if ( current_user_can( 'publish_posts' ) ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_jetpack_crm_data',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Verifies that the current user has the required capability for activating Jetpack CRM extensions.
	 *
	 * @return true|WP_Error Returns true if the user has the required capability, else a WP_Error object.
	 */
	public static function activate_crm_extensions_permission_check() {
		// phpcs:ignore WordPress.WP.Capabilities.Unknown
		if ( current_user_can( 'admin_zerobs_manage_options' ) ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_activate_jetpack_crm_ext',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Set hasSeenWCConnectionModal to true when the site has displayed it
	 *
	 * @since 10.4.0
	 *
	 * @return bool
	 */
	public static function set_has_seen_wc_connection_modal() {
		$updated_option = Jetpack_Options::update_option( 'has_seen_wc_connection_modal', true );

		return rest_ensure_response( array( 'success' => $updated_option ) );
	}

	/**
	 * Fetch introdution offers.
	 *
	 * @since 10.9
	 *
	 * @return array|WP_Error
	 */
	public static function get_intro_offers() {
		$site_id = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			return new WP_Error(
				'site_id_missing',
				esc_html__( 'Site ID is missing.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$response = Client::wpcom_json_api_request_as_user(
			'/introductory-offers',
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( 200 !== $response_code ) {
			return new WP_Error(
				'intro_offers_fetch_failed',
				esc_html__( 'Could not retrieve intro offers.', 'jetpack' ),
				array( 'status' => $response_code )
			);
		}

		$data = json_decode( wp_remote_retrieve_body( $response ) );

		if ( ! isset( $data ) ) {
			return new WP_Error(
				'intro_offers_error',
				esc_html__( 'Could not parse intro offers.', 'jetpack' ),
				array( 'status' => 204 ) // no content.
			);
		}

		return rest_ensure_response(
			array(
				'code' => 'success',
				'data' => $data,
			)
		);
	}

	/**
	 * Return the list of available features.
	 *
	 * @return array
	 */
	public static function get_features_available() {
		$raw_modules = Jetpack::get_available_modules();
		$modules     = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}

	/**
	 * Returns what features are enabled. Uses the slug of the modules files.
	 *
	 * @return array
	 */
	public static function get_features_enabled() {
		$raw_modules = Jetpack::get_active_modules();
		$modules     = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}

	/**
	 * Verify that the API client is allowed to replace user token.
	 *
	 * @since 1.29.0
	 *
	 * @return bool|WP_Error
	 */
	public static function get_features_permission_check() {
		if ( ! Rest_Authentication::is_signed_with_blog_token() ) {
			$message = esc_html__(
				'You do not have the correct user permissions to perform this action. Please contact your site admin if you think this is a mistake.',
				'jetpack'
			);
			return new WP_Error( 'invalid_permission_fetch_features', $message, array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}
} // class end
