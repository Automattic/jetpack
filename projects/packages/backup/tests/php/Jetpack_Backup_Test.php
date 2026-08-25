<?php
/**
 * Unit tests for the Jetpack_Backup class.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use PHPUnit\Framework\Attributes\DataProvider;
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

	/**
	 * Body for the next mocked product-catalogue response. Null means
	 * "the well-formed catalogue".
	 *
	 * @var string|null
	 */
	private $catalogue_body = null;

	/**
	 * Status for the next mocked product-catalogue response.
	 *
	 * @var int|string
	 */
	private $catalogue_status = 200;

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
	 * A 200 carrying the promoted product returns it.
	 */
	public function test_promoted_product_info_returns_the_promoted_product() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ), 10, 3 );

		$result = Jetpack_Backup::get_backup_promoted_product_info();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ) );

		$this->assertIsObject( $result );
		$this->assertSame( 539.4, $result->cost );
		$this->assertSame( 'BRL', $result->currency_code );
	}

	/**
	 * The transport may report the status as a numeric string, which a
	 * strict comparison against the integer 200 sends down the failure
	 * path — reporting a perfectly good catalogue as unreachable.
	 */
	public function test_promoted_product_info_treats_a_string_status_as_its_number() {
		$this->catalogue_status = '200';
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ), 10, 3 );

		$result = Jetpack_Backup::get_backup_promoted_product_info();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ) );

		$this->assertIsObject( $result );
		$this->assertSame( 'BRL', $result->currency_code );
	}

	/**
	 * A 200 whose body will not decode is refused rather than read
	 * through. `json_decode` returns null there, and reading a property
	 * off it warns and evaluates to null — so the route answered 200 with
	 * `null`, which no caller can tell from a price it could not parse.
	 *
	 * @param string $label Human-readable case name.
	 * @param string $body  The response body.
	 * @dataProvider provide_unreadable_catalogues
	 */
	#[DataProvider( 'provide_unreadable_catalogues' )]
	public function test_promoted_product_info_refuses_an_unreadable_catalogue( $label, $body ) {
		$this->catalogue_body = $body;
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ), 10, 3 );

		$result = Jetpack_Backup::get_backup_promoted_product_info();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ) );

		$this->assertInstanceOf( WP_Error::class, $result, $label );
		$this->assertSame( 'promoted_product_unreadable', $result->get_error_code(), $label );
		$this->assertSame( 500, $result->get_error_data()['status'], $label );
	}

	/**
	 * Bodies a 200 can carry that hold no promoted product.
	 *
	 * The absent-slug cases are not hypothetical: the slug is a constant
	 * here but a catalogue entry upstream, so retiring it there produces
	 * exactly this — a 200, a well-formed catalogue, and no key.
	 *
	 * @return array[]
	 */
	public static function provide_unreadable_catalogues() {
		return array(
			array( 'an empty body', '' ),
			array( 'a gateway HTML page', '<html><body>502</body></html>' ),
			array( 'a truncated document', '{"jetpack_backup_t1_yearly":' ),
			array( 'JSON null', 'null' ),
			array( 'a JSON list', '[]' ),
			array( 'a catalogue without the promoted slug', '{"jetpack_scan":{"cost":10}}' ),
			array( 'the promoted slug set to null', '{"jetpack_backup_t1_yearly":null}' ),
		);
	}

	/**
	 * A non-200 is reported with the upstream status, not a generic one.
	 *
	 * 403 and not 500 deliberately. 500 is also what the no-status
	 * fallback produces, so asserting it here would pass whether or not
	 * the status was forwarded at all — and would leave this testing the
	 * same thing as the transport-failure case below.
	 */
	public function test_promoted_product_info_forwards_a_non_200() {
		$this->catalogue_status = 403;
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ), 10, 3 );

		$result = Jetpack_Backup::get_backup_promoted_product_info();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'failed_to_fetch_data', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	/**
	 * A transport failure has no status at all. Reporting the 0 that
	 * casting produces leaves the REST layer with no status to serve.
	 */
	public function test_promoted_product_info_reports_a_transport_failure_as_500() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$result = Jetpack_Backup::get_backup_promoted_product_info();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 500, $result->get_error_data()['status'] );
	}

	/**
	 * Mock the product catalogue endpoint.
	 *
	 * @param false  $preempt     Short-circuit value (unused).
	 * @param array  $parsed_args Request args (unused).
	 * @param string $url         The request URL.
	 * @return array
	 */
	public function mock_request_as_product_catalogue( $preempt, $parsed_args, $url ) {
		$this->captured_url = (string) $url;

		$body = $this->catalogue_body;

		if ( null === $body ) {
			$body = wp_json_encode(
				array(
					'jetpack_backup_t1_yearly' => array(
						'cost'               => 539.4,
						'currency_code'      => 'BRL',
						'introductory_offer' => array(
							'interval_unit'     => 'year',
							'interval_count'    => 1,
							'cost_per_interval' => 275.4,
						),
					),
				),
				JSON_UNESCAPED_SLASHES
			);
		}

		return array(
			'response' => array( 'code' => $this->catalogue_status ),
			'body'     => $body,
		);
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
