<?php
/**
 * Tests for reading a theme's tier and the capability gating it.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Class Wpcom_Themes_Tiers_Test
 */
class Wpcom_Themes_Tiers_Test extends \WorDBless\BaseTestCase {

	/**
	 * The tier comes from the theme's own taxonomy.
	 */
	public function test_reads_the_tier_from_a_theme() {
		$theme = (object) array( 'theme_tier' => (object) array( 'slug' => 'partner' ) );

		$this->assertSame( 'partner', WPCom_Themes_Tiers::tier_of( $theme ) );
	}

	/**
	 * A theme reporting no tier is treated as premium, as wpcomsh has always done.
	 */
	public function test_a_theme_without_a_tier_is_premium() {
		$this->assertSame( 'premium', WPCom_Themes_Tiers::tier_of( (object) array() ) );
	}

	/**
	 * The capability name follows the tier slug, which is the convention wpcomsh relies on.
	 */
	public function test_capability_name_follows_the_tier() {
		$this->assertSame( 'premium-themes', WPCom_Themes_Tiers::feature_for( 'premium' ) );
		$this->assertSame( 'partner-themes', WPCom_Themes_Tiers::feature_for( 'partner' ) );
	}

	/**
	 * Every site can use the free tier, whatever the platform reports.
	 *
	 * The tiers that do depend on a plan are covered in wpcomsh's suite, where
	 * wpcom_site_has_feature() is the platform's own rather than another test's stub.
	 */
	public function test_free_tier_needs_no_plan() {
		$this->assertTrue( WPCom_Themes_Tiers::site_can_use( 'free' ) );
	}
}
