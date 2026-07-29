<?php
/**
 * Tests for the Jetpack SEO Initializer: the package boot wiring and the
 * cross-plugin contract it carries.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

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
	 * The feature-flag filter name is the expected slug.
	 */
	public function test_feature_filter_constant_is_defined() {
		$this->assertSame( 'rsm_jetpack_seo', Initializer::FEATURE_FILTER );
	}

	/**
	 * The cross-plugin contract other plugins consume stays on Initializer: the
	 * option names are pinned as literals (the Jetpack plugin's migrations write
	 * them), and the visibility reads are real methods (My Jetpack probes
	 * `is_optin_available` with `method_exists` on this class) delegating to
	 * Surface_Visibility.
	 */
	public function test_cross_plugin_contract_is_kept_on_initializer() {
		$this->assertSame( 'jetpack_seo_sitemap_enabled', Initializer::SITEMAP_ENABLED_OPTION );
		$this->assertSame( 'jetpack_seo_canonical_urls_enabled', Initializer::CANONICAL_ENABLED_OPTION );
		$this->assertSame( 'jetpack_seo_surface_visible', Initializer::VISIBILITY_OPTION );

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
			$this->assertNotFalse(
				has_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ) )
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
	 * Run `init()` with the surface visible and the `seo-tools` module active, and
	 * report whether the two GEO-tab front-end services hooked themselves.
	 *
	 * Mirrors test_init_registers_schema_and_hooks_when_enabled()'s setup: module
	 * state is driven through `jetpack_active_modules` (the package test context has
	 * no on-disk modules), the cohort surface is marked visible, and the one-shot
	 * `$initialized` guard is reset so the body runs.
	 *
	 * @return array{llms_txt: bool, ai_crawlers: bool}
	 */
	private function init_and_check_geo_services() {
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

		// Both services self-hook on init(), so a stale registration from an earlier
		// test would mask a missing one here.
		remove_action( 'template_redirect', array( Llms_Txt::class, 'maybe_serve' ) );
		remove_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ), 10 );

		try {
			Initializer::init();

			return array(
				'llms_txt'    => false !== has_action( 'template_redirect', array( Llms_Txt::class, 'maybe_serve' ) ),
				'ai_crawlers' => false !== has_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ) ),
			);
		} finally {
			remove_filter( 'rsm_jetpack_seo', '__return_true' );
			remove_filter( 'jetpack_active_modules', $enable_module );
			delete_option( Initializer::VISIBILITY_OPTION );
			$initialized->setValue( null, false );
		}
	}

	/**
	 * A self-hosted (never-gated) site registers both GEO-tab front-end services:
	 * /llms.txt is served and the AI-crawler robots.txt directives are appended.
	 */
	public function test_init_registers_geo_services_when_not_gated() {
		$hooked = $this->init_and_check_geo_services();

		$this->assertTrue( $hooked['llms_txt'] );
		$this->assertTrue( $hooked['ai_crawlers'] );
	}

	/**
	 * A WordPress.com site entitled to `advanced-seo` (Premium and above) is not
	 * gated, so it too registers both GEO services — gating keys off entitlement,
	 * not merely off being on WordPress.com.
	 */
	public function test_init_registers_geo_services_on_entitled_wpcom_site() {
		$this->simulate_wpcom_site( true );

		try {
			$hooked = $this->init_and_check_geo_services();

			$this->assertTrue( $hooked['llms_txt'] );
			$this->assertTrue( $hooked['ai_crawlers'] );
		} finally {
			$this->reset_wpcom_site();
		}
	}

	/**
	 * A plan-gated WordPress.com site must not merely hide the GEO tab — it must stop
	 * running the services behind it, or it would keep serving /llms.txt and emitting
	 * AI-crawler robots.txt directives it isn't entitled to.
	 */
	public function test_init_skips_geo_services_when_gated() {
		$this->simulate_wpcom_site( false );

		try {
			$hooked = $this->init_and_check_geo_services();

			$this->assertFalse( $hooked['llms_txt'] );
			$this->assertFalse( $hooked['ai_crawlers'] );
		} finally {
			$this->reset_wpcom_site();
		}
	}

	/**
	 * Gating only suppresses the GEO-tab services — the schema output and the admin
	 * surface still register, so a gated site keeps the free subset of the dashboard.
	 */
	public function test_init_still_registers_schema_and_menu_when_gated() {
		$this->simulate_wpcom_site( false );

		try {
			$this->init_and_check_geo_services();

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
}
