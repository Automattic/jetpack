<?php
/**
 * Tests for Speed_Score_Durations.
 *
 * @package automattic/jetpack-boost-speed-score
 */

namespace Automattic\Jetpack\Boost_Speed_Score\Tests\Lib;

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Durations;
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
}
