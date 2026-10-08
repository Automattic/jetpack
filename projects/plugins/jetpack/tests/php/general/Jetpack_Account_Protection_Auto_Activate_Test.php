<?php
/**
 * Tests that the account-protection module is not auto-activated.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Class Jetpack_Account_Protection_Auto_Activate_Test
 *
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_Account_Protection_Auto_Activate_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A new connection activates every default module.
	 */
	public function test_account_protection_is_not_activated_on_new_connection() {
		$this->assertContains( 'account-protection', Jetpack::get_available_modules() );
		$this->assertNotContains( 'account-protection', Jetpack::get_default_modules() );
	}

	/**
	 * An upgrade activates the default modules introduced since the previous version.
	 */
	public function test_account_protection_is_not_activated_on_upgrade_from_before_14_5() {
		$this->assertContains( 'account-protection', Jetpack::get_available_modules( '14.4', JETPACK__VERSION ) );
		$this->assertNotContains( 'account-protection', Jetpack::get_default_modules( '14.4', JETPACK__VERSION ) );
	}
}
