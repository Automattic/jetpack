<?php
/**
 * Tests that the account-protection module is not auto-activated.
 *
 * Both activation paths read Jetpack::get_default_modules(): a new connection
 * activates every default module, and an upgrade activates the default modules
 * introduced since the previous version. Neither path deactivates modules, so
 * existing sites keep whatever state they already have.
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
	 * A new connection activates all default modules; account-protection must not be one of them.
	 */
	public function test_account_protection_is_not_activated_on_new_connection() {
		$this->assertNotContains( 'account-protection', Jetpack::get_default_modules() );
	}

	/**
	 * An upgrade from a version before the module was introduced (14.5) must not activate it.
	 */
	public function test_account_protection_is_not_activated_on_upgrade_from_before_14_5() {
		$this->assertNotContains( 'account-protection', Jetpack::get_default_modules( '14.4', JETPACK__VERSION ) );
	}
}
