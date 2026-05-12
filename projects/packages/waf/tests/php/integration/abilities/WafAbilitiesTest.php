<?php
/**
 * Tests for the Waf_Abilities Registrar subclass.
 *
 * Exercises:
 * - Gate filter (`jetpack_wp_abilities_enabled`) controlling registration.
 * - Permission callbacks (anonymous / subscriber / admin).
 * - Abstract getter contract and per-spec annotations.
 * - Execute happy paths for `get-mode` and `get-rules-status`, including the
 *   WAF-disabled edge case where the response must keep its documented shape
 *   rather than returning a `WP_Error`.
 *
 * @package automattic/jetpack-waf
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

use Automattic\Jetpack\Waf\Abilities\Waf_Abilities;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use Automattic\Jetpack\Waf\Waf_Runner;
use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Integration tests for Waf_Abilities registration and execution.
 *
 * @covers \Automattic\Jetpack\Waf\Abilities\Waf_Abilities
 */
final class WafAbilitiesTest extends WorDBless\BaseTestCase {

	/**
	 * Admin user id created for permission checks.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user id created for permission checks.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Setup: create the two fixture users and open the abilities gate filter
	 * for the common-case tests. The "gate closed" test removes the filter
	 * explicitly.
	 */
	protected function set_up() {
		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'waf_abilities_admin_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'waf_abilities_sub_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open. Tests that need it closed remove this filter.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Add waf to the available Jetpack modules so Waf_Runner::is_enabled() can resolve.
		add_filter( 'jetpack_get_available_modules', array( $this, 'add_waf_to_available_modules' ), 10, 1 );
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_waf_to_available_modules' ), 10, 1 );

		// Reset any hooks a prior test may have left on the Registrar lifecycle actions.
		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Waf_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Waf_Abilities::class, 'register_abilities' ) );
	}

	/**
	 * Teardown: undo every global filter / hook this test may have touched.
	 */
	protected function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_filter( 'jetpack_get_available_modules', array( $this, 'add_waf_to_available_modules' ), 10 );
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_waf_to_available_modules' ), 10 );
		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Waf_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Waf_Abilities::class, 'register_abilities' ) );

		// Clean up option drift between tests.
		delete_option( Waf_Runner::MODE_OPTION_NAME );
		delete_option( Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME );
		delete_option( Waf_Rules_Manager::AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME );
		delete_option( Waf_Rules_Manager::RULE_LAST_UPDATED_OPTION_NAME );
		delete_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME );
		delete_option( Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME );

		wp_set_current_user( 0 );
	}

	/**
	 * Filter callback: declare "waf" as an available Jetpack module so that
	 * Waf_Runner::is_enabled() can flip true when we activate it.
	 *
	 * @param array $modules Module slugs.
	 * @return array
	 */
	public function add_waf_to_available_modules( $modules ) {
		if ( ! in_array( 'waf', $modules, true ) ) {
			$modules[] = 'waf';
		}
		return $modules;
	}

	/* -------------------- Abstract getters -------------------- */

	public function test_category_slug_is_jetpack_waf() {
		$this->assertSame( 'jetpack-waf', Waf_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = Waf_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertSame( 'Jetpack WAF', $def['label'] );
		$this->assertNotSame( '', $def['description'] );
	}

	public function test_abilities_map_is_namespaced_and_contains_expected_slugs() {
		$abilities = Waf_Abilities::get_abilities();
		$this->assertCount( 2, $abilities );
		$this->assertArrayHasKey( 'jetpack-waf/get-mode', $abilities );
		$this->assertArrayHasKey( 'jetpack-waf/get-rules-status', $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-waf/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Waf_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_spec_declares_required_keys() {
		$required = array( 'label', 'description', 'input_schema', 'execute_callback', 'permission_callback', 'meta' );
		foreach ( Waf_Abilities::get_abilities() as $slug => $spec ) {
			foreach ( $required as $key ) {
				$this->assertArrayHasKey( $key, $spec, "Ability {$slug} missing required key {$key}." );
			}
			$this->assertIsCallable( $spec['execute_callback'], "Ability {$slug} execute_callback must be callable." );
			$this->assertIsCallable( $spec['permission_callback'], "Ability {$slug} permission_callback must be callable." );
			$this->assertArrayHasKey( 'annotations', $spec['meta'] );
			$this->assertArrayHasKey( 'show_in_rest', $spec['meta'] );
			$this->assertFalse(
				$spec['input_schema']['additionalProperties'],
				"Ability {$slug} input_schema must set additionalProperties: false."
			);
		}
	}

	public function test_both_abilities_are_marked_readonly_idempotent_nondestructive() {
		foreach ( Waf_Abilities::get_abilities() as $slug => $spec ) {
			$annotations = $spec['meta']['annotations'];
			$this->assertTrue( $annotations['readonly'], "Ability {$slug} must be readonly." );
			$this->assertTrue( $annotations['idempotent'], "Ability {$slug} must be idempotent." );
			$this->assertFalse( $annotations['destructive'], "Ability {$slug} must not be destructive." );
		}
	}

	/* -------------------- Registrar wiring -------------------- */

	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Waf_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Waf_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Waf_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		Waf_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Waf_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Waf_Abilities::class, 'register_abilities' ) )
		);
	}

	/* -------------------- Permission callbacks -------------------- */

	public function test_admin_can_view_waf() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Waf_Abilities::can_view_waf() );
	}

	public function test_subscriber_cannot_view_waf() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Waf_Abilities::can_view_waf() );
	}

	public function test_anonymous_user_cannot_view_waf() {
		wp_set_current_user( 0 );
		$this->assertFalse( Waf_Abilities::can_view_waf() );
	}

	/* -------------------- Execute: get-mode -------------------- */

	public function test_get_mode_returns_documented_shape_when_module_active_and_normal() {
		Waf_Runner::enable();
		update_option( Waf_Runner::MODE_OPTION_NAME, 'normal' );
		update_option( Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME, '1' );
		update_option( Waf_Rules_Manager::AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME, 1700000000 );
		update_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME, "1.1.1.1\n2.2.2.2" );
		update_option( Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME, '3.3.3.3' );

		$result = Waf_Abilities::get_mode();

		$this->assertSame( 'normal', $result['mode'] );
		$this->assertTrue( $result['automatic_rules_active'] );
		$this->assertSame( 1700000000, $result['automatic_rules_last_update'] );
		$this->assertIsBool( $result['brute_force_protection_active'] );
		$this->assertSame( 2, $result['ip_allow_list_count'] );
		$this->assertSame( 1, $result['ip_block_list_count'] );
	}

	public function test_get_mode_returns_silent_when_mode_option_is_silent() {
		Waf_Runner::enable();
		update_option( Waf_Runner::MODE_OPTION_NAME, 'silent' );

		$this->assertSame( 'silent', Waf_Abilities::get_mode()['mode'] );
	}

	public function test_get_mode_returns_disabled_when_module_inactive() {
		// Module not activated; Waf_Runner::is_enabled() should return false.
		$result = Waf_Abilities::get_mode();

		// Documented shape must be preserved on the disabled branch.
		$this->assertSame( 'disabled', $result['mode'] );
		$this->assertFalse( $result['automatic_rules_active'] );
		$this->assertNull( $result['automatic_rules_last_update'] );
		$this->assertIsBool( $result['brute_force_protection_active'] );
		$this->assertSame( 0, $result['ip_allow_list_count'] );
		$this->assertSame( 0, $result['ip_block_list_count'] );
	}

	public function test_get_mode_returns_disabled_when_mode_option_is_unknown() {
		Waf_Runner::enable();
		update_option( Waf_Runner::MODE_OPTION_NAME, 'bogus-mode' );

		$this->assertSame( 'disabled', Waf_Abilities::get_mode()['mode'] );
	}

	/* -------------------- Execute: get-rules-status -------------------- */

	public function test_get_rules_status_returns_documented_shape_with_timestamps() {
		update_option( Waf_Rules_Manager::AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME, 1700000000 );
		update_option( Waf_Rules_Manager::RULE_LAST_UPDATED_OPTION_NAME, 1700000123 );

		$result = Waf_Abilities::get_rules_status();

		$this->assertArrayHasKey( 'jetpack_waf_automatic_rules_last_updated_timestamp', $result );
		$this->assertArrayHasKey( 'jetpack_waf_last_updated_timestamp', $result );
		$this->assertArrayHasKey( 'standalone_mode', $result );
		$this->assertArrayHasKey( 'rules_file_present', $result );
		$this->assertArrayHasKey( 'rules_file_size', $result );

		$this->assertSame( 1700000000, $result['jetpack_waf_automatic_rules_last_updated_timestamp'] );
		$this->assertSame( 1700000123, $result['jetpack_waf_last_updated_timestamp'] );
		$this->assertIsBool( $result['standalone_mode'] );
		$this->assertIsBool( $result['rules_file_present'] );
	}

	public function test_get_rules_status_collapses_missing_timestamps_to_null() {
		// Neither timestamp option is set. The rules file may or may not exist
		// on disk depending on whether a prior test in the suite ran Waf
		// activation (which writes the entrypoint to JETPACK_WAF_DIR); we
		// only assert on the timestamp branch here. File-presence behaviour
		// is covered by the shape-completeness assertion in
		// test_get_rules_status_returns_documented_shape_with_timestamps.
		$result = Waf_Abilities::get_rules_status();

		$this->assertNull( $result['jetpack_waf_automatic_rules_last_updated_timestamp'] );
		$this->assertNull( $result['jetpack_waf_last_updated_timestamp'] );
		$this->assertIsBool( $result['rules_file_present'] );
		// rules_file_size is integer when the file is present, null when absent.
		if ( $result['rules_file_present'] ) {
			$this->assertIsInt( $result['rules_file_size'] );
		} else {
			$this->assertNull( $result['rules_file_size'] );
		}
	}
}
