<?php
/**
 * Tests for the wp-build-dashboard predicate and the missing-build notice.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use ReflectionProperty;

/**
 * The menu callback and the enqueue path read one predicate: whether the wp-build
 * dashboard loaded.
 *
 * The build-absent half cannot be tested: a PHP function cannot be undeclared once
 * `mock-wp-build-render-page.php` has declared it. Only the notice that replaces the
 * dashboard in that case is covered.
 */
class Admin_Wp_Build_Fallback_Test extends TestCase {

	/**
	 * Declare the wp-build render function the predicate probes for.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		require_once __DIR__ . '/mock-wp-build-render-page.php';
	}

	/**
	 * Reset everything the tested methods write to.
	 */
	public function tearDown(): void {
		remove_all_actions( 'admin_notices' );
		remove_all_actions( 'all_admin_notices' );
		remove_action( 'admin_enqueue_scripts', array( Jetpack_Backup::class, 'enqueue_admin_scripts' ) );
		$this->set_admin_menu_items( array() );
		wp_dequeue_script( 'jetpack-backup' );
		wp_deregister_script( 'jetpack-backup' );

		parent::tearDown();
	}

	/**
	 * Read the Admin_Menu package's queued menu items.
	 *
	 * @return array
	 */
	private function get_admin_menu_items() {
		$property = new ReflectionProperty( Admin_Menu::class, 'menu_items' );
		if ( \PHP_VERSION_ID < 80100 ) {
			// Required to read non-public members before PHP 8.1; deprecated no-op since PHP 8.5.
			$property->setAccessible( true );
		}

		return $property->getValue();
	}

	/**
	 * Overwrite the Admin_Menu package's queued menu items.
	 *
	 * @param array $items The items to set.
	 */
	private function set_admin_menu_items( $items ) {
		$property = new ReflectionProperty( Admin_Menu::class, 'menu_items' );
		if ( \PHP_VERSION_ID < 80100 ) {
			// Required to write non-public members before PHP 8.1; deprecated no-op since PHP 8.5.
			$property->setAccessible( true );
		}

		$property->setValue( null, $items );
	}

	/**
	 * Call the private predicate.
	 *
	 * @return bool
	 */
	private function is_wp_build_dashboard_active() {
		$method = new ReflectionMethod( Jetpack_Backup::class, 'is_wp_build_dashboard_active' );
		if ( \PHP_VERSION_ID < 80100 ) {
			// Required to invoke non-public methods before PHP 8.1; deprecated no-op since PHP 8.5.
			$method->setAccessible( true );
		}

		return $method->invoke( null );
	}

	/**
	 * The single menu item queued by the method under test.
	 *
	 * @return array
	 */
	private function get_queued_backup_menu_item() {
		$items = $this->get_admin_menu_items();
		$this->assertCount( 1, $items );
		$this->assertSame( Jetpack_Backup::JETPACK_BACKUP_SLUG, $items[0]['menu_slug'] );

		return $items[0];
	}

	public function test_predicate_is_true_when_the_build_is_present() {
		$this->assertTrue( $this->is_wp_build_dashboard_active() );
	}

	public function test_menu_uses_the_wp_build_dashboard_when_the_build_is_present() {
		Jetpack_Backup::add_wp_admin_submenu();

		$item = $this->get_queued_backup_menu_item();
		$this->assertSame( 'jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page', $item['function'] );
		$this->assertSame( 'Jetpack VaultPress Backup', $item['page_title'] );
		$this->assertSame( 'Backup', $item['menu_title'] );
	}

	public function test_enqueue_skips_the_legacy_script_when_the_build_is_present() {
		Jetpack_Backup::enqueue_admin_scripts();

		$this->assertFalse( wp_script_is( 'jetpack-backup', 'registered' ) );
	}

	public function test_admin_init_suppresses_admin_notices_when_the_build_is_present() {
		add_action( 'admin_notices', '__return_null' );
		add_action( 'all_admin_notices', '__return_null' );

		Jetpack_Backup::admin_init();

		$this->assertFalse( has_action( 'admin_notices' ) );
		$this->assertFalse( has_action( 'all_admin_notices' ) );
	}

	public function test_missing_build_notice_names_the_problem() {
		ob_start();
		Jetpack_Backup::render_missing_build_notice();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'notice-error', $output );
		$this->assertStringContainsString( 'dashboard files are missing', $output );
	}
}
