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
	 * Regression test for https://github.com/Automattic/jetpack/issues/48202
	 *
	 * If wp_posts has a column whose name is a reserved SQL keyword (e.g. `order`),
	 * the SELECT used by the sitemap query must still succeed because column names
	 * are passed as %i identifier placeholders to wpdb::prepare().
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_query_posts_after_id_handles_reserved_keyword_columns() {
		global $wpdb;

		// Check whether the column already exists before adding it.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$column_existed = (bool) $wpdb->get_var( "SHOW COLUMNS FROM {$wpdb->posts} LIKE 'order'" );

		if ( ! $column_existed ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->query( "ALTER TABLE {$wpdb->posts} ADD COLUMN `order` INT NULL" );
			$this->assertEmpty( $wpdb->last_error, 'ALTER TABLE to add `order` column failed.' );
		}

		try {
			$post_id = self::factory()->post->create(
				array(
					'post_status' => 'publish',
					'post_type'   => 'post',
				)
			);

			$librarian = new Jetpack_Sitemap_Librarian();
			$results   = $librarian->query_posts_after_id( 0, 10 );

			// The query must run without raising a SQL error.
			$this->assertSame( '', $wpdb->last_error );
			$this->assertIsArray( $results );

			// And the post we just created should come back.
			$ids = wp_list_pluck( $results, 'ID' );
			$this->assertContains( (string) $post_id, array_map( 'strval', $ids ) );
		} finally {
			// Only drop the column if we added it — don't mutate a pre-existing schema.
			if ( ! $column_existed ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.DirectDatabaseQuery.NoCaching
				$wpdb->query( "ALTER TABLE {$wpdb->posts} DROP COLUMN `order`" );
			}
		}
	}
}
