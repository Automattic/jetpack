<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\Capabilities;
use phpmock\functions\FunctionProvider;

class Test_Jetpack_Capabilities_Base extends \WP_UnitTestCase {
	var $builder;
	var $current_product_slug;

	public function setUp() {
		\Automattic\Jetpack\Capabilities::clear();
		$this->builder = new Capabilities\Builder();
		$this->setUserRole( 'editor' );
	}

	public function tearDown() {
		\Mockery::close();
	}

	/**
	 * Utility functions
	 */
	protected function setUserRole( $role ) {
		$user = wp_get_current_user();
		$user->set_role( $role );
	}

	protected function addUserCapability( $cap ) {
		$user = wp_get_current_user();
		$user->add_cap( $cap );
	}
}

/**
 * Test registering and getting capabilities
 */
class Test_Jetpack_Capabilities_Global extends Test_Jetpack_Capabilities_Base {
	public function test_register_capability() {
		$cap = new Capabilities\Capability( 'foo' );
		\Automattic\Jetpack\Capabilities::register( $cap );

		$this->assertSame( $cap, \Automattic\Jetpack\Capabilities::get( 'foo' ) );
	}

	public function test_map_meta_cap_wraps_jetpack_capabilities() {
		// let's create a capability we don't comply with... yet
		$capability = $this->builder
			->create( 'jetpack.backup.restore' )
			->require_wp_role( 'administrator' )
			->register()->get();

		// quick assertion to make sure it's false
		$this->assertFalse( $capability->check()->granted() );

		// oh look! it's part of WP's caps now
		$this->assertFalse( current_user_can( 'jetpack.backup.restore' ) );

		// now let's comply
		$this->setUserRole( 'administrator' );

		// has admin privilege
		$this->assertTrue( current_user_can( 'jetpack.backup.restore' ) );
	}
}

class Test_Jetpack_Capabilities_Jetpack_Plan extends Test_Jetpack_Capabilities_Base {
	public function test_jetpack_plan_rule() {
		$capability = $this->builder
			->create( 'jetpack.backup.restore' )
			->require_minimum_jetpack_plan( 'a_nice_plan' )
			->get();

		// expected plan
		$this->mockJetpackPlan( 'a_nice_plan' );

		$this->assertTrue( $capability->check()->granted() );

		// unexpected plan
		$this->mockJetpackPlan( 'some_other_plan' );

		$this->assertFalse( $capability->check()->granted() );
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

class Test_Jetpack_Capabilities_WP_Role extends Test_Jetpack_Capabilities_Base {
	public function test_check_role() {
		$capability = $this->builder
			->create( 'jetpack.backup.restore' )
			->require_wp_role( 'administrator' )
			->get();

		// no admin privilege
		$this->assertFalse( $capability->check()->granted() );

		$this->setUserRole( 'administrator' );

		// has admin privilege
		$this->assertTrue( $capability->check()->granted() );
	}
}

class Test_Jetpack_Capabilities_WP_Capability extends Test_Jetpack_Capabilities_Base {
	public function test_check_capability() {
		$capability = $this->builder
			->create( 'jetpack.backup.restore' )
			->require_wp_capability( 'do_a_thing' )
			->get();

		// no admin privilege
		$this->assertFalse( $capability->check()->granted() );

		$this->addUserCapability( 'do_a_thing' );

		// has admin privilege
		$this->assertTrue( $capability->check()->granted() );
	}
}

class Test_Jetpack_Capabilities_Builder extends Test_Jetpack_Capabilities_Base {
	public function test_builder_registers_capability() {
		$capability = $this->builder
			->create( 'jetpack.test' )
			->register()
			->get();

		$this->assertSame( $capability, \Automattic\Jetpack\Capabilities::get( 'jetpack.test' ) );
	}
}