<?php
/**
 * Thumbnail enhancements for the "Posts" screens on WordPress.com sites.
 *
 * @package automattic/jetpack-wpcom-posts
 */

namespace Automattic\Jetpack\PostList;

/**
 * Class Thumbnail.
 */
class Thumbnail {
	/**
	 * Thumbnail constructor.
	 */
	public function __construct() {
		add_filter( 'manage_posts_columns', array( $this, 'add_posts_column_header' ) );
		add_filter( 'manage_pages_columns', array( $this, 'add_posts_column_header' ) );
		add_action( 'manage_posts_custom_column', array( $this, 'display_posts_column_content' ), 10, 2 );
		add_action( 'manage_pages_custom_column', array( $this, 'display_posts_column_content' ), 10, 2 );
		add_action( 'admin_print_styles-edit.php', array( $this, 'load_columns_css' ) );
	}

	/**
	 * Adds a new column header for displaying the thumbnail of a post.
	 *
	 * @param array $columns An array of column names.
	 * @return array An array of column names.
	 */
	public function add_posts_column_header( $columns ) {
		// Place if before author.
		$pos = array_search( 'author', array_keys( $columns ), true );
		if ( ! is_int( $pos ) ) {
			return $columns;
		}
		$chunks                 = array_chunk( $columns, $pos, true );
		$chunks[0]['thumbnail'] = ''; // Deliberately empty.

		return call_user_func_array( 'array_merge', $chunks );
	}

	/**
	 * Displays the thumbnail content.
	 *
	 * @param string $column  The name of the column to display.
	 * @param int    $post_id The current post ID.
	 */
	public function display_posts_column_content( $column, $post_id ) {
		if ( 'thumbnail' !== $column ) {
			return;
		}

		echo get_the_post_thumbnail( $post_id, array( 50, 50 ), array( 'style' => 'height: auto;' ) );
	}

	/**
	 * Load CSS needed for the thumbnail column.
	 */
	public function load_columns_css() {
		?>
		<style type="text/css">
			.fixed .column-thumbnail {
				width: 5em;
			}
		</style>
		<?php
	}
}
