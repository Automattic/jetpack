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

		// The replacement notices in jetpack-mu-wpcom are on by default and
		// this one stands down for them; hold the site back so it has
		// something to render.
		add_filter( 'wpcom_expiry_notices_enabled', '__return_false' );
	}

	public function tearDown(): void {
		remove_filter( 'wpcom_expiry_notices_enabled', '__return_false' );
		parent::tearDown();
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
	 * Test with an expired plan.
	 */
	public function test_plan_notices_expired() {
		$business_plan_purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->sub( new DateInterval( 'P1D' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ), JSON_UNESCAPED_SLASHES ) );

		ob_start();
		wpcomsh_plan_notices();
		$string = ob_get_clean();

		$this->assertStringContainsString( 'The Business plan for', $string );
		$this->assertStringContainsString( 'expired on', $string );

		// Cleanup.
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );
	}

	/**
	 * Test that non-editors see nothing.
	 */
	public function test_plan_notices_hidden_from_subscribers() {
		wp_set_current_user( $this->factory->user->create( array( 'role' => 'subscriber' ) ) );
		$business_plan_purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->sub( new DateInterval( 'P1D' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ), JSON_UNESCAPED_SLASHES ) );

		ob_start();
		wpcomsh_plan_notices();
		$string = ob_get_clean();

		$this->assertSame( '', $string );

		// Cleanup.
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );
	}

	/**
	 * A site on the replacement notices must not also get this one: the two
	 * describe the same expiry in different words, so running both is worse
	 * than running either.
	 */
	public function test_stands_down_for_sites_on_the_new_expiry_notices() {
		$business_plan_purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->add( new DateInterval( 'P7D' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ), JSON_UNESCAPED_SLASHES ) );

		remove_filter( 'wpcom_expiry_notices_enabled', '__return_false' );

		ob_start();
		wpcomsh_plan_notices();
		$string = ob_get_clean();

		$this->assertSame( '', $string );

		// Cleanup.
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );
	}
}
