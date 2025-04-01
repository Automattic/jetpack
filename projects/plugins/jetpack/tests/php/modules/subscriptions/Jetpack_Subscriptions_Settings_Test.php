<?php

require_once JETPACK__PLUGIN_DIR . '/modules/subscriptions/class-settings.php';

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Modules\Subscriptions\Settings;

/**
 * Tests for Automattic\Jetpack\Modules\Subscriptions\Settings.
 */
class Jetpack_Subscriptions_Settings_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/** @var array Patchwork handles created by tests */
	private $patchwork_handles = array();

	/** @var string Transient key for storing site creation date. */
	private const CREATION_DATE_TRANSIENT = 'jetpack_subscriptions_site_creation';

	/**
	 * Restore Patchwork redefinitions after each test.
	 */
	public function tearDown(): void {
		if ( function_exists( '\Patchwork\restore' ) ) {
			foreach ( $this->patchwork_handles as $handle ) {
				\Patchwork\restore( $handle );
			}
		}
		$this->patchwork_handles = array(); // Reset for next test

		parent::tearDown();
	}

	/**
	 * Creates a mock Connection Manager instance.
	 */
	private function get_mock_manager( $is_connected = true ) {
		$mock_manager = $this->getMockBuilder( Manager::class )
							->disableOriginalConstructor()->onlyMethods( array( 'is_connected' ) )->getMock();
		$mock_manager->method( 'is_connected' )->willReturn( $is_connected );
		return $mock_manager;
	}

	/**
	 * Scenario: Comparison check with a date AFTER the cutoff.
	 */
	public function test_is_site_eligible_returns_true_for_recent_date() {
		$recent_date = new DateTimeImmutable( '2025-07-01 11:00:00', wp_timezone() );
		// Timezone mock is handled by set_up()

		$is_eligible = Settings::is_site_eligible_for_new_default( $recent_date );

		$this->assertTrue( $is_eligible );
	}

	/**
	 * Scenario: Comparison check with a date BEFORE the cutoff.
	 */
	public function test_is_site_eligible_returns_false_for_old_date() {
		$old_date = new DateTimeImmutable( '2024-01-01 11:00:00', wp_timezone() );

		$is_eligible = Settings::is_site_eligible_for_new_default( $old_date );

		$this->assertFalse( $is_eligible );
	}

	/**
	 * Scenario: Comparison check with the default '0000' date.
	 */
	public function test_is_site_eligible_returns_false_for_default_date() {
		$default_date = new DateTimeImmutable( '0000-00-00 00:00:00.000', wp_timezone() );

		$is_eligible = Settings::is_site_eligible_for_new_default( $default_date );

		$this->assertFalse( $is_eligible );
	}

	/**
	 * Scenario: WPCOM, Recent Date returned via mocked get_blog_details.
	 */
	public function test_get_wpcom_site_creation_date_returns_recent_date() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'WPCOM helper tests require a multisite environment.' );
		}
		// Check if Patchwork is available (still needed for get_current_blog_id mock)
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$recent_creation_date_string = '2025-08-01 12:00:00'; // Date AFTER cutoff
		$expected_date_object        = new DateTimeImmutable( $recent_creation_date_string, wp_timezone() );
		$test_blog_id                = 1;

		$this->patchwork_handles[] = \Patchwork\redefine(
			'get_current_blog_id',
			\Patchwork\always( $test_blog_id )
		);

		$mock_details              = new stdClass();
		$mock_details->registered  = $recent_creation_date_string;
		$this->patchwork_handles[] = \Patchwork\redefine(
			'get_blog_details',
			\Patchwork\always( $mock_details )
		);

		$result_date = Settings::get_wpcom_site_creation_date();

		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertEquals( $expected_date_object->getTimestamp(), $result_date->getTimestamp() );
	}

	/**
	 * Scenario: WPCOM, Old Date returned via mocked get_blog_details.
	 */
	public function test_get_wpcom_site_creation_date_returns_old_date() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'WPCOM helper tests require a multisite environment.' );
		}
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$old_creation_date_string = '2023-01-01 12:00:00'; // Date BEFORE cutoff
		$expected_date_object     = new DateTimeImmutable( $old_creation_date_string, wp_timezone() );
		$test_blog_id             = 1;

		$this->patchwork_handles[] = \Patchwork\redefine(
			'get_current_blog_id',
			\Patchwork\always( $test_blog_id )
		);

		$mock_details              = new stdClass();
		$mock_details->registered  = $old_creation_date_string;
		$this->patchwork_handles[] = \Patchwork\redefine(
			'get_blog_details',
			\Patchwork\always( $mock_details )
		);

		$result_date = Settings::get_wpcom_site_creation_date();

		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertEquals( $expected_date_object->getTimestamp(), $result_date->getTimestamp() );
	}

	/**
	 * Scenario: WPCOM, get_blog_details returns null.
	 */
	public function test_get_wpcom_site_creation_date_returns_default_date_if_details_null() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'WPCOM helper tests require a multisite environment.' );
		}
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$test_blog_id = 1;

		$this->patchwork_handles[] = \Patchwork\redefine(
			'get_current_blog_id',
			\Patchwork\always( $test_blog_id )
		);

		$this->patchwork_handles[] = \Patchwork\redefine(
			'get_blog_details',
			\Patchwork\always( null )
		);

		$result_date = Settings::get_wpcom_site_creation_date();

		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertLessThan( 0, $result_date->getTimestamp() );
	}

	/**
	 * Scenario: WPCOM, get_blog_details returns object without 'registered' property.
	 */
	public function test_get_wpcom_site_creation_date_returns_default_date_if_registered_missing() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'WPCOM helper tests require a multisite environment.' );
		}
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$test_blog_id = 1;

		$this->patchwork_handles[] = \Patchwork\redefine(
			'get_current_blog_id',
			\Patchwork\always( $test_blog_id )
		);

		$mock_details              = new stdClass();
		$this->patchwork_handles[] = \Patchwork\redefine(
			'get_blog_details',
			\Patchwork\always( $mock_details )
		);

		$result_date = Settings::get_wpcom_site_creation_date();

		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertLessThan( 0, $result_date->getTimestamp() );
	}

	/**
	 * Scenario: WPCOM, blog_id is not valid.
	 */
	public function test_get_wpcom_site_creation_date_returns_default_date_if_no_blog_id() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'WPCOM helper tests require a multisite environment.' );
		}
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$test_blog_id = 0;

		$this->patchwork_handles[] = \Patchwork\redefine(
			'get_current_blog_id',
			\Patchwork\always( $test_blog_id )
		);

		$result_date = Settings::get_wpcom_site_creation_date();

		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertLessThan( 0, $result_date->getTimestamp() );
	}

	/**
	 * Scenario: Connected, Cache Miss, API returns RECENT date.
	 */
	public function test_get_jetpack_cache_site_creation_date_returns_recent_date() {
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$recent_creation_date_string = '2025-08-01 12:00:00'; // Date AFTER cutoff
		$test_site_id                = 1;

		$mock_manager = $this->get_mock_manager( true );

		// Mock static Manager::get_site_id
		$this->patchwork_handles[] = \Patchwork\redefine(
			'\Automattic\Jetpack\Connection\Manager::get_site_id',
			\Patchwork\always( $test_site_id )
		);

		$api_response_body = json_encode( array( 'options' => (object) array( 'created_at' => $recent_creation_date_string ) ) );
		if ( false === $api_response_body ) {
			$this->fail( 'Failed to encode mock API response' );
		}
		$mock_http_response        = array(
			'headers'  => array( 'content-type' => 'application/json' ),
			'body'     => $api_response_body,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
		$this->patchwork_handles[] = \Patchwork\redefine(
			'\Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog',
			\Patchwork\always( $mock_http_response )
		);

		$expected_date_object = new DateTimeImmutable( $recent_creation_date_string, wp_timezone() );

		$result_date = Settings::get_jetpack_cache_site_creation_date( $mock_manager );

		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertEquals( $expected_date_object->getTimestamp(), $result_date->getTimestamp() );
	}

	/**
	 * Scenario: Connected, Cache Miss, API returns OLD date.
	 */
	public function test_get_jetpack_cache_site_creation_date_returns_old_date() {
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$old_creation_date_string = '2023-01-01 12:00:00'; // Date BEFORE cutoff
		$test_site_id             = 1;

		$mock_manager = $this->get_mock_manager( true );

		$this->patchwork_handles[] = \Patchwork\redefine(
			'\Automattic\Jetpack\Connection\Manager::get_site_id',
			\Patchwork\always( $test_site_id )
		);

		$api_response_body = json_encode( array( 'options' => (object) array( 'created_at' => $old_creation_date_string ) ) );
		if ( false === $api_response_body ) {
			$this->fail( 'Failed to encode mock API response' );
		}
		$mock_http_response        = array(
			'headers'  => array( 'content-type' => 'application/json' ),
			'body'     => $api_response_body,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
		$this->patchwork_handles[] = \Patchwork\redefine(
			'\Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog',
			\Patchwork\always( $mock_http_response )
		);

		$expected_date_object = new DateTimeImmutable( $old_creation_date_string, wp_timezone() );

		$result_date = Settings::get_jetpack_cache_site_creation_date( $mock_manager );

		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertEquals( $expected_date_object->getTimestamp(), $result_date->getTimestamp() );
	}

	/**
	 * Scenario: Connected, bad response
	 */
	public function test_get_jetpack_cache_site_creation_date_returns_default_date_with_bad_response() {
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$test_site_id = 1;

		$mock_manager              = $this->get_mock_manager( true );
		$this->patchwork_handles[] = \Patchwork\redefine(
			'\Automattic\Jetpack\Connection\Manager::get_site_id',
			\Patchwork\always( $test_site_id )
		);

		$mock_http_response        = new WP_Error();
		$this->patchwork_handles[] = \Patchwork\redefine(
			'\Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog',
			\Patchwork\always( $mock_http_response )
		);

		$result_date = Settings::get_jetpack_cache_site_creation_date( $mock_manager );

		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertLessThan( 0, $result_date->getTimestamp() );
	}

	/**
	 * Scenario: Connected, bad site data
	 */
	public function test_get_jetpack_cache_site_creation_date_returns_default_date_with_bad_site_data() {
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$test_site_id = 1;

		$mock_manager              = $this->get_mock_manager( true );
		$this->patchwork_handles[] = \Patchwork\redefine(
			'\Automattic\Jetpack\Connection\Manager::get_site_id',
			\Patchwork\always( $test_site_id )
		);

		$mock_http_response        = array(
			'headers'  => array( 'content-type' => 'application/json' ),
			'body'     => json_encode( array() ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
		$this->patchwork_handles[] = \Patchwork\redefine(
			'\Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog',
			\Patchwork\always( $mock_http_response )
		);

		$result_date = Settings::get_jetpack_cache_site_creation_date( $mock_manager );

		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertLessThan( 0, $result_date->getTimestamp() );
	}

	/**
	 * Scenario: Not connected
	 */
	public function test_get_jetpack_cache_site_creation_date_returns_default_date_with_no_connection() {
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$mock_manager = $this->get_mock_manager( false );

		$result_date = Settings::get_jetpack_cache_site_creation_date( $mock_manager );

		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertLessThan( 0, $result_date->getTimestamp() );
	}
}
