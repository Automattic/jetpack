<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Transient_Cleanup class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

/**
 * Class Transient_Cleanup_Test
 */
class Transient_Cleanup_Test extends StatsBaseTestCase {

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		parent::tear_down();

		// Unschedule cron.
		Transient_Cleanup::unschedule_cleanup();

		// Remove any test filters.
		remove_all_filters( 'jetpack_stats_transient_cleanup_prefixes' );
		remove_all_filters( 'jetpack_stats_transient_cleanup_disabled' );
	}

	/**
	 * Test that init registers the cron hook.
	 */
	public function test_init_registers_cron_hook() {
		Transient_Cleanup::init();

		$this->assertNotFalse(
			has_action( Transient_Cleanup::CRON_HOOK, array( Transient_Cleanup::class, 'run_cleanup' ) )
		);
	}

	/**
	 * Test that init registers the cron schedule filter.
	 */
	public function test_init_registers_cron_schedule_filter() {
		Transient_Cleanup::init();

		$this->assertNotFalse(
			has_filter( 'cron_schedules', array( Transient_Cleanup::class, 'add_cron_schedule' ) )
		);
	}

	/**
	 * Test that add_cron_schedule adds the six hour schedule.
	 */
	public function test_add_cron_schedule() {
		$schedules = Transient_Cleanup::add_cron_schedule( array() );

		$this->assertArrayHasKey( 'jetpack_stats_eight_hours', $schedules );
		$this->assertSame( Transient_Cleanup::CRON_INTERVAL, $schedules['jetpack_stats_eight_hours']['interval'] );
		$this->assertSame( 28800, $schedules['jetpack_stats_eight_hours']['interval'] ); // 8 hours in seconds.
	}

	/**
	 * Test that add_cron_schedule does not override existing schedule.
	 */
	public function test_add_cron_schedule_does_not_override() {
		$existing = array(
			'jetpack_stats_eight_hours' => array(
				'interval' => 12345,
				'display'  => 'Existing',
			),
		);

		$schedules = Transient_Cleanup::add_cron_schedule( $existing );

		$this->assertSame( 12345, $schedules['jetpack_stats_eight_hours']['interval'] );
	}

	/**
	 * Test that schedule_cleanup schedules the cron event.
	 */
	public function test_schedule_cleanup() {
		Transient_Cleanup::init();
		Transient_Cleanup::schedule_cleanup();

		$this->assertNotFalse( wp_next_scheduled( Transient_Cleanup::CRON_HOOK ) );
	}

	/**
	 * Test that schedule_cleanup does not reschedule if already scheduled.
	 */
	public function test_schedule_cleanup_does_not_reschedule() {
		Transient_Cleanup::init();
		Transient_Cleanup::schedule_cleanup();

		$first_timestamp = wp_next_scheduled( Transient_Cleanup::CRON_HOOK );

		// Try to schedule again.
		Transient_Cleanup::schedule_cleanup();

		$second_timestamp = wp_next_scheduled( Transient_Cleanup::CRON_HOOK );

		$this->assertSame( $first_timestamp, $second_timestamp );
	}

	/**
	 * Test that unschedule_cleanup removes the cron event.
	 */
	public function test_unschedule_cleanup() {
		Transient_Cleanup::init();
		Transient_Cleanup::schedule_cleanup();
		Transient_Cleanup::unschedule_cleanup();

		$this->assertFalse( wp_next_scheduled( Transient_Cleanup::CRON_HOOK ) );
	}

	/**
	 * Test that cleanup can be disabled via filter.
	 */
	public function test_cleanup_disabled_via_filter() {
		add_filter( 'jetpack_stats_transient_cleanup_disabled', '__return_true' );

		$result = Transient_Cleanup::run_cleanup();

		$this->assertFalse( $result );
	}

	/**
	 * Test that run_cleanup returns 0 when no expired transients exist.
	 */
	public function test_run_cleanup_returns_zero_when_no_expired() {
		$result = Transient_Cleanup::run_cleanup();

		$this->assertSame( 0, $result );
	}

	/**
	 * Test that get_transient_prefixes returns default prefix.
	 */
	public function test_get_transient_prefixes_returns_default() {
		$prefixes = Transient_Cleanup::get_transient_prefixes();

		$this->assertContains( WPCOM_Stats::STATS_CACHE_TRANSIENT_PREFIX, $prefixes );
	}

	/**
	 * Test that get_transient_prefixes filter works.
	 */
	public function test_get_transient_prefixes_filter() {
		add_filter(
			'jetpack_stats_transient_cleanup_prefixes',
			function ( $prefixes ) {
				$prefixes[] = 'custom_prefix_';
				return $prefixes;
			}
		);

		$prefixes = Transient_Cleanup::get_transient_prefixes();

		$this->assertContains( WPCOM_Stats::STATS_CACHE_TRANSIENT_PREFIX, $prefixes );
		$this->assertContains( 'custom_prefix_', $prefixes );
	}

	/**
	 * Test constants have expected values.
	 */
	public function test_constants() {
		$this->assertSame( 'jetpack_stats_transient_cleanup', Transient_Cleanup::CRON_HOOK );
		$this->assertSame( 100, Transient_Cleanup::BATCH_SIZE );
		$this->assertSame( 28800, Transient_Cleanup::CRON_INTERVAL );
	}
}
