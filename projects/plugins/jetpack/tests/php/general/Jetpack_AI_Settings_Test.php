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

		parent::tear_down();
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
		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'image_label' ) );
		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'excerpt' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'seo_enhancer' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'ai_search' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'no_such_feature' ) );
	}

	/**
	 * A feature's option turns it off.
	 */
	public function test_feature_option_off() {
		update_option( 'jetpack_ai_excerpt_enabled', 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'excerpt' ) );
	}

	/**
	 * The owned options stay filterable under their own names as a code-level
	 * kill switch.
	 */
	public function test_feature_filter_kill_switch() {
		add_filter( 'jetpack_ai_writing_assistant_enabled', '__return_false' );

		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'writing_assistant' ) );
	}

	/**
	 * The AI-generated image label is a sub-setting of the image editor.
	 */
	public function test_image_label_requires_image_editor() {
		update_option( 'jetpack_ai_image_label_enabled', 1 );
		update_option( 'jetpack_ai_image_editor_enabled', 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'image_label' ) );
	}

	/**
	 * The master switch and the owned per-feature options sync to WordPress.com.
	 */
	public function test_sync_options_whitelist() {
		$whitelist = apply_filters( 'jetpack_sync_options_whitelist', array() );

		$this->assertContains( 'jetpack_ai_enabled', $whitelist );
		$this->assertContains( 'jetpack_ai_writing_assistant_enabled', $whitelist );
		$this->assertContains( 'jetpack_ai_image_editor_enabled', $whitelist );
		$this->assertContains( 'jetpack_ai_image_label_enabled', $whitelist );
		$this->assertContains( 'jetpack_ai_excerpt_enabled', $whitelist );
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
		$this->assertArrayHasKey( 'jetpack_ai_image_label_enabled', $registered );
		$this->assertArrayHasKey( 'jetpack_ai_excerpt_enabled', $registered );
	}
}
