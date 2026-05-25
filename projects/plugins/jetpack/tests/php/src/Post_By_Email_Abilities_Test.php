<?php
/**
 * Tests for the Post_By_Email_Abilities Registrar subclass.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

require_once __DIR__ . '/../../../modules/post-by-email/abilities/class-post-by-email-abilities.php';

use Automattic\Jetpack\Plugin\Abilities\Post_By_Email_Abilities;
use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/class-post-by-email-abilities-test-stub.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Abilities\Post_By_Email_Abilities
 */
#[CoversClass( Post_By_Email_Abilities::class )]
class Post_By_Email_Abilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Authenticated post-authoring user id, created once per test.
	 *
	 * Post by Email is a per-user feature for post authors (gated on
	 * `current_user_can( 'edit_posts' )`, matching the legacy AJAX/REST surface),
	 * so the test uses an Author role.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Subscriber id used to assert that non-authoring users are denied.
	 *
	 * @var int
	 */
	private $subscriber_id;

	public function set_up() {
		parent::set_up();

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'pbe_abilities_user_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'user_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'author',
			)
		);

		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'pbe_abilities_subscriber_' . wp_generate_password( 8, false, false ),
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

		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Post_By_Email_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Post_By_Email_Abilities::class, 'register_abilities' ) );

		// Unregister anything this test left behind so the singleton registry stays clean
		// between tests (the WP Abilities Registry persists across tests within a process).
		if ( function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Post_By_Email_Abilities::get_abilities() ) as $slug ) {
				wp_unregister_ability( $slug );
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' ) ) {
			wp_unregister_ability_category( Post_By_Email_Abilities::get_category_slug() );
		}

		if ( $this->user_id ) {
			delete_option( 'post_by_email_address' . $this->user_id );
		}

		parent::tear_down();
	}

	/**
	 * Hook the registrar callbacks and fire the API lifecycle actions so registrations
	 * happen inside the action callstack — `wp_register_ability(_category)` enforces
	 * `doing_action()`, so direct invocation outside the hook is rejected.
	 */
	private function fire_abilities_lifecycle(): void {
		add_action( Registrar::CATEGORIES_INIT_ACTION, array( Post_By_Email_Abilities::class, 'register_category' ) );
		add_action( Registrar::ABILITIES_INIT_ACTION, array( Post_By_Email_Abilities::class, 'register_abilities' ) );
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );
	}

	/**
	 * Activate the Post by Email module via the `jetpack_active_modules` filter
	 * so the precondition checks pass for tests that don't care about the
	 * inactive-module branch.
	 */
	private function activate_post_by_email_module(): void {
		add_filter(
			'jetpack_active_modules',
			static function ( $mods ) {
				$mods   = is_array( $mods ) ? $mods : array();
				$mods[] = 'post-by-email';
				return array_values( array_unique( $mods ) );
			}
		);
	}

	/**
	 * -------------------- Abstract getters --------------------
	 */

	/**
	 * Category slug is namespaced under the plugin.
	 */
	public function test_category_slug_is_plugin_scoped() {
		$this->assertSame( 'jetpack-post-by-email', Post_By_Email_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = Post_By_Email_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertIsString( $def['label'] );
		$this->assertIsString( $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = Post_By_Email_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-post-by-email/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Post_By_Email_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_surface_exposes_get_status_and_regenerate_address() {
		$abilities = Post_By_Email_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-post-by-email/get-status', $abilities );
		$this->assertArrayHasKey( 'jetpack-post-by-email/regenerate-address', $abilities );
	}

	public function test_get_status_is_annotated_readonly_idempotent() {
		$spec = Post_By_Email_Abilities::get_abilities()['jetpack-post-by-email/get-status'];
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_regenerate_address_is_annotated_destructive_non_idempotent() {
		$spec = Post_By_Email_Abilities::get_abilities()['jetpack-post-by-email/regenerate-address'];
		$this->assertFalse( $spec['meta']['annotations']['readonly'] );
		$this->assertTrue( $spec['meta']['annotations']['destructive'] );
		$this->assertFalse( $spec['meta']['annotations']['idempotent'] );
	}

	/**
	 * -------------------- Registrar wiring --------------------
	 */

	/**
	 * Gate filter false => init() short-circuits and hooks nothing.
	 */
	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Post_By_Email_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Post_By_Email_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Post_By_Email_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		Post_By_Email_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Post_By_Email_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Post_By_Email_Abilities::class, 'register_abilities' ) )
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
			if ( str_starts_with( $name, 'jetpack-post-by-email/' ) ) {
				$registered_slugs[] = $name;
			}
		}

		foreach ( array_keys( Post_By_Email_Abilities::get_abilities() ) as $slug ) {
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
		foreach ( array_keys( Post_By_Email_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotContains( $slug, $registered_slugs, "Ability {$slug} must be filtered out." );
		}
	}

	public function test_register_abilities_auto_injects_category() {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		foreach ( array_keys( Post_By_Email_Abilities::get_abilities() ) as $slug ) {
			$registered = wp_get_ability( $slug );
			$this->assertNotNull( $registered, "Ability {$slug} should be registered." );
			$this->assertSame(
				'jetpack-post-by-email',
				$registered->get_category(),
				"Ability {$slug} should have category auto-injected."
			);
		}
	}

	/**
	 * -------------------- Permission callbacks --------------------
	 */
	public function test_can_view_post_by_email_allows_post_author() {
		wp_set_current_user( $this->user_id );
		$this->assertTrue( Post_By_Email_Abilities::can_view_post_by_email() );
	}

	public function test_can_view_post_by_email_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Post_By_Email_Abilities::can_view_post_by_email() );
	}

	public function test_can_view_post_by_email_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Post_By_Email_Abilities::can_view_post_by_email() );
	}

	public function test_can_manage_post_by_email_allows_post_author() {
		wp_set_current_user( $this->user_id );
		$this->assertTrue( Post_By_Email_Abilities::can_manage_post_by_email() );
	}

	public function test_can_manage_post_by_email_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Post_By_Email_Abilities::can_manage_post_by_email() );
	}

	public function test_can_manage_post_by_email_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Post_By_Email_Abilities::can_manage_post_by_email() );
	}

	public function test_can_manage_post_by_email_matches_view_permission() {
		// Per spec: manage gate must equal view gate so the two callbacks stay in sync.
		wp_set_current_user( $this->user_id );
		$this->assertSame(
			Post_By_Email_Abilities::can_view_post_by_email(),
			Post_By_Email_Abilities::can_manage_post_by_email()
		);

		wp_set_current_user( $this->subscriber_id );
		$this->assertSame(
			Post_By_Email_Abilities::can_view_post_by_email(),
			Post_By_Email_Abilities::can_manage_post_by_email()
		);

		wp_set_current_user( 0 );
		$this->assertSame(
			Post_By_Email_Abilities::can_view_post_by_email(),
			Post_By_Email_Abilities::can_manage_post_by_email()
		);
	}

	/**
	 * -------------------- Execute callbacks: get_status --------------------
	 */

	/**
	 * With the module inactive, get_status() short-circuits with
	 * `jetpack_post_by_email_module_inactive` before any remote read.
	 */
	public function test_get_status_errors_when_module_inactive() {
		wp_set_current_user( $this->user_id );

		$result = Post_By_Email_Abilities::get_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_post_by_email_module_inactive', $result->get_error_code() );
	}

	/**
	 * Module active but no Jetpack user connection — get_status() returns
	 * `jetpack_post_by_email_not_connected` with a message that steers the
	 * caller to the My Jetpack admin page.
	 */
	public function test_get_status_errors_when_user_not_connected() {
		wp_set_current_user( $this->user_id );
		$this->activate_post_by_email_module();

		$result = Post_By_Email_Abilities::get_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_post_by_email_not_connected', $result->get_error_code() );
		$this->assertStringContainsString( 'My Jetpack', $result->get_error_message() );
	}

	/**
	 * Happy path: module active, user connected, remote returns an address.
	 * Asserts the documented four-key shape with non-null address.
	 */
	public function test_get_status_returns_full_shape_when_address_present() {
		wp_set_current_user( $this->user_id );
		$this->activate_post_by_email_module();

		Post_By_Email_Abilities_Test_Stub::reset( 'pbe-existing@example.test' );

		$result = Post_By_Email_Abilities_Test_Stub::get_status();

		$this->assertIsArray( $result );
		$this->assertTrue( $result['active'] );
		$this->assertSame( 'pbe-existing@example.test', $result['address'] );
		$this->assertTrue( $result['address_active'] );
		$this->assertNull( $result['last_used_at'] );
	}

	/**
	 * Happy path: module active, user connected, remote returns null
	 * (user has not enabled PBE yet). active and address_active are false,
	 * address is null. This is a legitimate signal — not a failure.
	 */
	public function test_get_status_returns_null_address_when_not_enabled() {
		wp_set_current_user( $this->user_id );
		$this->activate_post_by_email_module();

		Post_By_Email_Abilities_Test_Stub::reset( null );

		$result = Post_By_Email_Abilities_Test_Stub::get_status();

		$this->assertIsArray( $result );
		$this->assertFalse( $result['active'] );
		$this->assertNull( $result['address'] );
		$this->assertFalse( $result['address_active'] );
		$this->assertNull( $result['last_used_at'] );
	}

	/**
	 * -------------------- Execute callbacks: regenerate_address --------------------
	 */
	public function test_regenerate_address_errors_when_module_inactive() {
		wp_set_current_user( $this->user_id );

		$result = Post_By_Email_Abilities::regenerate_address();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_post_by_email_module_inactive', $result->get_error_code() );
	}

	public function test_regenerate_address_errors_when_user_not_connected() {
		wp_set_current_user( $this->user_id );
		$this->activate_post_by_email_module();

		$result = Post_By_Email_Abilities::regenerate_address();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_post_by_email_not_connected', $result->get_error_code() );
	}

	/**
	 * Happy path: regenerate returns a fresh address and the documented
	 * { address, regenerated_at } shape with regenerated_at a positive int.
	 * Critically, asserts the new address differs from the old one — this is
	 * the load-bearing invariant of "rotate".
	 */
	public function test_regenerate_address_returns_new_address_and_timestamp() {
		wp_set_current_user( $this->user_id );
		$this->activate_post_by_email_module();

		$old_address = 'pbe-original@example.test';
		$new_address = 'pbe-fresh@example.test';
		Post_By_Email_Abilities_Test_Stub::reset( $old_address, $new_address );

		$before = time();
		$result = Post_By_Email_Abilities_Test_Stub::regenerate_address();
		$after  = time();

		$this->assertIsArray( $result );
		$this->assertSame( $new_address, $result['address'] );
		$this->assertNotSame( $old_address, $result['address'], 'Rotate must produce a new address.' );
		$this->assertIsInt( $result['regenerated_at'] );
		$this->assertGreaterThanOrEqual( $before, $result['regenerated_at'] );
		$this->assertLessThanOrEqual( $after, $result['regenerated_at'] );
		$this->assertSame( 1, Post_By_Email_Abilities_Test_Stub::$apply_calls );
		$this->assertSame(
			array( 'regenerate' ),
			Post_By_Email_Abilities_Test_Stub::$apply_actions,
			'With an existing address the underlying writer must be called with the regenerate action.'
		);
	}

	/**
	 * When the user has no current address, the ability must call the underlying
	 * writer with the 'create' action — the remote 'regenerate' endpoint expects
	 * an existing address to rotate, so calling it for a fresh user would error.
	 */
	public function test_regenerate_address_uses_create_action_when_no_existing_address() {
		wp_set_current_user( $this->user_id );
		$this->activate_post_by_email_module();

		Post_By_Email_Abilities_Test_Stub::reset( null, 'pbe-newly-created@example.test' );

		$result = Post_By_Email_Abilities_Test_Stub::regenerate_address();

		$this->assertIsArray( $result );
		$this->assertSame( 'pbe-newly-created@example.test', $result['address'] );
		$this->assertSame( 1, Post_By_Email_Abilities_Test_Stub::$apply_calls );
		$this->assertSame(
			array( 'create' ),
			Post_By_Email_Abilities_Test_Stub::$apply_actions,
			'A user without an existing address must trigger the create action, not regenerate.'
		);
	}

	/**
	 * Same as above but the current address is the empty string (not just null) —
	 * the routing logic must treat "" identically to null since an empty address
	 * means the user has not been provisioned on the remote service.
	 */
	public function test_regenerate_address_uses_create_action_when_existing_address_is_empty_string() {
		wp_set_current_user( $this->user_id );
		$this->activate_post_by_email_module();

		Post_By_Email_Abilities_Test_Stub::reset( '', 'pbe-newly-created@example.test' );

		$result = Post_By_Email_Abilities_Test_Stub::regenerate_address();

		$this->assertIsArray( $result );
		$this->assertSame(
			array( 'create' ),
			Post_By_Email_Abilities_Test_Stub::$apply_actions,
			'Empty current address must be treated the same as null and route to create.'
		);
		$this->assertSame( 'pbe-newly-created@example.test', $result['address'] );
	}

	/**
	 * Two consecutive successful calls mint two distinct addresses — codifies
	 * the non-idempotent contract declared in the ability annotation.
	 */
	public function test_regenerate_address_is_not_idempotent_across_calls() {
		wp_set_current_user( $this->user_id );
		$this->activate_post_by_email_module();

		Post_By_Email_Abilities_Test_Stub::reset( 'pbe-original@example.test' );

		$first  = Post_By_Email_Abilities_Test_Stub::regenerate_address();
		$second = Post_By_Email_Abilities_Test_Stub::regenerate_address();

		$this->assertIsArray( $first );
		$this->assertIsArray( $second );
		$this->assertNotSame( $first['address'], $second['address'], 'Each regenerate call must produce a distinct address.' );
		$this->assertSame( 2, Post_By_Email_Abilities_Test_Stub::$apply_calls );
	}

	/**
	 * Remote regenerate fails → surface as
	 * `jetpack_post_by_email_service_unreachable` so callers know to retry.
	 */
	public function test_regenerate_address_errors_when_remote_fails() {
		wp_set_current_user( $this->user_id );
		$this->activate_post_by_email_module();

		Post_By_Email_Abilities_Test_Stub::reset(
			'pbe-original@example.test',
			new \WP_Error( 'jetpack_post_by_email_regenerate_failed', 'remote down' )
		);

		$result = Post_By_Email_Abilities_Test_Stub::regenerate_address();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_post_by_email_service_unreachable', $result->get_error_code() );
	}

	/**
	 * -------------------- Real bootstrap path --------------------
	 */

	/**
	 * When the Post by Email module is inactive, modules/post-by-email.php is
	 * never loaded by Jetpack, so the Post_By_Email_Abilities::init() call
	 * inside it never runs and the abilities are not registered. This codifies
	 * the gated-registration contract.
	 */
	public function test_abilities_are_not_registered_when_post_by_email_module_is_inactive() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		// Do NOT fire the lifecycle or call init() — this mirrors the real
		// bootstrap path when post-by-email.php has not been included by Jetpack.
		$registered_slugs = array();
		foreach ( wp_get_abilities() as $ability ) {
			$name = $ability->get_name();
			if ( str_starts_with( $name, 'jetpack-post-by-email/' ) ) {
				$registered_slugs[] = $name;
			}
		}

		$this->assertSame(
			array(),
			$registered_slugs,
			'Post by Email abilities must not be registered while the Post by Email module is inactive (modules/post-by-email.php not loaded).'
		);
	}
}
