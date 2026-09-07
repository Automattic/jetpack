<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use WP_Error;

/**
 * Unit tests for the WPCOM_Client class.
 *
 * @package automattic/jetpack-stats-admin
 */
class WPCOM_Client_Test extends Stats_TestCase {
	/**
	 * Without a blog token the request never leaves the site. The error says so, and carries a
	 * status, so the REST API does not report it as a server fault.
	 */
	public function test_request_as_blog_without_a_connection() {
		$this->disconnect_site();

		$response = WPCOM_Client::request_as_blog( '/sites/0/stats' );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'site_not_connected', $response->get_error_code() );
		$this->assertSame( 400, $response->get_error_data()['status'] );
	}

	/**
	 * A blog token without a dot has no secret half — signing fails locally before the
	 * request is sent. The error must carry a status so it isn't reported as a server fault.
	 */
	public function test_request_as_blog_with_malformed_blog_token() {
		$this->use_invalid_blog_token();

		$response = WPCOM_Client::request_as_blog( '/sites/999/stats' );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'site_not_connected', $response->get_error_code() );
		$this->assertSame( 400, $response->get_error_data()['status'] );
	}

	/**
	 * Rejected token keys and secrets must identify a connection problem.
	 *
	 * @dataProvider rejected_token_provider
	 * @param string $error_code Remote authentication error.
	 */
	#[DataProvider( 'rejected_token_provider' )]
	public function test_request_as_blog_when_wpcom_rejects_the_token( $error_code ) {
		// Replace the HTTP fixture so WPCOM appears to reject the blog token.
		remove_filter( 'pre_http_request', array( $this, 'plan_http_response_fixture' ), 10 );
		$wpcom_rejection = static function () use ( $error_code ) {
			return array(
				'response' => array(
					'code'    => 403,
					'message' => 'Forbidden',
				),
				'body'     => wp_json_encode(
					array(
						'error'   => $error_code,
						'message' => 'Invalid blog token.',
					),
					JSON_UNESCAPED_SLASHES
				),
			);
		};
		add_filter( 'pre_http_request', $wpcom_rejection );

		$response = WPCOM_Client::request_as_blog( '/sites/999/stats' );

		remove_filter( 'pre_http_request', $wpcom_rejection );
		add_filter( 'pre_http_request', array( $this, 'plan_http_response_fixture' ), 10, 3 );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'site_not_connected', $response->get_error_code() );
		$this->assertSame( 400, $response->get_error_data()['status'] );
	}

	/**
	 * Authentication errors returned for rejected blog credentials.
	 *
	 * @return array
	 */
	public static function rejected_token_provider() {
		return array(
			'invalid token'    => array( 'invalid_token' ),
			'unknown key'      => array( 'unknown_token' ),
			'incorrect secret' => array( 'signature_mismatch' ),
		);
	}
}
