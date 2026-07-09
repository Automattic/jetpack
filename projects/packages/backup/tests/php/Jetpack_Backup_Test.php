<?php
/**
 * Unit tests for the Jetpack_Backup class.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use PHPUnit\Framework\TestCase;
use WP_Error;
use WP_REST_Response;

class Jetpack_Backup_Test extends TestCase {

	/**
	 * Captured request URL from the most recent mocked HTTP request.
	 *
	 * @var string
	 */
	private $captured_url = '';

	public function test_get_backup_capabilities_handles_wp_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$result = Jetpack_Backup::get_backup_capabilities();

		$this->assertNull( $result );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );
	}

	public function test_get_recent_backups_handles_wp_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$result = Jetpack_Backup::get_recent_backups();

		$this->assertNull( $result );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );
	}

	public function test_get_recent_restores_handles_wp_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$result = Jetpack_Backup::get_recent_restores();

		$this->assertNull( $result );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );
	}

	public function test_list_backup_events_returns_null_on_wp_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$result = Jetpack_Backup::list_backup_events();

		$this->assertNull( $result );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );
	}

	public function test_list_backup_events_returns_null_on_non_200() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_server_error' ) );

		$result = Jetpack_Backup::list_backup_events();

		$this->assertNull( $result );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_server_error' ) );
	}

	public function test_list_backup_events_returns_response_and_pins_backup_actions_on_success() {
		$this->captured_url = '';

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'backup_events_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10, 2 );
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_activity_collection' ), 10, 3 );

		// Caller-supplied `action` must be overridden with the curated backup list.
		$result = Jetpack_Backup::list_backup_events(
			array(
				'action' => 'should_be_overridden',
				'number' => 5,
			)
		);

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_activity_collection' ) );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ) );
		wp_set_current_user( 0 );

		$this->assertInstanceOf( WP_REST_Response::class, $result );
		$data = $result->get_data();
		$this->assertSame( 'OrderedCollection', $data['type'] );
		$this->assertSame( 1, $data['totalItems'] );

		$this->assertStringContainsString( 'backup_complete_full', $this->captured_url );
		$this->assertStringNotContainsString( 'should_be_overridden', $this->captured_url );
		$this->assertStringContainsString( 'number=5', urldecode( $this->captured_url ) );
	}

	/**
	 * Mock a Jetpack user connection so wpcom-as-user requests are signed.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function mock_jetpack_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'test.blogtoken';
			case 'id':
				return '999';
			case 'user_tokens':
				$user_id = get_current_user_id();
				if ( $user_id ) {
					return array(
						$user_id => sprintf( 'token%d.secret%d.%d', $user_id, $user_id, $user_id ),
					);
				}
		}

		return $value;
	}

	/**
	 * Mock the HTTP request to return a WP_Error.
	 *
	 * @return WP_Error
	 */
	public function mock_request_as_wp_error() {
		return new WP_Error( 'http_request_failed', 'The request failed.' );
	}

	/**
	 * Mock the HTTP request to return a 500 response.
	 *
	 * @return array
	 */
	public function mock_request_as_server_error() {
		return array(
			'response' => array( 'code' => 500 ),
			'body'     => '',
		);
	}

	/**
	 * Mock the HTTP request to return a 200 ActivityStreams collection and
	 * capture the requested URL.
	 *
	 * @param false  $preempt     Short-circuit value (unused).
	 * @param array  $parsed_args Request args (unused).
	 * @param string $url         The request URL.
	 * @return array
	 */
	public function mock_request_as_activity_collection( $preempt, $parsed_args, $url ) {
		$this->captured_url = (string) $url;

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode(
				array(
					'type'         => 'OrderedCollection',
					'totalItems'   => 1,
					'orderedItems' => array(
						array(
							'published'     => '2026-05-15T00:00:00+00:00',
							'rewind_id'     => '1747267200.123456',
							'is_rewindable' => true,
							'name'          => 'backup_complete_full',
							'status'        => 'success',
							'summary'       => 'Backup complete',
						),
					),
				),
				JSON_UNESCAPED_SLASHES
			),
		);
	}
}
