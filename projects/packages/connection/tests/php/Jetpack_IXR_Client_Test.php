<?php
/**
 * Testing the Jetpack IXR client's handling of XML-RPC faults.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Jetpack_IXR_Client;
use Jetpack_Options;
use WorDBless\BaseTestCase;

/**
 * Class Jetpack_IXR_Client_Test.
 *
 * @package Automattic\Jetpack\Connection
 */
class Jetpack_IXR_Client_Test extends BaseTestCase {

	/**
	 * Error_Handler instance.
	 *
	 * @var Error_Handler
	 */
	private $error_handler;

	/**
	 * The fault string the mocked WP.com response carries.
	 *
	 * @var string
	 */
	private $fault_string = '';

	/**
	 * Initialize tests.
	 */
	public function set_up() {
		$this->error_handler = Error_Handler::get_instance();

		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

		// A blog token so the request can be signed and actually reach the HTTP layer.
		Jetpack_Options::update_option( 'blog_token', 'abcdefghijkl.mnopqrstuvwx' );

		// The reporting gate is per error code and lives for an hour; these tests assert on
		// the stored result, not on the gate.
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		add_filter( 'pre_http_request', array( $this, 'mock_fault_response' ) );
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'mock_fault_response' ), 10 );
		remove_all_filters( 'jetpack_connection_bypass_error_reporting_gate' );

		// `Client::build_signed_request()` registers this filter on every call and never
		// removes it; left in place it changes how constants resolve for later tests.
		remove_all_filters( 'jetpack_constant_default_value' );
		Constants::clear_constants();

		$this->error_handler->delete_all_errors();

		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'user_tokens' );
		Jetpack_Options::delete_option( 'master_user' );

		// The displayable errors are cached per viewer on the singleton.
		$reflection = new \ReflectionClass( $this->error_handler );
		$property   = $reflection->getProperty( 'cached_displayable_errors' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $this->error_handler, null );
	}

	/**
	 * Short-circuit the outgoing request with an XML-RPC fault.
	 *
	 * Faults are delivered as HTTP 200 responses with an XML body, which is the whole reason
	 * they bypass `Error_Handler::check_api_response_for_errors()`.
	 *
	 * @return array
	 */
	public function mock_fault_response() {
		$body = sprintf(
			'<?xml version="1.0"?><methodResponse><fault><value><struct>' .
			'<member><name>faultCode</name><value><int>-10520</int></value></member>' .
			'<member><name>faultString</name><value><string>%s</string></value></member>' .
			'</struct></value></fault></methodResponse>',
			htmlspecialchars( $this->fault_string, ENT_XML1 )
		);

		return array(
			'headers'  => array(),
			'body'     => $body,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Test that a fault from WP.com is reported to the Error_Handler.
	 *
	 * The response is an HTTP 200, so `check_api_response_for_errors()` returns early on it;
	 * `query()` reports the fault itself.
	 */
	public function test_query_reports_a_fault() {
		$this->fault_string = 'Jetpack: [invalid_token] The token is not valid';

		$client = new Jetpack_IXR_Client();
		$result = $client->query( 'jetpack.fetchSiteOptions', 'jetpack_version' );

		$this->assertFalse( $result, 'a fault is still a failed query' );
		$this->assertSame( 'Jetpack: [invalid_token] The token is not valid', $client->getErrorMessage() );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertArrayHasKey( 'invalid_token', $stored_errors );

		$stored = $stored_errors['invalid_token']['0'];

		$this->assertSame( 'The token is not valid', $stored['error_message'] );
		$this->assertSame( Error_Handler::ERROR_TYPE_XMLRPC, $stored['error_type'] );
		$this->assertSame( Error_Handler::DIRECTION_OUTGOING, $stored['error_direction'] );
		$this->assertSame( 'https://jetpack.wordpress.com/xmlrpc.php', $stored['error_data']['url'] );
	}

	/**
	 * Test that a fault WP.com formats some other way is not reported.
	 *
	 * `query()` must still fail the same way; only the reporting is skipped.
	 */
	public function test_query_ignores_a_foreign_fault_string() {
		$this->fault_string = 'server error. requested method jetpack.fetchSiteOptions does not exist.';

		$client = new Jetpack_IXR_Client();
		$result = $client->query( 'jetpack.fetchSiteOptions', 'jetpack_version' );

		$this->assertFalse( $result );
		$this->assertSame( 'server error. requested method jetpack.fetchSiteOptions does not exist.', $client->getErrorMessage() );
		$this->assertEmpty( $this->error_handler->get_stored_errors() );
	}

	/**
	 * Test that a fault on a user-authenticated call is attributed to that user.
	 */
	public function test_query_attributes_a_fault_to_the_requesting_user() {
		$this->fault_string = 'Jetpack: [invalid_token] The token is not valid';

		Jetpack_Options::update_option( 'user_tokens', array( 42 => 'yzabcdefghij.klmnopqrstuv.42' ) );

		$client = new Jetpack_IXR_Client( array( 'user_id' => 42 ) );
		$result = $client->query( 'jetpack.fetchSiteOptions', 'jetpack_version' );

		$this->assertFalse( $result );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertArrayHasKey( '42', $stored_errors['invalid_token'] );
	}

	/**
	 * Test that a fault on a connection-owner call (`user_id => true`) is attributed to the
	 * master user, not to local user 1 via an `(int) true` cast.
	 */
	public function test_query_attributes_a_fault_to_the_connection_owner() {
		$this->fault_string = 'Jetpack: [invalid_token] The token is not valid';

		Jetpack_Options::update_option( 'master_user', 99 );
		Jetpack_Options::update_option( 'user_tokens', array( 99 => 'yzabcdefghij.klmnopqrstuv.99' ) );

		$client = new Jetpack_IXR_Client( array( 'user_id' => true ) );
		$result = $client->query( 'jetpack.fetchSiteOptions', 'jetpack_version' );

		$this->assertFalse( $result );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertArrayHasKey( '99', $stored_errors['invalid_token'] );
	}

	/**
	 * Test that `parse_jetpack_fault_string()` recovers the code/message pair.
	 */
	public function test_parse_jetpack_fault_string_recovers_code_and_message() {
		$this->assertSame(
			array( 'invalid_token', 'The token is not valid' ),
			Jetpack_IXR_Client::parse_jetpack_fault_string( 'Jetpack: [invalid_token] The token is not valid' )
		);
	}

	/**
	 * Test that a fault string not following the convention is rejected.
	 */
	public function test_parse_jetpack_fault_string_ignores_a_foreign_fault_string() {
		$this->assertNull(
			Jetpack_IXR_Client::parse_jetpack_fault_string( 'server error. requested method jetpack.fetchSiteOptions does not exist.' )
		);
	}

	/**
	 * Test that the convention is only recognized at the start of the string.
	 *
	 * The regex is unanchored-adjacent risk: WP.com fault strings are untrusted input, and an
	 * unanchored match would let a fault string that merely echoes `Jetpack: [code] message`
	 * somewhere in its middle (e.g. a request-derived value reflected back) get parsed as if
	 * it were the trusted convention.
	 */
	public function test_parse_jetpack_fault_string_requires_the_convention_at_the_start() {
		$this->assertNull(
			Jetpack_IXR_Client::parse_jetpack_fault_string( 'unexpected prefix Jetpack: [invalid_token] The token is not valid' )
		);
	}

	/**
	 * Test that get_jetpack_error() returns a WP_Error built from the parsed code/message,
	 * with the IXR fault code carried through as the WP_Error's status data.
	 */
	public function test_get_jetpack_error_returns_the_parsed_code_and_message() {
		$client = new Jetpack_IXR_Client();

		$error = $client->get_jetpack_error( -10520, 'Jetpack: [invalid_token] The token is not valid' );

		$this->assertSame( 'invalid_token', $error->get_error_code() );
		$this->assertSame( 'The token is not valid', $error->get_error_message() );
		$this->assertSame( -10520, $error->get_error_data() );
	}

	/**
	 * Test that get_jetpack_error() falls back to an IXR_-prefixed code when the fault string
	 * doesn't follow the `Jetpack: [code] message` convention.
	 */
	public function test_get_jetpack_error_falls_back_for_a_foreign_fault_string() {
		$client = new Jetpack_IXR_Client();

		$error = $client->get_jetpack_error( -32300, 'transport error - HTTP status code was not 200' );

		$this->assertSame( 'IXR_-32300', $error->get_error_code() );
		$this->assertSame( 'transport error - HTTP status code was not 200', $error->get_error_message() );
	}
}
