<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_ArchiveOrg extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Verify that [archiveorg] and [archiveorg-book] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_exists() {
		$this->assertEquals( shortcode_exists( 'archiveorg' ), true );
		$this->assertEquals( shortcode_exists( 'archiveorg-book' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes() {
		$content = '[archiveorg]';
		$shortcode_content = do_shortcode( $content );
		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- error: missing archive.org ID -->', $shortcode_content );

		$content = '[archiveorg-book]';
		$shortcode_content = do_shortcode( $content );
		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- error: missing archive.org book ID -->', $shortcode_content );
	}

	/**
	 * Verify that rendering the archiveorg shortcode returns a single ArchiveOrg element.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcode_single_element() {
		$id = 'Wonderfu1958';
		$title = 'Archive.org';
		$content = "[archiveorg id='$id' width='600' height='300']";
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( "iframe title=\"$title\" src=\"https://archive.org/embed/$id\" width=\"600\" height=\"300\"", $shortcode_content );
	}

	/**
	 * Verify that rendering the archiveorg-book shortcode returns an ArchiveOrg book.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcode_book() {
		$id = 'goodytwoshoes00newyiala';
		$title = 'Archive.org Book';
		$content = "[archiveorg-book id='$id' width='600' height='300']";
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( "iframe title=\"$title\" src=\"https://archive.org/stream/$id?ui=embed#mode/1up\" width=\"600\" height=\"300\"", $shortcode_content );
	}
}
