<?php

namespace Automattic\Jetpack_Boost\Tests;

use Automattic\Jetpack_Boost\Lib\My_Jetpack;
use Brain\Monkey\Functions;

class My_Jetpack_Test extends Base_Test_Case {
	private $product;

	protected function set_up() {
		parent::set_up();

		// Set up the __ function mock once for all tests
		Functions\when( '__' )->returnArg();

		$this->product = My_Jetpack::get_product();
	}

	public function test_is_correct_tiers() {
		$expected = array(
			'upgraded',
			'free',
		);

		$actual = $this->product['tiers'];
		$this->assertEquals( $expected, $actual );
	}

	public function test_is_correct_features_by_tier_auto_css_optimization() {
		$this->assertHasRequiredKeys( $this->product['features_by_tier'][0] );
	}

	public function test_is_correct_features_by_tier_auto_image_size_analysis() {
		$this->assertHasRequiredKeys( $this->product['features_by_tier'][1] );
	}

	public function test_is_correct_features_by_tier_historical_performance_scores() {
		$this->assertHasRequiredKeys( $this->product['features_by_tier'][2] );
	}

	public function test_is_correct_features_by_tier_dedicated_email_support() {
		$this->assertHasRequiredKeys( $this->product['features_by_tier'][3] );
	}

	public function test_is_correct_features_by_tier_page_cache() {
		$this->assertHasRequiredKeys( $this->product['features_by_tier'][4] );
	}

	public function test_is_correct_features_by_tier_image_cdn_quality_settings() {
		$this->assertHasRequiredKeys( $this->product['features_by_tier'][5] );
	}

	public function test_is_correct_features_by_tier_image_cdn_auto_resize_lazy_images() {
		$this->assertHasRequiredKeys( $this->product['features_by_tier'][6] );
	}

	public function test_is_correct_features_by_tier_image_cdn() {
		$this->assertHasRequiredKeys( $this->product['features_by_tier'][7] );
	}

	public function test_is_correct_features_by_tier_image_guide() {
		$this->assertHasRequiredKeys( $this->product['features_by_tier'][8] );
	}

	public function test_is_correct_features_by_tier_defer_non_essential_javascript() {
		$this->assertHasRequiredKeys( $this->product['features_by_tier'][9] );
	}

	public function test_is_correct_features_by_tier_concatenate_js_and_css() {
		$this->assertHasRequiredKeys( $this->product['features_by_tier'][10] );
	}

	/**
	 * Assert that the feature has the keys required to render the UI.
	 *
	 * @param array $feature The feature to assert.
	 */
	private function assertHasRequiredKeys( $feature ) {
		$this->assertIsArray( $feature );
		$this->assertIsString( $feature['name'] );
		$this->assertIsArray( $feature['info'] );
		$this->assertIsString( $feature['info']['content'] );
		$this->assertIsArray( $feature['tiers'] );
		$this->assertIsArray( $feature['tiers']['free'] );
		$this->assertIsBool( $feature['tiers']['free']['included'] );
		$this->assertIsArray( $feature['tiers']['upgraded'] );
		$this->assertIsBool( $feature['tiers']['upgraded']['included'] );
	}
}
