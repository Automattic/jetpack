<?php

class PlanNoticesTest extends WP_UnitTestCase {
	public function setUp() {
		parent::setUp();

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
	}

	public function test_no_data_plan_notices() {
		$this->assertEmpty( wpcomsh_plan_notices() );
	}

	public function test_plan_notices() {
		Atomic_Persistent_Data::set( 'WPCOM_PLAN', Atomic_Plan_Manager::BUSINESS_PLAN_SLUG );
		Atomic_Persistent_Data::set( 'WPCOM_PLAN_EXPIRATION', time() + WEEK_IN_SECONDS );

		$plan_date = date( 'F j, Y', time() + WEEK_IN_SECONDS );

		ob_start();
		wpcomsh_plan_notices();
		$string = ob_get_clean();

		$this->assertContains( 'expires on ' . $plan_date, $string );
	}
}
