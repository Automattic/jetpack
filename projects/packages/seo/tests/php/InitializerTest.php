<?php
/**
 * Tests for the Jetpack SEO Initializer: the package boot wiring and the
 * cross-plugin contract it carries.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
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
	 * Disconnected sites must not need a plan refresh to expose the SEO page.
	 */
	public function test_is_available_without_plan_features() {
		$plan                       = Current_Plan::get();
		$plan['features']['active'] = array();
		update_option( Current_Plan::PLAN_OPTION, $plan );
		self::reset_current_plan_cache();
		$this->assertTrue( Initializer::is_available() );
		delete_option( Current_Plan::PLAN_OPTION );
		self::reset_current_plan_cache();
	}

	public function test_vip_is_excluded_before_registering_seo_hooks() {
		$hooks = array_map(
			static function ( $hook ) {
				return clone $hook;
			},
			$GLOBALS['wp_filter']
		);

		$visibility  = get_option( 'jetpack_seo_surface_visible_v2', null );
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$was_initialized = $initialized->getValue();
		$initialized->setValue( null, false );
		Constants::set_constant( 'WPCOM_IS_VIP_ENV', true );

		try {
			$this->assertFalse( Initializer::is_available() );
			delete_option( 'jetpack_seo_surface_visible_v2' );

			update_option( 'jetpack_seo_surface_visible_v2', '1' );
			foreach ( array( 'rest_api_init', 'admin_menu', 'jetpack_deactivate_module_sitemaps', 'redirect_canonical', 'old_slug_redirect_url' ) as $hook ) {
				unset( $GLOBALS['wp_filter'][ $hook ] );
			}
			Initializer::init();

			$this->assertFalse( has_action( 'admin_menu', array( Admin_Page::class, 'add_menu_item' ) ) );
			$this->assertFalse( has_action( 'jetpack_deactivate_module_sitemaps', array( Initializer::class, 'flag_sitemap_user_disabled' ) ) );
			$this->assertFalse( has_filter( 'redirect_canonical', array( Llms_Txt::class, 'preserve_llms_txt_request' ) ) );
			$this->assertFalse( has_filter( 'old_slug_redirect_url', array( Llms_Txt::class, 'preserve_llms_txt_request' ) ) );
		} finally {
			Constants::clear_single_constant( 'WPCOM_IS_VIP_ENV' );
			$GLOBALS['wp_filter'] = $hooks; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			if ( null === $visibility ) {
				delete_option( 'jetpack_seo_surface_visible_v2' );
			} else {
				update_option( 'jetpack_seo_surface_visible_v2', $visibility );
			}
			$initialized->setValue( null, $was_initialized );
		}
	}

	/**
	 * Migration preserves saved preferences and module-dependent editing routes.
	 *
	 * @dataProvider migration_states
	 * @param string|null $visibility Saved discoverability value.
	 * @param bool        $seo_active Whether SEO Tools was already active.
	 */
	#[DataProvider( 'migration_states' )]
	public function test_migration_preserves_module_gates_and_saved_choices( $visibility, $seo_active ) {
		$hooks            = array_map(
			static function ( $hook ) {
				return clone $hook;
			},
			$GLOBALS['wp_filter']
		);
		$previous         = get_option( 'jetpack_seo_surface_visible_v2', null );
		$previous_modules = get_option( 'jetpack_active_modules', null );
		$modules          = $seo_active ? array( 'seo-tools', 'verification-tools' ) : array( 'verification-tools', 'sitemaps' );
		$module_filter    = static function () use ( $modules ) {
			return $modules;
		};
		$initialized      = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$was_initialized = $initialized->getValue();
		$initialized->setValue( null, false );
		if ( null === $visibility ) {
			delete_option( 'jetpack_seo_surface_visible_v2' );
		} else {
			update_option( 'jetpack_seo_surface_visible_v2', $visibility );
		}
		update_option( 'jetpack_active_modules', $modules );
		add_filter( 'jetpack_active_modules', $module_filter );
		$callbacks = array(
			array( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ), 5 ),
			array( 'rest_api_init', array( Dashboard_Data::class, 'register_module_routes' ), 10 ),
			array( 'wp_head', array( Schema_Builder::class, 'emit' ), 10 ),
			array( 'template_redirect', array( Llms_Txt::class, 'maybe_serve' ), 10 ),
		);
		foreach ( $callbacks as $callback ) {
			remove_action( $callback[0], $callback[1], $callback[2] );
		}
		try {
			Initializer::init();
			$this->assertSame( $seo_active ? 5 : false, has_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ) ) );
			$this->assertSame( $seo_active ? 10 : false, has_action( 'rest_api_init', array( Dashboard_Data::class, 'register_module_routes' ) ) );
			$this->assertNotFalse( has_action( 'admin_menu', array( Admin_Page::class, 'maybe_load_wp_build' ) ) );
			$this->assertSame( $visibility, get_option( 'jetpack_seo_surface_visible_v2', null ) );
			$this->assertSame( $modules, get_option( 'jetpack_active_modules' ) );
			if ( ! $seo_active ) {
				$this->assertFalse( has_action( 'wp_head', array( Schema_Builder::class, 'emit' ) ) );
				$this->assertFalse( has_action( 'template_redirect', array( Llms_Txt::class, 'maybe_serve' ) ) );
			}
		} finally {
			$GLOBALS['wp_filter'] = $hooks; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			foreach ( array(
				'jetpack_seo_surface_visible_v2' => $previous,
				'jetpack_active_modules'         => $previous_modules,
			) as $key => $value ) {
				if ( null === $value ) {
					delete_option( $key );
				} else {
					update_option( $key, $value );
				}
			}
			$initialized->setValue( null, $was_initialized );
		}
	}

	/** @return array Saved state combinations from existing installs. */
	public static function migration_states() {
		return array(
			'absent, SEO off' => array( null, false ),
			'false, SEO off'  => array( '0', false ),
			'true, SEO off'   => array( '1', false ),
			'absent, SEO on'  => array( null, true ),
			'false, SEO on'   => array( '0', true ),
			'true, SEO on'    => array( '1', true ),
		);
	}

	/**
	 * @dataProvider provide_hidden_output_states
	 * @param bool $visible Whether the dashboard is visible.
	 * @param bool $active Whether SEO Tools is active.
	 */
	#[DataProvider( 'provide_hidden_output_states' )]
	public function test_redirect_protection_precedes_output_gates( $visible, $active ) {
		$hooks       = array_map(
			static function ( $hook ) {
				return clone $hook;
			},
			$GLOBALS['wp_filter']
		);
		$visibility  = get_option( 'jetpack_seo_surface_visible_v2', null );
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$was_initialized = $initialized->getValue();
		$initialized->setValue( null, false );
		$modules = static function () use ( $active ) {
			return $active ? array( 'seo-tools' ) : array();
		};
		add_filter( 'jetpack_active_modules', $modules );
		update_option( 'jetpack_seo_surface_visible_v2', $visible );
		foreach ( array( 'template_redirect', 'redirect_canonical', 'old_slug_redirect_url' ) as $hook ) {
			unset( $GLOBALS['wp_filter'][ $hook ] );
		}
		try {
			Initializer::init();
			$this->assertSame( 10, has_filter( 'redirect_canonical', array( Llms_Txt::class, 'preserve_llms_txt_request' ) ) );
			$this->assertSame( 10, has_filter( 'old_slug_redirect_url', array( Llms_Txt::class, 'preserve_llms_txt_request' ) ) );
			$this->assertSame( $active ? 10 : false, has_action( 'template_redirect', array( Llms_Txt::class, 'maybe_serve' ) ) );
		} finally {
			$GLOBALS['wp_filter'] = $hooks; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			if ( null === $visibility ) {
				delete_option( 'jetpack_seo_surface_visible_v2' );
			} else {
				update_option( 'jetpack_seo_surface_visible_v2', $visibility );
			}
			$initialized->setValue( null, $was_initialized );
		}
	}

	/**
	 * @return array Legacy visibility preferences and SEO Tools activation states.
	 */
	public static function provide_hidden_output_states() {
		return array(
			'module off'               => array( true, false ),
			'legacy hidden preference' => array( false, true ),
		);
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
	public function test_cross_plugin_visibility_contract_is_kept_on_initializer() {
		$this->assertTrue( method_exists( Initializer::class, 'is_seo_surface_visible' ) );
		$this->assertTrue( Initializer::is_seo_surface_visible() );
	}

	/**
	 * With SEO Tools active, init() registers the front-end schema, GEO, and admin/REST hooks.
	 * Module state is supplied through a filter because the package has no on-disk modules.
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
		add_filter( 'jetpack_active_modules', $enable_module );

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
			remove_filter( 'jetpack_active_modules', $enable_module );
			$initialized->setValue( null, false );
		}
	}

	/**
	 * WordPress.com's API requests call register_write_hooks() without init(), so it alone must
	 * register the "Always include" field and hook the coverage and llms.txt clearing.
	 */
	public function test_write_hooks_register_without_init() {
		$hooks = array_map(
			static function ( $hook ) {
				return clone $hook;
			},
			$GLOBALS['wp_filter']
		);
		unset( $GLOBALS['wp_filter']['transition_post_status'], $GLOBALS['wp_filter']['clean_post_cache'] );
		unregister_meta_key( 'post', Llms_Txt::META_ALWAYS_INCLUDE );
		remove_action( 'wp_after_insert_post', array( Indexnow_Events::class, 'saved' ) );
		remove_action( Indexnow_Queue::HOOK, array( Indexnow_Queue::class, 'work' ) );
		try {
			Initializer::register_write_hooks();
			$this->assertTrue( registered_meta_key_exists( 'post', Llms_Txt::META_ALWAYS_INCLUDE ) );
			$this->assertNotFalse(
				has_action( 'transition_post_status', array( Content_Coverage::class, 'invalidate_on_status_change' ) )
			);
			$this->assertNotFalse( has_action( 'clean_post_cache', array( Llms_Txt::class, 'clear_cache_for_post' ) ) );
			$this->assertNotFalse( has_action( 'wp_after_insert_post', array( Indexnow_Events::class, 'saved' ) ) );
			$this->assertNotFalse( has_action( Indexnow_Queue::HOOK, array( Indexnow_Queue::class, 'work' ) ) );
		} finally {
			$GLOBALS['wp_filter'] = $hooks; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
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
	 * Run init() with SEO Tools active and Simple's canonical switch on.
	 *
	 * @return array{llms_txt: bool, ai_crawlers: bool, canonical: bool} Registered services.
	 */
	private function init_and_check_services() {
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, false );

		$enable_module = static function () {
			return array( 'seo-tools' );
		};
		add_filter( 'jetpack_active_modules', $enable_module );
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
			remove_filter( 'jetpack_active_modules', $enable_module );
			delete_option( Canonical_Urls::OPTION );
			remove_action( 'after_setup_theme', array( Canonical_Urls::class, 'load_module' ) );
			$initialized->setValue( null, false );
		}
	}

	public function test_init_registers_services_on_self_hosted_sites() {
		$hooked = $this->init_and_check_services();

		$this->assertTrue( $hooked['llms_txt'] );
		$this->assertTrue( $hooked['ai_crawlers'] );
	}

	public function test_init_registers_services_on_entitled_wpcom_site() {
		$this->simulate_wpcom_site( true );

		try {
			$hooked = $this->init_and_check_services();

			$this->assertTrue( $hooked['llms_txt'] );
			$this->assertTrue( $hooked['ai_crawlers'] );
			$this->assertTrue( $hooked['canonical'] );
		} finally {
			$this->reset_wpcom_site();
		}
	}

	public function test_init_registers_services_without_wpcom_entitlement() {
		$this->simulate_wpcom_site( false );

		try {
			$hooked = $this->init_and_check_services();

			$this->assertTrue( $hooked['llms_txt'] );
			$this->assertTrue( $hooked['ai_crawlers'] );
			$this->assertTrue( $hooked['canonical'] );
		} finally {
			$this->reset_wpcom_site();
		}
	}

	public function test_init_registers_schema_and_menu_without_wpcom_entitlement() {
		$this->simulate_wpcom_site( false );

		try {
			$this->init_and_check_services();

			$this->assertNotFalse( has_action( 'wp_head', array( Schema_Builder::class, 'emit' ) ) );
			$this->assertNotFalse(
				has_action( 'admin_menu', array( Admin_Page::class, 'maybe_load_wp_build' ) )
			);
		} finally {
			$this->reset_wpcom_site();
		}
	}

	/**
	 * Run init() with the given deliberate-off flag and legacy discoverability value, and
	 * report whether it suppressed WordPress core's own sitemap (registered the
	 * `wp_sitemaps_enabled` → false filter). Mirrors the schema/GEO test setup.
	 *
	 * @param bool $user_disabled  Whether SUPPRESS_WP_SITEMAP_OPTION (deliberate off) is set.
	 * @param bool $legacy_visible Whether the old discoverability preference is set.
	 * @return bool Whether init() registered the core-sitemap-suppression filter.
	 */
	private function init_and_report_core_sitemaps_disabled( $user_disabled, $legacy_visible = true ) {
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, false );

		if ( $legacy_visible ) {
			update_option( 'jetpack_seo_surface_visible_v2', '1' );
		} else {
			delete_option( 'jetpack_seo_surface_visible_v2' );
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
			remove_filter( 'wp_sitemaps_enabled', '__return_false' );
			$this->remove_sitemap_toggle_hooks();
			delete_option( 'jetpack_seo_surface_visible_v2' );
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
	 * An older unset discoverability preference must not weaken a deliberate sitemap-off choice.
	 */
	public function test_init_suppresses_core_sitemaps_with_legacy_visibility_unset() {
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

		update_option( 'jetpack_seo_surface_visible_v2', '1' );
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
			$this->remove_sitemap_toggle_hooks();
			delete_option( 'jetpack_seo_surface_visible_v2' );
			delete_option( Initializer::SUPPRESS_WP_SITEMAP_OPTION );
			$initialized->setValue( null, false );
		}
	}

	/**
	 * Run init() with either legacy visibility preference, and return the "Configure" URL
	 * each SEO module resolves to.
	 *
	 * @param bool $legacy_visible Whether the old discoverability preference is set.
	 * @return array<string, string> Module slug => configuration URL.
	 */
	private function init_and_get_configuration_urls( $legacy_visible ) {
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, false );

		$modules = array( 'seo-tools', 'verification-tools', 'sitemaps' );
		if ( $legacy_visible ) {
			update_option( 'jetpack_seo_surface_visible_v2', '1' );
		} else {
			delete_option( 'jetpack_seo_surface_visible_v2' );
		}
		// Discard registrations left by other initialization tests.
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
			$this->remove_sitemap_toggle_hooks();
			delete_option( 'jetpack_seo_surface_visible_v2' );
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
	 * An older hidden preference must not keep configuration links on the legacy settings.
	 */
	public function test_configuration_urls_use_the_dashboard_for_existing_installs() {
		$this->assertSame(
			array(
				'seo-tools'          => Admin_Page::get_url(),
				'verification-tools' => Admin_Page::get_url(),
				'sitemaps'           => Admin_Page::get_url(),
			),
			$this->init_and_get_configuration_urls( false )
		);
	}

	/**
	 * The admin shell lists SEO only when init() registers the SEO page.
	 *
	 * @dataProvider surface_visibility
	 *
	 * @param bool $surface_visible Whether the SEO dashboard surface is visible.
	 */
	#[DataProvider( 'surface_visibility' )]
	public function test_admin_shell_member_registers_with_the_page( $surface_visible ) {
		remove_filter( 'jetpack_admin_shell_members', array( Admin_Page::class, 'add_admin_shell_member' ) );
		$this->init_and_get_configuration_urls( $surface_visible );

		try {
			$this->assertSame(
				true,
				false !== has_filter( 'jetpack_admin_shell_members', array( Admin_Page::class, 'add_admin_shell_member' ) )
			);
		} finally {
			remove_filter( 'jetpack_admin_shell_members', array( Admin_Page::class, 'add_admin_shell_member' ) );
		}
	}

	/**
	 * Surface visibility cases.
	 *
	 * @return array<string, array{bool}>
	 */
	public static function surface_visibility() {
		return array(
			'visible' => array( true ),
			'hidden'  => array( false ),
		);
	}
}
