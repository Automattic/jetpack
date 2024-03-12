<?php
/**
 * Main plugin file testing.
 *
 * @package automattic/automattic-for-agencies-client
 */

use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Main plugin file testing.
 */
class Automattic_For_Agencies_Client_Test extends BaseTestCase {
	/**
	 * The Plugin object.
	 *
	 * @var Automattic_For_Agencies_Client
	 */
	private $plugin;

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Initialize tests
	 */
	public function set_up() {
		$this->plugin = new Automattic_For_Agencies_Client();
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
}
