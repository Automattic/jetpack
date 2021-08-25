<?php
/**
 * The PostList Admin Area.
 *
 * @package automattic/jetpack-post-list
 */

namespace Automattic\Jetpack\PostList;

use Automattic\Jetpack\Assets;

require_once __DIR__ . '/class-post-thumbnail.php';

/**
 * The PostList Admin Area
 */
class Admin {

	/**
	 * Construction.
	 */
	public function __construct() {
		if ( ! did_action( 'jetpack_on_posts_list_init' ) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
			add_action( 'admin_footer', array( $this, 'print_post_data' ) );

			/**
			 * Action called after initializing PostList Admin resources.
			 *
			 * @since $$next-version$$
			 */
			do_action( 'jetpack_on_posts_list_init' );
		}
	}

	/**
	 * Initialize the UI.
	 */
	public static function init() {
		new static();
	}

	/**
	 * Return post statuses definition object,
	 * with especial cases such as `scheduled`, `pending`, etc.
	 *
	 * @param int $post_id The current post ID.
	 * @return array Post statuses object.
	 */
	public function get_post_statuses( $post_id ) {
		return array_merge(
			array(
				'publish' => __( 'Published', 'jetpack' ),
				'private' => __( 'Published', 'jetpack' ),
				'future'  => __( 'Scheduled', 'jetpack' ),
				'pending' => __( 'Pending Review', 'jetpack' ),
				'draft'   => __( 'Draft', 'jetpack' ),
			),
			get_post_statuses( $post_id )
		);
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
		}
	}

	/**
	 * Outputs a JSON blob to the global `wp_admin_posts` variable, for use
	 * by the JS application
	 */
	public function print_post_data() {
		global $wp_query;

		$post_data = array_map(
			function ( $post ) {
				$thumbnail = Post_Thumbnail::get_post_thumbnail( $post );
				return array(
					'id'             => $post->ID,
					'type'           => $post->post_type,
					'status'         => $post->post_status,
					'date_gmt'       => $post->post_date_gmt,
					'statuses'       => $this->get_post_statuses( $post->ID ),
					'featured_image' => $thumbnail,
				);
			},
			$wp_query->posts
		);
		wp_add_inline_script( 'jetpack_posts_list_ui_script', 'var wpAdminPosts = ' . wp_json_encode( $post_data ) );
	}
}
