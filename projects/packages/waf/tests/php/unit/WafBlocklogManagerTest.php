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
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testThirtyDayCountSkipsOlderDaysStillStored() {
		add_test_option(
			Waf_Blocklog_Manager::BLOCKLOG_OPTION_NAME_DAILY_SUMMARY,
			array(
				gmdate( 'Y-m-d', strtotime( '-40 days' ) ) => 5,
				gmdate( 'Y-m-d', strtotime( '-2 days' ) )  => 2,
			)
		);

		$this->assertSame( 2, Waf_Blocklog_Manager::get_thirty_days_block_counts() );
	}

	/**
	 * The firewall writes the counts around the object cache, and with the base prefix, so reads must match both.
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

			/** @var string A multisite subsite's tables. */
			public $prefix = 'wp_2_';

			/** @var string */
			public $options = 'wp_2_options';

			/** @var string */
			public $base_prefix = 'wp_';

			/**
			 * @param string $query Query.
			 * @param mixed  ...$args Arguments.
			 */
			public function prepare( $query, ...$args ) {
				return false === strpos( $query, 'FROM wp_options ' ) ? null : $args[0];
			}

			/**
			 * @param string|null $option_name The prepared option name, or null for another table.
			 */
			public function get_var( $option_name ) {
				return $this->rows[ $option_name ] ?? null;
			}
		};

		$this->assertSame( 3, Waf_Blocklog_Manager::get_all_time_block_count() );
		$this->assertSame( 3, Waf_Blocklog_Manager::get_current_day_block_count() );
	}

	/**
	 * Only a block that isn't the firewall's own test marks the site as having blocked a request.
	 *
	 * @dataProvider provide_rule_ids
	 *
	 * @param string $rule_id  The rule that blocked the request.
	 * @param bool   $recorded Whether the block is recorded as a real one.
	 */
	#[DataProvider( 'provide_rule_ids' )]
	public function testOnlyRealBlocksAreRecorded( $rule_id, $recorded ) {
		$connection = new class() {
			/** @var string[] */
			public $prepared = array();

			/** @var int */
			public $insert_id = 1;

			/**
			 * @param string $query Query.
			 */
			public function query( $query ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return false;
			}

			/**
			 * @param string $query Query.
			 */
			public function prepare( $query ) {
				$this->prepared[] = $query;
				return new class() {
					/**
					 * @param mixed ...$args Arguments.
					 */
					public function bind_param( ...$args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
						return true;
					}

					/** Execute. */
					public function execute() {
						return true;
					}
				};
			}

			/** Close. */
			public function close() {}
		};
		$property   = new ReflectionProperty( Waf_Blocklog_Manager::class, 'db_connection' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $connection );

		Waf_Blocklog_Manager::write_blocklog( $rule_id, 'reason' );

		$flagged = preg_grep( '/INSERT IGNORE INTO \S*options/', $connection->prepared );
		$this->assertSame( $recorded, array() !== $flagged );
	}

	/**
	 * Data provider for testOnlyRealBlocksAreRecorded.
	 *
	 * @return array
	 */
	public static function provide_rule_ids() {
		return array(
			'the firewall test' => array( '-2', false ),
			'a rule'            => array( '1337', true ),
		);
	}
}
