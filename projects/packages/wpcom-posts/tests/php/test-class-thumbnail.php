<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Test methods from Automattic\Jetpack\WPcom\Posts\Thumbnail
 *
 * @package automattic/jetpack-wpcom-posts
 */

namespace Automattic\Jetpack\WPcom\Posts;

use WorDBless\BaseTestCase;

/**
 * Class Test_Thumbnail
 */
class Test_Thumbnail extends BaseTestCase {
	/**
	 * Core class used to implement displaying posts in a list table.
	 *
	 * @var WP_Posts_List_Table
	 */
	protected $table;

	/**
	 * Test post.
	 *
	 * @var WP_Post
	 */
	protected $post;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		new Thumbnail();
		$this->table = _get_list_table( 'WP_Posts_List_Table', array( 'screen' => 'edit-page' ) );

		$this->post = wp_insert_post(
			array(
				'post_status'  => 'publish',
				'post_title'   => 'Post title',
				'post_content' => 'Post content',
				'post_excerpt' => 'Post excerpt',
				'post_type'    => 'post',
			)
		);

		add_filter( 'post_thumbnail_html', array( $this, 'mock_post_thumbnail_html' ), 10, 4 );
	}

	public function tear_down() {
		remove_filter( 'post_thumbnail_html', array( $this, 'mock_post_thumbnail_html' ) );
	}

	public function mock_post_thumbnail_html( $html, $post_id, $size, $attr ) {
		$width  = $size[0];
		$height = $size[1];
		$style  = $attr['style'];

		return "My thumbnail of $width x $height with a $style style";
	}

	/**
	 * Checks that a new column header for thumbnails is added to the posts list table.
	 */
	public function test_thumbnail_column_header() {
		$columns = $this->table->get_columns();
		$this->assertSame( '', $columns['thumbnail'] );
	}

	/**
	 * Checks that the post thumbnail is displayed in the new column cell new.
	 */
	public function test_thumbnail_column_content() {
		$this->table->column_default( 'thumbnail' );
	}
}
