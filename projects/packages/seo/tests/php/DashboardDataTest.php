<?php
/**
 * Tests for the dashboard's data builders: the payload shapes each tab
 * hydrates from and the durable-option reads behind them.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\SEO\Dashboard_Data
 */
#[CoversClass( Dashboard_Data::class )]
class DashboardDataTest extends SeoTestCase {

	/**
	 * Clean up custom post types registered by these tests.
	 */
	protected function tearDown(): void {
		if ( post_type_exists( 'seo_book' ) ) {
			unregister_post_type( 'seo_book' );
		}

		\Jetpack_SEO_Utils::$enabled                    = true;
		\Jetpack_SEO_Utils::$has_legacy_front_page_meta = false;
		\Jetpack_Redux_State_Helper::$site_image        = '';
		delete_option( 'advanced_seo_title_formats' );
		remove_all_filters( 'jetpack_active_modules' );

		parent::tearDown();
	}

	/**
	 * `get_overview_data()` assembles the full Overview bootstrap (site
	 * visibility, verification booleans, content coverage, and plan state) the
	 * dashboard reads. With no host-plugin options present it degrades to
	 * sensible defaults, so we assert only the stable shape and types.
	 */
	public function test_get_overview_data_shape() {
		$overview = Dashboard_Data::get_overview_data();

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
	 * The Google-verification bootstrap exposes the connect URL + connection flag the
	 * React app expects, with the right types. Without the host plugin's Keyring/Manager
	 * classes present (the package test context) it degrades to an empty URL and not
	 * connected, so the UI falls back to manual entry.
	 */
	public function test_get_google_verify_data_shape() {
		$data = Dashboard_Data::get_google_verify_data();

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
			$ai = Dashboard_Data::get_ai_data();

			$this->assertArrayHasKey( 'enhancer', $ai );
			$this->assertArrayHasKey( 'available', $ai['enhancer'] );
			$this->assertArrayHasKey( 'enabled', $ai['enhancer'] );
			$this->assertIsBool( $ai['enhancer']['available'] );
			$this->assertIsBool( $ai['enhancer']['enabled'] );
			// With the feature filter forced off, the enhancer is never available.
			$this->assertFalse( $ai['enhancer']['available'] );
			$this->assertArrayHasKey( 'llmsTxt', $ai );
			$this->assertIsBool( $ai['llmsTxt']['enabled'] );
			$this->assertIsString( $ai['llmsTxt']['url'] );
			$this->assertIsBool( $ai['llmsTxt']['canServe'] );
			$this->assertArrayHasKey( 'crawlers', $ai );
			$this->assertIsArray( $ai['crawlers']['catalog'] );
			// A sparse map, cast to an object by get_bootstrap_data() so an empty
			// override set serializes as `{}` rather than `[]` — the same reason
			// `title_formats` is cast in get_settings_data().
			$this->assertIsObject( $ai['crawlers']['overrides'] );
			$this->assertIsBool( $ai['crawlers']['dataSharingOptOut'] );
			$this->assertIsBool( $ai['crawlers']['pathBasedMultisite'] );
		} finally {
			remove_filter( 'ai_seo_enhancer_enabled', '__return_false' );
		}
	}

	/**
	 * The Content tab receives the shared supported post type options.
	 */
	public function test_get_content_data_includes_supported_custom_post_types() {
		register_post_type(
			'seo_book',
			array(
				'label'        => 'Books',
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			)
		);

		$this->assertContains(
			array(
				'slug'  => 'seo_book',
				'label' => 'Books',
			),
			Dashboard_Data::get_content_data()['post_types']
		);
	}

	/**
	 * The site-identity bootstrap (used by the Settings search/social previews)
	 * exposes title, tagline, url, icon and image, all as strings. With no site icon or
	 * custom logo in the test environment the image falls back to the (empty)
	 * icon.
	 */
	public function test_get_site_data_shape() {
		\Jetpack_Redux_State_Helper::$site_image = 'https://example.com/representative.jpg';

		$site = Dashboard_Data::get_site_data();

		$this->assertArrayHasKey( 'title', $site );
		$this->assertArrayHasKey( 'tagline', $site );
		$this->assertArrayHasKey( 'url', $site );
		$this->assertArrayHasKey( 'icon', $site );
		$this->assertArrayHasKey( 'image', $site );
		$this->assertIsString( $site['title'] );
		$this->assertIsString( $site['tagline'] );
		$this->assertIsString( $site['url'] );
		$this->assertIsString( $site['icon'] );
		$this->assertIsString( $site['image'] );
		$this->assertSame( 'https://example.com/representative.jpg', $site['image'] );
	}

	/**
	 * Reads the durable sitemap option without consulting the live module state
	 * when the option is present (set or explicitly off).
	 */
	public function test_is_sitemap_enabled_reads_durable_option() {
		$modules = new \Automattic\Jetpack\Modules();

		update_option( Initializer::SITEMAP_ENABLED_OPTION, '1' );
		$this->assertTrue( $this->invoke_private( Dashboard_Data::class, 'is_sitemap_enabled', $modules ) );

		// Present-but-off: still read from the option, never the module fallback.
		update_option( Initializer::SITEMAP_ENABLED_OPTION, '' );
		$this->assertFalse( $this->invoke_private( Dashboard_Data::class, 'is_sitemap_enabled', $modules ) );

		delete_option( Initializer::SITEMAP_ENABLED_OPTION );
	}

	/**
	 * Reads the durable canonical-urls option without consulting the live module state
	 * when the option is present (set or explicitly off).
	 */
	public function test_is_canonical_enabled_reads_durable_option() {
		$modules = new \Automattic\Jetpack\Modules();

		update_option( Initializer::CANONICAL_ENABLED_OPTION, '1' );
		$this->assertTrue( $this->invoke_private( Dashboard_Data::class, 'is_canonical_enabled', $modules ) );

		// Present-but-off: still read from the option, never the module fallback.
		update_option( Initializer::CANONICAL_ENABLED_OPTION, '' );
		$this->assertFalse( $this->invoke_private( Dashboard_Data::class, 'is_canonical_enabled', $modules ) );

		delete_option( Initializer::CANONICAL_ENABLED_OPTION );
	}

	/**
	 * The Settings bootstrap sources `sitemap_active` / `canonical_active` from the durable
	 * options, so the module toggles hydrate correctly without reading live module state.
	 */
	public function test_get_settings_data_reads_module_toggles_from_options() {
		update_option( Initializer::SITEMAP_ENABLED_OPTION, '1' );
		update_option( Initializer::CANONICAL_ENABLED_OPTION, '' );
		add_filter(
			'jetpack_active_modules',
			static function ( $modules ) {
				$modules[] = 'verification-tools';
				return $modules;
			}
		);

		$settings = Dashboard_Data::get_settings_data();

		$this->assertArrayHasKey( 'sitemap_active', $settings );
		$this->assertArrayHasKey( 'canonical_active', $settings );
		$this->assertArrayHasKey( 'verification_tools_active', $settings );
		$this->assertArrayHasKey( 'schema', $settings );
		$this->assertArrayHasKey( 'organization', $settings['schema'] );
		$this->assertArrayHasKey( 'defaults', $settings['schema'] );
		$this->assertTrue( $settings['sitemap_active'] );
		$this->assertFalse( $settings['canonical_active'] );
		$this->assertTrue( $settings['verification_tools_active'] );

		delete_option( Initializer::SITEMAP_ENABLED_OPTION );
		delete_option( Initializer::CANONICAL_ENABLED_OPTION );
	}

	/**
	 * Stored title formats stay visible but read-only while conflicting SEO output
	 * disables Jetpack SEO, preventing a blank dashboard save from erasing them.
	 */
	public function test_get_settings_data_preserves_title_formats_while_output_is_disabled() {
		$formats = array(
			'front_page' => array(
				array(
					'type'  => 'token',
					'value' => 'site_name',
				),
			),
			'posts'      => array(
				array(
					'type'  => 'token',
					'value' => 'post_title',
				),
			),
			'pages'      => array(
				array(
					'type'  => 'token',
					'value' => 'page_title',
				),
			),
			'groups'     => array(
				array(
					'type'  => 'token',
					'value' => 'group_title',
				),
			),
			'archives'   => array(
				array(
					'type'  => 'token',
					'value' => 'archive_title',
				),
			),
		);
		update_option( 'advanced_seo_title_formats', $formats );
		\Jetpack_SEO_Utils::$enabled = false;

		$settings = Dashboard_Data::get_settings_data();

		$this->assertEquals( (object) $formats, $settings['title_formats'] );
		$this->assertFalse( $settings['title_formats_editable'] );
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
		// Capture the original so we restore (not delete) it — `blog_public` is a
		// core option the test bootstrap may already set, and clobbering it would
		// leak state into other tests.
		$original_blog_public = get_option( 'blog_public', null );

		try {
			// Generation disabled: no link regardless of anything else.
			update_option( 'blog_public', '1' );
			$this->assertSame( '', $this->invoke_private( Dashboard_Data::class, 'get_reachable_sitemap_url', false ) );

			// Enabled but the site discourages search engines: Jetpack never serves a
			// sitemap, so there is nothing to link to.
			update_option( 'blog_public', '0' );
			$this->assertSame( '', $this->invoke_private( Dashboard_Data::class, 'get_reachable_sitemap_url', true ) );

			// Enabled and public, but the Sitemaps module (librarian + URL helper) is
			// absent in the package context, so still no link.
			update_option( 'blog_public', '1' );
			$this->assertSame( '', $this->invoke_private( Dashboard_Data::class, 'get_reachable_sitemap_url', true ) );
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
		$settings = Dashboard_Data::get_settings_data();

		$this->assertArrayHasKey( 'sitemap_active', $settings );
		$this->assertIsBool( $settings['sitemap_active'] );
		$this->assertArrayHasKey( 'sitemap_url', $settings );
		$this->assertIsString( $settings['sitemap_url'] );

		$overview = Dashboard_Data::get_overview_data();
		$this->assertArrayNotHasKey( 'sitemap_url', $overview['site_visibility'] );
	}

	/**
	 * `title_separator` must be the separator as *rendered*, not the raw
	 * `document_title_separator` value. `wp_get_document_title()` runs the composed
	 * title through the `document_title` filter, which WordPress texturizes by
	 * default — so core's `-` reaches a visitor as an en dash. Previewing the raw
	 * value showed `-` on every site running core's defaults, which render `–`.
	 */
	public function test_get_settings_data_title_separator_is_rendered_not_raw() {
		$settings = Dashboard_Data::get_settings_data();

		$this->assertArrayHasKey( 'title_separator', $settings );
		$this->assertIsString( $settings['title_separator'] );
		$this->assertSame( "\u{2013}", $settings['title_separator'] );
	}

	/**
	 * A theme's own separator still wins — it is texturized, not replaced.
	 */
	public function test_get_settings_data_title_separator_honors_the_filter() {
		$filter = static function () {
			return '|';
		};
		add_filter( 'document_title_separator', $filter );

		$settings = Dashboard_Data::get_settings_data();

		remove_filter( 'document_title_separator', $filter );

		$this->assertSame( '|', $settings['title_separator'] );
	}
}
