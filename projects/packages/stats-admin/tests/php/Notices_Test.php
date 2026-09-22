<?php

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;

/**
 * Unit tests for the Notice class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Notices_Test extends Stats_TestCase {
	/**
	 * Holds the Notices instance.
	 *
	 * @var Notices
	 */
	protected static $notices;

	/**
	 * The notices response override owned by the current test.
	 *
	 * @var \Closure|null
	 */
	private $forced_notices_filter;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		Stats_Options::set_option( 'enable_odyssey_stats', true );
		Stats_Options::set_option( 'notices', array() );
		Stats_Options::set_option( 'views', 0 );
		self::$notices = new Notices();
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		if ( $this->forced_notices_filter ) {
			remove_filter( 'pre_http_request', $this->forced_notices_filter, 11 );
			$this->forced_notices_filter = null;
		}
		parent::tearDown();
	}

	/**
	 * Test opt out new stats show.
	 */
	public function test_opt_out_new_stats_show() {
		$this->assertTrue( self::$notices->get_notices_to_show()['opt_out_new_stats'] );

		Stats_Options::set_option( 'views', 2 );
		$this->assertTrue( self::$notices->get_notices_to_show()['opt_out_new_stats'] );

		Stats_Options::set_option( 'views', 3 );
		$this->assertFalse( self::$notices->get_notices_to_show()['opt_out_new_stats'] );
	}

	/**
	 * Test new stats feedback notice show.
	 */
	public function test_new_stats_feedback_notice_show() {
		Stats_Options::set_option( 'views', 3 );
		$this->assertTrue( self::$notices->get_notices_to_show()['new_stats_feedback'] );
	}

	/**
	 * Test opt in new stats notice show.
	 */
	public function test_opt_in_new_stats_notice_show() {
		Stats_Options::set_option( 'enable_odyssey_stats', false );
		Stats_Options::set_option( 'odyssey_stats_changed_at', time() - 31 * DAY_IN_SECONDS );
		$this->assertTrue( self::$notices->get_notices_to_show()['opt_in_new_stats'] );
	}

	/**
	 * Test opt in new stats notice show.
	 */
	public function test_traffic_page_settings_hidden() {
		$this->assertFalse( self::$notices->get_notices_to_show()['traffic_page_settings'] );
	}

	/**
	 * Test the default response is still a flat map of booleans.
	 */
	public function test_plain_get_returns_flat_booleans() {
		$notices = self::$notices->get_notices_to_show();

		foreach ( array( 'opt_in_new_stats', 'opt_out_new_stats', 'new_stats_feedback', 'gdpr_cookie_consent', 'traffic_page_settings' ) as $id ) {
			$this->assertIsBool( $notices[ $id ], "$id should be a bare boolean" );
		}
	}

	/**
	 * Test the locally-computed notices are wrapped in the detail shape.
	 */
	public function test_details_mode_wraps_local_notices() {
		$notices = self::$notices->get_notices_to_show( true );

		$this->assertSame(
			array(
				'show'            => true,
				'status'          => null,
				'postponed_count' => 0,
				'next_show_at'    => null,
			),
			$notices['opt_out_new_stats']
		);
	}

	/**
	 * Test a local notice takes its escalation fields from the matching WPCOM record.
	 */
	public function test_details_mode_sources_escalation_fields_from_wpcom() {
		Stats_Options::set_option( 'views', 3 );

		$record = self::$notices->get_notices_to_show( true )['new_stats_feedback'];

		// The fixture hides this one on WPCOM, so the locally-computed flag has to follow.
		$this->assertFalse( $record['show'] );
		$this->assertSame( 'postponed', $record['status'] );
		$this->assertSame( 1, $record['postponed_count'] );
		$this->assertSame( 1788000000, $record['next_show_at'] );
	}

	/**
	 * Test a notice WPCOM owns outright keeps its own fields.
	 */
	public function test_details_mode_keeps_wpcom_only_notice_fields() {
		$record = self::$notices->get_notices_to_show( true )['traffic_page_settings'];

		$this->assertFalse( $record['show'] );
		$this->assertSame( 'dismissed', $record['status'] );
		$this->assertSame( 2, $record['postponed_count'] );
	}

	/**
	 * Test a WPCOM that ignores `include_details` still yields one shape, not a mix.
	 */
	public function test_details_mode_normalizes_a_flat_wpcom_response() {
		$this->force_wpcom_notices( '{"traffic_page_settings":false,"legacy_only_notice":true}' );

		$notices = self::$notices->get_notices_to_show( true );

		foreach ( $notices as $id => $record ) {
			$this->assertIsArray( $record, "$id should be a detail record" );
			$this->assertArrayHasKey( 'show', $record );
		}

		// The flat flag has to survive the normalization, in both directions.
		$this->assertTrue( $notices['legacy_only_notice']['show'] );
		$this->assertFalse( $notices['traffic_page_settings']['show'] );
		$this->assertSame( 0, $notices['legacy_only_notice']['postponed_count'] );
	}

	/**
	 * Test a local notice keeps its locally-computed visibility when WPCOM answers flat.
	 */
	public function test_details_mode_keeps_local_visibility_over_a_flat_response() {
		$this->force_wpcom_notices( '{"opt_out_new_stats":true}' );
		Stats_Options::set_option( 'views', 3 );

		// Three views puts this one past its window, whatever WPCOM says about the dismissal.
		$this->assertFalse( self::$notices->get_notices_to_show( true )['opt_out_new_stats']['show'] );
	}

	/**
	 * Test a malformed `next_show_at` is reported as unscheduled rather than as 1970.
	 */
	public function test_details_mode_rejects_a_non_numeric_next_show_at() {
		$this->force_wpcom_notices( '{"new_stats_feedback":{"show":false,"status":"postponed","postponed_count":1,"next_show_at":"soon"}}' );

		$this->assertNull( self::$notices->get_notices_to_show( true )['new_stats_feedback']['next_show_at'] );
	}

	/**
	 * Test a failed WPCOM fetch drops the notices WPCOM owns instead of inventing records.
	 */
	public function test_details_mode_drops_wpcom_notices_when_the_fetch_fails() {
		$this->fail_wpcom_notices();

		$notices = self::$notices->get_notices_to_show( true );

		// Every escalating notice is WPCOM's, so dropping them leaves the client with no record
		// rather than a fabricated postponed_count 0 it would read as a first dismissal.
		$this->assertArrayNotHasKey( 'traffic_page_settings', $notices );
		$this->assertCount( 4, $notices );
		$this->assertSame(
			array( 'show', 'status', 'postponed_count', 'next_show_at' ),
			array_keys( $notices['opt_out_new_stats'] )
		);
	}

	/**
	 * Answer the notices endpoint with a given body. Runs after the shared fixture, which
	 * replaces whatever it was handed rather than passing it along.
	 *
	 * @param string $body The JSON body WPCOM should appear to return.
	 */
	private function force_wpcom_notices( string $body ) {
		$this->intercept_wpcom_notices(
			array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => $body,
			)
		);
	}

	/**
	 * Make the notices request fail at the transport layer.
	 */
	private function fail_wpcom_notices() {
		$this->intercept_wpcom_notices( new \WP_Error( 'http_request_failed', 'timeout' ) );
	}

	/**
	 * Answer the notices request with a fixed result.
	 *
	 * @param array|\WP_Error $result What the notices request should return.
	 */
	private function intercept_wpcom_notices( $result ) {
		$this->forced_notices_filter = static function ( $response, $args, $url ) use ( $result ) {
			return strpos( $url, '/jetpack-stats-dashboard/notices' ) === false ? $response : $result;
		};

		add_filter( 'pre_http_request', $this->forced_notices_filter, 11, 3 );
	}

	/**
	 * Test a notice with no WPCOM record at all still gets the default escalation fields.
	 */
	public function test_details_mode_defaults_when_wpcom_has_no_record() {
		$this->assertSame(
			array(
				'show'            => false,
				'status'          => null,
				'postponed_count' => 0,
				'next_show_at'    => null,
			),
			self::$notices->get_notices_to_show( true )['gdpr_cookie_consent']
		);
	}

	/**
	 * Test the two response shapes are cached apart, so neither can be served for the other.
	 */
	public function test_flat_and_details_responses_use_separate_caches() {
		self::$notices->get_notices_to_show();
		self::$notices->get_notices_to_show( true );

		$flat    = (array) json_decode( (string) get_transient( Notices::STATS_DASHBOARD_NOTICES_CACHE_KEY ), true );
		$details = (array) json_decode( (string) get_transient( Notices::STATS_DASHBOARD_NOTICES_DETAILS_CACHE_KEY ), true );

		$this->assertArrayHasKey( 'traffic_page_settings', $flat );
		$this->assertArrayHasKey( 'traffic_page_settings', $details );
		$this->assertIsBool( $flat['traffic_page_settings'] );
		$this->assertIsArray( $details['traffic_page_settings'] );
	}

	/**
	 * Test a dismissal clears both cached shapes, not just the flat one.
	 */
	public function test_update_notice_clears_both_caches() {
		self::$notices->get_notices_to_show();
		self::$notices->get_notices_to_show( true );
		$this->assertNotFalse( get_transient( Notices::STATS_DASHBOARD_NOTICES_CACHE_KEY ) );
		$this->assertNotFalse( get_transient( Notices::STATS_DASHBOARD_NOTICES_DETAILS_CACHE_KEY ) );

		self::$notices->update_notice( 'new_stats_feedback', 'postponed', 2592000 );

		$this->assertFalse( get_transient( Notices::STATS_DASHBOARD_NOTICES_CACHE_KEY ) );
		$this->assertFalse( get_transient( Notices::STATS_DASHBOARD_NOTICES_DETAILS_CACHE_KEY ) );
	}
}
