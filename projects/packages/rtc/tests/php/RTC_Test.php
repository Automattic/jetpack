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
	 * Original value of $wp_registered_settings to restore after each test.
	 *
	 * @var mixed
	 */
	private $original_wp_registered_settings;

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
		global $wp_settings_fields, $wp_registered_settings, $wp_scripts, $wp_styles, $pagenow;
		$this->original_wp_settings_fields     = $wp_settings_fields;
		$this->original_wp_registered_settings = $wp_registered_settings;
		$this->original_wp_scripts             = $wp_scripts;
		$this->original_wp_styles              = $wp_styles;
		$this->original_pagenow                = $pagenow;
	}

	/**
	 * Clean up filters and restore global state after each test.
	 */
	public function tear_down(): void {
		global $wp_settings_fields, $wp_registered_settings, $wp_scripts, $wp_styles, $pagenow;
		$wp_settings_fields     = $this->original_wp_settings_fields;
		$wp_registered_settings = $this->original_wp_registered_settings;
		$wp_scripts             = $this->original_wp_scripts;
		$wp_styles              = $this->original_wp_styles;
		$pagenow                = $this->original_pagenow;
		remove_all_filters( 'jetpack_rtc_enabled' );
		remove_all_filters( 'jetpack_rtc_providers' );
		remove_all_filters( 'jetpack_rtc_uses_experiment' );
		delete_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN );

		// The pre_rtc_option tests log a user in; leaving them logged in makes
		// pre_rtc_option short-circuit get_option() in every test that follows.
		wp_set_current_user( 0 );
		remove_all_filters( 'option_' . RTC::EXPERIMENTS_OPTION );
		remove_all_filters( 'default_option_' . RTC::EXPERIMENTS_OPTION );
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
		update_option( RTC::OPTION_NEW, '1' );
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
		update_option( RTC::OPTION_NEW, '1' );

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
		update_option( RTC::OPTION_NEW, '1' );
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
		update_option( RTC::OPTION_NEW, '1' );
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
		update_option( RTC::OPTION_NEW, '1' );
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
		update_option( RTC::OPTION_NEW, '1' );
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
		update_option( RTC::OPTION_NEW, '1' );
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
		update_option( RTC::OPTION_NEW, '1' );

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
		update_option( RTC::OPTION_NEW, '1' );
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
		update_option( RTC::OPTION_NEW, '1' );
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
		update_option( RTC::OPTION_NEW, '1' );
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
		update_option( RTC::OPTION_NEW, '1' );
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
	 * Tests that the setting defaults to off even when RTC is allowed.
	 */
	public function test_default_rtc_option_returns_0_when_allowed() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );

		$this->assertSame( '0', RTC::default_rtc_option() );
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

	// -------------------------------------------------------------------------
	// Gutenberg experiment tests (Gutenberg 23.8+)
	// -------------------------------------------------------------------------

	/**
	 * Allowed site running a Gutenberg that gates RTC behind the experiment.
	 */
	private function use_experiment_and_allow() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		add_filter( 'jetpack_rtc_uses_experiment', '__return_true' );
	}

	/**
	 * Tests that the experiment is not detected without Gutenberg 23.8+ loaded.
	 */
	public function test_uses_experiment_defaults_false() {
		$this->assertFalse( RTC::uses_experiment() );
	}

	/**
	 * Tests that experiment detection can be overridden by filter.
	 */
	public function test_uses_experiment_respects_filter() {
		add_filter( 'jetpack_rtc_uses_experiment', '__return_true' );
		$this->assertTrue( RTC::uses_experiment() );
	}

	/**
	 * Tests that is_turned_on describes the site, ignoring the current admin screen.
	 */
	public function test_is_turned_on_ignores_site_editor() {
		global $pagenow;

		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		update_option( RTC::OPTION_NEW, '1' );

		$pagenow = 'site-editor.php';

		$this->assertTrue( RTC::is_turned_on() );
		$this->assertFalse( RTC::is_enabled() );
	}

	/**
	 * Tests that the setting defaults to off once RTC is gated by the experiment.
	 */
	public function test_default_rtc_option_returns_0_when_using_experiment() {
		$this->use_experiment_and_allow();

		$this->assertSame( '0', RTC::default_rtc_option( '', RTC::OPTION_NEW ) );
		$this->assertSame( '0', RTC::default_rtc_option( '', RTC::OPTION_OLD ) );
	}

	/**
	 * Tests that the experiment is enabled when the setting is on.
	 */
	public function test_filter_experiments_enables_when_turned_on() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		update_option( RTC::OPTION_NEW, '1' );

		$this->assertSame(
			array( RTC::EXPERIMENT => true ),
			RTC::filter_experiments( array() )
		);
	}

	/**
	 * Tests that the experiment is removed when the setting is off.
	 */
	public function test_filter_experiments_removes_when_turned_off() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		update_option( RTC::OPTION_NEW, '0' );

		$this->assertSame(
			array(),
			RTC::filter_experiments( array( RTC::EXPERIMENT => true ) )
		);
	}

	/**
	 * Tests that unrelated experiments are left untouched.
	 */
	public function test_filter_experiments_preserves_other_experiments() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		update_option( RTC::OPTION_NEW, '1' );

		$this->assertSame(
			array(
				'gutenberg-guidelines' => true,
				RTC::EXPERIMENT        => true,
			),
			RTC::filter_experiments( array( 'gutenberg-guidelines' => true ) )
		);
	}

	/**
	 * Tests that a missing option (passed as false) is handled.
	 */
	public function test_filter_experiments_handles_non_array() {
		$this->assertSame( array(), RTC::filter_experiments( false ) );
	}

	/**
	 * Tests that a stored setting cannot enable the experiment on a site that is not allowed.
	 */
	public function test_filter_experiments_ignores_setting_when_not_allowed() {
		add_filter( 'jetpack_rtc_uses_experiment', '__return_true' );
		update_option( RTC::OPTION_NEW, '1' );

		$this->assertSame( array(), RTC::filter_experiments( array() ) );
	}

	/**
	 * Tests that the experiment filters are not registered on older Gutenberg.
	 */
	public function test_register_experiment_filters_skips_on_legacy_gutenberg() {
		RTC::register_experiment_filters();

		$this->assertFalse( has_filter( 'option_' . RTC::EXPERIMENTS_OPTION ) );
		$this->assertFalse( has_filter( 'default_option_' . RTC::EXPERIMENTS_OPTION ) );
	}

	/**
	 * Tests that the experiment filters are registered on Gutenberg 23.8+.
	 */
	public function test_register_experiment_filters_registers_on_new_gutenberg() {
		add_filter( 'jetpack_rtc_uses_experiment', '__return_true' );

		RTC::register_experiment_filters();

		$this->assertNotFalse( has_filter( 'option_' . RTC::EXPERIMENTS_OPTION, array( RTC::class, 'filter_experiments' ) ) );
		$this->assertNotFalse( has_filter( 'default_option_' . RTC::EXPERIMENTS_OPTION, array( RTC::class, 'filter_experiments' ) ) );
	}

	/**
	 * Tests that our experiment filter still wins when the option has a registered default.
	 *
	 * Regression test: Gutenberg registers `gutenberg-experiments` with a default of
	 * array() on rest_api_init. register_setting() hooks core's filter_default_option()
	 * onto `default_option_gutenberg-experiments` at priority 10, and that callback
	 * discards the value it is handed and returns the registered default. At the same
	 * priority ours ran first and its result was thrown away, so the experiment read as
	 * disabled on every REST request regardless of the setting.
	 */
	public function test_filter_experiments_wins_over_a_registered_default() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		add_filter( 'jetpack_rtc_uses_experiment', '__return_true' );
		RTC::init();
		RTC::register_experiment_filters();
		update_option( RTC::OPTION_NEW, '1' );
		delete_option( RTC::EXPERIMENTS_OPTION );

		// Stand in for core's filter_default_option(): ignore the input, return the default.
		add_filter(
			'default_option_' . RTC::EXPERIMENTS_OPTION,
			function () {
				return array();
			},
			10
		);

		$experiments = get_option( RTC::EXPERIMENTS_OPTION );

		$this->assertArrayHasKey( RTC::EXPERIMENT, (array) $experiments );
	}

	/**
	 * Tests that no replacement setting is registered when RTC is not allowed.
	 */
	public function test_register_rtc_setting_skips_when_not_allowed() {
		global $wp_settings_fields;

		add_filter( 'jetpack_rtc_uses_experiment', '__return_true' );
		$wp_settings_fields = array();

		RTC::register_rtc_setting();

		$this->assertSame( array(), $wp_settings_fields );
	}

	/**
	 * Tests that the replacement setting is registered, defaulting to off.
	 */
	public function test_register_rtc_setting_registers_field_when_allowed() {
		global $wp_settings_fields, $wp_registered_settings;

		$this->use_experiment_and_allow();
		// Seed the group rather than an empty array, so the shape is unambiguous.
		$wp_settings_fields = array( 'writing' => array( 'default' => array() ) );

		RTC::register_rtc_setting();

		$this->assertArrayHasKey( RTC::OPTION_NEW, $wp_settings_fields['writing']['default'] );
		$this->assertFalse( $wp_registered_settings[ RTC::OPTION_NEW ]['default'] );
	}

	/**
	 * Renders the Writing settings field and returns the markup.
	 *
	 * @return string
	 */
	private function render_setting_field() {
		ob_start();
		RTC::render_rtc_setting_field();
		return (string) ob_get_clean();
	}

	/**
	 * Tests that the field renders unchecked when collaboration is off.
	 */
	public function test_render_rtc_setting_field_unchecked_by_default() {
		$this->use_experiment_and_allow();
		RTC::init();

		$markup = $this->render_setting_field();

		$this->assertStringContainsString( 'name="' . RTC::OPTION_NEW . '"', $markup );
		$this->assertStringContainsString( 'type="checkbox"', $markup );
		$this->assertStringNotContainsString( "checked='checked'", $markup );
	}

	/**
	 * Tests that the field renders checked once collaboration is switched on.
	 */
	public function test_render_rtc_setting_field_checked_when_enabled() {
		$this->use_experiment_and_allow();
		RTC::init();
		update_option( RTC::OPTION_NEW, '1' );

		$markup = $this->render_setting_field();

		$this->assertStringContainsString( "checked='checked'", $markup );
	}

	/**
	 * Tests that the field describes what it does.
	 */
	public function test_render_rtc_setting_field_includes_description() {
		$this->use_experiment_and_allow();
		RTC::init();

		$this->assertStringContainsString( 'real-time collaboration', $this->render_setting_field() );
	}

	/**
	 * Tests that init hooks the experiment filter registration and the setting.
	 */
	public function test_init_hooks_experiment_setup() {
		RTC::init();

		$this->assertNotFalse( has_action( 'init', array( RTC::class, 'register_experiment_filters' ) ) );
		$this->assertNotFalse( has_action( 'admin_init', array( RTC::class, 'register_rtc_setting' ) ) );
		// Must land after Gutenberg's migration, which runs at priority 20.
		$this->assertSame( 30, has_action( 'init', array( RTC::class, 'restore_opt_in' ) ) );
	}

	// -------------------------------------------------------------------------
	// Opt-in carry-over tests
	// -------------------------------------------------------------------------

	/**
	 * Tests that a site that explicitly turned collaboration on keeps it.
	 */
	public function test_carry_over_records_explicit_opt_in() {
		$this->use_experiment_and_allow();
		RTC::init();
		update_option( RTC::OPTION_NEW, '1' );

		RTC::carry_over_opt_in();

		$this->assertSame( '1', get_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN ) );
	}

	/**
	 * Tests that a site that never touched the setting is not opted in.
	 */
	public function test_carry_over_records_no_opt_in_when_nothing_stored() {
		$this->use_experiment_and_allow();
		RTC::init();

		RTC::carry_over_opt_in();

		$this->assertSame( '0', get_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN ) );
	}

	/**
	 * Tests that an explicit opt-out is not read as an opt-in.
	 */
	public function test_carry_over_records_no_opt_in_when_explicitly_disabled() {
		$this->use_experiment_and_allow();
		RTC::init();
		update_option( RTC::OPTION_NEW, '0' );

		RTC::carry_over_opt_in();

		$this->assertSame( '0', get_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN ) );
	}

	/**
	 * Tests that an opt-in stored under the pre-rename option name is still found.
	 */
	public function test_carry_over_falls_back_to_legacy_option() {
		$this->use_experiment_and_allow();
		RTC::init();
		update_option( RTC::OPTION_OLD, '1' );

		RTC::carry_over_opt_in();

		$this->assertSame( '1', get_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN ) );
	}

	/**
	 * Tests that sites which cannot run RTC still record an answer.
	 *
	 * The marker is what lets the carry-over short-circuit on later requests. Skipping
	 * disallowed sites would leave them re-evaluating it on every admin request.
	 */
	public function test_carry_over_records_an_answer_when_not_allowed() {
		add_filter( 'jetpack_rtc_uses_experiment', '__return_true' );
		RTC::init();

		RTC::carry_over_opt_in();

		$this->assertSame( '0', get_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN ) );
		// Being allowed is still enforced when the value is read.
		$this->assertFalse( RTC::is_turned_on() );
	}

	/**
	 * Tests that nothing is recorded on Gutenberg versions without the experiment.
	 */
	public function test_carry_over_skips_on_legacy_gutenberg() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		RTC::init();
		update_option( RTC::OPTION_NEW, '1' );

		RTC::carry_over_opt_in();

		$this->assertFalse( get_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN, false ) );
	}

	/**
	 * Tests that the carry-over runs once and does not revisit its answer.
	 */
	public function test_carry_over_is_idempotent() {
		$this->use_experiment_and_allow();
		RTC::init();
		update_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN, '0' );
		update_option( RTC::OPTION_NEW, '1' );

		RTC::carry_over_opt_in();

		$this->assertSame( '0', get_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN ) );
	}

	/**
	 * Tests that reading the stored value adds no filters when none were hooked.
	 *
	 * The carry-over lifts this class's option filters to read the raw value. If it
	 * restored them unconditionally it would register filters on a site where init() had
	 * never run.
	 */
	public function test_carry_over_adds_no_filters_when_none_were_hooked() {
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		add_filter( 'jetpack_rtc_uses_experiment', '__return_true' );

		// Deliberately no RTC::init(), so none of the option filters are registered.
		RTC::carry_over_opt_in();

		$this->assertFalse( has_filter( 'option_' . RTC::OPTION_NEW, array( RTC::class, 'filter_rtc_option' ) ) );
		$this->assertFalse( has_filter( 'default_option_' . RTC::OPTION_NEW, array( RTC::class, 'default_rtc_option' ) ) );
		$this->assertFalse( has_filter( 'pre_option_' . RTC::OPTION_NEW, array( RTC::class, 'pre_rtc_option' ) ) );
	}

	/**
	 * Tests that reading the stored value leaves this class's option filters intact.
	 */
	public function test_carry_over_leaves_option_filters_intact() {
		$this->use_experiment_and_allow();
		RTC::init();
		update_option( RTC::OPTION_NEW, '1' );

		RTC::carry_over_opt_in();

		$this->assertSame( 10, has_filter( 'option_' . RTC::OPTION_NEW, array( RTC::class, 'filter_rtc_option' ) ) );
		$this->assertSame( 20, has_filter( 'default_option_' . RTC::OPTION_NEW, array( RTC::class, 'default_rtc_option' ) ) );
		$this->assertSame( 10, has_filter( 'pre_option_' . RTC::OPTION_NEW, array( RTC::class, 'pre_rtc_option' ) ) );
	}

	/**
	 * Tests that the default stays off even for a site that had opted in.
	 *
	 * The opt-in is re-applied as a stored value by restore_opt_in(), never as a default.
	 */
	public function test_default_rtc_option_is_off_regardless_of_carried_flag() {
		$this->use_experiment_and_allow();

		update_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN, '1' );
		$this->assertSame( '0', RTC::default_rtc_option( '', RTC::OPTION_NEW ) );

		update_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN, '0' );
		$this->assertSame( '0', RTC::default_rtc_option( '', RTC::OPTION_NEW ) );
	}

	/**
	 * Tests that a carried opt-in turns the experiment back on end to end.
	 */
	public function test_carried_opt_in_enables_the_experiment() {
		$this->use_experiment_and_allow();
		RTC::init();
		update_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN, '1' );

		// Gutenberg's migration has removed the option by this point.
		delete_option( RTC::OPTION_NEW );
		RTC::restore_opt_in();

		$this->assertSame(
			array( RTC::EXPERIMENT => true ),
			RTC::filter_experiments( array() )
		);
	}

	/**
	 * Tests that restoring writes a real stored value, not just a default.
	 */
	public function test_restore_opt_in_stores_a_real_value() {
		$this->use_experiment_and_allow();
		RTC::init();
		update_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN, '1' );
		delete_option( RTC::OPTION_NEW );

		RTC::restore_opt_in();

		$this->assertSame( '1', get_option( RTC::OPTION_NEW ) );
		// The flag is consumed, so this only ever happens once.
		$this->assertSame( '0', get_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN ) );
	}

	/**
	 * Tests that a site which never opted in is left alone.
	 */
	public function test_restore_opt_in_skips_when_nothing_carried() {
		$this->use_experiment_and_allow();
		RTC::init();
		update_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN, '0' );
		delete_option( RTC::OPTION_NEW );

		RTC::restore_opt_in();

		$this->assertFalse( RTC::is_turned_on() );
	}

	/**
	 * Tests that restoring never overwrites a choice the site already has stored.
	 */
	public function test_restore_opt_in_does_not_overwrite_a_stored_choice() {
		$this->use_experiment_and_allow();
		RTC::init();
		update_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN, '1' );
		// add_option, not update_option: the default is already '0', so update_option
		// would see no change and write nothing.
		add_option( RTC::OPTION_NEW, '0' );

		RTC::restore_opt_in();

		$this->assertSame( '0', get_option( RTC::OPTION_NEW ) );
	}

	/**
	 * Tests that a carried-over site can still switch collaboration off.
	 *
	 * Regression test: unchecking the box on Settings > Writing deletes the option row
	 * rather than storing '0'. While the carried opt-in was expressed as a default, that
	 * default re-applied on the next request and the setting could never be turned off.
	 */
	public function test_carried_site_can_turn_collaboration_off() {
		$this->use_experiment_and_allow();
		RTC::init();
		update_option( RTC::OPTION_PRE_EXPERIMENT_OPT_IN, '1' );
		delete_option( RTC::OPTION_NEW );

		RTC::restore_opt_in();
		$this->assertTrue( RTC::is_turned_on(), 'collaboration should be restored' );

		// The user unchecks the box, which removes the row.
		delete_option( RTC::OPTION_NEW );
		RTC::restore_opt_in();

		$this->assertFalse( RTC::is_turned_on(), 'collaboration should stay off' );
		$this->assertSame( array(), RTC::filter_experiments( array() ) );
	}

	/**
	 * Tests that init hooks the carry-over ahead of Gutenberg's migration.
	 */
	public function test_init_hooks_carry_over_before_migration() {
		RTC::init();

		$priority = has_action( 'init', array( RTC::class, 'carry_over_opt_in' ) );

		$this->assertSame( 0, $priority );
		$this->assertLessThan( 20, $priority );
	}
}
