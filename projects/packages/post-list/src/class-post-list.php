<?php
/**
 * The Post List Admin Area.
 *
 * @package automattic/jetpack-post-list
 */

namespace Automattic\Jetpack\Post_List;

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

			/**
			 * Action called after initializing Post_List Admin resources.
			 *
			 * @since $$next-version$$
			 */
			do_action( 'jetpack_on_posts_list_init' );
		}
	}

	/**
	 * Enqueue scripts.
	 *
	 * @param string $hook Page hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( 'edit.php' === $hook ) {
			wp_enqueue_style(
				'jetpack_posts_list_ui_style',
				plugin_dir_url( __DIR__ ) . './src/style.css',
				array(),
				self::PACKAGE_VERSION
			);
			wp_style_add_data(
				'jetpack_posts_list_ui_style',
				'rtl',
				plugin_dir_url( __DIR__ ) . './src/rtl.css'
			);

			add_filter( 'manage_posts_columns', array( $this, 'add_thumbnail_column' ) );
			add_action( 'manage_posts_custom_column', array( $this, 'populate_thumbnail_rows' ), 10, 2 );
		}
	}

	/**
	 * Adds a new column header for displaying the thumbnail of a post.
	 *
	 * @param array $columns An array of column names.
	 * @return array An array of column names.
	 */
	public function add_thumbnail_column( $columns ) {
		$new_column = array( 'thumbnail' => '<span>' . __( 'Thumbnail', 'jetpack' ) . '</span>' );
		$keys       = array_keys( $columns );
		$position   = array_search( 'title', $keys, true );

		// If 'title' not found, don't insert the thumbnail column.
		if ( false !== $position ) {
			$columns = array_merge( array_slice( $columns, 0, $position ), $new_column, array_slice( $columns, $position ) );
		}

		return $columns;
	}

	/**
	 * Displays the thumbnail content.
	 *
	 * @param string $column  The name of the column to display.
	 * @param int    $post_id The current post ID.
	 */
	public function populate_thumbnail_rows( $column, $post_id ) {
		if ( 'thumbnail' !== $column ) {
			return;
		}

		$thumbnail = Post_Thumbnail::get_post_thumbnail( get_post( $post_id ) );
		if ( $thumbnail ) {
			echo '<img class="post-list__post-featured-image" src="' . esc_url( $thumbnail['thumb'] ) . '" alt="' . esc_attr( $thumbnail['alt'] ) . '" height="50" width="50" />';
		} else {
			echo '<span class="dashicons dashicons-format-image" title="No thumbnail found."></span>';
		}
	}
}

