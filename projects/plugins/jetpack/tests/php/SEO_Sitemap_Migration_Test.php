<?php
/**
 * Tests the one-time migration that records the Sitemaps module's state into the
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
class SEO_Sitemap_Migration_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The durable option under test.
	 *
	 * @var string
	 */
	private $option = Jetpack_SEO_Initializer::SITEMAP_ENABLED_OPTION;

	/**
	 * Reset the option, active-modules list, and sitemap cron between tests.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( $this->option );
		Jetpack_Options::delete_option( 'active_modules' );
		wp_clear_scheduled_hook( 'jp_sitemap_cron_hook' );
		delete_option( 'jetpack-sitemap-state' );
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
	 * With sitemaps active, the migration seeds the option truthy.
	 */
	public function test_migration_seeds_true_when_sitemaps_active() {
		$this->set_active_modules( array( 'sitemaps' ) );

		Jetpack::migrate_sitemaps_module_to_seo_option();

		$this->assertTrue( (bool) get_option( $this->option ) );
	}

	/**
	 * With sitemaps inactive, the migration seeds the option (present) but falsey.
	 */
	public function test_migration_seeds_false_when_sitemaps_inactive() {
		$this->set_active_modules( array() );

		Jetpack::migrate_sitemaps_module_to_seo_option();

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

		Jetpack::migrate_sitemaps_module_to_seo_option();

		$this->assertTrue( (bool) get_option( $this->option ) );
	}

	/**
	 * The migration is non-destructive: it touches no generated sitemap data, the
	 * generation-state option, or the regeneration cron.
	 */
	public function test_migration_is_non_destructive() {
		$this->set_active_modules( array( 'sitemaps' ) );

		Jetpack::migrate_sitemaps_module_to_seo_option();

		// No sitemap posts were created.
		$this->assertSame(
			array(),
			get_posts(
				array(
					'post_type'   => 'jp_sitemap',
					'post_status' => 'draft',
				)
			)
		);
		// Generation state was not initialized.
		$this->assertFalse( get_option( 'jetpack-sitemap-state' ) );
		// No regeneration was scheduled.
		$this->assertFalse( wp_next_scheduled( 'jp_sitemap_cron_hook' ) );
	}

	/**
	 * The sync reflects the current module state into the option, in both directions.
	 */
	public function test_sync_tracks_module_state() {
		$this->set_active_modules( array( 'sitemaps' ) );
		Jetpack::sync_seo_sitemap_option();
		$this->assertTrue( (bool) get_option( $this->option ) );

		$this->set_active_modules( array() );
		Jetpack::sync_seo_sitemap_option();
		$this->assertFalse( (bool) get_option( $this->option ) );
	}

	/**
	 * The SEO Overview read sources `sitemap_active` from the durable option.
	 */
	public function test_overview_read_sources_sitemap_active_from_option() {
		update_option( $this->option, true );
		$overview = Jetpack_SEO_Initializer::get_overview_data();
		$this->assertTrue( $overview['site_visibility']['sitemap_active'] );

		update_option( $this->option, false );
		$overview = Jetpack_SEO_Initializer::get_overview_data();
		$this->assertFalse( $overview['site_visibility']['sitemap_active'] );
	}

	/**
	 * When the option has not been seeded yet, the read falls back to live module state.
	 */
	public function test_overview_read_falls_back_to_module_when_option_absent() {
		delete_option( $this->option );
		$this->set_active_modules( array( 'sitemaps' ) );

		$overview = Jetpack_SEO_Initializer::get_overview_data();

		$this->assertTrue( $overview['site_visibility']['sitemap_active'] );
	}
}
