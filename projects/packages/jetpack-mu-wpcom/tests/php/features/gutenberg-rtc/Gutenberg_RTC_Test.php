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
 * @covers ::wpcom_enqueue_gutenberg_rtc_assets
 * @covers ::wpcom_get_gutenberg_rtc_providers
 * @covers ::wpcom_is_gutenberg_rtc_enabled
 * @covers ::wpcom_unregister_rtc_setting
 * @covers ::wpcom_filter_rtc_option
 * @covers ::wpcom_default_rtc_option
 * @covers ::wpcom_override_rtc_setting_default
 */
#[CoversFunction( 'wpcom_is_gutenberg_rtc_enabled' )]
#[CoversFunction( 'wpcom_get_gutenberg_rtc_providers' )]
#[CoversFunction( 'wpcom_enqueue_gutenberg_rtc_assets' )]
#[CoversFunction( 'wpcom_unregister_rtc_setting' )]
#[CoversFunction( 'wpcom_filter_rtc_option' )]
#[CoversFunction( 'wpcom_default_rtc_option' )]
#[CoversFunction( 'wpcom_override_rtc_setting_default' )]
class Gutenberg_RTC_Test extends \WorDBless\BaseTestCase {

	/**
	 * Original value of $wp_settings_fields to restore after each test.
	 *
	 * @var mixed
	 */
	private $original_wp_settings_fields;

	/**
	 * Original WP_Scripts instance to restore after each test.
	 *
	 * @var \WP_Scripts|null
	 */
	private $original_wp_scripts;

	/**
	 * Original WP_Styles instance to restore after each test.
	 *
	 * @var \WP_Styles|null
	 */
	private $original_wp_styles;

	/**
	 * Save global state before each test.
	 */
	public function set_up(): void {
		parent::set_up();
		global $wp_settings_fields, $wp_scripts, $wp_styles;
		$this->original_wp_settings_fields = $wp_settings_fields;
		$this->original_wp_scripts         = $wp_scripts;
		$this->original_wp_styles          = $wp_styles;
	}

	/**
	 * Clean up filters and restore global state after each test.
	 */
	public function tear_down(): void {
		global $wp_settings_fields, $wp_scripts, $wp_styles;
		$wp_settings_fields = $this->original_wp_settings_fields; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_scripts         = $this->original_wp_scripts; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_styles          = $this->original_wp_styles; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
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
	 * Tests whether the filter RTC option function is hooked to the option filters.
	 */
	public function test_wpcom_filter_rtc_option_hooked() {
		$this->assertSame( 10, has_filter( 'option_wp_enable_real_time_collaboration', 'wpcom_filter_rtc_option' ) );
		$this->assertSame( 10, has_filter( 'option_enable_real_time_collaboration', 'wpcom_filter_rtc_option' ) );
	}

	/**
	 * Tests that wpcom_filter_rtc_option forces the option to '0' when there are no providers.
	 */
	public function test_wpcom_filter_rtc_option_forces_zero_without_providers() {
		// By default, RTC is disabled and providers list is empty.
		$this->assertSame( '0', wpcom_filter_rtc_option( '1' ) );
	}

	/**
	 * Tests that wpcom_filter_rtc_option respects the stored value when providers exist.
	 */
	public function test_wpcom_filter_rtc_option_respects_value_with_providers() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		$this->assertSame( '1', wpcom_filter_rtc_option( '1' ) );
		$this->assertSame( '0', wpcom_filter_rtc_option( '0' ) );
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
	 * Tests that unknown providers are filtered out by the allowlist.
	 */
	public function test_wpcom_get_gutenberg_rtc_providers_filters_unknown_providers() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'pinghub', 'unknown-provider', 'http-polling' );
			}
		);

		$this->assertSame( array( 'pinghub', 'http-polling' ), wpcom_get_gutenberg_rtc_providers() );
	}

	/**
	 * Tests that a non-array filter return is handled gracefully.
	 */
	public function test_wpcom_get_gutenberg_rtc_providers_handles_non_array_filter() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return 'pinghub';
			}
		);

		$this->assertSame( array(), wpcom_get_gutenberg_rtc_providers() );
	}

	/**
	 * Tests that all unknown providers are removed and result is re-indexed.
	 */
	public function test_wpcom_get_gutenberg_rtc_providers_reindexes_after_filtering() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'unknown', 'pinghub' );
			}
		);

		// array_values should re-index so 'pinghub' is at index 0, not 1.
		$result = wpcom_get_gutenberg_rtc_providers();
		$this->assertSame( array( 'pinghub' ), $result );
		$this->assertSame( 0, array_key_first( $result ) );
	}

	/**
	 * Tests that an empty array from filter is handled.
	 */
	public function test_wpcom_get_gutenberg_rtc_providers_handles_empty_filter() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array();
			}
		);

		$this->assertSame( array(), wpcom_get_gutenberg_rtc_providers() );
	}

	/**
	 * Tests that the default providers (without filter override) pass the allowlist.
	 */
	public function test_wpcom_get_gutenberg_rtc_providers_default_passes_allowlist() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );

		$this->assertSame( array( 'pinghub' ), wpcom_get_gutenberg_rtc_providers() );
	}

	/**
	 * Tests that enqueue skips when http-polling is the only provider.
	 */
	public function test_wpcom_enqueue_gutenberg_rtc_assets_skips_http_polling_only() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'http-polling' );
			}
		);

		wpcom_enqueue_gutenberg_rtc_assets();

		$this->assertFalse( wp_script_is( 'jetpack-mu-wpcom-gutenberg-rtc', 'enqueued' ) );
	}

	/**
	 * Tests that the script is enqueued when pinghub provider is active.
	 */
	public function test_wpcom_enqueue_gutenberg_rtc_assets_enqueues_when_pinghub() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		wpcom_enqueue_gutenberg_rtc_assets();

		$this->assertTrue( wp_script_is( 'jetpack-mu-wpcom-gutenberg-rtc', 'enqueued' ) );
	}

	/**
	 * Tests that the script is enqueued when multiple providers including non-http-polling are active.
	 */
	public function test_wpcom_enqueue_gutenberg_rtc_assets_enqueues_with_multiple_providers() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'http-polling', 'pinghub' );
			}
		);

		wpcom_enqueue_gutenberg_rtc_assets();

		$this->assertTrue( wp_script_is( 'jetpack-mu-wpcom-gutenberg-rtc', 'enqueued' ) );
	}

	/**
	 * Tests that wpcom_default_rtc_option returns '0' when there are no providers.
	 */
	public function test_wpcom_default_rtc_option_returns_zero_without_providers() {
		// By default, RTC is disabled and providers list is empty.
		$this->assertSame( '0', wpcom_default_rtc_option() );
	}

	/**
	 * Tests that wpcom_default_rtc_option returns '1' when providers exist.
	 */
	public function test_wpcom_default_rtc_option_returns_one_with_providers() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		$this->assertSame( '1', wpcom_default_rtc_option() );
	}

	/**
	 * Tests that the override RTC setting function is hooked to admin_init.
	 */
	public function test_wpcom_override_rtc_setting_default_hooked() {
		$this->assertSame( 20, has_action( 'admin_init', 'wpcom_override_rtc_setting_default' ) );
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
	 * Tests that the inline script data does not include pinghubJWTToken when assets are enqueued.
	 */
	public function test_wpcom_enqueue_gutenberg_rtc_assets_does_not_include_jwt_token() {
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		add_filter(
			'wpcom_gutenberg_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		wpcom_enqueue_gutenberg_rtc_assets();

		$handle = 'jetpack-mu-wpcom-gutenberg-rtc';
		$this->assertTrue( wp_script_is( $handle, 'enqueued' ) );

		// Ensure the inline script does NOT contain pinghubJWTToken.
		$inline_script = wp_scripts()->get_inline_script_data( $handle, 'before' );
		$this->assertStringNotContainsString( 'pinghubJWTToken', $inline_script );
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
