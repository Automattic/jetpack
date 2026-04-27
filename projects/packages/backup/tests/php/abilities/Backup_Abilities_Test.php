<?php
/**
 * Unit tests for the Backup_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-backup
 * @phan-file-suppress PhanPluginUnreachableCode -- markTestSkipped throws but Phan doesn't know that.
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Backup\V0005\Abilities;

use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Backup\V0005\Abilities\Backup_Abilities
 */
#[CoversClass( Backup_Abilities::class )]
class Backup_Abilities_Test extends BaseTestCase {

	private int $admin_id;
	private int $subscriber_id;

	public function setUp(): void {
		parent::setUp();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'backup_ability_admin_' . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'backup_ability_sub_' . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open. Individual tests opt out by removing this filter.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	public function tearDown(): void {
		wp_set_current_user( 0 );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'pre_http_request' );
		$this->deregister_backup_abilities();
		parent::tearDown();
	}

	/**
	 * Drop any abilities registered during this test so the next test starts
	 * clean and `wp_register_ability_category()` doesn't trigger
	 * "category already registered" notices.
	 */
	private function deregister_backup_abilities(): void {
		if ( function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Backup_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			$slug = Backup_Abilities::get_category_slug();
			if ( wp_has_ability_category( $slug ) ) {
				wp_unregister_ability_category( $slug );
			}
		}
	}

	/**
	 * Simulate the `wp_abilities_api_categories_init` action being mid-flight.
	 */
	private function simulate_doing_categories_init(): void {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_categories_init';
	}

	/**
	 * Simulate the `wp_abilities_api_init` action being mid-flight.
	 */
	private function simulate_doing_abilities_init(): void {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_init';
	}

	/**
	 * Reflection helper for the protected-by-encapsulation static methods.
	 *
	 * @param string $method Static method name.
	 * @param array  $args   Method arguments.
	 * @return mixed
	 */
	private function call_private( string $method, array $args = array() ) {
		$reflection = ( new ReflectionClass( Backup_Abilities::class ) )->getMethod( $method );
		$reflection->setAccessible( true );
		return $reflection->invokeArgs( null, $args );
	}

	// -------------------- Abstract getters --------------------

	public function test_category_slug_is_package_scoped(): void {
		$this->assertSame( 'jetpack-backup', Backup_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = Backup_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotEmpty( $def['label'] );
		$this->assertNotEmpty( $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = Backup_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-backup/', $slug );
		}
	}

	public function test_expected_ability_slugs_are_present(): void {
		$slugs = array_keys( Backup_Abilities::get_abilities() );
		foreach (
			array(
				'jetpack-backup/get-backup-overview',
				'jetpack-backup/get-backups',
				'jetpack-backup/get-restores',
				'jetpack-backup/run-backup',
			) as $expected
		) {
			$this->assertContains( $expected, $slugs );
		}
	}

	public function test_no_spec_sets_category_explicitly(): void {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Backup_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_ability_has_input_schema_with_strict_properties(): void {
		foreach ( Backup_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'input_schema', $spec, "Ability {$slug} missing input_schema." );
			$this->assertSame( 'object', $spec['input_schema']['type'] ?? null );
			$this->assertSame( false, $spec['input_schema']['additionalProperties'] ?? null, "Ability {$slug} must set additionalProperties=false." );
		}
	}

	public function test_annotations_match_read_vs_write(): void {
		$abilities = Backup_Abilities::get_abilities();

		foreach ( array( 'jetpack-backup/get-backup-overview', 'jetpack-backup/get-backups', 'jetpack-backup/get-restores' ) as $read_slug ) {
			$annotations = $abilities[ $read_slug ]['meta']['annotations'];
			$this->assertTrue( $annotations['readonly'], "{$read_slug} must be readonly." );
			$this->assertFalse( $annotations['destructive'] );
			$this->assertTrue( $annotations['idempotent'] );
		}

		$write_annotations = $abilities['jetpack-backup/run-backup']['meta']['annotations'];
		$this->assertFalse( $write_annotations['readonly'] );
		$this->assertFalse( $write_annotations['destructive'] );
		$this->assertFalse( $write_annotations['idempotent'], 'run-backup queues a new job each call; not idempotent.' );
	}

	public function test_pagination_inputs_have_default_and_max(): void {
		$abilities = Backup_Abilities::get_abilities();
		foreach ( array( 'jetpack-backup/get-backups', 'jetpack-backup/get-restores' ) as $slug ) {
			$props = $abilities[ $slug ]['input_schema']['properties'];
			$this->assertSame( Backup_Abilities::PER_PAGE_DEFAULT, $props['per_page']['default'] );
			$this->assertSame( Backup_Abilities::PER_PAGE_MAX, $props['per_page']['maximum'] );
		}
	}

	// -------------------- Registrar wiring --------------------

	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Backup_Abilities::init();

		$this->assertFalse(
			has_action( 'wp_abilities_api_categories_init', array( Backup_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( 'wp_abilities_api_init', array( Backup_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true(): void {
		Backup_Abilities::init();

		$this->assertNotFalse(
			has_action( 'wp_abilities_api_categories_init', array( Backup_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( 'wp_abilities_api_init', array( Backup_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_register_abilities_registers_every_slug(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this test environment.' );
		}

		$this->simulate_doing_categories_init();
		Backup_Abilities::register_category();

		$this->simulate_doing_abilities_init();
		Backup_Abilities::register_abilities();

		$registered = array_map(
			static fn ( $a ) => $a->get_name(),
			array_filter(
				wp_get_abilities(),
				static fn ( $a ) => str_starts_with( $a->get_name(), 'jetpack-backup/' )
			)
		);

		foreach ( array_keys( Backup_Abilities::get_abilities() ) as $slug ) {
			$this->assertContains( $slug, $registered, "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_has_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this test environment.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				if ( 'ability' === $type ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->simulate_doing_categories_init();
		Backup_Abilities::register_category();

		$this->simulate_doing_abilities_init();
		Backup_Abilities::register_abilities();

		foreach ( array_keys( Backup_Abilities::get_abilities() ) as $slug ) {
			$this->assertFalse( wp_has_ability( $slug ), "Ability {$slug} must be filtered out." );
		}
	}

	// -------------------- Permission callbacks --------------------

	public function test_can_view_backups_allows_admin(): void {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Backup_Abilities::can_view_backups() );
	}

	public function test_can_view_backups_denies_subscriber(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Backup_Abilities::can_view_backups() );
	}

	public function test_can_view_backups_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Backup_Abilities::can_view_backups() );
	}

	public function test_can_manage_backups_denies_subscriber(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Backup_Abilities::can_manage_backups() );
	}

	public function test_can_manage_backups_allows_admin(): void {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Backup_Abilities::can_manage_backups() );
	}

	// -------------------- Execute callbacks (smoke tests) --------------------
	// Full-fidelity execution requires a live Jetpack/WPCOM connection; without
	// it, Connection\Client returns WP_Error('missing_token'|'invalid_signature')
	// before the http layer. These tests verify that the callbacks degrade
	// gracefully when the upstream is unreachable.

	public function test_get_backups_returns_empty_array_when_upstream_unavailable(): void {
		wp_set_current_user( $this->admin_id );
		$result = Backup_Abilities::execute_get_backups( array() );
		$this->assertSame( array(), $result );
	}

	public function test_get_backups_with_unknown_id_returns_empty_array(): void {
		wp_set_current_user( $this->admin_id );
		$result = Backup_Abilities::execute_get_backups( array( 'id' => 'does-not-exist' ) );
		$this->assertSame( array(), $result );
	}

	public function test_get_restores_returns_empty_array_when_upstream_unavailable(): void {
		wp_set_current_user( $this->admin_id );
		$result = Backup_Abilities::execute_get_restores( array() );
		$this->assertSame( array(), $result );
	}

	public function test_get_backup_overview_returns_documented_shape_when_no_plan(): void {
		wp_set_current_user( $this->admin_id );
		$result = Backup_Abilities::execute_get_backup_overview( array() );
		$this->assertIsArray( $result );
		foreach ( array( 'has_plan', 'recent_backup_count', 'last_backup', 'schedule', 'storage' ) as $key ) {
			$this->assertArrayHasKey( $key, $result, "Overview must always include {$key} key." );
		}
		// Without a Jetpack connection, has_backup_plan returns false.
		$this->assertFalse( $result['has_plan'] );
		$this->assertNull( $result['last_backup'] );
	}

	public function test_run_backup_returns_wp_error_without_plan(): void {
		wp_set_current_user( $this->admin_id );
		$result = Backup_Abilities::execute_run_backup( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_backup_no_plan', $result->get_error_code() );
	}

	// -------------------- summarize_* helpers --------------------

	public function test_summarize_backup_keeps_high_signal_fields(): void {
		$raw = array(
			'id'            => 'b-1',
			'rewind_id'     => '1700000000.0',
			'started'       => '2026-04-26T01:00:00Z',
			'last_updated'  => '2026-04-26T01:05:00Z',
			'status'        => 'finished',
			'period'        => 'daily',
			'is_rewindable' => 1,
			'has_warnings'  => 0,
			'noise_field'   => 'should be dropped',
		);

		$result = $this->call_private( 'summarize_backup', array( $raw ) );

		$this->assertSame( 'b-1', $result['id'] );
		$this->assertSame( '1700000000.0', $result['rewind_id'] );
		$this->assertTrue( $result['is_rewindable'] );
		$this->assertFalse( $result['has_warnings'] );
		$this->assertArrayNotHasKey( 'noise_field', $result );
	}

	public function test_summarize_backup_handles_missing_optional_fields(): void {
		$result = $this->call_private( 'summarize_backup', array( array( 'id' => 'b-2' ) ) );

		$this->assertSame( 'b-2', $result['id'] );
		$this->assertNull( $result['rewind_id'] );
		$this->assertNull( $result['is_rewindable'] );
	}

	public function test_summarize_restore_keeps_high_signal_fields(): void {
		$raw = array(
			'id'           => 'r-1',
			'rewind_id'    => '1700000000.0',
			'started'      => '2026-04-26T01:00:00Z',
			'last_updated' => '2026-04-26T01:10:00Z',
			'status'       => 'finished',
			'progress'     => '100',
			'noise_field'  => 'drop me',
		);

		$result = $this->call_private( 'summarize_restore', array( $raw ) );

		$this->assertSame( 'r-1', $result['id'] );
		$this->assertSame( 100, $result['progress'] );
		$this->assertArrayNotHasKey( 'noise_field', $result );
	}

	public function test_summarize_schedule_returns_null_for_invalid_input(): void {
		$this->assertNull( $this->call_private( 'summarize_schedule', array( null ) ) );
		$this->assertNull( $this->call_private( 'summarize_schedule', array( 'string' ) ) );
	}

	public function test_summarize_schedule_extracts_hour_minute(): void {
		$result = $this->call_private( 'summarize_schedule', array( array( 'hour' => 3, 'minute' => 30 ) ) );
		$this->assertSame( 3, $result['hour'] );
		$this->assertSame( 30, $result['minute'] );
	}

	public function test_summarize_storage_handles_both_field_aliases(): void {
		// Production WPCOM payload uses size_in_bytes/storage_limit_bytes.
		$result = $this->call_private(
			'summarize_storage',
			array( array( 'size_in_bytes' => 1024, 'storage_limit_bytes' => 10240 ) )
		);
		$this->assertSame( 1024, $result['used_bytes'] );
		$this->assertSame( 10240, $result['limit_bytes'] );

		// Defensive shape: bare *_bytes keys also accepted.
		$result = $this->call_private(
			'summarize_storage',
			array( array( 'used_bytes' => 5, 'limit_bytes' => 50 ) )
		);
		$this->assertSame( 5, $result['used_bytes'] );
		$this->assertSame( 50, $result['limit_bytes'] );
	}

	// -------------------- apply_id_or_pagination --------------------

	public function test_apply_id_or_pagination_filters_by_id(): void {
		$items  = array(
			array( 'id' => 'a' ),
			array( 'id' => 'b' ),
			array( 'id' => 'c' ),
		);
		$result = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'id' => 'b' ) ) );

		$this->assertCount( 1, $result );
		$this->assertSame( 'b', $result[0]['id'] );
	}

	public function test_apply_id_or_pagination_with_unknown_id_returns_empty(): void {
		// Consolidated read: unknown id is a no-match, not an error.
		$items  = array( array( 'id' => 'a' ) );
		$result = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'id' => 'nope' ) ) );
		$this->assertSame( array(), $result );
	}

	public function test_apply_id_or_pagination_rejects_empty_string_id(): void {
		// Empty string id should NOT match anything — falls through to pagination.
		$items  = array( array( 'id' => 'a' ), array( 'id' => 'b' ) );
		$result = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'id' => '' ) ) );
		$this->assertCount( 2, $result );
	}

	public function test_apply_id_or_pagination_accepts_zero_string_id(): void {
		// Regression guard: empty('0') is true, but '0' is a legal ID.
		$items  = array( array( 'id' => '0' ), array( 'id' => 'b' ) );
		$result = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'id' => '0' ) ) );
		$this->assertCount( 1, $result );
		$this->assertSame( '0', $result[0]['id'] );
	}

	public function test_apply_id_or_pagination_clamps_per_page_to_max(): void {
		$items = array();
		for ( $i = 0; $i < 150; $i++ ) {
			$items[] = array( 'id' => 'b-' . $i );
		}
		// per_page above the max should be clamped to PER_PAGE_MAX (100).
		$result = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'per_page' => 500 ) ) );
		$this->assertCount( Backup_Abilities::PER_PAGE_MAX, $result );
	}

	public function test_apply_id_or_pagination_paginates(): void {
		$items = array();
		for ( $i = 0; $i < 25; $i++ ) {
			$items[] = array( 'id' => 'b-' . $i );
		}
		$first  = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'page' => 1, 'per_page' => 10 ) ) );
		$second = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'page' => 2, 'per_page' => 10 ) ) );
		$third  = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'page' => 3, 'per_page' => 10 ) ) );

		$this->assertCount( 10, $first );
		$this->assertCount( 10, $second );
		$this->assertCount( 5, $third );
		$this->assertSame( 'b-0', $first[0]['id'] );
		$this->assertSame( 'b-10', $second[0]['id'] );
		$this->assertSame( 'b-20', $third[0]['id'] );
	}

	// -------------------- unwrap_response --------------------

	public function test_unwrap_response_returns_null_for_wp_error(): void {
		$result = $this->call_private( 'unwrap_response', array( new \WP_Error( 'x', 'y' ) ) );
		$this->assertNull( $result );
	}

	public function test_unwrap_response_returns_null_for_null(): void {
		$this->assertNull( $this->call_private( 'unwrap_response', array( null ) ) );
	}

	public function test_unwrap_response_returns_data_for_rest_response(): void {
		$result = $this->call_private(
			'unwrap_response',
			array( new \WP_REST_Response( array( 'foo' => 'bar' ) ) )
		);
		$this->assertSame( array( 'foo' => 'bar' ), $result );
	}

	public function test_unwrap_response_passes_arrays_through(): void {
		$result = $this->call_private( 'unwrap_response', array( array( 'a' => 1 ) ) );
		$this->assertSame( array( 'a' => 1 ), $result );
	}
}
