<?php
/**
 * Tests for retiring the classic Stats page on WordPress.com Simple.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\PremiumAnalytics\Classic_Stats;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/premium-analytics/retire-classic-stats.php';

/**
 * @covers ::wpcom_simple_retire_classic_stats
 * @covers ::wpcom_simple_register_classic_stats_flag
 */
#[CoversFunction( 'wpcom_simple_retire_classic_stats' )]
#[CoversFunction( 'wpcom_simple_register_classic_stats_flag' )]
class Retire_Classic_Stats_Test extends \WorDBless\BaseTestCase {

	public function tear_down() {
		Feature_Flags::reset();
		parent::tear_down();
	}

	public function test_simple_retires_the_classic_stats_page() {
		$this->assertTrue( Classic_Stats::is_retired() );
	}

	/**
	 * Jetpack and Atomic sites keep their own plugin's answer, since public-api switches to them too.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_jetpack_and_atomic_sites_keep_their_own_answer() {
		eval( 'function is_jetpack_site( $blog_id = null ) { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertFalse( Classic_Stats::is_retired() );
	}

	public function test_other_flags_keep_their_value() {
		$this->assertFalse( wpcom_simple_retire_classic_stats( false, 'some-other-flag' ) );
		$this->assertTrue( wpcom_simple_retire_classic_stats( true, 'some-other-flag' ) );
	}

	public function test_a_per_site_override_still_switches_it_off() {
		// The a8c Feature Flags screen answers the same filter at the default priority.
		$override = static function ( $enabled, $name ) {
			return Classic_Stats::RETIRED_FLAG === $name ? false : $enabled;
		};
		add_filter( 'jetpack_feature_flag_enabled', $override, 10, 2 );

		$this->assertFalse( Classic_Stats::is_retired() );

		remove_filter( 'jetpack_feature_flag_enabled', $override, 10 );
	}

	public function test_registers_the_flag_so_the_feature_flags_screen_lists_it() {
		wpcom_simple_register_classic_stats_flag();

		$this->assertNotNull( Feature_Flags::get( Classic_Stats::RETIRED_FLAG ) );
	}
}
