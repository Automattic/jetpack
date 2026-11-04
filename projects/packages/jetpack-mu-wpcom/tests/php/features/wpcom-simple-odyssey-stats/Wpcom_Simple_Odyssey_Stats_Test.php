<?php
/**
 * Tests for when Stats v2 takes over the Odyssey Stats page on WordPress.com Simple.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\PremiumAnalytics\Analytics;
use Automattic\Jetpack\PremiumAnalytics\Classic_Stats;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-simple-odyssey-stats/odyssey-stats-replaced.php';

/**
 * @covers ::wpcom_simple_odyssey_stats_is_replaced
 */
#[CoversFunction( 'wpcom_simple_odyssey_stats_is_replaced' )]
class Wpcom_Simple_Odyssey_Stats_Test extends \WorDBless\BaseTestCase {

	public function tear_down() {
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Classic_Stats::RETIRED_FLAG );
		$this->set_stats_v2_booted( false );
		parent::tear_down();
	}

	/**
	 * @dataProvider provide_states
	 *
	 * @param bool $retired  Whether the retirement flag is on.
	 * @param bool $booted   Whether Stats v2 booted in this request.
	 * @param bool $replaced Expected result.
	 */
	#[DataProvider( 'provide_states' )]
	public function test_stats_v2_replaces_the_page_only_once_retired_and_booted( $retired, $booted, $replaced ) {
		add_filter( 'jetpack_feature_flag_enabled_' . Classic_Stats::RETIRED_FLAG, $retired ? '__return_true' : '__return_false' );
		$this->set_stats_v2_booted( $booted );

		$this->assertSame( $replaced, wpcom_simple_odyssey_stats_is_replaced() );
	}

	/**
	 * @return array<string, bool[]>
	 */
	public static function provide_states() {
		return array(
			'retired, Stats v2 booted'     => array( true, true, true ),
			'retired, Stats v2 not booted' => array( true, false, false ),
			'not retired, Stats v2 booted' => array( false, true, false ),
		);
	}

	/**
	 * @param bool $booted Whether Stats v2 booted in this request.
	 */
	private function set_stats_v2_booted( $booted ) {
		( new \ReflectionProperty( Analytics::class, 'initialized' ) )->setValue( null, $booted );
	}
}
