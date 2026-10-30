<?php
/**
 * Tests for Enablement.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Enablement
 */
#[CoversClass( Enablement::class )]
class Enablement_Test extends BaseTestCase {

	/**
	 * Reset options and filters between tests.
	 */
	public function tear_down() {
		delete_option( 'jetpack_active_modules' );
		delete_option( Enablement_Setting::ENABLED_OPTION );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Classic_Stats::RETIRED_FLAG );
		remove_all_filters( 'jetpack_premium_analytics_enabled' );

		parent::tear_down();
	}

	/**
	 * @dataProvider provide_states
	 *
	 * @param bool      $module_active Whether the Stats module is active.
	 * @param bool      $opted_in      Whether the site opted in to Stats v2.
	 * @param bool      $retired       Whether the classic Stats page is retired.
	 * @param bool|null $filtered      What the `jetpack_premium_analytics_enabled` filter answers, or null for no callback.
	 * @param bool      $expected      Whether Stats v2 is enabled.
	 */
	#[DataProvider( 'provide_states' )]
	public function test_is_enabled( $module_active, $opted_in, $retired, $filtered, $expected ) {
		update_option( 'jetpack_active_modules', $module_active ? array( 'stats' ) : array() );
		update_option( Enablement_Setting::ENABLED_OPTION, (int) $opted_in );
		add_filter( 'jetpack_feature_flag_enabled_' . Classic_Stats::RETIRED_FLAG, $retired ? '__return_true' : '__return_false' );
		if ( null !== $filtered ) {
			add_filter( 'jetpack_premium_analytics_enabled', $filtered ? '__return_true' : '__return_false' );
		}

		$this->assertSame( $expected, Enablement::is_enabled() );
	}

	/**
	 * States, as module active, opted in, classic page retired, filter answer, enabled.
	 *
	 * @return array
	 */
	public static function provide_states() {
		return array(
			'off by default'             => array( true, false, false, null, false ),
			'opted in'                   => array( true, true, false, null, true ),
			'classic page retired'       => array( true, false, true, null, true ),
			'opted in, Stats module off' => array( false, true, false, null, false ),
			'retired, Stats module off'  => array( false, false, true, null, false ),
			'filter turns it on'         => array( true, false, false, true, true ),
			'filter overrides opt-in'    => array( true, true, false, false, false ),
			'filter overrides retiring'  => array( true, false, true, false, false ),
			'filter cannot beat module'  => array( false, false, false, true, false ),
		);
	}
}
