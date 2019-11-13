<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\Capabilities;
use phpmock\functions\FunctionProvider;

class Test_Jetpack_Capabilities extends \WP_UnitTestCase {
	var $builder;
	var $current_product_slug;

	public function setUp() {
		$this->builder = new Capabilities\Builder();
		$this->setUserRole( 'editor' );
	}

	public function tearDown() {
		\Mockery::close();
	}

	public function test_get_capability() {

		$capability = $this->builder
			->create_capability( 'jetpack.backup.restore' )
			->require_wp_role( 'administrator' )
			->require_wp_capability( 'administrator' )
			->get_capability();

		// no admin privilege
		$this->assertFalse( $capability->check()->granted() );

		$this->setUserRole( 'administrator' );

		// has admin privilege
		$this->assertTrue( $capability->check()->granted() );
	}

	public function test_capability_has_details() {
		$capability = $this->builder
			->create_capability( 'jetpack.backup.restore' )
			->require_wp_role( 'administrator' )
			->require_wp_capability( 'administrator' )
			->get_capability();

		// response should have a "granted" method
		$this->assertFalse( $capability->check()->granted() );
	}

	public function test_jetpack_plan_rule() {
		$capability = $this->builder
			->create_capability( 'jetpack.backup.restore' )
			->require_minimum_jetpack_plan( 'a_nice_plan' )
			->get_capability();

		// expected plan
		$this->mockJetpackPlan( 'a_nice_plan' );

		$this->assertTrue( $capability->check()->granted() );

		// unexpected plan
		$this->mockJetpackPlan( 'some_other_plan' );

		$this->assertFalse( $capability->check()->granted() );
	}

	/**
	 * Utility functions
	 */
	private function setUserRole( $role ) {
		$user = wp_get_current_user(); // new \WP_User( $user_id );
		$user->set_role( $role );
	}

	private function mockJetpackPlan( $product_slug ) {
		$this->current_product_slug = $product_slug;

		$mockPlan = \Mockery::mock('alias:Jetpack_Plan');

		// mock the static method Jetpack_Plan::get and return the instance prop
		$mockPlan
			->shouldReceive('get')
			->andReturnUsing( function() {
				return [ 'product_slug' => $this->current_product_slug ];
			} );
	}
}
