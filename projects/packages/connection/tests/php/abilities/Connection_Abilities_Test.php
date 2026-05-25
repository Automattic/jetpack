<?php
/**
 * Tests for the Connection_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-connection
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Connection\Abilities;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Package_Version;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for Connection_Abilities registration and execution.
 *
 * Run from projects/packages/connection:
 *
 *   composer phpunit -- --filter Connection_Abilities_Test
 *
 * @covers \Automattic\Jetpack\Connection\Abilities\Connection_Abilities
 */
#[CoversClass( Connection_Abilities::class )]
class Connection_Abilities_Test extends TestCase {

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Most tests open the gate; the "default disabled" test closes it explicitly.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Reset any registrar lifecycle hooks a prior test may have added — we
		// intentionally avoid touching the Abilities registry itself here, since
		// accessing it via wp_has_ability() would fire wp_abilities_api_init as
		// a side effect and corrupt the "did_action" assertions below.
		remove_action( 'wp_abilities_api_categories_init', array( Connection_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Connection_Abilities::class, 'register_abilities' ) );
	}

	/**
	 * Tear down the test.
	 */
	public function tearDown(): void {
		parent::tearDown();
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'jetpack_connection_abilities_manager' );
		remove_action( 'wp_abilities_api_categories_init', array( Connection_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Connection_Abilities::class, 'register_abilities' ) );

		wp_set_current_user( 0 );

		if ( did_action( 'wp_abilities_api_init' ) ) {
			$this->deregister_category_and_abilities();
		}

		WorDBless_Users::init()->clear_all_users();
		WorDBless_Options::init()->clear_options();
		Constants::clear_constants();
	}

	/**
	 * Remove our category + abilities from the registry so tests don't leak.
	 */
	private function deregister_category_and_abilities(): void {
		if ( function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Connection_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			if ( wp_has_ability_category( Connection_Abilities::CATEGORY_SLUG ) ) {
				wp_unregister_ability_category( Connection_Abilities::CATEGORY_SLUG );
			}
		}
	}

	/**
	 * Push an entry on `$wp_current_filter` so `doing_action()` reports true
	 * for the duration of the callback, then pop it back off.
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
	 * Inject a stub Connection_Manager via the filter the abilities use.
	 *
	 * @param array $methods Map of method name => return value.
	 * @return Connection_Manager
	 */
	private function inject_manager_mock( array $methods ): Connection_Manager {
		$stub = $this->createStub( Connection_Manager::class );
		foreach ( $methods as $method => $return ) {
			$stub->method( $method )->willReturn( $return );
		}
		add_filter(
			'jetpack_connection_abilities_manager',
			static function () use ( $stub ) {
				return $stub;
			}
		);
		return $stub;
	}

	// --- Abstract getters --------------------------------------------------.

	/**
	 * The category slug must be the top-level "jetpack".
	 */
	public function test_category_slug_is_jetpack(): void {
		$this->assertSame( 'jetpack', Connection_Abilities::get_category_slug() );
	}

	/**
	 * The category definition must include both a label and description.
	 */
	public function test_category_definition_has_label_and_description(): void {
		$def = Connection_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotSame( '', $def['label'] );
		$this->assertNotSame( '', $def['description'] );
	}

	/**
	 * The abilities map must list exactly the single read ability we ship in this PR.
	 */
	public function test_abilities_map_lists_the_single_read_ability(): void {
		$abilities = Connection_Abilities::get_abilities();
		$this->assertSame(
			array(
				'jetpack/get-connection-status',
			),
			array_keys( $abilities )
		);
	}

	/**
	 * Specs must not set their own `category` — Registrar auto-injects it.
	 */
	public function test_no_spec_sets_category_explicitly(): void {
		foreach ( Connection_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	/**
	 * Every spec must declare execute, permission, and read-only annotations.
	 */
	public function test_every_spec_declares_annotations_permission_and_execute(): void {
		foreach ( Connection_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'execute_callback', $spec, "Ability {$slug} missing execute_callback" );
			$this->assertIsCallable( $spec['execute_callback'], "Ability {$slug} execute_callback not callable" );
			$this->assertArrayHasKey( 'permission_callback', $spec, "Ability {$slug} missing permission_callback" );
			$this->assertIsCallable( $spec['permission_callback'], "Ability {$slug} permission_callback not callable" );
			$this->assertArrayHasKey( 'meta', $spec );
			$this->assertArrayHasKey( 'annotations', $spec['meta'] );
			$this->assertTrue( $spec['meta']['annotations']['readonly'], "Ability {$slug} must be readonly" );
			$this->assertFalse( $spec['meta']['annotations']['destructive'], "Ability {$slug} must not be destructive" );
			$this->assertTrue( $spec['meta']['annotations']['idempotent'], "Ability {$slug} must be idempotent" );
		}
	}

	// --- Registrar wiring --------------------------------------------------.

	/**
	 * When the `jetpack_wp_abilities_enabled` filter returns false, `init()`
	 * must register nothing (no category, no abilities, no hooks).
	 */
	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Connection_Abilities::init();

		$this->assertFalse(
			has_action( 'wp_abilities_api_categories_init', array( Connection_Abilities::class, 'register_category' ) ),
			'Category registration must not be hooked when the gate filter is false.'
		);
		$this->assertFalse(
			has_action( 'wp_abilities_api_init', array( Connection_Abilities::class, 'register_abilities' ) ),
			'Ability registration must not be hooked when the gate filter is false.'
		);

		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
	}

	/**
	 * When the gate filter returns true and the Abilities API lifecycle
	 * actions have not yet fired, `init()` must hook both of them.
	 */
	public function test_init_hooks_both_lifecycle_actions_when_gate_filter_is_true(): void {
		Connection_Abilities::init();

		$this->assertNotFalse(
			has_action( 'wp_abilities_api_categories_init', array( Connection_Abilities::class, 'register_category' ) ),
			'Category registration must be hooked when the gate filter is true.'
		);
		$this->assertNotFalse(
			has_action( 'wp_abilities_api_init', array( Connection_Abilities::class, 'register_abilities' ) ),
			'Ability registration must be hooked when the gate filter is true.'
		);
	}

	/**
	 * `jetpack_wp_abilities_should_register` short-circuits per-ability
	 * registration when the filter returns false.
	 */
	public function test_register_abilities_skips_when_should_register_filter_returns_false(): void {
		// Deny every slug.
		add_filter( 'jetpack_wp_abilities_should_register', '__return_false' );

		$registered = array();
		$capture    = static function ( $slug ) use ( &$registered ) {
			$registered[] = $slug;
			return false;
		};

		$this->with_simulated_action(
			'wp_abilities_api_init',
			function () use ( $capture ) {
				// Stub the registration function so we can observe what would be registered.
				if ( ! function_exists( 'wp_register_ability' ) ) {
					$this->markTestSkipped( 'wp_register_ability not available in this WordPress build.' );
				}
				// We cannot redefine the function; instead, rely on the should_register
				// filter to short-circuit BEFORE wp_register_ability is called and
				// assert via the filter that no ability slugs got through.
				add_filter(
					'jetpack_wp_abilities_should_register',
					$capture,
					11,
					3
				);

				Connection_Abilities::register_abilities();
			}
		);

		// The capture filter ran for each ability, but `should_register` returned
		// false on the earlier (priority-10) filter, so no slug should have been
		// passed through. We rely on no abilities being registered as the assertion.
		foreach ( array_keys( Connection_Abilities::get_abilities() ) as $slug ) {
			$this->assertFalse(
				function_exists( 'wp_has_ability' ) && wp_has_ability( $slug ),
				"Ability {$slug} must NOT register when should_register returns false."
			);
		}

		remove_filter( 'jetpack_wp_abilities_should_register', '__return_false' );
		remove_filter( 'jetpack_wp_abilities_should_register', $capture, 11 );
	}

	/**
	 * The Registrar must auto-inject this subclass's `CATEGORY_SLUG` on every
	 * registered ability whose spec omits `category`.
	 */
	public function test_category_auto_injection_on_registered_abilities(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WordPress build.' );
		}

		$this->with_simulated_action(
			'wp_abilities_api_categories_init',
			function () {
				Connection_Abilities::register_category();
			}
		);

		$this->with_simulated_action(
			'wp_abilities_api_init',
			function () {
				Connection_Abilities::register_abilities();
			}
		);

		foreach ( array_keys( Connection_Abilities::get_abilities() ) as $slug ) {
			$ability = wp_get_ability( $slug );
			$this->assertNotNull( $ability, "Ability {$slug} should have been registered." );
			$this->assertSame(
				Connection_Abilities::CATEGORY_SLUG,
				$ability->get_category(),
				"Registrar must auto-inject the category slug on {$slug}."
			);
		}
	}

	// --- Permission callbacks ----------------------------------------------.

	/**
	 * `can_view_connection()` must deny anonymous (logged-out) callers.
	 */
	public function test_can_view_connection_denies_anonymous_user(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Connection_Abilities::can_view_connection() );
	}

	/**
	 * Subscribers must not be able to read connection state — the
	 * `jetpack_admin_page` capability is what scopes the Jetpack admin page,
	 * and we mirror that here.
	 */
	public function test_can_view_connection_denies_subscriber(): void {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'connection_abilities_subscriber',
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( (int) $user_id );

		$this->assertFalse( Connection_Abilities::can_view_connection() );
	}

	/**
	 * Users with the `jetpack_admin_page` capability may read connection state.
	 */
	public function test_can_view_connection_allows_user_with_jetpack_admin_page_cap(): void {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'connection_abilities_admin',
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( (int) $user_id );

		// `jetpack_admin_page` is a meta-cap mapped via Jetpack's capability
		// filter in production; grant it directly here so the test stays
		// independent of Jetpack's capability mapping plumbing.
		$grant = static function ( $allcaps ) {
			$allcaps['jetpack_admin_page'] = true;
			return $allcaps;
		};
		add_filter( 'user_has_cap', $grant );

		try {
			$this->assertTrue( Connection_Abilities::can_view_connection() );
		} finally {
			remove_filter( 'user_has_cap', $grant );
		}
	}

	// --- get-connection-status execute -------------------------------------.

	/**
	 * With no options set and a disconnected Manager stub, the read must
	 * return the documented zero state and a non-empty `registration_url`.
	 */
	public function test_get_connection_status_returns_disconnected_state_by_default(): void {
		$this->inject_manager_mock(
			array(
				'is_connected'       => false,
				'has_connected_user' => false,
			)
		);

		$out = Connection_Abilities::get_connection_status();

		$this->assertIsArray( $out );
		$this->assertFalse( $out['site_registered'] );
		$this->assertFalse( $out['user_connected'] );
		$this->assertNull( $out['master_user'] );
		$this->assertArrayNotHasKey( 'plan_class', $out );
		$this->assertArrayNotHasKey( 'jetpack_version', $out );
		$this->assertNull( $out['blog_id'] );
		$this->assertIsString( $out['registration_url'] );
		$this->assertNotSame( '', $out['registration_url'] );
		$this->assertSame( Package_Version::PACKAGE_VERSION, $out['connection_version'] );
	}

	/**
	 * With a connected Manager stub and the full set of options populated,
	 * the read must surface blog_id, master_user, and connection_version,
	 * and return a null `registration_url` (the site is already connected).
	 */
	public function test_get_connection_status_reports_connected_state_with_options_set(): void {
		$this->inject_manager_mock(
			array(
				'is_connected'       => true,
				'has_connected_user' => true,
			)
		);
		Jetpack_Options::update_option( 'id', 12345 );
		Jetpack_Options::update_option( 'master_user', 42 );

		$out = Connection_Abilities::get_connection_status();

		$this->assertTrue( $out['site_registered'] );
		$this->assertTrue( $out['user_connected'] );
		$this->assertSame( 42, $out['master_user'] );
		$this->assertSame( 12345, $out['blog_id'] );
		$this->assertArrayNotHasKey( 'plan_class', $out );
		$this->assertArrayNotHasKey( 'jetpack_version', $out );
		$this->assertNull( $out['registration_url'], 'registration_url must be null once the site is registered.' );
		$this->assertSame( Package_Version::PACKAGE_VERSION, $out['connection_version'] );
	}

	public function test_every_ability_opts_into_mcp_as_public_tool(): void {
		foreach ( Connection_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'mcp', $spec['meta'], "{$slug} must publish meta.mcp." );
			$this->assertTrue( $spec['meta']['mcp']['public'], "{$slug} must opt into MCP." );
			$this->assertSame( 'tool', $spec['meta']['mcp']['type'], "{$slug} must be exposed as an MCP tool." );
		}
	}
}
