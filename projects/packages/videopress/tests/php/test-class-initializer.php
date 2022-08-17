<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\VideoPress\Initializer methods
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Initializer test suite.
 */
class InitializerTest extends TestCase {

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		parent::setUp();
		Monkey\setUp();
		$plugin_dir = dirname( dirname( dirname( dirname( __DIR__ ) ) ) ) . '/';

		Functions\stubs(
			array(
				'wp_parse_url'       => 'parse_url',
				'plugins_url'        => function ( $path, $plugin_path ) use ( $plugin_dir ) {
					$plugin_path = dirname( $plugin_path );
					$this->stringStartsWith( $plugin_dir, $plugin_path );
					return 'http://www.example.com/wp-content/plugins/jetpack/' . substr( $plugin_path, strlen( $plugin_dir ) ) . '/' . $path;
				},
				'wp_localize_script' => function () {},
				'admin_url'          => function () {},
				'wp_enqueue_script'  => function () {},
			)
		);
	}

	/**
	 * Run after every test.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
		parent::tearDown();
	}

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
