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

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

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
		$required = array( 'label', 'description', 'input_schema', 'execute_callback', 'permission_callback', 'meta' );
		foreach ( Boost_Abilities::get_abilities() as $slug => $spec ) {
			foreach ( $required as $key ) {
				$this->assertArrayHasKey( $key, $spec, "Ability {$slug} missing key {$key}." );
			}
			$this->assertArrayHasKey( 'annotations', $spec['meta'] );
			$this->assertArrayHasKey( 'show_in_rest', $spec['meta'] );
			$this->assertArrayHasKey( 'additionalProperties', $spec['input_schema'] );
			$this->assertFalse( $spec['input_schema']['additionalProperties'], "Ability {$slug} input_schema must set additionalProperties: false." );
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
		// Spy assertions key off should_register(), which Registrar guards behind
		// function_exists() checks for the WP 6.9+ Abilities API surface.
		if ( ! function_exists( 'wp_register_ability_category' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available (WP < 6.9).' );
		}

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
		if ( ! function_exists( 'wp_get_abilities' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available (WP < 6.9).' );
		}

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
		if ( ! function_exists( 'wp_get_abilities' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available (WP < 6.9).' );
		}

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
		if ( ! function_exists( 'wp_get_abilities' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available (WP < 6.9).' );
		}

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

	/** -------------------- New ability surface -------------------- */
	public function test_new_abilities_are_in_get_abilities_map(): void {
		$abilities = Boost_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-boost/regenerate-critical-css', $abilities );
		$this->assertArrayHasKey( 'jetpack-boost/get-critical-css-status', $abilities );
		$this->assertArrayHasKey( 'jetpack-boost/get-page-cache-status', $abilities );
	}

	public function test_new_status_abilities_are_marked_readonly_and_idempotent(): void {
		$abilities = Boost_Abilities::get_abilities();
		foreach ( array( 'jetpack-boost/get-critical-css-status', 'jetpack-boost/get-page-cache-status' ) as $slug ) {
			$this->assertTrue( $abilities[ $slug ]['meta']['annotations']['readonly'], "{$slug} must be readonly." );
			$this->assertTrue( $abilities[ $slug ]['meta']['annotations']['idempotent'], "{$slug} must be idempotent." );
			$this->assertFalse( $abilities[ $slug ]['meta']['annotations']['destructive'], "{$slug} must not be destructive." );
		}
	}

	public function test_regenerate_critical_css_annotations(): void {
		$abilities   = Boost_Abilities::get_abilities();
		$annotations = $abilities['jetpack-boost/regenerate-critical-css']['meta']['annotations'];
		$this->assertFalse( $annotations['readonly'], 'regenerate-critical-css is a write surface.' );
		$this->assertFalse( $annotations['destructive'], 'No user data is destroyed.' );
		// Idempotency is contractual — re-dispatch while running must return already_running, not queue a 2nd run.
		$this->assertTrue( $annotations['idempotent'] );
	}

	/** -------------------- regenerate_critical_css -------------------- */
	public function test_regenerate_critical_css_requires_module_active(): void {
		// Neither critical_css nor cloud_css is enabled by default; default status options should be missing.
		delete_option( 'jetpack_boost_status_critical-css' );
		delete_option( 'jetpack_boost_status_cloud-css' );

		$result = Boost_Abilities::regenerate_critical_css();
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_boost_critical_css_inactive', $result->get_error_code() );
	}

	public function test_regenerate_critical_css_is_idempotent_while_running(): void {
		// Enable critical_css so the activation gate passes.
		update_option( 'jetpack_boost_status_critical-css', true );

		// Make sure the DS registry knows about critical_css_state so the state object can read it.
		self::ensure_critical_css_state_registered();
		jetpack_boost_ds_set(
			'critical_css_state',
			array(
				'status'    => 'pending',
				'providers' => array(
					array(
						'key'           => 'core_front_page',
						'label'         => 'Front Page',
						'urls'          => array( home_url() ),
						'success_ratio' => 0.0,
						'status'        => 'pending',
					),
				),
				'created'   => microtime( true ),
				'updated'   => microtime( true ),
			)
		);

		$result = Boost_Abilities::regenerate_critical_css();

		// Cleanup before assertions so a failure mid-test doesn't leak state.
		jetpack_boost_ds_delete( 'critical_css_state' );
		delete_option( 'jetpack_boost_status_critical-css' );

		$this->assertIsArray( $result );
		$this->assertFalse( $result['dispatched'], 'A second dispatch while running must not re-queue.' );
		$this->assertSame( 'already_running', $result['status'] );
		$this->assertIsString( $result['job_id'], 'job_id must be a stable string when a run is in flight.' );
	}

	/** -------------------- get_critical_css_status -------------------- */
	public function test_get_critical_css_status_returns_not_generated_when_no_state(): void {
		// Without DS registration the state read returns null; that's the "no run yet" shape.
		$result = Boost_Abilities::get_critical_css_status();
		$this->assertSame( 'not_generated', $result['status'] );
		$this->assertNull( $result['generated_at'] );
		$this->assertSame( 0, $result['provider_count'] );
		$this->assertSame( array(), $result['providers'] );
		$this->assertFalse( $result['stale'] );
	}

	public function test_get_critical_css_status_returns_per_provider_outcomes(): void {
		self::ensure_critical_css_state_registered();

		$now = microtime( true );
		jetpack_boost_ds_set(
			'critical_css_state',
			array(
				'status'    => 'generated',
				'providers' => array(
					array(
						'key'           => 'core_front_page',
						'label'         => 'Front Page',
						'urls'          => array( home_url() ),
						'success_ratio' => 1.0,
						'status'        => 'success',
					),
					array(
						'key'           => 'singular_page',
						'label'         => 'Singular Page',
						'urls'          => array( home_url( '/about' ) ),
						'success_ratio' => 0.0,
						'status'        => 'error',
						'errors'        => array(
							array(
								'url'     => home_url( '/about' ),
								'message' => 'Timeout while loading page',
								'type'    => 'HttpError',
							),
						),
					),
				),
				'created'   => $now - 5,
				'updated'   => $now,
			)
		);

		$result = Boost_Abilities::get_critical_css_status();

		jetpack_boost_ds_delete( 'critical_css_state' );

		$this->assertSame( 'generated', $result['status'] );
		$this->assertIsInt( $result['generated_at'] );
		$this->assertSame( 2, $result['provider_count'] );
		$this->assertCount( 2, $result['providers'] );

		// Index by provider_id for stable assertions independent of array order.
		$by_id = array();
		foreach ( $result['providers'] as $entry ) {
			$by_id[ $entry['provider_id'] ] = $entry;
		}
		$this->assertTrue( $by_id['core_front_page']['success'] );
		$this->assertNull( $by_id['core_front_page']['error_message'] );
		$this->assertFalse( $by_id['singular_page']['success'] );
		$this->assertSame( 'Timeout while loading page', $by_id['singular_page']['error_message'] );
	}

	public function test_get_critical_css_status_reports_stale_when_suggest_regenerate_set(): void {
		self::ensure_critical_css_state_registered();
		self::ensure_suggest_regenerate_registered();

		jetpack_boost_ds_set(
			'critical_css_state',
			array(
				'status'    => 'generated',
				'providers' => array(),
				'created'   => microtime( true ),
				'updated'   => microtime( true ),
			)
		);
		jetpack_boost_ds_set( 'critical_css_suggest_regenerate', 'switched_theme' );

		$result = Boost_Abilities::get_critical_css_status();

		jetpack_boost_ds_delete( 'critical_css_state' );
		jetpack_boost_ds_delete( 'critical_css_suggest_regenerate' );

		$this->assertTrue( $result['stale'], 'When suggest_regenerate is set, stale must be true.' );
	}

	/** -------------------- get_page_cache_status -------------------- */
	public function test_get_page_cache_status_inactive_when_module_disabled(): void {
		delete_option( 'jetpack_boost_status_page-cache' );

		$result = Boost_Abilities::get_page_cache_status();
		$this->assertIsArray( $result );
		$this->assertFalse( $result['active'], 'Page cache must report inactive when the module is disabled.' );
		$this->assertIsArray( $result['bypass_cookies'] );
		// last_cleared_at is a reserved field — always null until Boost tracks it.
		$this->assertNull( $result['last_cleared_at'] );
	}

	public function test_get_page_cache_status_returns_null_size_when_cache_dir_missing(): void {
		// When the boost-cache directory doesn't exist for this host, size/count are null
		// (distinct from "0" — the consumer can tell "no cache" from "empty cache").
		$result = Boost_Abilities::get_page_cache_status();
		$this->assertNull( $result['cache_size_bytes'] );
		$this->assertNull( $result['file_count'] );
	}

	public function test_get_page_cache_status_output_matches_schema_keys(): void {
		$result   = Boost_Abilities::get_page_cache_status();
		$expected = array( 'active', 'bypass_cookies', 'cache_size_bytes', 'file_count', 'last_cleared_at' );
		$this->assertSame( $expected, array_keys( $result ), 'Page-cache status payload keys must match the documented order.' );
	}

	/** -------------------- helpers -------------------- */

	/**
	 * Lazy-register the `critical_css_state` DS entry so tests that need to seed it
	 * via jetpack_boost_ds_set() can do so without booting the full plugin.
	 */
	private static function ensure_critical_css_state_registered(): void {
		if ( null !== jetpack_boost_ds_entry( 'critical_css_state' ) ) {
			return;
		}
		jetpack_boost_register_option(
			'critical_css_state',
			\Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync\Data_Sync_Schema::critical_css_state()
		);
	}

	/**
	 * Lazy-register `critical_css_suggest_regenerate` for the stale-flag tests.
	 */
	private static function ensure_suggest_regenerate_registered(): void {
		if ( null !== jetpack_boost_ds_entry( 'critical_css_suggest_regenerate' ) ) {
			return;
		}
		jetpack_boost_register_option(
			'critical_css_suggest_regenerate',
			\Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync\Data_Sync_Schema::critical_css_suggest_regenerate()
		);
	}
}
