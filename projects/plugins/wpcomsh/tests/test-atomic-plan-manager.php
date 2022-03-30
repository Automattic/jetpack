<?php

class AtomicPlanManagerTest extends WP_UnitTestCase {
	// Pre cutoff defaults to Business plan
	public function test_current_plan_slug_before_cutoff() {
		$this->assertEquals( Atomic_Plan_Manager::BUSINESS_PLAN_SLUG, Atomic_Plan_Manager::current_plan_slug() );
	}

	// Post cutoff defaults to Free
	public function test_current_plan_slug_after_cutoff() {
		add_filter(
			'wpcomsh_get_atomic_site_id',
			function() {
				return 150000000;
			}
		);
		$this->assertEquals( Atomic_Plan_Manager::FREE_PLAN_SLUG, Atomic_Plan_Manager::current_plan_slug() );
	}

	// Post cutoff return correct WPCOM_PLAN
	public function test_current_plan_slug_after_cutoff_persistent_data() {
		add_filter(
			'wpcomsh_get_atomic_site_id',
			function() {
				return 150000000;
			}
		);
		Atomic_Persistent_Data::set( 'WPCOM_PLAN', Atomic_Plan_Manager::ECOMMERCE_PLAN_SLUG );

		$this->assertEquals( Atomic_Plan_Manager::ECOMMERCE_PLAN_SLUG, Atomic_Plan_Manager::current_plan_slug() );
	}
}
