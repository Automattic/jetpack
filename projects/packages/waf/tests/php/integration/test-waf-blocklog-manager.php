<?php
/**
 * WAF blocklog manager tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Blocklog_Manager;
use Automattic\Jetpack\Waf\Waf_Constants;
use Automattic\Jetpack\Waf\Waf_Runner;

/**
 * Integration tests for the WAF blocklog manager.
 */
final class WafBlocklogManagerIntegrationTest extends WorDBless\BaseTestCase {

	/**
	 * Test setup.
	 */
	protected function set_up() {
		// Set a blog token and id so the site is connected.
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'id', 1234 );

		// Set the share data option to true
		add_option( Waf_Runner::SHARE_DATA_OPTION_NAME, true );

		// Define required constants from WAF initialization
		Waf_Constants::define_share_data();

		// Simulate a blocklog entry to trigger option update
		$test_rule_id = 1;
		$test_reason  = 'Test block reason for file';
		Waf_Blocklog_Manager::write_blocklog( $test_rule_id, $test_reason );
	}

	/**
	 * Verifies that the daily summary option is correctly updated with today's date and that the entry count is greater than zero.
	 */
	public function testWafBlocklogDailySummaryOptionUpdate() {
		// Check the option value
		$stats = get_option( 'jetpack_waf_blocklog_daily_summary' );
		$today = gmdate( 'Y-m-d' );

		$this->assertArrayHasKey( $today, $stats, 'The stats array should have an entry for today.' );
		$this->assertGreaterThan( 0, $stats[ $today ], 'The entry count for today should be greater than 0.' );
	}

	/**
	 * Checks that the method to get today's stats returns the expected value, confirming correct tracking of daily stats.
	 */
	public function testGetWafBlocklogDailySummaryTodayStats() {
		// Check the today stats
		$today_stats = Waf_Blocklog_Manager::get_today_stats();
		$this->assertSame( 1, $today_stats, 'The today stats should be 1.' );
	}

	/**
	 * Ensures that the method for retrieving the current month's stats accurately reflects the recorded data.
	 */
	public function testGetWafBlocklogDailySummaryCurrentMonthStats() {
		// Check the current month stats
		$current_month_stats = Waf_Blocklog_Manager::get_current_month_stats();
		$this->assertSame( 1, $current_month_stats, 'The current month stats should be 1.' );
	}
}
