<?php
/**
 * Tests for Speed_Score_Durations.
 *
 * @package automattic/jetpack-boost-speed-score
 */

namespace Automattic\Jetpack\Boost_Speed_Score\Tests\Lib;

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Durations;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Request;
use Automattic\Jetpack\Boost_Speed_Score\Tests\Base_TestCase;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class Speed_Score_Durations_Test
 *
 * @package Automattic\Jetpack\Boost_Speed_Score\Tests\Lib
 */
class Speed_Score_Durations_Test extends Base_TestCase {

	/**
	 * The stored option value, or null when unset.
	 *
	 * @var mixed
	 */
	public $stored;

	/**
	 * Stub the option the class reads and writes.
	 */
	protected function set_up() {
		parent::set_up();

		$this->stored = null;
		Functions\when( 'get_option' )->alias(
			function ( $name, $default_value = false ) {
				return null === $this->stored ? $default_value : $this->stored;
			}
		);
		Functions\when( 'update_option' )->alias(
			function ( $name, $value ) {
				$this->stored = $value;
				return true;
			}
		);
	}

	/**
	 * Durations to record, and the expected run length that follows.
	 *
	 * @return array
	 */
	public static function provide_recorded_durations() {
		return array(
			'nothing recorded falls back to the default' => array( array(), Speed_Score_Durations::DEFAULT_SECONDS ),
			'an odd count takes the middle run'          => array( array( 90, 20, 30 ), 30 ),
			'an even count averages the middle two'      => array( array( 20, 30, 41, 90 ), 36 ),
			'only the latest five runs count'            => array( array( 90, 90, 90, 20, 20, 20, 30, 30 ), 20 ),
			'runs nobody watched finish are left out'    => array( array( 20, 241, 0, 30, 25 ), 25 ),
		);
	}

	/**
	 * @dataProvider provide_recorded_durations
	 *
	 * @param int[] $durations Seconds per run, oldest first.
	 * @param int   $expected  The expected run length.
	 */
	#[DataProvider( 'provide_recorded_durations' )]
	public function test_expected_is_the_median_of_recent_runs( array $durations, $expected ) {
		foreach ( $durations as $seconds ) {
			Speed_Score_Durations::record( $seconds );
		}

		$this->assertSame( $expected, Speed_Score_Durations::expected() );
	}

	/**
	 * Requests polled in one fetch, as status and seconds since dispatch, and what gets stored.
	 *
	 * @return array
	 */
	public static function provide_polled_requests() {
		return array(
			'both finish: one entry, from the earliest dispatch' => array( array( array( 'success', 30 ), array( 'success', 28 ) ), array( 30 ) ),
			'one still measuring records nothing yet' => array( array( array( 'success', 30 ), array( 'pending', 30 ) ), null ),
			'a failed request records nothing'        => array( array( array( 'error', 30 ) ), null ),
			'nothing was pending, so no run finished' => array( array(), null ),
		);
	}

	/**
	 * @dataProvider provide_polled_requests
	 *
	 * @param array      $requests Status and seconds since dispatch per polled request.
	 * @param array|null $stored   The durations stored afterwards.
	 */
	#[DataProvider( 'provide_polled_requests' )]
	public function test_a_run_is_recorded_once_when_its_last_request_succeeds( array $requests, $stored ) {
		$polled = array();
		foreach ( $requests as $i => list( $status, $seconds_ago ) ) {
			$polled[] = new Speed_Score_Request( 'http://example.com/?r=' . $i, array(), microtime( true ) - $seconds_ago, $status );
		}

		Speed_Score_Durations::record_finished_run( $polled );

		$this->assertSame( $stored, $this->stored );
	}
}
