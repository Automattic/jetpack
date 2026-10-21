<?php
/**
 * My Jetpack's admin-ui calls against an Admin_Menu that predates the resolver and named constants.
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
	 * Loads the older Admin_Menu in place of the real one.
	 */
	public function setUp(): void {
		parent::setUp();

		require_once __DIR__ . '/stubs/older-admin-ui/class-admin-menu.php';
	}

	/**
	 * Registration is skipped rather than fatal, which leaves gated items visible.
	 */
	public function test_init_skips_registration_when_admin_menu_lacks_the_resolver() {
		$this->assertFalse( method_exists( Admin_Menu::class, 'set_visibility_resolver' ) );

		Menu_Visibility::init();

		$this->assertFalse( has_action( 'admin_menu', array( Menu_Visibility::class, 'forget_resolved_gates' ) ) );
	}

	/**
	 * My Jetpack keeps the top slot without the named position tiers.
	 */
	public function test_menu_item_registers_first_without_position_constants() {
		Initializer::add_my_jetpack_menu_item();

		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared by the stub, which Phan excludes.
		$this->assertSame( -10, Admin_Menu::$positions['my-jetpack'] );
	}

	/**
	 * A host can still hide Features page items without the named visibility states.
	 */
	public function test_hidden_features_resolve_without_visibility_constants() {
		add_filter(
			'jetpack_my_jetpack_feature_visibility',
			function () {
				return array(
					'search' => 'hidden',
					'stats'  => 'visible',
				);
			}
		);

		$this->assertSame( array( 'search' ), Feature_Visibility::get_hidden() );
	}
}
