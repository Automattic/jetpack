<?php
/**
 * The Post List Admin Area.
 *
 * @package automattic/jetpack-post-list
 */

namespace Automattic\Jetpack\Post_List;

use Automattic\Jetpack\Assets;

/**
 * The Post_List Admin Area
 */
class Post_List {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * The configuration method that is called from the jetpack-config package.
	 */
	public static function configure() {
		$post_list = self::get_instance();
		$post_list->register();
	}

	/**
	 * Initialize the Post List UI.
	 *
	 * @return Post_List Post_List instance.
	 */
	public static function get_instance() {
		return new Post_List();
	}

	/**
	 * Sets up Post List action callbacks if needed.
	 */
	public function register() {
		if ( ! did_action( 'jetpack_on_posts_list_init' ) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
			add_action( 'in_admin_footer', array( $this, 'create_app_root_element' ) );

			add_filter( 'default_hidden_columns', array( $this, 'adjust_default_columns' ), 10, 2 );

			/**
			 * Action called after initializing Post_List Admin resources.
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
			$plugin_path = Assets::get_file_url_for_environment( './index.js', './index.js', __FILE__ );

			wp_enqueue_script(
				'jetpack_posts_list_ui_script',
				$plugin_path,
				array(),
				self::PACKAGE_VERSION,
				true
			);

			wp_enqueue_style(
				'jetpack_posts_list_ui_style',
				plugin_dir_url( __DIR__ ) . './src/style.css',
				array(),
				self::PACKAGE_VERSION
			);

			wp_style_add_data(
				'jetpack_posts_list_ui_style',
				'rtl',
				plugin_dir_url( __DIR__ ) . 'build/style.rtl.css'
			);

			wp_set_script_translations( 'jetpack_posts_list_ui_script', 'jetpack' );

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

	/**
	 * Add a placeholder element for the
	 * to mount the client app (root element).
	 */
	public function create_app_root_element() {
		echo '<div id="wp-post-list-app" style="display: none;"></div>';
	}

	/**
	 * Removes the tags and columns from the posts and pages
	 * screens if the screen options haven't been changed from
	 * the default.
	 *
	 * @param array     $cols The columns to hide.
	 * @param WP_Screen $screen The current screen object.
	 * @return array    The columns to hide by default.
	 */
	public function adjust_default_columns( $cols, $screen ) {
		if ( ! ( 'edit' === $screen->base && in_array( $screen->post_type, array( 'post', 'page' ), true ) ) ) {
			return $cols;
		}

		$cols[] = 'tags';
		if ( 'post' === $screen->post_type ) {
			$cols[] = 'categories';
		}

		return $cols;
	}
}

