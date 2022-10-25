<?php
/**
 * Frontend Notices Test file.
 *
 * @package wpcomsh
 */

/**
 * Class FrontendNoticesTest.
 */
class FrontendNoticesTest extends WP_UnitTestCase {

	/**
	 * Test no purchase data available.
	 */
	public function test_no_purchases_data() {
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array() ) );
		$this->assertFalse( WPCOMSH_Frontend_Notices::should_display_expired_plan_notice() );
	}

	/**
	 * Test notice not show when plan is not expired.
	 */
	public function test_should_not_show_notice_when_plan_not_expired() {
		$business_plan_purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->add( new DateInterval( 'P7D' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ) ) );

		$this->assertFalse( WPCOMSH_Frontend_Notices::should_display_expired_plan_notice() );
	}

	/**
	 * Test notice not show when plan is expired for only 2 days.
	 */
	public function test_should_not_show_notice_when_plan_expired_2_days() {
		$business_plan_purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->sub( new DateInterval( 'P2D' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ) ) );

		$this->assertFalse( WPCOMSH_Frontend_Notices::should_display_expired_plan_notice() );
	}

	/**
	 * Test notice is show when plan is expired for 3 days.
	 */
	public function test_should_show_notice_when_plan_expired_3_days_logged_out() {
		$business_plan_purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->sub( new DateInterval( 'P3D' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ) ) );
		wp_set_current_user( 0 );
		$this->assertTrue( WPCOMSH_Frontend_Notices::should_display_expired_plan_notice() );
	}

	/**
	 * Test notice should not show when the user is logged in.
	 */
	public function test_should_show_notice_when_user_logged_in() {
		$business_plan_purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->sub( new DateInterval( 'P3D' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ) ) );
		// Logged out.
		wp_set_current_user( 0 );
		$this->assertTrue( WPCOMSH_Frontend_Notices::should_display_expired_plan_notice() );
		// Logged in.
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->assertTrue( WPCOMSH_Frontend_Notices::should_display_expired_plan_notice() );
	}

	/**
	 * Test notice should not show when locale is not english.
	 */
	public function test_should_not_show_notice_when_locale_not_en() {
		add_filter(
			'locale',
			function() {
				return 'fr_FR';
			}
		);
		$this->assertFalse( WPCOMSH_Frontend_Notices::should_display_expired_plan_notice() );
	}

	/**
	 * Test notice is show when plan is more than 6 days.
	 */
	public function test_should_show_notice_when_plan_expired_6_days() {
		$business_plan_purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->sub( new DateInterval( 'P6D' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $business_plan_purchase ) ) );

		$this->assertTrue( WPCOMSH_Frontend_Notices::should_display_expired_plan_notice() );
	}

}
