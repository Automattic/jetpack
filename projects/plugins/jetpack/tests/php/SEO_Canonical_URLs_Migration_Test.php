<?php
/**
 * Tests the one-time migration that records the Canonical URLs module's state into the
 * durable Jetpack SEO option, and the sync that keeps the two aligned.
 *
 * @package jetpack
 */

use Automattic\Jetpack\SEO\Initializer as Jetpack_SEO_Initializer;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Covers only \Jetpack here: the migration is seeded/synced from the plugin, while the
 * seo package's Initializer (whose option getters this test also exercises) lives outside
 * this suite's coverage scope and is measured by the package's own unit tests.
 *
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class SEO_Canonical_URLs_Migration_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The durable option under test.
	 *
	 * @var string
	 */
	private $option = Jetpack_SEO_Initializer::CANONICAL_ENABLED_OPTION;

	/**
	 * Reset the option and active-modules list between tests.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( $this->option );
		Jetpack_Options::delete_option( 'active_modules' );
	}

	/**
	 * Mark the given modules active in the raw `active_modules` option.
	 *
	 * @param array $modules Module slugs to store as active.
	 */
	private function set_active_modules( array $modules ) {
		Jetpack_Options::update_option( 'active_modules', $modules );
	}

	/**
	 * With canonical-urls active, the migration seeds the option truthy.
	 */
	public function test_migration_seeds_true_when_canonical_active() {
		$this->set_active_modules( array( 'canonical-urls' ) );

		Jetpack::migrate_canonical_urls_module_to_seo_option();

		$this->assertTrue( (bool) get_option( $this->option ) );
	}

	/**
	 * With canonical-urls inactive, the migration seeds the option (present) but falsey.
	 */
	public function test_migration_seeds_false_when_canonical_inactive() {
		$this->set_active_modules( array() );

		Jetpack::migrate_canonical_urls_module_to_seo_option();

		// The option exists (a sentinel default would be returned only if absent)...
		$this->assertNotSame( 'sentinel', get_option( $this->option, 'sentinel' ) );
		// ...and reads as disabled.
		$this->assertFalse( (bool) get_option( $this->option ) );
	}

	/**
	 * The migration never overwrites a value the user has already set.
	 */
	public function test_migration_does_not_clobber_existing_value() {
		add_option( $this->option, true );
		$this->set_active_modules( array() ); // Module inactive — a re-run must not flip it off.

		Jetpack::migrate_canonical_urls_module_to_seo_option();

		$this->assertTrue( (bool) get_option( $this->option ) );
	}

	/**
	 * The sync reflects the current module state into the option, in both directions.
	 */
	public function test_sync_tracks_module_state() {
		$this->set_active_modules( array( 'canonical-urls' ) );
		Jetpack::sync_seo_canonical_urls_option();
		$this->assertTrue( (bool) get_option( $this->option ) );

		$this->set_active_modules( array() );
		Jetpack::sync_seo_canonical_urls_option();
		$this->assertFalse( (bool) get_option( $this->option ) );
	}

	/**
	 * The SEO Settings read sources `canonical_active` from the durable option.
	 */
	public function test_settings_read_sources_canonical_active_from_option() {
		update_option( $this->option, true );
		$settings = Jetpack_SEO_Initializer::get_settings_data();
		$this->assertTrue( $settings['canonical_active'] );

		update_option( $this->option, false );
		$settings = Jetpack_SEO_Initializer::get_settings_data();
		$this->assertFalse( $settings['canonical_active'] );
	}

	/**
	 * When the option has not been seeded yet, the read falls back to live module state.
	 */
	public function test_settings_read_falls_back_to_module_when_option_absent() {
		delete_option( $this->option );
		$this->set_active_modules( array( 'canonical-urls' ) );

		$settings = Jetpack_SEO_Initializer::get_settings_data();

		$this->assertTrue( $settings['canonical_active'] );
	}

	/**
	 * The registrar wires up every migration + sync hook for both modules at the
	 * expected priority, from a single bootstrap call.
	 */
	public function test_register_seo_module_migration_hooks_wires_all_hooks() {
		$hooks = array(
			array( 'updating_jetpack_version', array( 'Jetpack', 'migrate_sitemaps_module_to_seo_option' ) ),
			array( 'jetpack_activate_module_sitemaps', array( 'Jetpack', 'sync_seo_sitemap_option' ) ),
			array( 'jetpack_deactivate_module_sitemaps', array( 'Jetpack', 'sync_seo_sitemap_option' ) ),
			array( 'updating_jetpack_version', array( 'Jetpack', 'migrate_canonical_urls_module_to_seo_option' ) ),
			array( 'jetpack_activate_module_canonical-urls', array( 'Jetpack', 'sync_seo_canonical_urls_option' ) ),
			array( 'jetpack_deactivate_module_canonical-urls', array( 'Jetpack', 'sync_seo_canonical_urls_option' ) ),
		);

		// Start from a clean slate so this proves the registrar wires the hooks, not the
		// plugin bootstrap (which registers the same hooks at load time).
		foreach ( $hooks as list( $hook, $callback ) ) {
			remove_action( $hook, $callback );
			$this->assertFalse( has_action( $hook, $callback ), "Expected {$hook} to be unhooked before registering." );
		}

		Jetpack::register_seo_module_migration_hooks();

		foreach ( $hooks as list( $hook, $callback ) ) {
			$this->assertSame( 10, has_action( $hook, $callback ), "Expected {$hook} to be hooked at priority 10." );
		}
	}
}
