<?php
/**
 * Tests for Historically_Active_Modules.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Unit tests for the Historically_Active_Modules class.
 *
 * @covers \Automattic\Jetpack\My_Jetpack\Historically_Active_Modules
 */
#[CoversClass( Historically_Active_Modules::class )]
class Historically_Active_Modules_Test extends BaseTestCase {

	/**
	 * Clear the refresh window between tests.
	 */
	public function tear_down() {
		delete_transient( Historically_Active_Modules::REFRESHED_TRANSIENT_KEY );
		remove_all_actions( 'jetpack_deactivate_module' );
		parent::tear_down();
	}

	/**
	 * A rebuild satisfies later visits until a module is deactivated.
	 */
	public function test_refresh_is_due_until_rebuilt_and_again_after_module_deactivation() {
		Initializer::setup_historically_active_jetpack_modules_sync();
		$this->assertTrue( Historically_Active_Modules::is_refresh_due() );

		Historically_Active_Modules::update_historically_active_jetpack_modules();
		$this->assertFalse( Historically_Active_Modules::is_refresh_due() );

		do_action( 'jetpack_deactivate_module', 'stats', true );
		$this->assertTrue( Historically_Active_Modules::is_refresh_due() );
	}
}
