<?php
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-rest-controller-testcase.php';
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-spy-rest-server.php';

class WP_Test_Jetpack_Core_Api_Module_Activate_Endpoint extends WP_Test_REST_Controller_Testcase {

	public function setUp() {
		parent::setUp();

		Jetpack::load_xml_rpc_client();
	}

	/**
	 * @author zinigor
	 * @covers Jetpack_Core_API_Module_Activate_Endpoint
	 * @requires PHP 5.2
	 * @dataProvider api_routes
	 */
	public function test_register_routes( $route_string = false, $method = false, $classname = false ) {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( $route_string, $routes );

		$route = array();
		foreach ( $routes[ $route_string ] as $item ) {
			if ( isset( $item['methods'][ $method ] ) ) {
				$route = $item;
			}
		}

		$this->assertInstanceOf(
			$classname,
			$route['callback'][0],
			"process method object should be an instance of the $classname class"
		);
		$this->assertInstanceOf(
			$classname,
			$route['permission_callback'][0],
			"permission method object should be an instance of the $classname class"
		);
	}

	public function api_routes() {
		return array(
			array( '/jetpack/v4/module/all', 'GET', 'Jetpack_Core_API_Module_List_Endpoint' ),
			array( '/jetpack/v4/module/all/active', 'POST', 'Jetpack_Core_API_Module_List_Endpoint' ),
			array( '/jetpack/v4/module/(?P<slug>[a-z\-]+)', 'GET', 'Jetpack_Core_API_Data' ),
			array( '/jetpack/v4/module/(?P<slug>[a-z\-]+)', 'POST', 'Jetpack_Core_API_Data' ),
			array( '/jetpack/v4/module/(?P<slug>[a-z\-]+)/data', 'GET', 'Jetpack_Core_API_Module_Data_Endpoint' ),
			array( '/jetpack/v4/module/(?P<slug>[a-z\-]+)/active', 'POST', 'Jetpack_Core_API_Module_Toggle_Endpoint' ),
			array( '/jetpack/v4/settings', 'GET', 'Jetpack_Core_API_Data' ),
			array( '/jetpack/v4/settings', 'POST', 'Jetpack_Core_API_Data' ),
			array( '/jetpack/v4/settings/(?P<slug>[a-z\-]+)', 'POST', 'Jetpack_Core_API_Data' ),
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