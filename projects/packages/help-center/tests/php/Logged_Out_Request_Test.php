<?php
/**
 * Tests for logged-out Help Center requests.
 *
 * @package automattic/jetpack-help-center
 */

use Automattic\Jetpack\Help_Center\Jetpack_Wpcom_Request_Client;
use Automattic\Jetpack\Help_Center\WP_REST_Help_Center_Odie;
use Automattic\Jetpack\Help_Center\WP_REST_Help_Center_Search;
use Automattic\Jetpack\Help_Center\Wpcom_Request_Client;

require_once __DIR__ . '/class-logged-out-capturing-request-client.php';

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

	public function test_odie_proxy_forwards_logged_out_chat_session() {
		$wpcom_request_client = $this->create_capturing_request_client();
		$request              = new \WP_REST_Request( 'POST', '/help-center/odie/chat/test-bot/123' );
		$request->set_param( 'bot_id', 'test-bot' );
		$request->set_param( 'chat_id', 123 );
		$request->set_param( 'message', 'hi' );
		$request->set_param( 'context', array( 'screen' => 'storefront' ) );
		$request->set_param( 'version', '3.0.1' );
		$request->set_param( 'session_id', 'anonymous-session' );
		$request->set_param( 'external_chat_provider', 'zendesk' );
		$request->set_param( 'external_chat_id', 'external-chat' );

		$controller = new WP_REST_Help_Center_Odie( $wpcom_request_client );
		$controller->send_chat_message( $request );

		$this->assertSame(
			array(
				'message'                => 'hi',
				'context'                => array( 'screen' => 'storefront' ),
				'version'                => '3.0.1',
				'session_id'             => 'anonymous-session',
				'external_chat_provider' => 'zendesk',
				'external_chat_id'       => 'external-chat',
			),
			$wpcom_request_client->requests[0]['body']
		);
	}

	public function test_odie_proxy_omits_unset_optional_chat_fields() {
		$wpcom_request_client = $this->create_capturing_request_client();
		$request              = new \WP_REST_Request( 'POST', '/help-center/odie/chat/test-bot' );
		$request->set_param( 'bot_id', 'test-bot' );
		$request->set_param( 'message', 'hi' );

		$controller = new WP_REST_Help_Center_Odie( $wpcom_request_client );
		$controller->send_chat_message( $request );

		$this->assertSame(
			array(
				'message' => 'hi',
				'context' => array(),
			),
			$wpcom_request_client->requests[0]['body']
		);
	}

	public function test_odie_proxy_forwards_logged_out_session_when_getting_chat() {
		$wpcom_request_client = $this->create_capturing_request_client();
		$request              = new \WP_REST_Request( 'GET', '/help-center/odie/chat/test-bot/123' );
		$request->set_param( 'bot_id', 'test-bot' );
		$request->set_param( 'chat_id', 123 );
		$request->set_param( 'page_number', 1 );
		$request->set_param( 'items_per_page', 30 );
		$request->set_param( 'include_feedback', true );
		$request->set_param( 'version', '3.0.1' );
		$request->set_param( 'session_id', 'anonymous-session' );

		$controller = new WP_REST_Help_Center_Odie( $wpcom_request_client );
		$controller->get_chat( $request );

		$this->assertSame(
			'/odie/chat/test-bot/123?page_number=1&items_per_page=30&include_feedback=1&version=3.0.1&session_id=anonymous-session',
			$wpcom_request_client->requests[0]['path']
		);
	}

	private function create_capturing_request_client(): Logged_Out_Capturing_Request_Client {
		return new Logged_Out_Capturing_Request_Client();
	}
}
