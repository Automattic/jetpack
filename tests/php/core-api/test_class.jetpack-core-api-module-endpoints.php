<?php
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-rest-controller-testcase.php';
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-spy-rest-server.php';

class WP_Test_Jetpack_Core_Api_Module_Activate_Endpoint extends WP_Test_REST_Controller_Testcase {

	public function setUp() {
		require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class.core-rest-api-endpoints.php';

		parent::setUp();

		Jetpack::load_xml_rpc_client();
	}

	/**
	 * @author zinigor
	 * @covers Jetpack_Core_API_Module_Activate_Endpoint
	 * @requires PHP 5.2
	 */
	public function test_register_routes() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/module/(?P<slug>[a-z\-]+)/activate', $routes );

		$route = $routes['/jetpack/v4/module/(?P<slug>[a-z\-]+)/activate'][0];
		$this->assertInstanceOf(
			'Jetpack_Core_API_Module_Activate_Endpoint',
			$route['callback'][0]
		);
		$this->assertInstanceOf(
			'Jetpack_Core_API_Module_Activate_Endpoint',
			$route['permission_callback'][0]
		);
	}

	public function test_update_item() {}
	public function test_context_param() {}
	public function test_get_items() {}
	public function test_get_item() {}
	public function test_create_item() {}
	public function test_delete_item() {}
	public function test_prepare_item() {}
	public function test_get_item_schema() {}
}