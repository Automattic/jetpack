<?php
/**
 * Plan Notices Test file.
 *
 * @package wpcomsh
 */

/**
 * Class PlanNoticesTest.
 */
class PlanNoticesTest extends WP_UnitTestCase {
	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
	}

	/**
	 * Test without data.
	 */
	public function test_no_data_plan_notices() {
		ob_start();
		$result = wpcomsh_plan_notices();
		ob_get_clean();

		$this->assertEmpty( $result );
	}

	/**
	 * Test with data set.
	 */
	public function test_plan_notices() {
		$business_plan_purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->add( new DateInterval( 'P7D' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ) ) );

		$plan_date = gmdate( 'F j, Y', time() + WEEK_IN_SECONDS );

		ob_start();
		wpcomsh_plan_notices();
		$string = ob_get_clean();

		$this->assertStringContainsString( 'expires on ' . $plan_date, $string );

		// Cleanup.
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );
	}
}
