<?php
/**
 * Test class for requests to the WPCOM api.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
require_once Jetpack_Mu_Wpcom::PKG_DIR . '../status/src/class-visitor.php';
require_once __DIR__ . '/class-launchpad-jetpack-connection-client-mock.php';

/**
 * Test class for requests to the WPCOM api.
 */
class Launchpad_WPCOM_Requests_Test extends \WorDBless\BaseTestCase {
	/**
	 * Test that the request to the WPCOM api returns the expected result.
	 *
	 * @covers ::wpcom_launchpad_request_user_attributes
	 */
	public function test_wpcom_launchpad_request_user_attributes() {
		$attributes = array( 'attribute1', 'attribute2' );
		// Mocking Automattic\Jetpack\Status\Visitor::get_ip
		$visitor_mock = $this->getMockBuilder( Automattic\Jetpack\Status\Visitor::class )
			->getMock();
		$visitor_mock->method( 'get_ip' )->willReturn( 'mocked_ip' );

		$response = array(
			'response' => array(
				'code' => 200,
			),
			'body'     => '{"user_attributes": {"attribute1": "value1", "attribute2": "value2"}}',
		);

		// Mocking Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user
		$client_mock = $this->getMockBuilder( Launchpad_Jetpack_Connection_Client_Mock::class )->getMock();
		$client_mock->expects( $this->exactly( 2 ) )->method( 'wpcom_json_api_request_as_user' )->willReturn( $response );

		$result = wpcom_launchpad_request_user_attributes( $attributes, $client_mock );

		$this->assertEquals(
			array(
				'attribute1' => 'value1',
				'attribute2' => 'value2',
			),
			$result
		);

		// Test that a new request is made because the attribute3 is not cached.
		$second_attributes = array( 'attribute1', 'attribute3' );
		wpcom_launchpad_request_user_attributes( $second_attributes, $client_mock );

		// If the value is not cached, the test would fail because the mocked wpcom_json_api_request_as_user
		// method should be called only two times.
		$cached_result = wpcom_launchpad_request_user_attributes( array( 'attribute1' ), $client_mock );

		$this->assertEquals(
			array(
				'attribute1' => 'value1',
			),
			$cached_result
		);
	}
}
