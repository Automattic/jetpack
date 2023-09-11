<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Unit tests for the Connection Plugin Storage class.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Connection\Plugin_Storage
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * Unit tests for the Connection Plugin Storage class.
 *
 * @see \Automattic\Jetpack\Connection\Plugin_Storage
 */
class Test_Plugin_Storage extends TestCase {

	/**
	 * Whether an http request to the jetpack-active-connected-plugins endoint was attempted.
	 *
	 * @var bool
	 */
	private $http_request_attempted = false;

	/**
	 * Setting up the testing environment.
	 *
	 * @before
	 */
	public function set_up() {
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		$this->http_request_attempted = false;
		Constants::clear_constants();
		WorDBless_Options::init()->clear_options();
	}

	/**
	 * Unit test for the `Plugin_Storage::update_active_plugins_option()` method.
	 *
	 * @covers Automattic\Jetpack\Connection\Plugin_Storage::update_active_plugins_option
	 */
	public function test_update_active_plugins_option_without_sync_will_trigger_fallback() {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		add_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10, 3 );
		Plugin_Storage::update_active_plugins_option();
		remove_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10 );
		$this->assertTrue( $this->http_request_attempted );
	}

	/**
	 * Unit test for the `Plugin_Storage::update_active_plugins_option()` method.
	 *
	 * @covers Automattic\Jetpack\Connection\Plugin_Storage::update_active_plugins_option
	 */
	public function test_update_active_plugins_option_without_sync_fallback_will_return_early_if_not_connected() {
		add_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10, 3 );
		Plugin_Storage::update_active_plugins_option();
		remove_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10 );
		$this->assertFalse( $this->http_request_attempted );
	}

	/**
	 * Intercept remote HTTP request to WP.com, and mock the response.
	 * Should be hooked on the `pre_http_request` filter.
	 *
	 * @param false  $preempt A preemptive return value of an HTTP request.
	 * @param array  $args The request arguments.
	 * @param string $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_remote_request( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->http_request_attempted = true;

		return array(
			'success' => true,
		);
	}
}
