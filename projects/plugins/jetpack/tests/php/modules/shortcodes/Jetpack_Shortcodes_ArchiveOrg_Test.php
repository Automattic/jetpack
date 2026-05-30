<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class Jetpack_Shortcodes_ArchiveOrg_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Verify that [archiveorg] and [archiveorg-book] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_exists() {
		$this->assertTrue( shortcode_exists( 'archiveorg' ) );
		$this->assertTrue( shortcode_exists( 'archiveorg-book' ) );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes() {
		$content           = '[archiveorg]';
		$shortcode_content = do_shortcode( $content );
		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- error: missing archive.org ID -->', $shortcode_content );

		$content           = '[archiveorg-book]';
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
		$id                = 'Wonderfu1958';
		$title             = 'Archive.org';
		$content           = "[archiveorg id='$id' width='600' height='300']";
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( "iframe title=\"$title\" src=\"https://archive.org/embed/$id\" width=\"600\" height=\"300\"", $shortcode_content );
	}

	/**
	 * Verify that autoplay and poster attributes render as a proper query string.
	 */
	public function test_shortcode_autoplay_and_poster() {
		$content           = "[archiveorg id='Wonderfu1958' autoplay=1 poster='http://archive.org/img.png']";
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( 'src="https://archive.org/embed/Wonderfu1958?autoplay=1&#038;poster=http://archive.org/img.png"', $shortcode_content );
	}

	/**
	 * Verify that the playlist attribute renders as a proper query parameter.
	 */
	public function test_shortcode_playlist_attribute() {
		$content           = "[archiveorg id='sentidodelobjeto' playlist=1]";
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( 'src="https://archive.org/embed/sentidodelobjeto?playlist=1"', $shortcode_content );
	}

	/**
	 * Verify that query parameters baked into the identifier with "&" are converted to a proper query string.
	 */
	public function test_shortcode_query_string_in_id_with_ampersand() {
		$shortcode_content = do_shortcode( '[archiveorg sentidodelobjeto&playlist=1 width=640 height=300]' );
		$this->assertStringContainsString( 'src="https://archive.org/embed/sentidodelobjeto?playlist=1"', $shortcode_content );
	}

	/**
	 * Verify that query parameters baked into the identifier with "?" pass through correctly.
	 */
	public function test_shortcode_query_string_in_id_with_question_mark() {
		$shortcode_content = do_shortcode( '[archiveorg sentidodelobjeto?playlist=1 width=640 height=300]' );
		$this->assertStringContainsString( 'src="https://archive.org/embed/sentidodelobjeto?playlist=1"', $shortcode_content );
	}

	/**
	 * Verify that an HTML-encoded "&amp;" baked into the identifier is normalized before splitting,
	 * matching what reaches do_shortcode in environments where the_content encodes ampersands first.
	 */
	public function test_shortcode_query_string_in_id_with_html_encoded_ampersand() {
		$shortcode_content = do_shortcode( '[archiveorg sentidodelobjeto&amp;playlist=1 width=640 height=300]' );
		$this->assertStringContainsString( 'src="https://archive.org/embed/sentidodelobjeto?playlist=1"', $shortcode_content );
	}

	/**
	 * Verify that an identifier consisting of only a query string returns the missing-ID error
	 * rather than producing an item-less embed URL.
	 */
	public function test_shortcode_returns_error_when_id_is_only_a_query_string() {
		$this->assertEquals( '<!-- error: missing archive.org ID -->', do_shortcode( '[archiveorg ?playlist=1]' ) );
		$this->assertEquals( '<!-- error: missing archive.org ID -->', do_shortcode( '[archiveorg &playlist=1]' ) );
	}

	/**
	 * Verify that a query parameter supplied both via the identifier and as a shortcode attribute
	 * appears only once in the rendered URL.
	 */
	public function test_shortcode_dedupes_duplicate_query_params_from_id_and_atts() {
		$shortcode_content = do_shortcode( '[archiveorg myitem&playlist=1 playlist=1]' );
		$this->assertStringContainsString( 'src="https://archive.org/embed/myitem?playlist=1"', $shortcode_content );
		$this->assertSame( 1, substr_count( $shortcode_content, 'playlist=1' ) );
	}

	/**
	 * Verify that a "#" fragment in the identifier stays after the query string rather than swallowing it.
	 */
	public function test_shortcode_places_query_before_fragment_in_id() {
		$shortcode_content = do_shortcode( '[archiveorg myitem#frag&playlist=1]' );
		$this->assertStringContainsString( 'src="https://archive.org/embed/myitem?playlist=1#frag"', $shortcode_content );
	}

	/**
	 * Verify that rendering the archiveorg-book shortcode returns an ArchiveOrg book.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcode_book() {
		$id                = 'goodytwoshoes00newyiala';
		$title             = 'Archive.org Book';
		$content           = "[archiveorg-book id='$id' width='600' height='300']";
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( "iframe title=\"$title\" src=\"https://archive.org/stream/$id?ui=embed#mode/1up\" width=\"600\" height=\"300\"", $shortcode_content );
	}
}
