<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\VideoPress\Initializer methods
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use WorDBless\BaseTestCase;

/**
 * Initializer test suite.
 */
class Test_Uploader extends BaseTestCase {

		/** Data provider for valid VideoPress oembed url tests */
	public function provideUrlPresentData() {
		return array(
			array(
				'https://video.wordpress.com/v/GUID',
			),
			array(
				'https://videopress.com/v/GUID',
			),
			array(
				'https://video.wordpress.com/embed/GUID',
			),
			array(
				'https://videopress.com/embed/GUID',
			),
			array(
				'https://v.wordpress.com/GUID1234',
			),
		);
	}

	/**
	 * Tests that token bridge is enqueued when a valid video url is present.
	 *
	 * @dataProvider provideUrlPresentData
	 * @param string $url The oembed url to test.
	 */
	public function test_video_enqueue_bridge_when_oembed_present_enqueue_script_with_valid_urls( $url ) {
		$mock = \Mockery::mock( 'alias:Automattic\Jetpack\VideoPress\Jwt_Token_Bridge' );
		$mock->expects( 'enqueue_jwt_token_bridge' )->once();

		$cache_value    = 'some-markup';
		$cache_returned = VideoPress_Initializer::video_enqueue_bridge_when_oembed_present( $cache_value, $url, null, null );
		$this->assertEquals( $cache_value, $cache_returned );
	}

	/** Tests bridge script is NOT enqueued when no video url is present */
	public function test_video_enqueue_bridge_when_oembed_present_whith_no_video_url() {
		$mock = \Mockery::mock( 'alias:Automattic\Jetpack\VideoPress\Jwt_Token_Bridge' );
		$mock->expects( 'enqueue_jwt_token_bridge' )->never();

		$cache_value    = 'some-markup';
		$cache_returned = VideoPress_Initializer::video_enqueue_bridge_when_oembed_present( $cache_value, 'https://www.some-site.com', null, null );
		$this->assertEquals( $cache_value, $cache_returned );
	}
}
