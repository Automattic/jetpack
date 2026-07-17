<?php
/**
 * Tests for Automattic\Jetpack\WP_Abilities\Registrar.
 *
 * @package automattic/jetpack-wp-abilities
 */

namespace Automattic\Jetpack\WP_Abilities;

use Brain\Monkey;
use Brain\Monkey\Actions;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound

/**
 * Unit tests for the abstract Registrar base class.
 *
 * @covers \Automattic\Jetpack\WP_Abilities\Registrar
 */
#[CoversClass( Registrar::class )]
class RegistrarTest extends TestCase {
	use \Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;

	/**
	 * Set up Brain Monkey.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Tear down Brain Monkey.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Enable the top-level gate filter for tests that exercise init().
	 */
	private function enable_abilities(): void {
		Filters\expectApplied( 'jetpack_wp_abilities_enabled' )->andReturn( true );
	}

	/**
	 * The gate filter defaults to false: init() must register nothing.
	 */
	public function test_init_is_disabled_by_default(): void {
		Filters\expectApplied( 'jetpack_wp_abilities_enabled' )
			->once()
			->with( false )
			->andReturn( false );

		Functions\expect( 'did_action' )->never();
		Actions\expectAdded( Registrar::CATEGORIES_INIT_ACTION )->never();
		Actions\expectAdded( Registrar::ABILITIES_INIT_ACTION )->never();
		Functions\expect( 'wp_register_ability_category' )->never();
		Functions\expect( 'wp_register_ability' )->never();

		TestFixtureRegistrar::init();
	}

	/**
	 * Neither lifecycle action has fired: init() hooks both, calls neither registrar.
	 */
	public function test_init_adds_hooks_when_neither_action_fired(): void {
		$this->enable_abilities();

		Functions\when( 'did_action' )->justReturn( 0 );

		Actions\expectAdded( Registrar::CATEGORIES_INIT_ACTION )
			->once()
			->with( array( TestFixtureRegistrar::class, 'register_category' ) );
		Actions\expectAdded( Registrar::ABILITIES_INIT_ACTION )
			->once()
			->with( array( TestFixtureRegistrar::class, 'register_abilities' ) );

		Functions\expect( 'wp_register_ability_category' )->never();
		Functions\expect( 'wp_register_ability' )->never();

		TestFixtureRegistrar::init();
	}

	/**
	 * Categories-init already fired: register category directly, still hook abilities.
	 */
	public function test_init_registers_category_directly_when_categories_action_already_fired(): void {
		$this->enable_abilities();

		Functions\when( 'did_action' )->alias(
			static function ( $action ) {
				return Registrar::CATEGORIES_INIT_ACTION === $action ? 1 : 0;
			}
		);

		Functions\expect( 'wp_register_ability_category' )
			->once()
			->with(
				'fixture/slug',
				array(
					'label'       => 'Fixture',
					'description' => 'A fixture category.',
				)
			);

		Actions\expectAdded( Registrar::CATEGORIES_INIT_ACTION )->never();
		Actions\expectAdded( Registrar::ABILITIES_INIT_ACTION )->once();

		TestFixtureRegistrar::init();
	}

	/**
	 * Abilities-init already fired: register abilities directly, still hook category.
	 */
	public function test_init_registers_abilities_directly_when_abilities_action_already_fired(): void {
		$this->enable_abilities();

		Functions\when( 'did_action' )->alias(
			static function ( $action ) {
				return Registrar::ABILITIES_INIT_ACTION === $action ? 1 : 0;
			}
		);

		Functions\expect( 'wp_register_ability' )->times( 2 );

		Actions\expectAdded( Registrar::CATEGORIES_INIT_ACTION )->once();
		Actions\expectAdded( Registrar::ABILITIES_INIT_ACTION )->never();

		TestFixtureRegistrar::init();
	}

	/**
	 * Both actions already fired: everything runs directly, nothing is hooked.
	 */
	public function test_init_registers_both_directly_when_both_actions_already_fired(): void {
		$this->enable_abilities();

		Functions\when( 'did_action' )->justReturn( 1 );

		Functions\expect( 'wp_register_ability_category' )->once();
		Functions\expect( 'wp_register_ability' )->times( 2 );

		Actions\expectAdded( Registrar::CATEGORIES_INIT_ACTION )->never();
		Actions\expectAdded( Registrar::ABILITIES_INIT_ACTION )->never();

		TestFixtureRegistrar::init();
	}

	/**
	 * Register_category() passes subclass slug + definition through unchanged.
	 */
	public function test_register_category_registers_with_slug_and_definition(): void {
		Functions\expect( 'wp_register_ability_category' )
			->once()
			->with(
				'fixture/slug',
				array(
					'label'       => 'Fixture',
					'description' => 'A fixture category.',
				)
			);

		TestFixtureRegistrar::register_category();
	}

	/**
	 * Register_category() no-ops when the Abilities API is not declared (WP < 6.9).
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_register_category_returns_early_when_api_unavailable(): void {
		self::assertFalse(
			function_exists( 'wp_register_ability_category' ),
			'Guard test requires the Abilities API not to be declared.'
		);

		TestFixtureRegistrar::register_category();

		$this->addToAssertionCount( 1 );
	}

	/**
	 * Each ability is registered; specs without `category` get the subclass slug injected.
	 */
	public function test_register_abilities_registers_each_with_auto_injected_category(): void {
		Functions\expect( 'wp_register_ability' )
			->once()
			->with(
				'fixture/alpha',
				\Mockery::on(
					static function ( $spec ) {
						return is_array( $spec )
							&& isset( $spec['category'] )
							&& 'fixture/slug' === $spec['category']
							&& 'Alpha' === $spec['label'];
					}
				)
			);
		Functions\expect( 'wp_register_ability' )
			->once()
			->with(
				'fixture/beta',
				\Mockery::on(
					static function ( $spec ) {
						return is_array( $spec )
							&& isset( $spec['category'] )
							&& 'fixture/slug' === $spec['category']
							&& 'Beta' === $spec['label'];
					}
				)
			);

		TestFixtureRegistrar::register_abilities();
	}

	/**
	 * A spec that sets `category` explicitly keeps the value the subclass provided.
	 */
	public function test_register_abilities_preserves_explicit_category(): void {
		Functions\expect( 'wp_register_ability' )
			->once()
			->with(
				'fixture/shared',
				\Mockery::on(
					static function ( $spec ) {
						return is_array( $spec )
							&& isset( $spec['category'] )
							&& 'other/slug' === $spec['category'];
					}
				)
			);

		TestExplicitCategoryRegistrar::register_abilities();
	}

	/**
	 * Register_abilities() no-ops when the Abilities API is not declared (WP < 6.9).
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_register_abilities_returns_early_when_api_unavailable(): void {
		self::assertFalse(
			function_exists( 'wp_register_ability' ),
			'Guard test requires the Abilities API not to be declared.'
		);

		TestFixtureRegistrar::register_abilities();

		$this->addToAssertionCount( 1 );
	}

	/**
	 * An empty abilities map makes no registration calls and does not error.
	 */
	public function test_register_abilities_handles_empty_map(): void {
		Functions\expect( 'wp_register_ability' )->never();

		TestEmptyRegistrar::register_abilities();
	}

	/**
	 * Repeated init() calls are safe: the library does not dedupe, WordPress does.
	 */
	public function test_init_is_safe_to_call_repeatedly(): void {
		$this->enable_abilities();

		Functions\when( 'did_action' )->justReturn( 0 );

		Actions\expectAdded( Registrar::CATEGORIES_INIT_ACTION )->twice();
		Actions\expectAdded( Registrar::ABILITIES_INIT_ACTION )->twice();

		TestFixtureRegistrar::init();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Deliberate: asserts repeat init() calls are safe.
		TestFixtureRegistrar::init();
	}

	/**
	 * Returning false from the should-register filter blocks category registration.
	 */
	public function test_filter_blocks_category_registration(): void {
		Filters\expectApplied( 'jetpack_wp_abilities_should_register' )
			->once()
			->with( true, 'category', 'fixture/slug' )
			->andReturn( false );

		Functions\expect( 'wp_register_ability_category' )->never();

		TestFixtureRegistrar::register_category();
	}

	/**
	 * Returning false from the should-register filter blocks ability registration.
	 */
	public function test_filter_blocks_all_abilities_when_returning_false(): void {
		Filters\expectApplied( 'jetpack_wp_abilities_should_register' )
			->andReturn( false );

		Functions\expect( 'wp_register_ability' )->never();

		TestFixtureRegistrar::register_abilities();
	}

	/**
	 * The filter fires per ability slug, so consumers can allow-list individually.
	 */
	public function test_filter_allows_per_ability_allow_list(): void {
		Filters\expectApplied( 'jetpack_wp_abilities_should_register' )
			->andReturnUsing(
				static function ( $enabled, $type, $slug ) {
					return 'ability' === $type && 'fixture/alpha' === $slug;
				}
			);

		Functions\expect( 'wp_register_ability' )
			->once()
			->with( 'fixture/alpha', \Mockery::type( 'array' ) );

		TestFixtureRegistrar::register_abilities();
	}

	/**
	 * Late static binding ensures two subclasses register with their own slugs.
	 */
	public function test_static_binding_honours_subclass(): void {
		Functions\expect( 'wp_register_ability_category' )
			->once()
			->with( 'fixture/slug', \Mockery::type( 'array' ) );
		Functions\expect( 'wp_register_ability_category' )
			->once()
			->with( 'other/slug', \Mockery::type( 'array' ) );

		TestFixtureRegistrar::register_category();
		TestExplicitCategoryRegistrar::register_category();
	}
}

class TestFixtureRegistrar extends Registrar {
	public static function get_category_slug(): string {
		return 'fixture/slug';
	}

	public static function get_category_definition(): array {
		return array(
			'label'       => 'Fixture',
			'description' => 'A fixture category.',
		);
	}

	public static function get_abilities(): array {
		return array(
			'fixture/alpha' => array(
				'label'       => 'Alpha',
				'description' => 'First fixture ability.',
			),
			'fixture/beta'  => array(
				'label'       => 'Beta',
				'description' => 'Second fixture ability.',
			),
		);
	}
}

class TestExplicitCategoryRegistrar extends Registrar {
	public static function get_category_slug(): string {
		return 'other/slug';
	}

	public static function get_category_definition(): array {
		return array(
			'label'       => 'Other',
			'description' => 'Another fixture category.',
		);
	}

	public static function get_abilities(): array {
		return array(
			'fixture/shared' => array(
				'label'       => 'Shared',
				'description' => 'Ability that names its own category.',
				'category'    => 'other/slug',
			),
		);
	}
}

class TestEmptyRegistrar extends Registrar {
	public static function get_category_slug(): string {
		return 'empty/slug';
	}

	public static function get_category_definition(): array {
		return array(
			'label'       => 'Empty',
			'description' => 'No abilities.',
		);
	}

	public static function get_abilities(): array {
		return array();
	}
}
