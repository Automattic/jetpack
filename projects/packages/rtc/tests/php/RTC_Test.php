<?php
/**
 * RTC Package Tests
 *
 * @package automattic/jetpack-rtc
 */

declare( strict_types = 1 );

use Automattic\Jetpack\RTC;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests for the RTC package.
 *
 * @covers \Automattic\Jetpack\RTC
 */
#[CoversClass( RTC::class )]
class RTC_Test extends \WorDBless\BaseTestCase {

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
	 * Original $pagenow value to restore after each test.
	 *
	 * @var string|null
	 */
	private $original_pagenow;

	/**
	 * Save global state before each test.
	 */
	public function set_up(): void {
		parent::set_up();
		global $wp_settings_fields, $wp_scripts, $wp_styles, $pagenow;
		$this->original_wp_settings_fields = $wp_settings_fields;
		$this->original_wp_scripts         = $wp_scripts;
		$this->original_wp_styles          = $wp_styles;
		$this->original_pagenow            = $pagenow;
	}

	/**
	 * Clean up filters and restore global state after each test.
	 */
	public function tear_down(): void {
		global $wp_settings_fields, $wp_scripts, $wp_styles, $pagenow;
		$wp_settings_fields = $this->original_wp_settings_fields;
		$wp_scripts         = $this->original_wp_scripts;
		$wp_styles          = $this->original_wp_styles;
		$pagenow            = $this->original_pagenow;
		remove_all_filters( 'jetpack_rtc_enabled' );
		remove_all_filters( 'jetpack_rtc_providers' );
		foreach ( array( RTC::OPTION_OLD, RTC::OPTION_NEW ) as $option ) {
			remove_all_filters( 'option_' . $option );
			remove_all_filters( 'default_option_' . $option );
			remove_all_filters( 'pre_option_' . $option );
		}

		// Reset the static $initialized flag so hooks are re-registered in the next test.
		$reflection = new \ReflectionProperty( RTC::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$reflection->setValue( null, false );

		parent::tear_down();
	}

	// -------------------------------------------------------------------------
	// Hook registration tests
	// -------------------------------------------------------------------------

	/**
	 * Tests that init always hooks register_providers.
	 */
	public function test_init_hooks_register_providers() {
		RTC::init();
		$this->assertSame( 10, has_action( 'enqueue_block_editor_assets', array( RTC::class, 'register_providers' ) ) );
	}

	/**
	 * Tests that init always hooks rest_api_init.
	 */
	public function test_init_hooks_rest_api_init() {
		RTC::init();
		$this->assertSame( 10, has_action( 'rest_api_init', array( RTC::class, 'register_rest_routes' ) ) );
	}

	/**
	 * Tests that init always hooks unregister_rtc_setting.
	 */
	public function test_init_hooks_unregister_rtc_setting() {
		RTC::init();
		$this->assertSame( 10, has_action( 'load-options-writing.php', array( RTC::class, 'unregister_rtc_setting' ) ) );
	}

	/**
	 * Tests that init always hooks override_rtc_setting_default.
	 */
	public function test_init_hooks_override_rtc_setting_default() {
		RTC::init();
		$this->assertSame( 10, has_action( 'load-options-writing.php', array( RTC::class, 'override_rtc_setting_default' ) ) );
	}

	/**
	 * Tests that init hooks filter_rtc_option on both old and new option filters.
	 */
	public function test_init_hooks_filter_rtc_option() {
		RTC::init();
		$this->assertSame( 10, has_filter( 'option_' . RTC::OPTION_OLD, array( RTC::class, 'filter_rtc_option' ) ) );
		$this->assertSame( 10, has_filter( 'option_' . RTC::OPTION_NEW, array( RTC::class, 'filter_rtc_option' ) ) );
	}

	/**
	 * Tests that init hooks default_rtc_option on both old and new default option filters.
	 */
	public function test_init_hooks_default_rtc_option() {
		RTC::init();
		$this->assertSame( 20, has_filter( 'default_option_' . RTC::OPTION_OLD, array( RTC::class, 'default_rtc_option' ) ) );
		$this->assertSame( 20, has_filter( 'default_option_' . RTC::OPTION_NEW, array( RTC::class, 'default_rtc_option' ) ) );
	}

	/**
	 * Tests that init hooks pre_rtc_option on both old and new pre option filters.
	 */
	public function test_init_hooks_pre_rtc_option() {
		RTC::init();
		$this->assertSame( 10, has_filter( 'pre_option_' . RTC::OPTION_OLD, array( RTC::class, 'pre_rtc_option' ) ) );
		$this->assertSame( 10, has_filter( 'pre_option_' . RTC::OPTION_NEW, array( RTC::class, 'pre_rtc_option' ) ) );
	}

	// -------------------------------------------------------------------------
	// is_allowed tests
	// -------------------------------------------------------------------------

	/**
	 * Tests that RTC is not allowed by default.
	 */
	public function test_is_allowed_default() {
		$this->assertFalse( RTC::is_allowed() );
	}

	/**
	 * Tests that RTC can be allowed via filter.
	 */
	public function test_is_allowed_via_filter() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		$this->assertTrue( RTC::is_allowed() );
	}

	// -------------------------------------------------------------------------
	// is_enabled tests
	// -------------------------------------------------------------------------

	/**
	 * Tests that RTC is disabled when not allowed.
	 */
	public function test_is_enabled_returns_false_when_not_allowed() {
		update_option( RTC::OPTION_NEW, '1' );
		$this->assertFalse( RTC::is_enabled() );
	}

	/**
	 * Tests that RTC is enabled when allowed and the option is on.
	 */
	public function test_is_enabled_returns_true_when_allowed_and_option_enabled() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();
		$this->assertTrue( RTC::is_enabled() );
	}

	/**
	 * Tests that RTC is disabled when allowed but the option is off.
	 */
	public function test_is_enabled_returns_false_when_allowed_but_option_disabled() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		update_option( RTC::OPTION_NEW, '0' );
		$this->assertFalse( RTC::is_enabled() );
	}

	/**
	 * Tests that RTC is disabled in the site editor.
	 */
	public function test_is_enabled_returns_false_in_site_editor() {
		global $pagenow;

		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();

		$pagenow = 'site-editor.php';
		$this->assertFalse( RTC::is_enabled() );
	}

	// -------------------------------------------------------------------------
	// get_providers tests
	// -------------------------------------------------------------------------

	/**
	 * Tests that providers returns an empty array when RTC is disabled.
	 */
	public function test_get_providers_empty_when_disabled() {
		$this->assertSame( array(), RTC::get_providers() );
	}

	/**
	 * Tests that providers filter is not applied when RTC is disabled.
	 */
	public function test_get_providers_ignores_filter_when_disabled() {
		add_filter(
			'jetpack_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		$this->assertSame( array(), RTC::get_providers() );
	}

	/**
	 * Tests that providers are returned when RTC is enabled.
	 */
	public function test_get_providers_returns_providers_when_enabled() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();
		add_filter(
			'jetpack_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		$this->assertSame( array( 'pinghub' ), RTC::get_providers() );
	}

	/**
	 * Tests that unknown providers are filtered out by the allowlist.
	 */
	public function test_get_providers_filters_unknown_providers() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();
		add_filter(
			'jetpack_rtc_providers',
			function () {
				return array( 'pinghub', 'unknown-provider', 'http-polling' );
			}
		);

		$this->assertSame( array( 'pinghub', 'http-polling' ), RTC::get_providers() );
	}

	/**
	 * Tests that a non-array filter return is handled gracefully.
	 */
	public function test_get_providers_handles_non_array_filter() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();
		add_filter(
			'jetpack_rtc_providers',
			function () {
				return 'pinghub';
			}
		);

		$this->assertSame( array(), RTC::get_providers() );
	}

	/**
	 * Tests that all unknown providers are removed and result is re-indexed.
	 */
	public function test_get_providers_reindexes_after_filtering() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();
		add_filter(
			'jetpack_rtc_providers',
			function () {
				return array( 'unknown', 'pinghub' );
			}
		);

		// array_values should re-index so 'pinghub' is at index 0, not 1.
		$result = RTC::get_providers();
		$this->assertSame( array( 'pinghub' ), $result );
		$this->assertSame( 0, array_key_first( $result ) );
	}

	/**
	 * Tests that an empty array from filter is handled.
	 */
	public function test_get_providers_handles_empty_filter() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();
		add_filter(
			'jetpack_rtc_providers',
			function () {
				return array();
			}
		);

		$this->assertSame( array(), RTC::get_providers() );
	}

	/**
	 * Tests that the default providers (without filter override) pass the allowlist.
	 */
	public function test_get_providers_default_passes_allowlist() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();

		$this->assertSame( array( 'pinghub' ), RTC::get_providers() );
	}

	// -------------------------------------------------------------------------
	// register_providers tests
	// -------------------------------------------------------------------------

	/**
	 * Tests that register_providers skips when http-polling is the only provider.
	 */
	public function test_register_providers_skips_http_polling_only() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();
		add_filter(
			'jetpack_rtc_providers',
			function () {
				return array( 'http-polling' );
			}
		);

		RTC::register_providers();

		$this->assertFalse( wp_script_is( 'jetpack-rtc-providers', 'enqueued' ) );
	}

	/**
	 * Tests that the script is enqueued when pinghub provider is active.
	 */
	public function test_register_providers_enqueues_when_pinghub() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();
		add_filter(
			'jetpack_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		RTC::register_providers();

		$this->assertTrue( wp_script_is( 'jetpack-rtc-providers', 'enqueued' ) );
	}

	/**
	 * Tests that the script is enqueued when multiple providers including non-http-polling are active.
	 */
	public function test_register_providers_enqueues_with_multiple_providers() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();
		add_filter(
			'jetpack_rtc_providers',
			function () {
				return array( 'http-polling', 'pinghub' );
			}
		);

		RTC::register_providers();

		$this->assertTrue( wp_script_is( 'jetpack-rtc-providers', 'enqueued' ) );
	}

	/**
	 * Tests that the inline script data does not include pinghubJWTToken when assets are enqueued.
	 */
	public function test_register_providers_does_not_include_jwt_token() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();
		add_filter(
			'jetpack_rtc_providers',
			function () {
				return array( 'pinghub' );
			}
		);

		RTC::register_providers();

		$handle = 'jetpack-rtc-providers';
		$this->assertTrue( wp_script_is( $handle, 'enqueued' ) );

		// Ensure the inline script does NOT contain pinghubJWTToken.
		$inline_script = wp_scripts()->get_inline_script_data( $handle, 'before' );
		$this->assertStringNotContainsString( 'pinghubJWTToken', $inline_script );
	}

	/**
	 * Tests that register_providers skips when RTC is not enabled.
	 */
	public function test_register_providers_skips_when_not_enabled() {
		// Reset scripts to ensure clean state.
		global $wp_scripts;
		$wp_scripts = new \WP_Scripts();

		RTC::register_providers();

		$this->assertFalse( wp_script_is( 'jetpack-rtc-providers', 'enqueued' ) );
	}

	// -------------------------------------------------------------------------
	// unregister_rtc_setting tests
	// -------------------------------------------------------------------------

	/**
	 * Tests that unregister_rtc_setting removes both old and new fields when RTC is not allowed.
	 */
	public function test_unregister_rtc_setting_removes_field_when_not_allowed() {
		global $wp_settings_fields;

		$wp_settings_fields['writing']['default'][ RTC::OPTION_OLD ] = array( 'id' => RTC::OPTION_OLD );
		$wp_settings_fields['writing']['default'][ RTC::OPTION_NEW ] = array( 'id' => RTC::OPTION_NEW );

		RTC::unregister_rtc_setting();

		$this->assertArrayNotHasKey( RTC::OPTION_OLD, $wp_settings_fields['writing']['default'] );
		$this->assertArrayNotHasKey( RTC::OPTION_NEW, $wp_settings_fields['writing']['default'] );
	}

	/**
	 * Tests that unregister_rtc_setting keeps both fields when RTC is allowed.
	 */
	public function test_unregister_rtc_setting_keeps_field_when_allowed() {
		global $wp_settings_fields;

		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		$wp_settings_fields['writing']['default'][ RTC::OPTION_OLD ] = array( 'id' => RTC::OPTION_OLD );
		$wp_settings_fields['writing']['default'][ RTC::OPTION_NEW ] = array( 'id' => RTC::OPTION_NEW );

		RTC::unregister_rtc_setting();

		$this->assertArrayHasKey( RTC::OPTION_OLD, $wp_settings_fields['writing']['default'] );
		$this->assertArrayHasKey( RTC::OPTION_NEW, $wp_settings_fields['writing']['default'] );
	}

	/**
	 * Tests that unregister_rtc_setting does not error when settings fields are not set.
	 */
	public function test_unregister_rtc_setting_handles_missing_fields() {
		global $wp_settings_fields;

		$wp_settings_fields = array();

		// Should not throw any errors.
		RTC::unregister_rtc_setting();

		$this->assertSame( array(), $wp_settings_fields );
	}

	// -------------------------------------------------------------------------
	// filter_rtc_option tests
	// -------------------------------------------------------------------------

	/**
	 * Tests that filter_rtc_option forces '0' when RTC is not allowed.
	 */
	public function test_filter_rtc_option_returns_0_when_not_allowed() {
		$this->assertSame( '0', RTC::filter_rtc_option( '1' ) );
	}

	/**
	 * Tests that filter_rtc_option passes through the value when RTC is allowed.
	 */
	public function test_filter_rtc_option_passes_through_when_allowed() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );

		$this->assertSame( '1', RTC::filter_rtc_option( '1' ) );
		$this->assertSame( '0', RTC::filter_rtc_option( '0' ) );
	}

	// -------------------------------------------------------------------------
	// default_rtc_option tests
	// -------------------------------------------------------------------------

	/**
	 * Tests that default_rtc_option returns '0' when RTC is not allowed.
	 */
	public function test_default_rtc_option_returns_0_when_not_allowed() {
		$this->assertSame( '0', RTC::default_rtc_option() );
	}

	/**
	 * Tests that default_rtc_option returns '1' when RTC is allowed and no option is stored.
	 */
	public function test_default_rtc_option_returns_1_when_allowed() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );

		$this->assertSame( '1', RTC::default_rtc_option( '', RTC::OPTION_OLD ) );
	}

	/**
	 * Tests that the new option falls back to the old option's stored value on upgrade.
	 */
	public function test_default_rtc_option_migrates_old_to_new() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		update_option( RTC::OPTION_OLD, '0' );

		$this->assertSame( '0', RTC::default_rtc_option( '', RTC::OPTION_NEW ) );
	}

	// -------------------------------------------------------------------------
	// pre_rtc_option tests
	// -------------------------------------------------------------------------

	/**
	 * Tests that pre_rtc_option passes through (returns false) when no user is logged in.
	 */
	public function test_pre_rtc_option_passes_through_when_logged_out() {
		wp_set_current_user( 0 );
		$this->assertFalse( RTC::pre_rtc_option() );
	}

	/**
	 * Tests that pre_rtc_option passes through for a blog member.
	 *
	 * In single-site, is_user_member_of_blog() is always true for existing users,
	 * so the super admin non-member condition is never met.
	 */
	public function test_pre_rtc_option_passes_through_for_blog_member() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'admin_member',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		$this->assertFalse( RTC::pre_rtc_option() );
	}

	/**
	 * Tests that pre_rtc_option passes through on the Writing settings page
	 * regardless of user role, so super admins can still toggle the setting.
	 */
	public function test_pre_rtc_option_passes_through_on_writing_settings_page() {
		global $pagenow;
		$pagenow = 'options-writing.php';

		$this->assertFalse( RTC::pre_rtc_option() );
	}
}
