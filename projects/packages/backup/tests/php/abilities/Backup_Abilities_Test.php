<?php
/**
 * Unit tests for the Backup_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005\Abilities;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use ReflectionClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Backup\V0005\Abilities\Backup_Abilities
 */
#[CoversClass( Backup_Abilities::class )]
class Backup_Abilities_Test extends BaseTestCase {

	/** @var int */
	private $admin_id;

	/** @var int */
	private $subscriber_id;

	public function setUp(): void {
		parent::setUp();

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'backup_ability_admin_' . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'backup_ability_sub_' . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open. Individual tests opt out by removing this filter.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	public function tearDown(): void {
		wp_set_current_user( 0 );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'jetpack_backup_abilities_should_load' );
		remove_all_filters( 'pre_http_request' );
		$this->deregister_backup_abilities();
		parent::tearDown();
	}

	/**
	 * Drop any abilities (and the test-fixture `site` category, if we put it
	 * there) registered during this test so the next test starts clean.
	 *
	 * We never own the `site` category in production code — it's registered
	 * upstream — but `ensure_site_category()` registers it as a test fixture
	 * so `wp_register_ability()` doesn't reject our abilities, and we tear
	 * it down here.
	 */
	private function deregister_backup_abilities(): void {
		if ( function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Backup_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( $this->registered_site_category && function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			if ( wp_has_ability_category( 'site' ) ) {
				wp_unregister_ability_category( 'site' );
			}
			$this->registered_site_category = false;
		}
	}

	/** @var bool */
	private $registered_site_category = false;

	/**
	 * Pre-register the upstream `site` ability category as a test fixture.
	 * Production code assumes `site` is already registered by WordPress core
	 * / wpcom; the test environment doesn't get that for free, so any test
	 * that exercises `wp_register_ability()` for a backup slug must call
	 * this first.
	 */
	private function ensure_site_category(): void {
		if ( ! function_exists( 'wp_register_ability_category' ) || ! function_exists( 'wp_has_ability_category' ) ) {
			return;
		}
		if ( wp_has_ability_category( 'site' ) ) {
			return;
		}

		global $wp_current_filter;
		$resume_init = false;
		if ( ! in_array( 'wp_abilities_api_categories_init', (array) $wp_current_filter, true ) ) {
			$wp_current_filter[] = 'wp_abilities_api_categories_init';
			$resume_init         = true;
		}

		wp_register_ability_category(
			'site',
			array(
				'label'       => 'Site',
				'description' => 'Site-wide abilities (test fixture).',
			)
		);
		$this->registered_site_category = true;

		if ( $resume_init ) {
			array_pop( $wp_current_filter );
		}
	}

	/**
	 * Simulate the `wp_abilities_api_categories_init` action being mid-flight.
	 */
	private function simulate_doing_categories_init(): void {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_categories_init';
	}

	/**
	 * Simulate the `wp_abilities_api_init` action being mid-flight.
	 */
	private function simulate_doing_abilities_init(): void {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_init';
	}

	/**
	 * Force `Backup_Abilities::backup_is_loaded()` to return true for the
	 * duration of the current test via the `jetpack_backup_abilities_should_load`
	 * filter. Removed automatically in tearDown.
	 */
	private function mock_backup_plan_available(): void {
		add_filter( 'jetpack_backup_abilities_should_load', '__return_true' );
	}

	/**
	 * Reflection helper for the protected-by-encapsulation static methods.
	 *
	 * @param string $method Static method name.
	 * @param array  $args   Method arguments.
	 * @return mixed
	 */
	private function call_private( string $method, array $args = array() ) {
		$reflection = ( new ReflectionClass( Backup_Abilities::class ) )->getMethod( $method );
		// setAccessible() is required on PHP < 8.1, a no-op on 8.1-8.4,
		// and deprecated on 8.5+. Only call it where it's actually needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		return $reflection->invokeArgs( null, $args );
	}

	public function test_category_slug_uses_shared_site_category(): void {
		// We don't own the category — we live under the upstream-registered
		// `site` category so agents see backup abilities alongside other
		// site-management tools.
		$this->assertSame( 'site', Backup_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = Backup_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotEmpty( $def['label'] );
		$this->assertNotEmpty( $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = Backup_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-backup/', $slug );
		}
	}

	public function test_expected_ability_slugs_are_present(): void {
		$slugs = array_keys( Backup_Abilities::get_abilities() );
		foreach (
			array(
				'jetpack-backup/get-backup-overview',
				'jetpack-backup/list-backups',
				'jetpack-backup/list-restores',
				'jetpack-backup/request-backup',
			) as $expected
		) {
			$this->assertContains( $expected, $slugs );
		}
	}

	public function test_no_spec_sets_category_explicitly(): void {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Backup_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_ability_has_input_schema_with_strict_properties(): void {
		foreach ( Backup_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'input_schema', $spec, "Ability {$slug} missing input_schema." );
			$this->assertSame( 'object', $spec['input_schema']['type'] ?? null );
			$this->assertSame( false, $spec['input_schema']['additionalProperties'] ?? null, "Ability {$slug} must set additionalProperties=false." );
		}
	}

	public function test_annotations_match_read_vs_write(): void {
		$abilities = Backup_Abilities::get_abilities();

		foreach ( array( 'jetpack-backup/get-backup-overview', 'jetpack-backup/list-backups', 'jetpack-backup/list-restores' ) as $read_slug ) {
			$annotations = $abilities[ $read_slug ]['meta']['annotations'];
			$this->assertTrue( $annotations['readonly'], "{$read_slug} must be readonly." );
			$this->assertFalse( $annotations['destructive'] );
			$this->assertTrue( $annotations['idempotent'] );
		}

		$write_annotations = $abilities['jetpack-backup/request-backup']['meta']['annotations'];
		$this->assertFalse( $write_annotations['readonly'] );
		$this->assertFalse( $write_annotations['destructive'] );
		$this->assertFalse( $write_annotations['idempotent'], 'request-backup queues a new job each call; not idempotent.' );
	}

	public function test_pagination_inputs_have_default_and_max(): void {
		$abilities = Backup_Abilities::get_abilities();
		foreach ( array( 'jetpack-backup/list-backups', 'jetpack-backup/list-restores' ) as $slug ) {
			$props = $abilities[ $slug ]['input_schema']['properties'];
			$this->assertSame( Backup_Abilities::PER_PAGE_DEFAULT, $props['per_page']['default'] );
			$this->assertSame( Backup_Abilities::PER_PAGE_MAX, $props['per_page']['maximum'] );
		}
	}

	public function test_every_ability_declares_public_rest_mcp_and_output_contract(): void {
		foreach ( Backup_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'output_schema', $spec, "Ability {$slug} missing output_schema." );
			$this->assertNotEmpty( $spec['output_schema'], "Ability {$slug} must declare a non-empty output_schema." );
			$this->assertArrayHasKey( 'meta', $spec, "Ability {$slug} missing meta." );
			$this->assertArrayHasKey( 'mcp', $spec['meta'], "Ability {$slug} must publish meta.mcp." );
			$this->assertSame(
				array(
					'public' => true,
					'type'   => 'tool',
				),
				$spec['meta']['mcp'],
				"{$slug} must be exposed as a public MCP tool."
			);
			$this->assertArrayHasKey( 'show_in_rest', $spec['meta'], "Ability {$slug} must explicitly declare show_in_rest." );
			$this->assertTrue( $spec['meta']['show_in_rest'], "{$slug} must be exposed through the Abilities REST surface." );
		}
	}

	public function test_request_backup_contract_is_public_non_idempotent_write_tool(): void {
		$spec = Backup_Abilities::get_abilities()['jetpack-backup/request-backup'];

		$this->assertSame(
			array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(),
				'additionalProperties' => false,
			),
			$spec['input_schema']
		);
		$this->assertSame(
			array(
				'type'       => 'object',
				'properties' => array(
					'enqueued' => array( 'type' => 'boolean' ),
					'message'  => array( 'type' => 'string' ),
				),
			),
			$spec['output_schema']
		);
		$this->assertSame( array( Backup_Abilities::class, 'execute_request_backup' ), $spec['execute_callback'] );
		$this->assertSame( array( Backup_Abilities::class, 'can_manage_backups' ), $spec['permission_callback'] );
		$this->assertSame(
			array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => false,
				),
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool',
				),
				'show_in_rest' => true,
			),
			$spec['meta']
		);
	}

	/**
	 * @param string $slug                   Ability slug.
	 * @param array  $expected_output_schema Expected output schema.
	 * @dataProvider provider_read_ability_contracts
	 */
	#[DataProvider( 'provider_read_ability_contracts' )]
	public function test_read_ability_contracts_have_stable_public_schemas( string $slug, array $expected_output_schema ): void {
		$spec = Backup_Abilities::get_abilities()[ $slug ];

		$this->assertSame( $expected_output_schema, $spec['output_schema'], "{$slug} output schema drifted." );
		$this->assertSame( array( Backup_Abilities::class, 'can_view_backups' ), $spec['permission_callback'], "{$slug} permission callback drifted." );
		$this->assertSame(
			array(
				'readonly'    => true,
				'destructive' => false,
				'idempotent'  => true,
			),
			$spec['meta']['annotations'],
			"{$slug} read annotations drifted."
		);
		$this->assertSame(
			array(
				'public' => true,
				'type'   => 'tool',
			),
			$spec['meta']['mcp'],
			"{$slug} MCP metadata drifted."
		);
		$this->assertTrue( $spec['meta']['show_in_rest'], "{$slug} show_in_rest metadata drifted." );
	}

	public function test_read_ability_input_schemas_and_callbacks_do_not_drift(): void {
		$abilities = Backup_Abilities::get_abilities();

		$overview = $abilities['jetpack-backup/get-backup-overview'];
		$this->assertSame( array( Backup_Abilities::class, 'execute_get_backup_overview' ), $overview['execute_callback'] );
		$this->assertSame( 'object', $overview['input_schema']['type'] );
		$this->assertSame( array(), $overview['input_schema']['default'] );
		$this->assertSame( array(), $overview['input_schema']['properties'] );
		$this->assertFalse( $overview['input_schema']['additionalProperties'] );

		$list_backups = $abilities['jetpack-backup/list-backups'];
		$this->assertSame( array( Backup_Abilities::class, 'execute_list_backups' ), $list_backups['execute_callback'] );
		$this->assertSame( 'object', $list_backups['input_schema']['type'] );
		$this->assertSame( array(), $list_backups['input_schema']['default'] );
		$this->assertFalse( $list_backups['input_schema']['additionalProperties'] );
		$this->assertSame(
			array( 'id', 'date_from', 'date_to', 'date', 'match', 'status', 'page', 'per_page' ),
			array_keys( $list_backups['input_schema']['properties'] )
		);
		$this->assertSame( 1, $list_backups['input_schema']['properties']['id']['minLength'] );
		$this->assertSame( 'date-time', $list_backups['input_schema']['properties']['date_from']['format'] );
		$this->assertSame( 'date-time', $list_backups['input_schema']['properties']['date_to']['format'] );
		$this->assertSame( 'date-time', $list_backups['input_schema']['properties']['date']['format'] );
		$this->assertSame( array( 'on_or_before', 'on_or_after', 'closest' ), $list_backups['input_schema']['properties']['match']['enum'] );
		$this->assertSame( 'on_or_before', $list_backups['input_schema']['properties']['match']['default'] );
		$this->assertSame( 1, $list_backups['input_schema']['properties']['page']['minimum'] );
		$this->assertSame( Backup_Abilities::PER_PAGE_DEFAULT, $list_backups['input_schema']['properties']['per_page']['default'] );
		$this->assertSame( Backup_Abilities::PER_PAGE_MAX, $list_backups['input_schema']['properties']['per_page']['maximum'] );

		$list_restores = $abilities['jetpack-backup/list-restores'];
		$this->assertSame( array( Backup_Abilities::class, 'execute_list_restores' ), $list_restores['execute_callback'] );
		$this->assertSame( 'object', $list_restores['input_schema']['type'] );
		$this->assertSame( array(), $list_restores['input_schema']['default'] );
		$this->assertFalse( $list_restores['input_schema']['additionalProperties'] );
		$this->assertSame( array( 'id', 'page', 'per_page' ), array_keys( $list_restores['input_schema']['properties'] ) );
		$this->assertSame( 1, $list_restores['input_schema']['properties']['id']['minLength'] );
		$this->assertSame( 1, $list_restores['input_schema']['properties']['page']['minimum'] );
		$this->assertSame( Backup_Abilities::PER_PAGE_DEFAULT, $list_restores['input_schema']['properties']['per_page']['default'] );
		$this->assertSame( Backup_Abilities::PER_PAGE_MAX, $list_restores['input_schema']['properties']['per_page']['maximum'] );
	}

	/**
	 * @return array<string, array{string, array<string, mixed>}>
	 */
	public static function provider_read_ability_contracts(): array {
		$backup_item_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'            => array( 'type' => array( 'string', 'null' ) ),
				'started'       => array( 'type' => array( 'string', 'null' ) ),
				'last_updated'  => array( 'type' => array( 'string', 'null' ) ),
				'status'        => array( 'type' => array( 'string', 'null' ) ),
				'period'        => array( 'type' => array( 'string', 'integer', 'null' ) ),
				'is_rewindable' => array( 'type' => array( 'boolean', 'null' ) ),
				'has_warnings'  => array( 'type' => array( 'boolean', 'null' ) ),
			),
		);

		$restore_item_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'           => array( 'type' => array( 'string', 'null' ) ),
				'started'      => array( 'type' => array( 'string', 'null' ) ),
				'last_updated' => array( 'type' => array( 'string', 'null' ) ),
				'status'       => array( 'type' => array( 'string', 'null' ) ),
				'progress'     => array( 'type' => array( 'integer', 'null' ) ),
			),
		);

		return array(
			'backup overview' => array(
				'jetpack-backup/get-backup-overview',
				array(
					'type'       => 'object',
					'properties' => array(
						'recent_backup_count' => array( 'type' => array( 'integer', 'null' ) ),
						'last_backup'         => array(
							'type'       => array( 'object', 'null' ),
							'properties' => array(
								'id'            => array( 'type' => array( 'string', 'null' ) ),
								'last_updated'  => array( 'type' => array( 'string', 'null' ) ),
								'status'        => array( 'type' => array( 'string', 'null' ) ),
								'is_rewindable' => array( 'type' => array( 'boolean', 'null' ) ),
								'has_warnings'  => array( 'type' => array( 'boolean', 'null' ) ),
							),
						),
						'schedule'            => array(
							'type'       => array( 'object', 'null' ),
							'properties' => array(
								'hour'   => array( 'type' => array( 'integer', 'null' ) ),
								'minute' => array( 'type' => array( 'integer', 'null' ) ),
							),
						),
						'storage'             => array(
							'type'       => array( 'object', 'null' ),
							'properties' => array(
								'used_bytes'  => array( 'type' => array( 'integer', 'null' ) ),
								'limit_bytes' => array( 'type' => array( 'integer', 'null' ) ),
							),
						),
					),
				),
			),
			'list backups'    => array(
				'jetpack-backup/list-backups',
				array(
					'type'  => 'array',
					'items' => $backup_item_schema,
				),
			),
			'list restores'   => array(
				'jetpack-backup/list-restores',
				array(
					'type'  => 'array',
					'items' => $restore_item_schema,
				),
			),
		);
	}

	public function test_registered_abilities_preserve_public_schema_and_meta_contracts(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this test environment.' );
		}

		$this->mock_backup_plan_available();
		$this->ensure_site_category();

		$this->simulate_doing_categories_init();
		Backup_Abilities::register_category();

		$this->simulate_doing_abilities_init();
		Backup_Abilities::register_abilities();

		$registered = array();
		foreach ( wp_get_abilities() as $ability ) {
			if ( 0 === strpos( $ability->get_name(), 'jetpack-backup/' ) ) {
				$registered[ $ability->get_name() ] = $ability;
			}
		}

		foreach ( Backup_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( $slug, $registered, "Ability {$slug} should be registered." );
			$this->assertSame( Backup_Abilities::get_category_slug(), $registered[ $slug ]->get_category(), "{$slug} category drifted at registration." );
			$this->assertSame( $spec['input_schema'], $registered[ $slug ]->get_input_schema(), "{$slug} registered input_schema drifted." );
			$this->assertSame( $spec['output_schema'], $registered[ $slug ]->get_output_schema(), "{$slug} registered output_schema drifted." );

			$meta = $registered[ $slug ]->get_meta();
			$this->assertSame( $spec['meta']['annotations'], $meta['annotations'], "{$slug} registered annotations drifted." );
			$this->assertSame( $spec['meta']['mcp'], $meta['mcp'], "{$slug} registered MCP metadata drifted." );
			$this->assertSame( $spec['meta']['show_in_rest'], $meta['show_in_rest'], "{$slug} registered show_in_rest metadata drifted." );
		}
	}

	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Backup_Abilities::init();

		$this->assertFalse(
			has_action( 'wp_abilities_api_categories_init', array( Backup_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( 'wp_abilities_api_init', array( Backup_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true(): void {
		Backup_Abilities::init();

		$this->assertNotFalse(
			has_action( 'wp_abilities_api_categories_init', array( Backup_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( 'wp_abilities_api_init', array( Backup_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_register_abilities_registers_every_slug(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this test environment.' );
		}

		$this->mock_backup_plan_available();
		$this->ensure_site_category();

		$this->simulate_doing_categories_init();
		Backup_Abilities::register_category();

		$this->simulate_doing_abilities_init();
		Backup_Abilities::register_abilities();

		$registered = array_map(
			static function ( $a ) {
				return $a->get_name();
			},
			array_filter(
				wp_get_abilities(),
				static function ( $a ) {
					return 0 === strpos( $a->get_name(), 'jetpack-backup/' );
				}
			)
		);

		foreach ( array_keys( Backup_Abilities::get_abilities() ) as $slug ) {
			$this->assertContains( $slug, $registered, "Ability {$slug} should be registered." );
		}
	}

	public function test_actions_php_registers_plugins_loaded_callback_at_priority_20(): void {
		// `actions.php` is autoloaded by composer for any plugin that depends on
		// the package. The bootstrap loads it once for the test run, so the
		// `plugins_loaded` priority-20 hook should already be present.
		global $wp_filter;
		$this->assertArrayHasKey( 'plugins_loaded', $wp_filter, 'plugins_loaded must have hooks registered.' );
		$this->assertArrayHasKey(
			20,
			$wp_filter['plugins_loaded']->callbacks ?? array(),
			'actions.php must register a plugins_loaded callback at priority 20.'
		);
	}

	public function test_actions_php_callback_registers_lifecycle_hooks_when_gate_true(): void {
		// Find the closure registered by actions.php at plugins_loaded:20 and
		// invoke it directly to verify it calls Backup_Abilities::init() and
		// the per-process Registrar guard keeps it idempotent.
		global $wp_filter;
		$callbacks = $wp_filter['plugins_loaded']->callbacks[20] ?? array();
		$this->assertNotEmpty( $callbacks, 'plugins_loaded:20 should contain the actions.php callback.' );

		// Locate the autoloaded closure (the only static Closure registered at
		// this priority by the backup package).
		$found = null;
		foreach ( $callbacks as $cb ) {
			if ( isset( $cb['function'] ) && $cb['function'] instanceof \Closure ) {
				$found = $cb['function'];
				break;
			}
		}
		$this->assertInstanceOf( \Closure::class, $found, 'A Closure must be registered at plugins_loaded:20.' );

		// Reset any prior registration so we can observe the side effect.
		remove_action( 'wp_abilities_api_categories_init', array( Backup_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Backup_Abilities::class, 'register_abilities' ) );

		// Gate filter is `__return_true` from setUp; fire the closure twice and
		// confirm the lifecycle hooks land exactly once (Registrar::init is
		// guarded against double-registration by its own static flag).
		$found();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Intentional: calling the gate closure twice verifies idempotent registration.
		$found();

		$this->assertNotFalse(
			has_action( 'wp_abilities_api_categories_init', array( Backup_Abilities::class, 'register_category' ) ),
			'Calling the actions.php closure with the gate filter true must register the categories-init hook.'
		);
		$this->assertNotFalse(
			has_action( 'wp_abilities_api_init', array( Backup_Abilities::class, 'register_abilities' ) ),
			'Calling the actions.php closure with the gate filter true must register the abilities-init hook.'
		);
	}

	public function test_per_ability_allow_list_filter_is_respected(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_has_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this test environment.' );
		}

		$this->mock_backup_plan_available();
		$this->ensure_site_category();

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				unset( $slug ); // Per-slug allow-listing is the test's intent; only $type is needed.
				if ( 'ability' === $type ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->simulate_doing_categories_init();
		Backup_Abilities::register_category();

		$this->simulate_doing_abilities_init();
		Backup_Abilities::register_abilities();

		foreach ( array_keys( Backup_Abilities::get_abilities() ) as $slug ) {
			$this->assertFalse( wp_has_ability( $slug ), "Ability {$slug} must be filtered out." );
		}
	}

	/**
	 * Without a Backup plan, `register_abilities()` must bail before
	 * touching the registry so the abilities never appear in
	 * /wp-abilities/v1/abilities/. We exercise the bail by leaving the
	 * `jetpack_backup_abilities_should_load` filter unset and not mocking
	 * `My_Jetpack\Products\Backup::is_active()` — in the test environment
	 * that resolves to false, which makes the gate close.
	 *
	 * Pre-registering the `site` fixture category so `register_abilities()`
	 * *could* register if the gate were open — that's the realistic
	 * production scenario, where `site` already exists upstream.
	 */
	public function test_register_bails_when_no_backup_plan(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_has_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this test environment.' );
		}

		$this->ensure_site_category();

		$this->simulate_doing_abilities_init();
		Backup_Abilities::register_abilities();

		foreach ( array_keys( Backup_Abilities::get_abilities() ) as $slug ) {
			$this->assertFalse(
				wp_has_ability( $slug ),
				"Ability {$slug} must not register when there is no Backup plan."
			);
		}
	}

	public function test_can_view_backups_allows_admin(): void {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Backup_Abilities::can_view_backups() );
	}

	public function test_can_view_backups_denies_subscriber(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Backup_Abilities::can_view_backups() );
	}

	public function test_can_view_backups_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Backup_Abilities::can_view_backups() );
	}

	public function test_can_manage_backups_denies_subscriber(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Backup_Abilities::can_manage_backups() );
	}

	public function test_can_manage_backups_allows_admin(): void {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Backup_Abilities::can_manage_backups() );
	}

	/**
	 * Full-fidelity execution requires a live Jetpack/WPCOM connection;
	 * without it, Connection\Client returns
	 * `WP_Error('missing_token'|'invalid_signature')` before the http layer.
	 * The next batch of tests verifies the callbacks degrade gracefully when
	 * the upstream is unreachable.
	 */
	public function test_list_backups_returns_empty_array_when_upstream_unavailable(): void {
		wp_set_current_user( $this->admin_id );
		$result = Backup_Abilities::execute_list_backups( array() );
		$this->assertSame( array(), $result );
	}

	public function test_list_backups_with_unknown_id_returns_empty_array(): void {
		wp_set_current_user( $this->admin_id );
		$result = Backup_Abilities::execute_list_backups( array( 'id' => 'does-not-exist' ) );
		$this->assertSame( array(), $result );
	}

	public function test_list_restores_returns_empty_array_when_upstream_unavailable(): void {
		wp_set_current_user( $this->admin_id );
		$result = Backup_Abilities::execute_list_restores( array() );
		$this->assertSame( array(), $result );
	}

	public function test_get_backup_overview_returns_documented_shape_when_upstream_unavailable(): void {
		wp_set_current_user( $this->admin_id );
		$result = Backup_Abilities::execute_get_backup_overview( array() );
		$this->assertIsArray( $result );
		foreach ( array( 'recent_backup_count', 'last_backup', 'schedule', 'storage' ) as $key ) {
			$this->assertArrayHasKey( $key, $result, "Overview must always include {$key} key." );
		}
		$this->assertNull( $result['last_backup'] );
	}

	public function test_request_backup_returns_wp_error_when_upstream_unavailable(): void {
		wp_set_current_user( $this->admin_id );
		$result = Backup_Abilities::execute_request_backup( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_backup_data_unavailable', $result->get_error_code() );
	}

	/**
	 * Wpcom can answer the enqueue endpoint with HTTP 200 and a body of
	 * `{ success: false, error: ... }` — meaning the service was reached
	 * but declined the request. The ability must report that as a failure
	 * rather than claiming the backup was enqueued.
	 */
	public function test_request_backup_returns_wp_error_when_upstream_reports_unsuccess(): void {
		wp_set_current_user( $this->admin_id );

		$mock = function () {
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode(
					array(
						'success' => false,
						'error'   => 'Backup service declined.',
					),
					JSON_UNESCAPED_SLASHES
				),
			);
		};
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10, 2 );
		add_filter( 'pre_http_request', $mock );

		$result = Backup_Abilities::execute_request_backup( array() );

		remove_filter( 'pre_http_request', $mock );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10 );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_backup_data_unavailable', $result->get_error_code() );
	}

	/**
	 * Happy path: wpcom returns HTTP 200 with `{ success: true }`, the ability
	 * should report the backup as enqueued.
	 */
	public function test_request_backup_returns_enqueued_when_upstream_reports_success(): void {
		wp_set_current_user( $this->admin_id );

		$mock = function () {
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( array( 'success' => true ), JSON_UNESCAPED_SLASHES ),
			);
		};
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10, 2 );
		add_filter( 'pre_http_request', $mock );

		$result = Backup_Abilities::execute_request_backup( array() );

		remove_filter( 'pre_http_request', $mock );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10 );

		$this->assertIsArray( $result );
		$this->assertTrue( $result['enqueued'] );
		$this->assertNotEmpty( $result['message'] );
	}

	/**
	 * Mock a Jetpack user connection so wpcom-as-user requests are signed.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function mock_jetpack_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'test.blogtoken';
			case 'id':
				return '999';
			case 'user_tokens':
				$user_id = get_current_user_id();
				if ( $user_id ) {
					return array( $user_id => sprintf( 'token%d.secret%d.%d', $user_id, $user_id, $user_id ) );
				}
		}
		return $value;
	}

	/**
	 * Regression: the Abilities API may hand the callback non-array input
	 * (string, null, etc.) before `additionalProperties:false` validation
	 * rejects it. Callbacks must not fatal — they should treat unrecognised
	 * input as "no input given" rather than throw a TypeError.
	 *
	 * @param mixed $input Non-array value the Abilities API might pass through.
	 * @dataProvider provider_non_array_inputs
	 */
	#[DataProvider( 'provider_non_array_inputs' )]
	public function test_execute_callbacks_tolerate_non_array_input( $input ): void {
		wp_set_current_user( $this->admin_id );

		$list = Backup_Abilities::execute_list_backups( $input );
		// list-backups accepts a `date` key; with non-array garbage there's
		// no date set, so the path is "no upstream → empty array". Either
		// is acceptable here — the point is it doesn't fatal.
		$this->assertTrue( is_array( $list ) || $list instanceof \WP_Error );

		$this->assertIsArray( Backup_Abilities::execute_list_restores( $input ) );
		$this->assertIsArray( Backup_Abilities::execute_get_backup_overview( $input ) );

		$request = Backup_Abilities::execute_request_backup( $input );
		// Without a plan this returns WP_Error; the point is it doesn't fatal.
		$this->assertInstanceOf( \WP_Error::class, $request );
	}

	/**
	 * @return array<string, array{mixed}>
	 */
	public static function provider_non_array_inputs(): array {
		return array(
			'null'         => array( null ),
			'empty string' => array( '' ),
			'string'       => array( 'not-an-array' ),
			'integer'      => array( 42 ),
			'bool'         => array( true ),
		);
	}

	public function test_list_backups_rejects_invalid_date_with_wp_error(): void {
		wp_set_current_user( $this->admin_id );

		foreach ( array( 'date', 'date_from', 'date_to' ) as $param ) {
			foreach ( array( 'not-a-date', '🐢' ) as $bad ) {
				$result = Backup_Abilities::execute_list_backups( array( $param => $bad ) );
				$this->assertInstanceOf( \WP_Error::class, $result, "{$param}={$bad} must be rejected." );
				$this->assertSame( 'jetpack_backup_invalid_date', $result->get_error_code() );
			}
		}
	}

	public function test_summarize_backup_event_maps_activity_event_to_backup_item(): void {
		$event = array(
			'rewind_id'     => '1747143000.1234',
			'published'     => '2026-05-13T12:30:00Z',
			'name'          => 'rewind__backup_complete_full',
			'status'        => 'success',
			'is_rewindable' => true,
			'summary'       => 'Backup complete',
		);

		$item = $this->call_private( 'summarize_backup_event', array( $event ) );

		$this->assertSame( '1747143000.1234', $item['id'], 'id must be the rewind_id — the cross-system identifier.' );
		$this->assertArrayNotHasKey( 'rewind_id', $item, 'Redundant rewind_id field must be dropped from the output shape.' );
		$this->assertSame( '2026-05-13T12:30:00Z', $item['started'] );
		$this->assertSame( '2026-05-13T12:30:00Z', $item['last_updated'] );
		$this->assertSame( 'finished', $item['status'], 'success/backup_complete event must surface as "finished" to match the legacy vocabulary.' );
		$this->assertSame( 1747143000, $item['period'], 'period must be the integer unix-ts portion of the fractional rewind_id.' );
		$this->assertTrue( $item['is_rewindable'] );
		$this->assertFalse( $item['has_warnings'] );
	}

	/**
	 * Rewind ids ship as numeric strings with a fractional attempt counter
	 * (e.g. "1778804242.107"). `parse_timestamp` must accept those and
	 * truncate the fractional part rather than returning null — otherwise
	 * activity-log-derived items always carry `period: null`.
	 */
	public function test_parse_timestamp_accepts_fractional_numeric_strings(): void {
		$this->assertSame( 1778804242, $this->call_private( 'parse_timestamp', array( '1778804242.107' ) ) );
		$this->assertSame( 1778804242, $this->call_private( 'parse_timestamp', array( '1778804242' ) ) );
		$this->assertSame( 1778804242, $this->call_private( 'parse_timestamp', array( 1778804242 ) ) );
		$this->assertSame( 1778804242, $this->call_private( 'parse_timestamp', array( 1778804242.999 ) ) );
		$this->assertNull( $this->call_private( 'parse_timestamp', array( 'not-a-date' ) ) );
		$this->assertNull( $this->call_private( 'parse_timestamp', array( '' ) ) );
	}

	public function test_summarize_backup_event_marks_warning_status(): void {
		$item = $this->call_private(
			'summarize_backup_event',
			array(
				array(
					'rewind_id'     => '1.0',
					'published'     => '2026-05-13T12:30:00Z',
					'name'          => 'something',
					'status'        => 'warning',
					'is_rewindable' => true,
				),
			)
		);

		$this->assertSame( 'warning', $item['status'] );
		$this->assertTrue( $item['has_warnings'] );
	}

	public function test_summarize_backup_event_drops_events_without_rewind_id(): void {
		$item = $this->call_private(
			'summarize_backup_event',
			array(
				array(
					'published' => '2026-05-13T12:30:00Z',
					'name'      => 'rewind__backup_complete_full',
				),
			)
		);

		$this->assertNull( $item, 'Events without a rewind_id are not backups.' );
	}

	public function test_extract_rewindable_items_reads_current_orderedItems_first(): void {
		$envelope = array(
			'type'         => 'OrderedCollection',
			'orderedItems' => array( array( 'rewind_id' => 'a' ) ),
			'current'      => array(
				'orderedItems' => array( array( 'rewind_id' => 'b' ) ),
			),
		);

		$items = $this->call_private( 'extract_rewindable_items', array( $envelope ) );

		$this->assertCount( 1, $items );
		$this->assertSame( 'b', $items[0]['rewind_id'], 'Should prefer current.orderedItems (the canonical rewindable shape).' );
	}

	public function test_extract_rewindable_items_falls_back_to_top_level(): void {
		$envelope = array(
			'orderedItems' => array( array( 'rewind_id' => 'top' ) ),
		);

		$items = $this->call_private( 'extract_rewindable_items', array( $envelope ) );

		$this->assertSame( 'top', $items[0]['rewind_id'] );
	}

	public function test_list_backups_returns_empty_array_when_upstream_unavailable_with_date_filter(): void {
		wp_set_current_user( $this->admin_id );
		$result = Backup_Abilities::execute_list_backups( array( 'date' => '2026-05-13T12:00:00Z' ) );
		$this->assertIsArray( $result );
		$this->assertSame( array(), $result );
	}

	public function test_pick_backup_picks_on_or_before_by_default(): void {
		$backups = $this->sample_backups();
		$target  = strtotime( '2026-05-13T12:00:00Z' );

		$pick = $this->call_private( 'pick_backup_near_timestamp', array( $backups, $target, 'on_or_before' ) );

		$this->assertNotNull( $pick );
		$this->assertSame( 'b-2026-05-13-10', $pick['id'], 'Should pick the latest backup at or before the target.' );
	}

	public function test_pick_backup_on_or_after_picks_earliest_in_future(): void {
		$backups = $this->sample_backups();
		$target  = strtotime( '2026-05-13T12:00:00Z' );

		$pick = $this->call_private( 'pick_backup_near_timestamp', array( $backups, $target, 'on_or_after' ) );

		$this->assertNotNull( $pick );
		$this->assertSame( 'b-2026-05-13-14', $pick['id'], 'Should pick the earliest backup at or after the target.' );
	}

	public function test_pick_backup_closest_minimizes_absolute_diff(): void {
		$backups = $this->sample_backups();
		// 11:00 — closer to the 10:00 backup (1h) than 14:00 (3h).
		$target = strtotime( '2026-05-13T11:00:00Z' );
		$pick   = $this->call_private( 'pick_backup_near_timestamp', array( $backups, $target, 'closest' ) );
		$this->assertSame( 'b-2026-05-13-10', $pick['id'] );

		// 13:00 — closer to the 14:00 backup (1h) than 10:00 (3h).
		$target = strtotime( '2026-05-13T13:00:00Z' );
		$pick   = $this->call_private( 'pick_backup_near_timestamp', array( $backups, $target, 'closest' ) );
		$this->assertSame( 'b-2026-05-13-14', $pick['id'] );
	}

	public function test_pick_backup_returns_null_when_no_match_for_on_or_before(): void {
		// Target predates every backup, so 'on_or_before' has nothing to return.
		$backups = $this->sample_backups();
		$target  = strtotime( '2020-01-01T00:00:00Z' );

		$pick = $this->call_private( 'pick_backup_near_timestamp', array( $backups, $target, 'on_or_before' ) );
		$this->assertNull( $pick );
	}

	public function test_pick_backup_skips_items_with_unparseable_started(): void {
		$backups = array(
			array(
				'id'      => 'bad',
				'started' => 'not-a-date',
			),
			array(
				'id'      => 'good',
				'started' => '2026-05-13T10:00:00Z',
			),
			array( 'id' => 'missing' ), // No `started` at all.
		);
		$target  = strtotime( '2026-05-13T12:00:00Z' );

		$pick = $this->call_private( 'pick_backup_near_timestamp', array( $backups, $target, 'on_or_before' ) );
		$this->assertSame( 'good', $pick['id'] );
	}

	/**
	 * Three synthetic backups bracketing 2026-05-13T12:00:00Z: 10:00 (before),
	 * 14:00 (after), 09:00 (further before). Reused by the picking tests.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function sample_backups(): array {
		return array(
			array(
				'id'      => 'b-2026-05-13-09',
				'started' => '2026-05-13T09:00:00Z',
				'status'  => 'finished',
			),
			array(
				'id'      => 'b-2026-05-13-10',
				'started' => '2026-05-13T10:00:00Z',
				'status'  => 'finished',
			),
			array(
				'id'      => 'b-2026-05-13-14',
				'started' => '2026-05-13T14:00:00Z',
				'status'  => 'finished',
			),
		);
	}

	public function test_summarize_backup_uses_rewind_id_as_id_and_drops_internal_attempt_id(): void {
		$raw = array(
			// `id` is wpcom's internal numeric VaultPress attempt id — must NOT
			// leak into the agent-facing shape because no other endpoint can
			// resolve it. `rewind_id` is the cross-system identifier.
			'id'            => 875405461,
			'rewind_id'     => '1700000000.0',
			'started'       => '2026-04-26T01:00:00Z',
			'last_updated'  => '2026-04-26T01:05:00Z',
			'status'        => 'finished',
			'period'        => 'daily',
			'is_rewindable' => 1,
			'has_warnings'  => 0,
			'noise_field'   => 'should be dropped',
		);

		$result = $this->call_private( 'summarize_backup', array( $raw ) );

		$this->assertSame( '1700000000.0', $result['id'], 'id must mirror rewind_id (queryable across abilities) rather than the internal numeric attempt id.' );
		$this->assertArrayNotHasKey( 'rewind_id', $result, 'Redundant rewind_id field must be dropped.' );
		$this->assertTrue( $result['is_rewindable'] );
		$this->assertFalse( $result['has_warnings'] );
		$this->assertArrayNotHasKey( 'noise_field', $result );
	}

	public function test_summarize_backup_returns_null_id_when_rewind_id_missing(): void {
		// In-progress backups don't have a rewind_id yet; id is therefore null
		// (the backup can't be looked up by any other endpoint until it
		// completes).
		$result = $this->call_private(
			'summarize_backup',
			array(
				array(
					'id'     => 999,
					'status' => 'started',
				),
			)
		);

		$this->assertNull( $result['id'] );
		$this->assertSame( 'started', $result['status'] );
		$this->assertNull( $result['is_rewindable'] );
	}

	public function test_summarize_restore_uses_rewind_id_as_id(): void {
		$raw = array(
			'id'           => 12345,
			'rewind_id'    => '1700000000.0',
			'started'      => '2026-04-26T01:00:00Z',
			'last_updated' => '2026-04-26T01:10:00Z',
			'status'       => 'finished',
			'progress'     => '100',
			'noise_field'  => 'drop me',
		);

		$result = $this->call_private( 'summarize_restore', array( $raw ) );

		$this->assertSame( '1700000000.0', $result['id'], 'restore id mirrors the rewind_id being restored to.' );
		$this->assertArrayNotHasKey( 'rewind_id', $result );
		$this->assertSame( 100, $result['progress'] );
		$this->assertArrayNotHasKey( 'noise_field', $result );
	}

	public function test_summarize_schedule_returns_null_for_invalid_input(): void {
		$this->assertNull( $this->call_private( 'summarize_schedule', array( null ) ) );
		$this->assertNull( $this->call_private( 'summarize_schedule', array( 'string' ) ) );
	}

	public function test_summarize_schedule_extracts_hour_minute(): void {
		$result = $this->call_private(
			'summarize_schedule',
			array(
				array(
					'hour'   => 3,
					'minute' => 30,
				),
			)
		);
		$this->assertSame( 3, $result['hour'] );
		$this->assertSame( 30, $result['minute'] );
	}

	public function test_summarize_storage_handles_both_field_aliases(): void {
		// Production WPCOM payload uses size_in_bytes/storage_limit_bytes.
		$result = $this->call_private(
			'summarize_storage',
			array(
				array(
					'size_in_bytes'       => 1024,
					'storage_limit_bytes' => 10240,
				),
			)
		);
		$this->assertSame( 1024, $result['used_bytes'] );
		$this->assertSame( 10240, $result['limit_bytes'] );

		// Defensive shape: bare *_bytes keys also accepted.
		$result = $this->call_private(
			'summarize_storage',
			array(
				array(
					'used_bytes'  => 5,
					'limit_bytes' => 50,
				),
			)
		);
		$this->assertSame( 5, $result['used_bytes'] );
		$this->assertSame( 50, $result['limit_bytes'] );
	}

	public function test_apply_id_or_pagination_filters_by_id(): void {
		$items  = array(
			array( 'id' => 'a' ),
			array( 'id' => 'b' ),
			array( 'id' => 'c' ),
		);
		$result = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'id' => 'b' ) ) );

		$this->assertCount( 1, $result );
		$this->assertSame( 'b', $result[0]['id'] );
	}

	public function test_apply_id_or_pagination_with_unknown_id_returns_empty(): void {
		// Consolidated read: unknown id is a no-match, not an error.
		$items  = array( array( 'id' => 'a' ) );
		$result = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'id' => 'nope' ) ) );
		$this->assertSame( array(), $result );
	}

	public function test_apply_id_or_pagination_rejects_empty_string_id(): void {
		// Empty string id should NOT match anything — falls through to pagination.
		$items  = array( array( 'id' => 'a' ), array( 'id' => 'b' ) );
		$result = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'id' => '' ) ) );
		$this->assertCount( 2, $result );
	}

	public function test_apply_id_or_pagination_accepts_zero_string_id(): void {
		// Regression guard: empty('0') is true, but '0' is a legal ID.
		$items  = array( array( 'id' => '0' ), array( 'id' => 'b' ) );
		$result = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'id' => '0' ) ) );
		$this->assertCount( 1, $result );
		$this->assertSame( '0', $result[0]['id'] );
	}

	public function test_apply_id_or_pagination_clamps_per_page_to_max(): void {
		$items = array();
		for ( $i = 0; $i < 150; $i++ ) {
			$items[] = array( 'id' => 'b-' . $i );
		}
		// per_page above the max should be clamped to PER_PAGE_MAX (100).
		$result = $this->call_private( 'apply_id_or_pagination', array( $items, array( 'per_page' => 500 ) ) );
		$this->assertCount( Backup_Abilities::PER_PAGE_MAX, $result );
	}

	public function test_apply_id_or_pagination_paginates(): void {
		$items = array();
		for ( $i = 0; $i < 25; $i++ ) {
			$items[] = array( 'id' => 'b-' . $i );
		}
		$first  = $this->call_private(
			'apply_id_or_pagination',
			array(
				$items,
				array(
					'page'     => 1,
					'per_page' => 10,
				),
			)
		);
		$second = $this->call_private(
			'apply_id_or_pagination',
			array(
				$items,
				array(
					'page'     => 2,
					'per_page' => 10,
				),
			)
		);
		$third  = $this->call_private(
			'apply_id_or_pagination',
			array(
				$items,
				array(
					'page'     => 3,
					'per_page' => 10,
				),
			)
		);

		$this->assertCount( 10, $first );
		$this->assertCount( 10, $second );
		$this->assertCount( 5, $third );
		$this->assertSame( 'b-0', $first[0]['id'] );
		$this->assertSame( 'b-10', $second[0]['id'] );
		$this->assertSame( 'b-20', $third[0]['id'] );
	}

	public function test_unwrap_response_returns_null_for_wp_error(): void {
		$result = $this->call_private( 'unwrap_response', array( new \WP_Error( 'x', 'y' ) ) );
		$this->assertNull( $result );
	}

	public function test_unwrap_response_returns_null_for_null(): void {
		$this->assertNull( $this->call_private( 'unwrap_response', array( null ) ) );
	}

	public function test_unwrap_response_returns_data_for_rest_response(): void {
		$result = $this->call_private(
			'unwrap_response',
			array( new \WP_REST_Response( array( 'foo' => 'bar' ) ) )
		);
		$this->assertSame( array( 'foo' => 'bar' ), $result );
	}

	public function test_unwrap_response_passes_arrays_through(): void {
		$result = $this->call_private( 'unwrap_response', array( array( 'a' => 1 ) ) );
		$this->assertSame( array( 'a' => 1 ), $result );
	}
}
