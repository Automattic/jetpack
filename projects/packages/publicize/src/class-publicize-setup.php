<?php
/**
 * Main Publicize class.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * The class to configure and initialize the publicize package.
 */
class Publicize_Setup {

	/**
	 * Whether to update the plan information from WPCOM when initialising the package.
	 *
	 * @var bool
	 */
	public static $refresh_plan_info = false;

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	public static $initialized = false;

	/**
	 * To configure the publicize package, when called via the Config package.
	 */
	public static function configure() {
		add_action( 'jetpack_feature_publicize_enabled', array( __CLASS__, 'on_jetpack_feature_publicize_enabled' ) );
	}

	/**
	 * Whether to load the Publicize module.
	 *
	 * @return bool
	 */
	private static function should_load() {

		/**
		 * We do not want to load Publicize on WPCOM private sites.
		 */
		$is_wpcom_platform_private_site = ( new Host() )->is_wpcom_platform() && ( new Status() )->is_private_site();

		$should_load = ! $is_wpcom_platform_private_site;

		/**
		 * Filters the flag to decide whether to load the Publicize module.
		 *
		 * @since 0.64.0
		 *
		 * @param bool $should_load Whether to load the Publicize module.
		 */
		return (bool) apply_filters( 'jetpack_publicize_should_load', $should_load );
	}

	/**
	 * Initialization of publicize logic that should always be loaded,
	 * regardless of whether Publicize is enabled or not.
	 *
	 * You should justify everyting that is done here, as it will be loaded on every pageload.
	 */
	public static function pre_initialization() {
		if ( ! self::should_load() ) {
			return;
		}

		$is_wpcom_simple = ( new Host() )->is_wpcom_simple();

		/**
		 * Assets are to be loaded in all cases.
		 *
		 * To allow loading of admin page and
		 * the editor placeholder when publicize is OFF.
		 */
		Publicize_Assets::configure();

		/**
		 * Social admin page is to be always registered.
		 */
		Social_Admin_Page::init();

		if ( ! $is_wpcom_simple ) {
			/**
			 * We need this only on Jetpack sites for Google Site auto-verification.
			 */
			add_action( 'init', array( Keyring_Helper::class, 'init' ), 9 );
		}

		if ( $is_wpcom_simple ) {
			/**
			 * Publicize is always enabled on WPCOM,
			 * we can call the initialization method directly.
			 */
			add_action( 'plugins_loaded', array( self::class, 'on_jetpack_feature_publicize_enabled' ) );
		}
	}

	/**
	 * To configure the publicize package, when called via the Config package.
	 */
	public static function on_jetpack_feature_publicize_enabled() {
		if ( self::$initialized || ! self::should_load() ) {
			return;
		}

		self::$initialized = true;

		$is_wpcom_simple = ( new Host() )->is_wpcom_simple();

		global $publicize;
		/**
		 * If publicize is not initialzed on WPCOM,
		 * it means that we are either on a public facing page
		 * or a page where Publicize is not needed.
		 * So, we will skip the whole set up here.
		 */
		if ( $is_wpcom_simple && ! $publicize ) {
			return;
		}

		global $publicize_ui;

		if ( ! isset( $publicize_ui ) ) {
			$publicize_ui = new Publicize_UI();
		}

		$rest_controllers = array(
			REST_API\Connections_Controller::class,
			REST_API\Connections_Post_Field::class,
			REST_API\Scheduled_Actions_Controller::class,
			REST_API\Services_Controller::class,
			REST_API\Share_Post_Controller::class,
			REST_API\Share_Status_Controller::class,
			REST_API\Shares_Data_Controller::class,
			REST_API\Social_Image_Generator_Controller::class,
			Jetpack_Social_Settings\Settings::class,
		);

		// Load the REST controllers.
		foreach ( $rest_controllers as $controller ) {
			if ( $is_wpcom_simple ) {
				wpcom_rest_api_v2_load_plugin( $controller );
			} else {
				new $controller();
			}
		}

		add_action( 'current_screen', array( self::class, 'add_filters_and_actions_for_screen' ), 5 );

		( new Social_Image_Generator\Setup() )->init();

		// Things that should not happen on WPCOM.
		if ( ! $is_wpcom_simple ) {
			add_action( 'rest_api_init', array( static::class, 'register_core_options' ) );
			add_action( 'admin_init', array( static::class, 'register_core_options' ) );
			add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
			add_action( 'current_screen', array( static::class, 'init_sharing_limits' ) );
		}
	}

	/**
	 * Registers the core options for the Publicize package.
	 */
	public static function register_core_options() {
		( new Jetpack_Social_Settings\Dismissed_Notices() )->register();
	}

	/**
	 * If the current_screen has 'edit' as the base, add filter to change the post list tables.
	 *
	 * @param object $current_screen The current screen.
	 */
	public static function add_filters_and_actions_for_screen( $current_screen ) {
		if ( 'edit' !== $current_screen->base ) {
			return;
		}

		if ( Current_Plan::supports( 'republicize' ) ) {
			add_filter( 'jetpack_post_list_display_share_action', '__return_true' );
		}
	}

	/**
	 * Retrieves the blog ID based on the environment we're running in.
	 *
	 * @return int The WPCOM blog ID.
	 */
	public static function get_blog_id() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM ? get_current_blog_id() : \Jetpack_Options::get_option( 'id' );
	}

	/**
	 * Initialise share limits if they should be enabled.
	 */
	public static function init_sharing_limits() {
		$current_screen = get_current_screen();

		if ( empty( $current_screen ) || 'post' !== $current_screen->base ) {
			return;
		}

		global $publicize;

		if ( $publicize->has_paid_plan( self::$refresh_plan_info ) ) {
			return;
		}

		$info = $publicize->get_publicize_shares_info( self::get_blog_id() );

		if ( is_wp_error( $info ) ) {
			return;
		}

		if ( empty( $info['is_share_limit_enabled'] ) ) {
			return;
		}

		$connections      = $publicize->get_filtered_connection_data();
		$shares_remaining = $info['shares_remaining'];

		$share_limits = new Share_Limits( $connections, $shares_remaining, ! $current_screen->is_block_editor() );
		$share_limits->enforce_share_limits();
	}
}
