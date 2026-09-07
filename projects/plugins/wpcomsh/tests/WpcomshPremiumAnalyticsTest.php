<?php
/**
 * Premium Analytics enablement test file.
 *
 * @package wpcomsh
 */

/**
 * Covers the `jetpack_premium_analytics_enabled` filter wpcomsh registers for Atomic sites.
 */
class WpcomshPremiumAnalyticsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Persistent-data key the Atomic platform writes when the blog sticker is added.
	 *
	 * @var string
	 */
	const STICKER_KEY = 'site_sticker_jetpack-premium-analytics';

	/**
	 * Clear the sticker these tests write.
	 *
	 * A leaked sticker is the dangerous direction: it would turn the denial assertions below into
	 * confusing passes, here and anywhere else in the suite that reads a sticker.
	 */
	public function tear_down() {
		Atomic_Persistent_Data::delete( self::STICKER_KEY );

		parent::tear_down();
	}

	/**
	 * Without the sticker the site keeps the existing Stats UI.
	 */
	public function test_disabled_without_the_sticker() {
		$this->assertFalse( apply_filters( 'jetpack_premium_analytics_enabled', false ) );
	}

	/**
	 * The sticker alone turns it on.
	 */
	public function test_enabled_by_the_sticker() {
		Atomic_Persistent_Data::set( self::STICKER_KEY, '1' );

		$this->assertTrue( apply_filters( 'jetpack_premium_analytics_enabled', false ) );
	}

	/**
	 * Removing the sticker turns it off again.
	 */
	public function test_removing_the_sticker_disables_it_again() {
		Atomic_Persistent_Data::set( self::STICKER_KEY, '1' );
		$this->assertTrue( apply_filters( 'jetpack_premium_analytics_enabled', false ) );

		Atomic_Persistent_Data::delete( self::STICKER_KEY );
		$this->assertFalse( apply_filters( 'jetpack_premium_analytics_enabled', false ) );
	}

	/**
	 * An incoming true is never downgraded.
	 *
	 * No sticker is set here, so the true can only survive by being preserved.
	 */
	public function test_preserves_an_incoming_true() {
		$this->assertTrue( apply_filters( 'jetpack_premium_analytics_enabled', true ) );
	}
}
