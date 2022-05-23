<?php
/**
 * Tests for the Jetpack_Sitemap_Librarian class.
 *
 * @package automattic/jetpack
 * @since 4.7.0
 */

require_jetpack_file( 'modules/sitemaps/sitemap-constants.php' );
require_jetpack_file( 'modules/sitemaps/sitemap-librarian.php' );

/**
 * Test class for Jetpack_Sitemap_Librarian.
 *
 * @covers Jetpack_Sitemap_Librarian
 * @since 4.7.0
 */
class WP_Test_Jetpack_Sitemap_Librarian extends WP_UnitTestCase {

	/**
	 * Constructor does not throw a fatal error.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
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

}
