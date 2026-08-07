<?php
/**
 * Testing of the `Client` methods that build and make outgoing signed requests.
 *
 * Note the file name: this class must not sort ahead of the first test class in the suite.
 * Several classes (ManagerIntegrationTest, ManagerTest, Jetpack_XMLRPC_Server_Test) depend on
 * being preceded by a class that leaves `Manager`'s memoized connection status invalidatable,
 * and displacing the first class breaks them.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Jetpack_Options;
use WorDBless\BaseTestCase;

/**
 * Testing of the `Client` methods that build and make outgoing signed requests.
 */
class Remote_Request_Test extends BaseTestCase {

	/**
	 * Error_Handler instance.
	 *
	 * @var Error_Handler
	 */
	private $error_handler;

	/**
	 * Initialize tests.
	 */
	public function set_up() {
		$this->error_handler = Error_Handler::get_instance();

		// The reporting gate is per error code and lives for an hour; tests assert on the
		// stored result, not on the gate.
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_connection_bypass_error_reporting_gate' );

		// `Client::build_signed_request()` registers this filter on every call and never
		// removes it; left in place it changes how constants resolve for later tests.
		remove_all_filters( 'jetpack_constant_default_value' );
		Constants::clear_constants();

		$this->error_handler->delete_all_errors();

		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'user_tokens' );

		// `Manager::is_connected()` memoizes its result and hook registration.
		// Reset both so later tests can re-register the hooks and invalidate the cache.
		$manager_reflection = new \ReflectionClass( Manager::class );
		foreach ( array(
			'is_connected'                  => null,
			'connection_invalidators_added' => false,
		) as $name => $value ) {
			$static = $manager_reflection->getProperty( $name );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$static->setAccessible( true );
			}
			$static->setValue( null, $value );
		}

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
	 * Test that a request that cannot be signed reports why, rather than a generic code.
	 *
	 * `Tokens::get_access_token()` distinguishes eight reasons a token cannot be loaded, and
	 * `build_signed_request()` asks for them instead of collapsing them into `missing_token`.
	 */
	public function test_build_signed_request_returns_the_specific_token_error() {
		$result = Client::build_signed_request( array( 'url' => 'https://example.org/' ) );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'no_possible_tokens', $result->get_error_code() );
	}

	/**
	 * Test the same for a user token, which fails on a different branch.
	 */
	public function test_build_signed_request_returns_the_specific_user_token_error() {
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123' );

		$result = Client::build_signed_request(
			array(
				'url'     => 'https://example.org/',
				'user_id' => 12,
			)
		);

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'no_user_tokens', $result->get_error_code() );
	}

	/**
	 * Test that a signing failure is reported to the Error_Handler.
	 *
	 * The request is never sent, so it has no response for `check_api_response_for_errors()`
	 * to inspect; `remote_request()` reports the signing failure itself.
	 */
	public function test_remote_request_reports_a_signing_failure() {
		$result = Client::remote_request( array( 'url' => 'https://example.org/wp-json/' ) );

		$this->assertInstanceOf( 'WP_Error', $result );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertArrayHasKey( 'no_possible_tokens', $stored_errors );

		// No token was found, so there's nothing to attribute the error to a specific user
		// with; it falls back to the request's $user_id (defaulted to 0, i.e. site-level).
		$stored = $stored_errors['no_possible_tokens']['0'];

		$this->assertSame( Error_Handler::ERROR_TYPE_REST, $stored['error_type'] );
		$this->assertSame( Error_Handler::DIRECTION_OUTGOING, $stored['error_direction'] );
		$this->assertSame( 'https://example.org/wp-json/', $stored['error_data']['url'] );
	}

	/**
	 * Test that an outgoing XML-RPC request is reported as such.
	 */
	public function test_remote_request_reports_a_signing_failure_as_xmlrpc() {
		$result = Client::remote_request( array( 'url' => 'https://jetpack.wordpress.com/xmlrpc.php' ) );

		$this->assertInstanceOf( 'WP_Error', $result );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertArrayHasKey( 'no_possible_tokens', $stored_errors );
		$this->assertSame( Error_Handler::ERROR_TYPE_XMLRPC, $stored_errors['no_possible_tokens']['0']['error_type'] );
	}

	/**
	 * Test that reporting a signing failure surfaces a notice.
	 *
	 * `no_possible_tokens` is on the displayable list, and a request with no explicit
	 * `user_id` is attributed to the site (user ID 0), so it is not skipped by the
	 * 'invalid'-attribution guard in the display pipeline.
	 */
	public function test_a_reported_signing_failure_is_displayed() {
		Client::remote_request( array( 'url' => 'https://example.org/wp-json/' ) );

		$displayable = $this->error_handler->get_displayable_errors();

		$this->assertArrayHasKey( 'no_possible_tokens', $displayable );
		$this->assertSame( 'site', $displayable['no_possible_tokens']['0']['audience'] );
	}
}
