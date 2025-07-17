<?php
/**
 * Test Image Size Analysis Deprecation Filter
 *
 * @package Automattic\Jetpack_Boost\Tests
 */

namespace Automattic\Jetpack_Boost\Tests;

use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Image_Size_Analysis;
use WorDBless\BaseTestCase;

/**
 * Test class for Image Size Analysis deprecation functionality.
 */
class Image_Size_Analysis_Deprecation_Test extends BaseTestCase {

	/**
	 * Test that the UI is hidden by default.
	 */
	public function test_ui_hidden_by_default() {
		$this->assertFalse( Image_Size_Analysis::should_display_ui() );
	}

	/**
	 * Test that the filter can enable the UI.
	 */
	public function test_filter_can_enable_ui() {
		add_filter( 'jetpack_boost_image_size_analysis_display_ui', '__return_true' );
		$this->assertTrue( Image_Size_Analysis::should_display_ui() );
		remove_filter( 'jetpack_boost_image_size_analysis_display_ui', '__return_true' );
	}

	/**
	 * Test that the filter can disable the UI.
	 */
	public function test_filter_can_disable_ui() {
		add_filter( 'jetpack_boost_image_size_analysis_display_ui', '__return_false' );
		$this->assertFalse( Image_Size_Analysis::should_display_ui() );
		remove_filter( 'jetpack_boost_image_size_analysis_display_ui', '__return_false' );
	}
}
