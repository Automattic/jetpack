<?php
/**
 * Menu visibility resolver tests.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use PHPUnit\Framework\TestCase;
use WorDBless\Users as WorDBless_Users;

require_once __DIR__ . '/class-sample-gated-product.php';

/**
 * Unit tests for the Menu_Visibility class.
 */
class Menu_Visibility_Test extends TestCase {

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		add_filter( 'my_jetpack_products_classes', array( $this, 'replace_stats_product' ) );
	}

	/**
	 * Returning the environment to its previous state.
	 */
	public function tearDown(): void {
		remove_filter( 'my_jetpack_products_classes', array( $this, 'replace_stats_product' ) );
		Sample_Gated_Product::$active = true;
		Admin_Menu::set_visibility_resolver( null );
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Swaps the Stats product for one whose activation the test controls.
	 *
	 * @param array $classes The registered product classes.
	 * @return array
	 */
	public function replace_stats_product( $classes ) {
		$classes['stats'] = Sample_Gated_Product::class;

		return $classes;
	}

	/**
	 * A declaration naming an active product resolves true.
	 */
	public function test_active_product_resolves_true() {
		Sample_Gated_Product::$active = true;

		$this->assertTrue( Menu_Visibility::resolve( array( 'product' => 'stats' ) ) );
	}

	/**
	 * A declaration naming an inactive product resolves false.
	 */
	public function test_inactive_product_resolves_false() {
		Sample_Gated_Product::$active = false;

		$this->assertFalse( Menu_Visibility::resolve( array( 'product' => 'stats' ) ) );
	}

	/**
	 * A product slug with no class behind it cannot be answered.
	 */
	public function test_unknown_product_resolves_null() {
		$this->assertNull( Menu_Visibility::resolve( array( 'product' => 'not-a-product' ) ) );
	}

	/**
	 * A declaration with no gate cannot be answered.
	 */
	public function test_empty_declaration_resolves_null() {
		$this->assertNull( Menu_Visibility::resolve( array() ) );
	}

	/**
	 * A module declaration follows the module's active state.
	 *
	 * Driven through `jetpack_active_modules` rather than the option, because what makes a
	 * module available differs by whether the Jetpack plugin is loaded, and this is asserting
	 * that resolve() delegates — not how the Modules package computes availability.
	 */
	public function test_module_declaration_follows_the_module() {
		add_filter( 'jetpack_active_modules', array( $this, 'activate_sample_module' ) );

		$this->assertTrue( Menu_Visibility::resolve( array( 'module' => 'sample-module' ) ) );
		$this->assertFalse( Menu_Visibility::resolve( array( 'module' => 'other-module' ) ) );

		remove_filter( 'jetpack_active_modules', array( $this, 'activate_sample_module' ) );
	}

	/**
	 * Reports one module as active.
	 *
	 * @param array $modules Active module slugs.
	 * @return array
	 */
	public function activate_sample_module( $modules ) {
		$modules[] = 'sample-module';

		return $modules;
	}

	/**
	 * A product declaration wins over a module declaration on the same item.
	 */
	public function test_product_takes_precedence_over_module() {
		Sample_Gated_Product::$active = false;
		add_filter( 'jetpack_active_modules', array( $this, 'activate_sample_module' ) );

		$this->assertTrue(
			Menu_Visibility::resolve( array( 'module' => 'sample-module' ) ),
			'The module has to read as active for this test to mean anything.'
		);
		$this->assertFalse(
			Menu_Visibility::resolve(
				array(
					'product' => 'stats',
					'module'  => 'sample-module',
				)
			)
		);

		remove_filter( 'jetpack_active_modules', array( $this, 'activate_sample_module' ) );
	}

	/**
	 * Deactivating a product removes the sidebar item that declared it.
	 *
	 * The end-to-end claim of the whole mechanism, across both packages: My Jetpack's answer
	 * reaches the menu registration that Admin_Menu performs.
	 */
	public function test_deactivating_a_product_removes_its_menu_item() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'menu_visibility_admin',
					'user_pass'  => '123',
					'role'       => 'administrator',
				)
			)
		);
		Menu_Visibility::init();

		Admin_Menu::add_menu( 'Stats', 'Stats', 'manage_options', 'gated-stats', '__return_null', null, array( 'product' => 'stats' ) );

		Sample_Gated_Product::$active = true;
		$this->assertContains( 'gated-stats', $this->register_menu() );

		Sample_Gated_Product::$active = false;
		$this->assertNotContains( 'gated-stats', $this->register_menu() );
	}

	/**
	 * Runs menu registration from scratch and returns the slugs it produced.
	 *
	 * @return array
	 */
	private function register_menu() {
		$this->reset_submenu();

		do_action( 'admin_menu' );

		global $submenu;

		return array_column( $submenu['jetpack'] ?? array(), 2 );
	}

	/**
	 * Empties the registered submenu so a second registration pass starts clean.
	 *
	 * @return void
	 */
	private function reset_submenu() {
		global $submenu;

		$submenu = array();
	}
}
