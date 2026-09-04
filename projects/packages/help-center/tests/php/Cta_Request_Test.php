<?php
/**
 * Tests for the Help Center CTA endpoint.
 *
 * @package automattic/jetpack-help-center
 */

use Automattic\Jetpack\Help_Center\WP_REST_Help_Center_CTA;
use Automattic\Jetpack\Help_Center\Wpcom_Request_Client;

/**
 * Class Cta_Request_Test
 */
class Cta_Request_Test extends \WorDBless\BaseTestCase {
	public function test_cta_proxy_forwards_the_upstream_cta() {
		$wpcom_request_client = $this->create_request_client(
			200,
			'{"id":"cta-1","variant":"default","url":"https://wordpress.com/help"}'
		);

		$controller = new WP_REST_Help_Center_CTA( $wpcom_request_client );
		$response   = $controller->get_cta();

		$this->assertSame(
			array(
				array(
					'path'          => '/help/cta',
					'version'       => '2',
					'args'          => array(),
					'body'          => null,
					'base_api_path' => 'wpcom',
				),
			),
			$wpcom_request_client->requests
		);
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'cta-1', $response->get_data()->id );
	}

	public function test_cta_proxy_passes_a_no_content_response_through() {
		$wpcom_request_client = $this->create_request_client( 204, '' );

		$controller = new WP_REST_Help_Center_CTA( $wpcom_request_client );
		$response   = $controller->get_cta();

		$this->assertSame( 204, $response->get_status() );
		$this->assertNull( $response->get_data() );
	}

	public function test_cta_proxy_passes_an_error_status_through() {
		$wpcom_request_client = $this->create_request_client( 401, '{"code":"unauthorized"}' );

		$controller = new WP_REST_Help_Center_CTA( $wpcom_request_client );
		$response   = $controller->get_cta();

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'unauthorized', $response->get_data()->code );
	}

	/**
	 * Build a request client capturing the proxied request and returning a canned response.
	 *
	 * @param int    $code The upstream status code.
	 * @param string $body The upstream response body.
	 */
	private function create_request_client( int $code, string $body ): Wpcom_Request_Client {
		return new class( $code, $body ) implements Wpcom_Request_Client {
			/**
			 * Captured requests.
			 *
			 * @var array
			 */
			public $requests = array();

			/**
			 * The upstream status code.
			 *
			 * @var int
			 */
			private $code;

			/**
			 * The upstream response body.
			 *
			 * @var string
			 */
			private $response_body;

			/**
			 * Constructor.
			 *
			 * @param int    $code          The upstream status code.
			 * @param string $response_body The upstream response body.
			 */
			public function __construct( int $code, string $response_body ) {
				$this->code          = $code;
				$this->response_body = $response_body;
			}

			public function is_user_connected() {
				return true;
			}

			public function request(
				$path,
				$version = '2',
				$args = array(),
				$body = null,
				$base_api_path = 'wpcom'
			) {
				$this->requests[] = compact( 'path', 'version', 'args', 'body', 'base_api_path' );

				return array(
					'headers'  => array(),
					'body'     => $this->response_body,
					'response' => array(
						'code'    => $this->code,
						'message' => '',
					),
					'cookies'  => array(),
					'filename' => null,
				);
			}
		};
	}
}
