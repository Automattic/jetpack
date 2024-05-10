<?php
/**
 * Recommendations unit tests.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-recommendations.php';

/**
 * Class for testing the Jetpack_Currencies class.
 */
class WP_Test_Jetpack_Recommendations extends WP_UnitTestCase {

	public function test_videopress_is_not_recommended_if_module_enabled() {
		\Jetpack::update_active_modules( array( 'videopress' ) );
		$site_plan     = $this->get_free_plan_mock();
		$site_products = array();

		$this->assertFalse( Jetpack_Recommendations::should_recommend_videopress( $site_plan, $site_products ) );
	}

	public function test_videopress_is_not_recommended_if_plan_not_free() {
		$plans         = array(
			$this->get_security_plan_mock(),
			$this->get_complete_plan_mock(),
		);
		$site_products = array();

		foreach ( $plans as $site_plan ) {
			$this->assertFalse( Jetpack_Recommendations::should_recommend_videopress( $site_plan, $site_products ) );
		}
	}

	public function test_videopress_is_not_recommended_if_site_has_videopress_product() {
		$site_plan     = $this->get_free_plan_mock();
		$site_products = array( 'jetpack_videopress' );

		$this->assertFalse( Jetpack_Recommendations::should_recommend_videopress( $site_plan, $site_products ) );
	}

	public function test_videopress_is_not_recommended_if_site_has_videopress_monthly_product() {
		$site_plan     = $this->get_free_plan_mock();
		$site_products = array( 'jetpack_videopress_monthly' );

		$this->assertFalse( Jetpack_Recommendations::should_recommend_videopress( $site_plan, $site_products ) );
	}

	public function test_videopress_is_recommended_with_free_plan_and_no_products() {
		$site_plan     = $this->get_free_plan_mock();
		$site_products = array();

		$this->assertTrue( Jetpack_Recommendations::should_recommend_videopress( $site_plan, $site_products ) );
	}

	private function get_complete_plan_mock() {
		return array(
			'class' => 'complete',
		);
	}

	private function get_security_plan_mock() {
		return array(
			'class' => 'security',
		);
	}

	private function get_free_plan_mock() {
		return array(
			'class' => 'free',
		);
	}
}
