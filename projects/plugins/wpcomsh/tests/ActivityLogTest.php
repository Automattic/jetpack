<?php
/**
 * Activity Log feature plugin test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class ActivityLogTest.
 *
 * @covers ::wpcomsh_force_activity_log_module
 */
#[CoversFunction( 'wpcomsh_force_activity_log_module' )]
class ActivityLogTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tests that the module is forced on only for Jetpack builds that ship it.
	 *
	 * @dataProvider version_provider
	 *
	 * @param string $jetpack_version Jetpack version.
	 * @param bool   $forced          Whether the module should be forced on.
	 */
	#[DataProvider( 'version_provider' )]
	public function test_forces_module_on_only_when_jetpack_ships_it( $jetpack_version, $forced ) {
		$existing = array( 'stats' => array( 'activation' => 'forced-on' ) );
		$expected = $forced
			? array_merge( $existing, array( 'activity-log' => array( 'activation' => 'forced-on' ) ) )
			: $existing;

		$this->assertSame( $expected, wpcomsh_force_activity_log_module( $existing, $jetpack_version ) );
	}

	/**
	 * Data provider for test_forces_module_on_only_when_jetpack_ships_it.
	 *
	 * @return array
	 */
	public static function version_provider() {
		return array(
			'before the module' => array( '16.2', false ),
			'prerelease build'  => array( '16.3-beta', true ),
			'release'           => array( '16.3', true ),
		);
	}
}
