<?php
/**
 * Plan Notices Test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DoesNotPerformAssertions;

/**
 * Class PlanNoticesTest.
 */
class PlanNoticesTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
	}

	/**
	 * Test without data doesn't throw or raise any warnings or errors.
	 *
	 * @doesNotPerformAssertions
	 */
	#[DoesNotPerformAssertions]
	public function test_no_data_plan_notices() {
		ob_start();
		wpcomsh_plan_notices();
		ob_get_clean();
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
