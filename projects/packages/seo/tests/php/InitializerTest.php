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
}
