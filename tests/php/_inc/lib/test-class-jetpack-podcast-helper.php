<?php
/**
 * Podcast Helper unit tests.
 *
 * @package Jetpack
 */

jetpack_require_lib( 'class-jetpack-podcast-helper' );
require_once __DIR__ . '/mocks/class-mock-jetpack-podcast-helper.php';
require_once __DIR__ . '/mocks/class-mock-simplepie.php';
require_once __DIR__ . '/mocks/class-mock-simplepie-item.php';

/**
 * Class for testing the Jetpack_Podcast_Helper class.
 *
 * @coversDefaultClass Jetpack_Podcast_Helper
 */
class WP_Test_Jetpack_Podcast_Helper extends WP_UnitTestCase {
	/**
	 * Tests get_track_data().
	 *
	 * @covers ::get_track_data
	 */
	public function test_get_track_data() {
		// `load_feed()` returns error.
		$error = Mock_Jetpack_Podcast_Helper::get_track_data( 'error', '' );
		$this->assertWPError( $error );
		$this->assertSame( $error->get_error_code(), 'feed_error' );
		$this->assertSame( $error->get_error_message(), 'Feed error.' );

		// Can't find an episode.
		$error = Mock_Jetpack_Podcast_Helper::get_track_data( '', '' );
		$this->assertWPError( $error );
		$this->assertSame( $error->get_error_code(), 'no_track' );
		$this->assertSame( $error->get_error_message(), 'The track was not found.' );

		// Success.
		$episode = Mock_Jetpack_Podcast_Helper::get_track_data( '', 1 );
		$this->assertSame(
			$episode,
			array(
				'id'          => 'podcast-track-1',
				'link'        => 'https://example.org',
				'src'         => 'https://example.org',
				'type'        => 'episode',
				'description' => '',
				'title'       => '',
			)
		);
	}
}
