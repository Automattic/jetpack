<?php
/**
 * Tests for the Monitor_Abilities Registrar subclass.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

use Automattic\Jetpack\Plugin\Abilities\Monitor_Abilities;
use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Plugin\Abilities\Monitor_Abilities
 */
#[CoversClass( Monitor_Abilities::class )]
class Monitor_Abilities_Test extends WP_UnitTestCase {
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
				'user_login' => 'monitor_abilities_admin_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'admin_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'monitor_abilities_sub_' . wp_generate_password( 8, false, false ),
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
		remove_all_filters( 'jetpack_active_modules' );
		wp_set_current_user( 0 );

		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Monitor_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Monitor_Abilities::class, 'register_abilities' ) );

		// Unregister anything this test left behind so the singleton registry stays clean
		// between tests (the WP Abilities Registry persists across tests within a process).
		if ( function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Monitor_Abilities::get_abilities() ) as $slug ) {
				wp_unregister_ability( $slug );
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' ) ) {
			wp_unregister_ability_category( Monitor_Abilities::get_category_slug() );
		}

		delete_transient( 'monitor_last_downtime' );
		delete_option( 'monitor_receive_notifications' );

		parent::tear_down();
	}

	/**
	 * Hook the registrar callbacks and fire the API lifecycle actions so registrations
	 * happen inside the action callstack — `wp_register_ability(_category)` enforces
	 * `doing_action()`, so direct invocation outside the hook is rejected.
	 */
	private function fire_abilities_lifecycle(): void {
		add_action( Registrar::CATEGORIES_INIT_ACTION, array( Monitor_Abilities::class, 'register_category' ) );
		add_action( Registrar::ABILITIES_INIT_ACTION, array( Monitor_Abilities::class, 'register_abilities' ) );
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );
	}

	// -------------------- Abstract getters --------------------

	public function test_category_slug_is_plugin_scoped() {
		$this->assertSame( 'jetpack-monitor', Monitor_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = Monitor_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertIsString( $def['label'] );
		$this->assertIsString( $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = Monitor_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-monitor/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Monitor_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_surface_exposes_get_status_and_set_notifications() {
		$abilities = Monitor_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-monitor/get-monitor-status', $abilities );
		$this->assertArrayHasKey( 'jetpack-monitor/set-notifications', $abilities );
	}

	public function test_get_monitor_status_is_annotated_readonly_idempotent() {
		$spec = Monitor_Abilities::get_abilities()['jetpack-monitor/get-monitor-status'];
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_set_notifications_is_annotated_non_readonly_idempotent() {
		$spec = Monitor_Abilities::get_abilities()['jetpack-monitor/set-notifications'];
		$this->assertFalse( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	// -------------------- Registrar wiring --------------------

	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Monitor_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Monitor_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Monitor_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		Monitor_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Monitor_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Monitor_Abilities::class, 'register_abilities' ) )
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
			if ( str_starts_with( $name, 'jetpack-monitor/' ) ) {
				$registered_slugs[] = $name;
			}
		}

		foreach ( array_keys( Monitor_Abilities::get_abilities() ) as $slug ) {
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
			static fn ( $a ) => $a->get_name(),
			wp_get_abilities()
		);
		foreach ( array_keys( Monitor_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotContains( $slug, $registered_slugs, "Ability {$slug} must be filtered out." );
		}
	}

	public function test_register_abilities_auto_injects_category() {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		foreach ( array_keys( Monitor_Abilities::get_abilities() ) as $slug ) {
			$registered = wp_get_ability( $slug );
			$this->assertNotNull( $registered, "Ability {$slug} should be registered." );
			$this->assertSame(
				'jetpack-monitor',
				$registered->get_category(),
				"Ability {$slug} should have category auto-injected."
			);
		}
	}

	// -------------------- Permission callbacks --------------------

	public function test_can_view_monitor_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Monitor_Abilities::can_view_monitor() );
	}

	public function test_can_view_monitor_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Monitor_Abilities::can_view_monitor() );
	}

	public function test_can_view_monitor_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Monitor_Abilities::can_view_monitor() );
	}

	public function test_can_manage_monitor_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Monitor_Abilities::can_manage_monitor() );
	}

	public function test_can_manage_monitor_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Monitor_Abilities::can_manage_monitor() );
	}

	public function test_can_manage_monitor_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Monitor_Abilities::can_manage_monitor() );
	}

	// -------------------- Execute callbacks --------------------

	public function test_get_monitor_status_returns_full_shape() {
		wp_set_current_user( $this->admin_id );

		// Default test env: module not in active modules filter, user not connected.
		// Both fields should degrade to null; shape must still contain all four keys.
		$result = Monitor_Abilities::get_monitor_status();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'module_active', $result );
		$this->assertArrayHasKey( 'user_connected', $result );
		$this->assertArrayHasKey( 'notifications_enabled', $result );
		$this->assertArrayHasKey( 'last_downtime', $result );
		$this->assertIsBool( $result['module_active'] );
		$this->assertIsBool( $result['user_connected'] );
	}

	public function test_get_monitor_status_returns_nulls_when_preconditions_unmet() {
		wp_set_current_user( $this->admin_id );

		$result = Monitor_Abilities::get_monitor_status();

		// Without an active module + user connection, both remote-derived fields are null.
		$this->assertFalse( $result['module_active'] );
		$this->assertFalse( $result['user_connected'] );
		$this->assertNull( $result['notifications_enabled'] );
		$this->assertNull( $result['last_downtime'] );
	}

	public function test_get_monitor_status_reports_module_active_when_filter_flags_it() {
		wp_set_current_user( $this->admin_id );

		add_filter(
			'jetpack_active_modules',
			static function ( $mods ) {
				$mods   = is_array( $mods ) ? $mods : array();
				$mods[] = 'monitor';
				return array_values( array_unique( $mods ) );
			}
		);

		$result = Monitor_Abilities::get_monitor_status();

		$this->assertTrue( $result['module_active'] );
	}

	public function test_set_notifications_rejects_missing_enabled() {
		wp_set_current_user( $this->admin_id );
		$result = Monitor_Abilities::set_notifications( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_monitor_missing_enabled', $result->get_error_code() );
	}

	public function test_set_notifications_rejects_null_input() {
		wp_set_current_user( $this->admin_id );
		$result = Monitor_Abilities::set_notifications( null );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_monitor_missing_enabled', $result->get_error_code() );
	}

	public function test_set_notifications_rejects_non_boolean_enabled_string() {
		// Regression guard: the schema declares boolean; the execute callback should
		// refuse string "true"/"false" with a distinct "invalid type" code so callers
		// can differentiate missing-field from wrong-type.
		wp_set_current_user( $this->admin_id );
		$result = Monitor_Abilities::set_notifications( array( 'enabled' => 'true' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_monitor_invalid_enabled', $result->get_error_code() );
	}

	public function test_set_notifications_rejects_non_boolean_enabled_integer() {
		wp_set_current_user( $this->admin_id );
		$result = Monitor_Abilities::set_notifications( array( 'enabled' => 1 ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_monitor_invalid_enabled', $result->get_error_code() );
	}

	public function test_set_notifications_errors_when_module_inactive() {
		// Precondition gate: module inactive → error before any IXR call, with a
		// message that steers the agent to jetpack-modules/set-module-status.
		wp_set_current_user( $this->admin_id );
		$result = Monitor_Abilities::set_notifications( array( 'enabled' => true ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_monitor_module_inactive', $result->get_error_code() );
	}

	public function test_set_notifications_errors_when_user_not_connected() {
		// With the module active but no Jetpack user connection, writes can't be
		// authorized — the IXR call needs the user's token. Error before calling out.
		wp_set_current_user( $this->admin_id );

		add_filter(
			'jetpack_active_modules',
			static function ( $mods ) {
				$mods   = is_array( $mods ) ? $mods : array();
				$mods[] = 'monitor';
				return array_values( array_unique( $mods ) );
			}
		);

		$result = Monitor_Abilities::set_notifications( array( 'enabled' => true ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_monitor_not_connected', $result->get_error_code() );
	}
}
