<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests\Feed;

use Automattic\Jetpack\Podcast\Feed\Stats_Url;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Podcast\Feed\Stats_Url
 */
#[CoversClass( Stats_Url::class )]
class Stats_Url_Test extends BaseTestCase {

	public function test_generate_url_uses_canonical_public_api_shape() {
		$url = Stats_Url::generate_url( 12345, 678, 'mp3' );
		$this->assertSame( 'https://public-api.wordpress.com/wpcom/v2/sites/12345/podcast-play/678.mp3', $url );
	}

	public function test_generate_url_normalizes_unknown_extension_to_mp3() {
		$url = Stats_Url::generate_url( 1, 2, 'xyz' );
		$this->assertStringEndsWith( '.mp3', $url );
	}

	public function test_generate_url_lowercases_known_extensions() {
		$url = Stats_Url::generate_url( 1, 2, 'M4A' );
		$this->assertStringEndsWith( '.m4a', $url );
	}

	public function test_get_audio_extension_pulls_known_extension_from_url() {
		$this->assertSame( 'mp3', Stats_Url::get_audio_extension( 'https://example.com/episode.mp3' ) );
		$this->assertSame( 'm4a', Stats_Url::get_audio_extension( 'https://example.com/episode.m4a?v=1' ) );
		$this->assertSame( 'opus', Stats_Url::get_audio_extension( 'https://example.com/path/episode.OPUS' ) );
	}

	public function test_get_audio_extension_falls_back_to_mp3_for_unrecognized_extensions() {
		$this->assertSame( 'mp3', Stats_Url::get_audio_extension( 'https://example.com/episode.exe' ) );
		$this->assertSame( 'mp3', Stats_Url::get_audio_extension( 'https://example.com/episode' ) );
		$this->assertSame( 'mp3', Stats_Url::get_audio_extension( 'not a url' ) );
	}
}
