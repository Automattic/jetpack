<?php
/**
 * Tests for the dashboard's data builders and live module state.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\SEO\Dashboard_Data
 * @covers \Automattic\Jetpack\SEO\Seo_Tools
 */
#[CoversClass( Dashboard_Data::class )]
#[CoversClass( Seo_Tools::class )]
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
		\Jetpack_AI_Settings::$is_ai_seo_enabled        = true;
		\Jetpack_AI_Settings::$is_ai_enabled            = true;
		delete_option( 'advanced_seo_title_formats' );
		delete_option( Dashboard_Data::FRONT_PAGE_META_OPTION );
		delete_option( 'jetpack_ai_seo_enabled' );
		delete_option( 'jetpack_seo_sitemap_enabled' );
		delete_option( 'jetpack_seo_canonical_urls_enabled' );
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( 'jetpack_ai_seo_enabled' );
		remove_all_filters( 'jetpack_seo_conflicting_plugin' );
		remove_all_filters( 'jetpack_disable_seo_tools' );

		self::reset_plan();

		parent::tearDown();
	}

	/**
	 * With the AI SEO control off the card stays available and reports the
	 * control's state, so the dashboard disables the toggle rather than hiding
	 * it and the saved choice stays visible.
	 */
	public function test_get_geo_data_reports_the_ai_seo_control_state() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );

		$on = Dashboard_Data::get_geo_data()['enhancer'];

		\Jetpack_AI_Settings::$is_ai_seo_enabled = false;

		$off = Dashboard_Data::get_geo_data()['enhancer'];

		$this->assertTrue( $on['available'], 'Precondition: available while the control is on.' );
		$this->assertTrue( $on['aiSeoEnabled'] );
		$this->assertTrue( $off['available'], 'The card stays available so it can be disabled, not hidden.' );
		$this->assertFalse( $off['aiSeoEnabled'] );
	}

	/**
	 * The site-wide Jetpack AI switch is reported on its own, so the tab can name it.
	 */
	public function test_get_geo_data_reports_the_jetpack_ai_switch_state() {
		$this->assertTrue( Dashboard_Data::get_geo_data()['enhancer']['aiEnabled'] );

		\Jetpack_AI_Settings::$is_ai_enabled = false;

		$this->assertFalse( Dashboard_Data::get_geo_data()['enhancer']['aiEnabled'] );
	}

	/**
	 * The plan and the feature filter still veto availability outright — those
	 * are entitlement questions, not a switched-off control.
	 */
	public function test_get_geo_data_enhancer_unavailable_without_the_entitlement() {
		self::set_plan( 'jetpack_free' );
		self::set_seo_tools_active( true );

		$this->assertFalse( Dashboard_Data::get_geo_data()['enhancer']['available'] );
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
	 * The GEO tab bootstrap exposes the enhancer shape the React app expects, with
	 * boolean availability/enabled. Without a plan-supporting environment the
	 * enhancer is unavailable.
	 */
	public function test_get_geo_data_shape() {
		// Force the enhancer feature filter off so availability is deterministic
		// regardless of whether Current_Plan happens to be loaded in the test
		// environment (availability is `filter_on && plan_supports`).
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );

		try {
			$geo = Dashboard_Data::get_geo_data();

			$this->assertArrayHasKey( 'enhancer', $geo );
			$this->assertArrayHasKey( 'available', $geo['enhancer'] );
			$this->assertArrayHasKey( 'enabled', $geo['enhancer'] );
			$this->assertIsBool( $geo['enhancer']['available'] );
			$this->assertIsBool( $geo['enhancer']['enabled'] );
			// With the feature filter forced off, the enhancer is never available.
			$this->assertFalse( $geo['enhancer']['available'] );
			$this->assertArrayHasKey( 'llmsTxt', $geo );
			$this->assertIsBool( $geo['llmsTxt']['enabled'] );
			$this->assertIsString( $geo['llmsTxt']['url'] );
			$this->assertIsBool( $geo['llmsTxt']['canServe'] );
			$this->assertArrayHasKey( 'crawlers', $geo );
			$this->assertIsArray( $geo['crawlers']['catalog'] );
			// A sparse map, cast to an object by get_bootstrap_data() so an empty
			// override set serializes as `{}` rather than `[]` — the same reason
			// `title_formats` is cast in get_settings_data().
			$this->assertIsObject( $geo['crawlers']['overrides'] );
			$this->assertIsBool( $geo['crawlers']['dataSharingOptOut'] );
			$this->assertIsBool( $geo['crawlers']['pathBasedMultisite'] );
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
	 * @dataProvider provide_module_states
	 * @param bool $sitemaps Whether sitemaps are active.
	 * @param bool $canonical Whether canonical URLs are active.
	 */
	#[DataProvider( 'provide_module_states' )]
	public function test_dashboard_follows_modules_despite_conflicting_obsolete_options( $sitemaps, $canonical ) {
		update_option( 'jetpack_seo_sitemap_enabled', ! $sitemaps );
		update_option( 'jetpack_seo_canonical_urls_enabled', ! $canonical );
		add_filter(
			'jetpack_active_modules',
			static function () use ( $sitemaps, $canonical ) {
				return array_keys(
					array_filter(
						array(
							'sitemaps'           => $sitemaps,
							'canonical-urls'     => $canonical,
							'verification-tools' => true,
						)
					)
				);
			}
		);

		$settings = Dashboard_Data::get_settings_data();
		$overview = Dashboard_Data::get_overview_data();

		$this->assertSame( $sitemaps, $settings['sitemap_active'] );
		$this->assertSame( $sitemaps, $overview['site_visibility']['sitemap_active'] );
		$this->assertSame( $canonical, $settings['canonical_active'] );
		$this->assertTrue( $settings['verification_tools_active'] );
		$this->assertArrayHasKey( 'organization', $settings['schema'] );
		$this->assertArrayHasKey( 'defaults', $settings['schema'] );
	}

	/**
	 * @return array Module activation combinations.
	 */
	public static function provide_module_states() {
		return array(
			'both active'    => array( true, true ),
			'both inactive'  => array( false, false ),
			'sitemaps only'  => array( true, false ),
			'canonical only' => array( false, true ),
		);
	}

	/**
	 * A page type cleared through the site-settings API is stored as an empty
	 * string; the Settings tab must receive an empty list for it, not a string.
	 */
	public function test_get_settings_data_coerces_cleared_title_formats_to_lists() {
		update_option(
			'advanced_seo_title_formats',
			array(
				'front_page' => '',
				'posts'      => array(
					array(
						'type'  => 'token',
						'value' => 'post_title',
					),
					'not a token',
				),
				'pages'      => 'garbage',
				'archives'   => array(
					'type'  => 'token',
					'value' => 'archive_title',
				),
			)
		);

		$formats = (array) Dashboard_Data::get_settings_data()['title_formats'];

		$this->assertSame( array(), $formats['front_page'] );
		$this->assertSame(
			array(
				array(
					'type'  => 'token',
					'value' => 'post_title',
				),
			),
			$formats['posts']
		);
		$this->assertSame( array(), $formats['pages'] );
		// An associative entry is one token's shape at the wrong depth, not a list.
		$this->assertSame( array(), $formats['archives'] );
	}

	/**
	 * A non-array option value yields no formats rather than a fatal.
	 */
	public function test_normalize_title_formats_rejects_non_arrays() {
		$this->assertSame( array(), Dashboard_Data::normalize_title_formats( '' ) );
		$this->assertSame( array(), Dashboard_Data::normalize_title_formats( false ) );
		$this->assertSame( array(), Dashboard_Data::normalize_title_formats( 'a:1:{}' ) );
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
	 * The locked front-page description shows what Jetpack saved, not the helper's legacy fallback.
	 */
	public function test_get_settings_data_shows_the_saved_description_while_output_is_disabled() {
		update_option( Dashboard_Data::FRONT_PAGE_META_OPTION, 'Saved description.' );
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );

		$this->assertSame( 'Saved description.', Dashboard_Data::get_settings_data()['front_page_description'] );
	}

	/**
	 * @dataProvider provide_conflicting_seo_plugin_states
	 * @param bool        $disabled Whether `jetpack_disable_seo_tools` is on.
	 * @param string|null $name     What `jetpack_seo_conflicting_plugin` returns, or null for no callback.
	 * @param string      $expected The name both payloads should report.
	 */
	#[DataProvider( 'provide_conflicting_seo_plugin_states' )]
	public function test_dashboard_names_the_conflicting_seo_plugin( $disabled, $name, $expected ) {
		if ( $disabled ) {
			add_filter( 'jetpack_disable_seo_tools', '__return_true' );
		}
		if ( null !== $name ) {
			add_filter(
				'jetpack_seo_conflicting_plugin',
				static function () use ( $name ) {
					return $name;
				}
			);
		}

		$this->assertSame( $expected, Dashboard_Data::get_overview_data()['conflicting_seo_plugin'] );
		$this->assertSame( $expected, Dashboard_Data::get_settings_data()['conflicting_seo_plugin'] );
		$llms_txt = Dashboard_Data::get_geo_data()['llmsTxt'];
		$this->assertSame( $disabled || null !== $name && '' !== trim( $name ), $llms_txt['disabled'] );
		$this->assertSame( $expected, $llms_txt['conflictingPlugin'] );
		if ( $llms_txt['disabled'] ) {
			$this->assertFalse( $llms_txt['canServe'] );
		}
	}

	public function test_general_disable_filter_can_override_the_plugin_default() {
		add_filter(
			'jetpack_seo_conflicting_plugin',
			static function () {
				return 'Yoast SEO';
			}
		);
		$this->assertTrue( Seo_Tools::is_disabled() );
		add_filter( 'jetpack_disable_seo_tools', '__return_false' );
		$this->assertFalse( Seo_Tools::is_disabled() );
		$this->assertFalse( Dashboard_Data::get_geo_data()['llmsTxt']['disabled'] );
	}

	/**
	 * @return array Step-aside state, filtered name, expected report.
	 */
	public static function provide_conflicting_seo_plugin_states() {
		return array(
			'no conflict'                    => array( false, null, '' ),
			'Jetpack stepped aside'          => array( true, ' Yoast SEO ', 'Yoast SEO' ),
			'disabled without a plugin'      => array( true, null, '' ),
			'conflict sets default disabled' => array( false, 'Yoast SEO', 'Yoast SEO' ),
		);
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
