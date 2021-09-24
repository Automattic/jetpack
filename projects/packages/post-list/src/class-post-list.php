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

	const PACKAGE_VERSION = '0.1.1-alpha';

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
	 * Sets up Post List action callbacks.
	 */
	public function register() {
		if ( ! did_action( 'jetpack_on_posts_list_init' ) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
			add_action( 'current_screen', array( $this, 'add_thumbnail_filters_and_actions' ) );
			add_filter( 'default_hidden_columns', array( $this, 'adjust_default_columns' ), 10, 2 );

			/**
			 * Action called after initializing Post_List Admin resources.
			 *
			 * @since 0.1.0
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
		}
	}

	/**
	 * If the current_screen has 'edit' as the base, add filters and actions to add the thumbnail column to the Posts
	 * and Pages admin tables.
	 *
	 * @param object $current_screen The current screen.
	 */
	public function add_thumbnail_filters_and_actions( $current_screen ) {
		if ( 'edit' === $current_screen->base ) {
			// Add the thumbnail column to the "Posts" admin table.
			add_filter( 'manage_posts_columns', array( $this, 'add_thumbnail_column' ) );
			add_action( 'manage_posts_custom_column', array( $this, 'populate_thumbnail_rows' ), 10, 2 );

			// Add the thumbnail column to the "Pages" admin table.
			add_filter( 'manage_pages_columns', array( $this, 'add_thumbnail_column' ) );
			add_action( 'manage_pages_custom_column', array( $this, 'populate_thumbnail_rows' ), 10, 2 );
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
			echo '<img src="' . esc_url( $thumbnail['thumb'] ) . '" alt="' . esc_attr( $thumbnail['alt'] ) . '" height="50" width="50" />';
		} else {
			echo '<span class="dashicons dashicons-format-image" title="No thumbnail found."></span>';
		}
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

