<?php
/**
 * Podcast Feed Locator unit tests.
 *
 * @package automattic/jetpack
 */

require_once __DIR__ . '/mocks/simplepie.php';
require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-podcast-feed-locator.php';

/**
 * Class for testing the Jetpack_Podcast_Feed_Locator class.
 *
 * @coversDefaultClass Jetpack_Podcast_Feed_Locator
 */
class Jetpack_Podcast_Feed_Locator_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tests that class extends SimplePie\Locator, so that it can be set as the locator
	 * class, e.g. `$feed->set_locator_class( 'Jetpack_Podcast_Feed_Locator' )`.
	 */
	public function test_extends_simple_pie_locator() {
		$file    = new Jetpack\SimplePie\File( '<?xml version="1.0" encoding="UTF-8"?>' );
		$locator = new Jetpack_Podcast_Feed_Locator( $file );

		$this->assertInstanceOf( Jetpack\SimplePie\Locator::class, $locator );
	}

	public function test_does_not_find_podcast_feed_with_itunes_ns() {
		$rss  = <<<FEED
<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"></rss>
FEED;
		$file = new Jetpack\SimplePie\File( $rss );

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
		$file = new Jetpack\SimplePie\File( $rss );

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
		$file = new Jetpack\SimplePie\File( $rss );

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
		$file = new Jetpack\SimplePie\File( $rss );

		$locator = new Jetpack_Podcast_Feed_Locator( $file );

		$this->assertTrue( $locator->is_feed( $file ) );
	}
}
