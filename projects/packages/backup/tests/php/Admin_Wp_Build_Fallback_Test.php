<?php
/**
 * Tests for the shared wp-build-dashboard predicate.
 *
 * Named for the fallback rather than the class: a `Jetpack_Backup_Test` already
 * exists here, and `Admin_Modernization_Gating_Test` is taken by in-flight work
 * on the same area.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use ReflectionProperty;

/**
 * The menu callback, the menu titles and the legacy script enqueue all have to
 * read the same predicate. When they disagreed, a modernization flag switched on
 * without a wp-build present rendered an empty div and enqueued nothing.
 *
 * The build-absent half of that pair cannot be tested: a PHP function cannot be
 * undeclared once `stub-wp-build-render-page.php` has declared it. What is
 * covered here is that the build-present and flag-off paths still behave as
 * they did before the predicate was extracted.
 */
class Admin_Wp_Build_Fallback_Test extends TestCase {

	/**
	 * Declare the wp-build render function the predicate probes for.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		require_once __DIR__ . '/stub-wp-build-render-page.php';
	}

	/**
	 * Reset everything the tested methods write to.
	 */
	public function tearDown(): void {
		remove_all_filters( Jetpack_Backup::MODERNIZATION_FILTER );
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

	public function test_predicate_is_false_when_the_filter_is_off() {
		$this->assertFalse( $this->is_wp_build_dashboard_active() );
	}

	public function test_predicate_is_true_when_the_filter_is_on_and_the_build_is_present() {
		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );

		$this->assertTrue( $this->is_wp_build_dashboard_active() );
	}

	public function test_menu_uses_the_wp_build_dashboard_when_the_build_is_present() {
		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );

		Jetpack_Backup::add_wp_admin_submenu();

		$item = $this->get_queued_backup_menu_item();
		$this->assertSame( 'jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page', $item['function'] );
		$this->assertSame( 'Jetpack VaultPress Backup', $item['page_title'] );
		$this->assertSame( 'VaultPress Backup', $item['menu_title'] );
	}

	public function test_menu_uses_the_legacy_dashboard_when_the_filter_is_off() {
		Jetpack_Backup::add_wp_admin_submenu();

		$item = $this->get_queued_backup_menu_item();
		$this->assertSame( array( Jetpack_Backup::class, 'plugin_settings_page' ), $item['function'] );
		$this->assertSame( 'Jetpack Backup', $item['page_title'] );
		$this->assertSame( 'Backup', $item['menu_title'] );
	}

	public function test_enqueue_skips_the_legacy_script_when_the_build_is_present() {
		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );

		Jetpack_Backup::enqueue_admin_scripts();

		$this->assertFalse( wp_script_is( 'jetpack-backup', 'registered' ) );
	}

	public function test_enqueue_registers_the_legacy_script_when_the_filter_is_off() {
		Jetpack_Backup::enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'jetpack-backup', 'registered' ) );
		$this->assertTrue( wp_script_is( 'jetpack-backup', 'enqueued' ) );
	}
}
