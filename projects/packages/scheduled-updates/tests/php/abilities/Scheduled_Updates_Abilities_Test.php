<?php
/**
 * Tests for the Scheduled_Updates_Abilities Registrar subclass.
 *
 * @package automattic/scheduled-updates
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Scheduled_Updates\Abilities;

use Automattic\Jetpack\Scheduled_Updates;
use Automattic\Jetpack\Scheduled_Updates_Active;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for Scheduled_Updates_Abilities registration and execution.
 *
 * Run from projects/packages/scheduled-updates:
 *
 *   composer phpunit -- --filter Scheduled_Updates_Abilities_Test
 *
 * @covers \Automattic\Jetpack\Scheduled_Updates\Abilities\Scheduled_Updates_Abilities
 */
#[CoversClass( Scheduled_Updates_Abilities::class )]
class Scheduled_Updates_Abilities_Test extends BaseTestCase {

	/**
	 * Administrator user id, created once per test.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Editor user id, created once per test.
	 *
	 * @var int
	 */
	private $editor_id;

	/**
	 * {@inheritDoc}
	 */
	public function set_up() {
		parent::set_up_wordbless();
		WorDBless_Users::init()->clear_all_users();

		// Reset cron state and ensure scheduled-updates REST endpoints are wired up.
		delete_option( 'cron' );
		update_option( 'cron', array( 'version' => 2 ), true );
		Scheduled_Updates::init();

		$this->admin_id  = wp_insert_user(
			array(
				'user_login' => 'su_abilities_admin_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'su_abilities_editor_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( 0 );

		// Most tests open the gate; the "default disabled" test closes it explicitly.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Reset registrar hooks a prior test may have left behind. We
		// intentionally avoid touching the Abilities registry here.
		remove_action( 'wp_abilities_api_categories_init', array( Scheduled_Updates_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Scheduled_Updates_Abilities::class, 'register_abilities' ) );
	}

	/**
	 * {@inheritDoc}
	 */
	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_action( 'wp_abilities_api_categories_init', array( Scheduled_Updates_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Scheduled_Updates_Abilities::class, 'register_abilities' ) );

		wp_set_current_user( 0 );

		if ( did_action( 'wp_abilities_api_init' ) ) {
			$this->deregister_category_and_abilities();
		}

		wp_clear_scheduled_hook( Scheduled_Updates::PLUGIN_CRON_HOOK );
		delete_option( 'cron' );
		delete_option( 'jetpack_scheduled_update_statuses' );
		delete_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		delete_option( Scheduled_Updates_Active::OPTION_NAME );

		WorDBless_Users::init()->clear_all_users();
		WorDBless_Options::init()->clear_options();

		parent::tear_down();
	}

	/**
	 * Remove our category + abilities from the registry so tests don't leak.
	 */
	private function deregister_category_and_abilities(): void {
		if ( function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Scheduled_Updates_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			if ( wp_has_ability_category( Scheduled_Updates_Abilities::CATEGORY_SLUG ) ) {
				wp_unregister_ability_category( Scheduled_Updates_Abilities::CATEGORY_SLUG );
			}
		}
	}

	/**
	 * Build a sanitized `{ interval, timestamp }` schedule.
	 *
	 * @param string $when     Strtotime expression.
	 * @param string $interval Interval ("daily" or "weekly").
	 * @return array
	 */
	private function make_schedule( string $when = 'next Monday 8:00', string $interval = 'weekly' ): array {
		return array(
			'timestamp' => (int) strtotime( $when ),
			'interval'  => $interval,
		);
	}

	/**
	 * Seed a recurring schedule directly via WP-Cron so we don't have to
	 * round-trip the REST endpoint for every fixture.
	 *
	 * @param array  $plugins  Plugin list.
	 * @param int    $when     Unix timestamp of the next run.
	 * @param string $interval Interval slug.
	 * @return string Schedule id.
	 */
	private function seed_schedule( array $plugins, int $when, string $interval = 'daily' ): string {
		sort( $plugins, SORT_NATURAL | SORT_FLAG_CASE );
		wp_schedule_event( $when, $interval, Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins );
		return Scheduled_Updates::generate_schedule_id( $plugins );
	}

	// --- Abstract getters --------------------------------------------------

	/**
	 * The category slug must be the namespaced "jetpack-scheduled-updates".
	 */
	public function test_category_slug_is_namespaced(): void {
		$this->assertSame( 'jetpack-scheduled-updates', Scheduled_Updates_Abilities::get_category_slug() );
	}

	/**
	 * The category definition exposes a label and description.
	 */
	public function test_category_definition_has_label_and_description(): void {
		$def = Scheduled_Updates_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotSame( '', $def['label'] );
		$this->assertNotSame( '', $def['description'] );
	}

	/**
	 * The abilities map exposes exactly the five lifecycle slugs.
	 */
	public function test_abilities_map_lists_the_five_lifecycle_slugs(): void {
		$abilities = Scheduled_Updates_Abilities::get_abilities();
		$this->assertSame(
			array(
				'jetpack-scheduled-updates/list-schedules',
				'jetpack-scheduled-updates/create-schedule',
				'jetpack-scheduled-updates/update-schedule',
				'jetpack-scheduled-updates/delete-schedule',
				'jetpack-scheduled-updates/run-schedule-now',
			),
			array_keys( $abilities )
		);
	}

	/**
	 * Specs must not set their own `category` — Registrar auto-injects it.
	 */
	public function test_no_spec_sets_category_explicitly(): void {
		foreach ( Scheduled_Updates_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	/**
	 * Every spec must declare callable execute + permission and the standard
	 * annotation triplet, in the shape the rest of Jetpack abilities use.
	 */
	public function test_every_spec_declares_callbacks_and_annotations(): void {
		foreach ( Scheduled_Updates_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertIsCallable( $spec['execute_callback'], "Ability {$slug} execute_callback not callable" );
			$this->assertIsCallable( $spec['permission_callback'], "Ability {$slug} permission_callback not callable" );
			$this->assertArrayHasKey( 'annotations', $spec['meta'] );
			$this->assertArrayHasKey( 'readonly', $spec['meta']['annotations'] );
			$this->assertArrayHasKey( 'destructive', $spec['meta']['annotations'] );
			$this->assertArrayHasKey( 'idempotent', $spec['meta']['annotations'] );
		}
	}

	/**
	 * Mutation annotations encode the contract the docs describe:
	 *  - list is readonly+idempotent
	 *  - create is destructive + NOT idempotent
	 *  - update is destructive + idempotent
	 *  - delete is destructive + idempotent
	 *  - run-now is destructive + NOT idempotent
	 */
	public function test_annotation_matrix_matches_contract(): void {
		$abilities = Scheduled_Updates_Abilities::get_abilities();

		$this->assertTrue( $abilities['jetpack-scheduled-updates/list-schedules']['meta']['annotations']['readonly'] );
		$this->assertTrue( $abilities['jetpack-scheduled-updates/list-schedules']['meta']['annotations']['idempotent'] );
		$this->assertFalse( $abilities['jetpack-scheduled-updates/list-schedules']['meta']['annotations']['destructive'] );

		$this->assertFalse( $abilities['jetpack-scheduled-updates/create-schedule']['meta']['annotations']['readonly'] );
		$this->assertTrue( $abilities['jetpack-scheduled-updates/create-schedule']['meta']['annotations']['destructive'] );
		$this->assertFalse( $abilities['jetpack-scheduled-updates/create-schedule']['meta']['annotations']['idempotent'] );

		$this->assertFalse( $abilities['jetpack-scheduled-updates/update-schedule']['meta']['annotations']['readonly'] );
		$this->assertTrue( $abilities['jetpack-scheduled-updates/update-schedule']['meta']['annotations']['destructive'] );
		$this->assertTrue( $abilities['jetpack-scheduled-updates/update-schedule']['meta']['annotations']['idempotent'] );

		$this->assertFalse( $abilities['jetpack-scheduled-updates/delete-schedule']['meta']['annotations']['readonly'] );
		$this->assertTrue( $abilities['jetpack-scheduled-updates/delete-schedule']['meta']['annotations']['destructive'] );
		$this->assertTrue( $abilities['jetpack-scheduled-updates/delete-schedule']['meta']['annotations']['idempotent'] );

		$this->assertFalse( $abilities['jetpack-scheduled-updates/run-schedule-now']['meta']['annotations']['readonly'] );
		$this->assertTrue( $abilities['jetpack-scheduled-updates/run-schedule-now']['meta']['annotations']['destructive'] );
		$this->assertFalse( $abilities['jetpack-scheduled-updates/run-schedule-now']['meta']['annotations']['idempotent'] );
	}

	// --- Registrar wiring --------------------------------------------------

	/**
	 * When the `jetpack_wp_abilities_enabled` filter returns false, `init()`
	 * must register nothing (no category, no abilities, no hooks).
	 */
	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Scheduled_Updates_Abilities::init();

		$this->assertFalse(
			has_action( 'wp_abilities_api_categories_init', array( Scheduled_Updates_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( 'wp_abilities_api_init', array( Scheduled_Updates_Abilities::class, 'register_abilities' ) )
		);
	}

	/**
	 * With the gate open, init() must hook both registrar lifecycle actions.
	 */
	public function test_init_hooks_both_lifecycle_actions_when_gate_filter_is_true(): void {
		Scheduled_Updates_Abilities::init();

		$this->assertNotFalse(
			has_action( 'wp_abilities_api_categories_init', array( Scheduled_Updates_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( 'wp_abilities_api_init', array( Scheduled_Updates_Abilities::class, 'register_abilities' ) )
		);
	}

	// --- Permission callback ----------------------------------------------

	/**
	 * Anonymous callers are denied.
	 */
	public function test_can_manage_schedules_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Scheduled_Updates_Abilities::can_manage_schedules() );
	}

	/**
	 * Editors lack `update_plugins` and are denied.
	 */
	public function test_can_manage_schedules_denies_editor_without_update_plugins(): void {
		wp_set_current_user( $this->editor_id );
		$this->assertFalse( Scheduled_Updates_Abilities::can_manage_schedules() );
	}

	/**
	 * Administrators (who have `update_plugins`) are allowed.
	 */
	public function test_can_manage_schedules_allows_administrator(): void {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Scheduled_Updates_Abilities::can_manage_schedules() );
	}

	// --- list-schedules ----------------------------------------------------

	/**
	 * With no schedules, list-schedules returns an empty array (not a WP_Error).
	 */
	public function test_list_schedules_returns_empty_array_when_no_schedules(): void {
		wp_set_current_user( $this->admin_id );

		$out = Scheduled_Updates_Abilities::list_schedules();

		$this->assertIsArray( $out );
		$this->assertSame( array(), $out );
	}

	/**
	 * List-schedules projects raw cron events into the compact ability shape.
	 */
	public function test_list_schedules_projects_into_compact_shape(): void {
		wp_set_current_user( $this->admin_id );

		$plugins = array( 'gutenberg/gutenberg.php' );
		$when    = (int) strtotime( 'next Wednesday 10:00' );
		$id      = $this->seed_schedule( $plugins, $when, 'daily' );

		$out = Scheduled_Updates_Abilities::list_schedules();

		$this->assertCount( 1, $out );
		$entry = $out[0];
		$this->assertSame( $id, $entry['id'] );
		$this->assertSame( $plugins, $entry['plugins'] );
		$this->assertSame( 'daily', $entry['schedule']['interval'] );
		$this->assertSame( $when, $entry['schedule']['timestamp'] );
		$this->assertSame( gmdate( 'Y-m-d H:i:s', $when ), $entry['schedule']['next_run'] );
		$this->assertNull( $entry['last_run_status'] );
		$this->assertNull( $entry['last_run_timestamp'] );
		$this->assertTrue( $entry['active'] );
	}

	/**
	 * Passing `id` filters to a single schedule.
	 */
	public function test_list_schedules_filters_by_id(): void {
		wp_set_current_user( $this->admin_id );

		$first_id  = $this->seed_schedule( array( 'gutenberg/gutenberg.php' ), (int) strtotime( 'next Tuesday 9:00' ), 'daily' );
		$second_id = $this->seed_schedule( array( 'installed-plugin/installed-plugin.php' ), (int) strtotime( 'next Wednesday 9:00' ), 'weekly' );

		$out = Scheduled_Updates_Abilities::list_schedules( array( 'id' => $second_id ) );

		$this->assertCount( 1, $out );
		$this->assertSame( $second_id, $out[0]['id'] );
		$this->assertNotSame( $first_id, $out[0]['id'] );
	}

	/**
	 * An unknown `id` returns an empty array, not a WP_Error.
	 */
	public function test_list_schedules_unknown_id_returns_empty_array(): void {
		wp_set_current_user( $this->admin_id );
		$this->seed_schedule( array( 'gutenberg/gutenberg.php' ), (int) strtotime( 'next Tuesday 9:00' ) );

		$out = Scheduled_Updates_Abilities::list_schedules( array( 'id' => 'not-a-real-id' ) );

		$this->assertSame( array(), $out );
	}

	/**
	 * The `active` field reflects Scheduled_Updates_Active::update().
	 */
	public function test_list_schedules_reflects_paused_active_flag(): void {
		wp_set_current_user( $this->admin_id );
		$id = $this->seed_schedule( array( 'gutenberg/gutenberg.php' ), (int) strtotime( 'next Tuesday 9:00' ) );

		Scheduled_Updates_Active::update( $id, false );

		$out = Scheduled_Updates_Abilities::list_schedules( array( 'id' => $id ) );
		$this->assertFalse( $out[0]['active'] );
	}

	// --- create-schedule ---------------------------------------------------

	/**
	 * Happy path — create produces a new schedule with the documented shape.
	 */
	public function test_create_schedule_returns_id_and_schedule(): void {
		wp_set_current_user( $this->admin_id );

		$plugins  = array( 'gutenberg/gutenberg.php' );
		$schedule = $this->make_schedule( 'next Tuesday 9:00', 'daily' );

		$out = Scheduled_Updates_Abilities::create_schedule(
			array(
				'plugins'  => $plugins,
				'schedule' => $schedule,
			)
		);

		$this->assertIsArray( $out );
		$this->assertArrayHasKey( 'id', $out );
		$this->assertArrayHasKey( 'schedule', $out );
		$this->assertSame( Scheduled_Updates::generate_schedule_id( $plugins ), $out['id'] );
		// Order-agnostic equality — the sanitizer normalizes key order.
		$this->assertSame( $schedule['interval'], $out['schedule']['interval'] );
		$this->assertSame( $schedule['timestamp'], $out['schedule']['timestamp'] );

		// Schedule actually persisted in cron.
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertArrayHasKey( $out['id'], $events );
	}

	/**
	 * Empty plugin list is rejected before we hit the REST controller.
	 */
	public function test_create_schedule_rejects_empty_plugin_list(): void {
		wp_set_current_user( $this->admin_id );

		$out = Scheduled_Updates_Abilities::create_schedule(
			array(
				'plugins'  => array(),
				'schedule' => $this->make_schedule(),
			)
		);

		$this->assertWPError( $out );
		$this->assertSame( 'jetpack_scheduled_updates_invalid_plugins', $out->get_error_code() );
	}

	/**
	 * Unknown interval is rejected by the abilities layer.
	 */
	public function test_create_schedule_rejects_unknown_interval(): void {
		wp_set_current_user( $this->admin_id );

		$out = Scheduled_Updates_Abilities::create_schedule(
			array(
				'plugins'  => array( 'gutenberg/gutenberg.php' ),
				'schedule' => array(
					'interval'  => 'hourly',
					'timestamp' => (int) strtotime( 'next Tuesday 9:00' ),
				),
			)
		);

		$this->assertWPError( $out );
		$this->assertSame( 'jetpack_scheduled_updates_invalid_schedule', $out->get_error_code() );
	}

	// --- update-schedule ---------------------------------------------------

	/**
	 * Update with the same plugins + same schedule returns changed=false and
	 * skips the underlying delete+create.
	 */
	public function test_update_schedule_is_idempotent_when_no_changes(): void {
		wp_set_current_user( $this->admin_id );

		$plugins = array( 'gutenberg/gutenberg.php' );
		$when    = (int) strtotime( 'next Tuesday 9:00' );
		$id      = $this->seed_schedule( $plugins, $when, 'daily' );

		$out = Scheduled_Updates_Abilities::update_schedule(
			array(
				'id'       => $id,
				'plugins'  => $plugins,
				'schedule' => array(
					'interval'  => 'daily',
					'timestamp' => $when,
				),
			)
		);

		$this->assertIsArray( $out );
		$this->assertSame( $id, $out['id'] );
		$this->assertFalse( $out['changed'] );
		$this->assertSame( array(), $out['changed_fields'] );

		// Underlying cron event still keyed by the same id.
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertArrayHasKey( $id, $events );
	}

	/**
	 * Changing the schedule reports changed_fields = [ "schedule" ] and the
	 * underlying cron event is rewritten to the new timestamp.
	 */
	public function test_update_schedule_reports_schedule_change(): void {
		wp_set_current_user( $this->admin_id );

		$plugins  = array( 'gutenberg/gutenberg.php' );
		$original = (int) strtotime( 'next Tuesday 9:00' );
		$id       = $this->seed_schedule( $plugins, $original, 'daily' );

		$next_timestamp = (int) strtotime( 'next Friday 10:00' );

		$out = Scheduled_Updates_Abilities::update_schedule(
			array(
				'id'       => $id,
				'schedule' => array(
					'interval'  => 'daily',
					'timestamp' => $next_timestamp,
				),
			)
		);

		$this->assertIsArray( $out );
		$this->assertTrue( $out['changed'] );
		$this->assertSame( array( 'schedule' ), $out['changed_fields'] );

		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertSame( $next_timestamp, $events[ $out['id'] ]->timestamp );
	}

	/**
	 * Unknown id returns the documented not_found error.
	 */
	public function test_update_schedule_returns_not_found_for_unknown_id(): void {
		wp_set_current_user( $this->admin_id );

		$out = Scheduled_Updates_Abilities::update_schedule(
			array(
				'id'       => 'not-a-real-id',
				'schedule' => $this->make_schedule(),
			)
		);

		$this->assertWPError( $out );
		$this->assertSame( 'jetpack_scheduled_updates_not_found', $out->get_error_code() );
	}

	/**
	 * Update with neither plugins nor schedule is rejected.
	 */
	public function test_update_schedule_requires_at_least_one_change(): void {
		wp_set_current_user( $this->admin_id );
		$id = $this->seed_schedule( array( 'gutenberg/gutenberg.php' ), (int) strtotime( 'next Tuesday 9:00' ) );

		$out = Scheduled_Updates_Abilities::update_schedule( array( 'id' => $id ) );

		$this->assertWPError( $out );
		$this->assertSame( 'jetpack_scheduled_updates_no_changes', $out->get_error_code() );
	}

	// --- delete-schedule ---------------------------------------------------

	/**
	 * Happy path — delete reports the id, deleted=true, and changed=true.
	 */
	public function test_delete_schedule_removes_event(): void {
		wp_set_current_user( $this->admin_id );
		$id = $this->seed_schedule( array( 'gutenberg/gutenberg.php' ), (int) strtotime( 'next Tuesday 9:00' ) );

		$out = Scheduled_Updates_Abilities::delete_schedule( array( 'id' => $id ) );

		$this->assertIsArray( $out );
		$this->assertSame( $id, $out['id'] );
		$this->assertTrue( $out['deleted'] );
		$this->assertTrue( $out['changed'] );

		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertArrayNotHasKey( $id, $events );
	}

	/**
	 * Deleting an already-deleted schedule is idempotent — deleted=true,
	 * changed=false, no error.
	 */
	public function test_delete_schedule_is_idempotent_for_unknown_id(): void {
		wp_set_current_user( $this->admin_id );

		$out = Scheduled_Updates_Abilities::delete_schedule( array( 'id' => 'not-a-real-id' ) );

		$this->assertIsArray( $out );
		$this->assertTrue( $out['deleted'] );
		$this->assertFalse( $out['changed'] );
	}

	public function test_delete_schedule_requires_id(): void {
		wp_set_current_user( $this->admin_id );
		$out = Scheduled_Updates_Abilities::delete_schedule( array() );
		$this->assertWPError( $out );
		$this->assertSame( 'jetpack_scheduled_updates_missing_id', $out->get_error_code() );
	}

	// --- run-schedule-now --------------------------------------------------

	/**
	 * Happy path — queues a one-off run and reports the dispatch timestamp.
	 */
	public function test_run_schedule_now_queues_one_off_event(): void {
		wp_set_current_user( $this->admin_id );

		$plugins = array( 'gutenberg/gutenberg.php' );
		$id      = $this->seed_schedule( $plugins, (int) strtotime( 'next Tuesday 9:00' ), 'daily' );

		$out = Scheduled_Updates_Abilities::run_schedule_now( array( 'id' => $id ) );

		$this->assertIsArray( $out );
		$this->assertSame( $id, $out['id'] );
		$this->assertTrue( $out['dispatched'] );
		$this->assertIsInt( $out['job_id'] );
		$this->assertGreaterThan( time() - 1, $out['job_id'] );

		// A one-off cron event for the same hook + args is now queued at job_id.
		$queued_event = wp_get_scheduled_event( Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins, $out['job_id'] );
		$this->assertNotFalse( $queued_event );
	}

	/**
	 * Run-schedule-now refuses unknown ids with the documented not_found error.
	 */
	public function test_run_schedule_now_returns_not_found_for_unknown_id(): void {
		wp_set_current_user( $this->admin_id );

		$out = Scheduled_Updates_Abilities::run_schedule_now( array( 'id' => 'not-a-real-id' ) );

		$this->assertWPError( $out );
		$this->assertSame( 'jetpack_scheduled_updates_not_found', $out->get_error_code() );
	}

	public function test_run_schedule_now_requires_id(): void {
		wp_set_current_user( $this->admin_id );
		$out = Scheduled_Updates_Abilities::run_schedule_now( array() );
		$this->assertWPError( $out );
		$this->assertSame( 'jetpack_scheduled_updates_missing_id', $out->get_error_code() );
	}

	/**
	 * Assert that the value is a WP_Error.
	 *
	 * @param mixed $actual The value to check.
	 */
	private function assertWPError( $actual ): void {
		$this->assertInstanceOf( \WP_Error::class, $actual );
	}
}
