<?php
/**
 * BlocklogManager test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Blocklog_Manager;

/**
 * BlocklogManager test suite.
 */
final class WafBlocklogManagerTest extends PHPUnit\Framework\TestCase {
	/**
	 * Test calling the log function and check if a file is written.
	 *
	 * @runInSeparateProcess
	 */
	public function testWriteBlocklog() {
		$tmp_dir      = sys_get_temp_dir();
		$waf_log_path = $tmp_dir . '/waf-blocklog';

		define( 'JETPACK_WAF_DIR', $tmp_dir );
		define( 'JETPACK_WAF_WPCONFIG', $tmp_dir . '/wp-config.php' );
		define( 'JETPACK_WAF_SHARE_DATA', true );

		Waf_Blocklog_Manager::write_blocklog( '1337', 'test block' );
		$file_content = file_get_contents( $waf_log_path );

		$this->assertTrue( file_exists( $waf_log_path ) );
		$this->assertFalse( strpos( $file_content, '{"rule_id":"1337","reason":"test block"' ) === false );

		unlink( $waf_log_path );
	}

	/**
	 * Test incrementing the daily summary stats.
	 */
	public function testIncrementDailySummary() {
		$today = gmdate( 'Y-m-d' );

		$value  = array();
		$result = Waf_Blocklog_Manager::increment_daily_summary( $value );
		$this->assertSame( 1, $result[ $today ] );

		$value  = array(
			'1999-01-01' => 0,
			'1999-01-02' => 123,
			$today       => 1,
		);
		$result = Waf_Blocklog_Manager::increment_daily_summary( $value );
		$this->assertEquals( 2, $result[ $today ] );
	}

	/**
	 * Test filtering of the daily summary stats.
	 */
	public function testFilterLast30Days() {
		// Generate stats data with dates from 35 days ago to 5 days in the future
		$stats = array();
		for ( $i = -35; $i <= 5; $i++ ) {
			$date           = gmdate( 'Y-m-d', strtotime( "$i days" ) );
			$stats[ $date ] = "data for $date";
		}

		// Generate expected data with dates from 30 days ago to today
		$expected_stats = array();
		for ( $i = -30; $i <= 0; $i++ ) {
			$date                    = gmdate( 'Y-m-d', strtotime( "$i days" ) );
			$expected_stats[ $date ] = "data for $date";
		}

		$filtered_stats = Waf_Blocklog_Manager::filter_last_30_days( $stats );
		$this->assertEquals( $expected_stats, $filtered_stats );
	}
}
