<?php
/**
 * Stats feature plugin tests.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers ::wpcomsh_retire_classic_stats
 * @covers ::wpcomsh_enable_woocommerce_analytics_proxy_tracking
 */
#[CoversFunction( 'wpcomsh_retire_classic_stats' )]
#[CoversFunction( 'wpcomsh_enable_woocommerce_analytics_proxy_tracking' )]
class StatsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const RETIRED_FLAG = 'jetpack-stats-classic-page-retired';
	const STATS_V2     = 'Automattic\\Jetpack\\PremiumAnalytics\\Analytics';
	const ENABLEMENT   = 'Automattic\\Jetpack\\PremiumAnalytics\\Enablement';

	public function test_proxy_tracking_stays_off_without_stats_v2() {
		if ( class_exists( self::ENABLEMENT ) ) {
			$this->markTestSkipped( 'Stats v2 is already loaded from another plugin.' );
		}

		$this->assertFalse( apply_filters( 'woocommerce_analytics_experimental_proxy_tracking_enabled', false ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_proxy_tracking_follows_whether_stats_v2_runs() {
		if ( class_exists( self::ENABLEMENT ) ) {
			$this->markTestSkipped( 'Stats v2 is already loaded from another plugin.' );
		}
		eval( 'namespace Automattic\Jetpack\PremiumAnalytics; class Enablement { public static function is_enabled() { return (bool) get_option( "stats_v2_test_enabled" ); } }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		update_option( 'stats_v2_test_enabled', 1 );
		$this->assertTrue( apply_filters( 'woocommerce_analytics_experimental_proxy_tracking_enabled', false ) );

		update_option( 'stats_v2_test_enabled', 0 );
		$this->assertFalse( apply_filters( 'woocommerce_analytics_experimental_proxy_tracking_enabled', false ) );
	}

	public function test_classic_stats_stays_until_jetpack_lists_stats_v2_in_calypsos_menu() {
		if ( class_exists( self::STATS_V2 ) ) {
			$this->markTestSkipped( 'Stats v2 is already loaded from another plugin.' );
		}

		$this->assertFalse( Feature_Flags::is_enabled( self::RETIRED_FLAG ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_atomic_retires_the_classic_stats_page() {
		self::load_stats_v2_that_lists_itself_in_calypsos_menu();

		$this->assertTrue( Feature_Flags::is_enabled( self::RETIRED_FLAG ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_other_flags_keep_their_value() {
		self::load_stats_v2_that_lists_itself_in_calypsos_menu();

		$this->assertFalse( wpcomsh_retire_classic_stats( false, 'some-other-flag' ) );
		$this->assertTrue( wpcomsh_retire_classic_stats( true, 'some-other-flag' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_per_site_override_still_switches_it_off() {
		self::load_stats_v2_that_lists_itself_in_calypsos_menu();
		// The a8c Feature Flags screen answers the same filter at the default priority.
		add_filter(
			'jetpack_feature_flag_enabled',
			static function ( $enabled, $name ) {
				return self::RETIRED_FLAG === $name ? false : $enabled;
			},
			10,
			2
		);

		$this->assertFalse( Feature_Flags::is_enabled( self::RETIRED_FLAG ) );
	}

	/**
	 * Stand-in for the Jetpack plugin's Stats v2, which wpcomsh does not bundle.
	 */
	private static function load_stats_v2_that_lists_itself_in_calypsos_menu() {
		if ( class_exists( self::STATS_V2 ) ) {
			return;
		}
		eval( 'namespace Automattic\Jetpack\PremiumAnalytics; class Analytics { public static function register_replayed_admin_menu() {} }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval
	}
}
