<?php
/**
 * Gutenberg RTC Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/gutenberg-rtc/gutenberg-rtc.php';
use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Tests for Gutenberg RTC feature.
 *
 * @covers ::wpcom_disable_rtc_option
 * @covers ::wpcom_enqueue_gutenberg_rtc_assets
 * @covers ::wpcom_get_gutenberg_rtc_providers
 * @covers ::wpcom_is_gutenberg_rtc_enabled
 * @covers ::wpcom_unregister_rtc_setting
 */
#[CoversFunction( 'wpcom_is_gutenberg_rtc_enabled' )]
#[CoversFunction( 'wpcom_get_gutenberg_rtc_providers' )]
#[CoversFunction( 'wpcom_enqueue_gutenberg_rtc_assets' )]
#[CoversFunction( 'wpcom_unregister_rtc_setting' )]
#[CoversFunction( 'wpcom_disable_rtc_option' )]
class Gutenberg_RTC_Test extends \WorDBless\BaseTestCase {

	/**
	 * Clean up filters after each test.
	 */
	public function tear_down(): void {
		remove_all_filters( 'wpcom_is_gutenberg_rtc_enabled' );
		remove_all_filters( 'wpcom_gutenberg_rtc_providers' );
		parent::tear_down();
	}

	/**
	 * Tests whether the gutenberg-rtc assets enqueue function is hooked correctly.
	 */
	public function test_wpcom_enqueue_gutenberg_rtc_assets_hooked() {
		$this->assertSame( 10, has_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_gutenberg_rtc_assets' ) );
	}

	/**
	 * Tests whether the unregister RTC setting function is hooked to admin_init.
	 */
	public function test_wpcom_unregister_rtc_setting_hooked() {
		$this->assertSame( 11, has_action( 'admin_init', 'wpcom_unregister_rtc_setting' ) );
	}

	/**
	 * Tests whether the disable RTC option filters are hooked.
	 */
	public function test_wpcom_disable_rtc_option_hooked() {
		$this->assertSame( 10, has_filter( 'pre_option_wp_enable_real_time_collaboration', 'wpcom_disable_rtc_option' ) );
		$this->assertSame( 10, has_filter( 'pre_option_enable_real_time_collaboration', 'wpcom_disable_rtc_option' ) );
	}

	/**
	 * Tests that RTC is disabled by default.
	 */
	public function test_wpcom_is_gutenberg_rtc_enabled_default() {
		$this->assertFalse( wpcom_is_gutenberg_rtc_enabled() );
	}

	/**
	 * Tests that RTC can be enabled via filter.
	 */
	public function test_wpcom_is_gutenberg_rtc_enabled_via_filter() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		$this->assertTrue( wpcom_is_gutenberg_rtc_enabled() );
	}

	/**
	 * Tests that providers returns an empty array when RTC is disabled.
	 */
	public function test_wpcom_get_gutenberg_rtc_providers_empty_when_disabled() {
		$this->assertSame( array(), wpcom_get_gutenberg_rtc_providers() );
	}

	/**
	 * Tests that providers filter is not applied when RTC is disabled.
	 */
	public function test_wpcom_get_gutenberg_rtc_providers_ignores_filter_when_disabled() {
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		$this->assertSame( array(), wpcom_get_gutenberg_rtc_providers() );
	}

	/**
	 * Tests that providers are returned when RTC is enabled.
	 */
	public function test_wpcom_get_gutenberg_rtc_providers_returns_providers_when_enabled() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		$this->assertSame( array( 'pinghub' ), wpcom_get_gutenberg_rtc_providers() );
	}

	/**
	 * Tests that wpcom_disable_rtc_option returns '0' when no providers.
	 */
	public function test_wpcom_disable_rtc_option_returns_zero_when_no_providers() {
		$this->assertSame( '0', wpcom_disable_rtc_option() );
	}

	/**
	 * Tests that wpcom_disable_rtc_option returns false when providers exist (allowing the real option value through).
	 */
	public function test_wpcom_disable_rtc_option_returns_false_when_providers_exist() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		$this->assertFalse( wpcom_disable_rtc_option() );
	}

	/**
	 * Tests that wpcom_unregister_rtc_setting removes the setting when no providers.
	 */
	public function test_wpcom_unregister_rtc_setting_removes_when_no_providers() {
		global $wp_settings_fields;

		// Set up a fake settings field for both option names.
		$wp_settings_fields['writing']['default']['wp_enable_real_time_collaboration'] = array( 'id' => 'wp_enable_real_time_collaboration' );
		$wp_settings_fields['writing']['default']['enable_real_time_collaboration']    = array( 'id' => 'enable_real_time_collaboration' );

		wpcom_unregister_rtc_setting();

		$this->assertArrayNotHasKey( 'wp_enable_real_time_collaboration', $wp_settings_fields['writing']['default'] );
		$this->assertArrayNotHasKey( 'enable_real_time_collaboration', $wp_settings_fields['writing']['default'] );
	}

	/**
	 * Tests that wpcom_unregister_rtc_setting keeps the setting when providers exist.
	 */
	public function test_wpcom_unregister_rtc_setting_keeps_when_providers_exist() {
		global $wp_settings_fields;

		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		$wp_settings_fields['writing']['default']['wp_enable_real_time_collaboration'] = array( 'id' => 'wp_enable_real_time_collaboration' );
		$wp_settings_fields['writing']['default']['enable_real_time_collaboration']    = array( 'id' => 'enable_real_time_collaboration' );

		wpcom_unregister_rtc_setting();

		$this->assertArrayHasKey( 'wp_enable_real_time_collaboration', $wp_settings_fields['writing']['default'] );
		$this->assertArrayHasKey( 'enable_real_time_collaboration', $wp_settings_fields['writing']['default'] );
	}

	/**
	 * Tests that wpcom_unregister_rtc_setting does not error when settings fields are not set.
	 */
	public function test_wpcom_unregister_rtc_setting_handles_missing_fields() {
		global $wp_settings_fields;

		$wp_settings_fields = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		// Should not throw any errors.
		wpcom_unregister_rtc_setting();

		$this->assertSame( array(), $wp_settings_fields );
	}
}
