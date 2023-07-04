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
		require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions/subscribe-modal/class-jetpack-subscribe-modal.php';
		$this->instance = Jetpack_Subscribe_Modal::init();
		add_filter( 'jetpack_is_connection_ready', '__return_true' );
	}

	/**
	 * Tears up each test.
	 *
	 * @inheritDoc
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_subscriptions_modal_enabled' );
		remove_all_filters( 'jetpack_is_connection_ready' );
		parent::tear_down();
	}

	public function return_false() {
		return false;
	}

	/**
	 * Test that subscribe modal is active under these conditions:
	 *
	 * #1 site_intent === newsletter (in this case, not relevant if theme is lettre or not)
	 * #2 sm_enabled === true
	 * #3 block theme is active
	 * #4 jetpack_subscriptions_modal_enabled === true
	 */
	public function test_subscriber_modal_enabled_under_correct_conditions() {
		// Test that the modal is not enabled by default.
		$this->assertFalse( $this->instance->should_enable_subscriber_modal() );

		// Set all conditions to allow modal, confirm modal is enabled.
		switch_theme( 'block-theme' );
		update_option( 'site_intent', 'newsletter' );
		update_option( 'sm_enabled', true );
		$this->assertTrue( $this->instance->should_enable_subscriber_modal() );

		// Test that modal is disabled if site_intent !== newsletter
		update_option( 'site_intent', 'write' );
		$this->assertFalse( $this->instance->should_enable_subscriber_modal() );

		// Test that modal is disabled if sm_enabled === false
		update_option( 'site_intent', 'newsletter' );
		update_option( 'sm_enabled', false );
		$this->assertFalse( $this->instance->should_enable_subscriber_modal() );

		// Test that modal is disabled if no block theme
		update_option( 'sm_enabled', true );
		switch_theme( 'default' );
		$this->assertFalse( $this->instance->should_enable_subscriber_modal() );

		// Test that modal is disabled if filter is false
		// This test is not passing - the filter is not working as expected.
		switch_theme( 'block-theme' );
		add_filter( 'jetpack_subscriptions_modal_enabled', '__return_false' );
		$this->assertFalse( $this->instance->should_enable_subscriber_modal() );
	}
}
