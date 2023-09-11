<?php
/**
 * Jetpack `site/%s` endpoint unit tests.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed
if ( ! function_exists( 'has_blog_sticker' ) ) {
	/**
	 * "Mock" WPCOM sticker function with 'get_option'
	 */
	function has_blog_sticker( $sticker ) {
		return get_option( $sticker );
	}
}

/**
 * Jetpack `site/%s` endpoint unit tests.
 */
class WP_Test_Jetpack_Site_Json_Api_Endpoints extends WP_UnitTestCase {

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
	 * Unit test for the `/sites/%s` endpoint.
	 */
	public function test_get_site() {
		global $blog_id;

		// Fetch as admin so that options is also present in the response.
		$admin = self::factory()->user->create_and_get(
			array(
				'role' => 'administrator',
			)
		);

		wp_set_current_user( $admin->ID );

		$endpoint = $this->create_get_site_endpoint();

		$response = $endpoint->callback( '', $blog_id );

		$this->assertTrue( $response['jetpack'] );
		$this->assertTrue( $response['jetpack_connection'] );

		$options = (array) $response['options'];
		$this->assertArrayHasKey( 'jetpack_connection_active_plugins', $options );
	}

	/**
	 * Test that trial flags are returned for sites that have them.
	 *
	 * @author zaerl
	 * @covers WPCOM_JSON_API_GET_Site_Endpoint::build_current_site_response
	 */
	public function test_get_site_trials_list() {
		global $blog_id;

		// Current trials.
		$trials = array_keys( WPCOM_JSON_API_GET_Site_Endpoint::$jetpack_enabled_trials );

		$admin = self::factory()->user->create_and_get(
			array(
				'role' => 'administrator',
			)
		);

		wp_set_current_user( $admin->ID );

		$endpoint = $this->create_get_site_endpoint();

		/**
		 * The `has_blog_sticker` is a mock function that reads the options database
		 * and returns the value of the option passed to it.
		 *
		 * We add the trial flags to the options database and then check them later.
		 * All even flags are set to true and all odd flags are set to false.
		 */
		$i = 0;
		foreach ( $trials as $trial ) {
			update_option( $trial, (bool) ( $i & 2 ) );
			++$i;
		}

		$response = $endpoint->callback( '', $blog_id );

		$i = 0;
		foreach ( $trials as $trial ) {
			if ( (bool) ( $i & 2 ) ) {
				$this->assertTrue( $response[ $trial ] );
			} else {
				$this->assertFalse( $response[ $trial ] );
			}
		}

		// Remove all the options used.
		foreach ( $trials as $trial ) {
			delete_option( $trial );
			++$i;
		}
	}

	public function create_get_site_endpoint() {
		return new WPCOM_JSON_API_GET_Site_Endpoint(
			array(
				'description'             => 'Get information about a site.',
				'group'                   => 'sites',
				'stat'                    => 'sites:X',
				'allowed_if_flagged'      => true,
				'method'                  => 'GET',
				'max_version'             => '1.1',
				'new_version'             => '1.2',
				'path'                    => '/sites/%s',
				'path_labels'             => array(
					'$site' => '(int|string) Site ID or domain',
				),
				'allow_jetpack_site_auth' => true,
				'query_parameters'        => array(
					'context' => false,
					'options' => '(string) Optional. Returns specified options only. Comma-separated list. Example: options=login_url,timezone',
				),
				'response_format'         => WPCOM_JSON_API_GET_Site_Endpoint::$site_format,
				'example_request'         => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/',
			)
		);
	}
}
