<?php
/**
 * Tests for the article rating proxy endpoint.
 *
 * @package automattic/jetpack-help-center
 */

use Automattic\Jetpack\Help_Center\WP_REST_Help_Center_Article_Rating;
use Automattic\Jetpack\Help_Center\Wpcom_Request_Client;

/**
 * Class Article_Rating_Request_Test
 */
class Article_Rating_Request_Test extends \WorDBless\BaseTestCase {
	/**
	 * Create a request client that captures the proxied request and returns the given response.
	 *
	 * The return type is left to inference so Phan knows about the anonymous class's `requests` property.
	 *
	 * @param int    $code Upstream HTTP status code.
	 * @param string $body Upstream response body.
	 */
	private function create_request_client( $code, $body ) {
		return new class( $code, $body ) implements Wpcom_Request_Client {
			/**
			 * Captured requests.
			 *
			 * @var array
			 */
			public $requests = array();

			/**
			 * Upstream HTTP status code.
			 *
			 * @var int
			 */
			private $code;

			/**
			 * Upstream response body.
			 *
			 * @var string
			 */
			private $body;

			/**
			 * Constructor.
			 *
			 * @param int    $code Upstream HTTP status code.
			 * @param string $body Upstream response body.
			 */
			public function __construct( $code, $body ) {
				$this->code = $code;
				$this->body = $body;
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
					'body'     => $this->body,
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

	/**
	 * Build a rating request.
	 *
	 * @param int $rating Rating value.
	 * @return \WP_REST_Request
	 */
	private function create_rating_request( $rating ) {
		$request = new \WP_REST_Request( 'POST', '/help-center/article-rating' );
		$request->set_param( 'blog_id', 9619154 );
		$request->set_param( 'post_id', 185130 );
		$request->set_param( 'rating', $rating );

		return $request;
	}

	public function test_forwards_rating_to_wpcom_and_returns_the_rating_on_record() {
		$wpcom_request_client = $this->create_request_client( 200, '{"user_rating":2}' );

		$controller = new WP_REST_Help_Center_Article_Rating( $wpcom_request_client );
		$response   = $controller->save_rating( $this->create_rating_request( 1 ) );

		$this->assertSame(
			array(
				array(
					'path'          => '/help/article/rating',
					'version'       => '2',
					'args'          => array( 'method' => 'POST' ),
					'body'          => array(
						'blog_id' => 9619154,
						'post_id' => 185130,
						'rating'  => 1,
					),
					'base_api_path' => 'wpcom',
				),
			),
			$wpcom_request_client->requests
		);
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 2, $response->get_data()->user_rating );
	}

	public function test_passes_upstream_failure_status_through() {
		$wpcom_request_client = $this->create_request_client( 401, '{"code":"unauthorized"}' );

		$controller = new WP_REST_Help_Center_Article_Rating( $wpcom_request_client );
		$response   = $controller->save_rating( $this->create_rating_request( 1 ) );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'unauthorized', $response->get_data()->code );
	}
}
