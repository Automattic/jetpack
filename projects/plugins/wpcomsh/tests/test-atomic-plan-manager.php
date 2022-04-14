<?php
/**
 * Contains tests for the Atomic_Plan_Manager class
 *
 * @package wpcomsh
 */

/**
 * Tests the Atomic_Plan_Manager class
 */
class AtomicPlanManagerTest extends WP_UnitTestCase {
	/**
	 * Tear down after tests
	 */
	public function tearDown() {
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );
		remove_filter( 'wpcomsh_get_atomic_site_id', array( $this, 'atomic_site_id_after_cutoff' ) );

		parent::tearDown();
	}

	/**
	 * Forces the site ID to be after the cutoff for plan slug determination
	 */
	protected function set_atomic_site_id_after_cutoff() {
		add_filter( 'wpcomsh_get_atomic_site_id', array( $this, 'atomic_site_id_after_cutoff' ) );
	}

	/**
	 * Returns a site ID that is after the cutoff for plan slug determination
	 */
	public function atomic_site_id_after_cutoff() {
		return 150000000;
	}

	/**
	 * Pre cutoff defaults to Business plan
	 */
	public function test_current_plan_slug_before_cutoff() {
		$this->assertEquals( Atomic_Plan_Manager::BUSINESS_PLAN_SLUG, Atomic_Plan_Manager::current_plan_slug() );
	}

	/**
	 * Post cutoff defaults to Free
	 */
	public function test_current_plan_slug_after_cutoff() {
		$this->set_atomic_site_id_after_cutoff();
		$this->assertEquals( Atomic_Plan_Manager::FREE_PLAN_SLUG, Atomic_Plan_Manager::current_plan_slug() );
	}

	/**
	 * Post cutoff return correct WPCOM_PURCHASES
	 */
	public function test_current_plan_slug_after_cutoff_persistent_data() {
		$this->set_atomic_site_id_after_cutoff();
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( array( 'product_slug' => 'ecommerce-bundle-monthly' ) ) ) );

		$this->assertEquals( Atomic_Plan_Manager::ECOMMERCE_PLAN_SLUG, Atomic_Plan_Manager::current_plan_slug() );
	}

	/**
	 * Pre cutoff defaults to an Atomic-supported plan
	 */
	public function test_has_atomic_supported_plan_before_cutoff() {
		$this->assertTrue( Atomic_Plan_Manager::has_atomic_supported_plan() );
	}

	/**
	 * Post cutoff defaults to no Atomic-supported plan
	 */
	public function test_has_atomic_supported_plan_after_cutoff() {
		$this->set_atomic_site_id_after_cutoff();
		$this->assertFalse( Atomic_Plan_Manager::has_atomic_supported_plan() );
	}

	/**
	 * Post cutoff personal plan is not an Atomic-supported plan
	 */
	public function test_has_atomic_supported_plan_after_cutoff_personal_plan() {
		$this->set_atomic_site_id_after_cutoff();
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( array( 'product_slug' => 'personal-bundle-2y' ) ) ) );
		$this->assertFalse( Atomic_Plan_Manager::has_atomic_supported_plan() );
	}

	/**
	 * Post cutoff pro plan is an Atomic-supported plan
	 */
	public function test_has_atomic_supported_plan_after_cutoff_pro_plan() {
		$this->set_atomic_site_id_after_cutoff();
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( array( 'product_slug' => 'pro-plan' ) ) ) );
		$this->assertTrue( Atomic_Plan_Manager::has_atomic_supported_plan() );
	}

	/**
	 * Post cutoff business plan is an Atomic-supported plan
	 */
	public function test_has_atomic_supported_plan_after_cutoff_business_plan() {
		$this->set_atomic_site_id_after_cutoff();
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( array( 'product_slug' => 'business-bundle' ) ) ) );
		$this->assertTrue( Atomic_Plan_Manager::has_atomic_supported_plan() );
	}

	/**
	 * Post cutoff ecommerce plan is an Atomic-supported plan
	 */
	public function test_has_atomic_supported_plan_after_cutoff_ecommerce_plan() {
		$this->set_atomic_site_id_after_cutoff();
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( array( 'product_slug' => 'ecommerce-bundle-monthly' ) ) ) );
		$this->assertTrue( Atomic_Plan_Manager::has_atomic_supported_plan() );
	}
}
