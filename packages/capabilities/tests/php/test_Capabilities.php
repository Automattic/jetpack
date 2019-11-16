<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\Capabilities;
use phpmock\Mock;
use phpmock\MockBuilder;

class Test_Jetpack_Capabilities_Base extends \WP_UnitTestCase {
	var $builder;
	var $current_product_slug;
	var $current_supports_slug;

	public function setUp() {
		\Automattic\Jetpack\Capabilities::clear();
		$this->builder = new Capabilities\Builder();
		$this->setUserRole( 'editor' );
	}

	public function tearDown() {
		Mock::disableAll();
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
	public function test_register_rule() {
		$rule = new Capabilities\AllRule();
		\Automattic\Jetpack\Capabilities::register( $rule, 'foo' );

		$this->assertSame( $rule, \Automattic\Jetpack\Capabilities::get( 'foo' ) );
	}

	public function test_map_meta_cap_wraps_jetpack_capabilities() {
		// let's create a capability we don't comply with... yet
		$capability = $this->builder
			->create()
			->require_wp_role( 'administrator' )
			->register( 'jetpack.backup.restore' )->get();

		// quick assertion to make sure it's false
		$this->assertFalse( $capability->check()->granted() );

		// oh look! it's part of WP's caps now
		$this->assertFalse( current_user_can( 'jetpack.backup.restore' ) );

		// now let's comply
		$this->setUserRole( 'administrator' );

		// has admin privilege
		$this->assertTrue( current_user_can( 'jetpack.backup.restore' ) );
	}

	public function test_build_capability_automatically_registers_it() {
		$cap = Capabilities::build( 'foo' )->require_wp_role( 'administrator' )->get();

		$this->assertSame( $cap, \Automattic\Jetpack\Capabilities::get( 'foo' ) );

		// quick assertion to make sure it's false
		$this->assertFalse( \Automattic\Jetpack\Capabilities::granted( 'foo' ) );

		// oh look! it's part of WP's caps now
		$this->assertFalse( current_user_can( 'foo' ) );

		// now let's comply
		$this->setUserRole( 'administrator' );

		// has admin privilege
		$this->assertTrue( current_user_can( 'foo' ) );
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

class Test_Jetpack_Capabilities_Jetpack_Plan_Supports extends Test_Jetpack_Capabilities_Base {
	public function test_jetpack_plan_supports_rule() {
		$capability = $this->builder
			->create( 'memberships' )
			->require_jetpack_plan_supports( 'recurring-payments' )
			->get();

		// expected supports
		$this->mockJetpackPlanSupports( 'recurring-payments' );

		$this->assertTrue( $capability->check()->granted() );

		// unexpected supports (clears previous value)
		$this->mockJetpackPlanSupports( 'not-recurring-payments' );

		$this->assertFalse( $capability->check()->granted() );
	}

	private function mockJetpackPlanSupports( $supports_slug ) {
		$this->current_supports_slug = $supports_slug;

		$mockPlan = \Mockery::mock('alias:Jetpack_Plan');

		// mock the static method Jetpack_Plan::supports and return the instance prop
		$mockPlan
			->shouldReceive('supports')
			->andReturnUsing( function( $slug ) {
				return $slug === $this->current_supports_slug;
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

class Test_Jetpack_Capabilities_WP_Filter extends Test_Jetpack_Capabilities_Base {
	public function test_check_filter() {
		$capability = $this->builder
			->create( 'jetpack.backup.restore' )
			->require_filter( 'my_filter', true )
			->get();

		// no admin privilege
		$this->assertFalse( $capability->check()->granted() );

		add_filter( 'my_filter', '__return_true' );

		// has admin privilege
		$this->assertTrue( $capability->check()->granted() );
	}
}

class Test_Jetpack_Capabilities_JetpackActiveRule extends Test_Jetpack_Capabilities_Base {
	public function test_check_jetpack_is_active() {
		$capability = $this->builder
			->create( 'foo.bar' )
			->require_jetpack_is_active()
			->get();

		$this->mockJetpackIsActive( false );

		// no admin privilege
		$this->assertFalse( $capability->check()->granted() );

		$this->mockJetpackIsActive( true );

		// has admin privilege
		$this->assertTrue( $capability->check()->granted() );
	}

	private function mockJetpackIsActive( $is_active ) {
		$this->current_is_active = $is_active;

		$mockPlan = \Mockery::mock('alias:Jetpack');

		// mock the static method Jetpack::supports and return the instance prop
		$mockPlan
			->shouldReceive('is_active')
			->andReturnUsing( function() {
				return $this->current_is_active;
			} );
	}
}

class Test_Jetpack_Capabilities_BlogStickersRule extends Test_Jetpack_Capabilities_Base {
	public function test_check_has_blog_sticker() {
		$capability = $this->builder
			->create( 'foo.bar' )
			->require_any_blog_sticker( [ 'expected_sticker' ] )
			->get();

		$current_blog_stickers = [ 'not_expected_sticker' ];

		// mock the has_blog_sticker function
		$builder = new MockBuilder();
		$builder->setNamespace( 'Automattic\Jetpack\Capabilities' )
			->setName( 'has_any_blog_stickers' )
			->setFunction( function( $stickers, $blog_id ) use ( &$current_blog_stickers ) {
				return ! empty( array_intersect( $stickers, $current_blog_stickers ) );
			} );
		$builder->build()->enable();

		// does not have sticker
		$this->assertFalse( $capability->check()->granted() );

		$current_blog_stickers[] = 'expected_sticker';

		// has sticker
		$this->assertTrue( $capability->check()->granted() );
	}
}

class Test_Jetpack_Capabilities_Builder extends Test_Jetpack_Capabilities_Base {
	public function test_builder_registers_capability() {
		$capability = $this->builder
			->create()
			->register( 'jetpack.test' )
			->get();

		$this->assertSame( $capability, \Automattic\Jetpack\Capabilities::get( 'jetpack.test' ) );

	}

	public function test_builder_supports_nesting_optional_rules() {
		$capability = $this->builder
			->create()
			->require_any( function( $builder ) {
				echo "Adding nested roles\n";
				$builder
					->require_wp_role( 'subscriber' )
					->require_wp_role( 'administrator' );
			} )
			->register( 'jetpack.test' )
			->get();

		$this->assertFalse( $capability->check()->granted() );

		$this->setUserRole( 'subscriber' );

		$this->assertTrue( $capability->check()->granted() );

		$this->setUserRole( 'administrator' );

		$this->assertTrue( $capability->check()->granted() );

		$this->setUserRole( 'guest' );

		$this->assertFalse( $capability->check()->granted() );
	}
}