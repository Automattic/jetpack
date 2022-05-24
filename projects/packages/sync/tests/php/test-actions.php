<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Constants;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * Unit tests for the Actions class.
 *
 * @package automattic/jetpack-sync
 */
class Test_Actions extends BaseTestCase {

	/**
	 * Set up before each test.
	 *
	 * @before
	 */
	public function set_up() {
		// Don't try to get options directly from the database.
		Constants::set_constant( 'JETPACK_DISABLE_RAW_OPTIONS', true );
		// Required for XML-RPC requests to work.
		Constants::set_constant( 'JETPACK__API_BASE', 'https://public-api.wordpress.com' );
		// Mock Site level connection.
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		\Jetpack_Options::update_option( 'id', 1 );

		// Setting the Dedicated Sync check transient here to avoid making a test
		// request every time dedicated Sync setting is updated.
		set_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT, 'OK' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		WorDBless_Options::init()->clear_options();
	}

	/**
	 * Tests the do_only_first_intitial_sync method when an initial sync has not been performed yet.
	 */
	public function test_do_only_first_intitial_sync_successful() {
		$this->assertNull( Actions::do_only_first_initial_sync() );
	}

	/**
	 * Tests the do_only_first_intitial_sync method when an initial sync has already been performed.
	 */
	public function test_do_only_first_intitial_sync_already_started() {
		$full_sync_option = array(
			'started'  => time(),
			'finished' => false,
			'progress' => array(),
			'config'   => array(),
		);
		update_option( Modules\Full_Sync_Immediately::STATUS_OPTION, $full_sync_option );

		$this->assertFalse( Actions::do_only_first_initial_sync() );
	}

	/**
	 * Tests send_data will update dedicated_sync_enabled setting when Jetpack-Dedicated-Sync header is off.
	 */
	public function test_send_data_with_jetpack_dedicated_sync_enabled_response_header_off() {
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_set_dedicated_sync_header_off' ), 10, 3 );
		Actions::send_data( array(), 'dummy', microtime(), 'sync', 0, 0 );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_set_dedicated_sync_header_off' ) );

		$this->assertFalse( Settings::is_dedicated_sync_enabled() );
	}

	/**
	 * Tests send_data will NOT update dedicated_sync_enabled setting when Jetpack-Dedicated-Sync header is off.
	 */
	public function test_send_data_without_jetpack_dedicated_sync_enabled_response_header_off() {
		add_filter( 'pre_http_request', array( $this, 'pre_http_request_set_dedicated_sync_header_off' ), 10, 3 );
		Actions::send_data( array(), 'dummy', microtime(), 'sync', 0, 0 );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_set_dedicated_sync_header_off' ) );

		$this->assertFalse( Settings::is_dedicated_sync_enabled() );
	}

	/**
	 * Tests send_data will update dedicated_sync_enabled setting when Jetpack-Dedicated-Sync header is on.
	 */
	public function test_send_data_without_jetpack_dedicated_sync_enabled_response_header_on() {
		set_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT, Dedicated_Sender::DEDICATED_SYNC_VALIDATION_STRING, 100 );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_set_dedicated_sync_header_on' ), 10, 3 );
		Actions::send_data( array(), 'dummy', microtime(), 'sync', 0, 0 );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_set_dedicated_sync_header_on' ) );

		delete_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT );

		$this->assertTrue( Settings::is_dedicated_sync_enabled() );
	}

	/**
	 * Tests send_data will NOT update dedicated_sync_enabled setting when Jetpack-Dedicated-Sync header is on.
	 */
	public function test_send_data_with_jetpack_dedicated_sync_enabled_response_header_on() {
		set_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT, Dedicated_Sender::DEDICATED_SYNC_VALIDATION_STRING, 100 );

		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_set_dedicated_sync_header_on' ), 10, 3 );
		Actions::send_data( array(), 'dummy', microtime(), 'sync', 0, 0 );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_set_dedicated_sync_header_on' ) );

		delete_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT );

		$this->assertTrue( Settings::is_dedicated_sync_enabled() );
	}

	/**
	 * Intercept jetpack.syncActions XML-RPC request and return 'Jetpack-Dedicated-Sync' header with value 'off'.
	 *
	 * @param false  $preempt A preemptive return value of an HTTP request.
	 * @param array  $args The request arguments.
	 * @param string $url The request URL.
	 *
	 * @return array
	 */
	public function pre_http_request_set_dedicated_sync_header_off( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array(
			'response'    => array(
				'code' => 200,
			),
			'status_code' => 200,
			'headers'     => array(
				'Jetpack-Dedicated-Sync' => 'off',
			),
		);
	}

	/**
	 * Intercept jetpack.syncActions XML-RPC request and return 'Jetpack-Dedicated-Sync' header with value 'on'.
	 *
	 * @param false  $preempt A preemptive return value of an HTTP request.
	 * @param array  $args The request arguments.
	 * @param string $url The request URL.
	 *
	 * @return array
	 */
	public function pre_http_request_set_dedicated_sync_header_on( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array(
			'response'    => array(
				'code' => 200,
			),
			'status_code' => 200,
			'body'        => '',
			'headers'     => array(
				'Jetpack-Dedicated-Sync' => 'on',
			),
		);
	}
}
