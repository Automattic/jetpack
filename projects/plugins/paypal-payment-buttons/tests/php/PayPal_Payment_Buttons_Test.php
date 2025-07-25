<?php
/**
 * Main plugin file testing.
 *
 * @package automattic/paypal-payment-buttons
 */

use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Main plugin file testing.
 */
class PayPal_Payment_Buttons_Test extends BaseTestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * The PayPal Payment Buttons object.
	 *
	 * @var \PayPal_Payment_Buttons
	 */
	public $paypal_plugin;

	/**
	 * Initialize tests
	 */
	public function set_up() {
		$this->paypal_plugin = new PayPal_Payment_Buttons();
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tear_down() {
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		unset( $_SERVER['REQUEST_METHOD'] );
		$_GET = array();
	}

	/**
	 * Creates a mock user and logs in
	 */
	public function create_user_and_login() {
		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );
	}

	/**
	 * Triggers the actions to mimic activating the plugin.
	 *
	 * @param string $plugin The plugin slug to activate.
	 */
	public function activate_plugin( $plugin ) {
		do_action( 'activate_' . $plugin );
	}

	/**
	 * Tests PayPal Payment Buttons construction.
	 *
	 * The only meaningful/testable thing is to check if My_Jetpack is initialized
	 */
	public function test_my_jetpack_initialized_once() {

		new PayPal_Payment_Buttons();
		$this->assertSame( 1, did_action( ( 'my_jetpack_init' ) ) );

		// Check that `my_jetpack_init` is only triggered once.
		new PayPal_Payment_Buttons();
		$this->assertSame( 1, did_action( ( 'my_jetpack_init' ) ) );
	}
}
