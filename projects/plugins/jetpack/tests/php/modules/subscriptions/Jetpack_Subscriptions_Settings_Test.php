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
		$recent_timestamp = strtotime( '2025-07-01 11:00:00' );

		$is_eligible = Settings::is_site_eligible_for_new_default( $recent_timestamp );

		$this->assertTrue( $is_eligible );
	}

	/**
	 * Scenario: Comparison check with a date BEFORE the cutoff.
	 */
	public function test_is_site_eligible_returns_false_for_old_date() {
		$old_timestamp = strtotime( '2024-01-01 11:00:00' );

		$is_eligible = Settings::is_site_eligible_for_new_default( $old_timestamp );

		$this->assertFalse( $is_eligible );
	}

	/**
	 * Scenario: Comparison check with the default '0' timestamp.
	 */
	public function test_is_site_eligible_returns_false_for_default_date() {
		$default_timestamp = 0;

		$is_eligible = Settings::is_site_eligible_for_new_default( $default_timestamp );

		$this->assertFalse( $is_eligible );
	}

	/**
	 * Scenario: WPCOM, Recent Date returned via mocked get_blog_details.
	 */
	public function test_get_wpcom_site_registered_timestamp_returns_recent_date() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'WPCOM helper tests require a multisite environment.' );
		}
		// Check if Patchwork is available (still needed for get_current_blog_id mock)
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$recent_creation_date_string = '2025-08-01 12:00:00'; // Date AFTER cutoff
		$expected_timestamp          = strtotime( $recent_creation_date_string );
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

		$result_timestamp = Settings::get_wpcom_site_registered_timestamp();

		$this->assertIsInt( $result_timestamp );
		$this->assertEquals( $expected_timestamp, $result_timestamp );
	}

	/**
	 * Scenario: WPCOM, Old Date returned via mocked get_blog_details.
	 */
	public function test_get_wpcom_site_registered_timestamp_returns_old_date() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'WPCOM helper tests require a multisite environment.' );
		}
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$old_creation_date_string = '2023-01-01 12:00:00'; // Date BEFORE cutoff
		$expected_timestamp       = strtotime( $old_creation_date_string );
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

		$result_timestamp = Settings::get_wpcom_site_registered_timestamp();

		$this->assertIsInt( $result_timestamp );
		$this->assertEquals( $expected_timestamp, $result_timestamp );
	}

	/**
	 * Scenario: WPCOM, get_blog_details returns null.
	 */
	public function test_get_wpcom_site_registered_timestamp_returns_default_date_if_details_null() {
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

		$result_timestamp = Settings::get_wpcom_site_registered_timestamp();

		$this->assertIsInt( $result_timestamp );
		$this->assertSame( 0, $result_timestamp );
	}

	/**
	 * Scenario: WPCOM, get_blog_details returns object without 'registered' property.
	 */
	public function test_get_wpcom_site_registered_timestamp_returns_default_timestamp_if_registered_missing() {
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

		$result_timestamp = Settings::get_wpcom_site_registered_timestamp();

		$this->assertIsInt( $result_timestamp );
		$this->assertSame( 0, $result_timestamp );
	}

	/**
	 * Scenario: WPCOM, blog_id is not valid.
	 */
	public function test_get_wpcom_site_registered_timestamp_returns_default_timestamp_if_no_blog_id() {
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

		$result_timestamp = Settings::get_wpcom_site_registered_timestamp();

		$this->assertIsInt( $result_timestamp );
		$this->assertSame( 0, $result_timestamp );
	}

	/**
	 * Scenario: Connected, Cache Miss, API returns RECENT date.
	 */
	public function test_get_jetpack_cache_site_creation_timestamp_returns_recent_date() {
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$recent_creation_date_string = '2025-08-01 12:00:00'; // Date AFTER cutoff
		$expected_timestamp          = strtotime( $recent_creation_date_string );
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

		$result_timestamp = Settings::get_jetpack_cache_site_creation_timestamp( $mock_manager );

		$this->assertIsInt( $result_timestamp );
		$this->assertEquals( $expected_timestamp, $result_timestamp );
	}

	/**
	 * Scenario: Connected, Cache Miss, API returns OLD date.
	 */
	public function test_get_jetpack_cache_site_creation_timestamp_returns_old_date() {
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$old_creation_date_string = '2023-01-01 12:00:00'; // Date BEFORE cutoff
		$expected_timestamp       = strtotime( $old_creation_date_string );
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

		$result_timestamp = Settings::get_jetpack_cache_site_creation_timestamp( $mock_manager );

		$this->assertIsInt( $result_timestamp );
		$this->assertEquals( $expected_timestamp, $result_timestamp );
	}

	/**
	 * Scenario: Connected, bad response
	 */
	public function test_get_jetpack_cache_site_creation_timestamp_returns_default_date_with_bad_response() {
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

		$result_timestamp = Settings::get_jetpack_cache_site_creation_timestamp( $mock_manager );

		$this->assertIsInt( $result_timestamp );
		$this->assertSame( 0, $result_timestamp );
	}

	/**
	 * Scenario: Connected, bad site data
	 */
	public function test_get_jetpack_cache_site_creation_timestamp_returns_default_date_with_bad_site_data() {
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

		$result_timestamp = Settings::get_jetpack_cache_site_creation_timestamp( $mock_manager );

		$this->assertIsInt( $result_timestamp );
		$this->assertSame( 0, $result_timestamp );
	}

	/**
	 * Scenario: Not connected
	 */
	public function test_get_jetpack_cache_site_creation_timestamp_returns_default_date_with_no_connection() {
		if ( ! function_exists( '\Patchwork\redefine' ) ) {
			$this->markTestSkipped( 'Patchwork not available.' );
		}

		$mock_manager = $this->get_mock_manager( false );

		$result_timestamp = Settings::get_jetpack_cache_site_creation_timestamp( $mock_manager );

		$this->assertIsInt( $result_timestamp );
		$this->assertSame( 0, $result_timestamp );
	}
}
