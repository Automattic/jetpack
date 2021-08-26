<?php
/**
 * The PostList Admin Area.
 *
 * @package automattic/jetpack-post-list
 */

namespace Automattic\Jetpack\PostList;

use Automattic\Jetpack\Assets;

/**
 * The PostList Admin Area
 */
class Post_List {
	const PACKAGE_VERSION = '1.0.0-alpha';

	/**
	 * The configuration method that is called from the jetpack-config package.
	 */
	public static function configure() {
		$post_list = self::get_instance();
		$post_list->register();
	}

	/**
	 * Check whether the wp-admin-posts-list-page feature is enabled,
	 * via the query string.
	 *
	 * @return boolean True when feature is active. Otherwise, False.
	 */
	public static function is_wp_admin_posts_list_page() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return isset( $_GET['post-list'] ) && 'true' === $_GET['post-list'];
	}

	/**
	 * Initialize the Post List UI.
	 *
	 * @return Post_List Post_List instance.
	 */
	public static function get_instance() {
		if ( self::is_wp_admin_posts_list_page() ) {
			return new Post_List();
		}
	}

	/**
	 * Sets up Post List action callbacks if needed.
	 */
	public function register() {
		if ( ! did_action( 'jetpack_on_posts_list_init' ) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

			/**
			 * Action called after initializing PostList Admin resources.
			 *
			 * @since $$next-version$$
			 */
			do_action( 'jetpack_on_posts_list_init' );
		}
	}

	/**
	 * Enqueue scripts depending on the post-list query var.
	 *
	 * @param string $hook Page hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( 'edit.php' === $hook ) {
			$build_assets = require_once __DIR__ . '/../build/index.asset.php';
			$plugin_path  = Assets::get_file_url_for_environment( '../build/index.js', '../build/index.js', __FILE__ );

			wp_enqueue_script(
				'jetpack_posts_list_ui_script',
				$plugin_path,
				$build_assets['dependencies'],
				$build_assets['version'],
				true
			);

			wp_enqueue_style(
				'jetpack_posts_list_ui_style',
				plugin_dir_url( __DIR__ ) . 'build/style-index.css',
				array( 'wp-components' ),
				$build_assets['version']
			);

			wp_style_add_data(
				'jetpack_posts_list_ui_style',
				'rtl',
				plugin_dir_url( __DIR__ ) . 'build/index.rtl.css'
			);

			add_action( 'admin_footer', array( $this, 'print_post_data' ) );
		}
	}

	/**
	 * Outputs a JSON blob to the global `wp_admin_posts` variable, for use
	 * by the JS application
	 */
	public function print_post_data() {
		global $wp_query;

		if ( ! post_type_supports( $wp_query->query['post_type'], 'thumbnail' ) ) {
			return;
		}

		$post_data = array_map(
			function ( $post ) {
				$thumbnail = Post_Thumbnail::get_post_thumbnail( $post );
				return array(
					'id'             => $post->ID,
					'type'           => $post->post_type,
					'featured_image' => $thumbnail,
				);
			},
			$wp_query->posts
		);
		wp_add_inline_script( 'jetpack_posts_list_ui_script', 'var wpAdminPosts = ' . wp_json_encode( $post_data ) );
	}
}
