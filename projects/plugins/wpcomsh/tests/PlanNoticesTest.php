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
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ), JSON_UNESCAPED_SLASHES ) );

		$plan_date = gmdate( 'F j, Y', time() + WEEK_IN_SECONDS );

		ob_start();
		wpcomsh_plan_notices();
		$string = ob_get_clean();

		$this->assertStringContainsString( 'expires on ' . $plan_date, $string );

		// Cleanup.
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );
	}

	/**
	 * A site already on the replacement notices must not also get this one.
	 * The two describe the same expiry in different words, so running both is
	 * worse than running either.
	 */
	public function test_stands_down_for_sites_on_the_new_expiry_notices() {
		$business_plan_purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->add( new DateInterval( 'P7D' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ), JSON_UNESCAPED_SLASHES ) );

		add_filter( 'wpcom_expiry_notices_enabled', '__return_true' );

		ob_start();
		wpcomsh_plan_notices();
		$string = ob_get_clean();

		$this->assertSame( '', $string );

		// Cleanup.
		remove_filter( 'wpcom_expiry_notices_enabled', '__return_true' );
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );
	}

	/**
	 * ...and a site the rollout hasn't reached keeps getting it, so nobody is
	 * left with no expiry notice at all while the share ramps up.
	 */
	public function test_still_shows_for_sites_outside_the_rollout() {
		$business_plan_purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->add( new DateInterval( 'P7D' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ), JSON_UNESCAPED_SLASHES ) );

		add_filter( 'wpcom_expiry_notices_enabled', '__return_false' );

		ob_start();
		wpcomsh_plan_notices();
		$string = ob_get_clean();

		$this->assertStringContainsString( 'expires on ', $string );

		// Cleanup.
		remove_filter( 'wpcom_expiry_notices_enabled', '__return_false' );
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );
	}
}
