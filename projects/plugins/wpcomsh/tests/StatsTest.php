<?php
/**
 * Stats feature plugin tests.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * @covers ::wpcomsh_retire_classic_stats
 */
#[CoversFunction( 'wpcomsh_retire_classic_stats' )]
class StatsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const RETIRED_FLAG = 'jetpack-stats-classic-page-retired';

	public function test_atomic_retires_the_classic_stats_page() {
		$this->assertTrue( Feature_Flags::is_enabled( self::RETIRED_FLAG ) );
	}

	public function test_other_flags_keep_their_value() {
		$this->assertFalse( wpcomsh_retire_classic_stats( false, 'some-other-flag' ) );
		$this->assertTrue( wpcomsh_retire_classic_stats( true, 'some-other-flag' ) );
	}

	public function test_a_per_site_override_still_switches_it_off() {
		// The a8c Feature Flags screen answers the same filter at the default priority.
		$override = static function ( $enabled, $name ) {
			return self::RETIRED_FLAG === $name ? false : $enabled;
		};
		add_filter( 'jetpack_feature_flag_enabled', $override, 10, 2 );

		$this->assertFalse( Feature_Flags::is_enabled( self::RETIRED_FLAG ) );

		remove_filter( 'jetpack_feature_flag_enabled', $override, 10 );
	}
}
