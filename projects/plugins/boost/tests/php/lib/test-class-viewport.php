<?php //phpcs:ignoreFile WordPress.Files.FileName.InvalidClassFileName,Squiz.Commenting.FunctionComment.Missing
/**
 * Test viewport
 *
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use Automattic\Jetpack_Boost\Lib\Viewport;
use Automattic\Jetpack_Boost\Tests\Base_Test_Case;

/**
 * Class WP_Test_Viewport
 *
 * @package Automattic\Jetpack_Boost\Tests\Lib
 */
class WP_Test_Viewport extends Base_Test_Case {
	/**
	 * @before
	 */
	protected function set_up() {
		Filters\expectApplied( 'jetpack_boost_critical_css_viewport_sizes' )
			->with( array() )
			->andReturn(
				array(
					array(
						'width'  => 640,
						'height' => 480,
					),
					array(
						'width'  => 1200,
						'height' => 800,
					),
					array(
						'width'  => 1600,
						'height' => 1050,
					),
				)
			);

		Filters\expectApplied( 'jetpack_boost_critical_css_default_viewports' )
			->with( array() )
			->andReturn(
				array(
					array(
						'device_type' => 'mobile',
						'viewport_id' => 0,
					),
					array(
						'device_type' => 'desktop',
						'viewport_id' => 2,
					),
				)
			);
	}

	public function test_run() {
		Functions\when( 'is_admin' )->justReturn( false );

		Viewport::init();

		$this->assertTrue( !! has_action( 'wp_footer', array( 'Automattic\Jetpack_Boost\Lib\Viewport', 'viewport_tracker' ) ) );
	}

	public function test_get_max_viewport() {
		$sizes = array(
			array(
				'width'  => 800,
				'height' => 600,
			),
			array(
				'width'  => 1024,
				'height' => 768,
			),
			array(
				'width'  => 1980,
				'height' => 1080,
			),
		);

		$max_size = Viewport::get_max_viewport( $sizes );

		$this->assertEquals( $sizes[2]['width'], $max_size['width'] );
		$this->assertEquals( $sizes[2]['height'], $max_size['height'] );
	}

	public function test_pick_viewport() {
		$best_size = Viewport::pick_viewport( 400, 600 );

		$this->assertEquals( 640, $best_size['width'] );
		$this->assertEquals( 480, $best_size['height'] );
	}

	public function test_get_default_viewport_size_for_device() {

		$viewport = Viewport::get_default_viewport_size_for_device( 'mobile' );

		$this->assertEquals( 640, $viewport['width'] );
		$this->assertEquals( 480, $viewport['height'] );
	}

	public function test_if_get_default_viewport_size_for_device_defaults_to_desktop_sizes() {
		$viewport = Viewport::get_default_viewport_size_for_device( 'foobar' );

		$this->assertEquals( 1600, $viewport['width'] );
		$this->assertEquals( 1050, $viewport['height'] );
	}
}
