<?php
/**
 * BlocklogManager test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Blocklog_Manager;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * BlocklogManager test suite.
 */
final class WafBlocklogManagerTest extends PHPUnit\Framework\TestCase {
	/**
	 * Test calling the log function and check if a file is written.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
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

	/**
	 * The firewall writes the counts around the object cache, so reads must skip a stale cached option.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testCountsReadTheStoredValueNotTheCachedOption() {
		$today = gmdate( 'Y-m-d' );
		add_test_option( Waf_Blocklog_Manager::BLOCKLOG_OPTION_NAME_ALL_TIME_BLOCK_COUNT, 2 );
		add_test_option( Waf_Blocklog_Manager::BLOCKLOG_OPTION_NAME_DAILY_SUMMARY, array( $today => 2 ) );

		$GLOBALS['wpdb'] = new class( $today ) {
			/** @var array */
			private $rows;

			/**
			 * @param string $today Today's date.
			 */
			public function __construct( $today ) {
				$this->rows = array(
					Waf_Blocklog_Manager::BLOCKLOG_OPTION_NAME_ALL_TIME_BLOCK_COUNT => '3',
					Waf_Blocklog_Manager::BLOCKLOG_OPTION_NAME_DAILY_SUMMARY        => serialize( array( $today => 3 ) ),
				);
			}

			/** @var string */
			public $options = 'wp_options';

			/**
			 * @param string $query Query.
			 * @param mixed  ...$args Arguments.
			 */
			public function prepare( $query, ...$args ) {
				return $args[0];
			}

			/**
			 * @param string $option_name The prepared option name.
			 */
			public function get_var( $option_name ) {
				return $this->rows[ $option_name ] ?? null;
			}
		};

		$this->assertSame( 3, Waf_Blocklog_Manager::get_all_time_block_count() );
		$this->assertSame( 3, Waf_Blocklog_Manager::get_current_day_block_count() );
	}

	/**
	 * Test which request details are kept for a blocked request.
	 *
	 * @dataProvider provideRequestDetails
	 *
	 * @param array $server   The request's server variables.
	 * @param array $expected The kept details.
	 */
	#[DataProvider( 'provideRequestDetails' )]
	public function testRequestDetails( $server, $expected ) {
		$this->assertSame( $expected, Waf_Blocklog_Manager::get_request_details( $server ) );
	}

	/**
	 * Data provider for testRequestDetails.
	 *
	 * @return array
	 */
	public static function provideRequestDetails() {
		return array(
			'a normal request'             => array(
				array(
					'REQUEST_METHOD'  => 'post',
					'REQUEST_URI'     => '/?s=%3Cscript%3E',
					'HTTP_USER_AGENT' => 'sqlmap/1.7',
				),
				array(
					'method'      => 'POST',
					'request_uri' => '/?s=%3Cscript%3E',
					'user_agent'  => 'sqlmap/1.7',
				),
			),
			'missing values are null'      => array(
				array(),
				array(
					'method'      => null,
					'request_uri' => null,
					'user_agent'  => null,
				),
			),
			'oversized values are trimmed' => array(
				array(
					'REQUEST_METHOD'  => str_repeat( 'X', 20 ),
					'REQUEST_URI'     => '/' . str_repeat( 'a', 5000 ),
					'HTTP_USER_AGENT' => str_repeat( 'b', 1000 ),
				),
				array(
					'method'      => str_repeat( 'X', 10 ),
					'request_uri' => '/' . str_repeat( 'a', 2047 ),
					'user_agent'  => str_repeat( 'b', 512 ),
				),
			),
		);
	}

	/**
	 * Rows logged before the table had request details still read back, with the details null.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testRecentBlocksIncludeRequestDetailsWhenLogged() {
		define( 'ARRAY_A', 'ARRAY_A' );
		$GLOBALS['wpdb'] = new class() {
			/** @var string */
			public $prefix = 'wp_';

			/**
			 * @param bool $suppress Whether to suppress errors.
			 */
			public function suppress_errors( $suppress = true ) {
				return $suppress;
			}

			/**
			 * @param string $query Query.
			 */
			public function prepare( $query ) {
				return $query;
			}

			/**
			 * @return array
			 */
			public function get_results() {
				return array(
					array(
						'log_id'      => '2',
						'timestamp'   => '2026-10-09 16:54:03',
						'rule_id'     => '-1',
						'reason'      => 'ip block list',
						'method'      => 'GET',
						'request_uri' => '/?page_id=1',
						'user_agent'  => 'curl/8.14.1',
					),
					array(
						'log_id'    => '1',
						'timestamp' => '2026-10-09 16:07:51',
						'rule_id'   => '-2',
						'reason'    => 'firewall test',
					),
				);
			}
		};

		$blocks = Waf_Blocklog_Manager::get_recent_blocks();

		$this->assertSame(
			array(
				'method'    => 'GET',
				'uri'       => '/?page_id=1',
				'userAgent' => 'curl/8.14.1',
			),
			array_intersect_key( $blocks[0], array_flip( array( 'method', 'uri', 'userAgent' ) ) )
		);
		$this->assertNull( $blocks[1]['uri'] );
	}
}
