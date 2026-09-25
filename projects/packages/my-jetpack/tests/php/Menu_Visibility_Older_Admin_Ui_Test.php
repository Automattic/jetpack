<?php
/**
 * Menu visibility tests against an admin-ui that predates the resolver.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * Separate processes let the stub load before the autoloader reaches the real Admin_Menu.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Menu_Visibility_Older_Admin_Ui_Test extends TestCase {

	/**
	 * Registration is skipped rather than fatal, which leaves gated items visible.
	 */
	public function test_init_skips_registration_when_admin_menu_lacks_the_resolver() {
		require_once __DIR__ . '/stubs/older-admin-ui/class-admin-menu.php';
		$this->assertFalse( method_exists( Admin_Menu::class, 'set_visibility_resolver' ) );

		Menu_Visibility::init();

		$this->assertFalse( has_action( 'admin_menu', array( Menu_Visibility::class, 'forget_resolved_gates' ) ) );
	}
}
