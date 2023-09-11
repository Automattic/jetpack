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
		remove_all_filters( 'jetpack_subscriptions_modal_enabled' );
		parent::tear_down();
	}

	/**
	 * Test that the Jetpack Subscribe Modal does not load by default.
	 * We are removing a feature flag, but adding a check to load this
	 * feature only on WordPress.com sites.
	 */
	public function test_subscriber_modal_enabled_under_correct_conditions() {
		// Test that the modal is not enabled by default.
		$this->assertFalse( apply_filters( 'jetpack_subscriptions_modal_enabled', false ) );

		// Test that the modal is not enabled even when
		// other needed conditions are met.
		switch_theme( 'block-theme' );
		update_option( 'site_intent', 'newsletter' );
		$this->assertFalse( apply_filters( 'jetpack_subscriptions_modal_enabled', false ) );

		// Test that feature can be enabled by manually adding
		// feature flag filter.
		add_filter( 'jetpack_subscriptions_modal_enabled', '__return_true', 11 );
		$this->assertTrue( apply_filters( 'jetpack_subscriptions_modal_enabled', false ) );
	}

}
