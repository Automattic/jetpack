<?php

require_once JETPACK__PLUGIN_DIR . '/modules/subscriptions/class-settings.php';

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Modules\Subscriptions\Settings;

/**
 * Tests for Automattic\Jetpack\Modules\Subscriptions\Settings.
 */
class Jetpack_Subscriptions_Settings_Test extends WP_UnitTestCase {

	/**
	 * Holds filters added by tests to be removed in tear_down.
	 *
	 * @var array
	 */
	private $added_filters = array();

	/**
	 * Remove any filters added during tests.
	 */
	public function tear_down(): void {
		foreach ( $this->added_filters as $filter ) {
			remove_filter( $filter['tag'], $filter['callback'], $filter['priority'] );
		}
		$this->added_filters = array();
		parent::tear_down();
	}

	/**
	 * Helper to add a filter and track it for removal in tear_down.
	 */
	private function add_filter( $tag, $callback, $priority = 10, $accepted_args = 1 ) {
		$this->added_filters[] = array(
			'tag'      => $tag,
			'callback' => $callback,
			'priority' => $priority,
		);
		add_filter( $tag, $callback, $priority, $accepted_args );
	}

	/**
	 * Tests the flow using public helpers: calls date helper, passes result to comparison helper.
	 * Scenario: Non-WPCOM, Connected, Cache hit with a date AFTER cutoff.
	 * Expected: Final comparison result is true (-> 1).
	 */
	public function test_helper_and_comparison_yield_1_for_recent_jetpack_site_cache_hit() {
		// --- Arrange ---
		$recent_creation_date_string = '2025-07-01 11:00:00';
		$test_timezone               = new DateTimeZone( 'UTC' );
		$transient_key               = 'jetpack_subscriptions_site_creation';

		// Mock Manager
		$mock_manager = $this->getMockBuilder( Manager::class )
							->disableOriginalConstructor()->onlyMethods( array( 'is_connected' ) )->getMock();
		$mock_manager->method( 'is_connected' )->willReturn( true ); // Site is connected

		// Mock transient
		$expected_date_object = new DateTimeImmutable( $recent_creation_date_string, $test_timezone );
		$this->add_filter(
			'pre_transient_' . $transient_key,
			function () use ( $expected_date_object ) {
				return $expected_date_object;
			}
		);

		// Mock timezone options
		$this->add_filter(
			'pre_option_timezone_string',
			function () {
				return 'UTC';
			}
		);
		$this->add_filter(
			'pre_option_gmt_offset',
			function () {
				return 0;
			}
		);

		// --- Act ---
		$result_date = Settings::get_jetpack_cache_site_creation_date( $mock_manager );
		$is_eligible = Settings::is_site_eligible_for_new_default( $result_date );

		// --- Assert ---
		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertEquals( $expected_date_object->getTimestamp(), $result_date->getTimestamp() );

		$this->assertTrue( $is_eligible, 'Comparison should return true for the recent date.' );
		$this->assertSame( 1, (int) $is_eligible, 'Casting comparison true to int should be 1.' );
	}

	/**
	 * Tests the flow using public helpers: calls date helper, passes result to comparison helper.
	 * Scenario: Non-WPCOM, Connected, Cache hit with a date BEFORE the cutoff.
	 * Expected: Final comparison result is false (-> 0).
	 */
	public function test_helper_and_comparison_yield_0_for_old_jetpack_site_cache_hit() {
		// --- Arrange ---
		$old_creation_date_string = '2024-01-01 11:00:00'; // Date BEFORE cutoff
		$test_timezone            = new DateTimeZone( 'UTC' );
		$transient_key            = 'jetpack_subscriptions_site_creation';

		// Mock Manager
		$mock_manager = $this->getMockBuilder( Connection_Manager::class )
								->disableOriginalConstructor()->onlyMethods( array( 'is_connected' ) )->getMock();
		$mock_manager->method( 'is_connected' )->willReturn( true );

		// Mock transient with old date
		$expected_date_object = new DateTimeImmutable( $old_creation_date_string, $test_timezone );
		$this->add_filter(
			'pre_transient_' . $transient_key,
			function () use ( $expected_date_object ) {
				return $expected_date_object;
			}
		);

		// Mock timezone options
		$this->add_filter(
			'pre_option_timezone_string',
			function () {
				return 'UTC';
			}
		);
		$this->add_filter(
			'pre_option_gmt_offset',
			function () {
				return 0;
			}
		);

		// --- Act ---
		$result_date = Settings::get_jetpack_cache_site_creation_date( $mock_manager );
		$is_eligible = Settings::is_site_eligible_for_new_default( $result_date );

		// --- Assert ---
		$this->assertInstanceOf( DateTimeImmutable::class, $result_date );
		$this->assertEquals( $expected_date_object->getTimestamp(), $result_date->getTimestamp() );
		$this->assertFalse( $is_eligible, 'Comparison should return false for the old date.' );
		$this->assertSame( 0, (int) $is_eligible, 'Casting comparison false to int should be 0.' );
	}
}
