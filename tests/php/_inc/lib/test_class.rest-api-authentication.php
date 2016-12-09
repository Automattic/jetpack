<?php

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-rest-controller-testcase.php';
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-spy-rest-server.php';

class WP_Test_Jetpack_REST_API_Authentication extends WP_Test_REST_Controller_Testcase {

    public function setUp() {
        parent::setUp();
        add_filter( 'rest_pre_dispatch', array( $this, 'rest_pre_dispatch' ), 100, 2 );
        switch ( $this->getName() ) {
            case 'test_jetpack_rest_api_authentication_fail_invalid_token':
                $_GET['token'] = 'invalid';
                $_GET['signature'] = 'invalid';
                break;
            case 'test_jetpack_rest_api_authentication_success':
                add_filter( 'rest_authentication_errors', array( $this, 'verify_signature_true' ), 1000 );
                break;
        }
    }

    public function tearDown() {
        parent::tearDown();
        remove_filter( 'rest_pre_dispatch', array( $this, 'rest_pre_dispatch' ) );
        switch ( $this->getName() ) {
            case 'test_jetpack_rest_api_authentication_fail_invalid_token':
                unset( $_GET['token'], $_GET['signature'] );
                break;
            case 'test_jetpack_rest_api_authentication_success':
                wp_set_current_user( 0 );
                remove_filter( 'rest_authentication_errors', array( $this, 'verify_signature_true' ), 1000 );
                break;
        }
    }

    /**
     * @author roccotripaldi
     * @covers Jetpack->wp_rest_authenticate
     * @requires PHP 5.2
     */
    public function test_jetpack_rest_api_authentication_fail_no_token() {
        $request = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
        $response = $this->server->dispatch( $request );
        $this->assertErrorResponse( 'rest_forbidden', $response );
    }

    /**
     * @author roccotripaldi
     * @covers Jetpack->wp_rest_authenticate
     * @requires PHP 5.2
     */
    public function test_jetpack_rest_api_authentication_fail_invalid_token() {
        $request = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
        $response = $this->server->dispatch( $request );
        $this->assertErrorResponse( 'token_malformed', $response );
    }

    /**
     * @author roccotripaldi
     * @covers Jetpack->wp_rest_authenticate
     * @requires PHP 5.2
     */
    public function test_jetpack_rest_api_authentication_success() {
        $request = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
        $response = $this->server->dispatch( $request );
        $this->assertEquals( 200, $response->get_status() );
        $data = $response->get_data();
        $this->assertEquals( 'Protect', $data['name'] );
    }

    /**
     * Emulates a successfull run through Jetpack::wp_rest_authenticate and Jetpack::verify_xml_rpc_signature
     * without having to actually call Jetpack Server to verify signature.
     *
     * @return null
     */
    public function verify_signature_true() {
        $user = $this->factory->user->create_and_get( array(
            'role' => 'administrator'
        ) );
        wp_set_current_user( $user->ID );
        return null;
    }

    /**
     * Ensures that these tests pass through Jetpack::wp_rest_authenticate,
     * otherwise WP_REST_Server::dispatch doesn't bother to check authorization.
     */
    public function rest_pre_dispatch( $result, $server ) {
        $auth = $server->check_authentication();
        if ( true === $auth ) {
            return $result;
        }
        return $auth;
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
