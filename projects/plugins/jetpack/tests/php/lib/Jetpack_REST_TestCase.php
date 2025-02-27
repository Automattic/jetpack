<?php
/**
 * @package automattic/jetpack
 */

// This is REST_Controller_Testcase without the unneeded abstract methods.
require_once __DIR__ . '/class-jptest-spy-rest-server.php';

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once dirname( __DIR__, 3 ) . '/core/includes/testcase-rest-api.php';
}

abstract class Jetpack_REST_TestCase extends WP_Test_REST_TestCase {
	protected $server;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$wp_rest_server = new JPTest_Spy_REST_Server();
		$this->server   = $wp_rest_server;
		do_action( 'rest_api_init' );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		parent::tear_down();

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$wp_rest_server = null;
	}
}
