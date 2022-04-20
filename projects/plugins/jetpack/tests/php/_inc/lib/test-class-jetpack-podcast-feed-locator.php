<?php
/**
 * Podcast Feed Locator unit tests.
 *
 * @package automattic/jetpack
 */

require_once __DIR__ . '/mocks/class-simplepie-file.php';
require_once __DIR__ . '/mocks/class-simplepie-locator.php';
jetpack_require_lib( 'class-jetpack-podcast-feed-locator' );

/**
 * Class for testing the Jetpack_Podcast_Feed_Locator class.
 *
 * @coversDefaultClass Jetpack_Podcast_Feed_Locator
 */
class WP_Test_Jetpack_Podcast_Feed_Locator extends WP_UnitTestCase {
	/**
	 * Tests that class extends SimplePie_Locator, so that it can be set as the locator
	 * class, e.g. `$feed->set_locator_class( 'Jetpack_Podcast_Feed_Locator' )`.
	 */
	public function test_extends_simple_pie_locator() {
		$file    = new SimplePie_File( '<?xml version="1.0" encoding="UTF-8"?>' );
		$locator = new Jetpack_Podcast_Feed_Locator( $file );

		$this->assertInstanceOf( 'SimplePie_Locator', $locator );
	}

	public function test_does_not_find_podcast_feed_with_itunes_ns() {
		$rss  = <<<FEED
<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"></rss>
FEED;
		$file = new SimplePie_File( $rss );

		$locator = new Jetpack_Podcast_Feed_Locator( $file );

		$this->assertFalse( $locator->is_feed( $file ) );
	}

	public function test_does_not_find_podcast_feed_with_audio_enclosures() {
		$rss  = <<<FEED
<?xml version="1.0" encoding="UTF-8"?>
<rss>
	<channel>
		<item>
			<enclosure url="https://example.com/audio.mp3" type="audio/mpeg"/>
		</item>
	</channel>
</rss>
FEED;
		$file = new SimplePie_File( $rss );

		$locator = new Jetpack_Podcast_Feed_Locator( $file );

		$this->assertFalse( $locator->is_feed( $file ) );
	}

	public function test_does_not_locate_non_podcast_feeds() {
		$rss  = <<<FEED
<?xml version="1.0" encoding="UTF-8"?>
<rss>
	<channel>
		<item>
			<title>My Post</title>
		</item>
	</channel>
</rss>
FEED;
		$file = new SimplePie_File( $rss );

		$locator = new Jetpack_Podcast_Feed_Locator( $file );

		$this->assertFalse( $locator->is_feed( $file ) );
	}

	public function test_finds_podcast_feed_with_itunes_ns_and_audio_enclosures() {
		$rss  = <<<FEED
<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
	<channel>
		<item>
			<enclosure url="https://example.com/audio.mp3" type="audio/mpeg"/>
		</item>
	</channel>
</rss>
FEED;
		$file = new SimplePie_File( $rss );

		$locator = new Jetpack_Podcast_Feed_Locator( $file );

		$this->assertTrue( $locator->is_feed( $file ) );
	}
}
