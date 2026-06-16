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

		$this->assertArrayHasKey( 'total', $coverage );
		$this->assertArrayHasKey( 'with_description', $coverage );
		$this->assertArrayHasKey( 'with_schema', $coverage );
		$this->assertIsInt( $coverage['total'] );
		$this->assertIsInt( $coverage['with_description'] );
		$this->assertIsInt( $coverage['with_schema'] );
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
	 * With the feature flag on and the `seo-tools` module active, `init()`
	 * registers the front-end JSON-LD schema and the admin/REST hooks. We drive
	 * module state through the `jetpack_active_modules` filter (the package test
	 * context has no on-disk modules) and reset the one-shot `$initialized` guard
	 * so the body runs.
	 */
	public function test_init_registers_schema_and_hooks_when_enabled() {
		$initialized = new \ReflectionProperty( Initializer::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, false );

		$enable_module = static fn () => array( 'seo-tools' );
		add_filter( 'rsm_jetpack_seo', '__return_true' );
		add_filter( 'jetpack_active_modules', $enable_module );

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
}
