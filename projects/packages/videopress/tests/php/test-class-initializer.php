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

	/** Tests the render_videopress_video_block function, when max width is set */
	public function test_render_videopress_video_block_with_max_width() {
		$attributes = array(
			'controls'            => true,
			'loop'                => false,
			'muted'               => true,
			'playsinline'         => true,
			'poster'              => 'http://localhost/wp-content/uploads/2023/03/cHJpdmF0ZS9sci9pbWFnZJMvd2Vic2l0ZS8yMDIyLTA1L25zMTEwODYtaW1hZ2Uta3d2eWRqaGYuanBn.jpg',
			'preload'             => 'none',
			'seekbarColor'        => '#ff6900',
			'seekbarPlayedColor'  => '#00d084',
			'seekbarLoadingColor' => '#fcb900',
			'useAverageColor'     => false,
			'maxWidth'            => '300px',
		);

		$content = 'some content';
		$block   = array( 'context' => array() );

		$rendered_block = VideoPress_Initializer::render_videopress_video_block( $attributes, $content, $block );

		$this->assertStringContainsString( 'wp-block-jetpack-videopress--has-max-width', $rendered_block );
	}

	/** Tests the render_videopress_video_block function, when max width is not set */
	public function test_render_videopress_video_block_without_max_width() {
		$attributes = array(
			'controls'            => true,
			'loop'                => false,
			'muted'               => true,
			'playsinline'         => true,
			'poster'              => 'http://localhost/wp-content/uploads/2023/03/cHJpdmF0ZS9sci9pbWFnZJMvd2Vic2l0ZS8yMDIyLTA1L25zMTEwODYtaW1hZ2Uta3d2eWRqaGYuanBn.jpg',
			'preload'             => 'none',
			'seekbarColor'        => '#ff6900',
			'seekbarPlayedColor'  => '#00d084',
			'seekbarLoadingColor' => '#fcb900',
			'useAverageColor'     => false,
		);

		$block   = array( 'context' => array() );
		$content = 'some content';

		$rendered_block = VideoPress_Initializer::render_videopress_video_block( $attributes, $content, $block );

		$this->assertStringNotContainsString( 'wp-block-jetpack-videopress--has-max-width', $rendered_block );
	}
}
