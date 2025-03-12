<?php
/**
 * WP Admin page with information and configuration shared among all Jetpack stand-alone plugins
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_History;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Constants as Jetpack_Constants;
use Automattic\Jetpack\ExPlat;
use Automattic\Jetpack\JITMS\JITM;
use Automattic\Jetpack\Licensing;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Plugins_Installer;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host as Status_Host;
use Automattic\Jetpack\Sync\Functions as Sync_Functions;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;
use Automattic\Jetpack\VideoPress\Stats as VideoPress_Stats;
use Automattic\Jetpack\Waf\Waf_Runner;
use Jetpack;
use WP_Error;

/**
 * The main Initializer class that registers the admin menu and eneuque the assets.
 */
class Initializer {

	/**
	 * My Jetpack package version
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '5.5.3';

	/**
	 * HTML container ID for the IDC screen on My Jetpack page.
	 */
	private const IDC_CONTAINER_ID = 'my-jetpack-identity-crisis-container';

	private const JETPACK_PLUGIN_SLUGS = array(
		'jetpack-backup',
		'jetpack-boost',
		'zerobscrm',
		'jetpack',
		'jetpack-protect',
		'jetpack-social',
		'jetpack-videopress',
		'jetpack-search',
	);

	private const MY_JETPACK_SITE_INFO_TRANSIENT_KEY  = 'my-jetpack-site-info';
	private const MISSING_CONNECTION_NOTIFICATION_KEY = 'missing-connection';
	private const VIDEOPRESS_STATS_KEY                = 'my-jetpack-videopress-stats';
	private const VIDEOPRESS_PERIOD_KEY               = 'my-jetpack-videopress-period';
	private const MY_JETPACK_RED_BUBBLE_TRANSIENT_KEY = 'my-jetpack-red-bubble-transient';

	/**
	 * Holds info/data about the site (from the /sites/%d endpoint)
	 *
	 * @var object
	 */
	public static $site_info;

	/**
	 * Initialize My Jetpack
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::should_initialize() || did_action( 'my_jetpack_init' ) ) {
			return;
		}

		// Extend jetpack plugins action links.
		Products::extend_plugins_action_links();

		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		if ( self::is_licensing_ui_enabled() ) {
			Licensing::instance()->initialize();
		}

		// Initialize Boost Speed Score
		new Speed_Score( array(), 'jetpack-my-jetpack' );

		// Add custom WP REST API endoints.
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_endpoints' ) );

		add_action( 'admin_menu', array( __CLASS__, 'add_my_jetpack_menu_item' ) );

		add_action( 'admin_init', array( __CLASS__, 'setup_historically_active_jetpack_modules_sync' ) );
		// This is later than the admin-ui package, which runs on 1000
		add_action( 'admin_init', array( __CLASS__, 'maybe_show_red_bubble' ), 1001 );

		//  Set up the ExPlat package endpoints
		ExPlat::init();

		// Sets up JITMS.
		JITM::configure();

		// Add "Activity Log" menu item.
		Activitylog::init();

		// Add "Jetpack Manage" menu item.
		Jetpack_Manage::init();

		/**
		 * Fires after the My Jetpack package is initialized
		 *
		 * @since 0.1.0
		 */
		do_action( 'my_jetpack_init' );
	}

	/**
	 * Acts as a feature flag, returning a boolean for whether we should show the licensing UI.
	 *
	 * @since 1.2.0
	 *
	 * @return boolean
	 */
	public static function is_licensing_ui_enabled() {
		// Default changed to true in 1.5.0.
		$is_enabled = true;

		/*
		 * Bail if My Jetpack is not enabled,
		 * and thus the licensing UI shouldn't be enabled either.
		 */
		if ( ! self::should_initialize() ) {
			$is_enabled = false;
		}

		/**
		 * Acts as a feature flag, returning a boolean for whether we should show the licensing UI.
		 *
		 * @param bool $is_enabled Defaults to true.
		 *
		 * @since 1.2.0
		 * @since 1.5.0 Update default value to true.
		 */
		return apply_filters(
			'jetpack_my_jetpack_should_enable_add_license_screen',
			$is_enabled
		);
	}

	/**
	 * Add My Jetpack menu item to the admin menu.
	 *
	 * @return void
	 */
	public static function add_my_jetpack_menu_item() {
		$page_suffix = Admin_Menu::add_menu(
			__( 'My Jetpack', 'jetpack-my-jetpack' ),
			__( 'My Jetpack', 'jetpack-my-jetpack' ),
			'edit_posts',
			'my-jetpack',
			array( __CLASS__, 'admin_page' ),
			-1
		);
		add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
	}

	/**
	 * Callback for the load my jetpack page hook.
	 *
	 * @return void
	 */
	public static function admin_init() {
		self::$site_info = self::get_site_info();
		add_filter( 'identity_crisis_container_id', array( static::class, 'get_idc_container_id' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
		// Product statuses are constantly changing, so we never want to cache the page.
		header( 'Cache-Control: no-cache, no-store, must-revalidate' );
		header( 'Pragma: no-cache' );
		header( 'Expires: 0' );
	}

	/**
	 * Returns whether we are in condition to track to use
	 * Analytics functionality like Tracks, MC, or GA.
	 */
	public static function can_use_analytics() {
		$status     = new Status();
		$connection = new Connection_Manager();
		$tracking   = new Tracking( 'jetpack', $connection );

		return $tracking->should_enable_tracking( new Terms_Of_Service(), $status );
	}

	/**
	 * Enqueue admin page assets.
	 *
	 * @return void
	 */
	public static function enqueue_scripts() {
		/**
		 * Fires after the My Jetpack page is initialized.
		 * Allows for enqueuing additional scripts only on the My Jetpack page.
		 *
		 * @since 4.35.7
		 */
		do_action( 'myjetpack_enqueue_scripts' );
		Assets::register_script(
			'my_jetpack_main_app',
			'../build/index.js',
			__FILE__,
			array(
				'enqueue'    => true,
				'in_footer'  => true,
				'textdomain' => 'jetpack-my-jetpack',
			)
		);
		$modules             = new Modules();
		$connection          = new Connection_Manager();
		$speed_score_history = new Speed_Score_History( get_site_url() );
		$latest_score        = $speed_score_history->latest();
		$previous_score      = array();
		if ( $speed_score_history->count() > 1 ) {
			$previous_score = $speed_score_history->latest( 1 );
		}
		$latest_score['previousScores'] = $previous_score['scores'] ?? array();

		Products::initialize_products();
		$scan_data = Products\Protect::get_protect_data();

		$waf_config     = array();
		$waf_supported  = false;
		$is_waf_enabled = false;

		$sandboxed_domain = '';
		$is_dev_version   = false;
		if ( class_exists( 'Jetpack' ) ) {
			$is_dev_version   = Jetpack::is_development_version();
			$sandboxed_domain = defined( 'JETPACK__SANDBOX_DOMAIN' ) ? JETPACK__SANDBOX_DOMAIN : '';
		}

		if ( class_exists( 'Automattic\Jetpack\Waf\Waf_Runner' ) ) {
			$waf_config     = Waf_Runner::get_config();
			$is_waf_enabled = Waf_Runner::is_enabled();
			$waf_supported  = Waf_Runner::is_supported_environment();
		}

		wp_localize_script(
			'my_jetpack_main_app',
			'myJetpackInitialState',
			array(
				'products'               => array(
					'items' => Products::get_products(),
				),
				'plugins'                => Plugins_Installer::get_plugins(),
				'themes'                 => Sync_Functions::get_themes(),
				'myJetpackUrl'           => admin_url( 'admin.php?page=my-jetpack' ),
				'myJetpackCheckoutUri'   => admin_url( 'admin.php?page=my-jetpack' ),
				'topJetpackMenuItemUrl'  => Admin_Menu::get_top_level_menu_item_url(),
				'siteSuffix'             => ( new Status() )->get_site_suffix(),
				'siteUrl'                => esc_url( get_site_url() ),
				'blogID'                 => Connection_Manager::get_site_id( true ),
				'myJetpackVersion'       => self::PACKAGE_VERSION,
				'myJetpackFlags'         => self::get_my_jetpack_flags(),
				'fileSystemWriteAccess'  => self::has_file_system_write_access(),
				'loadAddLicenseScreen'   => self::is_licensing_ui_enabled(),
				'adminUrl'               => esc_url( admin_url() ),
				'IDCContainerID'         => static::get_idc_container_id(),
				'userIsAdmin'            => current_user_can( 'manage_options' ),
				'lifecycleStats'         => array(
					'jetpackPlugins'            => self::get_installed_jetpack_plugins(),
					'historicallyActiveModules' => \Jetpack_Options::get_option( 'historically_active_modules', array() ),
					'brokenModules'             => self::check_for_broken_modules(),
					'isSiteConnected'           => $connection->is_connected(),
					'isUserConnected'           => $connection->is_user_connected(),
					'modules'                   => self::get_active_modules(),
				),
				// Only in the My Jetpack context, we get the alerts without the cache to make sure we have the most up-to-date info
				'redBubbleAlerts'        => self::get_red_bubble_alerts( true ),
				'recommendedModules'     => array(
					'modules'    => self::get_recommended_modules(),
					'isFirstRun' => \Jetpack_Options::get_option( 'recommendations_first_run', true ),
					'dismissed'  => \Jetpack_Options::get_option( 'dismissed_recommendations', false ),
				),
				'isStatsModuleActive'    => $modules->is_active( 'stats' ),
				'canUserViewStats'       => current_user_can( 'manage_options' ) || current_user_can( 'view_stats' ),
				'isCommercial'           => self::is_commercial_site(),
				'sandboxedDomain'        => $sandboxed_domain,
				'isDevVersion'           => $is_dev_version,
				'isAtomic'               => ( new Status_Host() )->is_woa_site(),
				'jetpackManage'          => array(
					'isEnabled'       => Jetpack_Manage::could_use_jp_manage(),
					'isAgencyAccount' => Jetpack_Manage::is_agency_account(),
				),
				'latestBoostSpeedScores' => $latest_score,
				'protect'                => array(
					'scanData'  => $scan_data,
					'wafConfig' => array_merge(
						$waf_config,
						array(
							'waf_supported' => $waf_supported,
							'waf_enabled'   => $is_waf_enabled,
						),
						array( 'blocked_logins' => (int) get_site_option( 'jetpack_protect_blocked_attempts', 0 ) )
					),
				),
				'videopress'             => self::get_videopress_stats(),
			)
		);

		wp_localize_script(
			'my_jetpack_main_app',
			'myJetpackRest',
			array(
				'apiRoot'  => esc_url_raw( rest_url() ),
				'apiNonce' => wp_create_nonce( 'wp_rest' ),
			)
		);

		// Connection Initial State.
		Connection_Initial_State::render_script( 'my_jetpack_main_app' );

		// Required for Analytics.
		if ( self::can_use_analytics() ) {
			Tracking::register_tracks_functions_scripts( true );
		}
	}

	/**
	 * Get stats for VideoPress
	 *
	 * @return array|WP_Error
	 */
	public static function get_videopress_stats() {
		$video_count = array_sum( (array) wp_count_attachments( 'video' ) );

		if ( ! class_exists( 'Automattic\Jetpack\VideoPress\Stats' ) ) {
			return array(
				'videoCount' => $video_count,
			);
		}

		$featured_stats = get_transient( self::VIDEOPRESS_STATS_KEY );

		if ( $featured_stats ) {
			return array(
				'featuredStats' => $featured_stats,
				'videoCount'    => $video_count,
			);
		}

		$stats_period     = get_transient( self::VIDEOPRESS_PERIOD_KEY );
		$videopress_stats = new VideoPress_Stats();

		// If the stats period exists, retrieve that information without checking the view count.
		// If it does not, check the view count of monthly stats and determine if we want to show yearly or monthly stats.
		if ( $stats_period ) {
			if ( $stats_period === 'day' ) {
				$featured_stats = $videopress_stats->get_featured_stats( 60, 'day' );
			} else {
				$featured_stats = $videopress_stats->get_featured_stats( 2, 'year' );
			}
		} else {
			$featured_stats = $videopress_stats->get_featured_stats( 60, 'day' );

			if (
				! is_wp_error( $featured_stats ) &&
				$featured_stats &&
				( $featured_stats['data']['views']['current'] < 500 || $featured_stats['data']['views']['previous'] < 500 )
			) {
				$featured_stats = $videopress_stats->get_featured_stats( 2, 'year' );
			}
		}

		if ( is_wp_error( $featured_stats ) || ! $featured_stats ) {
			return array(
				'videoCount' => $video_count,
			);
		}

		set_transient( self::VIDEOPRESS_PERIOD_KEY, $featured_stats['period'], WEEK_IN_SECONDS );
		set_transient( self::VIDEOPRESS_STATS_KEY, $featured_stats, DAY_IN_SECONDS );

		return array(
			'featuredStats' => $featured_stats,
			'videoCount'    => $video_count,
		);
	}

	/**
	 * Get installed Jetpack plugins
	 *
	 * @return array
	 */
	public static function get_installed_jetpack_plugins() {
		$plugin_slugs = array_keys( Plugins_Installer::get_plugins() );
		$plugin_slugs = array_map(
			static function ( $slug ) {
				$parts = explode( '/', $slug );
				if ( empty( $parts ) ) {
					return '';
				}
				// Return the last segment of the filepath without the PHP extension
				return str_replace( '.php', '', $parts[ count( $parts ) - 1 ] );
			},
			$plugin_slugs
		);

		return array_values( array_intersect( self::JETPACK_PLUGIN_SLUGS, $plugin_slugs ) );
	}

	/**
	 * Get active modules (except ones enabled by default)
	 *
	 * @return array
	 */
	public static function get_active_modules() {
		$modules        = new Modules();
		$active_modules = $modules->get_active();

		// if the Jetpack plugin is active, filter out the modules that are active by default
		if ( class_exists( 'Jetpack' ) && ! empty( $active_modules ) ) {
			$active_modules = array_diff( $active_modules, Jetpack::get_default_modules() );
		}
		return array_values( $active_modules );
	}

	/**
	 * Determine if the current user is "new" to Jetpack
	 * This is used to vary some messaging in My Jetpack
	 *
	 * On the front-end, purchases are also taken into account
	 *
	 * @return bool
	 */
	public static function is_jetpack_user_new() {
		// is the user connected?
		$connection = new Connection_Manager();
		if ( $connection->is_user_connected() ) {
			return false;
		}

		// TODO: add a data point for the last known connection/ disconnection time

		// are any modules active?
		$active_modules = self::get_active_modules();
		if ( ! empty( $active_modules ) ) {
			return false;
		}

		// check for other Jetpack plugins that are installed on the site (active or not)
		// If there's more than one Jetpack plugin active, this user is not "new"
		$plugin_slugs              = array_keys( Plugins_Installer::get_plugins() );
		$plugin_slugs              = array_map(
			static function ( $slug ) {
				$parts = explode( '/', $slug );
				if ( empty( $parts ) ) {
					return '';
				}
				// Return the last segment of the filepath without the PHP extension
				return str_replace( '.php', '', $parts[ count( $parts ) - 1 ] );
			},
			$plugin_slugs
		);
		$installed_jetpack_plugins = array_intersect( self::JETPACK_PLUGIN_SLUGS, $plugin_slugs );
		if ( is_countable( $installed_jetpack_plugins ) && count( $installed_jetpack_plugins ) >= 2 ) {
			return false;
		}

		// Does the site have any purchases?
		$purchases = Wpcom_Products::get_site_current_purchases();
		if ( ! empty( $purchases ) && ! is_wp_error( $purchases ) ) {
			return false;
		}

		return true;
	}

	/**
	 *  Build flags for My Jetpack UI
	 *
	 *  @return array
	 */
	public static function get_my_jetpack_flags() {
		$flags = array(
			'videoPressStats'          => Jetpack_Constants::is_true( 'JETPACK_MY_JETPACK_VIDEOPRESS_STATS_ENABLED' ),
			'showFullJetpackStatsCard' => class_exists( 'Jetpack' ),
		);

		return $flags;
	}

	/**
	 * Echoes the admin page content.
	 *
	 * @return void
	 */
	public static function admin_page() {
		echo '<div id="my-jetpack-container"></div>';
	}

	/**
	 * Register the REST API routes.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		new REST_Products();
		new REST_Purchases();
		new REST_Zendesk_Chat();
		new REST_AI();
		new REST_Recommendations_Evaluation();

		Products::register_product_endpoints();
		Historically_Active_Modules::register_rest_endpoints();

		register_rest_route(
			'my-jetpack/v1',
			'site',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'site/dismiss-welcome-banner',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::dismiss_welcome_banner',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

	/**
	 * Check user capability to access the endpoint.
	 *
	 * @access public
	 * @static
	 *
	 * @return true|WP_Error
	 */
	public static function permissions_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Return true if we should initialize the My Jetpack admin page.
	 */
	public static function should_initialize() {
		$should = true;

		if ( is_multisite() ) {
			$should = false;
		}

		// All options presented in My Jetpack require a connection to WordPress.com.
		if ( ( new Status() )->is_offline_mode() ) {
			$should = false;
		}

		/**
		 * Allows filtering whether My Jetpack should be initialized.
		 *
		 * @since 0.5.0-alpha
		 *
		 * @param bool $shoud_initialize Should we initialize My Jetpack?
		 */
		return apply_filters( 'jetpack_my_jetpack_should_initialize', $should );
	}

	/**
	 * Hook into several connection-based actions to update the historically active Jetpack modules
	 * If the transient that indicates the list needs to be synced, update it and delete the transient
	 *
	 * @return void
	 */
	public static function setup_historically_active_jetpack_modules_sync() {
		// yummmm. ham.
		$ham = new Historically_Active_Modules();
		if ( get_transient( $ham::UPDATE_HISTORICALLY_ACTIVE_JETPACK_MODULES_KEY ) && ! wp_doing_ajax() ) {
			$ham::update_historically_active_jetpack_modules();
			delete_transient( $ham::UPDATE_HISTORICALLY_ACTIVE_JETPACK_MODULES_KEY );
		}

		$actions = array(
			'jetpack_site_registered',
			'jetpack_user_authorized',
			'activated_plugin',
		);

		foreach ( $actions as $action ) {
			add_action( $action, array( $ham, 'queue_historically_active_jetpack_modules_update' ), 5 );
		}

		// Modules are often updated async, so we need to update them right away as there will sometimes be no page reload.
		add_action( 'jetpack_activate_module', array( $ham, 'update_historically_active_jetpack_modules' ), 5 );
	}

	/**
	 * Site full-data endpoint.
	 *
	 * @return object Site data.
	 */
	public static function get_site() {
		$site_id           = \Jetpack_Options::get_option( 'id' );
		$wpcom_endpoint    = sprintf( '/sites/%d?force=wpcom', $site_id );
		$wpcom_api_version = '1.1';
		$response          = Client::wpcom_json_api_request_as_blog( $wpcom_endpoint, $wpcom_api_version );
		$response_code     = wp_remote_retrieve_response_code( $response );
		$body              = json_decode( wp_remote_retrieve_body( $response ) );

		if ( is_wp_error( $response ) || empty( $response['body'] ) ) {
			return new WP_Error( 'site_data_fetch_failed', 'Site data fetch failed', array( 'status' => $response_code ) );
		}

		return rest_ensure_response( $body );
	}

	/**
	 * Populates the self::$site_info var with site data from the /sites/%d endpoint
	 *
	 * @return object|WP_Error
	 */
	public static function get_site_info() {
		static $site_info = null;

		if ( $site_info !== null ) {
			return $site_info;
		}

		// Check for a cached value before doing lookup
		$stored_site_info = get_transient( self::MY_JETPACK_SITE_INFO_TRANSIENT_KEY );
		if ( $stored_site_info !== false ) {
			return $stored_site_info;
		}

		$response = self::get_site();
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		$site_info = $response->data;
		set_transient( self::MY_JETPACK_SITE_INFO_TRANSIENT_KEY, $site_info, DAY_IN_SECONDS );

		return $site_info;
	}

	/**
	 * Returns whether a site has been determined "commercial" or not.
	 *
	 * @return bool|null
	 */
	public static function is_commercial_site() {
		if ( is_wp_error( self::$site_info ) ) {
			return null;
		}

		return empty( self::$site_info->options->is_commercial ) ? false : self::$site_info->options->is_commercial;
	}

	/**
	 * Check if site is registered (has been connected before).
	 *
	 * @return bool
	 */
	public static function is_registered() {
		return (bool) \Jetpack_Options::get_option( 'id' );
	}

	/**
	 * Dismiss the welcome banner.
	 *
	 * @return \WP_REST_Response
	 */
	public static function dismiss_welcome_banner() {
		\Jetpack_Options::update_option( 'dismissed_welcome_banner', true );
		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Returns true if the site has file write access to the plugins folder, false otherwise.
	 *
	 * @return string
	 **/
	public static function has_file_system_write_access() {

		$cache = get_transient( 'my_jetpack_write_access' );

		if ( false !== $cache ) {
			return $cache;
		}

		if ( ! function_exists( 'get_filesystem_method' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		require_once ABSPATH . 'wp-admin/includes/template.php';

		$write_access = 'no';

		$filesystem_method = get_filesystem_method( array(), WP_PLUGIN_DIR );
		if ( 'direct' === $filesystem_method ) {
			$write_access = 'yes';
		}

		if ( ! $write_access ) {
			ob_start();
			$filesystem_credentials_are_stored = request_filesystem_credentials( self_admin_url() );
			ob_end_clean();

			if ( $filesystem_credentials_are_stored ) {
				$write_access = 'yes';
			}
		}

		set_transient( 'my_jetpack_write_access', $write_access, 30 * MINUTE_IN_SECONDS );

		return $write_access;
	}

	/**
	 * Get container IDC for the IDC screen.
	 *
	 * @return string
	 */
	public static function get_idc_container_id() {
		return static::IDC_CONTAINER_ID;
	}

	/**
	 * Gets the plugins that need installed or activated for each paid plan.
	 *
	 * @return array
	 */
	public static function get_paid_plans_plugins_requirements() {
		$plugin_requirements = array();
		foreach ( Products::get_products_classes() as $slug => $product_class ) {
			// Skip these- we don't show them in My Jetpack.
			if ( in_array( $slug, Products::get_not_shown_products(), true ) ) {
				continue;
			}
			if ( ! $product_class::has_paid_plan_for_product() ) {
				continue;
			}
			$purchase = $product_class::get_paid_plan_purchase_for_product();
			if ( ! $purchase ) {
				continue;
			}
			// Check if required plugin needs installed or activated.
			if ( ! $product_class::is_plugin_installed() ) {
				// Plugin needs installed (and activated)
				$plugin_requirements[ $purchase->product_slug ]['needs_installed'][] = $product_class::$slug;
			} elseif ( ! $product_class::is_plugin_active() ) {
				// Plugin is installed, but not activated.
				$plugin_requirements[ $purchase->product_slug ]['needs_activated_only'][] = $product_class::$slug;
			}
		}

		return $plugin_requirements;
	}

	/**
	 * Conditionally append the red bubble notification to the "Jetpack" menu item if there are alerts to show
	 *
	 * @return void
	 */
	public static function maybe_show_red_bubble() {
		global $menu;

		// Don't show red bubble alerts for non-admin users
		// These alerts are generally only actionable for admins
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// filters for the items in this file
		add_filter( 'my_jetpack_red_bubble_notification_slugs', array( __CLASS__, 'add_red_bubble_alerts' ) );
		$red_bubble_alerts = array_filter(
			self::get_red_bubble_alerts(),
			function ( $alert ) {
				// We don't want to show the red bubble for silent alerts
				return empty( $alert['is_silent'] );
			}
		);

		// The Jetpack menu item should be on index 3
		if (
			! empty( $red_bubble_alerts ) &&
			is_countable( $red_bubble_alerts ) &&
			isset( $menu[3] ) &&
			$menu[3][0] === 'Jetpack'
		) {
			// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			$menu[3][0] .= sprintf( ' <span class="awaiting-mod">%d</span>', count( $red_bubble_alerts ) );
		}
	}

	/**
	 * Collect all possible alerts that we might use a red bubble notification for
	 *
	 * @param bool $bypass_cache - whether to bypass the red bubble cache.
	 * @return array
	 */
	public static function get_red_bubble_alerts( bool $bypass_cache = false ) {
		static $red_bubble_alerts = array();

		// using a static cache since we call this function more than once in the class
		if ( ! empty( $red_bubble_alerts ) ) {
			return $red_bubble_alerts;
		}

		// check for stored alerts
		$stored_alerts = get_transient( self::MY_JETPACK_RED_BUBBLE_TRANSIENT_KEY );
		// Cache bypass for red bubbles should only happen on the My Jetpack page
		if ( $stored_alerts !== false && ! ( $bypass_cache ) ) {
			return $stored_alerts;
		}

		// go find the alerts
		$red_bubble_alerts = apply_filters( 'my_jetpack_red_bubble_notification_slugs', $red_bubble_alerts );
		// cache the alerts for one hour
		set_transient( self::MY_JETPACK_RED_BUBBLE_TRANSIENT_KEY, $red_bubble_alerts, 3600 );

		return $red_bubble_alerts;
	}

	/**
	 * Get list of module names sorted by their recommendation score
	 *
	 * @return array|null
	 */
	public static function get_recommended_modules() {
		$recommendations_evaluation = \Jetpack_Options::get_option( 'recommendations_evaluation', null );

		if ( ! $recommendations_evaluation ) {
			return null;
		}

		arsort( $recommendations_evaluation ); // Sort by scores in descending order

		return array_keys( $recommendations_evaluation ); // Get only module names
	}

	/**
	 * Check for features broken by a disconnected user or site
	 *
	 * @return array
	 */
	public static function check_for_broken_modules() {
		$connection        = new Connection_Manager();
		$is_user_connected = $connection->is_user_connected() || $connection->has_connected_owner();
		$is_site_connected = $connection->is_connected();
		$broken_modules    = array(
			'needs_site_connection' => array(),
			'needs_user_connection' => array(),
		);

		if ( $is_user_connected && $is_site_connected ) {
			return $broken_modules;
		}

		$products                    = Products::get_products_classes();
		$historically_active_modules = \Jetpack_Options::get_option( 'historically_active_modules', array() );

		foreach ( $products as $product ) {
			if ( ! in_array( $product::$slug, $historically_active_modules, true ) ) {
				continue;
			}

			if ( $product::$requires_user_connection && ! $is_user_connected ) {
				if ( ! in_array( $product::$slug, $broken_modules['needs_user_connection'], true ) ) {
					$broken_modules['needs_user_connection'][] = $product::$slug;
				}
			} elseif ( ! $is_site_connected ) {
				if ( ! in_array( $product::$slug, $broken_modules['needs_site_connection'], true ) ) {
					$broken_modules['needs_site_connection'][] = $product::$slug;
				}
			}
		}

		return $broken_modules;
	}

	/**
	 *  Add relevant red bubble notifications
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function add_red_bubble_alerts( array $red_bubble_slugs ) {
		if ( wp_doing_ajax() ) {
			return array();
		}
		$connection               = new Connection_Manager();
		$welcome_banner_dismissed = \Jetpack_Options::get_option( 'dismissed_welcome_banner', false );
		if ( self::is_jetpack_user_new() && ! $welcome_banner_dismissed ) {
			$red_bubble_slugs['welcome-banner-active'] = array(
				'is_silent' => $connection->is_connected(), // we don't display the red bubble if the user is connected
			);
			return $red_bubble_slugs;
		} else {
			return array_merge(
				self::alert_if_missing_connection( $red_bubble_slugs ),
				self::alert_if_last_backup_failed( $red_bubble_slugs ),
				self::alert_if_paid_plan_expiring( $red_bubble_slugs ),
				self::alert_if_protect_has_threats( $red_bubble_slugs ),
				self::alert_if_paid_plan_requires_plugin_install_or_activation( $red_bubble_slugs )
			);
		}
	}

	/**
	 * Add an alert slug if the site is missing a site connection
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function alert_if_missing_connection( array $red_bubble_slugs ) {
		$broken_modules = self::check_for_broken_modules();
		$connection     = new Connection_Manager();

		// Checking for site connection issues first.
		if ( ! empty( $broken_modules['needs_site_connection'] ) ) {
			$red_bubble_slugs[ self::MISSING_CONNECTION_NOTIFICATION_KEY ] = array(
				'type'     => 'site',
				'is_error' => true,
			);
			return $red_bubble_slugs;
		}

		if ( ! empty( $broken_modules['needs_user_connection'] ) ) {
			$red_bubble_slugs[ self::MISSING_CONNECTION_NOTIFICATION_KEY ] = array(
				'type'     => 'user',
				'is_error' => true,
			);
			return $red_bubble_slugs;
		}

		if ( ! $connection->is_connected() ) {
			$red_bubble_slugs[ self::MISSING_CONNECTION_NOTIFICATION_KEY ] = array(
				'type'     => 'site',
				'is_error' => false,
			);
			return $red_bubble_slugs;
		}

		return $red_bubble_slugs;
	}

	/**
	 * Add an alert slug if any paid plan/products are expiring or expired.
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function alert_if_paid_plan_expiring( array $red_bubble_slugs ) {
		$connection = new Connection_Manager();
		if ( ! $connection->is_connected() ) {
			return $red_bubble_slugs;
		}
		$product_classes = Products::get_products_classes();

		$products_included_in_expiring_plan = array();
		foreach ( $product_classes as $key => $product ) {
			// Skip these- we don't show them in My Jetpack.
			if ( in_array( $key, Products::get_not_shown_products(), true ) ) {
				continue;
			}

			if ( $product::has_paid_plan_for_product() ) {
				$purchase = $product::get_paid_plan_purchase_for_product();
				if ( $purchase ) {
					$redbubble_notice_data = array(
						'product_slug'   => $purchase->product_slug,
						'product_name'   => $purchase->product_name,
						'expiry_date'    => $purchase->expiry_date,
						'expiry_message' => $purchase->expiry_message,
						'manage_url'     => $product::get_manage_paid_plan_purchase_url(),
					);

					if ( $product::is_paid_plan_expired() && empty( $_COOKIE[ "$purchase->product_slug--plan_expired_dismissed" ] ) ) {
						$red_bubble_slugs[ "$purchase->product_slug--plan_expired" ] = $redbubble_notice_data;
						if ( ! $product::is_bundle_product() ) {
							$products_included_in_expiring_plan[ "$purchase->product_slug--plan_expired" ][] = $product::get_name();
						}
					}
					if ( $product::is_paid_plan_expiring() && empty( $_COOKIE[ "$purchase->product_slug--plan_expiring_soon_dismissed" ] ) ) {
						$red_bubble_slugs[ "$purchase->product_slug--plan_expiring_soon" ]               = $redbubble_notice_data;
						$red_bubble_slugs[ "$purchase->product_slug--plan_expiring_soon" ]['manage_url'] = $product::get_renew_paid_plan_purchase_url();
						if ( ! $product::is_bundle_product() ) {
							$products_included_in_expiring_plan[ "$purchase->product_slug--plan_expiring_soon" ][] = $product::get_name();
						}
					}
				}
			}
		}

		foreach ( $products_included_in_expiring_plan as $expiring_plan => $products ) {
			$red_bubble_slugs[ $expiring_plan ]['products_effected'] = $products;
		}

		return $red_bubble_slugs;
	}

	/**
	 * Add an alert slug if Backups are failing or having an issue.
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function alert_if_last_backup_failed( array $red_bubble_slugs ) {
		// Make sure the Notice wasn't previously dismissed.
		if ( ! empty( $_COOKIE['backup_failure_dismissed'] ) ) {
			return $red_bubble_slugs;
		}
		// Make sure there's a Backup paid plan
		if ( ! Products\Backup::is_plugin_active() || ! Products\Backup::has_paid_plan_for_product() ) {
			return $red_bubble_slugs;
		}
		// Make sure the plan isn't just recently purchased in last 30min.
		// Give some time to queue & run the first backup.
		$purchase = Products\Backup::get_paid_plan_purchase_for_product();
		if ( $purchase ) {
			$thirty_minutes_after_plan_purchase = strtotime( $purchase->subscribed_date . ' +30 minutes' );
			if ( strtotime( 'now' ) < $thirty_minutes_after_plan_purchase ) {
				return $red_bubble_slugs;
			}
		}

		$backup_failed_status = Products\Backup::does_module_need_attention();
		if ( $backup_failed_status ) {
			$red_bubble_slugs['backup_failure'] = $backup_failed_status;
		}

		return $red_bubble_slugs;
	}

	/**
	 * Add an alert slug if Protect has scan threats/vulnerabilities.
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function alert_if_protect_has_threats( array $red_bubble_slugs ) {
		// Make sure the Notice hasn't been dismissed.
		if ( ! empty( $_COOKIE['protect_threats_detected_dismissed'] ) ) {
			return $red_bubble_slugs;
		}
		// Make sure we're dealing with the Protect product only
		if ( ! Products\Protect::has_paid_plan_for_product() ) {
			return $red_bubble_slugs;
		}

		$protect_threats_status = Products\Protect::does_module_need_attention();
		if ( $protect_threats_status ) {
			$red_bubble_slugs['protect_has_threats'] = $protect_threats_status;
		}

		return $red_bubble_slugs;
	}
	/**
	 * Add an alert slug if a site's paid plan requires a plugin install and/or activation.
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function alert_if_paid_plan_requires_plugin_install_or_activation( array $red_bubble_slugs ) {
		$connection = new Connection_Manager();
		// Don't trigger red bubble (and show notice) when the site is not connected or if the
		// user doesn't have plugin installation/activation permissions.
		if ( ! $connection->is_connected() || ! current_user_can( 'activate_plugins' ) ) {
			return $red_bubble_slugs;
		}

		$plugins_needing_installed_activated = self::get_paid_plans_plugins_requirements();
		if ( empty( $plugins_needing_installed_activated ) ) {
			return $red_bubble_slugs;
		}

		foreach ( $plugins_needing_installed_activated as $plan_slug => $plugins_requirements ) {
			if ( empty( $_COOKIE[ "$plan_slug--plugins_needing_installed_dismissed" ] ) ) {
				$red_bubble_slugs[ "$plan_slug--plugins_needing_installed_activated" ] = $plugins_requirements;
			}
		}

		return $red_bubble_slugs;
	}
}
