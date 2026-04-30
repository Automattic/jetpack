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
use WP_REST_Request;
use WP_REST_Response;
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
	 * Constructor.
	 */
	public static function initialize() {
		if ( did_action( 'jetpack_backup_initialized' ) ) {
			return;
		}

		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );

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
		$page_suffix = Admin_Menu::add_menu(
			'Jetpack VaultPress Backup',
			'VaultPress Backup', // Product name, do not translate.
			'manage_options',
			'jetpack-backup',
			array( __CLASS__, 'plugin_settings_page' ),
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

		// The Backup overview is a focused, full-screen product surface.
		// Suppress JITMs and other core/plugin admin notices so they don't
		// reflow on top of the dual-pane layout. Mirrors how Jetpack Forms
		// handles its dashboard page (`plugins/forms/src/dashboard/class-dashboard.php`).
		remove_all_actions( 'admin_notices' );
		remove_all_actions( 'all_admin_notices' );
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

		// Get the rewindable activity log entries for the Backups overview list.
		register_rest_route(
			'jetpack/v4',
			'/site/backup/activity-log',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_activity_log',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'number'    => array(
						'type'              => 'integer',
						'default'           => 100,
						'minimum'           => 1,
						'maximum'           => 1000,
						'sanitize_callback' => 'absint',
					),
					'aggregate' => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'after'     => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'before'    => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// List contents of a directory inside a backup — powers the file browser tree.
		register_rest_route(
			'jetpack/v4',
			'/site/backup/ls',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_ls',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'rewind_id' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'path'      => array(
						'type'              => 'string',
						'default'           => '/',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// Get metadata for a single file inside a backup (size, mtime, hash, download url).
		register_rest_route(
			'jetpack/v4',
			'/site/backup/path-info',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_path_info',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'rewind_id'      => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'manifest_path'  => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'extension_type' => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// Get a one-time signed download URL for a single file inside a backup.
		register_rest_route(
			'jetpack/v4',
			'/site/backup/file-url',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_file_url',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'rewind_id'             => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'encoded_manifest_path' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// Proxy the backup file CONTENT (not just the URL) for text/code
		// previews. The signed stream URL returned by file-url is cross-
		// origin when wp-admin lives on a different host than the WPCOM
		// API, and the stream endpoint doesn't set CORS headers — so a
		// browser-side `fetch(signedUrl)` fails. Having the server make
		// the request and return the body avoids the CORS issue.
		register_rest_route(
			'jetpack/v4',
			'/site/backup/file-content',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_file_content',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'rewind_id'             => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'encoded_manifest_path' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// Initiate a (full or granular) backup download. Returns a download
		// request id that the progress route polls for status / the final
		// signed download URL.
		register_rest_route(
			'jetpack/v4',
			'/site/backup/download',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::initiate_site_backup_download',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'rewind_id'         => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'types'             => array(
						'type'    => 'object',
						'default' => new \stdClass(),
					),
					'include_path_list' => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'exclude_path_list' => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// Poll progress for an in-flight download. Terminal states include
		// `url` populated (ready) or an error code / message.
		register_rest_route(
			'jetpack/v4',
			'/site/backup/download/progress',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_download_progress',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'download_id' => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// Prepare a filtered-download build for a specific manifest_filter /
		// data_type (e.g. a single db table). Returns a build key used by the
		// companion status endpoint below.
		register_rest_route(
			'jetpack/v4',
			'/site/backup/filtered/prepare',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::prepare_site_backup_filtered_download',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'rewind_id'       => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'manifest_filter' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'data_type'       => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// Poll status for a filtered-download build until the URL is ready.
		register_rest_route(
			'jetpack/v4',
			'/site/backup/filtered/status',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::get_site_backup_filtered_download_status',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'key'       => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'data_type' => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// Get a one-time signed download URL for a plugin / theme archive inside a backup.
		register_rest_route(
			'jetpack/v4',
			'/site/backup/extension-url',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_extension_url',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
				'args'                => array(
					'period'            => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'archive_type'      => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'extension_slug'    => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'extension_version' => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
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
	 * Proxy the rewindable activity log for the site.
	 *
	 * Powers the Backups overview list. Each entry carries the rewind_id,
	 * timestamp, summary, and `object.backup_stats` used to render the
	 * "13 plugins, 3 themes, 7 uploads…" metadata row.
	 *
	 * @param WP_REST_Request $request The REST request. Accepts `number`,
	 *                                 `aggregate`, `after`, `before`.
	 * @return WP_REST_Response|WP_Error The decoded WPCOM response, or
	 *                                   WP_Error on failure.
	 */
	public static function get_site_backup_activity_log( $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$query = array_filter(
			array(
				'number'    => $request->get_param( 'number' ),
				'aggregate' => $request->get_param( 'aggregate' ) ? 'true' : null,
				'after'     => $request->get_param( 'after' ),
				'before'    => $request->get_param( 'before' ),
			),
			static function ( $value ) {
				return null !== $value && '' !== $value;
			}
		);

		$endpoint = sprintf( '/sites/%d/activity/rewindable', $blog_id );
		if ( ! empty( $query ) ) {
			$endpoint .= '?' . http_build_query( $query );
		}

		$response = Client::wpcom_json_api_request_as_user(
			$endpoint,
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'backup_activity_log_fetch_failed',
				__( 'Could not fetch the site activity log.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}

	/**
	 * List the contents of a directory inside a backup.
	 *
	 * Proxies `POST wpcom/v2 sites/{id}/rewind/backup/ls`. Powers the file
	 * browser tree — each expanded directory issues one call for its children.
	 *
	 * @param WP_REST_Request $request The REST request. Requires `rewind_id`, `path`.
	 * @return WP_REST_Response|WP_Error The decoded WPCOM response, or WP_Error on failure.
	 */
	public static function get_site_backup_ls( $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/backup/ls', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			array(
				'backup_id' => $request->get_param( 'rewind_id' ),
				'path'      => $request->get_param( 'path' ),
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'backup_ls_fetch_failed',
				__( 'Could not list backup contents.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}

	/**
	 * Get metadata for a single file inside a backup.
	 *
	 * Proxies `POST wpcom/v2 sites/{id}/rewind/backup/path-info`. Powers the
	 * file info card (size, mtime, hash, row count, preview URL).
	 *
	 * @param WP_REST_Request $request The REST request. Requires `rewind_id`,
	 *                                 `manifest_path`; accepts `extension_type`.
	 * @return WP_REST_Response|WP_Error The decoded WPCOM response, or WP_Error on failure.
	 */
	public static function get_site_backup_path_info( $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/backup/path-info', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			array(
				'backup_id'      => $request->get_param( 'rewind_id' ),
				'manifest_path'  => $request->get_param( 'manifest_path' ),
				'extension_type' => $request->get_param( 'extension_type' ),
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'backup_path_info_fetch_failed',
				__( 'Could not fetch file metadata.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}

	/**
	 * Get a one-time signed download URL for a single file inside a backup.
	 *
	 * Proxies `GET wpcom/v2 sites/{id}/rewind/backup/{rewind_id}/file/{encoded_manifest_path}/url`.
	 * The `encoded_manifest_path` is the base64-encoded manifest path (UTF-8 safe).
	 *
	 * @param WP_REST_Request $request The REST request. Requires `rewind_id`, `encoded_manifest_path`.
	 * @return WP_REST_Response|WP_Error The decoded WPCOM response, or WP_Error on failure.
	 */
	public static function get_site_backup_file_url( $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/rewind/backup/%s/file/%s/url',
				$blog_id,
				rawurlencode( $request->get_param( 'rewind_id' ) ),
				rawurlencode( $request->get_param( 'encoded_manifest_path' ) )
			),
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'backup_file_url_fetch_failed',
				__( 'Could not fetch file download URL.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}

	/**
	 * Proxy a text file's content for the file-browser preview.
	 *
	 * Resolves the one-time signed URL via `rewind/backup/{id}/file/…/url`,
	 * fetches the stream server-side, and returns `{ content }` capped at
	 * 64 KB so a single-click preview can't balloon a response. The browser
	 * can't hit the stream URL directly because WPCOM's stream endpoint
	 * doesn't send CORS headers.
	 *
	 * @param WP_REST_Request $request The REST request. Requires `rewind_id`, `encoded_manifest_path`.
	 * @return WP_REST_Response|WP_Error The content response, or WP_Error on failure.
	 */
	public static function get_site_backup_file_content( $request ) {
		$blog_id               = Jetpack_Options::get_option( 'id' );
		$rewind_id             = $request->get_param( 'rewind_id' );
		$encoded_manifest_path = $request->get_param( 'encoded_manifest_path' );

		// Step 1: get the signed stream URL from WPCOM.
		$url_response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/rewind/backup/%s/file/%s/url',
				$blog_id,
				rawurlencode( $rewind_id ),
				rawurlencode( $encoded_manifest_path )
			),
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $url_response ) ) {
			return $url_response;
		}

		$url_status = wp_remote_retrieve_response_code( $url_response );
		if ( 200 !== $url_status ) {
			return new WP_Error(
				'backup_file_content_url_failed',
				__( 'Could not resolve file download URL.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $url_status ) && $url_status > 0 ? $url_status : 500 )
			);
		}

		$url_body   = json_decode( wp_remote_retrieve_body( $url_response ), true );
		$signed_url = is_array( $url_body ) && isset( $url_body['url'] ) ? $url_body['url'] : null;
		if ( ! $signed_url ) {
			return new WP_Error(
				'backup_file_content_url_missing',
				__( 'Could not resolve file download URL.', 'jetpack-backup-pkg' ),
				array( 'status' => 502 )
			);
		}

		// Step 2: fetch the stream body server-side.
		$stream_response = wp_remote_get(
			$signed_url,
			array(
				'timeout' => 15,
			)
		);

		if ( is_wp_error( $stream_response ) ) {
			return $stream_response;
		}

		$stream_status = wp_remote_retrieve_response_code( $stream_response );
		if ( 200 !== $stream_status ) {
			return new WP_Error(
				'backup_file_content_stream_failed',
				__( 'Could not fetch file content.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $stream_status ) && $stream_status > 0 ? $stream_status : 500 )
			);
		}

		$content = wp_remote_retrieve_body( $stream_response );

		// Cap preview size — enough to show wp-config.php / robots.txt
		// without breaking the REST response when someone previews a
		// multi-megabyte file.
		$max_bytes = 64 * 1024;
		if ( strlen( $content ) > $max_bytes ) {
			$content = substr( $content, 0, $max_bytes );
		}

		return rest_ensure_response( array( 'content' => $content ) );
	}

	/**
	 * Get a one-time signed download URL for a plugin or theme archive inside a backup.
	 *
	 * Proxies `POST wpcom/v2 sites/{id}/rewind/backup/{period}/extension/{archive_type}/url`.
	 * Used by the file browser when a node with `type: "archive"` is activated.
	 *
	 * @param WP_REST_Request $request The REST request. Requires `period`, `archive_type`,
	 *                                 `extension_slug`; accepts `extension_version`.
	 * @return WP_REST_Response|WP_Error The decoded WPCOM response, or WP_Error on failure.
	 */
	public static function get_site_backup_extension_url( $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/rewind/backup/%s/extension/%s/url',
				$blog_id,
				rawurlencode( $request->get_param( 'period' ) ),
				rawurlencode( $request->get_param( 'archive_type' ) )
			),
			'v2',
			array( 'method' => 'POST' ),
			array(
				'extension_slug'    => $request->get_param( 'extension_slug' ),
				'extension_version' => $request->get_param( 'extension_version' ),
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'backup_extension_url_fetch_failed',
				__( 'Could not fetch extension download URL.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}

	/**
	 * Initiate a backup download (full or granular).
	 *
	 * Proxies `POST wpcom/v2 sites/{id}/rewind/downloads`. When
	 * `include_path_list` is non-empty the request becomes a granular
	 * download — the wpcom side switches its `types` payload to `paths:true`
	 * automatically when those lists are present.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error The decoded WPCOM response, or WP_Error on failure.
	 */
	public static function initiate_site_backup_download( $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$include_paths = (string) $request->get_param( 'include_path_list' );
		$exclude_paths = (string) $request->get_param( 'exclude_path_list' );
		$is_granular   = '' !== $include_paths;

		$body = array(
			'rewindId' => $request->get_param( 'rewind_id' ),
			'types'    => $is_granular ? array( 'paths' => true ) : $request->get_param( 'types' ),
		);
		if ( $is_granular ) {
			$body['include_path_list'] = $include_paths;
			$body['exclude_path_list'] = $exclude_paths;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/downloads', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			$body,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'backup_download_initiate_failed',
				__( 'Could not start the backup download.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}

	/**
	 * Poll progress for an in-flight backup download.
	 *
	 * Proxies `GET wpcom/v2 sites/{id}/rewind/downloads/{downloadId}`.
	 *
	 * @param WP_REST_Request $request The REST request. Requires `download_id`.
	 * @return WP_REST_Response|WP_Error The decoded WPCOM response, or WP_Error on failure.
	 */
	public static function get_site_backup_download_progress( $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/rewind/downloads/%d',
				$blog_id,
				$request->get_param( 'download_id' )
			),
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'backup_download_progress_fetch_failed',
				__( 'Could not fetch download progress.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}

	/**
	 * Prepare a filtered-download build for a specific manifest entry.
	 *
	 * Proxies `POST wpcom/v2 sites/{id}/rewind/backup/filtered/prepare`.
	 * Used by the file info card when downloading a single database table.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error The decoded WPCOM response, or WP_Error on failure.
	 */
	public static function prepare_site_backup_filtered_download( $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/backup/filtered/prepare', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			array(
				'backup_id'       => $request->get_param( 'rewind_id' ),
				'manifest_filter' => $request->get_param( 'manifest_filter' ),
				'data_type'       => $request->get_param( 'data_type' ),
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'backup_filtered_prepare_failed',
				__( 'Could not prepare the filtered download.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}

	/**
	 * Poll status for a filtered-download build until the URL is ready.
	 *
	 * Proxies `POST wpcom/v2 sites/{id}/rewind/backup/filtered/status`.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error The decoded WPCOM response, or WP_Error on failure.
	 */
	public static function get_site_backup_filtered_download_status( $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/backup/filtered/status', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			array(
				'data_type' => $request->get_param( 'data_type' ),
				'key'       => $request->get_param( 'key' ),
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'backup_filtered_status_fetch_failed',
				__( 'Could not fetch filtered-download status.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
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
}
