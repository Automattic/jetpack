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
	 * The tier comes from the theme, and a theme reporting none is premium as wpcomsh has always had it.
	 */
	public function test_reads_the_tier_from_a_theme() {
		$theme = (object) array( 'theme_tier' => (object) array( 'slug' => 'partner' ) );

		$this->assertSame( 'partner', WPCom_Themes_Tiers::tier_of( $theme ) );
		$this->assertSame( 'premium', WPCom_Themes_Tiers::tier_of( (object) array() ) );
	}

	/**
	 * Premium themes need the Personal plan, which is what a card offering the upgrade must say.
	 *
	 * The tier kept its name when it moved to Personal, so the two no longer match.
	 */
	public function test_the_plan_a_tier_needs() {
		$this->assertSame( 'personal-bundle', WPCom_Themes_Tiers::plan_for( 'premium' ) );
		$this->assertSame( 'business-bundle', WPCom_Themes_Tiers::plan_for( 'sensei' ) );
		$this->assertSame( 'business-bundle', WPCom_Themes_Tiers::plan_for( 'woocommerce' ) );
		$this->assertSame( '', WPCom_Themes_Tiers::plan_for( 'free' ) );
	}

	/**
	 * The capability name follows the tier slug, which is the convention wpcomsh relies on.
	 */
	public function test_capability_name_follows_the_tier() {
		$this->assertSame( 'premium-themes', WPCom_Themes_Tiers::feature_for( 'premium' ) );
		$this->assertSame( 'partner-themes', WPCom_Themes_Tiers::feature_for( 'partner' ) );
	}
}
