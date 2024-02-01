<?php
/**
 * REST API integration tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Waf\REST_Controller;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;

/**
 * Integration tests for the REST API endpoints registered by the WAF.
 */
final class WafRestIntegrationTest extends WorDBless\BaseTestCase {
	/**
	 * Test setup.
	 */
	protected function set_up() {
		// Set a blog token and id so the site is connected.
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'id', 1234 );

		// Set the WPCOM JSON API base URL so the site will attempt to make requests.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Return a sample wpcom rules response.
	 *
	 * @return array
	 */
	public function return_sample_response() {
		$sample_response = (object) array(
			'data' => "<?php\n", // empty rules file
		);

		return array(
			'body'     => wp_json_encode( $sample_response ),
			'response' => array(
				'code'    => 200,
				'message' => '',
			),
		);
	}

	/**
	 * Return a 503 wpcom rules response.
	 *
	 * @return array
	 */
	public function return_503_response() {
		return array(
			'body'     => '',
			'response' => array(
				'code'    => 503,
				'message' => '',
			),
		);
	}

	/**
	 * Return an invalid filesystem method.
	 *
	 * @return string
	 */
	public function return_invalid_filesystem_method() {
		return 'Code is poetry.';
	}

	/**
	 * Test /jetpack/v4/waf/update-rules.
	 */
	public function testUpdateRulesEndpoint() {
		// Mock the WPCOM request for retrieving the automatic rules.
		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );

		// Call /jetpack/v4/waf/update-rules.
		$response = REST_Controller::update_rules();

		// Validate the response.
		$this->assertTrue( $response->data['success'] );

		// Clean up.
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
	}

	/**
	 * Test /jetpack/v4/waf/update-rules when the filesystem is unavailable.
	 */
	public function testUpdateRulesEndpointFilesystemUnavailable() {
		// Mock the WPCOM request for retrieving the automatic rules.
		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );

		// Break the filesystem.
		add_filter( 'filesystem_method', array( $this, 'return_invalid_filesystem_method' ) );

		// Call /jetpack/v4/waf/update-rules.
		$response = REST_Controller::update_rules();

		// Validate the response.
		$this->assertTrue( is_wp_error( $response ) );
		$this->assertSame( 'file_system_error', $response->get_error_code() );

		// Clean up.
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		remove_filter( 'filesystem_method', array( $this, 'return_invalid_filesystem_method' ) );
	}

	/**
	 * Test /jetpack/v4/waf/update-rules when the WPCOM request fails.
	 */
	public function testUpdateRulesEndpointWpcomRequestFails() {
		// Mock the WPCOM request for retrieving the automatic rules.
		add_filter( 'pre_http_request', array( $this, 'return_503_response' ) );

		// Call /jetpack/v4/waf/update-rules.
		$response = REST_Controller::update_rules();

		// Validate the response.
		$this->assertTrue( is_wp_error( $response ) );
		$this->assertSame( 'rules_api_error', $response->get_error_code() );

		// Clean up.
		remove_filter( 'pre_http_request', array( $this, 'return_503_response' ) );
	}

	/**
	 * Test /jetpack/v4/waf POST.
	 */
	public function testUpdateWaf() {
		// Mock the WPCOM request for retrieving the automatic rules.
		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );

		// Mock the request.
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/waf' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME => true,
				)
			)
		);

		// Call the endpoint.
		$response = REST_Controller::update_waf( $request );

		// Validate the response.
		$this->assertFalse( is_wp_error( $response ) );

		// Clean up.
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
	}

	/**
	 * Test /jetpack/v4/waf POST when filesystem is unavailable.
	 */
	public function testUpdateWafFilesystemUnavailable() {
		// Break the filesystem.
		add_filter( 'filesystem_method', array( $this, 'return_invalid_filesystem_method' ) );

		// Mock the request.
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/waf' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'jetpack_waf_automatic_rules_enabled' => true,
				)
			)
		);

		// Call the endpoint.
		$response = REST_Controller::update_waf( $request );

		// Validate the response.
		$this->assertTrue( is_wp_error( $response ) );
		$this->assertSame( 'file_system_error', $response->get_error_code() );

		// Clean up.
		remove_filter( 'filesystem_method', array( $this, 'return_invalid_filesystem_method' ) );
	}
}
