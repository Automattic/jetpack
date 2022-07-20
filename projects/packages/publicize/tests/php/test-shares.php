<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use WorDBless\BaseTestCase;

/**
 * Unit tests for the Shares class.
 *
 * @package automattic/jetpack-publicize
 */
class Test_Shares extends BaseTestCase {
	/**
	 * Get a sample response
	 *
	 * @return object
	 */
	public function get_sample_response() {
		return (object) array(
			'is_share_limit_enabled' => true,
		);
	}

	/**
	 * Return a sample wpcom status response.
	 *
	 * @return array
	 */
	public function return_sample_response() {
		return array(
			'body'     => wp_json_encode( $this->get_sample_response() ),
			'response' => array(
				'code'    => 200,
				'message' => '',
			),
		);
	}

	/**
	 * Mock site connection
	 */
	public function mock_connection() {
		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 123 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Test while site is not connected
	 */
	public function test_get_data_not_connected() {
		$shares = new Shares();

		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		$data = $shares->get_data();
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );

		$this->assertSame( 'site_not_connected', $data->get_error_code() );
	}

	/**
	 * Test getting data with site connected.
	 */
	public function test_get_data_connected() {
		$this->mock_connection();
		$shares = new Shares();

		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		$data = $shares->get_data();
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );

		$this->assertEquals( $this->get_sample_response(), $data );
	}

	/**
	 * Test is share limit enabled.
	 */
	public function test_is_share_limit_enabled() {
		$this->mock_connection();
		$shares = new Shares();

		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		$is_share_limit_enabled = $shares->is_share_limit_enabled();
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );

		$this->assertTrue( $is_share_limit_enabled );
	}
}
