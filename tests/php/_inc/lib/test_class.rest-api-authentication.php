<?php

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-jetpack-rest-testcase.php';
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-spy-rest-server.php';

class WP_Test_Jetpack_REST_API_Authentication extends WP_Test_Jetpack_REST_Testcase {
	/**
	 * @author roccotripaldi
	 * @covers Jetpack->wp_rest_authenticate
	 * @requires PHP 5.2
	 */
	public function test_jetpack_rest_api_authentication_fail_no_token_or_signature() {
	}
}
