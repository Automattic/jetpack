<?php
/**
 * Primary class file for the Jetpack Backup plugin.
 *
 * @package automattic/jetpack-backup-plugin
 */

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Backup\V0005;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Backup\V0005\Initial_State as Backup_Initial_State;
use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;
use Jetpack_Options;
use WP_Error;
use WP_REST_Server;
use function add_action;
use function add_filter;
use function did_action;
use function do_action;
use function esc_url_raw;
use function get_option;
use function is_wp_error;
use function rest_ensure_response;
use function update_option;
use function wp_add_inline_script;
use function wp_remote_get;
use function wp_remote_retrieve_body;
use function wp_remote_retrieve_response_code;

/**
 * Class Jetpack_Backup
 */
class Jetpack_Backup {

	/**
	 * Slug.
	 *
	 * @var string
	 */
	const JETPACK_BACKUP_SLUG = 'jetpack-backup';

	/**
	 * Backup name.
	 *
	 * @var string
	 */
	const JETPACK_BACKUP_NAME = 'Jetpack Backup';

	/**
	 * Backup URL.
	 *
	 * @var string
	 */
	const JETPACK_BACKUP_URI = 'https://jetpack.com/jetpack-backup';

	/**
	 * Promoted product.
	 *
	 * @var string
	 */
	const JETPACK_BACKUP_PROMOTED_PRODUCT = 'jetpack_backup_t1_yearly';

	/**
	 * Licenses product ID.
	 *
	 * @var string
	 */
	const JETPACK_BACKUP_PRODUCT_IDS = array(
		2014, // JETPACK_COMPLETE.
		2015, // JETPACK_COMPLETE_MONTHLY.
		2016, // JETPACK_SECURITY_TIER_1_YEARLY.
		2017, // JETPACK_SECURITY_TIER_1_MONTHLY.
		2019, // JETPACK_SECURITY_TIER_2_YEARLY.
		2020, // JETPACK_SECURITY_TIER_2_MONTHLY.
		2112, // JETPACK_BACKUP_TIER_1_YEARLY.
		2113, // JETPACK_BACKUP_TIER_1_MONTHLY.
		2114, // JETPACK_BACKUP_TIER_2_YEARLY.
		2115, // JETPACK_BACKUP_TIER_2_MONTHLY.
	);

	/**
	 * Jetpack Backup DB version.
	 *
	 * @var string
	 */
	const JETPACK_BACKUP_DB_VERSION = '2';

	/**
	 * Filter name that gates the wp-build–based dashboard.
	 *
	 * When this filter returns true, "Jetpack > Backup" renders the new
	 * wp-build dashboard instead of the legacy React app.
	 */
	const MODERNIZATION_FILTER = 'rsm_jetpack_ui_modernization_backup';

	/**
	 * Constructor.
	 */
	public static function initialize() {
		if ( did_action( 'jetpack_backup_initialized' ) ) {
			return;
		}

		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );

		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );
		add_action( 'admin_menu', array( __CLASS__, 'add_wp_admin_submenu' ), 1 ); // Akismet uses 4, so we need to use 1 to ensure both menus are added when only they exist.

		// Init Jetpack packages.
		add_action(
			'plugins_loaded',
			function () {
				$config = new Config();
				// Connection package.
				$config->ensure(
					'connection',
					array(
						'slug'     => self::JETPACK_BACKUP_SLUG,
						'name'     => self::JETPACK_BACKUP_NAME,
						'url_info' => self::JETPACK_BACKUP_URI,
					)
				);
				// Sync package.
				$config->ensure( 'sync' );

				// Identity crisis package.
				$config->ensure( 'identity_crisis' );
			},
			1
		);

		add_action( 'plugins_loaded', array( __CLASS__, 'maybe_upgrade_db' ), 20 );

		add_filter( 'jetpack_connection_user_has_license', array( __CLASS__, 'jetpack_check_user_licenses' ), 10, 3 );

		// Jetpack Backup abilities are registered from `actions.php` at package
		// autoload time so the surface is available in every consumer that
		// loads this package (both the standalone Backup plugin and the
		// Jetpack plugin), not only when `Jetpack_Backup::initialize()` runs.

		/**
		 * Runs right after the Jetpack Backup package is initialized.
		 *
		 * @since 1.3.0
		 */
		do_action( 'jetpack_backup_initialized' );
	}

	/**
	 * The page to be added to submenu
	 */
	public static function add_wp_admin_submenu() {
		$is_modernized = self::is_modernized();
		$callback      = $is_modernized && function_exists( 'jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page' )
			? 'jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page'
			: array( __CLASS__, 'plugin_settings_page' );

		// Gate the "VaultPress Backup" relabel behind the modernization
		// filter so the flag-off path stays byte-identical to trunk.
		$page_title = $is_modernized ? 'Jetpack VaultPress Backup' : 'Jetpack Backup';
		$menu_title = $is_modernized ? 'VaultPress Backup' : 'Backup'; // Product name, do not translate.

		$page_suffix = Admin_Menu::add_menu(
			$page_title,
			$menu_title,
			'manage_options',
			self::JETPACK_BACKUP_SLUG,
			$callback,
			7
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
		}
	}

	/**
	 * Initialize the admin resources.
	 */
	public static function admin_init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_scripts' ) );

		if ( self::is_modernized() ) {
			// The modernized Backup overview is a focused, full-screen product
			// surface. Suppress JITMs and other core/plugin admin notices so they
			// don't reflow on top of the dual-pane layout. Mirrors how Jetpack
			// Forms handles its dashboard page
			// (`plugins/forms/src/dashboard/class-dashboard.php`).
			remove_all_actions( 'admin_notices' );
			remove_all_actions( 'all_admin_notices' );
		}
	}

	/**
	 * Checks current version against version in code and run upgrades if we are running a new version
	 */
	public static function maybe_upgrade_db() {
		$current_db_version = get_option( 'jetpack_backup_db_version' );
		if ( version_compare( $current_db_version, self::JETPACK_BACKUP_DB_VERSION, '<' ) ) {
			update_option( 'jetpack_backup_db_version', self::JETPACK_BACKUP_DB_VERSION );
			Jetpack_Backup_Upgrades::upgrade();
		}
	}

	/**
	 * Returns whether we are in condition to track to use
	 * Analytics functionality like Tracks, MC, or GA.
	 */
	public static function can_use_analytics() {
		$status     = new Status();
		$connection = new Connection_Manager( 'jetpack-backup' );
		$tracking   = new Tracking( 'jetpack', $connection );

		return $tracking->should_enable_tracking( new Terms_Of_Service(), $status );
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 */
	public static function enqueue_admin_scripts() {
		// This callback is registered via `load-{$page_suffix}` in `add_wp_admin_submenu()`,
		// so it only fires on the Backup admin page — no need to re-check the page here.
		if ( self::is_modernized() ) {
			// wp-build manages its own enqueue pipeline. The legacy script,
			// initial state, and tracking are intentionally skipped for the
			// wp-build dashboard.
			return;
		}

		Assets::register_script(
			'jetpack-backup',
			'../build/index.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-backup-pkg',
			)
		);
		Assets::enqueue_script( 'jetpack-backup' );
		// Initial JS state including JP Connection data.
		wp_add_inline_script( 'jetpack-backup', self::get_initial_state(), 'before' );
		Connection_Initial_State::render_script( 'jetpack-backup' );

		// Load script for analytics.
		if ( self::can_use_analytics() ) {
			Tracking::register_tracks_functions_scripts( true );
		}
	}

	/**
	 * Main plugin settings page.
	 */
	public static function plugin_settings_page() {
		?>
			<div id="jetpack-backup-root"></div>
		<?php
	}

	/**
	 * Return the rendered initial state JavaScript code.
	 *
	 * @return string
	 */
	private static function get_initial_state() {
		return ( new Backup_Initial_State() )->render();
	}

	/**
	 * Register REST API
	 */
	public static function register_rest_routes() {

		// Get information on most recent 10 backups.
		register_rest_route(
			'jetpack/v4',
			'/backups',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_recent_backups',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
			)
		);

		// Get site backup/scan/anti-spam capabilities.
		register_rest_route(
			'jetpack/v4',
			'/backup-capabilities',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_backup_capabilities',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
			)
		);

		// Get whether the site has a backup plan
		register_rest_route(
			'jetpack/v4',
			'/has-backup-plan',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::has_backup_plan',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
			)
		);

		// Get site rewind data.
		register_rest_route(
			'jetpack/v4',
			'/restores',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_recent_restores',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
			)
		);

		// Get information on site products.
		// Backup plugin version of /site/purchases from JP plugin.
		// Revert once this route and MyPlan component are extracted to a common package.
		register_rest_route(
			'jetpack/v4',
			'/site/current-purchases',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_current_purchases',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
			)
		);

		// Get currently promoted product from the product's endpoint.
			register_rest_route(
				'jetpack/v4',
				'/backup-promoted-product-info',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_backup_promoted_product_info',
					'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				)
			);

		// Get and set value of dismissed_backup_review_request option
		register_rest_route(
			'jetpack/v4',
			'/site/dismissed-review-request',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::manage_dismissed_backup_review_request',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'option_name'    => array(
						'required' => true,
						'type'     => 'string',
					),
					'should_dismiss' => array(
						'required' => true,
						'type'     => 'boolean',
					),
				),
			)
		);

		// Get site size
		register_rest_route(
			'jetpack/v4',
			'/site/backup/size',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_size',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
			)
		);

		// Get backup schedule time
		register_rest_route(
			'jetpack/v4',
			'/site/backup/schedule',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_schedule_time',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
			)
		);

		// Get site policies
		register_rest_route(
			'jetpack/v4',
			'/site/backup/policies',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_policies',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
			)
		);

		// Get site add-on offer
		register_rest_route(
			'jetpack/v4',
			'/site/backup/addon-offer',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_addon_offer',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'storage_size'  => array(
						'required' => true,
						'type'     => 'numeric',
					),
					'storage_limit' => array(
						'required' => true,
						'type'     => 'numeric',
					),
				),
			)
		);

		// Enqueue a new backup
		register_rest_route(
			'jetpack/v4',
			'/site/backup/enqueue',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::enqueue_backup',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
			)
		);
	}

	/**
	 * The backup calls should only occur from a signed in admin user
	 *
	 * @access public
	 * @static
	 *
	 * @return true|WP_Error
	 */
	public static function backups_permissions_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get information about recent backups
	 *
	 * @access public
	 * @static
	 *
	 * @return array An array of recent backups
	 */
	public static function get_recent_backups() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_blog(
			'/sites/' . $blog_id . '/rewind/backups',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	/**
	 * Hits the wpcom api to check rewind status.
	 *
	 * @return Object|WP_Error
	 */
	private static function get_rewind_state_from_wpcom() {
		static $status = null;

		if ( $status !== null ) {
			return $status;
		}

		$site_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d/rewind', $site_id ) . '?force=wpcom', '2', array( 'timeout' => 2 ), null, 'wpcom' );

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'rewind_state_fetch_failed' );
		}

		$body   = wp_remote_retrieve_body( $response );
		$status = json_decode( $body );
		return $status;
	}

	/**
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * @return boolean
	 */
	public static function has_backup_plan() {
		$rewind_data = static::get_rewind_state_from_wpcom();
		if ( is_wp_error( $rewind_data ) ) {
			return false;
		}
		return is_object( $rewind_data ) && isset( $rewind_data->state ) && 'unavailable' !== $rewind_data->state;
	}

	/**
	 * Get an array of backup/scan/anti-spam site capabilities
	 *
	 * @access public
	 * @static
	 *
	 * @return array An array of capabilities
	 */
	public static function get_backup_capabilities() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/rewind/capabilities',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	/**
	 * Get information about recent restores
	 *
	 * @access public
	 * @static
	 *
	 * @return array An array of recent restores
	 */
	public static function get_recent_restores() {
		$blog_id  = Jetpack_Options::get_option( 'id' );
		$response = Client::wpcom_json_api_request_as_blog(
			'/sites/' . $blog_id . '/rewind/restores',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	/**
	 * Query backup-completion events from the wpcom activity-log via the
	 * general `/sites/<id>/activity` endpoint with the action filter pinned
	 * to backup-completion event names. This endpoint paginates real-ly
	 * (Elasticsearch `from` offset under the hood) — the `/activity/rewindable`
	 * sibling looks like a more natural fit but hardcodes `page: 1,
	 * totalPages: 1` and ignores the `page` parameter.
	 *
	 * Auth: signs as user. The endpoint gates on the requesting WP user
	 * being an administrator of the blog (see
	 * sites-activity.php::readable_permission_check); blog-level tokens
	 * return 401.
	 *
	 * Returned shape (success): a W3C ActivityStreams envelope:
	 *   {
	 *     "@context": ..., "type": "OrderedCollection", "totalItems": int,
	 *     "page": int, "totalPages": int, "itemsPerPage": int,
	 *     "orderedItems": [ <event>, ... ]
	 *   }
	 * Each event has at least `published`, `rewind_id`, `is_rewindable`,
	 * `name`, `status`, `summary`.
	 *
	 * @param array $args Query args passed through to wpcom. Supported keys:
	 *                    `after` (ISO 8601), `before` (ISO 8601), `on` (ISO 8601),
	 *                    `date_range`, `number` (max 1000), `page` (1-based),
	 *                    `sort_order` ('asc'|'desc'). Any `action` key is
	 *                    overridden with the curated backup-completion list.
	 * @return array|\WP_REST_Response|null
	 */
	public static function list_backup_events( array $args = array() ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		// Curated set of activity actions that represent "a backup completed".
		// Mirrors `WPCOM_REST_API_V2_Endpoint_Site_Activity::$backup_action_names`.
		// Pinned here (and overriding any caller-supplied `action`) so the
		// helper is always scoped to backups regardless of what the caller passes.
		$args['action'] = array(
			'backup_complete_full',
			'backup_complete_initial',
			'backup_only_complete_full',
			'backup_only_complete_initial',
			'rewind__backup_complete_full',
			'rewind__backup_complete_initial',
			'rewind__backup_only_complete_full',
			'rewind__backup_only_complete_initial',
		);

		$path = '/sites/' . (int) $blog_id . '/activity?' . http_build_query( $args );

		$response = Client::wpcom_json_api_request_as_user(
			$path,
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	/**
	 * Gets information about the currently promoted backup product.
	 *
	 * @return string|WP_Error A JSON object of the current backup product being promoted if the request was successful, or a WP_Error otherwise.
	 */
	public static function get_backup_promoted_product_info() {
		$request_url   = 'https://public-api.wordpress.com/rest/v1.1/products?locale=' . get_user_locale() . '&type=jetpack';
		$wpcom_request = wp_remote_get( esc_url_raw( $request_url ) );
		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 === $response_code ) {
			$products = json_decode( wp_remote_retrieve_body( $wpcom_request ) );
			return $products->{self::JETPACK_BACKUP_PROMOTED_PRODUCT};
		} else {
			// Something went wrong so we'll just return the response without caching.
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack-backup-pkg' ),
				array(
					'status'  => $response_code,
					'request' => $wpcom_request,
				)
			);
		}
	}

	/**
	 * Check for user licenses.
	 *
	 * @param boolean $has_license If the user already has a license found.
	 * @param array   $licenses List of unattached licenses belonging to the user.
	 * @param string  $plugin_slug The plugin that initiated the flow.
	 *
	 * @return boolean
	 */
	public static function jetpack_check_user_licenses( $has_license, $licenses, $plugin_slug ) {
		if ( $plugin_slug !== static::JETPACK_BACKUP_SLUG || $has_license ) {
			return $has_license;
		}

		$license_found = false;

		foreach ( $licenses as $license ) {
			if ( in_array( $license->product_id, static::JETPACK_BACKUP_PRODUCT_IDS, true ) ) {
				$license_found = true;
				break;
			}
		}

		// Checking for existing backup plan is costly, so only check if there's an appropriate license.
		return $license_found && ! static::has_backup_plan();
	}

	/**
	 * Returns the result of `/upgrades` endpoint call.
	 *
	 * @return array of site purchases.
	 */
	public static function get_site_current_purchases() {

		$request  = sprintf( '/upgrades?site=%d', Jetpack_Options::get_option( 'id' ) );
		$response = Client::wpcom_json_api_request_as_blog( $request, '1.2' );

		// Bail if there was an error or malformed response.
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return self::get_failed_fetch_error();
		}

		if ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return self::get_failed_fetch_error();
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	/**
	 * Set value of the dismissed_backup_review_request Jetack option.
	 * Get value if should_dismiss is false
	 *
	 * @access public
	 * @static
	 * @param array $request arguments should_dismiss and option_name.
	 * @return bool value of option if value is requested | updated or not if value is updated.
	 */
	public static function manage_dismissed_backup_review_request( $request ) {

		if ( ! $request['should_dismiss'] ) {

			return rest_ensure_response(
				Jetpack_Options::get_option( 'dismissed_backup_review_' . $request['option_name'] )
			);
		}

		return Jetpack_Options::update_option( 'dismissed_backup_review_' . $request['option_name'], true );
	}

	/**
	 * Get site storage size
	 *
	 * @return string|WP_Error A JSON object with the site storage size if the request was successful, or a WP_Error otherwise.
	 */
	public static function get_site_backup_size() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/rewind/size?force=wpcom',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	/**
	 * Get site policies from WPCOM. It includes the storage limit and activity log limit, if apply.
	 *
	 * @return string|WP_Error A JSON object with the site storage policies if the request was successful,
	 *                         or a WP_Error otherwise.
	 */
	public static function get_site_backup_policies() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/rewind/policies?force=wpcom',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	/**
	 * Get suggested storage addon based on storage usage
	 *
	 * @param int $bytes_used      Storage used.
	 * @param int $bytes_available Storage limit.
	 * @return string Suggested addon storage slug
	 */
	public static function get_storage_addon_upsell_slug( $bytes_used, $bytes_available ) {
		$bytes_10gb  = 10 * 1024 * 1024 * 1024; // 10GB in bytes
		$bytes_100gb = 100 * 1024 * 1024 * 1024; // 100GB in bytes
		$bytes_1tb   = 1024 * 1024 * 1024 * 1024; // 1TB in bytes

		$upsell_products = array(
			$bytes_10gb  => 'jetpack_backup_addon_storage_10gb_monthly',
			$bytes_100gb => 'jetpack_backup_addon_storage_100gb_monthly',
			$bytes_1tb   => 'jetpack_backup_addon_storage_1tb_monthly',
		);

		// If usage has crossed over the storage limit, then dynamically calculate the upgrade option
		if ( $bytes_used > $bytes_available ) {
			$additional_bytes_used = $bytes_used - $bytes_available;

			// Add aditional 25% buffer
			$additional_bytes_needed = $additional_bytes_used + $additional_bytes_used * 0.25;

			// Since 1TB is our max upgrade but the additional storage needed is greater than 1TB, then just return 1TB
			if ( $additional_bytes_needed > $bytes_1tb ) {
				return $upsell_products[ $bytes_1tb ];
			}

			$matched_bytes = $bytes_10gb;
			foreach ( $upsell_products as $bytes => $product ) {
				if ( $bytes > $additional_bytes_needed ) {
					$matched_bytes = $bytes;
					break;
				}
			}

			return $upsell_products[ $matched_bytes ];
		}

		// For 1 TB we are going to offer 1 TB by default
		if ( $bytes_1tb === $bytes_available ) {
			return $upsell_products[ $bytes_1tb ];
		}

		// Otherwise, we are going to offer 10 GB
		return $upsell_products[ $bytes_10gb ];
	}

	/**
	 * Get the best addon offer for this site, including pricing details
	 *
	 * @param \WP_REST_Request $request Object including storage usage.
	 *
	 * @return string|WP_Error A JSON object with the suggested storage addon details if the request was successful,
	 *                         or a WP_Error otherwise.
	 */
	public static function get_site_backup_addon_offer( $request ) {
		$suggested_addon = self::get_storage_addon_upsell_slug(
			$request['storage_size'],
			$request['storage_limit']
		);

		$addons_size_text_map = array(
			'jetpack_backup_addon_storage_10gb_monthly'  => '10GB',
			'jetpack_backup_addon_storage_100gb_monthly' => '100GB',
			'jetpack_backup_addon_storage_1tb_monthly'   => '1TB',
		);

		// Fetch addon storage price information
		$pricing_info = Wpcom_Products::get_product_pricing( $suggested_addon );

		// Response
		$response = array(
			'slug'      => $suggested_addon,
			'size_text' => $addons_size_text_map[ $suggested_addon ],
			'pricing'   => $pricing_info,
		);

		return rest_ensure_response( $response );
	}

	/**
	 * Enqueue a new backup on demand
	 *
	 * @return string|WP_Error A JSON object with `success` if the request was successful,
	 * or a WP_Error otherwise.
	 */
	public static function enqueue_backup() {
		$blog_id  = Jetpack_Options::get_option( 'id' );
		$endpoint = sprintf( '/sites/%d/rewind/backups/enqueue', $blog_id );

		$response = Client::wpcom_json_api_request_as_user(
			$endpoint,
			'v2',
			array(
				'method' => 'POST',
			),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	/**
	 * Get site backup schedule time
	 *
	 * @return string|WP_Error A JSON object with the backup schedule time if the request was successful, or a WP_Error otherwise.
	 */
	public static function get_site_backup_schedule_time() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/rewind/scheduled',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	/**
	 * Removes plugin from the connection manager
	 * If it's the last plugin using the connection, the site will be disconnected.
	 *
	 * @access public
	 * @static
	 */
	public static function plugin_deactivation() {
		$manager = new Connection_Manager( 'jetpack-backup' );
		$manager->remove_connection();
	}

	/**
	 * Load wp-build when modernization is enabled on the Backup admin page.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_modernized() || ! self::is_backup_admin_request() ) {
			return;
		}

		self::load_wp_build();
		add_action( 'current_screen', array( __CLASS__, 'alias_screen_id_for_wp_build' ) );
	}

	/**
	 * Load the wp-build entry file and register its polyfills.
	 *
	 * Only called on `?page=jetpack-backup` admin requests when the
	 * modernization filter is enabled. Keeps wp-build off every other request.
	 *
	 * @return void
	 */
	private static function load_wp_build() {
		$build_index = dirname( __DIR__ ) . '/build/build.php';

		if ( ! file_exists( $build_index ) ) {
			return;
		}

		require_once $build_index;

		\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::register(
			'jetpack-backup',
			array_merge(
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::SCRIPT_HANDLES,
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::MODULE_IDS
			)
		);
	}

	/**
	 * Alias the current screen ID to satisfy wp-build's auto-generated enqueue check.
	 *
	 * Wp-build's `<page>-wp-admin` enqueue callback enqueues only when the screen ID
	 * matches the wp-build page slug (`jetpack-backup-dashboard`). Our WP-admin
	 * menu slug stays `jetpack-backup`, so we mutate the screen object in place
	 * to make the check pass without changing the user-facing URL.
	 *
	 * Hooked only when modernization is on AND we're on the Backup admin page,
	 * so this never affects any other request.
	 *
	 * @param \WP_Screen|null $screen The current screen object (passed by WP).
	 * @return void
	 */
	public static function alias_screen_id_for_wp_build( $screen ) {
		if ( ! is_object( $screen ) ) {
			return;
		}

		$screen->id = 'jetpack-backup-dashboard';
	}

	/**
	 * Returns true when the wp-build modernization filter is enabled.
	 *
	 * @return bool
	 */
	private static function is_modernized() {
		return (bool) apply_filters( self::MODERNIZATION_FILTER, false );
	}

	/**
	 * Returns true when the current request targets the Backup admin page.
	 *
	 * Used to scope wp-build loading to the one page that needs it. The
	 * `$_GET['page']` value is populated by wp-admin/admin.php before any of
	 * our hooks fire, so this check is reliable from `initialize()` onwards.
	 *
	 * @return bool
	 */
	private static function is_backup_admin_request() {
		if ( ! is_admin() || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return false;
		}

		return sanitize_text_field( wp_unslash( $_GET['page'] ) ) === self::JETPACK_BACKUP_SLUG; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}
}
