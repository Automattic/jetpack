<?php
/**
 * Tests the one-time migration that records the Sitemaps module's state into the
 * durable Jetpack SEO option, and the sync that keeps the two aligned.
 *
 * @package jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\SEO\Dashboard_Data as Jetpack_SEO_Dashboard_Data;
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
		delete_option( Jetpack::SEO_MODULE_STATE_RECONCILED_OPTION );
		Jetpack_Options::delete_option( 'active_modules' );
		wp_clear_scheduled_hook( 'jp_sitemap_cron_hook' );
		delete_option( 'jetpack-sitemap-state' );
	}

	/**
	 * Drop any `jetpack_active_modules` filter a test added.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_active_modules' );
		Constants::clear_single_constant( 'IS_WPCOM' );
		parent::tear_down();
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
	 * Add wpcomsh's private-site module suppression callback.
	 */
	private function suppress_sitemaps_for_private_site() {
		if ( ! function_exists( '\Private_Site\filter_jetpack_active_modules' ) ) {
			require_once __DIR__ . '/files/wpcomsh-private-site-filter.php';
		}

		add_filter( 'jetpack_active_modules', '\Private_Site\filter_jetpack_active_modules' );
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
	 * A module suppressed at runtime — as wpcomsh does to `sitemaps` while an Atomic site is
	 * private — must not be recorded as disabled. The stored choice is what migrates.
	 */
	public function test_migration_ignores_runtime_module_suppression() {
		$this->set_active_modules( array( 'sitemaps' ) );
		$this->suppress_sitemaps_for_private_site();

		Jetpack::migrate_sitemaps_module_to_seo_option();

		$this->assertTrue( (bool) get_option( $this->option ) );
	}

	/**
	 * A site that never had sitemaps on still migrates as disabled while a filter is active,
	 * so the fix does not simply force the option on.
	 */
	public function test_migration_stays_false_when_suppressed_and_not_stored_active() {
		$this->set_active_modules( array() );
		$this->suppress_sitemaps_for_private_site();

		Jetpack::migrate_sitemaps_module_to_seo_option();

		$this->assertFalse( (bool) get_option( $this->option ) );
	}

	/**
	 * Sites already seeded from a filtered read by the 16.0 migration are repaired: the
	 * option reads disabled, the stored module state says otherwise, and reconciliation
	 * restores the user's choice.
	 */
	public function test_reconciliation_repairs_value_seeded_from_filtered_read() {
		// The state a private Atomic site was left in by the 16.0 migration.
		add_option( $this->option, false );
		$this->set_active_modules( array( 'sitemaps' ) );

		Jetpack::reconcile_seo_module_state_options();

		$this->assertTrue( (bool) get_option( $this->option ) );
	}

	/**
	 * Reconciliation reads stored state, not filtered state, so it repairs correctly even
	 * while the site is still private.
	 */
	public function test_reconciliation_repairs_while_module_is_still_suppressed() {
		add_option( $this->option, false );
		$this->set_active_modules( array( 'sitemaps' ) );
		$this->suppress_sitemaps_for_private_site();

		Jetpack::reconcile_seo_module_state_options();

		$this->assertTrue( (bool) get_option( $this->option ) );
	}

	/**
	 * Reconciliation leaves a correctly-migrated site alone.
	 */
	public function test_reconciliation_is_a_noop_when_the_value_is_already_correct() {
		add_option( $this->option, true );
		$this->set_active_modules( array( 'sitemaps' ) );

		Jetpack::reconcile_seo_module_state_options();

		$this->assertTrue( (bool) get_option( $this->option ) );
	}

	/**
	 * Reconciliation runs at most once, so a later choice by the user is never re-reverted
	 * on a subsequent version bump.
	 */
	public function test_reconciliation_runs_only_once() {
		add_option( $this->option, false );
		$this->set_active_modules( array( 'sitemaps' ) );

		Jetpack::reconcile_seo_module_state_options();
		$this->assertTrue( (bool) get_option( $this->option ) );

		// The user turns sitemaps off again from a surface that only writes the option.
		update_option( $this->option, false );

		Jetpack::reconcile_seo_module_state_options();

		$this->assertFalse( (bool) get_option( $this->option ) );
	}

	/**
	 * Reconciliation is as non-destructive as the migration it repairs.
	 */
	public function test_reconciliation_is_non_destructive() {
		$this->set_active_modules( array( 'sitemaps' ) );

		Jetpack::reconcile_seo_module_state_options();

		$this->assertSame(
			array(),
			get_posts(
				array(
					'post_type'   => 'jp_sitemap',
					'post_status' => 'draft',
				)
			)
		);
		$this->assertFalse( get_option( 'jetpack-sitemap-state' ) );
		$this->assertFalse( wp_next_scheduled( 'jp_sitemap_cron_hook' ) );
	}

	/**
	 * The sync reflects stored module state even when the module is suppressed at runtime.
	 */
	public function test_sync_tracks_stored_module_state_during_runtime_suppression() {
		$this->set_active_modules( array( 'sitemaps' ) );
		$this->suppress_sitemaps_for_private_site();
		Jetpack::sync_seo_sitemap_option();
		$this->assertTrue( (bool) get_option( $this->option ) );

		$this->set_active_modules( array() );
		Jetpack::sync_seo_sitemap_option();
		$this->assertFalse( (bool) get_option( $this->option ) );
	}

	/**
	 * Permanent overrides remain authoritative even while wpcomsh's temporary private-site
	 * suppression is present.
	 */
	public function test_seo_state_writes_honor_permanent_module_override_during_private_site_suppression() {
		$this->set_active_modules( array( 'sitemaps' ) );
		$this->suppress_sitemaps_for_private_site();
		add_filter(
			'jetpack_active_modules',
			function ( $modules ) {
				return array_values( array_diff( $modules, array( 'sitemaps' ) ) );
			},
			20
		);

		Jetpack::migrate_sitemaps_module_to_seo_option();
		$this->assertFalse( (bool) get_option( $this->option ) );

		update_option( $this->option, true );
		Jetpack::sync_seo_sitemap_option();
		$this->assertFalse( (bool) get_option( $this->option ) );

		update_option( $this->option, true );
		Jetpack::reconcile_seo_module_state_options();
		$this->assertFalse( (bool) get_option( $this->option ) );
	}

	/**
	 * Reading the migration state does not change same-priority filter ordering.
	 */
	public function test_migration_preserves_module_filter_order() {
		$this->set_active_modules( array() );
		$this->suppress_sitemaps_for_private_site();
		add_filter(
			'jetpack_active_modules',
			function ( $modules ) {
				$modules[] = 'sitemaps';
				return array_unique( $modules );
			}
		);

		$this->assertContains( 'sitemaps', apply_filters( 'jetpack_active_modules', array() ) );

		Jetpack::migrate_sitemaps_module_to_seo_option();

		$this->assertTrue( (bool) get_option( $this->option ) );
		$this->assertContains( 'sitemaps', apply_filters( 'jetpack_active_modules', array() ) );
	}

	/**
	 * WordPress.com Simple uses its filtered module state instead of the local raw option.
	 */
	public function test_migration_uses_filtered_module_state_on_wpcom_simple() {
		$filter = function ( $value, $name ) {
			return 'active_modules' === $name ? array( 'sitemaps' ) : $value;
		};

		Constants::set_constant( 'IS_WPCOM', true );
		add_filter( 'jetpack_options', $filter, 10, 2 );

		try {
			$this->assertSame( array(), Jetpack_Options::get_raw_option( 'jetpack_active_modules', array() ) );

			Jetpack::migrate_sitemaps_module_to_seo_option();

			$this->assertTrue( (bool) get_option( $this->option ) );
		} finally {
			remove_filter( 'jetpack_options', $filter );
			Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	/**
	 * The SEO Overview read sources `sitemap_active` from the durable option.
	 */
	public function test_overview_read_sources_sitemap_active_from_option() {
		update_option( $this->option, true );
		$overview = Jetpack_SEO_Dashboard_Data::get_overview_data();
		$this->assertTrue( $overview['site_visibility']['sitemap_active'] );

		update_option( $this->option, false );
		$overview = Jetpack_SEO_Dashboard_Data::get_overview_data();
		$this->assertFalse( $overview['site_visibility']['sitemap_active'] );
	}

	/**
	 * When the option has not been seeded yet, the read falls back to live module state.
	 */
	public function test_overview_read_falls_back_to_module_when_option_absent() {
		delete_option( $this->option );
		$this->set_active_modules( array( 'sitemaps' ) );

		$overview = Jetpack_SEO_Dashboard_Data::get_overview_data();

		$this->assertTrue( $overview['site_visibility']['sitemap_active'] );
	}
}
