<?php
/**
 * Unit tests for the modernization gating around the admin UI. The REST-side
 * companion is `Rest_Bridge_Gating_Test`.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use function add_filter;
use function remove_all_actions;
use function remove_all_filters;
use function wp_dequeue_script;
use function wp_deregister_script;
use function wp_script_is;

require_once __DIR__ . '/mock-wp-build-render-page.php';

/**
 * Tests the flag -> menu callback -> enqueue chain.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\Jetpack_Backup
 */
#[CoversClass( Jetpack_Backup::class )]
class Admin_Modernization_Gating_Test extends TestCase {

	/** @var string[] Handles the code under test registers itself. */
	private const OWNED_SCRIPT_HANDLES = array( 'jetpack-backup', 'jp-tracks', 'jp-tracks-functions' );

	/** @var string[] Handles registered elsewhere that the code under test only enqueues. */
	private const BORROWED_SCRIPT_HANDLES = array( 'wp-jp-i18n-loader' );

	public function setUp(): void {
		parent::setUp();

		$this->reset_scripts();
		$this->set_admin_menu_items( array() );
	}

	public function tearDown(): void {
		remove_all_filters( Jetpack_Backup::MODERNIZATION_FILTER );
		remove_all_filters( 'jetpack_offline_mode' );
		remove_all_actions( 'load-jetpack_page_jetpack-backup' );
		remove_all_actions( 'jetpack_use_iframe_authorization_flow' );

		$this->reset_scripts();
		$this->set_admin_menu_items( array() );

		Status_Cache::clear();
		WorDBless_Options::init()->clear_options();

		parent::tearDown();
	}

	public function test_is_modernized_defaults_to_false() {
		$this->assertFalse( Jetpack_Backup::is_modernized() );
	}

	public function test_is_modernized_follows_the_filter() {
		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
		$this->assertTrue( Jetpack_Backup::is_modernized() );

		remove_all_filters( Jetpack_Backup::MODERNIZATION_FILTER );
		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_false' );
		$this->assertFalse( Jetpack_Backup::is_modernized() );
	}

	public function test_enqueue_admin_scripts_registers_legacy_script_when_not_modernized() {
		Jetpack_Backup::enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'jetpack-backup', 'registered' ) );
		$this->assertTrue( wp_script_is( 'jetpack-backup', 'enqueued' ) );
	}

	/** With the flag on, wp-build enqueues its own bundle; a second one renders a second dashboard. */
	public function test_enqueue_admin_scripts_skips_legacy_script_when_modernized() {
		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );

		Jetpack_Backup::enqueue_admin_scripts();

		$this->assertFalse( wp_script_is( 'jetpack-backup', 'registered' ) );
	}

	public function test_enqueue_admin_scripts_enqueues_tracks_when_modernized() {
		$this->allow_analytics();
		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );

		$this->assertTrue( Jetpack_Backup::can_use_analytics() );

		Jetpack_Backup::enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'jp-tracks', 'registered' ) );
		$this->assertTrue( wp_script_is( 'jp-tracks-functions', 'enqueued' ) );
	}

	public function test_enqueue_admin_scripts_skips_tracks_when_analytics_denied() {
		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );

		$this->assertFalse( Jetpack_Backup::can_use_analytics() );

		Jetpack_Backup::enqueue_admin_scripts();

		$this->assertFalse( wp_script_is( 'jp-tracks-functions', 'registered' ) );
	}

	public function test_add_wp_admin_submenu_uses_legacy_callback_when_not_modernized() {
		Jetpack_Backup::add_wp_admin_submenu();

		$items = $this->get_admin_menu_items();
		$this->assertCount( 1, $items );
		$this->assertSame( Jetpack_Backup::JETPACK_BACKUP_SLUG, $items[0]['menu_slug'] );
		$this->assertSame( array( Jetpack_Backup::class, 'plugin_settings_page' ), $items[0]['function'] );
		$this->assertSame( 'Jetpack Backup', $items[0]['page_title'] );
		$this->assertSame( 'Backup', $items[0]['menu_title'] );
	}

	public function test_add_wp_admin_submenu_uses_wp_build_callback_when_modernized() {
		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );

		Jetpack_Backup::add_wp_admin_submenu();

		$items = $this->get_admin_menu_items();
		$this->assertCount( 1, $items );
		$this->assertSame( Jetpack_Backup::JETPACK_BACKUP_SLUG, $items[0]['menu_slug'] );
		$this->assertSame( 'jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page', $items[0]['function'] );
		$this->assertSame( 'Jetpack VaultPress Backup', $items[0]['page_title'] );
		$this->assertSame( 'VaultPress Backup', $items[0]['menu_title'] );
	}

	/** `can_use_analytics()` needs offline mode off and the terms of service agreed. */
	private function allow_analytics() {
		add_filter( 'jetpack_offline_mode', '__return_false' );
		Status_Cache::clear();
		Jetpack_Options::update_option( 'tos_agreed', true );
	}

	/** Undo every registration and enqueue these tests trigger. */
	private function reset_scripts() {
		// `wp_deregister_script()` only unsets the handle from `registered`; it
		// never touches `queue`. Without an explicit dequeue an enqueued handle
		// stays queued for every later test, and `wp_script_is( $h, 'enqueued' )`
		// reads `queue` alone.
		foreach ( array_merge( self::OWNED_SCRIPT_HANDLES, self::BORROWED_SCRIPT_HANDLES ) as $handle ) {
			wp_dequeue_script( $handle );
		}

		// Borrowed handles stay registered: jetpack-assets adds `wp-jp-i18n-loader`
		// once on `wp_default_scripts`, so nothing puts it back for later tests.
		foreach ( self::OWNED_SCRIPT_HANDLES as $handle ) {
			wp_deregister_script( $handle );
		}
	}

	/**
	 * @return array The Admin_Menu package's queued menu items.
	 */
	private function get_admin_menu_items() {
		return $this->accessible_property( Admin_Menu::class, 'menu_items' )->getValue();
	}

	/**
	 * @param array $items The Admin_Menu package's queued menu items to set.
	 */
	private function set_admin_menu_items( $items ) {
		$this->accessible_property( Admin_Menu::class, 'menu_items' )->setValue( null, $items );
	}

	/**
	 * @param string $class_name    The class owning the property.
	 * @param string $property_name The property name.
	 * @return \ReflectionProperty
	 */
	private function accessible_property( $class_name, $property_name ) {
		$property = new \ReflectionProperty( $class_name, $property_name );
		if ( \PHP_VERSION_ID < 80100 ) {
			// Required to access non-public members before PHP 8.1; deprecated no-op since PHP 8.5.
			$property->setAccessible( true );
		}
		return $property;
	}
}
