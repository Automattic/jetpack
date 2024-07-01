<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Unit tests for the Connection Plugin Storage class.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Connection\Plugin_Storage
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sync\Settings as Sync_Settings;
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
		Sync_Settings::update_settings( array( 'disable' => true ) );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		unset( $_SERVER['REQUEST_METHOD'] );
		$this->http_request_attempted = false;
		Constants::clear_constants();
		WorDBless_Options::init()->clear_options();
		// Reset private static properties after each test.
		$reflection_class = new \ReflectionClass( '\Automattic\Jetpack\Connection\Plugin_Storage' );
		try {
			$reflection_class->setStaticPropertyValue( 'configured', false );
			$reflection_class->setStaticPropertyValue( 'plugins', array() );
		} catch ( \ReflectionException $e ) { // PHP 7 compat
			$configured = $reflection_class->getProperty( 'configured' );
			$configured->setAccessible( true );
			$configured->setValue( false );

			$plugins = $reflection_class->getProperty( 'plugins' );
			$plugins->setAccessible( true );
			$plugins->setValue( array() );
		}
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
	 * Unit test for the `Plugin_Storage::configure()` method.
	 *
	 * @covers Automattic\Jetpack\Connection\Plugin_Storage::set_flag_to_refresh_active_connected_plugins
	 */
	public function test_setting_flag_on_active_plugins_option_update() {
		Plugin_Storage::configure();
		do_action( 'update_option_active_plugins' );
		$this->assertNotFalse( get_transient( Plugin_Storage::ACTIVE_PLUGINS_REFRESH_FLAG ) );
	}

	/**
	 * Unit test for the `Plugin_Storage::maybe_update_active_connected_plugins()` method.
	 *
	 * @covers Automattic\Jetpack\Connection\Plugin_Storage::maybe_update_active_connected_plugins
	 */
	public function test_maybe_update_active_connected_plugins_not_configured() {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		Plugin_Storage::upsert( 'dummy-slug' );
		set_transient( Plugin_Storage::ACTIVE_PLUGINS_REFRESH_FLAG, microtime() );
		$_SERVER['REQUEST_METHOD'] = 'POST';

		add_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10, 3 );
		Plugin_Storage::maybe_update_active_connected_plugins();
		remove_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10 );

		$this->assertFalse( $this->http_request_attempted );
		$this->assertEmpty( get_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME ) );
	}

	/**
	 * Unit test for the `Plugin_Storage::maybe_update_active_connected_plugins()` method.
	 *
	 * @covers Automattic\Jetpack\Connection\Plugin_Storage::maybe_update_active_connected_plugins
	 */
	public function test_maybe_update_active_connected_plugins_flag_not_set() {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		Plugin_Storage::upsert( 'dummy-slug' );
		Plugin_Storage::configure();
		$_SERVER['REQUEST_METHOD'] = 'POST';

		add_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10, 3 );
		Plugin_Storage::maybe_update_active_connected_plugins();
		remove_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10 );

		$this->assertFalse( $this->http_request_attempted );
		$this->assertEmpty( get_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME ) );
	}

	/**
	 * Unit test for the `Plugin_Storage::maybe_update_active_connected_plugins()` method.
	 *
	 * @covers Automattic\Jetpack\Connection\Plugin_Storage::maybe_update_active_connected_plugins
	 */
	public function test_maybe_update_active_connected_plugins_non_post_request() {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		Plugin_Storage::upsert( 'dummy-slug' );
		Plugin_Storage::configure();
		set_transient( Plugin_Storage::ACTIVE_PLUGINS_REFRESH_FLAG, microtime() );

		add_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10, 3 );
		Plugin_Storage::maybe_update_active_connected_plugins();
		remove_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10 );

		$this->assertFalse( $this->http_request_attempted );
		$this->assertEmpty( get_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME ) );
	}

	/**
	 * Unit test for the `Plugin_Storage::maybe_update_active_connected_plugins()` method.
	 *
	 * @covers Automattic\Jetpack\Connection\Plugin_Storage::maybe_update_active_connected_plugins
	 */
	public function test_maybe_update_active_connected_plugins_success() {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		Plugin_Storage::upsert( 'dummy-slug' );
		Plugin_Storage::configure();
		set_transient( Plugin_Storage::ACTIVE_PLUGINS_REFRESH_FLAG, microtime() );
		$_SERVER['REQUEST_METHOD'] = 'POST';

		add_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10, 3 );
		Plugin_Storage::maybe_update_active_connected_plugins();
		remove_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10 );

		$this->assertTrue( $this->http_request_attempted );
		$expected_stored_value = array( 'dummy-slug' => array() );
		$this->assertEquals( $expected_stored_value, get_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME ) );
	}

	/**
	 * Unit test for the `Plugin_Storage::maybe_update_active_connected_plugins()` method.
	 *
	 * @covers Automattic\Jetpack\Connection\Plugin_Storage::maybe_update_active_connected_plugins
	 */
	public function test_maybe_update_active_connected_plugins_success_same_plugins() {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );
		$stored_value = array( 'dummy-slug' => array() );
		update_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME, $stored_value );

		Plugin_Storage::upsert( 'dummy-slug' );
		Plugin_Storage::configure();

		set_transient( Plugin_Storage::ACTIVE_PLUGINS_REFRESH_FLAG, microtime() );
		$_SERVER['REQUEST_METHOD'] = 'POST';

		add_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10, 3 );
		Plugin_Storage::maybe_update_active_connected_plugins();
		remove_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10 );

		$this->assertFalse( $this->http_request_attempted );
		$this->assertEquals( $stored_value, get_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME ) );
	}

	/**
	 * Unit test for the `Plugin_Storage::maybe_update_active_connected_plugins()` method.
	 *
	 * @covers Automattic\Jetpack\Connection\Plugin_Storage::maybe_update_active_connected_plugins
	 */
	public function test_maybe_update_active_connected_plugins_success_same_count_different_plugins() {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );
		update_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME, array( 'dummy-slug2' => array() ) );

		Plugin_Storage::upsert( 'dummy-slug' );
		Plugin_Storage::configure();

		set_transient( Plugin_Storage::ACTIVE_PLUGINS_REFRESH_FLAG, microtime() );
		$_SERVER['REQUEST_METHOD'] = 'POST';

		add_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10, 3 );
		Plugin_Storage::maybe_update_active_connected_plugins();
		remove_filter( 'pre_http_request', array( $this, 'intercept_remote_request' ), 10 );

		$this->assertTrue( $this->http_request_attempted );
		$expected_stored_value = array( 'dummy-slug' => array() );
		$this->assertEquals( $expected_stored_value, get_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME ) );
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
