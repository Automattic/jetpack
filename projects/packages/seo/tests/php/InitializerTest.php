<?php
/**
 * Tests for the Jetpack SEO Initializer: the package boot wiring and the
 * cross-plugin contract it carries.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Current_Plan;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Initializer
 */
#[CoversClass( Initializer::class )]
class InitializerTest extends TestCase {

	/**
	 * The package version constant is defined and non-empty.
	 */
	public function test_package_version_constant_is_defined() {
		$this->assertNotEmpty( Initializer::PACKAGE_VERSION );
	}

	/**
	 * The feature gates use the expected slugs.
	 */
	public function test_feature_gate_constants_are_defined() {
		$this->assertSame( 'seo-admin-ui', Initializer::FEATURE_SLUG );
		$this->assertSame( 'rsm_jetpack_seo', Initializer::FEATURE_FILTER );
	}

	/**
	 * Either the existing filter or the WordPress.com site feature can make SEO
	 * available; neither path is required when the other is enabled.
	 */
	public function test_is_available_uses_filter_or_site_feature() {
		$plan                       = Current_Plan::get();
		$plan['features']['active'] = array();
		update_option( Current_Plan::PLAN_OPTION, $plan );
		self::reset_current_plan_cache();

		// The rollout feature deliberately uses the active feature list rather than
		// WordPress.com's separate plan-entitlement check.
		\Wpcom_Test_Features::$known    = array( Initializer::FEATURE_SLUG );
		\Wpcom_Test_Features::$entitled = array();

		try {
			$this->assertFalse( Initializer::is_available() );

			add_filter( Initializer::FEATURE_FILTER, '__return_true' );
			$this->assertTrue( Initializer::is_available() );
			remove_filter( Initializer::FEATURE_FILTER, '__return_true' );

			$plan['features']['active'] = array( Initializer::FEATURE_SLUG );
			update_option( Current_Plan::PLAN_OPTION, $plan );
			self::reset_current_plan_cache();
			$this->assertTrue( Initializer::is_available() );
		} finally {
			remove_filter( Initializer::FEATURE_FILTER, '__return_true' );
			delete_option( Current_Plan::PLAN_OPTION );
			self::reset_current_plan_cache();
			\Wpcom_Test_Features::reset();
		}
	}

	/**
	 * Clear Current_Plan's request cache after changing its backing option.
	 */
	private static function reset_current_plan_cache() {
		$property = ( new \ReflectionClass( Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * The surface visibility contract remains available on Initializer.
	 */
	public function test_cross_plugin_contract_is_kept_on_initializer() {
		$this->assertSame( 'jetpack_seo_surface_visible_v2', Initializer::VISIBILITY_OPTION );

		$this->assertTrue( method_exists( Initializer::class, 'is_available' ) );
		$this->assertTrue( method_exists( Initializer::class, 'is_optin_available' ) );

		// The delegators track Surface_Visibility's answer, not a stale copy of it.
		delete_option( Initializer::VISIBILITY_OPTION );
		try {
			$this->assertFalse( Initializer::is_seo_surface_visible() );

			update_option( Initializer::VISIBILITY_OPTION, '1' );
			$this->assertTrue( Initializer::is_seo_surface_visible() );
			$this->assertFalse( Initializer::is_optin_available() );
		} finally {
			delete_option( Initializer::VISIBILITY_OPTION );
		}
	}

	/**
	 * With the feature flag on, the surface discoverable, and the `seo-tools` module
	 * active, `init()` registers the front-end schema, GEO, and admin/REST hooks.
	 * We drive module state through the `jetpack_active_modules` filter (the package test
	 * context has no on-disk modules), mark the cohort surface visible so init() passes
	 * its discoverability gate, and reset the one-shot `$initialized` guard so the body runs.
	 */
	public function test_init_registers_schema_and_hooks_when_enabled() {
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, false );

		$enable_module = static function () {
			return array( 'seo-tools' );
		};
		add_filter( 'rsm_jetpack_seo', '__return_true' );
		add_filter( 'jetpack_active_modules', $enable_module );
		// Past the discoverability cohort gate (self-hosted opted-in / fresh install).
		update_option( Initializer::VISIBILITY_OPTION, '1' );

		try {
			Initializer::init();

			// Lines proving the body ran past the module gate: the front-end features
			// self-hook, and init() registers its admin/REST callbacks.
			$this->assertNotFalse(
				has_action( 'wp_head', array( Schema_Builder::class, 'emit' ) )
			);
			$this->assertNotFalse(
				has_action( 'template_redirect', array( Llms_Txt::class, 'maybe_serve' ) )
			);
			$this->assertNotFalse(
				has_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ) )
			);
			$this->assertNotFalse(
				has_action( 'admin_menu', array( Admin_Page::class, 'maybe_load_wp_build' ) )
			);
			// Settings register on `rest_api_init`, after every chance a conflicting SEO
			// plugin has to filter `jetpack_disable_seo_tools` and change which option the
			// front page description belongs in, and before core builds the settings route
			// from the registry at priority 99.
			$this->assertSame(
				5,
				has_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ) )
			);
			$this->assertNotFalse(
				has_action( 'rest_api_init', array( Dashboard_Data::class, 'register_module_routes' ) )
			);

			// The coverage cache is invalidated from writes that happen anywhere — the block
			// editor posts through REST, where is_admin() is false — so these have to be
			// registered by init() itself, not by the admin-only branch above.
			$this->assertNotFalse(
				has_action( 'transition_post_status', array( Content_Coverage::class, 'invalidate_on_status_change' ) )
			);
			$this->assertNotFalse(
				has_action( 'deleted_post', array( Content_Coverage::class, 'invalidate_on_delete' ) )
			);
			foreach ( array( 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ) as $hook ) {
				$this->assertNotFalse(
					has_action( $hook, array( Content_Coverage::class, 'invalidate_on_meta_change' ) ),
					"init() must hook {$hook} to keep the coverage counts fresh."
				);
			}
		} finally {
			remove_filter( 'rsm_jetpack_seo', '__return_true' );
			remove_filter( 'jetpack_active_modules', $enable_module );
			delete_option( Initializer::VISIBILITY_OPTION );
			$initialized->setValue( null, false );
		}
	}

	/**
	 * Put the site on WordPress.com, entitled to `advanced-seo` or not.
	 *
	 * `advanced-seo` sits in the FREE plan's supports list and plan classes are
	 * cumulative, so the plan data alone can never report it unsupported. On
	 * WordPress.com `Current_Plan::supports()` hijacks to the platform's own feature
	 * check instead, and that hijack is the only thing that can gate the dashboard.
	 *
	 * @param bool $entitled Whether the site is entitled to `advanced-seo`.
	 */
	private function simulate_wpcom_site( $entitled ) {
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );

		\Wpcom_Test_Features::$known    = array( 'advanced-seo' );
		\Wpcom_Test_Features::$entitled = $entitled ? array( 'advanced-seo' ) : array();
	}

	/**
	 * Undo {@see self::simulate_wpcom_site()}.
	 */
	private function reset_wpcom_site() {
		\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		\Wpcom_Test_Features::reset();
	}

	/**
	 * Run `init()` with the surface visible, the `seo-tools` module active and Simple's
	 * canonical switch on, and report whether each paid front-end service hooked itself.
	 *
	 * Mirrors test_init_registers_schema_and_hooks_when_enabled()'s setup: module
	 * state is driven through `jetpack_active_modules` (the package test context has
	 * no on-disk modules), the cohort surface is marked visible, and the one-shot
	 * `$initialized` guard is reset so the body runs.
	 *
	 * @return array{llms_txt: bool, ai_crawlers: bool, canonical: bool}
	 */
	private function init_and_check_paid_services() {
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, false );

		$enable_module = static function () {
			return array( 'seo-tools' );
		};
		add_filter( 'rsm_jetpack_seo', '__return_true' );
		add_filter( 'jetpack_active_modules', $enable_module );
		update_option( Initializer::VISIBILITY_OPTION, '1' );
		update_option( Canonical_Urls::OPTION, 1 );

		// The services self-hook on init(), so a stale registration from an earlier
		// test would mask a missing one here.
		remove_action( 'template_redirect', array( Llms_Txt::class, 'maybe_serve' ) );
		remove_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ), Ai_Crawlers::ROBOTS_TXT_PRIORITY );
		remove_action( 'after_setup_theme', array( Canonical_Urls::class, 'load_module' ) );

		try {
			Initializer::init();

			return array(
				'llms_txt'    => false !== has_action( 'template_redirect', array( Llms_Txt::class, 'maybe_serve' ) ),
				'ai_crawlers' => false !== has_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ) ),
				'canonical'   => false !== has_action( 'after_setup_theme', array( Canonical_Urls::class, 'load_module' ) ),
			);
		} finally {
			remove_filter( 'rsm_jetpack_seo', '__return_true' );
			remove_filter( 'jetpack_active_modules', $enable_module );
			delete_option( Initializer::VISIBILITY_OPTION );
			delete_option( Canonical_Urls::OPTION );
			remove_action( 'after_setup_theme', array( Canonical_Urls::class, 'load_module' ) );
			$initialized->setValue( null, false );
		}
	}

	/**
	 * A self-hosted (never-gated) site registers both GEO-tab front-end services:
	 * /llms.txt is served and the AI-crawler robots.txt directives are appended.
	 */
	public function test_init_registers_paid_services_when_not_gated() {
		$hooked = $this->init_and_check_paid_services();

		$this->assertTrue( $hooked['llms_txt'] );
		$this->assertTrue( $hooked['ai_crawlers'] );
	}

	/**
	 * A WordPress.com site entitled to `advanced-seo` (Premium and above) is not
	 * gated, so it registers the paid services too — gating keys off entitlement,
	 * not merely off being on WordPress.com.
	 */
	public function test_init_registers_paid_services_on_entitled_wpcom_site() {
		$this->simulate_wpcom_site( true );

		try {
			$hooked = $this->init_and_check_paid_services();

			$this->assertTrue( $hooked['llms_txt'] );
			$this->assertTrue( $hooked['ai_crawlers'] );
			$this->assertTrue( $hooked['canonical'] );
		} finally {
			$this->reset_wpcom_site();
		}
	}

	/**
	 * A plan-gated WordPress.com site must not merely hide the paid controls — it must
	 * stop running the services behind them, or it would keep emitting output it isn't
	 * entitled to.
	 */
	public function test_init_skips_paid_services_when_gated() {
		$this->simulate_wpcom_site( false );

		try {
			$hooked = $this->init_and_check_paid_services();

			$this->assertFalse( $hooked['llms_txt'] );
			$this->assertFalse( $hooked['ai_crawlers'] );
			$this->assertFalse( $hooked['canonical'] );
		} finally {
			$this->reset_wpcom_site();
		}
	}

	/**
	 * Gating only suppresses the paid services — the schema output and the admin
	 * surface still register, so a gated site keeps the free subset of the dashboard.
	 */
	public function test_init_still_registers_schema_and_menu_when_gated() {
		$this->simulate_wpcom_site( false );

		try {
			$this->init_and_check_paid_services();

			$this->assertNotFalse( has_action( 'wp_head', array( Schema_Builder::class, 'emit' ) ) );
			$this->assertNotFalse(
				has_action( 'admin_menu', array( Admin_Page::class, 'maybe_load_wp_build' ) )
			);
		} finally {
			$this->reset_wpcom_site();
		}
	}

	/**
	 * Run init() with the given deliberate-off flag state and surface visibility, and
	 * report whether it suppressed WordPress core's own sitemap (registered the
	 * `wp_sitemaps_enabled` → false filter). Mirrors the schema/GEO test setup.
	 *
	 * @param bool $user_disabled   Whether SUPPRESS_WP_SITEMAP_OPTION (deliberate off) is set.
	 * @param bool $surface_visible Whether the SEO dashboard surface is visible. Sitemap
	 *                              suppression is tied to the feature, not the surface, so
	 *                              a set flag must be honored either way.
	 * @return bool Whether init() registered the core-sitemap-suppression filter.
	 */
	private function init_and_report_core_sitemaps_disabled( $user_disabled, $surface_visible = true ) {
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, false );

		add_filter( 'rsm_jetpack_seo', '__return_true' );
		if ( $surface_visible ) {
			update_option( Initializer::VISIBILITY_OPTION, '1' );
		} else {
			delete_option( Initializer::VISIBILITY_OPTION );
		}
		if ( $user_disabled ) {
			update_option( Initializer::SUPPRESS_WP_SITEMAP_OPTION, true );
		} else {
			delete_option( Initializer::SUPPRESS_WP_SITEMAP_OPTION );
		}
		// Isolate from any stale registration so the result reflects only this run.
		remove_filter( 'wp_sitemaps_enabled', '__return_false' );

		try {
			Initializer::init();
			return false !== has_filter( 'wp_sitemaps_enabled', '__return_false' );
		} finally {
			remove_filter( 'rsm_jetpack_seo', '__return_true' );
			remove_filter( 'wp_sitemaps_enabled', '__return_false' );
			$this->remove_sitemap_toggle_hooks();
			delete_option( Initializer::VISIBILITY_OPTION );
			delete_option( Initializer::SUPPRESS_WP_SITEMAP_OPTION );
			$initialized->setValue( null, false );
		}
	}

	/**
	 * Remove the sitemap-toggle actions init() registers, so they don't leak into
	 * other tests.
	 *
	 * @return void
	 */
	private function remove_sitemap_toggle_hooks() {
		remove_action( 'jetpack_deactivate_module_sitemaps', array( Initializer::class, 'flag_sitemap_user_disabled' ) );
		remove_action( 'jetpack_activate_module_sitemaps', array( Initializer::class, 'clear_sitemap_user_disabled' ) );
	}

	/**
	 * When the user has deliberately turned the sitemap off, init() suppresses
	 * WordPress core's own sitemap (the `wp_sitemaps_enabled` → false filter) so
	 * `/sitemap.xml` and `/wp-sitemap.xml` both 404 rather than falling back to core.
	 */
	public function test_init_suppresses_core_sitemaps_when_user_turned_it_off() {
		$this->assertTrue( $this->init_and_report_core_sitemaps_disabled( true ) );
	}

	/**
	 * The regression guard: a site that never turned the sitemap off keeps whatever
	 * sitemap it already had. Even with no deliberate-off flag, init() must NOT suppress
	 * core sitemaps — a brand-new or never-configured site must not silently lose its
	 * WordPress-native sitemap just because the SEO surface became visible.
	 */
	public function test_init_leaves_core_sitemaps_alone_when_never_disabled() {
		$this->assertFalse( $this->init_and_report_core_sitemaps_disabled( false ) );
	}

	/**
	 * A deliberate-off flag is honored even when the SEO dashboard is still hidden — the
	 * suppression is tied to the SEO feature, not the admin surface. This covers the site
	 * that turned the sitemap off while visible and later had the surface hidden, and the
	 * install that toggled it off from a legacy surface before opting into the dashboard.
	 */
	public function test_init_suppresses_core_sitemaps_when_off_even_if_surface_hidden() {
		$this->assertTrue( $this->init_and_report_core_sitemaps_disabled( true, false ) );
	}

	/**
	 * Toggling the sitemap maintains the deliberate-off flag: switching it off records
	 * the flag (so core is suppressed), switching it on clears it. init() registers the
	 * hooks; firing the module actions simulates a toggle from any surface.
	 */
	public function test_sitemap_toggle_maintains_the_deliberate_off_flag() {
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, false );

		add_filter( 'rsm_jetpack_seo', '__return_true' );
		update_option( Initializer::VISIBILITY_OPTION, '1' );
		delete_option( Initializer::SUPPRESS_WP_SITEMAP_OPTION );
		$this->remove_sitemap_toggle_hooks();

		try {
			Initializer::init();

			// Turning the sitemap off records the deliberate-off flag.
			do_action( 'jetpack_deactivate_module_sitemaps' );
			$this->assertTrue( (bool) get_option( Initializer::SUPPRESS_WP_SITEMAP_OPTION ) );

			// Turning it back on clears it.
			do_action( 'jetpack_activate_module_sitemaps' );
			$this->assertFalse( get_option( Initializer::SUPPRESS_WP_SITEMAP_OPTION, false ) );
		} finally {
			remove_filter( 'rsm_jetpack_seo', '__return_true' );
			$this->remove_sitemap_toggle_hooks();
			delete_option( Initializer::VISIBILITY_OPTION );
			delete_option( Initializer::SUPPRESS_WP_SITEMAP_OPTION );
			$initialized->setValue( null, false );
		}
	}

	/**
	 * Run init() with the surface visible or hidden, and return the "Configure" URL
	 * each SEO module resolves to.
	 *
	 * @param bool $surface_visible Whether the SEO dashboard surface is visible.
	 * @return array<string, string> Module slug => configuration URL.
	 */
	private function init_and_get_configuration_urls( $surface_visible ) {
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, false );

		$modules = array( 'seo-tools', 'verification-tools', 'sitemaps' );
		add_filter( 'rsm_jetpack_seo', '__return_true' );
		if ( $surface_visible ) {
			update_option( Initializer::VISIBILITY_OPTION, '1' );
		} else {
			delete_option( Initializer::VISIBILITY_OPTION );
		}
		// Other tests run init() with the surface visible and leave these filters behind.
		foreach ( $modules as $module ) {
			remove_filter( 'jetpack_module_configuration_url_' . $module, array( Admin_Page::class, 'get_url' ) );
		}

		try {
			Initializer::init();

			$urls = array();
			foreach ( $modules as $module ) {
				$urls[ $module ] = apply_filters( 'jetpack_module_configuration_url_' . $module, 'default' );
			}
			return $urls;
		} finally {
			foreach ( $modules as $module ) {
				remove_filter( 'jetpack_module_configuration_url_' . $module, array( Admin_Page::class, 'get_url' ) );
			}
			remove_filter( 'rsm_jetpack_seo', '__return_true' );
			$this->remove_sitemap_toggle_hooks();
			delete_option( Initializer::VISIBILITY_OPTION );
			$initialized->setValue( null, false );
		}
	}

	/**
	 * Once the surface is visible, "Configure" for each SEO module opens the SEO page
	 * instead of the legacy Traffic settings, which only point to it.
	 */
	public function test_configuration_urls_point_to_seo_page_when_surface_visible() {
		$seo_page = admin_url( 'admin.php?page=jetpack-seo' );

		$this->assertSame(
			array(
				'seo-tools'          => $seo_page,
				'verification-tools' => $seo_page,
				'sitemaps'           => $seo_page,
			),
			$this->init_and_get_configuration_urls( true )
		);
	}

	/**
	 * While the surface is hidden (an existing self-hosted install that hasn't opted in),
	 * the legacy Traffic settings are still where these modules are configured.
	 */
	public function test_configuration_urls_unchanged_when_surface_hidden() {
		$this->assertSame(
			array(
				'seo-tools'          => 'default',
				'verification-tools' => 'default',
				'sitemaps'           => 'default',
			),
			$this->init_and_get_configuration_urls( false )
		);
	}

	/**
	 * Run a callback as a user of the given role, with `seo-tools` available but off.
	 *
	 * @param string   $role     User role.
	 * @param callable $callback Test body.
	 */
	private function with_seo_tools_off( $role, callable $callback ) {
		$available = static function () {
			return array( 'seo-tools' );
		};
		add_filter( 'jetpack_get_available_standalone_modules', $available );
		\Jetpack_Options::delete_option( 'active_modules' );
		delete_option( Initializer::SEO_TOOLS_AUTO_ACTIVATED_OPTION );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => uniqid( 'seo-' ),
					'user_pass'  => 'pass',
					'role'       => $role,
				)
			)
		);

		try {
			$callback();
		} finally {
			wp_set_current_user( 0 );
			remove_filter( 'jetpack_get_available_standalone_modules', $available );
			\Jetpack_Options::delete_option( 'active_modules' );
			delete_option( Initializer::SEO_TOOLS_AUTO_ACTIVATED_OPTION );
		}
	}

	/**
	 * SEO tools starts off on a fresh install; turning it on must happen once, so a later
	 * turn-off in My Jetpack sticks.
	 */
	public function test_activate_seo_tools_once_does_not_undo_a_later_turn_off() {
		$this->with_seo_tools_off(
			'administrator',
			function () {
				$modules = new \Automattic\Jetpack\Modules();

				Initializer::activate_seo_tools_once();
				$this->assertTrue( $modules->is_active( 'seo-tools' ) );

				$modules->deactivate( 'seo-tools' );
				Initializer::activate_seo_tools_once();
				$this->assertFalse( $modules->is_active( 'seo-tools' ) );
			}
		);
	}

	/**
	 * WordPress.com keeps its own module state, and only an admin's visit switches it on.
	 *
	 * @dataProvider provide_sites_left_alone
	 *
	 * @param string $role     User role.
	 * @param bool   $on_wpcom Whether the site is on WordPress.com.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_sites_left_alone' )]
	public function test_activate_seo_tools_once_leaves_module_off( $role, $on_wpcom ) {
		$this->with_seo_tools_off(
			$role,
			function () use ( $on_wpcom ) {
				if ( $on_wpcom ) {
					\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );
				}

				try {
					Initializer::activate_seo_tools_once();
				} finally {
					\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
				}

				$this->assertSame( array(), \Jetpack_Options::get_option( 'active_modules', array() ) );
				$this->assertFalse( get_option( Initializer::SEO_TOOLS_AUTO_ACTIVATED_OPTION ) );
			}
		);
	}

	/**
	 * Sites where SEO tools must stay off.
	 *
	 * @return array<string, array{string, bool}>
	 */
	public static function provide_sites_left_alone() {
		return array(
			'WordPress.com site' => array( 'administrator', true ),
			'non-admin visit'    => array( 'editor', false ),
		);
	}
}
