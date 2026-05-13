<?php
/**
 * Tests for Automattic\Jetpack\Import\Abilities\Import_Abilities.
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use Brain\Monkey;
use Brain\Monkey\Actions;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Jetpack Import abilities registrar.
 *
 * Runs with Brain Monkey so we can stub the Abilities API + WordPress
 * functions without spinning up a full WordPress test environment — the
 * import package's test bootstrap is intentionally minimal.
 *
 * Run from `projects/packages/import`:
 *
 *   composer phpunit -- --filter Import_Abilities_Test
 *
 * @covers \Automattic\Jetpack\Import\Abilities\Import_Abilities
 */
#[CoversClass( Import_Abilities::class )]
class Import_Abilities_Test extends TestCase {
	use \Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;

	/**
	 * Set up Brain Monkey.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Default stubs for the small set of WP helpers our specs and
		// callbacks touch — individual tests override these with stricter
		// expectations when they need to.
		Functions\when( '__' )->returnArg( 1 );
		Functions\when( 'esc_html__' )->returnArg( 1 );
		Functions\when( 'current_user_can' )->justReturn( true );
		Functions\when( 'get_allowed_mime_types' )->justReturn(
			array(
				'jpg|jpeg|jpe' => 'image/jpeg',
				'png'          => 'image/png',
			)
		);
	}

	/**
	 * Tear down Brain Monkey.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		// Reset the global $wpdb stub so tests don't leak state across runs.
		unset( $GLOBALS['wpdb'] );
		parent::tearDown();
	}

	/**
	 * Enable the top-level gate filter for init() tests.
	 */
	private function enable_abilities(): void {
		Filters\expectApplied( 'jetpack_wp_abilities_enabled' )->andReturn( true );
	}

	/**
	 * Stub the global $wpdb with the minimum surface the cleanup callback uses.
	 *
	 * @param array $delete_returns Map of meta table => return value from $wpdb->delete().
	 * @return \Mockery\MockInterface
	 */
	private function stub_wpdb( array $delete_returns ) {
		$wpdb              = \Mockery::mock();
		$wpdb->postmeta    = 'wp_postmeta';
		$wpdb->commentmeta = 'wp_commentmeta';
		$wpdb->termmeta    = 'wp_termmeta';
		$wpdb->posts       = 'wp_posts';

		$wpdb->shouldReceive( 'delete' )
			->with( 'wp_postmeta', array( 'meta_key' => '_jetpack_import_id' ) )
			->andReturn( $delete_returns['postmeta'] ?? 0 );
		$wpdb->shouldReceive( 'delete' )
			->with( 'wp_commentmeta', array( 'meta_key' => '_jetpack_import_id' ) )
			->andReturn( $delete_returns['commentmeta'] ?? 0 );
		$wpdb->shouldReceive( 'delete' )
			->with( 'wp_termmeta', array( 'meta_key' => '_jetpack_import_id' ) )
			->andReturn( $delete_returns['termmeta'] ?? 0 );

		$GLOBALS['wpdb'] = $wpdb;
		return $wpdb;
	}

	/**
	 * Category slug matches the convention for jetpack-* packages.
	 */
	public function test_category_slug(): void {
		self::assertSame( 'jetpack-import', Import_Abilities::get_category_slug() );
	}

	/**
	 * Category definition surfaces a label and a description.
	 */
	public function test_category_definition(): void {
		$def = Import_Abilities::get_category_definition();

		self::assertArrayHasKey( 'label', $def );
		self::assertArrayHasKey( 'description', $def );
		self::assertNotSame( '', $def['label'] );
		self::assertNotSame( '', $def['description'] );
	}

	/**
	 * The expected ability slugs are returned by get_abilities().
	 */
	public function test_get_abilities_returns_expected_slugs(): void {
		$abilities = Import_Abilities::get_abilities();

		self::assertEqualsCanonicalizing(
			array(
				'jetpack-import/get-config',
				'jetpack-import/cleanup-meta',
			),
			array_keys( $abilities )
		);
	}

	/**
	 * Every ability spec is structurally complete — the contract we promise
	 * the Abilities API.
	 */
	public function test_every_ability_spec_is_structurally_complete(): void {
		foreach ( Import_Abilities::get_abilities() as $slug => $spec ) {
			self::assertIsArray( $spec, "Spec for {$slug} must be an array." );

			foreach ( array( 'label', 'description', 'input_schema', 'output_schema', 'execute_callback', 'permission_callback', 'meta' ) as $key ) {
				self::assertArrayHasKey( $key, $spec, "Spec for {$slug} is missing `{$key}`." );
			}

			self::assertIsCallable( $spec['execute_callback'], "execute_callback for {$slug} must be callable." );
			self::assertIsCallable( $spec['permission_callback'], "permission_callback for {$slug} must be callable." );

			self::assertArrayHasKey( 'annotations', $spec['meta'], "meta.annotations missing for {$slug}." );
			foreach ( array( 'readonly', 'destructive', 'idempotent' ) as $annotation ) {
				self::assertArrayHasKey( $annotation, $spec['meta']['annotations'], "annotations.{$annotation} missing for {$slug}." );
				self::assertIsBool( $spec['meta']['annotations'][ $annotation ], "annotations.{$annotation} for {$slug} must be a boolean." );
			}

			self::assertTrue( $spec['meta']['show_in_rest'] ?? false, "show_in_rest must be true for {$slug}." );
		}
	}

	/**
	 * Annotation contract: get-config is read-only/idempotent/non-destructive
	 * and cleanup-meta is the opposite end of the spectrum (non-readonly,
	 * destructive, but idempotent — a second call returns zero counts because
	 * there is nothing left to delete).
	 */
	public function test_ability_annotations_match_intent(): void {
		$abilities = Import_Abilities::get_abilities();

		self::assertSame(
			array(
				'readonly'    => true,
				'destructive' => false,
				'idempotent'  => true,
			),
			$abilities['jetpack-import/get-config']['meta']['annotations']
		);

		self::assertSame(
			array(
				'readonly'    => false,
				'destructive' => true,
				'idempotent'  => true,
			),
			$abilities['jetpack-import/cleanup-meta']['meta']['annotations']
		);
	}

	/**
	 * Both abilities reject extra input properties — the schemas should not
	 * accept unrecognized keys silently.
	 */
	public function test_input_schemas_disallow_additional_properties(): void {
		foreach ( Import_Abilities::get_abilities() as $slug => $spec ) {
			self::assertSame(
				false,
				$spec['input_schema']['additionalProperties'] ?? null,
				"input_schema.additionalProperties must be false for {$slug}."
			);
		}
	}

	/**
	 * Permission gate matches the REST controller exactly — we reuse the
	 * `import` capability instead of inventing a new gate.
	 */
	public function test_can_import_delegates_to_current_user_can(): void {
		Functions\when( 'current_user_can' )->alias(
			static function ( $cap ) {
				return 'import' === $cap;
			}
		);

		self::assertTrue( Import_Abilities::can_import() );

		Functions\when( 'current_user_can' )->alias(
			static function ( $cap ) {
				return 'manage_options' === $cap; // anything other than `import`.
			}
		);

		self::assertFalse( Import_Abilities::can_import() );
	}

	/**
	 * The get-config callback returns the full snapshot shape with sane
	 * values pulled from the (stubbed) WordPress helpers and PHP ini.
	 */
	public function test_get_config_returns_expected_shape(): void {
		Filters\expectApplied( 'rest_get_max_batch_size' )
			->once()
			->with( 25 )
			->andReturn( 50 );

		// Stub MAX(ID) via the protected get_posts_max_id() seam — see fixture below.
		$result = Import_Abilities_Get_Config_Stub::get_config();

		self::assertIsArray( $result );
		self::assertSame( 50, $result['max_batch_items'] );
		self::assertIsInt( $result['max_execution_time'] );
		self::assertIsInt( $result['max_input_time'] );
		self::assertSame( array( 'image/jpeg', 'image/png' ), $result['mime_types'] );
		self::assertSame( 42, $result['posts_max_id'] );
		self::assertIsString( $result['version'] );
		self::assertNotSame( '', $result['version'] );
	}

	/**
	 * Input is ignored — get-config is a zero-arg ability and unexpected
	 * input must not change the output.
	 */
	public function test_get_config_ignores_input(): void {
		Filters\expectApplied( 'rest_get_max_batch_size' )
			->zeroOrMoreTimes()
			->andReturnUsing(
				static function ( $value ) {
					return $value;
				}
			);

		$with_input    = Import_Abilities_Get_Config_Stub::get_config( array( 'unexpected' => 'value' ) );
		$without_input = Import_Abilities_Get_Config_Stub::get_config();

		self::assertSame( $without_input, $with_input );
	}

	/**
	 * The cleanup-meta callback wires the three `$wpdb->delete()` calls
	 * correctly and surfaces non-zero deletions as `changed=true`.
	 */
	public function test_cleanup_meta_reports_counts_and_changed(): void {
		$this->stub_wpdb(
			array(
				'postmeta'    => 3,
				'commentmeta' => 1,
				'termmeta'    => 0,
			)
		);

		$result = Import_Abilities::cleanup_meta();

		self::assertSame(
			array(
				'postmeta_count'    => 3,
				'commentmeta_count' => 1,
				'termmeta_count'    => 0,
				'changed'           => true,
			),
			$result
		);
	}

	/**
	 * When every delete returns zero, `changed` must be false — a second
	 * cleanup call on a clean database is the canonical idempotent case.
	 */
	public function test_cleanup_meta_marks_changed_false_when_nothing_deleted(): void {
		$this->stub_wpdb(
			array(
				'postmeta'    => 0,
				'commentmeta' => 0,
				'termmeta'    => 0,
			)
		);

		$result = Import_Abilities::cleanup_meta();

		self::assertSame( 0, $result['postmeta_count'] );
		self::assertSame( 0, $result['commentmeta_count'] );
		self::assertSame( 0, $result['termmeta_count'] );
		self::assertFalse( $result['changed'] );
	}

	/**
	 * `$wpdb->delete()` returns false on a DB error; the spec advertises
	 * integers, so those must be coerced and not propagate as `changed=true`.
	 */
	public function test_cleanup_meta_coerces_wpdb_false_to_zero(): void {
		$this->stub_wpdb(
			array(
				'postmeta'    => false,
				'commentmeta' => false,
				'termmeta'    => false,
			)
		);

		$result = Import_Abilities::cleanup_meta();

		self::assertSame( 0, $result['postmeta_count'] );
		self::assertSame( 0, $result['commentmeta_count'] );
		self::assertSame( 0, $result['termmeta_count'] );
		self::assertFalse( $result['changed'] );
	}

	/**
	 * When the database connection is missing entirely, cleanup-meta returns
	 * a structured WP_Error rather than throwing or returning partial data.
	 */
	public function test_cleanup_meta_returns_wp_error_when_wpdb_unavailable(): void {
		unset( $GLOBALS['wpdb'] );

		$result = Import_Abilities::cleanup_meta();

		self::assertInstanceOf( \WP_Error::class, $result );
		self::assertSame( 'jetpack_import_wpdb_unavailable', $result->get_error_code() );
	}

	/**
	 * The init() entry point wires both lifecycle hooks when neither action
	 * has fired yet. Mirrors the wp-abilities Registrar contract for our
	 * concrete subclass.
	 */
	public function test_init_adds_hooks_when_neither_action_fired(): void {
		$this->enable_abilities();

		Functions\when( 'did_action' )->justReturn( 0 );

		Actions\expectAdded( Registrar::CATEGORIES_INIT_ACTION )
			->once()
			->with( array( Import_Abilities::class, 'register_category' ) );
		Actions\expectAdded( Registrar::ABILITIES_INIT_ACTION )
			->once()
			->with( array( Import_Abilities::class, 'register_abilities' ) );

		Functions\expect( 'wp_register_ability_category' )->never();
		Functions\expect( 'wp_register_ability' )->never();

		Import_Abilities::init();
	}

	/**
	 * When the rollout filter returns false, init() does nothing — abilities
	 * stay opt-in per site.
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

		Import_Abilities::init();
	}

	/**
	 * The register_abilities() entry point registers every spec returned by
	 * get_abilities() with the auto-injected category slug.
	 */
	public function test_register_abilities_registers_each_with_category(): void {
		Filters\expectApplied( 'jetpack_wp_abilities_should_register' )
			->zeroOrMoreTimes()
			->andReturn( true );

		Functions\expect( 'wp_register_ability' )
			->once()
			->with(
				'jetpack-import/get-config',
				\Mockery::on(
					static function ( $spec ) {
						return is_array( $spec )
							&& 'jetpack-import' === ( $spec['category'] ?? null )
							&& isset( $spec['execute_callback'] );
					}
				)
			);
		Functions\expect( 'wp_register_ability' )
			->once()
			->with(
				'jetpack-import/cleanup-meta',
				\Mockery::on(
					static function ( $spec ) {
						return is_array( $spec )
							&& 'jetpack-import' === ( $spec['category'] ?? null )
							&& true === ( $spec['meta']['annotations']['destructive'] ?? false );
					}
				)
			);

		Import_Abilities::register_abilities();
	}

	/**
	 * The register_category() entry point passes the slug + definition
	 * through to wp_register_ability_category() unchanged.
	 */
	public function test_register_category_passes_slug_and_definition(): void {
		Filters\expectApplied( 'jetpack_wp_abilities_should_register' )
			->zeroOrMoreTimes()
			->andReturn( true );

		Functions\expect( 'wp_register_ability_category' )
			->once()
			->with(
				'jetpack-import',
				\Mockery::on(
					static function ( $def ) {
						return is_array( $def )
							&& isset( $def['label'] )
							&& isset( $def['description'] )
							&& '' !== $def['label']
							&& '' !== $def['description'];
					}
				)
			);

		Import_Abilities::register_category();
	}
}

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
// phpcs:disable Squiz.Commenting.ClassComment.Missing

/**
 * Test fixture: overrides `get_posts_max_id()` so the get-config test does
 * not need a real `$wpdb` to validate the snapshot shape. Used by the
 * Import_Abilities_Test::test_get_config_* methods only.
 */
class Import_Abilities_Get_Config_Stub extends Import_Abilities {
	protected static function get_posts_max_id(): int {
		return 42;
	}
}
