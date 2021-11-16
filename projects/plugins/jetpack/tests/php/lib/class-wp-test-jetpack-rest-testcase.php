<?php

// This is WP_Test_REST_Controller_Testcase without the unneeded abstract methods.
require_once __DIR__ . '/class-wp-test-spy-rest-server.php';

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once dirname( dirname( dirname( __DIR__ ) ) ) . '/core/includes/testcase-rest-api.php';
}

abstract class WP_Test_Jetpack_REST_Testcase extends WP_Test_REST_TestCase {
	protected $server;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$this->server = $wp_rest_server = new WP_Test_Spy_REST_Server;
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
