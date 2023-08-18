<?php
/**
 * Attract high-quality traffic to your site.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Blaze\Dashboard as Blaze_Dashboard;
use Automattic\Jetpack\Blaze\Dashboard_REST_Controller as Blaze_Dashboard_REST_Controller;
use Automattic\Jetpack\Blaze\REST_Controller;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use Automattic\Jetpack\Status as Jetpack_Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Sync\Settings as Sync_Settings;

/**
 * Class for promoting posts.
 */
class Blaze {
	/**
	 * Script handle for the JS file we enqueue in the post editor.
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'jetpack-promote-editor';

	/**
	 * Path of the JS file we enqueue in the post editor.
	 *
	 * @var string
	 */
	public static $script_path = '../build/editor.js';

	/**
	 * Initializer.
	 * Used to configure the blaze package, eg when called via the Config package.
	 *
	 * @return void
	 */
	public static function init() {
		// On the edit screen, add a row action to promote the post.
		add_action( 'load-edit.php', array( __CLASS__, 'add_post_links_actions' ) );
		// In the post editor, add a post-publish panel to allow promoting the post.
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_block_editor_assets' ) );
		// Add a Blaze Menu.
		add_action( 'admin_menu', array( __CLASS__, 'enable_blaze_menu' ), 999 );
		// Add Blaze dashboard app REST API endpoints.
		add_action( 'rest_api_init', array( new Blaze_Dashboard_REST_Controller(), 'register_rest_routes' ) );
		// Add general Blaze REST API endpoints.
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
	}

	/**
	 * Add links under each published post in the wp-admin post list.
	 *
	 * @return void
	 */
	public static function add_post_links_actions() {
		if ( self::should_initialize() ) {
			add_filter( 'post_row_actions', array( __CLASS__, 'jetpack_blaze_row_action' ), 10, 2 );
			add_filter( 'page_row_actions', array( __CLASS__, 'jetpack_blaze_row_action' ), 10, 2 );
		}
	}

	/**
	 * Is the wp-admin Dashboard enabled?
	 * That dashboard is not available or necessary on WordPress.com sites.
	 *
	 * @return bool
	 */
	public static function is_dashboard_enabled() {
		$is_dashboard_enabled = true;

		// On WordPress.com sites, the dashboard is not needed.
		if ( ( new Host() )->is_wpcom_platform() ) {
			$is_dashboard_enabled = false;
		}

		/**
		 * Enable a wp-admin dashboard for Blaze campaign management.
		 *
		 * @since 0.7.0
		 *
		 * @param bool $should_enable Should the dashboard be enabled?
		 */
		return apply_filters( 'jetpack_blaze_dashboard_enable', $is_dashboard_enabled );
	}

	/**
	 * Enable the Blaze menu.
	 *
	 * @return void
	 */
	public static function enable_blaze_menu() {
		if ( ! self::should_initialize() ) {
			return;
		}

		$blaze_dashboard = new Blaze_Dashboard();

		if ( self::is_dashboard_enabled() ) {
			$page_suffix = add_submenu_page(
				'tools.php',
				esc_attr__( 'Advertising', 'jetpack-blaze' ),
				__( 'Advertising', 'jetpack-blaze' ),
				'manage_options',
				'advertising',
				array( $blaze_dashboard, 'render' ),
				1
			);
			add_action( 'load-' . $page_suffix, array( $blaze_dashboard, 'admin_init' ) );
		} elseif ( ( new Host() )->is_wpcom_platform() ) {
			$domain      = ( new Jetpack_Status() )->get_site_suffix();
			$page_suffix = add_submenu_page(
				'tools.php',
				esc_attr__( 'Advertising', 'jetpack-blaze' ),
				__( 'Advertising', 'jetpack-blaze' ),
				'manage_options',
				'https://wordpress.com/advertising/' . $domain,
				null,
				1
			);
			add_action( 'load-' . $page_suffix, array( $blaze_dashboard, 'admin_init' ) );
		}
	}

	/**
	 * Check the WordPress.com REST API
	 * to ensure that the site supports the Blaze feature.
	 * Results are cached for a day.
	 *
	 * @param int $blog_id The blog ID to check.
	 *
	 * @return bool
	 */
	public static function site_supports_blaze( $blog_id ) {
		/*
		 * On WordPress.com, we don't need to make an API request,
		 * we can query directly.
		 */
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM && function_exists( 'blaze_is_site_eligible' ) ) {
			return blaze_is_site_eligible( $blog_id );
		}

		$cached_result = get_transient( 'jetpack_blaze_site_supports_blaze_' . $blog_id );
		if ( false !== $cached_result ) {
			return $cached_result;
		}

		// Make the API request.
		$url      = sprintf( '/sites/%d/blaze/status', $blog_id );
		$response = Client::wpcom_json_api_request_as_blog(
			$url,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		// Bail if there was an error or malformed response.
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		// Decode the results.
		$result = json_decode( wp_remote_retrieve_body( $response ), true );

		// Bail if there were no results returned.
		if ( ! is_array( $result ) || empty( $result['approved'] ) ) {
			return false;
		}

		// Cache the result for 24 hours.
		set_transient( 'jetpack_blaze_site_supports_blaze_' . $blog_id, (bool) $result['approved'], DAY_IN_SECONDS );

		return (bool) $result['approved'];
	}

	/**
	 * Determines if criteria is met to enable Blaze features.
	 * Keep in mind that this makes remote requests, so we want to avoid calling it when unnecessary, like in the frontend.
	 *
	 * @return bool
	 */
	public static function should_initialize() {
		$should_initialize = true;
		$is_wpcom          = defined( 'IS_WPCOM' ) && IS_WPCOM;
		$connection        = new Jetpack_Connection();
		$site_id           = Jetpack_Connection::get_site_id();

		// Only admins should be able to Blaze posts on a site.
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		// On self-hosted sites, we must do some additional checks.
		if ( ! $is_wpcom ) {
			/*
			* These features currently only work on WordPress.com,
			* so the site must be connected to WordPress.com, and the user as well for things to work.
			*/
			if (
				is_wp_error( $site_id )
				|| ! $connection->is_connected()
				|| ! $connection->is_user_connected()
			) {
				$should_initialize = false;
			}

			// The whole thing is powered by Sync!
			if ( ! Sync_Settings::is_sync_enabled() ) {
				$should_initialize = false;
			}
		}

		// Check if the site supports Blaze.
		if ( is_numeric( $site_id ) && ! self::site_supports_blaze( $site_id ) ) {
			$should_initialize = false;
		}

		/**
		 * Filter to disable all Blaze functionality.
		 *
		 * @since 0.3.0
		 *
		 * @param bool $should_initialize Whether Blaze should be enabled. Default to true.
		 */
		return apply_filters( 'jetpack_blaze_enabled', $should_initialize );
	}

	/**
	 * Get URL to create a Blaze campaign for a specific post.
	 *
	 * This can return 2 different types of URL:
	 * - Calypso Links
	 * - wp-admin Links if access to the wp-admin Blaze Dashboard is enabled.
	 *
	 * @param int $post_id Post ID.
	 *
	 * @return array An array with the link, and whether this is a Calypso or a wp-admin link.
	 */
	public static function get_campaign_management_url( $post_id ) {
		if ( self::is_dashboard_enabled() ) {
			$admin_url = admin_url( 'tools.php?page=advertising' );
			$hostname  = wp_parse_url( get_site_url(), PHP_URL_HOST );
			$blaze_url = sprintf(
				'%1$s#!/advertising/%2$s/posts/promote/post-%3$s',
				$admin_url,
				$hostname,
				esc_attr( $post_id )
			);

			return array(
				'link'     => $blaze_url,
				'external' => false,
			);
		}

		// Default Calypso link.
		$blaze_url = Redirect::get_url(
			'jetpack-blaze',
			array(
				'query' => 'blazepress-widget=post-' . esc_attr( $post_id ),
			)
		);
		return array(
			'link'     => $blaze_url,
			'external' => true,
		);
	}

	/**
	 * Adds the Promote link to the posts list row action.
	 *
	 * @param array   $post_actions The current array of post actions.
	 * @param WP_Post $post The current post in the post list table.
	 *
	 * @return array
	 */
	public static function jetpack_blaze_row_action( $post_actions, $post ) {
		$post_id = $post->ID;

		// Bail if we are not looking at one of the supported post types (post, page, or product).
		if ( ! in_array( $post->post_type, array( 'post', 'page', 'product' ), true ) ) {
			return $post_actions;
		}

		// Bail if the post is not published.
		if ( $post->post_status !== 'publish' ) {
			return $post_actions;
		}

		// Bail if the post has a password.
		if ( '' !== $post->post_password ) {
			return $post_actions;
		}

		$blaze_url = self::get_campaign_management_url( $post_id );
		$text      = __( 'Promote with Blaze', 'jetpack-blaze' );
		$title     = get_the_title( $post );
		$label     = sprintf(
			/* translators: post title */
			__( 'Blaze &#8220;%s&#8221; to Tumblr and WordPress.com audiences.', 'jetpack-blaze' ),
			$title
		);

		$post_actions['blaze'] = sprintf(
			'<a href="%1$s" title="%2$s" aria-label="%2$s" %4$s>%3$s</a>',
			esc_url( $blaze_url['link'] ),
			esc_attr( $label ),
			esc_html( $text ),
			( true === $blaze_url['external'] ? 'target="_blank" rel="noopener noreferrer"' : '' )
		);

		return $post_actions;
	}

	/**
	 * Enqueue block editor assets.
	 */
	public static function enqueue_block_editor_assets() {
		/*
		 * We do not want (nor need) Blaze in the site editor, or the widget editor, or the classic editor.
		 * We only want it in the post editor.
		 * Enqueueing the script in those editors would cause a fatal error.
		 * See #20357 for more info.
		*/
		if ( ! function_exists( 'get_current_screen' ) ) { // When Gutenberg is loaded in the frontend.
			return;
		}
		$current_screen = get_current_screen();
		if (
			empty( $current_screen )
			|| $current_screen->base !== 'post'
			|| ! $current_screen->is_block_editor()
		) {
			return;
		}
		// Bail if criteria is not met to enable Blaze features.
		if ( ! self::should_initialize() ) {
			return;
		}

		Assets::register_script(
			self::SCRIPT_HANDLE,
			self::$script_path,
			__FILE__,
			array(
				'enqueue'    => true,
				'in_footer'  => true,
				'textdomain' => 'jetpack-blaze',
			)
		);

		// Adds Connection package initial state.
		Connection_Initial_State::render_script( self::SCRIPT_HANDLE );

		// Pass additional data to our script.
		wp_localize_script(
			self::SCRIPT_HANDLE,
			'blazeInitialState',
			array(
				'adminUrl'           => esc_url( admin_url() ),
				'isDashboardEnabled' => self::is_dashboard_enabled(),
				'siteFragment'       => ( new Jetpack_Status() )->get_site_suffix(),
			)
		);
	}
}
