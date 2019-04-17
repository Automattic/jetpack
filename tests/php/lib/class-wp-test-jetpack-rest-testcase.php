<?php

// This is WP_Test_REST_Controller_Testcase without the unneeded abstract methods.
require_once dirname( __FILE__ ) . '/class-wp-test-spy-rest-server.php';

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once dirname( __FILE__, 4 ) . '/core/includes/testcase-rest-api.php';
}

abstract class WP_Test_Jetpack_REST_Testcase extends WP_Test_REST_TestCase {
	protected $server;

	public function setUp() {
		parent::setUp();

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$this->server = $wp_rest_server = new WP_Test_Spy_REST_Server;
		do_action( 'rest_api_init' );
	}

	public function tearDown() {
		parent::tearDown();

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$wp_rest_server = null;
	}
}
