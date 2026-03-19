<?php
/**
 * Tests for Automattic\Jetpack\VideoPress\AJAX
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Constants;
use WorDBless\BaseTestCase;

/**
 * AJAX capability check test suite.
 */
class AJAX_Test extends BaseTestCase {

	/**
	 * The AJAX instance.
	 *
	 * @var AJAX
	 */
	private $ajax;

	/**
	 * Set up before each test.
	 */
	protected function set_up() {
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		// Mock connection.
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		$this->ajax = AJAX::init();
	}

	/**
	 * Clean up after each test.
	 */
	protected function tear_down() {
		wp_set_current_user( 0 );
		Constants::clear_constants();
	}

	/**
	 * Test that subscribers cannot get upload JWTs.
	 */
	public function test_get_upload_jwt_rejected_for_subscriber() {
		$this->set_current_user_role( 'subscriber' );

		$response = $this->call_ajax_method( 'wp_ajax_videopress_get_upload_jwt' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'You do not have permission to upload files.', $response['data']['message'] );
	}

	/**
	 * Test that contributors cannot get upload JWTs.
	 */
	public function test_get_upload_jwt_rejected_for_contributor() {
		$this->set_current_user_role( 'contributor' );

		$response = $this->call_ajax_method( 'wp_ajax_videopress_get_upload_jwt' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'You do not have permission to upload files.', $response['data']['message'] );
	}

	/**
	 * Test that authors can get upload JWTs.
	 */
	public function test_get_upload_jwt_allowed_for_author() {
		$this->set_current_user_role( 'author' );

		$valid_response = array( $this, 'return_valid_upload_response' );
		add_filter( 'pre_http_request', $valid_response );
		$response = $this->call_ajax_method( 'wp_ajax_videopress_get_upload_jwt' );
		remove_filter( 'pre_http_request', $valid_response );

		$this->assertTrue( $response['success'] );
	}

	/**
	 * Test that subscribers cannot get upload tokens.
	 */
	public function test_get_upload_token_rejected_for_subscriber() {
		$this->set_current_user_role( 'subscriber' );

		$response = $this->call_ajax_method( 'wp_ajax_videopress_get_upload_token' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'You do not have permission to upload files.', $response['data']['message'] );
	}

	/**
	 * Test that authors can get upload tokens.
	 */
	public function test_get_upload_token_allowed_for_author() {
		$this->set_current_user_role( 'author' );

		$valid_response = array( $this, 'return_valid_upload_response' );
		add_filter( 'pre_http_request', $valid_response );
		$response = $this->call_ajax_method( 'wp_ajax_videopress_get_upload_token' );
		remove_filter( 'pre_http_request', $valid_response );

		$this->assertTrue( $response['success'] );
	}

	/**
	 * Helper to call an AJAX method and return the decoded JSON response.
	 *
	 * @param string $method The AJAX method name.
	 * @return array The decoded JSON response.
	 */
	private function call_ajax_method( $method ) {
		add_filter( 'wp_doing_ajax', '__return_true' );

		// Override WorDBless's wp_die handler to avoid a current_filter() bug on PHP < 8.
		$noop_die_handler = static function () {
			return '__return_empty_string';
		};
		add_filter( 'wp_die_ajax_handler', $noop_die_handler, 20 );

		ob_start();
		$this->ajax->$method();
		$output = ob_get_clean();

		remove_filter( 'wp_die_ajax_handler', $noop_die_handler, 20 );
		remove_filter( 'wp_doing_ajax', '__return_true' );

		$response = json_decode( $output, true );
		$this->assertNotNull( $response, "AJAX method '$method' did not return valid JSON. Output: " . substr( $output, 0, 200 ) );

		return $response;
	}

	/**
	 * Create a user with the given role and set as current user.
	 *
	 * @param string $role The user role.
	 */
	private function set_current_user_role( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $role . '_user',
				'user_pass'  => 'pass',
				'user_email' => $role . '@test.com',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * Returns a mock HTTP response with a valid upload token.
	 *
	 * @return array
	 */
	public function return_valid_upload_response() {
		return array( 'body' => wp_json_encode( array( 'upload_token' => 'test-token' ), JSON_UNESCAPED_SLASHES ) );
	}
}
