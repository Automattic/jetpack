<?php
/**
 * Jetpack `sites/%s/sync` endpoint unit tests.
 *
 * @package automattic/jetpack
 */

require_jetpack_file( 'class.json-api-endpoints.php' );

/**
 * Jetpack `site/%s/sync` endpoint unit tests.
 */
class WP_Test_Jetpack_Sync_Json_Api_Endpoints extends WP_UnitTestCase {

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
	public function setUp() {
		global $blog_id;

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::setUp();

		$this->set_globals();

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );
	}

	/**
	 * Unit test for the `/sites/%s/sync/health` endpoint with valid input.
	 */
	public function test_modify_sync_health() {
		global $blog_id;

		$endpoint = new Jetpack_JSON_API_Sync_Modify_Health_Endpoint(
			array(
				'description'             => 'Update sync health',
				'method'                  => 'POST',
				'group'                   => '__do_not_document',
				'path'                    => '/sites/%s/sync/health',
				'stat'                    => 'write-sync-health',
				'allow_jetpack_site_auth' => true,
				'path_labels'             => array(
					'$site' => '(int|string) The site ID, The site domain',
				),
				'request_format'          => array(
					'status' => '(string) Sync Health Status of site',
				),
				'response_format'         => array(
					'response' => '(string) Current Sync Health ',
				),
				'example_request'         => 'https://public-api.wordpress.com/rest/v1.1/sites/example.wordpress.org/sync/health',
			)
		);

		// set input.
		$endpoint->api->post_body    = '{ "status": "in_sync" }';
		$endpoint->api->content_type = 'application/json';

		$response = $endpoint->callback( 'sync/health', $blog_id );

		$this->assertEquals( 'in_sync', $response['success'] );
	}

	/**
	 * Unit test for the `/sites/%s/sync/health` endpoint with invalid input.
	 */
	public function test_modify_sync_health_error() {
		global $blog_id;

		$endpoint = new Jetpack_JSON_API_Sync_Modify_Health_Endpoint(
			array(
				'description'             => 'Update sync health',
				'method'                  => 'POST',
				'group'                   => '__do_not_document',
				'path'                    => '/sites/%s/sync/health',
				'stat'                    => 'write-sync-health',
				'allow_jetpack_site_auth' => true,
				'path_labels'             => array(
					'$site' => '(int|string) The site ID, The site domain',
				),
				'request_format'          => array(
					'status' => '(string) Sync Health Status of site',
				),
				'response_format'         => array(
					'response' => '(string) Current Sync Health ',
				),
				'example_request'         => 'https://public-api.wordpress.com/rest/v1.1/sites/example.wordpress.org/sync/health',
			)
		);

		// set input.
		$endpoint->api->post_body    = '{ "status": "bad_falue" }';
		$endpoint->api->content_type = 'application/json';

		$response = $endpoint->callback( 'sync/health', $blog_id );

		// Verify WP_Error returned on invalid stati.
		$this->assertInstanceOf( 'WP_Error', $response );
	}

	/**
	 * Unit test for the `/sites/%s/clear/transient` endpoint with valid input.
	 */
	public function test_clear_transient() {
		global $blog_id;

		$endpoint = new Jetpack_JSON_API_Sync_Clear_Transient_Endpoint(
			array(
				'description'             => 'Clear transient',
				'method'                  => 'POST',
				'group'                   => '__do_not_document',
				'path'                    => '/sites/%s/clear/transient',
				'stat'                    => 'clear-transient',
				'allow_jetpack_site_auth' => true,
				'path_labels'             => array(
					'$site' => '(int|string) The site ID, The site domain',
				),
				'request_format'          => array(
					'name' => '(string) Name of transient to clear',
				),
				'response_format'         => array(
					'response' => '(bool) Whether transient was deleted',
				),
				'example_request'         => 'https://public-api.wordpress.com/rest/v1.1/sites/example.wordpress.org/clear/transient',
			)
		);

		// set input.
		$endpoint->api->post_body    = '{ "name": "jetpack_connected_user_data_1" }';
		$endpoint->api->content_type = 'application/json';

		$response = $endpoint->callback( 'clear/transient', $blog_id );

		$this->assertFalse( $response['success'] );
	}

	/**
	 * Unit test for the `/sites/%s/clear/transient` endpoint with invalid input.
	 */
	public function test_clear_transient_error() {
		global $blog_id;

		$endpoint = new Jetpack_JSON_API_Sync_Clear_Transient_Endpoint(
			array(
				'description'             => 'Clear transient',
				'method'                  => 'POST',
				'group'                   => '__do_not_document',
				'path'                    => '/sites/%s/clear/transient',
				'stat'                    => 'clear-transient',
				'allow_jetpack_site_auth' => true,
				'path_labels'             => array(
					'$site' => '(int|string) The site ID, The site domain',
				),
				'request_format'          => array(
					'name' => '(string) Name of transient to clear',
				),
				'response_format'         => array(
					'response' => '(bool) Whether transient was deleted',
				),
				'example_request'         => 'https://public-api.wordpress.com/rest/v1.1/sites/example.wordpress.org/clear/transient',
			)
		);

		// set input.
		$endpoint->api->post_body    = '{ "name": "" }';
		$endpoint->api->content_type = 'application/json';

		$response = $endpoint->callback( 'clear/transient', $blog_id );

		// Verify WP_Error returned if no transient name provided.
		$this->assertInstanceOf( 'WP_Error', $response );
	}
}
