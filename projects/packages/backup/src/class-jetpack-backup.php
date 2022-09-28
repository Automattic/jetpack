<?php
/**
 * Primary class file for the Jetpack Backup plugin.
 *
 * @package automattic/jetpack-backup-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Backup\Initial_State as Backup_Initial_State;
use Automattic\Jetpack\Backup\Jetpack_Backup_Upgrades;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Status;

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

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Backup', 'jetpack-backup-pkg' ),
			_x( 'Backup', 'The Jetpack Backup product name, without the Jetpack prefix', 'jetpack-backup-pkg' ),
			'manage_options',
			'jetpack-backup',
			array( __CLASS__, 'plugin_settings_page' ),
			99
		);
		add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );

		// Init Jetpack packages.
		add_action(
			'plugins_loaded',
			function () {
				$config = new Automattic\Jetpack\Config();
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

		My_Jetpack_Initializer::init();

		/**
		 * Runs right after the Jetpack Backup package is initialized.
		 *
		 * @since 1.3.0
		 */
		do_action( 'jetpack_backup_initialized' );
	}

	/**
	 * Initialize the admin resources.
	 */
	public static function admin_init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_scripts' ) );
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
	 * Enqueue plugin admin scripts and styles.
	 */
	public static function enqueue_admin_scripts() {
		$status  = new Status();
		$manager = new Connection_Manager( 'jetpack-backup' );

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
		wp_add_inline_script( 'jetpack-backup', Connection_Initial_State::render(), 'before' );

		// Load script for analytics.
		if ( ! $status->is_offline_mode() && $manager->is_connected() ) {
			wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
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
				'methods'             => \WP_REST_Server::EDITABLE,
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
		$blog_id = \Jetpack_Options::get_option( 'id' );

		$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog(
			'/sites/' . $blog_id . '/rewind/backups',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== $response['response']['code'] ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
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
		$blog_id = \Jetpack_Options::get_option( 'id' );

		$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/rewind/capabilities',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return null;
		}

		if ( 200 !== $response['response']['code'] ) {
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
		$blog_id  = \Jetpack_Options::get_option( 'id' );
		$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog(
			'/sites/' . $blog_id . '/rewind/restores',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== $response['response']['code'] ) {
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
	 * Returns the result of `/sites/%d/purchases` endpoint call.
	 *
	 * @return array of site purchases.
	 */
	public static function get_site_current_purchases() {

		$request  = sprintf( '/sites/%d/purchases', \Jetpack_Options::get_option( 'id' ) );
		$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog( $request, '1.1' );

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
				\Jetpack_Options::get_option( 'dismissed_backup_review_' . $request['option_name'] )
			);
		}

		return \Jetpack_Options::update_option( 'dismissed_backup_review_' . $request['option_name'], true );
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
