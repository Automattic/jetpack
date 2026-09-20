<?php
/**
 * Tests for the Jetpack_Sitemap_Librarian class.
 *
 * @package automattic/jetpack
 * @since 4.7.0
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-constants.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-librarian.php';

/**
 * Test class for Jetpack_Sitemap_Librarian.
 *
 * @covers Jetpack_Sitemap_Librarian
 * @since 4.7.0
 */
#[CoversClass( Jetpack_Sitemap_Librarian::class )]
class Jetpack_Sitemap_Librarian_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Create a scratch copy of the posts table carrying an extra column.
	 *
	 * Pointing $wpdb->posts at a table name the librarian has not seen before
	 * guarantees a cold column cache without reaching into the cache itself,
	 * and the marker column makes it obvious which table a column list came
	 * from.
	 *
	 * @param string $suffix Distinguishes this table from other tests' tables.
	 * @return string The scratch table name.
	 */
	private function create_scratch_posts_table( $suffix ) {
		global $wpdb;

		$table = $wpdb->posts . '_jp_' . $suffix;

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "CREATE TABLE $table LIKE $wpdb->posts" );
		$wpdb->query( "ALTER TABLE $table ADD COLUMN jetpack_sitemap_marker VARCHAR(8) NULL" );
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		return $table;
	}

	/**
	 * Drop a table made by create_scratch_posts_table().
	 *
	 * @param string $table Table name.
	 */
	private function drop_scratch_posts_table( $table ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DROP TABLE IF EXISTS $table" );
	}

	/**
	 * Constructor does not throw a fatal error.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_librarian_constructor() {
		$librarian = new Jetpack_Sitemap_Librarian(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->assertTrue( true );
	}

	/**
	 * Getting an unset row returns null.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_librarian_get_unset_row_is_null() {
		$librarian = new Jetpack_Sitemap_Librarian();
		$row       = $librarian->read_sitemap_data( 'unset', 'unset' );
		$this->assertTrue( $row === null );
	}

	/**
	 * Deleting an unset row returns false.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_librarian_delete_unset_row_returns_false() {
		$librarian = new Jetpack_Sitemap_Librarian();
		$result    = $librarian->delete_sitemap_data( 'unset', 'unset' );
		$this->assertFalse( $result );
	}

	/**
	 * Deleting a set row returns true.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_librarian_delete_set_row_returns_true() {
		$librarian = new Jetpack_Sitemap_Librarian();
		$librarian->store_sitemap_data( 0, JP_MASTER_SITEMAP_TYPE, 'contents', '1970-01-01 00:00:00' );
		$result = $librarian->delete_sitemap_data( jp_sitemap_filename( JP_MASTER_SITEMAP_TYPE, 0 ), JP_MASTER_SITEMAP_TYPE );
		$this->assertTrue( $result );
	}

	/**
	 * Getting a set row is the identity(ish).
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_librarian_set_then_get_is_identity() {
		$librarian = new Jetpack_Sitemap_Librarian();
		$contents  = '<wrapper>These are the times that try men\'s <a href="http://example.com/soul">souls</a>.</wrapper>';

		// Store a sitemap.
		$librarian->store_sitemap_data( 0, JP_MASTER_SITEMAP_TYPE, $contents, '1970-01-01 00:00:00' );

		// Get the stored sitemap.
		$result = $librarian->read_sitemap_data( jp_sitemap_filename( JP_MASTER_SITEMAP_TYPE, 0 ), JP_MASTER_SITEMAP_TYPE );

		// Check that the stored sitemap and the retrieved sitemap are the same.
		$this->assertEquals( 'sitemap.xml', $result['name'] );
		$this->assertEquals( JP_MASTER_SITEMAP_TYPE, $result['type'] );
		$this->assertEquals( $contents, $result['text'] );
		$this->assertEquals( '1970-01-01 00:00:00', $result['timestamp'] );
	}

	/**
	 * Setting the same name/type twice overwrites old data.
	 *
	 * @since 4.7.0
	 */
	public function test_sitemap_librarian_set_then_set_overwrites_data() {
		$librarian    = new Jetpack_Sitemap_Librarian();
		$old_contents = esc_html( 'It was the best of times,' );
		$new_contents = esc_html( 'It was the worst of times.' );

		// Set the same data twice.
		$librarian->store_sitemap_data( 0, JP_MASTER_SITEMAP_TYPE, $old_contents, '1970-01-01 00:00:00' );
		$librarian->store_sitemap_data( 0, JP_MASTER_SITEMAP_TYPE, $new_contents, '1980-01-01 00:00:00' );

		// Get the stored data.
		$result = $librarian->read_sitemap_data( jp_sitemap_filename( JP_MASTER_SITEMAP_TYPE, 0 ), JP_MASTER_SITEMAP_TYPE );

		// Check that the second set is what comes out.
		$this->assertEquals( $new_contents, $result['text'] );
		$this->assertEquals( '1980-01-01 00:00:00', $result['timestamp'] );
	}

	/**
	 * Getting the text of a set row is the identity.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_librarian_set_then_get_text_is_identity() {
		$librarian = new Jetpack_Sitemap_Librarian();
		$contents  = 'These are the times that try men\'s souls.';

		// Store a sitemap.
		$librarian->store_sitemap_data( 0, JP_MASTER_SITEMAP_TYPE, $contents, '1970-01-01 00:00:00' );

		// Get the text of the stored sitemap.
		$result = $librarian->get_sitemap_text( jp_sitemap_filename( JP_MASTER_SITEMAP_TYPE, 0 ), JP_MASTER_SITEMAP_TYPE );

		// check that the stored sitemap and the retrieved sitemap are the same.
		$this->assertEquals( $contents, $result );
	}

	/**
	 * Delete contiguously named rows.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_librarian_delete_contiguously_named_rows() {
		$librarian = new Jetpack_Sitemap_Librarian();

		// Store some contiguous data.
		$librarian->store_sitemap_data( 'name-1', JP_PAGE_SITEMAP_TYPE, 'foo', '1970-01-01 00:00:00' );
		$librarian->store_sitemap_data( 'name-2', JP_PAGE_SITEMAP_TYPE, 'foo', '1970-01-01 00:00:00' );
		$librarian->store_sitemap_data( 'name-3', JP_PAGE_SITEMAP_TYPE, 'foo', '1970-01-01 00:00:00' );

		// Delete it.
		$librarian->delete_numbered_sitemap_rows_after( 0, 'type' );

		// It's gone!
		$this->assertTrue( $librarian->read_sitemap_data( 'name-1', 'type' ) === null );
		$this->assertTrue( $librarian->read_sitemap_data( 'name-2', 'type' ) === null );
		$this->assertTrue( $librarian->read_sitemap_data( 'name-3', 'type' ) === null );
	}

	/**
	 * Timestamps come back keyed by filename, for the names that were asked for.
	 *
	 * @group jetpack-sitemap
	 * @since 16.2
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_query_sitemap_timestamps_is_keyed_by_filename() {
		$librarian = new Jetpack_Sitemap_Librarian();
		$librarian->store_sitemap_data( 1, JP_PAGE_SITEMAP_TYPE, '<urlset></urlset>', '1998-07-17 00:00:00' );
		$librarian->store_sitemap_data( 2, JP_PAGE_SITEMAP_TYPE, '<urlset></urlset>', '2005-03-01 00:00:00' );

		$timestamps = $librarian->query_sitemap_timestamps(
			JP_PAGE_SITEMAP_TYPE,
			array( 'sitemap-1.xml', 'sitemap-2.xml' )
		);

		$this->assertSame(
			array(
				'sitemap-1.xml' => '1998-07-17 00:00:00',
				'sitemap-2.xml' => '2005-03-01 00:00:00',
			),
			$timestamps
		);
	}

	/**
	 * A name with no stored row is absent, which is how the builder spots a gap.
	 *
	 * @group jetpack-sitemap
	 * @since 16.2
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_query_sitemap_timestamps_omits_missing_names() {
		$librarian = new Jetpack_Sitemap_Librarian();
		$librarian->store_sitemap_data( 1, JP_PAGE_SITEMAP_TYPE, '<urlset></urlset>', '1970-01-01 00:00:00' );

		$timestamps = $librarian->query_sitemap_timestamps(
			JP_PAGE_SITEMAP_TYPE,
			array( 'sitemap-1.xml', 'sitemap-2.xml' )
		);

		$this->assertArrayHasKey( 'sitemap-1.xml', $timestamps );
		$this->assertArrayNotHasKey( 'sitemap-2.xml', $timestamps );
	}

	/**
	 * A name list longer than one batch is queried in chunks, not truncated.
	 *
	 * @group jetpack-sitemap
	 * @since 16.2
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_query_sitemap_timestamps_asks_in_batches() {
		$librarian = new Jetpack_Sitemap_Librarian();
		$librarian->store_sitemap_data( 1, JP_PAGE_SITEMAP_TYPE, '<urlset></urlset>', '1970-01-01 00:00:00' );

		// Only the first and last names exist, and they land in different chunks.
		$names = array();
		for ( $number = 1; $number <= JP_SITEMAP_BATCH_SIZE + 1; $number++ ) {
			$names[] = jp_sitemap_filename( JP_PAGE_SITEMAP_TYPE, $number );
		}
		$librarian->store_sitemap_data( JP_SITEMAP_BATCH_SIZE + 1, JP_PAGE_SITEMAP_TYPE, '<urlset></urlset>', '1970-01-01 00:00:00' );

		$timestamps = $librarian->query_sitemap_timestamps( JP_PAGE_SITEMAP_TYPE, $names );

		$this->assertArrayHasKey( 'sitemap-1.xml', $timestamps );
		$this->assertArrayHasKey( jp_sitemap_filename( JP_PAGE_SITEMAP_TYPE, JP_SITEMAP_BATCH_SIZE + 1 ), $timestamps );
		$this->assertCount( 2, $timestamps );
	}

	/**
	 * An empty name list makes no query and returns nothing.
	 *
	 * @group jetpack-sitemap
	 * @since 16.2
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_query_sitemap_timestamps_with_no_names() {
		$librarian = new Jetpack_Sitemap_Librarian();

		$this->assertSame( array(), $librarian->query_sitemap_timestamps( JP_PAGE_SITEMAP_TYPE, array() ) );
	}

	/**
	 * Index queries select only the columns the index builder needs.
	 *
	 * Sitemap rows store the sitemap XML in post_content, which can run to
	 * roughly a megabyte per row, so building an index must not fetch it.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_query_sitemaps_after_id_selects_only_index_columns() {
		$librarian = new Jetpack_Sitemap_Librarian();
		$librarian->store_sitemap_data( 1, JP_PAGE_SITEMAP_TYPE, '<urlset></urlset>', '1970-01-01 00:00:00' );

		$rows = $librarian->query_sitemaps_after_id( JP_PAGE_SITEMAP_TYPE, 0, 10 );

		$this->assertNotEmpty( $rows );
		$this->assertSame(
			array( 'ID', 'post_title', 'post_date' ),
			array_keys( $rows[0] )
		);
	}

	/**
	 * Image queries drop the content columns but keep everything else.
	 *
	 * The rows are handed to the jetpack_sitemap_image_skip_post filter, so
	 * narrowing beyond the two content columns would change what third-party
	 * code receives.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_query_images_after_id_omits_content_columns() {
		self::factory()->post->create(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'image/jpeg',
				'post_content'   => 'This content should never be selected.',
			)
		);

		$librarian = new Jetpack_Sitemap_Librarian();
		$rows      = $librarian->query_images_after_id( 0, 10 );

		$this->assertNotEmpty( $rows );

		$columns = array_keys( get_object_vars( $rows[0] ) );
		$this->assertNotContains( 'post_content', $columns );
		$this->assertNotContains( 'post_content_filtered', $columns );

		// The columns image_post_to_sitemap_item() reads are still there.
		$this->assertContains( 'ID', $columns );
		$this->assertContains( 'post_parent', $columns );
		$this->assertContains( 'post_modified_gmt', $columns );
	}

	/**
	 * The posts table column list is looked up once per process, not per batch.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_post_columns_lookup_is_memoized() {
		global $wpdb;

		$original_table = $wpdb->posts;
		$scratch        = $this->create_scratch_posts_table( 'memo' );

		$lookups = 0;
		$counter = function ( $query ) use ( &$lookups ) {
			if ( stripos( $query, 'SHOW COLUMNS' ) !== false ) {
				++$lookups;
			}
			return $query;
		};
		add_filter( 'query', $counter );

		try {
			$wpdb->posts = $scratch;

			$librarian = new Jetpack_Sitemap_Librarian();
			$librarian->query_posts_after_id( 0, 1 );
			$librarian->query_posts_after_id( 5, 2 );
		} finally {
			$wpdb->posts = $original_table;
			remove_filter( 'query', $counter );
			$this->drop_scratch_posts_table( $scratch );
		}

		$this->assertSame( 1, $lookups );
	}

	/**
	 * The column cache is keyed by table, so switching blogs re-reads it.
	 *
	 * This is the property that keeps a process which calls switch_to_blog()
	 * from applying one site's column list to another site's posts table.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_post_columns_cache_is_keyed_by_table() {
		global $wpdb;

		$original_table = $wpdb->posts;
		$scratch        = $this->create_scratch_posts_table( 'keyed' );

		$original_select = '';
		$scratch_select  = '';

		$last_select = '';
		$capture     = function ( $query ) use ( &$last_select ) {
			if ( stripos( ltrim( $query ), 'SELECT' ) === 0 ) {
				$last_select = $query;
			}
			return $query;
		};
		add_filter( 'query', $capture );

		try {
			$librarian = new Jetpack_Sitemap_Librarian();

			$librarian->query_posts_after_id( 0, 1 );
			$original_select = $last_select;

			$wpdb->posts = $scratch;
			$librarian->query_posts_after_id( 0, 1 );
			$scratch_select = $last_select;
		} finally {
			$wpdb->posts = $original_table;
			remove_filter( 'query', $capture );
			$this->drop_scratch_posts_table( $scratch );
		}

		// The scratch table's list is read fresh rather than served from the real table's entry.
		$this->assertStringNotContainsString( 'jetpack_sitemap_marker', $original_select );
		$this->assertStringContainsString( 'jetpack_sitemap_marker', $scratch_select );

		// Both lists still leave out the heavy columns.
		$this->assertStringNotContainsString( 'post_content', $original_select );
		$this->assertStringNotContainsString( 'post_content', $scratch_select );
	}
}
