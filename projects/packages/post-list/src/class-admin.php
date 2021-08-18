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
class Admin {

	/**
	 * Construction.
	 */
	public function __construct() {
		if ( ! did_action( 'jetpack_on_posts_list_init' ) ) {
			add_filter( 'query_vars', array( $this, 'add_query_vars' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

			/**
			 * Action called after initializing PostList Admin resources.
			 *
			 * @since 9.8.0
			 */
			do_action( 'jetpack_on_posts_list_init' );

			// Add parsed data for each post/page raw.
			add_action( 'manage_posts_custom_column', array( $this, 'parse_and_render_post_data' ), 10, 2 );
			add_action( 'manage_pages_custom_column', array( $this, 'parse_and_render_post_data' ), 10, 2 );

			// Add custom post/page columns.
			add_action( 'manage_posts_columns', array( $this, 'add_posts_list_column' ) );
			add_action( 'manage_pages_columns', array( $this, 'add_posts_list_column' ) );

			// Add Notice component placeholder.
			add_action( 'in_admin_footer', array( $this, 'add_admin_footer_placeholder' ) );
		}
	}

	/**
	 * Initialize the UI.
	 */
	public static function init() {
		new static();
	}

	/**
	 * Register post-list query var.
	 *
	 * @param array $vars Current query vars.
	 */
	public function add_query_vars( $vars ) {
		$vars[] = 'post-list';
		return $vars;
	}

	/**
	 * Check whether the post-list featured is enabled,
	 * via the query strinh.
	 *
	 * @return boolean True when featured is active. Otherwise, False.
	 */
	public function is_posts_list() {
		$is_posts_list = get_query_var( 'post-list' );
		return isset( $is_posts_list ) && 'true' === $is_posts_list ? true : false;
	}

	/**
	 * Add the Jetpack Post List custom column.
	 *
	 * @param array $columns Columns table.
	 * @return array Columns table, maybe populated.
	 */
	public function add_posts_list_column( $columns ) {
		if ( ! self::is_posts_list() ) {
			return $columns;
		}

		return array_merge( $columns, array( 'post-list-column' => 'WPAP' ) );
	}

	public function add_admin_footer_placeholder( $data ) {
		echo '<div class="post-list__notice-placeholder"></div>';
	}

	/**
	 * Pick post data, parse and render in JSON format.
	 *
	 * @param string $column  The name of the column to display.
	 * @param int    $post_id The current post ID.
	 */
	public function parse_and_render_post_data( $column, $post_id ) {
		if ( ! self::is_posts_list() ) {
			return;
		}

		$post = get_post( $post_id );

		error_log( '$post: ' . print_r( $post, true ) );

		$featured_image = $this->get_featured_or_first_post_image( $post_id );

		if ( 'post-list-column' === $column ) {
			echo '<script type="application/json">';
			echo wp_json_encode(
				array(
					'id'             => $post->ID,
					'type'           => $post->post_type,
					'status'         => $post->post_status,
					'date_gmt'       => $post->post_date_gmt,
					'statuses'       => self::get_post_statuses( $post_id ),
					'featured_image' => $featured_image,
				)
			);
			echo '</script>';
		}
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
		if ( self::is_posts_list() && 'edit.php' === $hook ) {
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
	 * Return the featured image or if no featured image is set, return the first image in the post. If neither exists
	 * return the featured image array with null values.
	 *
	 * @param int $post_id The current post ID.
	 * @return array The featured image id and URLs
	 */
	protected function get_featured_or_first_post_image( $post_id ) {
		$featured_image_id    = null;
		$featured_image_url   = null;
		$featured_image_thumb = null;

		if ( has_post_thumbnail() ) {
			$featured_image_id    = get_post_thumbnail_id( $post_id );
			$featured_image_url   = get_the_post_thumbnail_url( $post_id );
			$featured_image_thumb = get_the_post_thumbnail_url( $post_id, array( 50, 50 ) );
		} else {
			// TODO: This is not working like I expected. I think if an image is on two posts, it only comes back as
			// attached_media to the first post it was added to. Must rethink this.
			$image = current( get_attached_media( 'image', $post_id ) );
			if ( ! empty( $image ) ) {
				$featured_image_id    = $image->ID;
				$featured_image_url   = wp_get_attachment_image_url( $featured_image_id, 'large' );
				$featured_image_thumb = wp_get_attachment_image_url( $featured_image_id, array( 50, 50 ) );
			}
		}

		return array(
			'id'    => $featured_image_id,
			'url'   => $featured_image_url,
			'thumb' => $featured_image_thumb,
		);
	}
}
