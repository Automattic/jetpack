<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests\Feed;

use Automattic\Jetpack\Podcast\Feed\App_Detection;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Podcast\Feed\App_Detection
 */
#[CoversClass( App_Detection::class )]
class App_Detection_Test extends BaseTestCase {

	public function test_detect_slug_returns_null_for_empty_user_agent() {
		$this->assertNull( App_Detection::detect_slug( '' ) );
	}

	public function test_detect_slug_returns_null_for_unknown_user_agent() {
		$this->assertNull( App_Detection::detect_slug( 'Mozilla/5.0 (Some Browser)' ) );
	}

	/**
	 * One representative UA per major podcatcher to confirm the substring match
	 * works as advertised.
	 */
	public function test_detect_slug_matches_known_podcatchers() {
		$cases = array(
			'iTunes/12.5 (Macintosh; OS X 10.11.6) AppleWebKit/603.1.30' => 'apple',
			'AppleCoreMedia/1.0.0.20F71 (iPhone; U; CPU OS 16_5_1 like Mac OS X)' => 'apple',
			'AirPodcasts/1.0 (HomePod; OS 16.5)' => 'apple',
			'Spotify/8.7.0 iOS/16.4'             => 'spotify',
			'Pocket Casts/7.45.0/iOS/16.4'       => 'pocketcasts',
			'AmazonMusic/16.13.0; Android/13'    => 'amazon',
			// Amazon's actual feed crawler (with spaces) — distinct from the listening app.
			'Amazon Music Podcast/1.0'           => 'amazon',
			'Mozilla/5.0 (compatible; Podcastindex.org/1.0)' => 'podcastindex',
			'PodcastIndexer/2.1 (+https://podcastindex.org/)' => 'podcastindex',
			'PodcastIndexManager/1.0'            => 'podcastindex',
			'Google-Podcast-Crawler/1.0'         => 'youtube',
			'GooglePodcasts/1.0 iOS/16.4'        => 'youtube',
			'YouTubeMusic/5.34.51'               => 'youtube',
			'Overcast/2023.10 (+http://overcast.fm/; iOS podcast app)' => 'overcast',
		);

		foreach ( $cases as $ua => $expected_slug ) {
			$this->assertSame( $expected_slug, App_Detection::detect_slug( $ua ), "UA: $ua" );
		}
	}

	public function test_detect_slug_is_case_insensitive() {
		$this->assertSame( 'spotify', App_Detection::detect_slug( 'SPOTIFY/1.0' ) );
		$this->assertSame( 'spotify', App_Detection::detect_slug( 'spotify/1.0' ) );
	}
}
