# Test templates for Registrar subclasses

Two templates — one per host-project type. Each template covers the same five assertion groups:

1. **Registrar wiring** — gate filter defaulting false, hook wiring, late-load, per-ability allow-list, category auto-injection. This is the differentiating value-add; a hand-rolled ability class without these assertions is incomplete.
2. **Module-activation gating (Case A only)** — for module-backed abilities, the ability must not register when the backing module is inactive. Because Case A wires `::init()` from inside `modules/<slug>.php` (which Jetpack only includes for active modules), the assertion is: when `Jetpack::is_module_active()` returns false, `<Name>_Abilities::init()` either never runs OR, if defensively called, registers nothing. See `references/module-colocation.md`.
2. **Abstract getters** — the three static methods return the expected shapes.
3. **Permission callbacks** — allowed user returns true; denied user returns false; unauth returns false.
4. **Execute callbacks** — happy path for each ability.
5. **Schema edge cases** — missing required, empty-string ID, wrong type.

Canonical references:

- Package-context Brain Monkey patterns: `projects/packages/wp-abilities/tests/php/RegistrarTest.php`
- Plugin-context WP_UnitTestCase patterns: look for `_Test.php` files under `projects/plugins/jetpack/tests/php/src/`
- Real-world Abilities test (DB-less): `projects/packages/forms/tests/php/abilities/Forms_Abilities_Test.php`

## Plugin context (`projects/plugins/jetpack/tests/php/src/<Name>_Abilities_Test.php`)

Uses `WP_UnitTestCase` with full WP test environment available. Can create users via `wp_insert_user()` and call `wp_set_current_user()` to exercise permission callbacks end-to-end.

```php
<?php
/**
 * Tests for the <Name>_Abilities Registrar subclass.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Abilities\<Name>_Abilities;
use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Plugin\Abilities\<Name>_Abilities
 */
#[CoversClass( <Name>_Abilities::class )]
class <Name>_Abilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/** @var int */
	private static $admin_id;

	/** @var int */
	private static $subscriber_id;

	public function set_up() {
		parent::set_up();

		self::$admin_id = wp_insert_user(
			array(
				'user_login' => 'ship_ability_admin_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		self::$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'ship_ability_sub_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open for most test cases.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	// -------------------- Abstract getters --------------------

	public function test_category_slug_is_plugin_scoped() {
		$this->assertSame( 'jetpack-<name>', <Name>_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = <Name>_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = <Name>_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-<name>/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( <Name>_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	// -------------------- Registrar wiring --------------------

	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		<Name>_Abilities::init();

		$this->assertFalse(
			has_action( 'wp_abilities_api_categories_init', array( <Name>_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( 'wp_abilities_api_init', array( <Name>_Abilities::class, 'register_abilities' ) )
		);

		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		<Name>_Abilities::init();

		$this->assertNotFalse(
			has_action( 'wp_abilities_api_categories_init', array( <Name>_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( 'wp_abilities_api_init', array( <Name>_Abilities::class, 'register_abilities' ) )
		);
	}

	// -------------------- Module-activation gating (Case A only) --------------------
	// Drop this block if the ability is Case B (package) or Case C (plugin-core).
	// For Case A, the ability class lives in modules/<slug>/abilities/ and is wired from
	// modules/<slug>.php — so the registrar only loads when the module is active.

	public function test_ability_class_is_colocated_with_module() {
		// The file must live inside the module, not in the plugin-global src/abilities/ tree.
		$reflector = new \ReflectionClass( <Name>_Abilities::class );
		$path      = $reflector->getFileName();
		$this->assertStringContainsString(
			'/modules/<slug>/',
			$path,
			'Module-backed abilities must live inside their module directory, not in src/abilities/. ' .
				'See .agents/skills/ship-wp-ability/references/module-colocation.md.'
		);
		$this->assertStringNotContainsString(
			'/src/abilities/',
			$path,
			'Found a module-backed ability in the plugin-global src/abilities/ tree. Move it into modules/<slug>/abilities/.'
		);
	}

	public function test_not_wired_from_class_jetpack_php() {
		// Scan class.jetpack.php — a module-backed registrar must not be init'd from the plugin bootstrap.
		$bootstrap = file_get_contents( JETPACK__PLUGIN_DIR . 'class.jetpack.php' );
		$this->assertStringNotContainsString(
			'<Name>_Abilities::init()',
			$bootstrap,
			'class.jetpack.php must not init a module-backed ability. Wire from modules/<slug>.php instead.'
		);
	}

	public function test_registers_nothing_when_module_inactive() {
		// Simulate the module being deactivated. When Jetpack::is_module_active( '<slug>' ) is false,
		// Jetpack does not include modules/<slug>.php — so Registrar::init() is never called and
		// nothing registers. We assert the user-visible outcome: no ability slugs under our namespace.
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		// Force-deactivate the module for the duration of the test.
		$previously_active = Jetpack::is_module_active( '<slug>' );
		if ( $previously_active ) {
			Jetpack::deactivate_module( '<slug>' );
		}

		// Do NOT call <Name>_Abilities::init() here — we're simulating Jetpack not loading the module file.
		// Reset any already-registered abilities from this class (prior test runs may have registered them).
		foreach ( array_keys( <Name>_Abilities::get_abilities() ) as $slug ) {
			if ( null !== wp_get_ability( $slug ) && function_exists( 'wp_deregister_ability' ) ) {
				wp_deregister_ability( $slug );
			}
		}

		foreach ( array_keys( <Name>_Abilities::get_abilities() ) as $slug ) {
			$this->assertNull(
				wp_get_ability( $slug ),
				"Ability {$slug} must not be registered when the <slug> module is inactive."
			);
		}

		if ( $previously_active ) {
			Jetpack::activate_module( '<slug>', false, false );
		}
	}

	public function test_register_abilities_registers_every_slug() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		<Name>_Abilities::register_category();
		<Name>_Abilities::register_abilities();

		$registered = array_map(
			static fn ( $a ) => $a->get_name(),
			array_filter(
				wp_get_abilities(),
				static fn ( $a ) => str_starts_with( $a->get_name(), 'jetpack-<name>/' )
			)
		);

		foreach ( array_keys( <Name>_Abilities::get_abilities() ) as $slug ) {
			$this->assertContains( $slug, $registered, "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				if ( 'ability' === $type ) {
					// Deny every ability.
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		<Name>_Abilities::register_category();
		<Name>_Abilities::register_abilities();

		foreach ( array_keys( <Name>_Abilities::get_abilities() ) as $slug ) {
			$this->assertNull( wp_get_ability( $slug ), "Ability {$slug} must be filtered out." );
		}
	}

	// -------------------- Permission callbacks --------------------

	public function test_can_view_allows_admin() {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( <Name>_Abilities::can_view_<objects>() );
	}

	public function test_can_view_denies_subscriber() {
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( <Name>_Abilities::can_view_<objects>() );
	}

	public function test_can_view_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( <Name>_Abilities::can_view_<objects>() );
	}

	public function test_can_manage_denies_subscriber() {
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( <Name>_Abilities::can_manage_<objects>() );
	}

	// -------------------- Execute callbacks --------------------

	public function test_get_<objects>_returns_array() {
		wp_set_current_user( self::$admin_id );
		$result = <Name>_Abilities::get_<objects>( array() );
		$this->assertIsArray( $result );
	}

	public function test_get_<objects>_with_unknown_id_returns_empty_array() {
		// Consolidated read: unknown id is a no-match, not an error — agents treat the shape uniformly.
		wp_set_current_user( self::$admin_id );
		$result = <Name>_Abilities::get_<objects>( array( 'id' => 'does-not-exist-ever' ) );
		$this->assertSame( array(), $result );
	}

	public function test_set_<object>_status_rejects_missing_id() {
		wp_set_current_user( self::$admin_id );
		$result = <Name>_Abilities::set_<object>_status( array( 'status' => 'active' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_<name>_missing_id', $result->get_error_code() );
	}

	public function test_set_<object>_status_rejects_empty_string_id() {
		wp_set_current_user( self::$admin_id );
		$result = <Name>_Abilities::set_<object>_status( array( 'id' => '', 'status' => 'active' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_set_<object>_status_accepts_zero_string_id() {
		// Regression guard: empty('0') is true, but '0' is a legal ID.
		wp_set_current_user( self::$admin_id );
		$result = <Name>_Abilities::set_<object>_status( array( 'id' => '0', 'status' => 'active' ) );
		$this->assertNotInstanceOf( \WP_Error::class, $result );
	}

	public function test_set_<object>_status_is_idempotent_for_current_state() {
		// Declarative writes must no-op when desired == current, returning changed=false.
		wp_set_current_user( self::$admin_id );
		$first  = <Name>_Abilities::set_<object>_status( array( 'id' => '<known-id>', 'status' => 'active' ) );
		$second = <Name>_Abilities::set_<object>_status( array( 'id' => '<known-id>', 'status' => 'active' ) );
		$this->assertIsArray( $second );
		$this->assertFalse( $second['changed'], 'Second call with the same desired state must be a no-op.' );
	}
}
```

## Package context (`projects/packages/<pkg>/tests/php/abilities/<Name>AbilitiesTest.php`)

Uses Brain Monkey + Mockery. No WP test env; WP function calls are mocked. Base class is `PHPUnit\Framework\TestCase`. Mirrors `projects/packages/wp-abilities/tests/php/RegistrarTest.php`.

```php
<?php
/**
 * Unit tests for the <Name>_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-<pkg>
 */

namespace Automattic\Jetpack\<Pkg>\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use Brain\Monkey;
use Brain\Monkey\Actions;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\<Pkg>\Abilities\<Name>_Abilities
 */
#[CoversClass( <Name>_Abilities::class )]
class <Name>AbilitiesTest extends TestCase {
	use \Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/** Enable the top-level gate. */
	private function enable_abilities(): void {
		Filters\expectApplied( 'jetpack_wp_abilities_enabled' )->andReturn( true );
	}

	// -------------------- Abstract getters --------------------

	public function test_category_slug_is_package_scoped(): void {
		$this->assertSame( 'jetpack-<pkg>', <Name>_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = <Name>_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = <Name>_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-<pkg>/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly(): void {
		foreach ( <Name>_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category."
			);
		}
	}

	// -------------------- Registrar wiring --------------------

	public function test_init_is_disabled_by_default(): void {
		Filters\expectApplied( 'jetpack_wp_abilities_enabled' )
			->once()
			->with( false )
			->andReturn( false );

		Functions\expect( 'did_action' )->never();
		Actions\expectAdded( Registrar::CATEGORIES_INIT_ACTION )->never();
		Actions\expectAdded( Registrar::ABILITIES_INIT_ACTION )->never();

		<Name>_Abilities::init();
	}

	public function test_init_adds_hooks_when_neither_action_fired(): void {
		$this->enable_abilities();
		Functions\when( 'did_action' )->justReturn( 0 );

		Actions\expectAdded( Registrar::CATEGORIES_INIT_ACTION )
			->once()
			->with( array( <Name>_Abilities::class, 'register_category' ) );
		Actions\expectAdded( Registrar::ABILITIES_INIT_ACTION )
			->once()
			->with( array( <Name>_Abilities::class, 'register_abilities' ) );

		Functions\expect( 'wp_register_ability_category' )->never();
		Functions\expect( 'wp_register_ability' )->never();

		<Name>_Abilities::init();
	}

	public function test_init_registers_directly_when_both_actions_already_fired(): void {
		$this->enable_abilities();
		Functions\when( 'did_action' )->justReturn( 1 );

		$ability_count = count( <Name>_Abilities::get_abilities() );

		Filters\expectApplied( 'jetpack_wp_abilities_should_register' )
			->atLeast()->times( 1 )
			->andReturn( true );

		Functions\expect( 'wp_register_ability_category' )->once();
		Functions\expect( 'wp_register_ability' )->times( $ability_count );

		Actions\expectAdded( Registrar::CATEGORIES_INIT_ACTION )->never();
		Actions\expectAdded( Registrar::ABILITIES_INIT_ACTION )->never();

		<Name>_Abilities::init();
	}

	public function test_register_abilities_injects_category_on_specs_that_omit_it(): void {
		Functions\expect( 'wp_register_ability' )
			->atLeast()->times( 1 )
			->with(
				\Mockery::type( 'string' ),
				\Mockery::on(
					static function ( $spec ) {
						return is_array( $spec )
							&& isset( $spec['category'] )
							&& 'jetpack-<pkg>' === $spec['category'];
					}
				)
			);

		Filters\expectApplied( 'jetpack_wp_abilities_should_register' )
			->atLeast()->times( 1 )
			->andReturn( true );

		<Name>_Abilities::register_abilities();
	}

	public function test_register_abilities_respects_per_ability_allow_list(): void {
		Filters\expectApplied( 'jetpack_wp_abilities_should_register' )
			->andReturnUsing(
				static function ( $enabled, $type, $slug ) {
					return 'ability' !== $type; // Deny every ability.
				}
			);

		Functions\expect( 'wp_register_ability' )->never();

		<Name>_Abilities::register_abilities();
	}

	// -------------------- Permission callbacks --------------------

	public function test_can_view_allows_capable_user(): void {
		Functions\expect( 'current_user_can' )
			->with( 'jetpack_admin_page' )
			->andReturn( true );

		$this->assertTrue( <Name>_Abilities::can_view_<objects>() );
	}

	public function test_can_view_denies_incapable_user(): void {
		Functions\expect( 'current_user_can' )
			->with( 'jetpack_admin_page' )
			->andReturn( false );

		$this->assertFalse( <Name>_Abilities::can_view_<objects>() );
	}

	// -------------------- Execute callbacks --------------------

	public function test_get_<objects>_returns_array(): void {
		$result = <Name>_Abilities::get_<objects>( array() );
		$this->assertIsArray( $result );
	}

	public function test_get_<objects>_with_unknown_id_returns_empty_array(): void {
		// Consolidated read: unknown id is a no-match, not an error.
		$result = <Name>_Abilities::get_<objects>( array( 'id' => 'does-not-exist-ever' ) );
		$this->assertSame( array(), $result );
	}

	public function test_set_<object>_status_rejects_missing_id(): void {
		$result = <Name>_Abilities::set_<object>_status( array( 'status' => 'active' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_<pkg>_missing_id', $result->get_error_code() );
	}

	public function test_set_<object>_status_accepts_zero_string_id(): void {
		// Regression guard: empty('0') is true, but '0' is a legal ID.
		$result = <Name>_Abilities::set_<object>_status( array( 'id' => '0', 'status' => 'active' ) );
		$this->assertNotInstanceOf( \WP_Error::class, $result );
	}

	public function test_set_<object>_status_is_idempotent_for_current_state(): void {
		// Declarative writes must no-op when desired == current.
		$first  = <Name>_Abilities::set_<object>_status( array( 'id' => '<known-id>', 'status' => 'active' ) );
		$second = <Name>_Abilities::set_<object>_status( array( 'id' => '<known-id>', 'status' => 'active' ) );
		$this->assertIsArray( $second );
		$this->assertFalse( $second['changed'], 'Second call with the same desired state must be a no-op.' );
	}
}
```

## Notes

- **Anti-pattern: `setExpectedIncorrectUsage()` as a "whitelist" for re-fired
  Abilities API actions.** When tests drive registration by re-firing
  `wp_abilities_api_categories_init` / `wp_abilities_api_init` directly with
  `do_action()`, **do not** add `setExpectedIncorrectUsage(
  'WP_Ability_Categories_Registry::register' )` /
  `setExpectedIncorrectUsage( 'WP_Abilities_Registry::register' )` as a
  defensive "whitelist" against expected "already registered" notices.
  `setExpectedIncorrectUsage` is a *mandatory* assertion in `WP_UnitTestCase`
  — the test fails if the named notice does **not** fire. In CI's test
  environment the core listeners (site category + `get-site-info` ability)
  often are not loaded, so the notice never fires and every test using the
  helper goes red with "Failed to assert that ... triggered an incorrect
  usage notice." This bit PR #48335 (Related Posts) across all PHP versions.
  Mirror the Monitor pattern: call `do_action()` twice and assert on the
  registry afterward — no incorrect-usage expectations needed.
- Brain Monkey's `Functions\expect()` vs `Functions\when()`: use `expect()` for behavior that must happen (call counts); use `when()` for stubs that answer whenever called.
- The Mockery `\Mockery::on(...)` matcher lets you assert on the full spec shape — use it to confirm category injection happened, annotations are present, etc.
- When testing a `WP_Error` return from a package-context test, make sure `\WP_Error` is autoloaded. The `jetpack-wp-abilities` package already depends on `yoast/phpunit-polyfills` and `brain/monkey`; if the package test bootstrap doesn't pull in a WP test-utility shim that declares `WP_Error`, either add one or exercise the error case in the plugin-context test suite instead.
- `#[RunInSeparateProcess]` + `#[PreserveGlobalState(false)]` is the pattern for guarding WP < 6.9 compat tests (no Abilities API declared). See `RegistrarTest::test_register_category_returns_early_when_api_unavailable()`.
