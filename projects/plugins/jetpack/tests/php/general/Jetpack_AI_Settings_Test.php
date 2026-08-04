<?php
/**
 * Tests for the Jetpack_AI_Settings gate/option registry.
 *
 * The contract worth locking down: the master-gate callback is restrictive-only
 * (it may turn a yes into a no, never the reverse, because jetpack_ai_enabled is
 * applied with different defaults at different call sites), the host gate
 * (WP_AI_SUPPORT / wp_supports_ai()) and master option flow into every AI filter,
 * and per-feature toggles honor their options, filters, and parent dependencies.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Class Jetpack_AI_Settings_Test
 *
 * @covers \Jetpack_AI_Settings
 */
#[CoversClass( Jetpack_AI_Settings::class )]
class Jetpack_AI_Settings_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset the options and filters this test touches.
	 */
	public function tear_down() {
		delete_option( Jetpack_AI_Settings::MASTER_OPTION );
		foreach ( Jetpack_AI_Settings::FEATURE_OPTIONS as $option ) {
			delete_option( $option );
		}
		remove_filter( 'jetpack_ai_writing_assistant_enabled', '__return_false' );
		remove_filter( 'wp_supports_ai', '__return_false' );
		remove_filter( 'jetpack_ai_enabled', '__return_true', PHP_INT_MAX );
		remove_filter( 'jetpack_ai_enabled', '__return_true', 11 );
		Constants::clear_single_constant( 'IS_WPCOM' );

		parent::tear_down();
	}

	/**
	 * Loading the settings class registers every master-gate filter.
	 */
	public function test_class_self_initializes_on_load() {
		$callback = array( Jetpack_AI_Settings::class, 'apply_master_gates' );

		$this->assertNotFalse( has_filter( 'jetpack_ai_enabled', $callback ) );
		$this->assertNotFalse( has_filter( 'jetpack_search_ai_answers_enabled', $callback ) );
		$this->assertNotFalse( has_filter( 'jetpack_ai_sidebar_enabled', $callback ) );
	}

	/**
	 * The master gate must never turn a no into a yes: call sites pass their own
	 * computed default (false on plain self-hosted sites in Jetpack_AI_Helper).
	 */
	public function test_master_gate_is_restrictive_only() {
		// Defaults: host allows, master option unset (defaults on).
		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', false ), 'A call-site false must survive the gate.' );
		$this->assertTrue( apply_filters( 'jetpack_ai_enabled', true ), 'A call-site true must pass when every gate is open.' );
	}

	/**
	 * Master option off turns off every AI filter the settings class guards.
	 */
	public function test_master_option_off_disables_ai_filters() {
		update_option( Jetpack_AI_Settings::MASTER_OPTION, 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_master_enabled() );
		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', true ) );
		$this->assertFalse( apply_filters( 'jetpack_search_ai_answers_enabled', true ) );
		$this->assertFalse( apply_filters( 'jetpack_ai_sidebar_enabled', true ) );
	}

	/**
	 * The master gate is final in is_ai_enabled(). A callback registered at the
	 * latest possible priority can override the in-chain gate callback — that
	 * bypass is exactly why the helper exists — but it must not get past the
	 * helper's hard AND.
	 */
	public function test_is_ai_enabled_master_gate_is_final() {
		update_option( Jetpack_AI_Settings::MASTER_OPTION, 0 );
		add_filter( 'jetpack_ai_enabled', '__return_true', PHP_INT_MAX );

		$this->assertTrue( apply_filters( 'jetpack_ai_enabled', true ), 'Precondition: a late callback overrides the in-chain gate.' );
		$this->assertFalse( Jetpack_AI_Settings::is_ai_enabled(), 'The helper must keep AI off while the master option is off.' );
	}

	/**
	 * The host gate is final in is_ai_enabled() too.
	 */
	public function test_is_ai_enabled_host_gate_is_final() {
		if ( ! function_exists( 'wp_supports_ai' ) ) {
			$this->markTestSkipped( 'wp_supports_ai() is not available in this WordPress version.' );
		}

		add_filter( 'wp_supports_ai', '__return_false' );
		add_filter( 'jetpack_ai_enabled', '__return_true', PHP_INT_MAX );

		$this->assertFalse( Jetpack_AI_Settings::is_ai_enabled(), 'The helper must keep AI off while the host disallows it.' );
	}

	/**
	 * The helper forwards the call-site default into the filter, keeping
	 * the restrictive-only contract: a self-hosted default of false must never
	 * come back true just because every gate happens to be open.
	 */
	public function test_is_ai_enabled_respects_call_site_default() {
		$this->assertFalse( Jetpack_AI_Settings::is_ai_enabled( false ), 'A call-site false must survive open gates.' );
		$this->assertTrue( Jetpack_AI_Settings::is_ai_enabled( true ) );
		$this->assertTrue( Jetpack_AI_Settings::is_ai_enabled(), 'The default parameter is true.' );
	}

	/**
	 * The filter chain still runs inside is_ai_enabled(): a callback may enable AI
	 * from a false default — the gates only ever subtract.
	 */
	public function test_is_ai_enabled_filter_can_enable_when_gates_open() {
		add_filter( 'jetpack_ai_enabled', '__return_true', 11 );

		$this->assertTrue( Jetpack_AI_Settings::is_ai_enabled( false ) );
	}

	/**
	 * Host gate via core's wp_supports_ai(), when this WordPress version has it.
	 */
	public function test_host_gate_via_wp_supports_ai() {
		if ( ! function_exists( 'wp_supports_ai' ) ) {
			$this->markTestSkipped( 'wp_supports_ai() is not available in this WordPress version.' );
		}

		add_filter( 'wp_supports_ai', '__return_false' );

		$this->assertFalse( Jetpack_AI_Settings::host_allows_ai() );
		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', true ) );
	}

	/**
	 * Host gate via the WP_AI_SUPPORT constant, for WordPress versions that
	 * predate wp_supports_ai(). Separate process so the constant does not leak.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_host_gate_via_constant() {
		if ( function_exists( 'wp_supports_ai' ) ) {
			$this->markTestSkipped( 'wp_supports_ai() exists here; the constant fallback path is not reachable.' );
		}

		define( 'WP_AI_SUPPORT', false );

		$this->assertFalse( Jetpack_AI_Settings::host_allows_ai() );
		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', true ) );
	}

	/**
	 * Per-feature defaults: the new toggles default on; the reused SEO/Search
	 * options keep their established opt-in (off) defaults; unknown keys are off.
	 */
	public function test_feature_defaults() {
		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'writing_assistant' ) );
		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'image_editor' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'seo_enhancer' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'ai_search' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'no_such_feature' ) );
	}

	/**
	 * A feature's option turns it off.
	 */
	public function test_feature_option_off() {
		update_option( 'jetpack_ai_writing_assistant_enabled', 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'writing_assistant' ) );
	}

	/**
	 * WordPress.com Simple has no per-feature toggles: the options Jetpack owns
	 * are ignored there, so a stored `off` cannot switch a feature off. Simple
	 * keeps the existing wp.com settings contract instead.
	 */
	public function test_owned_features_ignore_their_option_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		foreach ( Jetpack_AI_Settings::OWNED_FEATURES as $feature ) {
			update_option( Jetpack_AI_Settings::FEATURE_OPTIONS[ $feature ], 0 );

			$this->assertTrue(
				Jetpack_AI_Settings::is_feature_enabled( $feature ),
				"$feature should stay on for WordPress.com Simple"
			);
		}
	}

	/**
	 * The Simple carve-out is scoped to the features Jetpack owns. SEO and
	 * Search reuse pre-existing options that keep their own controls on Simple,
	 * so their values must still be honored there.
	 */
	public function test_reused_features_still_read_their_option_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		// Off must stay off: a carve-out that returned true for every feature
		// would switch these on for Simple.
		update_option( 'ai_seo_enhancer_enabled', 0 );
		update_option( 'jetpack_search_ai_answers_enabled', 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'seo_enhancer' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'ai_search' ) );

		// ...and on must stay on, so the value is genuinely read rather than
		// hardcoded in either direction.
		update_option( 'ai_seo_enhancer_enabled', 1 );
		update_option( 'jetpack_search_ai_answers_enabled', 1 );

		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'seo_enhancer' ) );
		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'ai_search' ) );
	}

	/**
	 * Off Simple the same option still switches the feature off.
	 */
	public function test_owned_features_honor_their_option_off_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', false );

		update_option( 'jetpack_ai_image_editor_enabled', 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'image_editor' ) );
	}

	/**
	 * The master switch and the owned per-feature options sync to WordPress.com.
	 */
	public function test_sync_options_whitelist() {
		$whitelist = apply_filters( 'jetpack_sync_options_whitelist', array() );

		$this->assertContains( 'jetpack_ai_enabled', $whitelist );
		$this->assertContains( 'jetpack_ai_writing_assistant_enabled', $whitelist );
		$this->assertContains( 'jetpack_ai_image_editor_enabled', $whitelist );
		$this->assertNotContains( 'jetpack_ai_image_label_enabled', $whitelist );
	}

	/**
	 * The owned options are registered (register_setting on init).
	 */
	public function test_options_are_registered() {
		Jetpack_AI_Settings::register_settings();

		$registered = get_registered_settings();

		$this->assertArrayHasKey( 'jetpack_ai_enabled', $registered );
		$this->assertArrayHasKey( 'jetpack_ai_writing_assistant_enabled', $registered );
		$this->assertArrayHasKey( 'jetpack_ai_image_editor_enabled', $registered );
		$this->assertArrayNotHasKey( 'jetpack_ai_image_label_enabled', $registered );
	}
}
