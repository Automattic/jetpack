<?php
/**
 * Tests for the Subscribers_Dashboard_Abilities Registrar subclass.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

use Automattic\Jetpack\Plugin\Abilities\Subscribers_Dashboard_Abilities;
use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/class-subscribers-dashboard-abilities-test-stub.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Abilities\Subscribers_Dashboard_Abilities
 */
#[CoversClass( Subscribers_Dashboard_Abilities::class )]
class Subscribers_Dashboard_Abilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Administrator user id, created once per test.
	 *
	 * @var integer
	 */
	private $admin_id;

	/**
	 * Subscriber user id, created once per test.
	 *
	 * @var integer
	 */
	private $subscriber_id;

	public function set_up() {
		parent::set_up();

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'subs_abilities_admin_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'admin_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'subs_abilities_sub_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'sub_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'subscriber',
			)
		);

		Subscribers_Dashboard_Abilities_Test_Stub::reset();

		// Default: gate open for most test cases.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		wp_set_current_user( 0 );

		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Subscribers_Dashboard_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Subscribers_Dashboard_Abilities::class, 'register_abilities' ) );

		// Unregister anything this test left behind so the singleton registry stays clean
		// between tests (the WP Abilities Registry persists across tests within a process).
		if ( function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Subscribers_Dashboard_Abilities::get_abilities() ) as $slug ) {
				wp_unregister_ability( $slug );
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' ) ) {
			wp_unregister_ability_category( Subscribers_Dashboard_Abilities::get_category_slug() );
		}

		Subscribers_Dashboard_Abilities_Test_Stub::reset();

		parent::tear_down();
	}

	/**
	 * Hook the registrar callbacks and fire the API lifecycle actions so registrations
	 * happen inside the action callstack — `wp_register_ability(_category)` enforces
	 * `doing_action()`, so direct invocation outside the hook is rejected.
	 */
	private function fire_abilities_lifecycle(): void {
		add_action( Registrar::CATEGORIES_INIT_ACTION, array( Subscribers_Dashboard_Abilities::class, 'register_category' ) );
		add_action( Registrar::ABILITIES_INIT_ACTION, array( Subscribers_Dashboard_Abilities::class, 'register_abilities' ) );
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );
	}

	// -------------------- Abstract getters --------------------

	/**
	 * Category slug is namespaced under the plugin.
	 */
	public function test_category_slug_is_namespaced() {
		$this->assertSame( 'jetpack-subscribers', Subscribers_Dashboard_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = Subscribers_Dashboard_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertIsString( $def['label'] );
		$this->assertIsString( $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = Subscribers_Dashboard_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-subscribers/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Subscribers_Dashboard_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_surface_exposes_expected_abilities() {
		$abilities = Subscribers_Dashboard_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-subscribers/list-subscribers', $abilities );
		$this->assertArrayHasKey( 'jetpack-subscribers/get-summary', $abilities );
		$this->assertArrayHasKey( 'jetpack-subscribers/delete-subscriber', $abilities );
		$this->assertArrayHasKey( 'jetpack-subscribers/bulk-delete-subscribers', $abilities );
	}

	public function test_list_subscribers_is_annotated_readonly_idempotent() {
		$spec = Subscribers_Dashboard_Abilities::get_abilities()['jetpack-subscribers/list-subscribers'];
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_get_summary_is_annotated_readonly_idempotent() {
		$spec = Subscribers_Dashboard_Abilities::get_abilities()['jetpack-subscribers/get-summary'];
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_delete_subscriber_is_annotated_destructive() {
		$spec = Subscribers_Dashboard_Abilities::get_abilities()['jetpack-subscribers/delete-subscriber'];
		$this->assertFalse( $spec['meta']['annotations']['readonly'] );
		$this->assertTrue( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_bulk_delete_subscribers_is_annotated_destructive() {
		$spec = Subscribers_Dashboard_Abilities::get_abilities()['jetpack-subscribers/bulk-delete-subscribers'];
		$this->assertFalse( $spec['meta']['annotations']['readonly'] );
		$this->assertTrue( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_bulk_delete_caps_input_at_100() {
		$spec = Subscribers_Dashboard_Abilities::get_abilities()['jetpack-subscribers/bulk-delete-subscribers'];
		$this->assertSame( 100, $spec['input_schema']['properties']['subscribers']['maxItems'] );
		$this->assertSame( 1, $spec['input_schema']['properties']['subscribers']['minItems'] );
	}

	// -------------------- Registrar wiring --------------------

	/**
	 * Gate filter false => init() short-circuits and hooks nothing.
	 */
	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Subscribers_Dashboard_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Subscribers_Dashboard_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Subscribers_Dashboard_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		Subscribers_Dashboard_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Subscribers_Dashboard_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Subscribers_Dashboard_Abilities::class, 'register_abilities' ) )
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
			if ( str_starts_with( $name, 'jetpack-subscribers/' ) ) {
				$registered_slugs[] = $name;
			}
		}

		foreach ( array_keys( Subscribers_Dashboard_Abilities::get_abilities() ) as $slug ) {
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
		foreach ( array_keys( Subscribers_Dashboard_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotContains( $slug, $registered_slugs, "Ability {$slug} must be filtered out." );
		}
	}

	public function test_register_abilities_auto_injects_category() {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		foreach ( array_keys( Subscribers_Dashboard_Abilities::get_abilities() ) as $slug ) {
			$registered = wp_get_ability( $slug );
			$this->assertNotNull( $registered, "Ability {$slug} should be registered." );
			$this->assertSame(
				'jetpack-subscribers',
				$registered->get_category(),
				"Ability {$slug} should have category auto-injected."
			);
		}
	}

	// -------------------- Permission callback --------------------

	/**
	 * Admins can manage subscribers.
	 */
	public function test_can_manage_subscribers_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Subscribers_Dashboard_Abilities::can_manage_subscribers() );
	}

	public function test_can_manage_subscribers_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Subscribers_Dashboard_Abilities::can_manage_subscribers() );
	}

	public function test_can_manage_subscribers_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Subscribers_Dashboard_Abilities::can_manage_subscribers() );
	}

	// -------------------- Input validation --------------------

	/**
	 * Refuses to dispatch when no identifier is provided.
	 */
	public function test_delete_subscriber_rejects_empty_input() {
		wp_set_current_user( $this->admin_id );
		$result = Subscribers_Dashboard_Abilities::delete_subscriber( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_subscribers_delete_invalid', $result->get_error_code() );
	}

	public function test_delete_subscriber_rejects_null_input() {
		wp_set_current_user( $this->admin_id );
		$result = Subscribers_Dashboard_Abilities::delete_subscriber( null );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_subscribers_delete_invalid', $result->get_error_code() );
	}

	public function test_delete_subscriber_rejects_zero_only_identifiers() {
		// All identifiers present but all zero/empty — same effective state as omitting them,
		// so the validator should refuse the call before dispatching.
		wp_set_current_user( $this->admin_id );
		$result = Subscribers_Dashboard_Abilities::delete_subscriber(
			array(
				'user_id'               => 0,
				'email_subscription_id' => 0,
				'paid_subscription_ids' => array(),
			)
		);
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_subscribers_delete_invalid', $result->get_error_code() );
	}

	public function test_bulk_delete_rejects_missing_subscribers_key() {
		wp_set_current_user( $this->admin_id );
		$result = Subscribers_Dashboard_Abilities::bulk_delete_subscribers( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_subscribers_bulk_delete_empty', $result->get_error_code() );
	}

	public function test_bulk_delete_rejects_empty_subscribers_array() {
		wp_set_current_user( $this->admin_id );
		$result = Subscribers_Dashboard_Abilities::bulk_delete_subscribers( array( 'subscribers' => array() ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_subscribers_bulk_delete_empty', $result->get_error_code() );
	}

	// -------------------- Execute happy paths (via stub) --------------------

	/**
	 * Forwards every recognized input parameter onto the dispatched
	 * WP_REST_Request so the controller sees the same shape.
	 */
	public function test_list_subscribers_passes_input_through_to_dispatched_request() {
		wp_set_current_user( $this->admin_id );
		Subscribers_Dashboard_Abilities_Test_Stub::enqueue_response(
			array(
				'subscribers' => array(),
				'total'       => 0,
			)
		);

		$result = Subscribers_Dashboard_Abilities_Test_Stub::list_subscribers(
			array(
				'page'       => 2,
				'per_page'   => 25,
				'search'     => 'bob',
				'sort'       => 'name',
				'sort_order' => 'asc',
				'filters'    => array( 'email_subscriber' ),
			)
		);

		$this->assertSame(
			array(
				'subscribers' => array(),
				'total'       => 0,
			),
			$result
		);
		$this->assertSame( 1, Subscribers_Dashboard_Abilities_Test_Stub::$dispatch_calls );

		$request = Subscribers_Dashboard_Abilities_Test_Stub::$last_request;
		$this->assertInstanceOf( \WP_REST_Request::class, $request );
		$this->assertSame( '/wpcom/v2/subscribers/list', $request->get_route() );
		$this->assertSame( 'GET', $request->get_method() );
		$this->assertSame( 2, $request->get_param( 'page' ) );
		$this->assertSame( 25, $request->get_param( 'per_page' ) );
		$this->assertSame( 'bob', $request->get_param( 'search' ) );
		$this->assertSame( 'name', $request->get_param( 'sort' ) );
		$this->assertSame( 'asc', $request->get_param( 'sort_order' ) );
		$this->assertSame( array( 'email_subscriber' ), $request->get_param( 'filters' ) );
	}

	public function test_list_subscribers_returns_wp_error_on_dispatch_failure() {
		wp_set_current_user( $this->admin_id );
		Subscribers_Dashboard_Abilities_Test_Stub::enqueue_response(
			new \WP_Error( 'subscribers_list_failed', 'wpcom is sad', array( 'status' => 502 ) )
		);

		$result = Subscribers_Dashboard_Abilities_Test_Stub::list_subscribers( array( 'page' => 1 ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'subscribers_list_failed', $result->get_error_code() );
	}

	public function test_get_summary_dispatches_totals_route_with_no_params() {
		wp_set_current_user( $this->admin_id );
		Subscribers_Dashboard_Abilities_Test_Stub::enqueue_response(
			array(
				'counts' => array(
					'total_subscribers' => 42,
					'email_subscribers' => 30,
					'social_followers'  => 10,
					'paid_subscribers'  => 2,
				),
			)
		);

		$result = Subscribers_Dashboard_Abilities_Test_Stub::get_summary();

		$this->assertIsArray( $result );
		$this->assertSame( 42, $result['counts']['total_subscribers'] );
		$request = Subscribers_Dashboard_Abilities_Test_Stub::$last_request;
		$this->assertSame( '/wpcom/v2/subscribers/totals', $request->get_route() );
		$this->assertSame( 'GET', $request->get_method() );
	}

	public function test_delete_subscriber_dispatches_remove_route_with_all_ids() {
		wp_set_current_user( $this->admin_id );
		Subscribers_Dashboard_Abilities_Test_Stub::enqueue_response(
			array(
				'ok'     => true,
				'errors' => array(),
			)
		);

		$result = Subscribers_Dashboard_Abilities_Test_Stub::delete_subscriber(
			array(
				'user_id'               => 7,
				'email_subscription_id' => 0,
				'paid_subscription_ids' => array( 'sub_42' ),
			)
		);

		$this->assertIsArray( $result );
		$this->assertTrue( $result['ok'] );
		$this->assertSame( array(), $result['errors'] );

		$request = Subscribers_Dashboard_Abilities_Test_Stub::$last_request;
		$this->assertSame( '/wpcom/v2/subscribers/remove', $request->get_route() );
		$this->assertSame( 'POST', $request->get_method() );
		$this->assertSame( 7, $request->get_param( 'user_id' ) );
		$this->assertSame( 0, $request->get_param( 'email_subscription_id' ) );
		$this->assertSame( array( 'sub_42' ), $request->get_param( 'paid_subscription_ids' ) );
	}

	public function test_delete_subscriber_passes_through_partial_failure_shape() {
		// Controller signals partial failure with ok=false + per-step errors[]; abilities
		// must surface that exactly, not mask it as a WP_Error.
		wp_set_current_user( $this->admin_id );
		Subscribers_Dashboard_Abilities_Test_Stub::enqueue_response(
			array(
				'ok'     => false,
				'errors' => array(
					array(
						'step'  => 'cancel_paid_subscription',
						'id'    => 'sub_42',
						'error' => 'wpcom said no',
					),
				),
			)
		);

		$result = Subscribers_Dashboard_Abilities_Test_Stub::delete_subscriber(
			array(
				'user_id'               => 7,
				'paid_subscription_ids' => array( 'sub_42' ),
			)
		);

		$this->assertIsArray( $result );
		$this->assertFalse( $result['ok'] );
		$this->assertCount( 1, $result['errors'] );
		$this->assertSame( 'cancel_paid_subscription', $result['errors'][0]['step'] );
	}

	public function test_bulk_delete_aggregates_successes_and_failures() {
		// Three subscribers: first succeeds, second fails per-step (controller ok=false),
		// third fails at dispatch (WP_Error). The aggregate `ok` is false because at least
		// one entry failed, and each failure surfaces with its 0-based index for callers.
		wp_set_current_user( $this->admin_id );

		Subscribers_Dashboard_Abilities_Test_Stub::enqueue_response(
			array(
				'ok'     => true,
				'errors' => array(),
			)
		);
		Subscribers_Dashboard_Abilities_Test_Stub::enqueue_response(
			array(
				'ok'     => false,
				'errors' => array(
					array(
						'step'  => 'delete_follower',
						'id'    => '7',
						'error' => 'wpcom said no',
					),
				),
			)
		);
		Subscribers_Dashboard_Abilities_Test_Stub::enqueue_response(
			new \WP_Error( 'subscribers_list_failed', 'transport down', array( 'status' => 502 ) )
		);

		$result = Subscribers_Dashboard_Abilities_Test_Stub::bulk_delete_subscribers(
			array(
				'subscribers' => array(
					array( 'user_id' => 1 ),
					array( 'user_id' => 7 ),
					array( 'email_subscription_id' => 99 ),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertFalse( $result['ok'] );

		$this->assertCount( 1, $result['deleted'] );
		$this->assertSame( 0, $result['deleted'][0]['index'] );
		$this->assertSame( 1, $result['deleted'][0]['user_id'] );

		$this->assertCount( 2, $result['failed'] );
		$this->assertSame( 1, $result['failed'][0]['index'] );
		$this->assertSame( 'delete_follower', $result['failed'][0]['errors'][0]['step'] );
		$this->assertSame( 2, $result['failed'][1]['index'] );
		$this->assertSame( 'dispatch', $result['failed'][1]['errors'][0]['step'] );

		// Every input entry should have triggered exactly one dispatch.
		$this->assertSame( 3, Subscribers_Dashboard_Abilities_Test_Stub::$dispatch_calls );
	}

	public function test_bulk_delete_short_circuits_on_invalid_entry_without_dispatch() {
		// Bulk delegates to delete_subscriber(), which validates each entry up-front.
		// An entry with no identifiers must fail fast and contribute to failed[] without
		// reaching the dispatch seam.
		wp_set_current_user( $this->admin_id );

		$result = Subscribers_Dashboard_Abilities_Test_Stub::bulk_delete_subscribers(
			array(
				'subscribers' => array(
					array(),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertFalse( $result['ok'] );
		$this->assertSame( array(), $result['deleted'] );
		$this->assertCount( 1, $result['failed'] );
		$this->assertSame( 0, $result['failed'][0]['index'] );
		$this->assertSame( 'dispatch', $result['failed'][0]['errors'][0]['step'] );
		$this->assertSame( 0, Subscribers_Dashboard_Abilities_Test_Stub::$dispatch_calls );
	}

	public function test_bulk_delete_all_success_marks_ok_true() {
		wp_set_current_user( $this->admin_id );

		Subscribers_Dashboard_Abilities_Test_Stub::enqueue_response(
			array(
				'ok'     => true,
				'errors' => array(),
			)
		);
		Subscribers_Dashboard_Abilities_Test_Stub::enqueue_response(
			array(
				'ok'     => true,
				'errors' => array(),
			)
		);

		$result = Subscribers_Dashboard_Abilities_Test_Stub::bulk_delete_subscribers(
			array(
				'subscribers' => array(
					array( 'user_id' => 1 ),
					array( 'email_subscription_id' => 5 ),
				),
			)
		);

		$this->assertTrue( $result['ok'] );
		$this->assertCount( 2, $result['deleted'] );
		$this->assertSame( array(), $result['failed'] );
	}
}
