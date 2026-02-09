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
			add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
		}
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

		/**
		 * Filter to enable/disable the Share action on the post list screen.
		 *
		 * The Share action allows users to reshare published posts via Jetpack Social.
		 * It is automatically enabled for plans that support the 'republicize' feature,
		 * but can be disabled via this filter.
		 *
		 * @since 0.2.0 Originally in jetpack-post-list package.
		 * @since $$NEXT_VERSION$$ Moved to jetpack-publicize package.
		 *
		 * @param bool   $show_share Whether to show the share action. Default true.
		 * @param string $post_type  The current post type.
		 */
		$show_share_action = Current_Plan::supports( 'republicize' )
			&& apply_filters( 'jetpack_post_list_display_share_action', true, $current_screen->post_type );

		if ( $show_share_action ) {
			self::maybe_add_share_action( $current_screen->post_type );
		}
	}

	/**
	 * Add the Share action for post types that support publicize.
	 *
	 * @param string $post_type The post type.
	 */
	public static function maybe_add_share_action( $post_type ) {
		if (
			post_type_supports( $post_type, 'publicize' ) &&
			use_block_editor_for_post_type( $post_type )
		) {
			add_filter( 'post_row_actions', array( self::class, 'add_share_action' ), 20, 2 );
			add_filter( 'page_row_actions', array( self::class, 'add_share_action' ), 20, 2 );
		}
	}

	/**
	 * Add the Share action link to the post row actions.
	 *
	 * @param array    $post_actions The current post actions.
	 * @param \WP_Post $post The post object.
	 * @return array Modified post actions.
	 */
	public static function add_share_action( $post_actions, $post ) {
		$edit_url = get_edit_post_link( $post->ID, 'raw' );
		if ( ! $edit_url || 'publish' !== $post->post_status ) {
			return $post_actions;
		}

		$url   = add_query_arg( 'jetpack-editor-action', 'share_post', $edit_url );
		$text  = _x( 'Share', 'Share the post on social networks', 'jetpack-publicize-pkg' );
		$title = _draft_or_post_title( $post );
		/* translators: post title */
		$label                 = sprintf( __( 'Share "%s" via Jetpack Social', 'jetpack-publicize-pkg' ), $title );
		$post_actions['share'] = sprintf( '<a href="%s" aria-label="%s">%s</a>', esc_url( $url ), esc_attr( $label ), esc_html( $text ) );

		return $post_actions;
	}

	/**
	 * Retrieves the blog ID based on the environment we're running in.
	 *
	 * @return int The WPCOM blog ID.
	 */
	public static function get_blog_id() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM ? get_current_blog_id() : \Jetpack_Options::get_option( 'id' );
	}
}
