<?php
/**
 * Tests for the Activity_Log_Abilities Registrar subclass.
 *
 * Run from projects/packages/activity-log:
 *
 *   composer phpunit -- --filter Activity_Log_Abilities_Test
 *
 * @package automattic/jetpack-activity-log
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Activity_Log;

use Automattic\Jetpack\Activity_Log\Abilities\Activity_Log_Abilities;
use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_Error;

require_once __DIR__ . '/class-activity-log-abilities-test-stub.php';

/**
 * Unit tests for Activity_Log_Abilities registration and execution.
 *
 * @covers \Automattic\Jetpack\Activity_Log\Abilities\Activity_Log_Abilities
 */
#[CoversClass( Activity_Log_Abilities::class )]
class Activity_Log_Abilities_Test extends BaseTestCase {

	/**
	 * Administrator user id, recreated per test.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user id, recreated per test.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Tracks whether the current test has touched the WP Abilities registry,
	 * so teardown can unregister selectively without force-instantiating it.
	 *
	 * @var bool
	 */
	private static $touched_registry = false;

	/**
	 * {@inheritDoc}
	 */
	protected function set_up() {
		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'activity_log_abilities_admin_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'user_email' => 'admin_' . wp_generate_password( 6, false ) . '@example.test',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'activity_log_abilities_sub_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'user_email' => 'sub_' . wp_generate_password( 6, false ) . '@example.test',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open for most test cases.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Reset any hooks a prior test may have added for the Registrar lifecycle actions.
		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Activity_Log_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Activity_Log_Abilities::class, 'register_abilities' ) );

		\Activity_Log_Abilities_Test_Stub::seed( array() );
	}

	/**
	 * {@inheritDoc}
	 */
	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );

		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Activity_Log_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Activity_Log_Abilities::class, 'register_abilities' ) );

		// Unregister anything this test left behind so the singleton registry stays clean
		// between tests (the WP Abilities Registry persists across tests within a process).
		// Only touch the registry when this test instantiated it (i.e. registered
		// something) so we don't force-instantiate it in tests that never touched it.
		if ( self::$touched_registry && function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Activity_Log_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( self::$touched_registry && function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			if ( wp_has_ability_category( Activity_Log_Abilities::get_category_slug() ) ) {
				wp_unregister_ability_category( Activity_Log_Abilities::get_category_slug() );
			}
		}
		self::$touched_registry = false;

		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Run a callable while the given Abilities API lifecycle action appears to be firing.
	 *
	 * The Registrar guards its register_* methods with `doing_action()`. Pushing onto
	 * `$wp_current_filter` simulates that the action is currently running without
	 * actually invoking every hooked callback — `do_action()` would also fire core
	 * registration callbacks once the registry is alive, leading to "already registered"
	 * notices on repeated invocations within a single test process.
	 *
	 * @param string   $action Action name to simulate.
	 * @param callable $fn     Callable to run while the action is "firing".
	 */
	private function with_simulated_action( string $action, callable $fn ): void {
		global $wp_current_filter;
		$wp_current_filter[] = $action;
		try {
			$fn();
		} finally {
			for ( $i = count( $wp_current_filter ) - 1; $i >= 0; $i-- ) {
				if ( $wp_current_filter[ $i ] === $action ) {
					array_splice( $wp_current_filter, $i, 1 );
					break;
				}
			}
		}
	}

	/**
	 * Hook the registrar callbacks and dispatch them under simulated lifecycle
	 * actions so registrations happen with `doing_action()` true but core's own
	 * callbacks don't fire a second time.
	 */
	private function fire_abilities_lifecycle(): void {
		self::$touched_registry = true;
		$this->with_simulated_action(
			Registrar::CATEGORIES_INIT_ACTION,
			static function () {
				Activity_Log_Abilities::register_category();
			}
		);
		$this->with_simulated_action(
			Registrar::ABILITIES_INIT_ACTION,
			static function () {
				Activity_Log_Abilities::register_abilities();
			}
		);
	}

	/**
	 * Build a minimal upstream-shaped event entry for tests.
	 *
	 * @param array $overrides Fields to merge over the default.
	 * @return array
	 */
	private function make_event( array $overrides = array() ): array {
		return array_merge(
			array(
				'activity_id' => 'abc123',
				'name'        => 'post__published',
				'summary'     => 'Hello World published',
				'gridicon'    => 'posts',
				'published'   => '2026-05-01T12:00:00+00:00',
				'actor'       => array(
					'name'             => 'Admin User',
					'role'             => 'administrator',
					'wpcom_user_id'    => 42,
					'external_user_id' => 7,
				),
				'object'      => array( 'post_id' => 99 ),
				'target'      => null,
			),
			$overrides
		);
	}

	/**
	 * -------------------- Abstract getters --------------------
	 */
	public function test_category_slug_is_jetpack_activity_log(): void {
		$this->assertSame( 'jetpack-activity-log', Activity_Log_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = Activity_Log_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertIsString( $def['label'] );
		$this->assertIsString( $def['description'] );
		$this->assertNotSame( '', $def['label'] );
		$this->assertNotSame( '', $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = Activity_Log_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-activity-log/', $slug );
		}
	}

	public function test_surface_exposes_consolidated_list_events(): void {
		$abilities = Activity_Log_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-activity-log/list-events', $abilities );
	}

	public function test_list_events_is_annotated_readonly_idempotent(): void {
		$spec = Activity_Log_Abilities::get_abilities()['jetpack-activity-log/list-events'];
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_no_spec_sets_category_explicitly(): void {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Activity_Log_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_spec_declares_annotations_permission_and_execute(): void {
		foreach ( Activity_Log_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'execute_callback', $spec, "Ability {$slug} missing execute_callback" );
			$this->assertIsCallable( $spec['execute_callback'], "Ability {$slug} execute_callback is not callable" );
			$this->assertArrayHasKey( 'permission_callback', $spec, "Ability {$slug} missing permission_callback" );
			$this->assertIsCallable( $spec['permission_callback'], "Ability {$slug} permission_callback is not callable" );
			$this->assertArrayHasKey( 'meta', $spec, "Ability {$slug} missing meta" );
			$this->assertArrayHasKey( 'annotations', $spec['meta'], "Ability {$slug} missing meta.annotations" );
			foreach ( array( 'readonly', 'destructive', 'idempotent' ) as $flag ) {
				$this->assertArrayHasKey( $flag, $spec['meta']['annotations'], "Ability {$slug} missing annotation {$flag}" );
				$this->assertIsBool( $spec['meta']['annotations'][ $flag ], "Ability {$slug} annotation {$flag} must be bool" );
			}
		}
	}

	/**
	 * -------------------- Registrar wiring --------------------
	 */
	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Activity_Log_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Activity_Log_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Activity_Log_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true(): void {
		// Only valid when the Abilities API lifecycle actions have NOT yet fired.
		// `WP_Abilities_Registry::get_instance()` fires `wp_abilities_api_init` on first call
		// (in response to any wp_has_ability / wp_register_ability call elsewhere in the run),
		// which would push the Registrar down its synchronous late-load path and this test
		// would assert against a world it doesn't apply to.
		if ( did_action( Registrar::ABILITIES_INIT_ACTION ) || did_action( Registrar::CATEGORIES_INIT_ACTION ) ) {
			$this->markTestSkipped( 'Abilities API lifecycle already fired in this test run; late-load path covered elsewhere.' );
		}

		Activity_Log_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Activity_Log_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Activity_Log_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_register_abilities_registers_every_slug(): void {
		if ( ! function_exists( 'wp_get_abilities' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		$registered_slugs = array();
		foreach ( wp_get_abilities() as $ability ) {
			$name = $ability->get_name();
			if ( str_starts_with( $name, 'jetpack-activity-log/' ) ) {
				$registered_slugs[] = $name;
			}
		}

		foreach ( array_keys( Activity_Log_Abilities::get_abilities() ) as $slug ) {
			$this->assertContains( $slug, $registered_slugs, "Ability {$slug} should be registered." );
		}
	}

	public function test_register_abilities_auto_injects_category(): void {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		foreach ( array_keys( Activity_Log_Abilities::get_abilities() ) as $slug ) {
			$registered = wp_get_ability( $slug );
			$this->assertNotNull( $registered, "Ability {$slug} should be registered." );
			$this->assertSame(
				'jetpack-activity-log',
				$registered->get_category(),
				"Ability {$slug} should have category auto-injected."
			);
		}
	}

	public function test_per_ability_allow_list_filter_is_respected(): void {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Filter signature requires all three params.
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
		foreach ( array_keys( Activity_Log_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotContains( $slug, $registered_slugs, "Ability {$slug} must be filtered out." );
		}
	}

	/**
	 * -------------------- Permission callbacks --------------------
	 */
	public function test_can_view_activity_log_denies_subscriber(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Activity_Log_Abilities::can_view_activity_log() );
	}

	public function test_can_view_activity_log_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Activity_Log_Abilities::can_view_activity_log() );
	}

	public function test_can_view_activity_log_denies_admin_when_user_not_connected(): void {
		wp_set_current_user( $this->admin_id );
		// No Jetpack user connection seeded — Connection_Manager::is_user_connected()
		// returns false, so even an admin is rejected. Mirrors REST_Controller behavior.
		$this->assertFalse( Activity_Log_Abilities::can_view_activity_log() );
	}

	/**
	 * -------------------- Execute callback: list_events --------------------
	 */

	/**
	 * Happy path: envelope-shaped response is flattened into compact entries.
	 */
	public function test_list_events_projects_envelope_response(): void {
		\Activity_Log_Abilities_Test_Stub::seed(
			array(
				'current' => array(
					'orderedItems' => array(
						$this->make_event(),
						$this->make_event(
							array(
								'activity_id' => 'xyz789',
								'name'        => 'plugin__activated',
								'summary'     => 'Akismet activated',
								'gridicon'    => 'plugins',
								'actor'       => null,
							)
						),
					),
				),
			)
		);

		$result = \Activity_Log_Abilities_Test_Stub::list_events();

		$this->assertCount( 2, $result );

		// First entry: post event with full actor.
		$this->assertSame( 'abc123', $result[0]['id'] );
		$this->assertSame( 'post', $result[0]['group'] );
		$this->assertSame( 'post__published', $result[0]['action'] );
		$this->assertSame( 'post__published', $result[0]['name'] );
		$this->assertSame( 'Hello World published', $result[0]['summary'] );
		$this->assertSame( '2026-05-01T12:00:00+00:00', $result[0]['timestamp'] );
		$this->assertSame( 'posts', $result[0]['gridicon'] );
		$this->assertIsArray( $result[0]['actor'] );
		$this->assertSame( 42, $result[0]['actor']['id'] );
		$this->assertSame( 'Admin User', $result[0]['actor']['display_name'] );
		$this->assertSame( 'administrator', $result[0]['actor']['role'] );

		// Second entry: plugin event with no actor.
		$this->assertSame( 'plugin', $result[1]['group'] );
		$this->assertSame( 'plugin__activated', $result[1]['action'] );
		$this->assertNull( $result[1]['actor'] );
	}

	/**
	 * Already-unwrapped flat-list response is also accepted (forward-compatibility
	 * with future REST_Controller changes that unwrap upstream).
	 */
	public function test_list_events_accepts_already_unwrapped_list(): void {
		\Activity_Log_Abilities_Test_Stub::seed(
			array(
				$this->make_event(),
				$this->make_event( array( 'activity_id' => 'def456' ) ),
			)
		);

		$result = \Activity_Log_Abilities_Test_Stub::list_events();

		$this->assertCount( 2, $result );
		$this->assertSame( 'abc123', $result[0]['id'] );
		$this->assertSame( 'def456', $result[1]['id'] );
	}

	/**
	 * Empty upstream response yields an empty array (NOT a WP_Error).
	 */
	public function test_list_events_returns_empty_array_for_empty_response(): void {
		\Activity_Log_Abilities_Test_Stub::seed( array() );

		$result = \Activity_Log_Abilities_Test_Stub::list_events();

		$this->assertSame( array(), $result );
	}

	/**
	 * Consolidated-read contract: unknown `event_id` yields an empty array,
	 * not a WP_Error. Callers can chain `list -> detail` without branching
	 * on existence.
	 */
	public function test_list_events_returns_empty_array_for_unknown_event_id(): void {
		\Activity_Log_Abilities_Test_Stub::seed(
			array(
				'current' => array(
					'orderedItems' => array( $this->make_event(), $this->make_event( array( 'activity_id' => 'def456' ) ) ),
				),
			)
		);

		$result = \Activity_Log_Abilities_Test_Stub::list_events( array( 'event_id' => 9999 ) );

		$this->assertSame( array(), $result );
	}

	/**
	 * Consolidated-read contract: `event_id` filter returns a 1-element array
	 * matching the requested id, projected into the compact shape.
	 */
	public function test_list_events_returns_single_event_for_known_event_id(): void {
		\Activity_Log_Abilities_Test_Stub::seed(
			array(
				'current' => array(
					'orderedItems' => array(
						$this->make_event( array( 'activity_id' => 'aaa' ) ),
						$this->make_event(
							array(
								'activity_id' => 'bbb',
								'name'        => 'plugin__activated',
							)
						),
						$this->make_event( array( 'activity_id' => 'ccc' ) ),
					),
				),
			)
		);

		$result = \Activity_Log_Abilities_Test_Stub::list_events( array( 'event_id' => 'bbb' ) );

		$this->assertCount( 1, $result );
		$this->assertSame( 'bbb', $result[0]['id'] );
		$this->assertSame( 'plugin', $result[0]['group'] );
	}

	/**
	 * `action` filter narrows to events whose `name` matches exactly. Other
	 * groups (e.g. plugin) are dropped even when their group prefix overlaps.
	 */
	public function test_list_events_filters_by_action_slug(): void {
		\Activity_Log_Abilities_Test_Stub::seed(
			array(
				'current' => array(
					'orderedItems' => array(
						$this->make_event( array( 'name' => 'post__published' ) ),
						$this->make_event( array( 'name' => 'post__updated' ) ),
						$this->make_event( array( 'name' => 'plugin__activated' ) ),
					),
				),
			)
		);

		$result = \Activity_Log_Abilities_Test_Stub::list_events( array( 'action' => 'post__updated' ) );

		$this->assertCount( 1, $result );
		$this->assertSame( 'post__updated', $result[0]['action'] );
	}

	/**
	 * Filters forwarded to the upstream proxy are mapped to the controller's
	 * accepted param names (date_from/date_to -> after/before, per_page -> number,
	 * group as single-element array).
	 */
	public function test_list_events_maps_input_params_to_upstream_names(): void {
		\Activity_Log_Abilities_Test_Stub::seed( array() );

		\Activity_Log_Abilities_Test_Stub::list_events(
			array(
				'group'     => 'post',
				'date_from' => '2026-05-01T00:00:00+00:00',
				'date_to'   => '2026-05-31T23:59:59+00:00',
				'page'      => 2,
				'per_page'  => 50,
			)
		);

		$request = \Activity_Log_Abilities_Test_Stub::$last_request;
		$this->assertNotNull( $request );
		$this->assertSame( array( 'post' ), $request->get_param( 'group' ) );
		$this->assertSame( '2026-05-01T00:00:00+00:00', $request->get_param( 'after' ) );
		$this->assertSame( '2026-05-31T23:59:59+00:00', $request->get_param( 'before' ) );
		$this->assertSame( 2, $request->get_param( 'page' ) );
		$this->assertSame( 50, $request->get_param( 'number' ) );
	}

	/**
	 * `per_page` greater than 100 is clamped to 100 (schema max).
	 */
	public function test_list_events_clamps_per_page_to_schema_max(): void {
		\Activity_Log_Abilities_Test_Stub::seed( array() );

		\Activity_Log_Abilities_Test_Stub::list_events( array( 'per_page' => 9999 ) );

		$this->assertSame( 100, \Activity_Log_Abilities_Test_Stub::$last_request->get_param( 'number' ) );
	}

	/**
	 * Upstream WP_Error propagates unchanged.
	 */
	public function test_list_events_propagates_upstream_wp_error(): void {
		\Activity_Log_Abilities_Test_Stub::seed_error(
			new WP_Error( 'activity_log_request_failed', 'Upstream is down', array( 'status' => 503 ) )
		);

		$result = \Activity_Log_Abilities_Test_Stub::list_events();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'activity_log_request_failed', $result->get_error_code() );
	}

	/**
	 * Malformed input (non-array) is tolerated and treated as the empty input.
	 * The schema layer enforces shape on the wire, but execute_callback should
	 * be defensive too.
	 */
	public function test_list_events_tolerates_non_array_input(): void {
		\Activity_Log_Abilities_Test_Stub::seed( array() );

		$result = \Activity_Log_Abilities_Test_Stub::list_events( null );

		$this->assertSame( array(), $result );
	}
}
