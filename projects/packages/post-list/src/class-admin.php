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
		if ( $this->is_posts_list() && 'edit.php' === $hook ) {
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
	 * @param object $post The current post.
	 * @return array The featured image id and URLs
	 */
	protected function get_featured_or_first_post_image( $post ) {
		$featured_image_id    = null;
		$featured_image_url   = null;
		$featured_image_thumb = null;

		$post_id = $post->ID;

		// If a featured image exists for the post, use that thumbnail.
		if ( has_post_thumbnail() ) {
			$featured_image_id    = get_post_thumbnail_id( $post_id );
			$featured_image_url   = get_the_post_thumbnail_url( $post_id );
			$featured_image_thumb = get_the_post_thumbnail_url( $post_id, array( 50, 50 ) );
		} else {
			// If a featured image does not exist look for the first "media library" hosted image on the post.
			$dom = new \DOMDocument();

			// libxml_use_internal_errors(true) silences PHP warnings and errors from malformed HTML in loadHTML().
			// you can consult libxml_get_last_error() or libxml_get_errors() to check for errors if needed.
			libxml_use_internal_errors( true );
			$dom->loadHTML( $post->post_content );

			// Media library images have a class attribute value containing 'wp-image-{$attachment_id}'.
			// Use DomXPath to parse the post content and get the first img tag containing 'wp-image-' as a class value.
			$class_name = 'wp-image-';
			$dom_x_path = new \DomXPath( $dom );
			$nodes      = $dom_x_path->query( "//img[contains(@class, '$class_name')]/@class" );

			if ( $nodes->length > 0 ) {
				// Get the class attribute value of the 1st image node (aka index 0).
				$class_value = $nodes[0]->value;

				// Ignore all class attribute values except 'wp-image{$attachment_id}'.
				preg_match( '/wp-image-\d+/', $class_value, $class_value );

				// Get the $attachment_id from the end of the class name value.
				$attachment_id = str_replace( $class_name, '', $class_value[0] );

				$featured_image_id    = $attachment_id;
				$featured_image_url   = wp_get_attachment_image_url( $attachment_id, 'full-size' );
				$featured_image_thumb = wp_get_attachment_image_url( $attachment_id, array( 50, 50 ) );
			}
		}

		return array(
			'id'    => $featured_image_id,
			'url'   => $featured_image_url,
			'thumb' => $featured_image_thumb,
		);
	}

	/**
	 * Outputs a JSON blob to the global `wp_admin_posts` variable, for use
	 * by the JS application
	 */
	public function print_post_data() {
		global $wp_query;

		$post_data = array_map(
			function ( $post ) {
				$featured_image = $this->get_featured_or_first_post_image( $post );
				return array(
					'id'             => $post->ID,
					'type'           => $post->post_type,
					'status'         => $post->post_status,
					'date_gmt'       => $post->post_date_gmt,
					'statuses'       => $this->get_post_statuses( $post->ID ),
					'featured_image' => $featured_image,
				);
			},
			$wp_query->posts
		);
		wp_add_inline_script( 'jetpack_posts_list_ui_script', 'var wpAdminPosts = ' . wp_json_encode( $post_data ) );
	}
}
