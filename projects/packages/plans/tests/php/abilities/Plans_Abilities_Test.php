<?php
/**
 * Unit tests for Jetpack Plans Abilities.
 *
 * @package automattic/jetpack-plans
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Plans\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\TestCase;
use Plans_Abilities_Test_Stub;

require_once __DIR__ . '/class-plans-abilities-test-stub.php';

/**
 * Tests for the Plans_Abilities Registrar subclass.
 */
class Plans_Abilities_Test extends TestCase {

	/**
	 * Administrator user id (manage_options capable).
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user id (no manage_options).
	 *
	 * @var int
	 */
	private $subscriber_id;

	public function setUp(): void {
		parent::setUp();

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'plans_abilities_admin_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'admin_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'plans_abilities_sub_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'sub_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'subscriber',
			)
		);

		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Other plans tests (Jetpack_Plan_Test) leave `jetpack_active_plan` set
		// in option storage; clear it so tests that probe the default plan see
		// the expected free baseline.
		delete_option( 'jetpack_active_plan' );

		Plans_Abilities_Test_Stub::reset();
	}

	public function tearDown(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		wp_set_current_user( 0 );

		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Plans_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Plans_Abilities::class, 'register_abilities' ) );

		if ( function_exists( 'wp_unregister_ability' ) && function_exists( 'wp_has_ability' ) ) {
			foreach ( array_keys( Plans_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' ) && function_exists( 'wp_has_ability_category' ) ) {
			if ( wp_has_ability_category( Plans_Abilities::get_category_slug() ) ) {
				wp_unregister_ability_category( Plans_Abilities::get_category_slug() );
			}
		}

		delete_option( 'jetpack_active_plan' );

		parent::tearDown();
	}

	/**
	 * Drive the Registrar lifecycle so wp_register_ability(_category) calls run
	 * with the right `doing_action()` context. We sidestep `do_action()` to avoid
	 * re-firing core's own ability-registration hooks (which would double-register
	 * "core/get-site-info" et al. and surface as `_doing_it_wrong` notices).
	 */
	private function fire_abilities_lifecycle(): void {
		global $wp_current_filter;
		$wp_current_filter[] = Registrar::CATEGORIES_INIT_ACTION;
		Plans_Abilities::register_category();
		array_pop( $wp_current_filter );

		$wp_current_filter[] = Registrar::ABILITIES_INIT_ACTION;
		Plans_Abilities::register_abilities();
		array_pop( $wp_current_filter );
	}

	// -------------------- Abstract getters --------------------

	/**
	 * Abilities register under the shared "jetpack" category.
	 */
	public function test_category_slug_is_jetpack() {
		$this->assertSame( 'jetpack', Plans_Abilities::get_category_slug() );
	}

	/**
	 * Category definition has the two required keys.
	 */
	public function test_category_definition_has_label_and_description() {
		$def = Plans_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertIsString( $def['label'] );
		$this->assertIsString( $def['description'] );
	}

	/**
	 * Every ability slug is namespaced under `jetpack-plans/`.
	 */
	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = Plans_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-plans/', $slug );
		}
	}

	/**
	 * The package ships exactly one ability: get-current-plan. Listing the
	 * plans the site could move to lives in the My Jetpack package now.
	 */
	public function test_expected_ability_slugs_are_present() {
		$abilities = Plans_Abilities::get_abilities();
		$this->assertSame( array( 'jetpack-plans/get-current-plan' ), array_keys( $abilities ) );
		$this->assertArrayNotHasKey( 'jetpack-plans/list-plans', $abilities );
		$this->assertArrayNotHasKey( 'jetpack-plans/get-purchase-url', $abilities );
	}

	// -------------------- Registrar wiring --------------------

	/**
	 * Default-false rollout filter must not register anything.
	 */
	public function test_init_registers_nothing_when_rollout_filter_default_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Snapshot the pre-init hook state so this assertion isolates `init()`'s
		// behavior from any hooks left dangling by an earlier test in the run.
		$category_hooked_before  = has_action( Registrar::CATEGORIES_INIT_ACTION, array( Plans_Abilities::class, 'register_category' ) );
		$abilities_hooked_before = has_action( Registrar::ABILITIES_INIT_ACTION, array( Plans_Abilities::class, 'register_abilities' ) );

		Plans_Abilities::init();

		$this->assertSame(
			$category_hooked_before,
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Plans_Abilities::class, 'register_category' ) ),
			'Default-false rollout filter must not change category-registration hooks.'
		);
		$this->assertSame(
			$abilities_hooked_before,
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Plans_Abilities::class, 'register_abilities' ) ),
			'Default-false rollout filter must not change abilities-registration hooks.'
		);
	}

	/**
	 * When the rollout filter is enabled and the lifecycle hasn't fired yet,
	 * init() hooks both lifecycle actions.
	 */
	public function test_init_hooks_lifecycle_when_filter_enabled() {
		// Only the hooked-but-not-yet-fired path is meaningful here. If a prior
		// test in this run already fired the lifecycle actions, init() registers
		// directly instead of hooking, and the direct-register path is covered
		// by `test_per_ability_should_register_filter_can_skip_an_ability` and
		// `test_category_auto_injected_when_spec_omits_it`, both of which drive
		// `register_*` inside a simulated action context.
		if ( did_action( Registrar::CATEGORIES_INIT_ACTION ) > 0 || did_action( Registrar::ABILITIES_INIT_ACTION ) > 0 ) {
			$this->markTestSkipped( 'Lifecycle actions already fired in this PHPUnit run; the hooked path is only observable on the first run.' );
		}

		Plans_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Plans_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Plans_Abilities::class, 'register_abilities' ) )
		);
	}

	/**
	 * The per-ability registration filter can deny-list an ability by slug.
	 */
	public function test_per_ability_should_register_filter_can_skip_an_ability() {
		if ( ! function_exists( 'wp_has_ability' ) ) {
			$this->markTestSkipped( 'Abilities API query functions not available' );
			return;
		}
		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				if ( 'ability' === $type && 'jetpack-plans/get-current-plan' === $slug ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->fire_abilities_lifecycle();

		$this->assertFalse( wp_has_ability( 'jetpack-plans/get-current-plan' ) );
	}

	/**
	 * `category` is auto-injected on each spec from `get_category_slug()`.
	 */
	public function test_category_auto_injected_when_spec_omits_it() {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API query functions not available' );
			return;
		}
		$this->fire_abilities_lifecycle();

		$ability = wp_get_ability( 'jetpack-plans/get-current-plan' );
		$this->assertNotNull( $ability );
		$category = method_exists( $ability, 'get_category' ) ? $ability->get_category() : null;
		if ( is_string( $category ) ) {
			$this->assertSame( Plans_Abilities::get_category_slug(), $category );
		}
	}

	// -------------------- Permissions --------------------

	/**
	 * Administrators (manage_options) can view plans.
	 */
	public function test_permission_admin_can_view_plans() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Plans_Abilities::can_view_plans() );
	}

	/**
	 * Subscribers (no manage_options) cannot view plans.
	 */
	public function test_permission_subscriber_denied() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Plans_Abilities::can_view_plans() );
	}

	/**
	 * Anonymous callers cannot view plans.
	 */
	public function test_permission_anonymous_denied() {
		wp_set_current_user( 0 );
		$this->assertFalse( Plans_Abilities::can_view_plans() );
	}

	// -------------------- get-current-plan --------------------

	/**
	 * The get-current-plan ability returns the documented shape and free-tier defaults.
	 */
	public function test_get_current_plan_returns_expected_shape_for_free_default() {
		// Seed the free default explicitly rather than relying on Current_Plan's
		// option-backed lookup, which has a process-wide static cache that
		// neighboring tests in `Jetpack_Plan_Test` can prime.
		Plans_Abilities_Test_Stub::reset(
			null,
			'example.test',
			array(
				'product_slug'       => 'jetpack_free',
				'product_name_short' => 'Free',
				'class'              => 'free',
				'features'           => array(
					'active'    => array(),
					'available' => array(),
				),
				'supports'           => array(),
			)
		);

		$result = Plans_Abilities_Test_Stub::get_current_plan();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'slug', $result );
		$this->assertArrayHasKey( 'class', $result );
		$this->assertArrayHasKey( 'features', $result );
		$this->assertArrayHasKey( 'supports', $result );
		$this->assertArrayHasKey( 'expires_at', $result );
		$this->assertSame( 'jetpack_free', $result['slug'] );
		$this->assertSame( 'free', $result['class'] );
		$this->assertNull( $result['expires_at'] );
		$this->assertIsArray( $result['features'] );
		$this->assertIsArray( $result['supports'] );
	}

	/**
	 * The get-current-plan ability reflects a seeded paid plan.
	 */
	public function test_get_current_plan_reflects_seeded_plan() {
		Plans_Abilities_Test_Stub::reset(
			null,
			'example.test',
			array(
				'product_id'         => 2005,
				'product_slug'       => 'jetpack_personal',
				'product_name_short' => 'Personal',
				'class'              => 'personal',
				'expiry'             => '2030-01-01T00:00:00+00:00',
				'features'           => array(
					'active'    => array( 'akismet', 'support' ),
					'available' => array(),
				),
				'supports'           => array( 'akismet', 'payments' ),
			)
		);

		$result = Plans_Abilities_Test_Stub::get_current_plan();

		$this->assertSame( 'jetpack_personal', $result['slug'] );
		$this->assertSame( 'Personal', $result['name'] );
		$this->assertSame( 2005, $result['product_id'] );
		$this->assertSame( 'personal', $result['class'] );
		$this->assertSame( '2030-01-01T00:00:00+00:00', $result['expires_at'] );
		$this->assertContains( 'akismet', $result['features'] );
		$this->assertContains( 'payments', $result['supports'] );
	}
}
