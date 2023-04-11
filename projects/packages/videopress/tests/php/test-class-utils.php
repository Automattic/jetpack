<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\VideoPress\Initializer methods
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Utils;
use WorDBless\BaseTestCase;

/**
 * Class UtilsTest
 */
class UtilsTest extends BaseTestCase {
	/**
	 * Test the get_video_press_url method.
	 */
	public function test_get_video_press_url() {
		$guid = '123abc';

		// Test with default attributes.
		$url = Utils::get_video_press_url( $guid );
		$this->assertStringContainsString( 'https://videopress.com/v/' . $guid, $url );

		// Test with custom attributes.
		$attributes = array(
			'autoplay'            => true,
			'controls'            => false,
			'loop'                => true,
			'muted'               => true,
			'playsinline'         => true,
			'poster'              => 'https://example.com/poster.jpg',
			'preload'             => 'none',
			'seekbarColor'        => 'red',
			'seekbarPlayedColor'  => 'green',
			'seekbarLoadingColor' => 'blue',
			'useAverageColor'     => false,
		);

		$url = Utils::get_video_press_url( $guid, $attributes );
		$this->assertStringContainsString( 'https://videopress.com/v/' . $guid, $url );
		$this->assertStringContainsString( 'autoPlay=1', $url );
		$this->assertStringContainsString( 'controls=0', $url );
		$this->assertStringContainsString( 'loop=1', $url );
		$this->assertStringContainsString( 'muted=1', $url );
		$this->assertStringContainsString( 'persistVolume=0', $url );
		$this->assertStringContainsString( 'playsinline=1', $url );
		$this->assertStringContainsString( 'posterUrl=https%3A%2F%2Fexample.com%2Fposter.jpg', $url );
		$this->assertStringContainsString( 'preloadContent=none', $url );
		$this->assertStringContainsString( 'sbc=red', $url );
		$this->assertStringContainsString( 'sbpc=green', $url );
		$this->assertStringContainsString( 'sblc=blue', $url );
		$this->assertStringContainsString( 'useAverageColor=0', $url );
	}

	/**
	 * Test the get_video_press_url method with custom attributes.
	 */
	public function test_get_video_press_url_with_provided_attributes() {
		$guid = '3Nq0kSMu';

		// Test with custom attributes.
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

		$url = Utils::get_video_press_url( $guid, $attributes );
		$this->assertStringContainsString( 'https://videopress.com/v/' . $guid, $url );
		$this->assertStringContainsString( 'resizeToParent=1', $url );
		$this->assertStringContainsString( 'cover=1', $url );
		$this->assertStringContainsString( 'autoPlay=0', $url );
		$this->assertStringContainsString( 'loop=0', $url );
		$this->assertStringContainsString( 'muted=1', $url );
		$this->assertStringContainsString( 'persistVolume=0', $url );
		$this->assertStringContainsString( 'playsinline=1', $url );
		$this->assertStringContainsString( 'posterUrl=http%3A%2F%2Flocalhost%2Fwp-content%2Fuploads%2F2023%2F03%2FcHJpdmF0ZS9sci9pbWFnZJMvd2Vic2l0ZS8yMDIyLTA1L25zMTEwODYtaW1hZ2Uta3d2eWRqaGYuanBn.jpg', $url );
		$this->assertStringContainsString( 'preloadContent=none', $url );
		$this->assertStringContainsString( 'sbc=' . $attributes['seekbarColor'], $url );
		$this->assertStringContainsString( 'sbpc=' . $attributes['seekbarPlayedColor'], $url );
		$this->assertStringContainsString( 'sblc=' . $attributes['seekbarLoadingColor'], $url );
		$this->assertStringContainsString( 'useAverageColor=0', $url );
	}

}
