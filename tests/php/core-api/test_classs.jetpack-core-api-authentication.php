<?php

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-rest-controller-testcase.php';
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-spy-rest-server.php';

class WP_Test_Jetpack_Core_Api_Authentication extends WP_Test_REST_Controller_Testcase {

    /**
     * @author rooctripaldi
     * @covers Jetpack->wp_json_authenticate
     * @requires PHP 5.2
     */
    public function test_jetpack_server_authorization_fail() {
        $request = new WP_REST_Request( 'GET', '/jetpack/v4/module/all' );
        $request->set_param( 'token', 'an invalid token' );
        $this->server->check_authentication();
        $response = $this->server->dispatch( $request );
        $this->assertEquals( 403, $response->get_status() );
    }

    /**
     * @author rooctripaldi
     * @covers Jetpack->wp_json_authenticate
     * @requires PHP 5.2
     */
    public function test_jetpack_server_authorization_success() {
        add_action( 'rest_authentication_errors', array( $this, 'wp_json_authenticate' ) );
        $request = new WP_REST_Request( 'GET', '/jetpack/v4/module/all' );
        $request->set_param( 'token', 'a valid token' );
        $this->server->check_authentication();
        $response = $this->server->dispatch( $request );
        remove_action( 'rest_authentication_errors', array( $this, 'wp_json_authenticate' ) );
        wp_set_current_user( 0 );
        $this->assertEquals( 200, $response->get_status() );
    }

    /**
     * Simulates Jetpack->wp_json_authenticate().
     * In this case always returns true without having to make a network request using verify_xml_rpc_signature().
     *
     * @return bool
     */
    public function wp_json_authenticate() {
        $user = $this->factory->user->create_and_get( array(
            'role' => 'administrator'
        ) );
        wp_set_current_user( $user->ID );
        return true;
    }

    public function test_register_routes() {}
    public function test_update_item() {}
    public function test_context_param() {}
    public function test_get_items() {}
    public function test_get_item() {}
    public function test_create_item() {}
    public function test_delete_item() {}
    public function test_prepare_item() {}
    public function test_get_item_schema() {}
    
}
