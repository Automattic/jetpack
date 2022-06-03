<?php
/**
 * Tests for the `sites/%s/jetpack/modules` endpoints.
 *
 * @package automattic/jetpack
 */

require_jetpack_file( 'class.json-api.php' );
require_jetpack_file( 'class.json-api-endpoints.php' );

/**
 * Tests for the `sites/%s/jetpack/modules` endpoints.
 */
class WP_Test_Jetpack_Modules_Json_Api_Endpoints extends WP_UnitTestCase {
	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'Get';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}

	/**
	 * Prepare the environment for the test.
	 */
	public function set_up() {
		global $blog_id;

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::set_up();

		$this->set_globals();

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );
	}

	/**
	 * Unit test for the `v1.2/modules/%s` endpoint.
	 */
	public function test_get_modules_v1_2() {
		global $blog_id;

		$endpoint = new Jetpack_JSON_API_Modules_List_V1_2_Endpoint(
			array(
				'description'             => 'Get the list of available Jetpack modules on your site',
				'method'                  => 'GET',
				'path'                    => '/sites/%s/jetpack/modules',
				'stat'                    => 'jetpack:modules',
				'min_version'             => '1.2',
				'path_labels'             => array(
					'$site' => '(int|string) The site ID, The site domain',
				),
				'response_format'         => array(
					'modules' => '(array) An array of module objects.',
				),
				'allow_jetpack_site_auth' => true,
				'example_request_data'    => array(
					'headers' => array(
						'authorization' => 'Bearer YOUR_API_TOKEN',
					),
				),
				'example_request'         => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/jetpack/modules',
			)
		);

		$response = $endpoint->callback( '', $blog_id );

		$this->assertArrayHasKey( 'modules', $response );
		$this->assertIsArray( $response['modules'] );

		$module = array_pop( $response['modules'] );
		$this->assertArrayHasKey( 'name', $module );
		$this->assertArrayHasKey( 'description', $module );
		$this->assertArrayHasKey( 'activated', $module );
		$this->assertArrayHasKey( 'available', $module );
	}
}
