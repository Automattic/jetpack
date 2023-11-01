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
		parent::tear_down();
	}
}
