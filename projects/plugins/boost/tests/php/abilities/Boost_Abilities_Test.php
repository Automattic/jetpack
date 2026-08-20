<?php
/**
 * Integration tests for the Boost_Abilities Registrar subclass.
 *
 * Runs in the with-wordpress (WordBless) testsuite because the execute
 * callbacks instantiate real Boost Module objects, which touch options,
 * sanitize_title(), WP_CONTENT_DIR, and the page-cache settings storage.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use Automattic\Jetpack_Boost\Abilities\Boost_Abilities;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

// Include the main plugin file so Boost autoload + constants are wired.
require_once dirname( __DIR__, 3 ) . '/jetpack-boost.php';

/**
 * @covers \Automattic\Jetpack_Boost\Abilities\Boost_Abilities
 */
#[CoversClass( Boost_Abilities::class )]
class Boost_Abilities_Test extends BaseTestCase {

	/** @var int */
	private $admin_id;

	/** @var int */
	private $subscriber_id;

	public function setUp(): void {
		parent::setUp();

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'boost_ability_admin_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'boost_ability_sub_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open for most test cases. Tests that need it closed remove this filter.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	public function tearDown(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_actions( Registrar::CATEGORIES_INIT_ACTION );
		remove_all_actions( Registrar::ABILITIES_INIT_ACTION );

		// The Abilities API registry is global state shared across tests in the same process.
		// Deregister anything we put in so test order doesn't matter.
		if ( function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Boost_Abilities::get_abilities() ) as $slug ) {
				wp_unregister_ability( $slug );
			}
		}

		wp_set_current_user( 0 );

		// WorDBless persists the database across tests, so users created in setUp() must
		// be removed explicitly to avoid steady user-table bloat.
		if ( $this->admin_id ) {
			wp_delete_user( $this->admin_id );
		}
		if ( $this->subscriber_id ) {
			wp_delete_user( $this->subscriber_id );
		}

		parent::tearDown();
	}

	/** -------------------- Abstract getters -------------------- */
	public function test_category_slug_is_jetpack_boost(): void {
		$this->assertSame( 'jetpack-boost', Boost_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = Boost_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertSame( 'Jetpack Boost', $def['label'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = Boost_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-boost/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly(): void {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Boost_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_spec_has_required_keys(): void {
		$required = array( 'label', 'description', 'input_schema', 'output_schema', 'execute_callback', 'permission_callback', 'meta' );
		foreach ( Boost_Abilities::get_abilities() as $slug => $spec ) {
			foreach ( $required as $key ) {
				$this->assertArrayHasKey( $key, $spec, "Ability {$slug} missing key {$key}." );
			}
			$this->assertArrayHasKey( 'annotations', $spec['meta'] );
			$this->assertArrayHasKey( 'show_in_rest', $spec['meta'] );
			$this->assertTrue( $spec['meta']['show_in_rest'], "Ability {$slug} must be visible in REST." );
			$this->assertArrayHasKey( 'additionalProperties', $spec['input_schema'] );
			$this->assertFalse( $spec['input_schema']['additionalProperties'], "Ability {$slug} input_schema must set additionalProperties: false." );
		}
	}

	public function test_every_spec_declares_an_output_schema_shape(): void {
		foreach ( Boost_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'type', $spec['output_schema'], "Ability {$slug} output_schema must declare a type." );
			$this->assertContains( $spec['output_schema']['type'], array( 'array', 'object' ), "Ability {$slug} output_schema must return a structured value." );
		}
	}

	public function test_every_spec_publishes_mcp_metadata(): void {
		foreach ( Boost_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'mcp', $spec['meta'], "Ability {$slug} missing meta.mcp." );
			$this->assertTrue( $spec['meta']['mcp']['public'], "Ability {$slug} must set mcp.public=true." );
			$this->assertSame( 'tool', $spec['meta']['mcp']['type'], "Ability {$slug} must declare mcp.type=tool." );
		}
	}

	public function test_write_abilities_are_marked_non_readonly(): void {
		$abilities = Boost_Abilities::get_abilities();
		$this->assertFalse( $abilities['jetpack-boost/set-module-status']['meta']['annotations']['readonly'] );
		$this->assertFalse( $abilities['jetpack-boost/clear-page-cache']['meta']['annotations']['readonly'] );
	}

	public function test_read_abilities_are_marked_readonly(): void {
		$abilities = Boost_Abilities::get_abilities();
		$this->assertTrue( $abilities['jetpack-boost/get-modules']['meta']['annotations']['readonly'] );
		$this->assertTrue( $abilities['jetpack-boost/get-speed-score']['meta']['annotations']['readonly'] );
	}

	public function test_get_modules_public_read_contract_does_not_drift(): void {
		$ability = Boost_Abilities::get_abilities()['jetpack-boost/get-modules'];

		$this->assertSame( array( Boost_Abilities::class, 'can_view_modules' ), $ability['permission_callback'] );
		$this->assertSame(
			array(
				'readonly'    => true,
				'destructive' => false,
				'idempotent'  => true,
			),
			$ability['meta']['annotations']
		);

		$this->assertSame( 'object', $ability['input_schema']['type'] );
		$this->assertSame( array(), $ability['input_schema']['default'] );
		$this->assertFalse( $ability['input_schema']['additionalProperties'] );
		$this->assertSame( array( 'slug', 'status', 'search' ), array_keys( $ability['input_schema']['properties'] ) );
		$this->assertSame( 'string', $ability['input_schema']['properties']['slug']['type'] );
		$this->assertSame( 1, $ability['input_schema']['properties']['slug']['minLength'] );
		$this->assertSame( array( 'active', 'inactive', 'available', 'optimizing' ), $ability['input_schema']['properties']['status']['enum'] );
		$this->assertSame( 'string', $ability['input_schema']['properties']['search']['type'] );
		$this->assertSame( 1, $ability['input_schema']['properties']['search']['minLength'] );

		$this->assertSame( 'array', $ability['output_schema']['type'] );
		$this->assertSame( 'object', $ability['output_schema']['items']['type'] );
		$this->assertSame( array( 'slug', 'active', 'available', 'optimizing' ), array_keys( $ability['output_schema']['items']['properties'] ) );
		$this->assertSame( 'string', $ability['output_schema']['items']['properties']['slug']['type'] );
		$this->assertSame( 'boolean', $ability['output_schema']['items']['properties']['active']['type'] );
		$this->assertSame( 'boolean', $ability['output_schema']['items']['properties']['available']['type'] );
		$this->assertSame( 'boolean', $ability['output_schema']['items']['properties']['optimizing']['type'] );
	}

	public function test_get_speed_score_public_read_contract_does_not_drift(): void {
		$ability = Boost_Abilities::get_abilities()['jetpack-boost/get-speed-score'];

		$this->assertSame( array( Boost_Abilities::class, 'can_view_modules' ), $ability['permission_callback'] );
		$this->assertSame(
			array(
				'readonly'    => true,
				'destructive' => false,
				'idempotent'  => true,
			),
			$ability['meta']['annotations']
		);

		$this->assertSame( 'object', $ability['input_schema']['type'] );
		$this->assertSame( array(), $ability['input_schema']['default'] );
		$this->assertSame( array(), $ability['input_schema']['properties'] );
		$this->assertFalse( $ability['input_schema']['additionalProperties'] );

		$this->assertSame( 'object', $ability['output_schema']['type'] );
		$this->assertSame( array( 'mobile', 'desktop', 'timestamp', 'is_stale', 'has_history' ), array_keys( $ability['output_schema']['properties'] ) );
		$this->assertSame( array( 'integer', 'null' ), $ability['output_schema']['properties']['mobile']['type'] );
		$this->assertSame( array( 'integer', 'null' ), $ability['output_schema']['properties']['desktop']['type'] );
		$this->assertSame( array( 'integer', 'null' ), $ability['output_schema']['properties']['timestamp']['type'] );
		$this->assertSame( 'boolean', $ability['output_schema']['properties']['is_stale']['type'] );
		$this->assertSame( 'boolean', $ability['output_schema']['properties']['has_history']['type'] );
	}

	public function test_set_module_status_public_write_contract_does_not_drift(): void {
		$ability = Boost_Abilities::get_abilities()['jetpack-boost/set-module-status'];

		$this->assertSame( array( Boost_Abilities::class, 'can_manage_modules' ), $ability['permission_callback'] );
		$this->assertSame(
			array(
				'readonly'    => false,
				'destructive' => false,
				'idempotent'  => true,
			),
			$ability['meta']['annotations']
		);
		$this->assertTrue( $ability['meta']['show_in_rest'] );
		$this->assertSame(
			array(
				'public' => true,
				'type'   => 'tool',
			),
			$ability['meta']['mcp']
		);

		$this->assertSame( 'object', $ability['input_schema']['type'] );
		$this->assertSame( array( 'slug', 'active' ), $ability['input_schema']['required'] );
		$this->assertFalse( $ability['input_schema']['additionalProperties'] );
		$this->assertSame( array( 'slug', 'active' ), array_keys( $ability['input_schema']['properties'] ) );
		$this->assertSame( 'string', $ability['input_schema']['properties']['slug']['type'] );
		$this->assertSame( 1, $ability['input_schema']['properties']['slug']['minLength'] );
		$this->assertSame( 'boolean', $ability['input_schema']['properties']['active']['type'] );

		$this->assertSame( 'object', $ability['output_schema']['type'] );
		$this->assertSame( array( 'slug', 'active', 'changed' ), array_keys( $ability['output_schema']['properties'] ) );
		$this->assertSame( 'string', $ability['output_schema']['properties']['slug']['type'] );
		$this->assertSame( 'boolean', $ability['output_schema']['properties']['active']['type'] );
		$this->assertSame( 'boolean', $ability['output_schema']['properties']['changed']['type'] );
	}

	public function test_clear_page_cache_public_write_contract_does_not_drift(): void {
		$ability = Boost_Abilities::get_abilities()['jetpack-boost/clear-page-cache'];

		$this->assertSame( array( Boost_Abilities::class, 'can_manage_modules' ), $ability['permission_callback'] );
		$this->assertSame(
			array(
				'readonly'    => false,
				'destructive' => false,
				'idempotent'  => true,
			),
			$ability['meta']['annotations']
		);
		$this->assertTrue( $ability['meta']['show_in_rest'] );
		$this->assertSame(
			array(
				'public' => true,
				'type'   => 'tool',
			),
			$ability['meta']['mcp']
		);

		$this->assertSame( 'object', $ability['input_schema']['type'] );
		$this->assertSame( array(), $ability['input_schema']['default'] );
		$this->assertSame( array(), $ability['input_schema']['properties'] );
		$this->assertFalse( $ability['input_schema']['additionalProperties'] );

		$this->assertSame( 'object', $ability['output_schema']['type'] );
		$this->assertSame( array( 'cleared', 'message' ), array_keys( $ability['output_schema']['properties'] ) );
		$this->assertSame( 'boolean', $ability['output_schema']['properties']['cleared']['type'] );
		$this->assertSame( 'string', $ability['output_schema']['properties']['message']['type'] );
	}

	/** -------------------- Registrar wiring -------------------- */
	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Boost_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Boost_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Boost_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true(): void {
		Boost_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Boost_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Boost_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_registers_directly_when_lifecycle_actions_already_fired(): void {
		// Simulate a late-loading deployment: the lifecycle actions ran before our init().
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );

		// Spy on the shared registration filter — Registrar calls it once per category and once per ability,
		// so a non-zero call count proves register_category()/register_abilities() ran synchronously.
		$invocations = array();
		$spy         = function ( $enabled, $type, $slug ) use ( &$invocations ) {
			$invocations[] = array( $type, $slug );
			return $enabled;
		};
		add_filter( 'jetpack_wp_abilities_should_register', $spy, 10, 3 );

		Boost_Abilities::init();

		remove_filter( 'jetpack_wp_abilities_should_register', $spy, 10 );

		// The synchronous branch must NOT add hooks for actions that already fired.
		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Boost_Abilities::class, 'register_category' ) ),
			'Late-load path should call register_category() directly, not hook the already-fired action.'
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Boost_Abilities::class, 'register_abilities' ) )
		);

		$types = array_column( $invocations, 0 );
		$this->assertContains( 'category', $types, 'register_category() must run synchronously when CATEGORIES_INIT_ACTION already fired.' );
		$this->assertContains( 'ability', $types, 'register_abilities() must run synchronously when ABILITIES_INIT_ACTION already fired.' );
	}

	public function test_register_abilities_registers_every_slug(): void {
		// `wp_register_ability_category` and `wp_register_ability` only run inside their
		// respective lifecycle actions; firing them directly mirrors what core does.
		Boost_Abilities::init();
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );

		foreach ( array_keys( Boost_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotNull(
				wp_get_ability( $slug ),
				"Ability {$slug} should be registered."
			);
		}
	}

	public function test_register_abilities_injects_category_on_specs_that_omit_it(): void {
		Boost_Abilities::init();
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );

		// Pick any slug and confirm the registered ability carries the auto-injected category.
		$ability = wp_get_ability( 'jetpack-boost/get-modules' );
		$this->assertNotNull( $ability );
		// `get_category` returns the slug string of the ability's category.
		$this->assertSame( 'jetpack-boost', $ability->get_category() );
	}

	public function test_per_ability_allow_list_filter_is_respected(): void {
		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $_slug ) {
				if ( 'ability' === $type ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		Boost_Abilities::init();
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );

		foreach ( array_keys( Boost_Abilities::get_abilities() ) as $slug ) {
			$this->assertNull( wp_get_ability( $slug ), "Ability {$slug} must be filtered out." );
		}
	}

	/** -------------------- Permission callbacks -------------------- */
	public function test_can_view_modules_allows_admin(): void {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Boost_Abilities::can_view_modules() );
	}

	public function test_can_view_modules_denies_subscriber(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Boost_Abilities::can_view_modules() );
	}

	public function test_can_view_modules_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Boost_Abilities::can_view_modules() );
	}

	public function test_can_manage_modules_allows_admin(): void {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Boost_Abilities::can_manage_modules() );
	}

	public function test_can_manage_modules_denies_subscriber(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Boost_Abilities::can_manage_modules() );
	}

	public function test_can_manage_modules_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Boost_Abilities::can_manage_modules() );
	}

	/** -------------------- get_modules -------------------- */
	public function test_get_modules_returns_array_of_documented_shape(): void {
		wp_set_current_user( $this->admin_id );

		$result = Boost_Abilities::get_modules( array() );
		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result, 'Boost has features registered; the read should not be empty.' );

		foreach ( $result as $entry ) {
			$this->assertArrayHasKey( 'slug', $entry );
			$this->assertArrayHasKey( 'active', $entry );
			$this->assertArrayHasKey( 'available', $entry );
			$this->assertArrayHasKey( 'optimizing', $entry );
			$this->assertIsString( $entry['slug'] );
			$this->assertIsBool( $entry['active'] );
			$this->assertIsBool( $entry['available'] );
			$this->assertIsBool( $entry['optimizing'] );
		}
	}

	public function test_get_modules_with_unknown_slug_returns_empty_array(): void {
		// Consolidated read: unknown slug is a no-match, not an error — agents treat the shape uniformly.
		$result = Boost_Abilities::get_modules( array( 'slug' => 'does-not-exist-ever' ) );
		$this->assertSame( array(), $result );
	}

	public function test_get_modules_rejects_non_string_slug(): void {
		// A non-string slug is a shape error, not "unknown" — must fail loudly rather than fall through to the full list.
		$result = Boost_Abilities::get_modules( array( 'slug' => 123 ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_boost_invalid_slug', $result->get_error_code() );
	}

	public function test_get_modules_with_known_slug_returns_single_element(): void {
		// Boost slugs use underscores (Critical_CSS::get_slug() returns "critical_css").
		$result = Boost_Abilities::get_modules( array( 'slug' => 'critical_css' ) );
		$this->assertCount( 1, $result );
		$this->assertSame( 'critical_css', $result[0]['slug'] );
	}

	public function test_get_modules_search_is_case_insensitive_substring(): void {
		$result = Boost_Abilities::get_modules( array( 'search' => 'CACHE' ) );
		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		foreach ( $result as $entry ) {
			$this->assertStringContainsString( 'cache', $entry['slug'] );
		}
	}

	public function test_get_modules_returns_sorted_results(): void {
		$result = Boost_Abilities::get_modules( array() );
		$slugs  = array_column( $result, 'slug' );
		$sorted = $slugs;
		sort( $sorted );
		$this->assertSame( $sorted, $slugs, 'Results must be deterministically sorted by slug.' );
	}

	/** -------------------- set_module_status -------------------- */
	public function test_set_module_status_rejects_missing_slug(): void {
		$result = Boost_Abilities::set_module_status( array( 'active' => true ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_boost_missing_slug', $result->get_error_code() );
	}

	public function test_set_module_status_rejects_empty_string_slug(): void {
		$result = Boost_Abilities::set_module_status(
			array(
				'slug'   => '',
				'active' => true,
			)
		);
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_boost_missing_slug', $result->get_error_code() );
	}

	public function test_set_module_status_rejects_missing_active(): void {
		$result = Boost_Abilities::set_module_status( array( 'slug' => 'critical_css' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_boost_missing_active', $result->get_error_code() );
	}

	public function test_set_module_status_rejects_non_boolean_active(): void {
		// Schema validation may not run in unit context; the callback must defend itself.
		$result = Boost_Abilities::set_module_status(
			array(
				'slug'   => 'critical_css',
				'active' => 'yes',
			)
		);
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_boost_invalid_active', $result->get_error_code() );
	}

	public function test_set_module_status_rejects_unknown_slug(): void {
		$result = Boost_Abilities::set_module_status(
			array(
				'slug'   => 'does-not-exist-ever',
				'active' => true,
			)
		);
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_boost_invalid_slug', $result->get_error_code() );
	}

	public function test_set_module_status_treats_zero_string_slug_as_present(): void {
		// Required-id check uses '' !== $value, NOT empty(), so '0' stays a legal slug.
		// Reaching jetpack_boost_invalid_slug (lookup miss) proves we passed the missing-slug guard.
		$result = Boost_Abilities::set_module_status(
			array(
				'slug'   => '0',
				'active' => true,
			)
		);
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_boost_invalid_slug', $result->get_error_code() );
	}

	public function test_set_module_status_disable_on_always_on_module_returns_error_without_writing(): void {
		// minify_common implements Is_Always_On and is_available() returns true unconditionally
		// (its parents Minify_JS / Minify_CSS are also unconditionally available).
		$option_name = 'jetpack_boost_status_minify-common';
		delete_option( $option_name );

		$result = Boost_Abilities::set_module_status(
			array(
				'slug'   => 'minify_common',
				'active' => false,
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_boost_module_always_on', $result->get_error_code() );

		// Critical: the option must not have been written. No stale on-disk state.
		$this->assertSame( '__sentinel__', get_option( $option_name, '__sentinel__' ) );
	}

	public function test_set_module_status_enable_on_always_on_module_is_idempotent(): void {
		$result = Boost_Abilities::set_module_status(
			array(
				'slug'   => 'minify_common',
				'active' => true,
			)
		);

		$this->assertIsArray( $result );
		$this->assertTrue( $result['active'] );
		$this->assertFalse( $result['changed'], 'Always-on modules report changed=false on enable.' );
	}

	public function test_set_module_status_toggles_then_is_idempotent(): void {
		// Slug uses underscores; option name maps underscores → dashes (see Lib\Status).
		$slug        = 'render_blocking_js';
		$option_name = 'jetpack_boost_status_render-blocking-js';

		delete_option( $option_name );

		$first = Boost_Abilities::set_module_status(
			array(
				'slug'   => $slug,
				'active' => true,
			)
		);
		$this->assertIsArray( $first );
		$this->assertSame( array( 'slug', 'active', 'changed' ), array_keys( $first ), 'Response shape must match Jetpack: { slug, active, changed }.' );
		$this->assertTrue( $first['active'], 'Module should now be active.' );
		$this->assertTrue( $first['changed'], 'First flip from inactive to active must report changed=true.' );

		$second = Boost_Abilities::set_module_status(
			array(
				'slug'   => $slug,
				'active' => true,
			)
		);
		$this->assertIsArray( $second );
		$this->assertSame( array( 'slug', 'active', 'changed' ), array_keys( $second ) );
		$this->assertTrue( $second['active'] );
		$this->assertFalse( $second['changed'], 'Second call with the same desired state must be a no-op.' );

		delete_option( $option_name );
	}

	public function test_set_module_status_returns_error_when_update_option_fails(): void {
		$slug        = 'minify_css';
		$option_name = 'jetpack_boost_status_minify-css';
		update_option( $option_name, false );

		// Force update_option to no-op: returning $old_value makes WordPress treat the write as a same-value update.
		$short_circuit = static function ( $_value, $old_value ) {
			return $old_value;
		};
		add_filter( "pre_update_option_{$option_name}", $short_circuit, 10, 2 );

		$action_calls = 0;
		$counter      = function () use ( &$action_calls ) {
			++$action_calls;
		};
		add_action( 'jetpack_boost_module_status_updated', $counter );

		$result = Boost_Abilities::set_module_status(
			array(
				'slug'   => $slug,
				'active' => true,
			)
		);

		remove_action( 'jetpack_boost_module_status_updated', $counter );
		remove_filter( "pre_update_option_{$option_name}", $short_circuit, 10 );
		delete_option( $option_name );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_boost_module_update_failed', $result->get_error_code() );
		$this->assertSame( 0, $action_calls, 'jetpack_boost_module_status_updated must not fire when the write fails.' );
	}

	public function test_set_module_status_fires_status_updated_action_on_change(): void {
		$slug        = 'minify_js';
		$option_name = 'jetpack_boost_status_minify-js';
		delete_option( $option_name );

		$captured_slug   = null;
		$captured_active = null;
		$call_count      = 0;
		$callback        = function ( $module_slug, $is_active ) use ( &$captured_slug, &$captured_active, &$call_count ) {
			$captured_slug   = $module_slug;
			$captured_active = $is_active;
			++$call_count;
		};
		add_action( 'jetpack_boost_module_status_updated', $callback, 10, 2 );

		Boost_Abilities::set_module_status(
			array(
				'slug'   => $slug,
				'active' => true,
			)
		);

		remove_action( 'jetpack_boost_module_status_updated', $callback );
		delete_option( $option_name );

		$this->assertSame( 1, $call_count, 'Toggle must emit jetpack_boost_module_status_updated exactly once so submodule lifecycle still runs.' );
		$this->assertSame( $slug, $captured_slug );
		$this->assertTrue( $captured_active );
	}

	/** -------------------- get_speed_score -------------------- */
	public function test_get_speed_score_with_no_history_returns_null_scores(): void {
		// Make sure no history option is present for this URL.
		global $wpdb;
		$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE 'jetpack_boost_speed_score_history_%'" );

		$result = Boost_Abilities::get_speed_score();
		$this->assertNull( $result['mobile'] );
		$this->assertNull( $result['desktop'] );
		$this->assertNull( $result['timestamp'] );
		// "is_stale" describes "older than 24 hours / invalidated" — neither applies before any
		// score has been recorded. has_history=false carries the "no score yet" signal.
		$this->assertFalse( $result['is_stale'] );
		$this->assertFalse( $result['has_history'] );
	}

	public function test_get_speed_score_returns_latest_entry_when_present(): void {
		$timestamp = time();

		// Mirror the storage shape that Speed_Score_Request::record_history() writes.
		$history = new \Automattic\Jetpack\Boost_Speed_Score\Speed_Score_History( home_url() );
		$history->push(
			array(
				'timestamp' => $timestamp,
				'scores'    => array(
					'mobile'  => 88,
					'desktop' => 95,
				),
				'theme'     => 'Test Theme',
			)
		);

		$result = Boost_Abilities::get_speed_score();
		$this->assertSame( 88, $result['mobile'] );
		$this->assertSame( 95, $result['desktop'] );
		$this->assertSame( $timestamp, $result['timestamp'] );
		$this->assertTrue( $result['has_history'] );
		$this->assertFalse( $result['is_stale'], 'Score recorded just now must not be stale.' );
	}

	/** -------------------- clear_page_cache -------------------- */
	public function test_clear_page_cache_returns_error_when_module_inactive(): void {
		// Page cache module is not enabled by default. Status option name uses dashes (see Lib\Status).
		delete_option( 'jetpack_boost_status_page-cache' );

		$result = Boost_Abilities::clear_page_cache();
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_boost_page_cache_inactive', $result->get_error_code() );
	}
}
