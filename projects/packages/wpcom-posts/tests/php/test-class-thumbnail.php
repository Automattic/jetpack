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
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		new Thumbnail();
		$this->table = _get_list_table( 'WP_Posts_List_Table', array( 'screen' => 'edit-page' ) );
	}

	/**
	 * Checks that a new column header for thumbnails is added to the posts list table.
	 */
	public function test_thumbnail_column_header() {
		$columns = $this->table->get_columns();
		$this->assertSame( '', $columns['thumbnail'] );
	}
}
