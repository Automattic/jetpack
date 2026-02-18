<?php
/**
 * Tests for the Shortcodes class.
 *
 * @package automattic/jetpack-post-media
 */

use Automattic\Jetpack\Shortcodes;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Test shortcode ID extraction methods.
 *
 * @covers \Automattic\Jetpack\Shortcodes
 */
#[CoversClass( Shortcodes::class )]
class Shortcodes_Test extends TestCase {

	// ----------------------------- YouTube -----------------------------------

	/**
	 * Test extracting a YouTube video ID from a standard watch URL.
	 */
	public function test_get_youtube_id_with_single_video_url() {
		$url = 'https://www.youtube.com/watch?v=snAvGxz7D04';
		$this->assertSame( 'snAvGxz7D04', Shortcodes::get_youtube_id( $url ) );
	}

	/**
	 * Test extracting a YouTube playlist ID.
	 */
	public function test_get_youtube_id_with_playlist_url() {
		$url = 'https://www.youtube.com/playlist?list=PL56C3506BBE979C1B';
		$this->assertSame( 'PL56C3506BBE979C1B', Shortcodes::get_youtube_id( $url ) );
	}

	/**
	 * Test extracting a YouTube video ID from a shorts URL.
	 */
	public function test_get_youtube_id_with_shorts_url() {
		$this->assertSame( 'VIDEO_ID', Shortcodes::get_youtube_id( 'https://www.youtube.com/shorts/VIDEO_ID' ) );
	}

	/**
	 * Test extracting a YouTube video ID from a youtu.be short URL.
	 */
	public function test_get_youtube_id_with_short_url() {
		$url = 'https://youtu.be/dQw4w9WgXcQ';
		$this->assertSame( 'dQw4w9WgXcQ', Shortcodes::get_youtube_id( $url ) );
	}

	/**
	 * Test extracting a YouTube video ID from a /v/ URL format.
	 */
	public function test_get_youtube_id_with_v_path_url() {
		$url = 'https://www.youtube.com/v/dQw4w9WgXcQ?fs=1&hl=en_US';
		$this->assertSame( 'dQw4w9WgXcQ', Shortcodes::get_youtube_id( $url ) );
	}

	/**
	 * Test extracting a YouTube video ID when attributes are an array.
	 */
	public function test_get_youtube_id_with_array_atts() {
		$atts = array( 'https://www.youtube.com/watch?v=snAvGxz7D04' );
		$this->assertSame( 'snAvGxz7D04', Shortcodes::get_youtube_id( $atts ) );
	}

	/**
	 * Test that a URL without a video ID returns false.
	 */
	public function test_get_youtube_id_returns_false_for_url_without_id() {
		$this->assertFalse( Shortcodes::get_youtube_id( 'https://www.youtube.com/' ) );
	}

	/**
	 * Test extracting a YouTube video ID from a URL with encoded ampersands.
	 */
	public function test_get_youtube_id_with_encoded_ampersands() {
		$url = 'https://www.youtube.com/watch?v=snAvGxz7D04&amp;feature=related';
		$this->assertSame( 'snAvGxz7D04', Shortcodes::get_youtube_id( $url ) );
	}

	/**
	 * Test that a URL with an empty v= parameter returns false.
	 */
	public function test_get_youtube_id_returns_false_for_empty_v() {
		$this->assertFalse( Shortcodes::get_youtube_id( 'https://www.youtube.com/watch?v=' ) );
	}

	/**
	 * Test that get_youtube_id handles non-string input gracefully.
	 */
	public function test_get_youtube_id_returns_false_for_non_string() {
		// @phan-suppress-next-line PhanTypeMismatchArgument -- This is testing the error case.
		$this->assertFalse( Shortcodes::get_youtube_id( 42 ) );
	}

	/**
	 * Test that a playlist URL returns the list ID when there's no v parameter.
	 */
	public function test_get_youtube_id_playlist_over_empty_v() {
		$url = 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf';
		$this->assertSame( 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf', Shortcodes::get_youtube_id( $url ) );
	}

	// ----------------------- sanitize_youtube_url ----------------------------

	/**
	 * Test sanitize_youtube_url with a standard URL.
	 */
	public function test_sanitize_youtube_url_standard() {
		$url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
		$this->assertSame( $url, Shortcodes::sanitize_youtube_url( $url ) );
	}

	/**
	 * Test sanitize_youtube_url with a youtu.be short URL.
	 */
	public function test_sanitize_youtube_url_short_url() {
		$url    = 'https://youtu.be/dQw4w9WgXcQ';
		$result = Shortcodes::sanitize_youtube_url( $url );
		$this->assertStringContainsString( '?v=dQw4w9WgXcQ', $result );
	}

	/**
	 * Test sanitize_youtube_url replaces encoded ampersands.
	 */
	public function test_sanitize_youtube_url_encoded_ampersands() {
		$url = 'https://www.youtube.com/watch?v=abc&amp;feature=related';
		$this->assertStringNotContainsString( '&amp;', Shortcodes::sanitize_youtube_url( $url ) );
	}

	/**
	 * Test sanitize_youtube_url with non-string input returns false.
	 */
	public function test_sanitize_youtube_url_non_string_returns_false() {
		// @phan-suppress-next-line PhanTypeMismatchArgument -- This is testing the error case.
		$this->assertFalse( Shortcodes::sanitize_youtube_url( 42 ) );
	}

	/**
	 * Test sanitize_youtube_url with an array containing a 'url' key.
	 */
	public function test_sanitize_youtube_url_with_array_url_key() {
		$url    = array( 'url' => 'https://www.youtube.com/watch?v=abc' );
		$result = Shortcodes::sanitize_youtube_url( $url );
		$this->assertStringContainsString( 'v=abc', $result );
	}

	/**
	 * Test sanitize_youtube_url with a shorts URL.
	 */
	public function test_sanitize_youtube_url_shorts() {
		$result = Shortcodes::sanitize_youtube_url( 'https://www.youtube.com/shorts/VIDEO_ID' );
		$this->assertStringContainsString( '/watch?v=VIDEO_ID', $result );
	}

	/**
	 * Test sanitize_youtube_url with a /v/ path URL.
	 */
	public function test_sanitize_youtube_url_v_path() {
		$result = Shortcodes::sanitize_youtube_url( 'https://www.youtube.com/v/dQw4w9WgXcQ?fs=1&hl=en_US' );
		$this->assertStringContainsString( '?v=dQw4w9WgXcQ', $result );
	}

	// ----------------------------- Vimeo -------------------------------------

	/**
	 * Provides Vimeo URL test cases.
	 *
	 * @return array
	 */
	public static function provide_vimeo_urls() {
		return array(
			'simple id'                     => array(
				array( '6342264' ),
				6342264,
			),
			'id with leading equals'        => array(
				array( '=6342264' ),
				6342264,
			),
			'simple URL'                    => array(
				array( 'https://vimeo.com/6342264 ' ),
				6342264,
			),
			'unlisted video'                => array(
				array( 'https://vimeo.com/289091934/cd1f466bcc' ),
				289091934,
			),
			'video within a playlist'       => array(
				array( 'https://vimeo.com/album/2838732/video/6342264' ),
				6342264,
			),
			'player URL'                    => array(
				array( 'http://player.vimeo.com/video/18427511' ),
				18427511,
			),
			'groups URL'                    => array(
				array( 'https://vimeo.com/groups/758728/videos/897094040' ),
				897094040,
			),
			'channels URL'                  => array(
				array( 'https://vimeo.com/channels/staffpicks/videos/123456789 ' ),
				123456789,
			),
			'empty attributes returns 0'    => array(
				array(),
				0,
			),
			'non-numeric non-URL returns 0' => array(
				array( 'notavimeourl' ),
				0,
			),
		);
	}

	/**
	 * Test Vimeo ID extraction with various URL formats.
	 *
	 * @dataProvider provide_vimeo_urls
	 *
	 * @param array $atts     Shortcode attributes.
	 * @param int   $expected Expected Vimeo ID.
	 */
	#[DataProvider( 'provide_vimeo_urls' )]
	public function test_get_vimeo_id( $atts, $expected ) {
		$this->assertSame( $expected, Shortcodes::get_vimeo_id( $atts ) );
	}

	// ----------------------------- get_attribute_id ----------------------------

	/**
	 * Test get_attribute_id with default key (positional 0), as used by wpvideo/videopress.
	 */
	public function test_get_attribute_id_positional() {
		$this->assertSame( 'AbCd1234', Shortcodes::get_attribute_id( array( 'AbCd1234' ) ) );
	}

	/**
	 * Test get_attribute_id with named key, as used by ted/hulu.
	 */
	public function test_get_attribute_id_named() {
		$this->assertSame( '210', Shortcodes::get_attribute_id( array( 'id' => '210' ), 'id' ) );
	}

	/**
	 * Test get_attribute_id with a numeric value.
	 */
	public function test_get_attribute_id_numeric_value() {
		$this->assertSame( 1539, Shortcodes::get_attribute_id( array( 'id' => 1539 ), 'id' ) );
	}

	/**
	 * Test get_attribute_id returns 0 for empty attributes.
	 */
	public function test_get_attribute_id_returns_0_for_empty_atts() {
		$this->assertSame( 0, Shortcodes::get_attribute_id( array() ) );
	}

	/**
	 * Test get_attribute_id returns 0 when the requested key is missing.
	 */
	public function test_get_attribute_id_returns_0_for_missing_key() {
		$this->assertSame( 0, Shortcodes::get_attribute_id( array( 'lang' => 'en' ), 'id' ) );
	}

	// ----------------------------- Wrapper methods ----------------------------

	/**
	 * Test get_ted_id returns the named 'id' attribute.
	 */
	public function test_get_ted_id_with_named_id() {
		$this->assertSame( '210', Shortcodes::get_ted_id( array( 'id' => '210' ) ) );
	}

	/**
	 * Test get_ted_id returns 0 for positional attributes (uses 'id' key).
	 */
	public function test_get_ted_id_ignores_positional() {
		$this->assertSame( 0, Shortcodes::get_ted_id( array( '210' ) ) );
	}

	/**
	 * Test get_hulu_id returns the named 'id' attribute.
	 */
	public function test_get_hulu_id_with_named_id() {
		$this->assertSame( '123456', Shortcodes::get_hulu_id( array( 'id' => '123456' ) ) );
	}

	/**
	 * Test get_hulu_id returns 0 for positional attributes (uses 'id' key).
	 */
	public function test_get_hulu_id_ignores_positional() {
		$this->assertSame( 0, Shortcodes::get_hulu_id( array( '123456' ) ) );
	}

	/**
	 * Test get_wpvideo_id returns the first positional attribute.
	 */
	public function test_get_wpvideo_id_with_positional() {
		$this->assertSame( 'abc123', Shortcodes::get_wpvideo_id( array( 'abc123' ) ) );
	}

	/**
	 * Test get_wpvideo_id returns 0 for named attributes (uses positional key).
	 */
	public function test_get_wpvideo_id_ignores_named() {
		$this->assertSame( 0, Shortcodes::get_wpvideo_id( array( 'id' => 'abc123' ) ) );
	}

	/**
	 * Test get_videopress_id returns the first positional attribute.
	 */
	public function test_get_videopress_id_with_positional() {
		$this->assertSame( 'xyz789', Shortcodes::get_videopress_id( array( 'xyz789' ) ) );
	}

	/**
	 * Test get_videopress_id returns 0 for named attributes (uses positional key).
	 */
	public function test_get_videopress_id_ignores_named() {
		$this->assertSame( 0, Shortcodes::get_videopress_id( array( 'id' => 'xyz789' ) ) );
	}

	// ----------------------------- Archive.org -------------------------------

	/**
	 * Provides Archive.org shortcode test cases.
	 *
	 * @return array
	 */
	public static function provide_archiveorg_atts() {
		return array(
			'plain identifier'             => array(
				array( 'Experime1940' ),
				'Experime1940',
			),
			'details URL'                  => array(
				array( 'http://archive.org/details/Experime1940' ),
				'Experime1940',
			),
			'https details URL'            => array(
				array( 'https://archive.org/details/Experime1940' ),
				'Experime1940',
			),
			'embed URL'                    => array(
				array( 'https://archive.org/embed/Experime1940' ),
				'Experime1940',
			),
			'with leading equals'          => array(
				array( '=Experime1940' ),
				'Experime1940',
			),
			'URL with query string'        => array(
				array( 'https://archive.org/details/Experime1940?foo=bar' ),
				'Experime1940',
			),
			'URL with extra path segments' => array(
				array( 'https://archive.org/details/Experime1940/page/n3' ),
				'Experime1940',
			),
			'empty attributes'             => array(
				array(),
				0,
			),
		);
	}

	/**
	 * Test Archive.org ID extraction from various formats.
	 *
	 * @dataProvider provide_archiveorg_atts
	 *
	 * @param array      $atts     Shortcode attributes.
	 * @param string|int $expected Expected Archive.org identifier.
	 */
	#[DataProvider( 'provide_archiveorg_atts' )]
	public function test_get_archiveorg_id( $atts, $expected ) {
		$this->assertSame( $expected, Shortcodes::get_archiveorg_id( $atts ) );
	}

	// ----------------------------- Archive.org Book --------------------------

	/**
	 * Provides Archive.org book shortcode test cases.
	 *
	 * @return array
	 */
	public static function provide_archiveorg_book_atts() {
		return array(
			'plain identifier'             => array(
				array( 'goodytwoshoes00newyiala' ),
				'goodytwoshoes00newyiala',
			),
			'stream URL'                   => array(
				array( 'https://www.archive.org/stream/goodytwoshoes00newyiala' ),
				'goodytwoshoes00newyiala',
			),
			'http stream URL'              => array(
				array( 'http://archive.org/stream/goodytwoshoes00newyiala' ),
				'goodytwoshoes00newyiala',
			),
			'with leading equals'          => array(
				array( '=goodytwoshoes00newyiala' ),
				'goodytwoshoes00newyiala',
			),
			'URL with extra path segments' => array(
				array( 'https://archive.org/stream/goodytwoshoes00newyiala/page/n3' ),
				'goodytwoshoes00newyiala',
			),
			'URL with query string'        => array(
				array( 'https://archive.org/stream/goodytwoshoes00newyiala?ui=embed' ),
				'goodytwoshoes00newyiala',
			),
			'empty attributes'             => array(
				array(),
				0,
			),
		);
	}

	/**
	 * Test Archive.org book ID extraction from various formats.
	 *
	 * @dataProvider provide_archiveorg_book_atts
	 *
	 * @param array      $atts     Shortcode attributes.
	 * @param string|int $expected Expected Archive.org book identifier.
	 */
	#[DataProvider( 'provide_archiveorg_book_atts' )]
	public function test_get_archiveorg_book_id( $atts, $expected ) {
		$this->assertSame( $expected, Shortcodes::get_archiveorg_book_id( $atts ) );
	}
}
