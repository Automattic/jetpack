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
			REST_API\X_Usage_Controller::class,
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

			// standard.site well-known endpoint and link tag for Bluesky.
			add_action( 'init', array( self::class, 'register_standard_site_rewrite' ) );
			add_action( 'template_redirect', array( self::class, 'serve_standard_site_publication' ) );
			add_action( 'wp_head', array( self::class, 'inject_standard_site_link_tag' ) );
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

	/**
	 * Register the rewrite rule for /.well-known/site.standard.publication.
	 */
	public static function register_standard_site_rewrite() {
		add_rewrite_rule(
			'^\.well-known/site\.standard\.publication$',
			'index.php?standard_site_publication=1',
			'top'
		);

		add_rewrite_tag( '%standard_site_publication%', '([^&]+)' );
	}

	/**
	 * Serve the /.well-known/site.standard.publication endpoint.
	 *
	 * Redirects to the stored AT URI for the site's standard.site publication record.
	 */
	public static function serve_standard_site_publication() {
		if ( ! get_query_var( 'standard_site_publication' ) ) {
			return;
		}

		$publication_uri = get_option( Connections::BLUESKY_PUBLICATION_URI_OPTION );

		if ( ! $publication_uri ) {
			status_header( 404 );
			exit;
		}

		wp_redirect( $publication_uri, 302 ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- AT URI (at://) is not an HTTP URL, wp_safe_redirect would reject it.
		exit;
	}

	/**
	 * Inject a <link> tag for the standard.site document URI on singular posts.
	 */
	public static function inject_standard_site_link_tag() {
		if ( ! is_singular() ) {
			return;
		}

		$uri = get_post_meta( get_the_ID(), Share_Status::BLUESKY_DOCUMENT_URI_META_KEY, true );

		if ( $uri ) {
			printf( '<link rel="alternate" type="application/json" href="%s" />' . "\n", esc_attr( $uri ) );
		}
	}

	/**
	 * Store the standard.site document URI from Bluesky share status data.
	 *
	 * @param int   $post_id The post ID.
	 * @param array $shares  The shares data.
	 */
	public static function store_bluesky_document_uri( $post_id, array $shares ) {
		foreach ( $shares as $share ) {
			if (
				isset( $share['service'] ) &&
				'bluesky' === $share['service'] &&
				! empty( $share['standard_site_document_uri'] )
			) {
				update_post_meta( $post_id, Share_Status::BLUESKY_DOCUMENT_URI_META_KEY, $share['standard_site_document_uri'] );
				break;
			}
		}
	}
}
