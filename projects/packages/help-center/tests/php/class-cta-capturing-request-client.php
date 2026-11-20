<?php
/**
 * Test request client that captures proxied requests and returns a canned response.
 *
 * @package automattic/jetpack-help-center
 */

use Automattic\Jetpack\Help_Center\Wpcom_Request_Client;

/**
 * Request client that captures proxied requests and returns a canned upstream response.
 */
class Cta_Capturing_Request_Client implements Wpcom_Request_Client {
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
}
