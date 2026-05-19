<?php
/**
 * Unit tests for the My_Jetpack_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-my-jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\My_Jetpack\Abilities;

use Automattic\Jetpack\My_Jetpack\Products;
use Automattic\Jetpack\WP_Abilities\Registrar;
use My_Jetpack_Abilities_List_Plans_Stub;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/class-my-jetpack-abilities-list-plans-stub.php';

/**
 * Tests for My_Jetpack_Abilities.
 *
 * @covers \Automattic\Jetpack\My_Jetpack\Abilities\My_Jetpack_Abilities
 */
#[CoversClass( My_Jetpack_Abilities::class )]
class My_Jetpack_Abilities_Test extends TestCase {

	/**
	 * Admin user id used to exercise the permission callback positive case.
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * Subscriber user id used to exercise the permission callback negative case.
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * Set up: register a `map_meta_cap` shim that mirrors the Jetpack plugin's
	 * mapping of `jetpack_admin_page` to `edit_posts`. The plugin defines this
	 * mapping in `class.jetpack.php`; the standalone my-jetpack package test
	 * environment does not load that file, so we apply the same mapping here.
	 */
	public function setUp(): void {
		parent::setUp();
		add_filter( 'map_meta_cap', array( $this, 'map_jetpack_admin_page_cap' ), 10, 2 );
	}

	/**
	 * Tear down: remove filters and clean up option/registry state so each test
	 * starts from a known baseline. The Abilities API registry is process-global
	 * and survives between tests, so any slug we register must be unregistered.
	 */
	public function tearDown(): void {
		remove_filter( 'map_meta_cap', array( $this, 'map_jetpack_admin_page_cap' ), 10 );
		remove_all_filters( 'jetpack_wp_abilities_enabled' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );

		// Only unregister abilities/categories that this test actually registered.
		// Calling wp_unregister_ability() on an unregistered slug emits a
		// `_doing_it_wrong` notice, which fails the test under failOnRisky.
		if ( function_exists( 'wp_unregister_ability' ) && function_exists( 'wp_get_abilities' ) ) {
			$registered_slugs = array_map(
				static function ( $ability ) {
					return $ability->get_name();
				},
				wp_get_abilities()
			);
			foreach ( array_keys( My_Jetpack_Abilities::get_abilities() ) as $slug ) {
				if ( in_array( $slug, $registered_slugs, true ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' ) && function_exists( 'wp_get_ability_categories' ) ) {
			$registered_categories = array_map(
				static function ( $cat ) {
					return $cat->get_slug();
				},
				wp_get_ability_categories()
			);
			if ( in_array( My_Jetpack_Abilities::get_category_slug(), $registered_categories, true ) ) {
				wp_unregister_ability_category( My_Jetpack_Abilities::get_category_slug() );
			}
		}

		// Drain the simulated $wp_current_filter entries set by individual tests.
		global $wp_current_filter, $wp_actions;
		if ( is_array( $wp_current_filter ) ) {
			$wp_current_filter = array_values(
				array_filter(
					$wp_current_filter,
					static function ( $filter ) {
						return Registrar::CATEGORIES_INIT_ACTION !== $filter
							&& Registrar::ABILITIES_INIT_ACTION !== $filter;
					}
				)
			);
		}
		// did_action() reads from $wp_actions; tests that call do_action() or
		// simulate the action via $wp_current_filter must reset this counter
		// or subsequent tests see late-load behavior from Registrar::init().
		if ( is_array( $wp_actions ) ) {
			unset( $wp_actions[ Registrar::CATEGORIES_INIT_ACTION ] );
			unset( $wp_actions[ Registrar::ABILITIES_INIT_ACTION ] );
		}

		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * `map_meta_cap` callback that mirrors the Jetpack plugin's mapping of
	 * `jetpack_admin_page` to `edit_posts`. See `class.jetpack.php`.
	 *
	 * @param string[] $caps Required capabilities for the meta cap.
	 * @param string   $cap  Meta cap being mapped.
	 * @return string[]
	 */
	public function map_jetpack_admin_page_cap( $caps, $cap ) {
		if ( 'jetpack_admin_page' === $cap ) {
			return array( 'edit_posts' );
		}
		return $caps;
	}

	/**
	 * Lazily create the test users — wp_insert_user requires the WP env to be
	 * bootstrapped, which happens in the package bootstrap before any test runs.
	 */
	private function admin_user_id(): int {
		if ( ! self::$admin_id ) {
			self::$admin_id = wp_insert_user(
				array(
					'user_login' => 'my_jetpack_abilities_admin_' . wp_generate_password( 8, false ),
					'user_pass'  => 'pw',
					'user_email' => 'admin-' . wp_generate_password( 8, false ) . '@example.com',
					'role'       => 'administrator',
				)
			);
		}
		return (int) self::$admin_id;
	}

	/**
	 * Lazily create a subscriber-role user for permission denial tests.
	 */
	private function subscriber_user_id(): int {
		if ( ! self::$subscriber_id ) {
			self::$subscriber_id = wp_insert_user(
				array(
					'user_login' => 'my_jetpack_abilities_sub_' . wp_generate_password( 8, false ),
					'user_pass'  => 'pw',
					'user_email' => 'sub-' . wp_generate_password( 8, false ) . '@example.com',
					'role'       => 'subscriber',
				)
			);
		}
		return (int) self::$subscriber_id;
	}

	/**
	 * Simulate the `wp_abilities_api_categories_init` action having fired.
	 */
	private function simulate_categories_init_action() {
		global $wp_current_filter;
		$wp_current_filter[] = Registrar::CATEGORIES_INIT_ACTION;
	}

	/**
	 * Simulate the `wp_abilities_api_init` action having fired.
	 */
	private function simulate_abilities_init_action() {
		global $wp_current_filter;
		$wp_current_filter[] = Registrar::ABILITIES_INIT_ACTION;
	}

	// -------------------- Abstract getters --------------------

	/**
	 * Abilities register under the shared "jetpack" category.
	 */
	public function test_category_slug_is_jetpack() {
		$this->assertSame( 'jetpack', My_Jetpack_Abilities::get_category_slug() );
	}

	/**
	 * Category definition has the two required fields.
	 */
	public function test_category_definition_has_label_and_description() {
		$def = My_Jetpack_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotEmpty( $def['label'] );
		$this->assertNotEmpty( $def['description'] );
	}

	/**
	 * The ability is declared and namespaced under jetpack-my-jetpack/.
	 */
	public function test_abilities_map_is_namespaced_and_complete() {
		$abilities = My_Jetpack_Abilities::get_abilities();
		$this->assertCount( 2, $abilities );
		$this->assertArrayHasKey( 'jetpack-my-jetpack/list-products', $abilities );
		$this->assertArrayHasKey( 'jetpack-my-jetpack/list-plans', $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-my-jetpack/', $slug );
		}
	}

	/**
	 * No spec sets `category` explicitly — Registrar auto-injects it.
	 */
	public function test_no_spec_sets_category_explicitly() {
		foreach ( My_Jetpack_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	/**
	 * Every spec is annotated as read-only and idempotent.
	 */
	public function test_all_abilities_are_readonly_and_idempotent() {
		foreach ( My_Jetpack_Abilities::get_abilities() as $slug => $spec ) {
			$annotations = $spec['meta']['annotations'];
			$this->assertTrue( $annotations['readonly'], "{$slug} should be readonly." );
			$this->assertFalse( $annotations['destructive'], "{$slug} should not be destructive." );
			$this->assertTrue( $annotations['idempotent'], "{$slug} should be idempotent." );
		}
	}

	// -------------------- Registrar wiring --------------------

	/**
	 * The gate filter defaults false; calling init() must register nothing.
	 */
	public function test_init_registers_nothing_when_gate_filter_is_false() {
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		My_Jetpack_Abilities::init();

		$this->assertFalse(
			has_action(
				Registrar::CATEGORIES_INIT_ACTION,
				array( My_Jetpack_Abilities::class, 'register_category' )
			),
			'Categories hook must not be added when gate is false.'
		);
		$this->assertFalse(
			has_action(
				Registrar::ABILITIES_INIT_ACTION,
				array( My_Jetpack_Abilities::class, 'register_abilities' )
			),
			'Abilities hook must not be added when gate is false.'
		);
	}

	/**
	 * With the gate open and neither action fired, init() hooks both lifecycle actions.
	 */
	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		My_Jetpack_Abilities::init();

		$this->assertNotFalse(
			has_action(
				Registrar::CATEGORIES_INIT_ACTION,
				array( My_Jetpack_Abilities::class, 'register_category' )
			)
		);
		$this->assertNotFalse(
			has_action(
				Registrar::ABILITIES_INIT_ACTION,
				array( My_Jetpack_Abilities::class, 'register_abilities' )
			)
		);
	}

	/**
	 * Verifies register_abilities() registers every ability under our category slug,
	 * and that Registrar auto-injects the category on specs that omit it.
	 */
	public function test_register_abilities_registers_every_slug_with_category_injected() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		$this->simulate_categories_init_action();
		My_Jetpack_Abilities::register_category();
		$this->simulate_abilities_init_action();
		My_Jetpack_Abilities::register_abilities();

		$registered_slugs = array_map(
			static function ( $ability ) {
				return $ability->get_name();
			},
			wp_get_abilities()
		);
		foreach ( array_keys( My_Jetpack_Abilities::get_abilities() ) as $slug ) {
			$this->assertContains(
				$slug,
				$registered_slugs,
				"Ability {$slug} must be registered."
			);
		}
	}

	/**
	 * The per-ability allow-list filter is consulted; returning false skips the ability.
	 */
	public function test_per_ability_allow_list_filter_is_respected() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				if ( 'ability' === $type && 'jetpack-my-jetpack/list-products' === $slug ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->simulate_categories_init_action();
		My_Jetpack_Abilities::register_category();
		$this->simulate_abilities_init_action();
		My_Jetpack_Abilities::register_abilities();

		// Compare against the full registry rather than calling wp_get_ability()
		// per slug — the latter emits a `_doing_it_wrong` notice for missing
		// slugs, which the test environment converts into a failure.
		$registered_slugs = array_map(
			static function ( $ability ) {
				return $ability->get_name();
			},
			wp_get_abilities()
		);
		$this->assertNotContains(
			'jetpack-my-jetpack/list-products',
			$registered_slugs,
			'list-products should be filtered out when the allow-list filter returns false.'
		);
	}

	// -------------------- Permission callbacks --------------------

	/**
	 * Admins (who have jetpack_admin_page) pass the read gate.
	 */
	public function test_can_view_my_jetpack_allows_admin() {
		wp_set_current_user( $this->admin_user_id() );
		$this->assertTrue( My_Jetpack_Abilities::can_view_my_jetpack() );
	}

	/**
	 * Subscribers do not pass the gate.
	 */
	public function test_can_view_my_jetpack_denies_subscriber() {
		wp_set_current_user( $this->subscriber_user_id() );
		$this->assertFalse( My_Jetpack_Abilities::can_view_my_jetpack() );
	}

	/**
	 * Anonymous (no current user) does not pass the gate.
	 */
	public function test_can_view_my_jetpack_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( My_Jetpack_Abilities::can_view_my_jetpack() );
	}

	// -------------------- Execute: list-products --------------------

	/**
	 * Unfiltered list returns one entry per registered product slug, with the
	 * documented shape.
	 */
	public function test_list_products_returns_all_products_with_expected_shape() {
		$result = My_Jetpack_Abilities::list_products();

		$this->assertIsArray( $result );
		$this->assertSameSize(
			Products::get_products_slugs(),
			$result,
			'list-products should return one entry per registered product slug.'
		);

		$first = $result[0];
		$this->assertSame(
			array( 'slug', 'name', 'active', 'available', 'status', 'plan_class' ),
			array_keys( $first ),
			'Entry keys must match the documented shape.'
		);
		$this->assertIsString( $first['slug'] );
		$this->assertIsString( $first['name'] );
		$this->assertIsBool( $first['active'] );
		$this->assertIsBool( $first['available'] );
		$this->assertIsString( $first['status'] );
		$this->assertContains( $first['plan_class'], array( 'bundle', 'feature', 'product' ) );
	}

	/**
	 * Filter by an existing slug returns exactly one entry, with the same shape.
	 */
	public function test_list_products_with_known_slug_returns_single_entry() {
		$slugs = Products::get_products_slugs();
		$this->assertNotEmpty( $slugs, 'Test fixture: at least one product slug must be registered.' );

		$slug   = $slugs[0];
		$result = My_Jetpack_Abilities::list_products( array( 'slug' => $slug ) );

		$this->assertCount( 1, $result );
		$this->assertSame( $slug, $result[0]['slug'] );
		$this->assertArrayHasKey( 'plan_class', $result[0] );
	}

	/**
	 * Unknown slug returns an empty array (not WP_Error). The agent treats
	 * the response shape uniformly across filtered and unfiltered calls.
	 */
	public function test_list_products_with_unknown_slug_returns_empty_array() {
		$result = My_Jetpack_Abilities::list_products( array( 'slug' => 'does-not-exist-ever' ) );
		$this->assertSame( array(), $result );
	}

	/**
	 * Empty-string slug behaves the same as the unfiltered call — returns all
	 * products. (This guards against an over-eager filter that would treat ''
	 * as "no matches".)
	 */
	public function test_list_products_with_empty_string_slug_returns_full_list() {
		$result = My_Jetpack_Abilities::list_products( array( 'slug' => '' ) );
		$this->assertSameSize( Products::get_products_slugs(), $result );
	}

	// -------------------- list-plans --------------------

	/**
	 * The list-plans ability returns only the bundle plans (Security, Growth,
	 * Complete), never individual products or legacy plans, with the
	 * documented shape.
	 */
	public function test_list_plans_returns_only_current_bundles() {
		My_Jetpack_Abilities_List_Plans_Stub::reset();
		$result = My_Jetpack_Abilities_List_Plans_Stub::list_plans();

		$this->assertIsArray( $result );
		$slugs = array_column( $result, 'slug' );

		// Exactly the three current bundles, sourced from the registry.
		sort( $slugs );
		$this->assertSame(
			array( 'jetpack_complete', 'jetpack_growth_yearly', 'jetpack_security_t1_yearly' ),
			$slugs
		);

		// No legacy plans.
		$this->assertNotContains( 'jetpack_business', $slugs );
		$this->assertNotContains( 'jetpack_premium', $slugs );
		$this->assertNotContains( 'jetpack_personal', $slugs );
		$this->assertNotContains( 'jetpack_security_daily', $slugs );

		$first = $result[0];
		foreach ( array( 'slug', 'name', 'price', 'currency', 'term', 'features' ) as $key ) {
			$this->assertArrayHasKey( $key, $first );
		}
		$this->assertArrayNotHasKey( 'upgrade_url', $first );
		$this->assertIsArray( $first['features'] );
		$this->assertSame( 49.0, $first['price'] );
		$this->assertSame( 'USD', $first['currency'] );
		$this->assertSame( 'year', $first['term'] );
	}

	/**
	 * Pricing seam failures degrade gracefully: the plan is still listed with
	 * null price fields rather than dropped or fatal.
	 */
	public function test_list_plans_tolerates_missing_pricing() {
		My_Jetpack_Abilities_List_Plans_Stub::$pricing = array();
		$result                                        = My_Jetpack_Abilities_List_Plans_Stub::list_plans();
		My_Jetpack_Abilities_List_Plans_Stub::reset();

		$this->assertNotEmpty( $result );
		foreach ( $result as $plan ) {
			$this->assertNull( $plan['price'] );
			$this->assertNull( $plan['currency'] );
			$this->assertNull( $plan['term'] );
			$this->assertNotSame( '', $plan['slug'] );
		}
	}
}
