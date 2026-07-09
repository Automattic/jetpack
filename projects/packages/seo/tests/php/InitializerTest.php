<?php
/**
 * Tests for the Jetpack SEO Initializer.
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
	 * The Initializer class exists and exposes the expected menu slug.
	 */
	public function test_menu_slug_constant_is_defined() {
		$this->assertSame( 'jetpack-seo', Initializer::MENU_SLUG );
	}

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
	 * The factual content-coverage counts expose the expected integer shape
	 * (state, not a score). Invoked directly to avoid get_overview_data()'s
	 * Modules dependency, which needs host-plugin option classes absent here.
	 */
	public function test_content_coverage_shape() {
		$method = new \ReflectionMethod( Initializer::class, 'get_content_coverage' );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$coverage = $method->invoke( null );

		foreach ( array( 'total', 'with_schema', 'with_title', 'with_description', 'with_search_visible' ) as $key ) {
			$this->assertArrayHasKey( $key, $coverage );
			$this->assertIsInt( $coverage[ $key ] );
		}

		// Search-visible can never exceed the total (it's total minus noindexed).
		$this->assertLessThanOrEqual( $coverage['total'], $coverage['with_search_visible'] );
	}

	/**
	 * `count_published_with_meta()` supports an exact-value match (used for the
	 * schema-type metric) in addition to the default "non-empty" mode. Exercised
	 * directly because the Overview only ever calls the non-empty mode, so the
	 * value-match branch would otherwise go uncovered. Returns an integer count
	 * (zero in the empty test environment).
	 */
	public function test_count_published_with_meta_supports_exact_value() {
		$method = new \ReflectionMethod( Initializer::class, 'count_published_with_meta' );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$count = $method->invoke( null, array( 'post', 'page' ), 'jetpack_seo_schema_type', 'article' );

		$this->assertIsInt( $count );
		$this->assertSame( 0, $count );
	}

	/**
	 * `get_overview_data()` assembles the full Overview bootstrap (site
	 * visibility, verification booleans, content coverage, and plan state) the
	 * dashboard reads. With no host-plugin options present it degrades to
	 * sensible defaults, so we assert only the stable shape and types.
	 */
	public function test_get_overview_data_shape() {
		$overview = Initializer::get_overview_data();

		$this->assertArrayHasKey( 'site_visibility', $overview );
		$this->assertArrayHasKey( 'site_verification', $overview );
		$this->assertArrayHasKey( 'content_coverage', $overview );
		$this->assertArrayHasKey( 'plan', $overview );

		$this->assertArrayHasKey( 'search_engines_visible', $overview['site_visibility'] );
		$this->assertIsBool( $overview['site_visibility']['search_engines_visible'] );

		$this->assertArrayHasKey( 'total', $overview['content_coverage'] );
		$this->assertIsInt( $overview['content_coverage']['total'] );

		$this->assertArrayHasKey( 'seo_enabled_for_site', $overview['plan'] );
		$this->assertIsBool( $overview['plan']['seo_enabled_for_site'] );
	}

	/**
	 * With the feature flag on, the surface discoverable, and the `seo-tools` module
	 * active, `init()` registers the front-end JSON-LD schema and the admin/REST hooks.
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

			// Line proving the body ran past the module gate: Schema_Builder::init()
			// self-hooks wp_head, and init() registers its admin/REST callbacks.
			$this->assertNotFalse(
				has_action( 'wp_head', array( Schema_Builder::class, 'emit' ) )
			);
			$this->assertNotFalse(
				has_action( 'admin_menu', array( Initializer::class, 'maybe_load_wp_build' ) )
			);
			$this->assertNotFalse(
				has_action( 'rest_api_init', array( Initializer::class, 'register_rest_settings' ) )
			);
		} finally {
			remove_filter( 'rsm_jetpack_seo', '__return_true' );
			remove_filter( 'jetpack_active_modules', $enable_module );
			delete_option( Initializer::VISIBILITY_OPTION );
			$initialized->setValue( null, false );
		}
	}

	/**
	 * The Google-verification bootstrap exposes the connect URL + connection flag the
	 * React app expects, with the right types. Without the host plugin's Keyring/Manager
	 * classes present (the package test context) it degrades to an empty URL and not
	 * connected, so the UI falls back to manual entry.
	 */
	public function test_get_google_verify_data_shape() {
		$data = Initializer::get_google_verify_data();

		$this->assertArrayHasKey( 'connect_url', $data );
		$this->assertArrayHasKey( 'is_connected', $data );
		$this->assertIsString( $data['connect_url'] );
		$this->assertIsBool( $data['is_connected'] );
		$this->assertSame( '', $data['connect_url'] );
		$this->assertFalse( $data['is_connected'] );
	}

	/**
	 * The AI tab bootstrap exposes the enhancer shape the React app expects, with
	 * boolean availability/enabled. Without a plan-supporting environment the
	 * enhancer is unavailable.
	 */
	public function test_get_ai_data_shape() {
		// Force the enhancer feature filter off so availability is deterministic
		// regardless of whether Current_Plan happens to be loaded in the test
		// environment (availability is `filter_on && plan_supports`).
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );

		try {
			$ai = Initializer::get_ai_data();

			$this->assertArrayHasKey( 'enhancer', $ai );
			$this->assertArrayHasKey( 'available', $ai['enhancer'] );
			$this->assertArrayHasKey( 'enabled', $ai['enhancer'] );
			$this->assertIsBool( $ai['enhancer']['available'] );
			$this->assertIsBool( $ai['enhancer']['enabled'] );
			// With the feature filter forced off, the enhancer is never available.
			$this->assertFalse( $ai['enhancer']['available'] );
		} finally {
			remove_filter( 'ai_seo_enhancer_enabled', '__return_false' );
		}
	}

	/**
	 * The site-identity bootstrap (used by the Settings search/social previews)
	 * exposes title, url, icon and image, all as strings. With no site icon or
	 * custom logo in the test environment the image falls back to the (empty)
	 * icon.
	 */
	public function test_get_site_data_shape() {
		$site = Initializer::get_site_data();

		$this->assertArrayHasKey( 'title', $site );
		$this->assertArrayHasKey( 'url', $site );
		$this->assertArrayHasKey( 'icon', $site );
		$this->assertArrayHasKey( 'image', $site );
		$this->assertIsString( $site['title'] );
		$this->assertIsString( $site['url'] );
		$this->assertIsString( $site['icon'] );
		$this->assertIsString( $site['image'] );
	}

	/**
	 * Reads the durable sitemap option without consulting the live module state
	 * when the option is present (set or explicitly off).
	 */
	public function test_is_sitemap_enabled_reads_durable_option() {
		$method = new \ReflectionMethod( Initializer::class, 'is_sitemap_enabled' );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$modules = new \Automattic\Jetpack\Modules();

		update_option( Initializer::SITEMAP_ENABLED_OPTION, '1' );
		$this->assertTrue( $method->invoke( null, $modules ) );

		// Present-but-off: still read from the option, never the module fallback.
		update_option( Initializer::SITEMAP_ENABLED_OPTION, '' );
		$this->assertFalse( $method->invoke( null, $modules ) );

		delete_option( Initializer::SITEMAP_ENABLED_OPTION );
	}

	/**
	 * Reads the durable canonical-urls option without consulting the live module state
	 * when the option is present (set or explicitly off).
	 */
	public function test_is_canonical_enabled_reads_durable_option() {
		$method = new \ReflectionMethod( Initializer::class, 'is_canonical_enabled' );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$modules = new \Automattic\Jetpack\Modules();

		update_option( Initializer::CANONICAL_ENABLED_OPTION, '1' );
		$this->assertTrue( $method->invoke( null, $modules ) );

		// Present-but-off: still read from the option, never the module fallback.
		update_option( Initializer::CANONICAL_ENABLED_OPTION, '' );
		$this->assertFalse( $method->invoke( null, $modules ) );

		delete_option( Initializer::CANONICAL_ENABLED_OPTION );
	}

	/**
	 * The Settings bootstrap sources `sitemap_active` / `canonical_active` from the durable
	 * options, so the module toggles hydrate correctly without reading live module state.
	 */
	public function test_get_settings_data_reads_module_toggles_from_options() {
		update_option( Initializer::SITEMAP_ENABLED_OPTION, '1' );
		update_option( Initializer::CANONICAL_ENABLED_OPTION, '' );

		$settings = Initializer::get_settings_data();

		$this->assertArrayHasKey( 'sitemap_active', $settings );
		$this->assertArrayHasKey( 'canonical_active', $settings );
		$this->assertArrayHasKey( 'schema', $settings );
		$this->assertArrayHasKey( 'organization', $settings['schema'] );
		$this->assertArrayHasKey( 'defaults', $settings['schema'] );
		$this->assertTrue( $settings['sitemap_active'] );
		$this->assertFalse( $settings['canonical_active'] );

		delete_option( Initializer::SITEMAP_ENABLED_OPTION );
		delete_option( Initializer::CANONICAL_ENABLED_OPTION );
	}

	/**
	 * On self-hosted sites, discoverability is driven by the durable cohort option:
	 * hidden when absent (the non-disruptive default) or empty, visible when set.
	 */
	public function test_is_seo_surface_visible_reads_cohort_option_on_self_hosted() {
		delete_option( Initializer::VISIBILITY_OPTION );
		$this->assertFalse( Initializer::is_seo_surface_visible() );

		update_option( Initializer::VISIBILITY_OPTION, '1' );
		$this->assertTrue( Initializer::is_seo_surface_visible() );

		update_option( Initializer::VISIBILITY_OPTION, '' );
		$this->assertFalse( Initializer::is_seo_surface_visible() );

		delete_option( Initializer::VISIBILITY_OPTION );
	}

	/**
	 * WordPress.com sites (here: Simple, via the IS_WPCOM constant) are always
	 * discoverable, bypassing the cohort option entirely.
	 */
	public function test_is_seo_surface_visible_always_true_on_wpcom() {
		delete_option( Initializer::VISIBILITY_OPTION ); // Hidden for self-hosted...
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );

		try {
			$this->assertTrue( Initializer::is_seo_surface_visible() );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	/**
	 * The opt-in is offered only when the feature flag is on AND the surface is still
	 * hidden (a self-hosted install that hasn't opted in).
	 */
	public function test_is_optin_available_requires_flag_and_hidden_surface() {
		delete_option( Initializer::VISIBILITY_OPTION );

		// Flag off → never available.
		$this->assertFalse( Initializer::is_optin_available() );

		add_filter( Initializer::FEATURE_FILTER, '__return_true' );
		try {
			// Flag on + surface hidden → available.
			$this->assertTrue( Initializer::is_optin_available() );

			// Flag on + surface visible (already opted in) → not available.
			update_option( Initializer::VISIBILITY_OPTION, '1' );
			$this->assertFalse( Initializer::is_optin_available() );
		} finally {
			remove_filter( Initializer::FEATURE_FILTER, '__return_true' );
			delete_option( Initializer::VISIBILITY_OPTION );
		}
	}

	/**
	 * The script-data injector surfaces opt-in availability under the `seo.optin_available`
	 * key (read by the legacy Traffic-page banner), and tolerates non-array input.
	 */
	public function test_inject_optin_availability_surfaces_flag_state() {
		delete_option( Initializer::VISIBILITY_OPTION );

		// Flag off → false, and non-array input is normalized to an array. Surface is also
		// hidden (no cohort option set on this self-hosted test site).
		$data = Initializer::inject_optin_availability( null );
		$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
		$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );

		// Flag on + surface hidden → opt-in offered, surface not yet visible; existing keys preserved.
		add_filter( Initializer::FEATURE_FILTER, '__return_true' );
		try {
			$data = Initializer::inject_optin_availability( array( 'keep' => 1 ) );
			$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
			$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
			$this->assertSame( 1, $data['keep'] );

			// Opted in → surface visible, opt-in no longer offered.
			update_option( Initializer::VISIBILITY_OPTION, '1' );
			$data = Initializer::inject_optin_availability( array() );
			$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
			$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
		} finally {
			remove_filter( Initializer::FEATURE_FILTER, '__return_true' );
			delete_option( Initializer::VISIBILITY_OPTION );
		}
	}

	/**
	 * The Settings tab only links to the sitemap when it is genuinely reachable.
	 * The URL helper short-circuits to an empty string when generation is disabled
	 * or the site is private, and (in the package-only test context, where the
	 * Jetpack plugin's Sitemaps module is absent) when the librarian/URL helper are
	 * unavailable — so the non-empty branch is exercised by plugin integration
	 * tests, not here.
	 */
	public function test_get_reachable_sitemap_url_returns_empty_when_not_reachable() {
		$method = new \ReflectionMethod( Initializer::class, 'get_reachable_sitemap_url' );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		// Capture the original so we restore (not delete) it — `blog_public` is a
		// core option the test bootstrap may already set, and clobbering it would
		// leak state into other tests.
		$original_blog_public = get_option( 'blog_public', null );

		try {
			// Generation disabled: no link regardless of anything else.
			update_option( 'blog_public', '1' );
			$this->assertSame( '', $method->invoke( null, false ) );

			// Enabled but the site discourages search engines: Jetpack never serves a
			// sitemap, so there is nothing to link to.
			update_option( 'blog_public', '0' );
			$this->assertSame( '', $method->invoke( null, true ) );

			// Enabled and public, but the Sitemaps module (librarian + URL helper) is
			// absent in the package context, so still no link.
			update_option( 'blog_public', '1' );
			$this->assertSame( '', $method->invoke( null, true ) );
		} finally {
			if ( null === $original_blog_public ) {
				delete_option( 'blog_public' );
			} else {
				update_option( 'blog_public', $original_blog_public );
			}
		}
	}

	/**
	 * The Settings bootstrap exposes `sitemap_url` as a string (empty until the
	 * sitemap is reachable) alongside the boolean `sitemap_active`, which the
	 * Settings tab uses to render the "View sitemap" link. The Overview no longer
	 * carries the URL — it shows the status only.
	 */
	public function test_get_settings_data_sitemap_url_is_string() {
		$settings = Initializer::get_settings_data();

		$this->assertArrayHasKey( 'sitemap_active', $settings );
		$this->assertIsBool( $settings['sitemap_active'] );
		$this->assertArrayHasKey( 'sitemap_url', $settings );
		$this->assertIsString( $settings['sitemap_url'] );

		$overview = Initializer::get_overview_data();
		$this->assertArrayNotHasKey( 'sitemap_url', $overview['site_visibility'] );
	}
}
