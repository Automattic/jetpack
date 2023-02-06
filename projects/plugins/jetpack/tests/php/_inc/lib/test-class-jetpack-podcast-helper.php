<?php
/**
 * Podcast Helper unit tests.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-podcast-helper.php';
require_once __DIR__ . '/mocks/class-simplepie.php';
require_once __DIR__ . '/mocks/class-simplepie-item.php';

/**
 * Class for testing the Jetpack_Podcast_Helper class.
 *
 * @coversDefaultClass Jetpack_Podcast_Helper
 */
class WP_Test_Jetpack_Podcast_Helper extends WP_UnitTestCase {
	/**
	 * Tests get_track_data() when the feed cannot be retrieved.
	 *
	 * @covers ::get_track_data
	 */
	public function test_get_track_data_feed_error() {
		$podcast_helper = $this->getMockBuilder( 'Jetpack_Podcast_Helper' )
			->disableOriginalConstructor()
			->setMethods( array( 'load_feed', 'setup_tracks_callback' ) )
			->getMock();

		$podcast_helper->expects( $this->exactly( 1 ) )
			->method( 'load_feed' )
			->will( $this->returnValue( new WP_Error( 'feed_error', 'Feed error.' ) ) );

		$error = $podcast_helper->get_track_data( 'invalid_id' );
		$this->assertWPError( $error );
		$this->assertSame( 'feed_error', $error->get_error_code() );
		$this->assertSame( 'Feed error.', $error->get_error_message() );
	}

	/**
	 * Tests get_track_data() finds the given episode.
	 *
	 * @covers ::get_track_data
	 */
	public function test_get_track_data_find_episode() {
		$podcast_helper = $this->getMockBuilder( 'Jetpack_Podcast_Helper' )
			->disableOriginalConstructor()
			->setMethods( array( 'load_feed', 'setup_tracks_callback' ) )
			->getMock();

		$track = $this->getMockBuilder( 'SimplePie_Item' )
			->disableOriginalConstructor()
			->setMethods( array( 'get_id' ) )
			->getMock();

		$track->expects( $this->exactly( 2 ) )
			->method( 'get_id' )
			->will( $this->returnValue( 1 ) );

		$rss = $this->getMockBuilder( 'SimplePie' )
			->disableOriginalConstructor()
			->setMethods( array( 'get_items' ) )
			->getMock();

		$rss->expects( $this->exactly( 2 ) )
			->method( 'get_items' )
			->will( $this->returnValue( array( $track ) ) );

		$podcast_helper->expects( $this->exactly( 2 ) )
			->method( 'load_feed' )
			->will( $this->returnValue( $rss ) );

		$id = wp_unique_id( 'podcast-track-' );

		$podcast_helper->expects( $this->exactly( 1 ) )
			->method( 'setup_tracks_callback' )
			->will(
				$this->returnValue(
					array(
						'id'          => $id,
						'link'        => 'https://example.org',
						'src'         => 'https://example.org',
						'type'        => 'episode',
						'description' => '',
						'title'       => '',
						'guid'        => '123',
					)
				)
			);

		// Can't find an episode.
		$error = $podcast_helper->get_track_data( 'invalid_id' );
		$this->assertWPError( $error );
		$this->assertSame( 'no_track', $error->get_error_code() );
		$this->assertSame( 'The track was not found.', $error->get_error_message() );

		// Success.
		$episode = $podcast_helper->get_track_data( 1 );
		$this->assertSame(
			$episode,
			array(
				'id'          => $id,
				'link'        => 'https://example.org',
				'src'         => 'https://example.org',
				'type'        => 'episode',
				'description' => '',
				'title'       => '',
				'guid'        => '123',
			)
		);
	}
}
