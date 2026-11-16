<?php
/**
 * Tests Settings class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Class to test the Settings class.
 *
 * @covers \Automattic\Jetpack\Stats\Settings
 */
#[CoversClass( Settings::class )]
class Settings_Test extends StatsBaseTestCase {
	public function test_update_refuses_a_role_that_is_not_a_string() {
		$result = Settings::update( array( 'count_roles' => array( array( 'editor' ) ) ), array( 'count_roles' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_invalid_role', $result->get_error_code() );
		$this->assertSame( array( 'status' => 400 ), $result->get_error_data() );
		$this->assertSame( array(), Options::get_option( 'count_roles' ) );
	}
}
