<?php
/**
 * Test request client that captures proxied requests.
 *
 * @package automattic/jetpack-help-center
 */

use Automattic\Jetpack\Help_Center\Wpcom_Request_Client;

/**
 * Request client that captures proxied requests for assertions.
 */
class Logged_Out_Capturing_Request_Client implements Wpcom_Request_Client {
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
			'body'     => '{"messages":[]}',
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}
}
