<?php
/**
 * Class WP_Test_Jetpack_Subscribe_Modal
 *
 * @package automattic/jetpack
 */

/**
 * Class WP_Test_Jetpack_Subscribe_Modal
 * Tests the Jetpack_Subscribe_Modal class.
 *
 * To run: jetpack docker phpunit -- --filter=jetpack_subscribe_modal
 */
class WP_Test_Jetpack_Subscribe_Modal extends WP_UnitTestCase {
	/**
	 * The tested instance.
	 *
	 * @var Jetpack_Subscribe_Modal
	 */
	public $instance;

	/**
	 * Sets up each test.
	 *
	 * @inheritDoc
	 */
	public function set_up() {
		parent::set_up();
		add_filter( 'jetpack_is_connection_ready', '__return_true' );
		require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions/subscribe-modal/class-jetpack-subscribe-modal.php';
	}

	/**
	 * Tears up each test.
	 *
	 * @inheritDoc
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_is_connection_ready' );

		// FEATURE FLAG:
		// Reapply feature flag. This should be removed when feature flag is removed.
		add_filter( 'jetpack_subscriptions_modal_enabled', '__return_false', 11 );
		parent::tear_down();
	}

	/**
	 * Test that jetpack_subscriptions_modal_enabled is set correctly,
	 * and thus that Jetpack Subscribe Modal loads, as expected.
	 *
	 * Removed tests around sm_enabled since we no longer use that option
	 * to set should_load_subscriber_modal() or the filter.
	 *
	 * This includes test of our defacto feature flag - we are setting
	 * jetpack_subscriptions_modal_enabled to false, which should prevent
	 * the modal from loading even if all conditions are met.
	 *
	 * #1 feature flag -> jetpack_subscriptions_modal_enabled false by default
	 *                    AND even if all normal conditions are met.
	 * #2 site_intent === newsletter (in this case, not relevant if theme is lettre or not)
	 * #3 block theme is active
	 */
	public function test_subscriber_modal_enabled_under_correct_conditions() {
		// Test that the modal is not enabled by default.
		$this->assertFalse( apply_filters( 'jetpack_subscriptions_modal_enabled', false ) );

		// FEATURE FLAG:
		// This is a test for the feature flag.
		// Test that modal will no load even if all normal conditions are met.
		// We are irectly setting jetpack_subscriptions_modal_enabled
		// to false as a feature flag. This test should change upon full release.
		switch_theme( 'block-theme' );
		update_option( 'site_intent', 'newsletter' );
		$this->assertFalse( apply_filters( 'jetpack_subscriptions_modal_enabled', false ) );

		// Test modal is enabled with feature flag removed, all conditions met.
		remove_filter( 'jetpack_subscriptions_modal_enabled', '__return_false', 11 );
		$this->assertTrue( apply_filters( 'jetpack_subscriptions_modal_enabled', false ) );

		// Test that modal is disabled if site_intent !== newsletter
		update_option( 'site_intent', 'write' );
		$this->assertFalse( apply_filters( 'jetpack_subscriptions_modal_enabled', false ) );

		// Test that modal is disabled if no block theme
		update_option( 'site_intent', 'newsletter' );
		switch_theme( 'default' );
		$this->assertFalse( apply_filters( 'jetpack_subscriptions_modal_enabled', false ) );
	}

}
