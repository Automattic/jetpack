<?php
/**
 * Feature Hook Test file.
 *
 * @package wpcomsh
 */

/**
 * Class FeatureHookTest.
 */
class FeatureHookTest extends WP_UnitTestCase {
	/**
	 * Tests that map_atomic_plan_cap returns the capabilities unchanged when the site has
	 * an atomic supported plan.
	 */
	public function test_wpcomsh_map_feature_cap_with_atomic_supported_plan() {
		// Give the site an atomic supported plan.
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', 'ecommerce-bundle' );

		$input_caps = array( 'edit_themes' );
		$theme_caps = wpcomsh_map_feature_cap( $input_caps, 'edit_themes' );
		$this->assertSame( $input_caps, $theme_caps );

		$input_caps  = array( 'activate_plugins' );
		$plugin_caps = wpcomsh_map_feature_cap( $input_caps, 'activate_plugins' );
		$this->assertSame( $input_caps, $plugin_caps );
	}

	/**
	 * Tests that map_atomic_plan_cap adds 'do_not_allow' to the returned capabilities when the site
	 * does not have a plan with those features.
	 */
	public function test_wpcomsh_map_feature_cap_without_the_required_features() {
		// Give the site no purchases.
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', 'personal-bundle' );

		$input_caps   = array( 'edit_themes' );
		$theme_caps   = wpcomsh_map_feature_cap( $input_caps, 'edit_themes' );
		$input_caps[] = 'do_not_allow';
		$this->assertSame( $input_caps, $theme_caps );

		$input_caps   = array( 'activate_plugins' );
		$plugin_caps  = wpcomsh_map_feature_cap( $input_caps, 'activate_plugins' );
		$input_caps[] = 'do_not_allow';
		$this->assertSame( $input_caps, $plugin_caps );
	}
}
