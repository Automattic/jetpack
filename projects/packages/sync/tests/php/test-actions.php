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
	 * Tests reset_sync_locks method.
	 */
	public function test_reset_sync_locks() {
		update_option( Sender::NEXT_SYNC_TIME_OPTION_NAME . '_sync', 'dummy' );
		update_option( Sender::NEXT_SYNC_TIME_OPTION_NAME . '_full_sync', 'dummy' );
		update_option( Sender::NEXT_SYNC_TIME_OPTION_NAME . '_full-sync-enqueue', 'dummy' );
		// Retry after locks.
		update_option( Actions::RETRY_AFTER_PREFIX . 'sync', 'dummy' );
		update_option( Actions::RETRY_AFTER_PREFIX . 'full_sync', 'dummy' );
		// Dedicated sync lock.
		\Jetpack_Options::update_raw_option( Dedicated_Sender::DEDICATED_SYNC_REQUEST_LOCK_OPTION_NAME, 'dummy' );
		// Queue locks.
		$sync_queue = new Queue( 'sync' );
		$this->assertTrue( $sync_queue->lock() );
		$full_sync_queue = new Queue( 'full_sync' );
		$this->assertTrue( $full_sync_queue->lock() );
		// Lock for disabling Sync sending temporarily.
		set_transient( Sender::TEMP_SYNC_DISABLE_TRANSIENT_NAME, time() );

		Actions::reset_sync_locks();

		$this->assertFalse( get_option( Sender::NEXT_SYNC_TIME_OPTION_NAME . '_sync' ) );
		$this->assertFalse( get_option( Sender::NEXT_SYNC_TIME_OPTION_NAME . '_full_sync' ) );
		$this->assertFalse( get_option( Sender::NEXT_SYNC_TIME_OPTION_NAME . '_full-sync-enqueue' ) );
		$this->assertFalse( get_option( Actions::RETRY_AFTER_PREFIX . 'sync' ) );
		$this->assertFalse( get_option( Actions::RETRY_AFTER_PREFIX . 'full_sync' ) );
		$this->assertFalse( $sync_queue->is_locked() );
		$this->assertFalse( $full_sync_queue->is_locked() );
		$this->assertFalse( get_transient( Sender::TEMP_SYNC_DISABLE_TRANSIENT_NAME ) );
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
	 * Data provider for test_send_data_with_wpcom_rest_api_enabled.
	 *
	 * @return array The test data.
	 */
	public function send_data_with_wpcom_rest_api_enabled_data_provider() {
		return array(
			'successful_response'               => array(
				'data'     => array(
					'dummy' => 'encoded_dummy',
				),
				'callback' => function () {
					return array(
						'response'    => array(
							'code' => 200,
						),
						'status_code' => 200,
						'body'        => wp_json_encode(
							array(
								'processed_items' => array( 'dummy' ),
							)
						),
					);
				},
				'expected' => array( 'dummy' ),
			),
			'success_response_unable_to_decode' => array(
				'data'     => array(
					'dummy' => 'encoded_dummy',
				),
				'callback' => function () {
					return array(
						'response'    => array(
							'code' => 200,
						),
						'status_code' => 200,
						'body'        => 'not a json',
					);
				},
				'expected' => new \WP_Error( 'sync_rest_api_response_decoding_failed', 'Sync REST API response decoding failed', 'not a json' ),
			),
			'wp_error_response'                 => array(
				'data'     => array(
					'dummy' => 'encoded_dummy',
				),
				'callback' => function () {
					return new \WP_Error( 'http_request_failed', 'A connection issue occurred', array( 'status' => 500 ) );
				},
				'expected' => new \WP_Error( 'http_request_failed', 'A connection issue occurred', array( 'status' => 500 ) ),
			),
			'api_error_response'                => array(
				'data'     => array(
					'dummy' => 'encoded_dummy',
				),
				'callback' => function () {
					return array(
						'response'    => array(
							'code' => 400,
						),
						'status_code' => 400,
						'body'        => wp_json_encode(
							array(
								'code'    => 'rest_invalid_param',
								'message' => 'Invalid parameter(s): sync',
								'data'    => array( 'status' => 400 ),
							)
						),
					);
				},
				'expected' => new \WP_Error( 'jetpack_sync_send_error_rest_invalid_param', 'Invalid parameter(s): sync', array( 'status' => 400 ) ),
			),
		);
	}

	/**
	 * Tests send_data with wpcom_rest_api_enabled setting enabled.
	 *
	 * @dataProvider send_data_with_wpcom_rest_api_enabled_data_provider
	 * @param array    $data The data to send.
	 * @param callable $callback The callback to use for the pre_http_request filter.
	 * @param mixed    $expected The expected result.
	 */
	public function test_send_data_with_wpcom_rest_api_enabled( $data, $callback, $expected ) {

		Settings::update_settings( array( 'wpcom_rest_api_enabled' => 1 ) );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		add_filter( 'pre_http_request', $callback, 10, 0 );
		$items = Actions::send_data( $data, 'dummy', microtime(), 'sync', 1, 1 );
		remove_filter( 'pre_http_request', $callback );

		$this->assertEquals( $expected, $items );
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
