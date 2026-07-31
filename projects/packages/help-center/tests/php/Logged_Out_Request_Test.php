<?php
/**
 * Tests for logged-out Help Center requests.
 *
 * @package automattic/jetpack-help-center
 */

use Automattic\Jetpack\Help_Center\Jetpack_Wpcom_Request_Client;
use Automattic\Jetpack\Help_Center\WP_REST_Help_Center_Search;
use Automattic\Jetpack\Help_Center\Wpcom_Request_Client;

/**
 * Class Logged_Out_Request_Test
 */
class Logged_Out_Request_Test extends \WorDBless\BaseTestCase {
	public function set_up() {
		parent::set_up();
		wp_set_current_user( 0 );
	}

	public function tear_down() {
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	public function test_default_client_sends_logged_out_request_anonymously() {
		$captured_request = null;
		$response         = null;
		$pre_http_request = static function ( $response, $request_args, $url ) use ( &$captured_request ) {
			$captured_request = compact( 'request_args', 'url' );

			return array(
				'headers'  => array(),
				'body'     => '{"results":[]}',
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'cookies'  => array(),
				'filename' => null,
			);
		};
		add_filter( 'pre_http_request', $pre_http_request, 10, 3 );

		try {
			$client   = new Jetpack_Wpcom_Request_Client();
			$response = $client->request(
				'/help/search?query=payments',
				'2',
				array( 'method' => 'GET' )
			);
		} finally {
			remove_filter( 'pre_http_request', $pre_http_request, 10 );
		}

		$this->assertFalse( is_wp_error( $response ) );
		if ( ! is_array( $captured_request ) ) {
			throw new \RuntimeException( 'The anonymous HTTP request was not captured.' );
		}
		$this->assertStringEndsWith( '/wpcom/v2/help/search?query=payments', $captured_request['url'] );
		$this->assertSame( 'GET', $captured_request['request_args']['method'] );
		$this->assertArrayNotHasKey( 'Authorization', $captured_request['request_args']['headers'] ?? array() );
	}

	public function test_search_proxy_forwards_logged_out_request() {
		$wpcom_request_client = new class() implements Wpcom_Request_Client {
			/**
			 * Captured requests.
			 *
			 * @var array
			 */
			public $requests = array();

			public function is_user_connected() {
				return false;
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
					'body'     => '{"results":[{"title":"Payments"}]}',
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'cookies'  => array(),
					'filename' => null,
				);
			}
		};

		$request = new \WP_REST_Request( 'GET', '/help-center/search' );
		$request->set_param( 'query', 'payments' );
		$request->set_param( 'locale', 'en' );

		$controller = new WP_REST_Help_Center_Search( $wpcom_request_client );
		$response   = $controller->get_search_results( $request );

		$this->assertSame(
			array(
				array(
					'path'          => '/help/search?query=payments&locale=en',
					'version'       => '2',
					'args'          => array(),
					'body'          => null,
					'base_api_path' => 'wpcom',
				),
			),
			$wpcom_request_client->requests
		);
		$response_data = $response->get_data();
		$this->assertCount( 1, $response_data->results );
		$this->assertSame( 'Payments', $response_data->results[0]->title );
	}
}
