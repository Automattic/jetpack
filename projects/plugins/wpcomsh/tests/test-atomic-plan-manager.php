<?php

class AtomicPlanManagerTest extends WP_UnitTestCase {
	// Pre cutoff defaults to Business plan
	public function test_current_plan_slug_before_cutoff() {
		$this->assertEquals( Atomic_Plan_Manager::BUSINESS_PLAN_SLUG, Atomic_Plan_Manager::current_plan_slug() );
	}

	// Post cutoff defaults to Free
	public function test_current_plan_slug_after_cutoff() {
		add_filter( 'wpcomsh_get_atomic_site_id', function() { return 150000000; } );
		$this->assertEquals( Atomic_Plan_Manager::FREE_PLAN_SLUG, Atomic_Plan_Manager::current_plan_slug() );
	}

	// Post cutoff return correct WPCOM_PLAN
	public function test_current_plan_slug_after_cutoff_persistent_data() {
		add_filter( 'wpcomsh_get_atomic_site_id', function() { return 150000000; } );
		Atomic_Persistent_Data::set( 'WPCOM_PLAN', Atomic_Plan_Manager::ECOMMERCE_PLAN_SLUG );

		$this->assertEquals( Atomic_Plan_Manager::ECOMMERCE_PLAN_SLUG, Atomic_Plan_Manager::current_plan_slug() );
	}

	/**
	 * Tests that map_atomic_plan_cap returns the capabilities unchanged when the site has
	 * an atomic supported plan.
	 */
	public function test_map_atomic_plan_cap_with_atomic_supported_plan() {
		// Give the site an atomic supported plan.
		add_filter( 'wpcomsh_get_atomic_site_id', function() { return 150000000; } );
		Atomic_Persistent_Data::set( 'WPCOM_PLAN', Atomic_Plan_Manager::ECOMMERCE_PLAN_SLUG );

		add_filter( 'wpcomsh_get_atomic_client_id', function() { return '2'; } );

		$input_caps = array( 'edit_themes' );
		$theme_caps = Atomic_Plan_Manager::init()->map_atomic_plan_cap( $input_caps, 'edit_themes' );
		$this->assertSame( $input_caps, $theme_caps );

		$input_caps = array( 'activate_plugins' );
		$plugin_caps = Atomic_Plan_Manager::init()->map_atomic_plan_cap( $input_caps, 'activate_plugins' );
		$this->assertSame( $input_caps, $plugin_caps );
	}

	/**
	 * Tests that map_atomic_plan_cap returns the capabilities unchanged when the site does not have an
	 * atomic supported plan and the client id is not 2.
	 */
	public function test_map_atomic_plan_cap_with_client_id_not_2() {
		// Give the site a free plan.
		add_filter( 'wpcomsh_get_atomic_site_id', function() { return 150000000; } );
		Atomic_Persistent_Data::set( 'WPCOM_PLAN', Atomic_Plan_Manager::FREE_PLAN_SLUG );

		add_filter( 'wpcomsh_get_atomic_client_id', function() { return '1'; } );

		$input_caps = array( 'edit_themes' );
		$theme_caps = Atomic_Plan_Manager::init()->map_atomic_plan_cap( $input_caps, 'edit_themes' );
		$this->assertSame( $input_caps, $theme_caps );

		$input_caps = array( 'activate_plugins' );
		$plugin_caps = Atomic_Plan_Manager::init()->map_atomic_plan_cap( $input_caps, 'activate_plugins' );
		$this->assertSame( $input_caps, $plugin_caps );
	}

	/**
	 * Tests that map_atomic_plan_cap adds 'do_not_allow' to the returned capabilities when the site
	 * does not have an atomic supported plan and the client id is 2.
	 */
	public function test_map_atomic_plan_cap_with_client_id_2() {
		// Give the site a free plan.
		add_filter( 'wpcomsh_get_atomic_site_id', function() { return 150000000; } );
		Atomic_Persistent_Data::set( 'WPCOM_PLAN', Atomic_Plan_Manager::FREE_PLAN_SLUG );

		add_filter( 'wpcomsh_get_atomic_client_id', function() { return '2'; } );

		$input_caps = array( 'edit_themes' );
		$theme_caps = Atomic_Plan_Manager::init()->map_atomic_plan_cap( $input_caps, 'edit_themes' );
		$input_caps[] = 'do_not_allow';
		$this->assertSame( $input_caps, $theme_caps );

		$input_caps = array( 'activate_plugins' );
		$plugin_caps = Atomic_Plan_Manager::init()->map_atomic_plan_cap( $input_caps, 'activate_plugins' );
		$input_caps[] = 'do_not_allow';
		$this->assertSame( $input_caps, $plugin_caps );
	}


}
