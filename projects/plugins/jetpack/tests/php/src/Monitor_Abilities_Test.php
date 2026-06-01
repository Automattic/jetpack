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
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/class-monitor-abilities-test-stub.php';

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
		// Note: we intentionally do NOT unregister the category here — Monitor
		// abilities live under the WordPress core `site` category, which this
		// registrar never registers and must never tear down.

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
		// Monitor abilities live under the core `site` category, which in
		// production is registered by WordPress core on the
		// `wp_abilities_api_categories_init` action. The isolated unit-test
		// lifecycle does not carry core's registration over, so without this
		// the category is absent when `register_abilities()` runs and
		// `wp_register_ability()` rejects every ability ("category not
		// registered"). Register the `site` category here, scoped to the
		// categories-init action (where `wp_register_ability_category()` is
		// permitted) and guarded so a re-fire — or a build where core already
		// registered it — does not trigger an "already registered" notice.
		$ensure_site_category = static function () {
			if (
				function_exists( 'wp_has_ability_category' )
				&& function_exists( 'wp_register_ability_category' )
				&& ! wp_has_ability_category( 'site' )
			) {
				wp_register_ability_category(
					'site',
					array(
						'label'       => 'Site',
						'description' => 'Abilities that retrieve or modify site information and settings.',
					)
				);
			}
		};
		add_action( Registrar::CATEGORIES_INIT_ACTION, $ensure_site_category, 1 );

		add_action( Registrar::CATEGORIES_INIT_ACTION, array( Monitor_Abilities::class, 'register_category' ) );
		add_action( Registrar::ABILITIES_INIT_ACTION, array( Monitor_Abilities::class, 'register_abilities' ) );
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );

		remove_action( Registrar::CATEGORIES_INIT_ACTION, $ensure_site_category, 1 );
	}

	// -------------------- Abstract getters --------------------

	/**
	 * Category slug is the WordPress core `site` category.
	 */
	public function test_category_slug_is_core_site_category() {
		$this->assertSame( 'site', Monitor_Abilities::get_category_slug() );
	}

	public function test_register_category_is_a_noop() {
		// The `site` category is owned by WordPress core; this registrar must
		// not register a plugin-scoped category of its own.
		if ( ! function_exists( 'wp_has_ability_category' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		add_action( Registrar::CATEGORIES_INIT_ACTION, array( Monitor_Abilities::class, 'register_category' ) );
		do_action( Registrar::CATEGORIES_INIT_ACTION );

		// Firing the registrar's (no-op) category callback must not have created
		// a legacy `jetpack-monitor` category. `wp_has_ability_category()`
		// returns a clean bool (no `_doing_it_wrong`), unlike
		// `wp_get_ability_category()` which flags an unregistered lookup.
		$this->assertFalse( wp_has_ability_category( 'jetpack-monitor' ) );
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

	/**
	 * Both abilities are agent-facing, so each must expose the `meta.mcp`
	 * descriptor (public tool) alongside `show_in_rest`, matching the sibling
	 * `jetpack/get-modules` and `jetpack/set-module-status` definitions.
	 *
	 * @dataProvider provider_ability_slugs
	 *
	 * @param string $slug Ability slug to inspect.
	 */
	#[DataProvider( 'provider_ability_slugs' )]
	public function test_abilities_expose_public_mcp_tool_metadata( string $slug ) {
		$meta = Monitor_Abilities::get_abilities()[ $slug ]['meta'];
		$this->assertTrue( $meta['show_in_rest'], "{$slug} should be exposed in REST." );
		$this->assertArrayHasKey( 'mcp', $meta, "{$slug} should carry mcp metadata so MCP/agent tooling can discover it." );
		$this->assertTrue( $meta['mcp']['public'], "{$slug} mcp metadata should be public." );
		$this->assertSame( 'tool', $meta['mcp']['type'], "{$slug} mcp metadata should be a tool." );
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public static function provider_ability_slugs(): array {
		return array(
			'get-monitor-status' => array( 'jetpack-monitor/get-monitor-status' ),
			'set-notifications'  => array( 'jetpack-monitor/set-notifications' ),
		);
	}

	// -------------------- Registrar wiring --------------------

	/**
	 * Gate filter false => init() short-circuits and hooks nothing.
	 */
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
			static function ( $a ) {
				return $a->get_name();
			},
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
				'site',
				$registered->get_category(),
				"Ability {$slug} should have category auto-injected."
			);
		}
	}

	// -------------------- Permission callbacks --------------------

	/**
	 * Admins can view monitor status.
	 */
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

	/**
	 * With the module inactive, get_monitor_status() short-circuits with a
	 * `jetpack_monitor_module_inactive` WP_Error before hitting any remote read.
	 */
	public function test_get_monitor_status_errors_when_module_inactive() {
		wp_set_current_user( $this->admin_id );

		$result = Monitor_Abilities::get_monitor_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_monitor_module_inactive', $result->get_error_code() );
	}

	/**
	 * With the module active but no Jetpack user connection, get_monitor_status()
	 * returns a `jetpack_monitor_not_connected` WP_Error with a message that
	 * steers the caller to the My Jetpack admin page — agents need an actionable
	 * next step, not opaque null fields.
	 */
	public function test_get_monitor_status_errors_when_user_not_connected() {
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

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_monitor_not_connected', $result->get_error_code() );
		$this->assertStringContainsString( 'My Jetpack', $result->get_error_message() );
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
		// Precondition gate: module inactive → error before any IXR call.
		// Belt-and-braces — in practice this branch is unreachable in production
		// because the ability is only registered while the module is active, but
		// the callback still checks defensively in case of a race or direct call.
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

	// -------------------- Success-path coverage via test double --------------------

	/**
	 * Success-path tests need a seam: the production callback talks to a real
	 * remote Monitor service via IXR, and a connected Jetpack user. The
	 * `Monitor_Abilities_Test_Stub` test double (defined below this class) overrides
	 * the protected seams so we can drive `set_notifications()` through its
	 * end-to-end logic without standing up a Jetpack token fixture.
	 */
	public function test_set_notifications_returns_changed_true_when_state_flips() {
		wp_set_current_user( $this->admin_id );

		add_filter(
			'jetpack_active_modules',
			static function ( $mods ) {
				$mods   = is_array( $mods ) ? $mods : array();
				$mods[] = 'monitor';
				return array_values( array_unique( $mods ) );
			}
		);

		Monitor_Abilities_Test_Stub::reset( false );

		$result = Monitor_Abilities_Test_Stub::set_notifications( array( 'enabled' => true ) );

		$this->assertIsArray( $result );
		$this->assertTrue( $result['enabled'] );
		$this->assertTrue( $result['changed'] );
		$this->assertSame( 1, Monitor_Abilities_Test_Stub::$apply_calls, 'IXR setNotifications should have been called exactly once.' );
		$this->assertTrue( Monitor_Abilities_Test_Stub::$last_applied, 'apply_notifications_update should have been called with the desired value.' );
		// `update_option` stores booleans as '1'/'' through the DB roundtrip; assert truthiness
		// rather than the exact string so this test is robust to env differences.
		$this->assertTrue( (bool) get_option( 'monitor_receive_notifications' ), 'monitor_receive_notifications option should mirror the new state.' );
	}

	public function test_set_notifications_returns_changed_false_when_state_matches() {
		wp_set_current_user( $this->admin_id );

		add_filter(
			'jetpack_active_modules',
			static function ( $mods ) {
				$mods   = is_array( $mods ) ? $mods : array();
				$mods[] = 'monitor';
				return array_values( array_unique( $mods ) );
			}
		);

		Monitor_Abilities_Test_Stub::reset( true );

		// Seed a stale local option (false) that disagrees with the remote state
		// (true) to exercise the self-healing sync on the no-op path.
		update_option( 'monitor_receive_notifications', false );

		$result = Monitor_Abilities_Test_Stub::set_notifications( array( 'enabled' => true ) );

		$this->assertIsArray( $result );
		$this->assertTrue( $result['enabled'] );
		$this->assertFalse( $result['changed'] );
		$this->assertSame( 0, Monitor_Abilities_Test_Stub::$apply_calls, 'Idempotent no-op: apply_notifications_update should not run when desired matches current.' );
		// Even on a no-op the local option is synced to the known-good remote
		// value (true here) so the legacy REST reader, which trusts this option
		// before going remote, can't surface a stale state.
		$this->assertTrue( (bool) get_option( 'monitor_receive_notifications' ), 'No-op should still sync the mirrored option to the remote value.' );
	}

	/**
	 * Happy-path: module active, user connected, both remote reads succeed.
	 * The returned shape is the documented four-key contract with no nulls
	 * except the (legitimate) `last_status_change=null` "no transition recorded
	 * yet" signal.
	 */
	public function test_get_monitor_status_returns_full_shape_on_success() {
		wp_set_current_user( $this->admin_id );

		add_filter(
			'jetpack_active_modules',
			static function ( $mods ) {
				$mods   = is_array( $mods ) ? $mods : array();
				$mods[] = 'monitor';
				return array_values( array_unique( $mods ) );
			}
		);

		Monitor_Abilities_Test_Stub::reset( true, '2024-01-15 12:34:56' );

		$result = Monitor_Abilities_Test_Stub::get_monitor_status();

		$this->assertIsArray( $result );
		$this->assertTrue( $result['module_active'] );
		$this->assertTrue( $result['user_connected'] );
		$this->assertTrue( $result['notifications_enabled'] );
		$this->assertSame( '2024-01-15 12:34:56', $result['last_status_change'] );
	}

	/**
	 * Module active, user connected, no transition recorded yet — null is a
	 * legitimate signal (not a failure), so the happy-path shape still applies.
	 */
	public function test_get_monitor_status_allows_null_last_status_change_when_no_transition() {
		wp_set_current_user( $this->admin_id );

		add_filter(
			'jetpack_active_modules',
			static function ( $mods ) {
				$mods   = is_array( $mods ) ? $mods : array();
				$mods[] = 'monitor';
				return array_values( array_unique( $mods ) );
			}
		);

		Monitor_Abilities_Test_Stub::reset( false, null );

		$result = Monitor_Abilities_Test_Stub::get_monitor_status();

		$this->assertIsArray( $result );
		$this->assertFalse( $result['notifications_enabled'] );
		$this->assertNull( $result['last_status_change'] );
	}

	/**
	 * Remote `isUserInNotifications` fails → surface as
	 * `jetpack_monitor_service_unreachable` so callers know to retry rather than
	 * misread a null field as "notifications are off".
	 */
	public function test_get_monitor_status_errors_when_notifications_fetch_fails() {
		wp_set_current_user( $this->admin_id );

		add_filter(
			'jetpack_active_modules',
			static function ( $mods ) {
				$mods   = is_array( $mods ) ? $mods : array();
				$mods[] = 'monitor';
				return array_values( array_unique( $mods ) );
			}
		);

		Monitor_Abilities_Test_Stub::reset(
			new \WP_Error( 'jetpack_monitor_notifications_data_unavailable', 'remote down' ),
			'2024-01-15 12:34:56'
		);

		$result = Monitor_Abilities_Test_Stub::get_monitor_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_monitor_service_unreachable', $result->get_error_code() );
	}

	/**
	 * Remote `getLastDowntime` fails → also surfaces as
	 * `jetpack_monitor_service_unreachable`. We deliberately do not split this
	 * into a per-call error code — both reads back the same Monitor service, so
	 * one unreachable code is the right level of granularity for callers.
	 */
	public function test_get_monitor_status_errors_when_last_status_change_fetch_fails() {
		wp_set_current_user( $this->admin_id );

		add_filter(
			'jetpack_active_modules',
			static function ( $mods ) {
				$mods   = is_array( $mods ) ? $mods : array();
				$mods[] = 'monitor';
				return array_values( array_unique( $mods ) );
			}
		);

		Monitor_Abilities_Test_Stub::reset(
			true,
			new \WP_Error( 'jetpack_monitor_downtime_data_unavailable', 'remote down' )
		);

		$result = Monitor_Abilities_Test_Stub::get_monitor_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_monitor_service_unreachable', $result->get_error_code() );
	}

	// -------------------- Real bootstrap path --------------------

	/**
	 * When the Monitor module is inactive, modules/monitor.php is never loaded
	 * by Jetpack, so the Monitor_Abilities::init() call inside it never runs and
	 * the abilities are not registered. This codifies the gated-registration
	 * contract — discovery of Monitor in the inactive state belongs to a future
	 * module-management ability category, not here.
	 */
	public function test_abilities_are_not_registered_when_monitor_module_is_inactive() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		// Do NOT fire the lifecycle or call init() — this mirrors the real
		// bootstrap path when monitor.php has not been included by Jetpack.
		$registered_slugs = array();
		foreach ( wp_get_abilities() as $ability ) {
			$name = $ability->get_name();
			if ( str_starts_with( $name, 'jetpack-monitor/' ) ) {
				$registered_slugs[] = $name;
			}
		}

		$this->assertSame(
			array(),
			$registered_slugs,
			'Monitor abilities must not be registered while the Monitor module is inactive (modules/monitor.php not loaded).'
		);
	}

	// -------------------- normalize_last_status_change --------------------

	/**
	 * Inputs and expected outputs for the last-status-change normalizer.
	 *
	 * Covers every "no transition yet" representation we want to collapse to
	 * null — empty string (Jetpack Monitor v1's sentinel), whitespace-only,
	 * MySQL zero-date variants (anticipated Monitor v2), non-strings — plus a
	 * legitimate timestamp that must pass through verbatim.
	 *
	 * @return array<string, array{0: mixed, 1: string|null}>
	 */
	public static function provider_normalize_last_status_change(): array {
		return array(
			'empty string'                   => array( '', null ),
			'whitespace only'                => array( "  \t\n", null ),
			'mysql zero-date'                => array( '0000-00-00 00:00:00', null ),
			'mysql zero-date no time'        => array( '0000-00-00', null ),
			'non-string null'                => array( null, null ),
			'non-string integer'             => array( 0, null ),
			'non-string false'               => array( false, null ),
			'unparseable string'             => array( 'not-a-timestamp', null ),
			'valid timestamp passes through' => array( '2024-01-15 12:34:56', '2024-01-15 12:34:56' ),
		);
	}

	/**
	 * @dataProvider provider_normalize_last_status_change
	 *
	 * @param mixed       $input    Raw value from the remote or cache.
	 * @param string|null $expected Normalized contract value.
	 */
	#[DataProvider( 'provider_normalize_last_status_change' )]
	public function test_normalize_last_status_change_collapses_no_value_representations_to_null( $input, $expected ) {
		$this->assertSame(
			$expected,
			Monitor_Abilities_Test_Stub::expose_normalize_last_status_change( $input ),
			'normalize_last_status_change should pass legitimate timestamps through unchanged and collapse every "no value" representation to null.'
		);
	}
}
