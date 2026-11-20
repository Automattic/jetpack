<?php
/**
 * WPCOM Features Test file.
 *
 * @package wpcomsh
 */

/**
 * Class WpcomFeaturesTest.
 */
class WpcomFeaturesTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Smoke-testing WPCOM Features.
	 *
	 * Pretty much just ensures there are no fatal errors, which is all we're interested in when syncing
	 * WPCOM_Features from wpcom with updates that are not used in wpcomsh.
	 */
	public function test_no_fatal_errors() {
		$this->assertTrue( wpcom_site_has_feature( WPCOM_Features::FREE_BLOG ) );

		$this->assertFalse( wpcom_site_has_feature( WPCOM_Features::PREMIUM_THEMES ) );
		$this->assertFalse( WPCOM_Features::has_feature( WPCOM_Features::PREMIUM_THEMES, array(), true ) );
	}

	/**
	 * Tests that purchases unlock features.
	 */
	public function test_works_with_persistent_data() {
		$purchase = array( 'product_slug' => 'business-bundle' );
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $purchase ), JSON_UNESCAPED_SLASHES ) );

		$this->assertTrue( wpcom_site_has_feature( WPCOM_Features::CONCIERGE_BUSINESS ) );
		$this->assertFalse( wpcom_site_has_feature( WPCOM_Features::ECOMMERCE_MANAGED_PLUGINS ) );

		// Cleanup.
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );
	}

	/**
	 * Tests that the wordads-free-access sticker grants WordAds without a qualifying plan.
	 */
	public function test_wordads_free_access_sticker_grants_wordads() {
		$this->assertFalse( wpcom_site_has_feature( WPCOM_Features::WORDADS ) );
		$this->assertFalse( wpcom_site_has_feature( WPCOM_Features::WORDADS_JETPACK ) );

		Atomic_Persistent_Data::set( 'site_sticker_wordads-free-access', '1' );

		$this->assertTrue( wpcom_site_has_feature( WPCOM_Features::WORDADS ) );
		$this->assertTrue( wpcom_site_has_feature( WPCOM_Features::WORDADS_JETPACK ) );

		// The sticker must not grant anything else.
		$this->assertFalse( wpcom_site_has_feature( WPCOM_Features::PREMIUM_THEMES ) );

		// Cleanup.
		Atomic_Persistent_Data::delete( 'site_sticker_wordads-free-access' );

		$this->assertFalse( wpcom_site_has_feature( WPCOM_Features::WORDADS ) );
	}
}
