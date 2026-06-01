<?php
/**
 * Tests for the Modules_Abilities Registrar subclass.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Abilities\Modules_Abilities;
use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Plugin\Abilities\Modules_Abilities
 */
#[CoversClass( Modules_Abilities::class )]
class Modules_Abilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Administrator user id, created once per test.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user id, created once per test.
	 *
	 * @var int
	 */
	private $subscriber_id;

	public function set_up() {
		parent::set_up();

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'modules_abilities_admin_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'admin_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'modules_abilities_sub_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'sub_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open for most test cases.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		wp_set_current_user( 0 );

		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Modules_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Modules_Abilities::class, 'register_abilities' ) );

		// Unregister anything this test left behind so the singleton registry stays clean
		// between tests (the WP Abilities Registry persists across tests within a process).
		if ( function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Modules_Abilities::get_abilities() ) as $slug ) {
				wp_unregister_ability( $slug );
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' ) ) {
			wp_unregister_ability_category( Modules_Abilities::get_category_slug() );
		}

		parent::tear_down();
	}

	/**
	 * Hook the registrar callbacks and fire the API lifecycle actions so registrations
	 * happen inside the action callstack — `wp_register_ability(_category)` enforces
	 * `doing_action()`, so direct invocation outside the hook is rejected.
	 */
	private function fire_abilities_lifecycle(): void {
		add_action( Registrar::CATEGORIES_INIT_ACTION, array( Modules_Abilities::class, 'register_category' ) );
		add_action( Registrar::ABILITIES_INIT_ACTION, array( Modules_Abilities::class, 'register_abilities' ) );
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );
	}

	public function test_category_slug_is_plugin_scoped() {
		$this->assertSame( 'jetpack', Modules_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = Modules_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertIsString( $def['label'] );
		$this->assertIsString( $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = Modules_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Modules_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_consolidated_surface_exposes_get_modules_and_set_module_status() {
		$abilities = Modules_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack/get-modules', $abilities );
		$this->assertArrayHasKey( 'jetpack/set-module-status', $abilities );
	}

	public function test_get_modules_is_annotated_readonly_idempotent() {
		$spec = Modules_Abilities::get_abilities()['jetpack/get-modules'];
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_set_module_status_is_annotated_non_readonly_idempotent() {
		$spec = Modules_Abilities::get_abilities()['jetpack/set-module-status'];
		$this->assertFalse( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_both_abilities_opt_into_mcp_as_public_tool() {
		foreach ( array( 'jetpack/get-modules', 'jetpack/set-module-status' ) as $slug ) {
			$spec = Modules_Abilities::get_abilities()[ $slug ];
			$this->assertSame( true, $spec['meta']['mcp']['public'], "{$slug} must opt into MCP." );
			$this->assertSame( 'tool', $spec['meta']['mcp']['type'], "{$slug} must be exposed as an MCP tool." );
		}
	}

	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Modules_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Modules_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Modules_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		Modules_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Modules_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Modules_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_register_abilities_registers_every_slug() {
		if ( ! function_exists( 'wp_get_abilities' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		$registered_slugs = array();
		foreach ( wp_get_abilities() as $ability ) {
			$name = $ability->get_name();
			if ( str_starts_with( $name, 'jetpack/' ) ) {
				$registered_slugs[] = $name;
			}
		}

		foreach ( array_keys( Modules_Abilities::get_abilities() ) as $slug ) {
			$this->assertContains( $slug, $registered_slugs, "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected() {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Filter signature requires this parameter even when we don't branch on it.
				if ( 'ability' === $type ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->fire_abilities_lifecycle();

		$registered_slugs = array_map(
			static function ( $a ) {
				return $a->get_name();
			},
			wp_get_abilities()
		);
		foreach ( array_keys( Modules_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotContains( $slug, $registered_slugs, "Ability {$slug} must be filtered out." );
		}
	}

	public function test_register_abilities_auto_injects_category() {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		foreach ( array_keys( Modules_Abilities::get_abilities() ) as $slug ) {
			$registered = wp_get_ability( $slug );
			$this->assertNotNull( $registered, "Ability {$slug} should be registered." );
			$this->assertSame(
				'jetpack',
				$registered->get_category(),
				"Ability {$slug} should have category auto-injected."
			);
		}
	}

	public function test_can_view_modules_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Modules_Abilities::can_view_modules() );
	}

	public function test_can_view_modules_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Modules_Abilities::can_view_modules() );
	}

	public function test_can_view_modules_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Modules_Abilities::can_view_modules() );
	}

	public function test_can_manage_modules_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Modules_Abilities::can_manage_modules() );
	}

	public function test_can_manage_modules_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Modules_Abilities::can_manage_modules() );
	}

	public function test_get_modules_returns_array() {
		wp_set_current_user( $this->admin_id );
		$result = Modules_Abilities::get_modules( array() );
		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result, 'Jetpack ships with modules; an unfiltered list should be non-empty.' );
	}

	public function test_get_modules_summary_shape_is_high_signal() {
		wp_set_current_user( $this->admin_id );
		$result = Modules_Abilities::get_modules( array() );
		$this->assertIsArray( $result );

		$expected_keys = array(
			'slug',
			'name',
			'description',
			'active',
			'sort',
			'feature',
			'plan_classes',
			'requires_connection',
			'requires_user_connection',
			'auto_activate',
		);
		foreach ( $result as $summary ) {
			foreach ( $expected_keys as $key ) {
				$this->assertArrayHasKey( $key, $summary, "Summary missing key {$key} for slug " . ( $summary['slug'] ?? '?' ) );
			}
			$this->assertIsBool( $summary['active'] );
			$this->assertIsArray( $summary['feature'] );
			$this->assertIsArray( $summary['plan_classes'] );
			// Raw Jetpack::get_module() keys should NOT leak through.
			$this->assertArrayNotHasKey( 'module_tags', $summary );
			$this->assertArrayNotHasKey( 'deactivate', $summary );
			$this->assertArrayNotHasKey( 'recommendation_order', $summary );
		}
	}

	public function test_get_modules_with_unknown_slug_returns_empty_array() {
		// Consolidated read: unknown slug is a no-match, not an error — shape is uniform.
		wp_set_current_user( $this->admin_id );
		$result = Modules_Abilities::get_modules( array( 'slug' => 'this-module-does-not-exist-ever' ) );
		$this->assertSame( array(), $result );
	}

	public function test_get_modules_with_known_slug_returns_one_element_array() {
		wp_set_current_user( $this->admin_id );
		$all = Modules_Abilities::get_modules( array() );
		if ( empty( $all ) ) {
			$this->markTestSkipped( 'No modules available to probe.' );
		}
		$slug   = $all[0]['slug'];
		$result = Modules_Abilities::get_modules( array( 'slug' => $slug ) );
		$this->assertCount( 1, $result );
		$this->assertSame( $slug, $result[0]['slug'] );
	}

	public function test_get_modules_slug_lookup_still_honors_other_filters() {
		// Regression guard: { slug, active } must apply the active filter even though
		// slug narrows the candidate set to a single module — otherwise callers
		// combining filters get a false positive for a module that doesn't match.
		wp_set_current_user( $this->admin_id );
		$all = Modules_Abilities::get_modules( array() );
		if ( empty( $all ) ) {
			$this->markTestSkipped( 'No modules available to probe.' );
		}
		$probe  = $all[0];
		$result = Modules_Abilities::get_modules(
			array(
				'slug'   => $probe['slug'],
				'active' => ! $probe['active'],
			)
		);
		$this->assertSame( array(), $result );

		$matching = Modules_Abilities::get_modules(
			array(
				'slug'   => $probe['slug'],
				'active' => $probe['active'],
			)
		);
		$this->assertCount( 1, $matching );
		$this->assertSame( $probe['slug'], $matching[0]['slug'] );
	}

	public function test_get_modules_filters_by_active_state() {
		wp_set_current_user( $this->admin_id );
		$active_only = Modules_Abilities::get_modules( array( 'active' => true ) );
		$this->assertIsArray( $active_only );
		foreach ( $active_only as $summary ) {
			$this->assertTrue( $summary['active'], "Expected only active modules, got {$summary['slug']}." );
		}

		$inactive_only = Modules_Abilities::get_modules( array( 'active' => false ) );
		$this->assertIsArray( $inactive_only );
		foreach ( $inactive_only as $summary ) {
			$this->assertFalse( $summary['active'], "Expected only inactive modules, got {$summary['slug']}." );
		}
	}

	public function test_get_modules_is_sorted_deterministically() {
		wp_set_current_user( $this->admin_id );
		$first  = Modules_Abilities::get_modules( array() );
		$second = Modules_Abilities::get_modules( array() );
		$this->assertSame( $first, $second, 'Repeated calls must return results in identical order.' );
	}

	public function test_set_module_status_rejects_missing_slug() {
		wp_set_current_user( $this->admin_id );
		$result = Modules_Abilities::set_module_status( array( 'active' => true ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_modules_missing_slug', $result->get_error_code() );
	}

	public function test_set_module_status_rejects_empty_string_slug() {
		wp_set_current_user( $this->admin_id );
		$result = Modules_Abilities::set_module_status(
			array(
				'slug'   => '',
				'active' => true,
			)
		);
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_modules_missing_slug', $result->get_error_code() );
	}

	public function test_set_module_status_treats_zero_slug_as_unknown_not_missing() {
		// Regression guard for the classic PHP empty('0') == true gotcha: a '0' slug is a
		// non-empty string and must reach the slug-validity check, which rejects it as unknown
		// rather than misclassifying it as a missing slug.
		wp_set_current_user( $this->admin_id );
		$result = Modules_Abilities::set_module_status(
			array(
				'slug'   => '0',
				'active' => true,
			)
		);
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_modules_invalid_slug', $result->get_error_code() );
	}

	public function test_set_module_status_rejects_missing_active() {
		wp_set_current_user( $this->admin_id );
		$result = Modules_Abilities::set_module_status( array( 'slug' => 'stats' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_modules_missing_active', $result->get_error_code() );
	}

	public function test_set_module_status_rejects_non_boolean_active() {
		// Regression guard: the schema declares boolean; the execute callback should
		// refuse string "true"/"false" with a distinct "invalid type" code so callers
		// can differentiate missing-field from wrong-type.
		wp_set_current_user( $this->admin_id );
		$result = Modules_Abilities::set_module_status(
			array(
				'slug'   => 'stats',
				'active' => 'true',
			)
		);
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_modules_invalid_active', $result->get_error_code() );
	}

	public function test_set_module_status_rejects_unknown_slug() {
		wp_set_current_user( $this->admin_id );
		$result = Modules_Abilities::set_module_status(
			array(
				'slug'   => 'this-module-does-not-exist-ever',
				'active' => true,
			)
		);
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_modules_invalid_slug', $result->get_error_code() );
	}

	public function test_set_module_status_is_idempotent_for_current_state() {
		wp_set_current_user( $this->admin_id );
		$all = Modules_Abilities::get_modules( array() );
		if ( empty( $all ) ) {
			$this->markTestSkipped( 'No modules available to probe.' );
		}

		$target = $all[0];
		// Setting a module to its current state must be a no-op.
		$result = Modules_Abilities::set_module_status(
			array(
				'slug'   => $target['slug'],
				'active' => $target['active'],
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( $target['slug'], $result['slug'] );
		$this->assertSame( $target['active'], $result['active'] );
		$this->assertFalse( $result['changed'], 'Setting current state must return changed=false.' );
	}

	public function test_set_module_status_deactivates_active_module_and_reports_changed() {
		// State-change coverage for the deactivation path. Activation requires a Jetpack
		// connection (see Jetpack_Sync_Modules_Test::test_sync_activate_module_event for the
		// same constraint), but deactivation is connection-agnostic — seed an active module
		// directly and assert the function flips it off, reports changed=true, and verifies
		// the persisted state via Jetpack::is_module_active().
		wp_set_current_user( $this->admin_id );

		$available = Jetpack::get_available_modules();
		if ( empty( $available ) ) {
			$this->markTestSkipped( 'No Jetpack modules available to toggle.' );
		}
		$slug = reset( $available );

		\Jetpack_Options::update_option( 'active_modules', array( $slug ) );
		$this->assertTrue( Jetpack::is_module_active( $slug ), 'Sanity: seeded module should report active.' );

		$result = Modules_Abilities::set_module_status(
			array(
				'slug'   => $slug,
				'active' => false,
			)
		);

		$this->assertIsArray( $result, 'Deactivation should not return WP_Error for a seeded active module.' );
		$this->assertSame( $slug, $result['slug'] );
		$this->assertFalse( $result['active'] );
		$this->assertTrue( $result['changed'], 'Flipping a state change must report changed=true.' );
		$this->assertFalse( Jetpack::is_module_active( $slug ), 'Module should be inactive after deactivation.' );
	}
}
