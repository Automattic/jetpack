<?php

namespace Automattic\Jetpack_Boost\Tests;

use Automattic\Jetpack_Boost\Lib\My_Jetpack;
use Brain\Monkey\Functions;

class My_Jetpack_Test extends Base_TestCase {
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

	public function test_is_correct_features_count() {
		$total_features = 11;
		$this->assertCount( $total_features, $this->product['features_by_tier'], 'Expected ' . $total_features . ' features, got ' . count( $this->product['features_by_tier'] ) );
	}

	public function test_all_features_have_required_keys() {
		foreach ( $this->product['features_by_tier'] as $feature ) {
			$this->checkForRequiredKeys( $feature );
		}
	}

	/**
	 * Checks that a feature has the required keys
	 * for rendering the UI.
	 *
	 * @param array $feature The feature to check.
	 */
	private function checkForRequiredKeys( $feature ) {
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
