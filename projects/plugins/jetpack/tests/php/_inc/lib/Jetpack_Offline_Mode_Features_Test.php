<?php
/**
 * Tests for Jetpack Offline Mode feature registry.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status\Cache as StatusCache;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-offline-mode-features.php';

/**
 * Tests the Offline Mode feature registry.
 */
class Jetpack_Offline_Mode_Features_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function tear_down() {
		remove_all_filters( 'jetpack_offline_mode' );
		Jetpack::update_active_modules( array() );
		StatusCache::clear();
		parent::tear_down();
	}

	public function test_get_recommended_modules_returns_curated_starter_set() {
		$this->assertSame(
			array(
				'contact-form',
				'blocks',
				'shortcodes',
				'tiled-gallery',
				'carousel',
				'widgets',
				'widget-visibility',
				'markdown',
				'copy-post',
				'sharedaddy',
				'sitemaps',
				'seo-tools',
			),
			Jetpack_Offline_Mode_Features::get_recommended_modules()
		);
	}

	public function test_get_partial_features_contains_newsletter_with_limitation_note() {
		$partials = Jetpack_Offline_Mode_Features::get_partial_features();

		$this->assertArrayHasKey( 'newsletter', $partials );
		$this->assertSame( 'subscriptions', $partials['newsletter']['module'] );
		$this->assertSame( 'partial', $partials['newsletter']['type'] );
		$this->assertNotEmpty( $partials['newsletter']['limitation'] );
		$this->assertStringContainsString( 'delivery', $partials['newsletter']['limitation'] );
	}

	public function test_get_dashboard_data_lists_offline_modules_and_partials() {
		Jetpack::update_active_modules( array( 'contact-form' ) );

		$data  = Jetpack_Offline_Mode_Features::get_dashboard_data();
		$slugs = wp_list_pluck( $data['features'], 'slug' );

		$this->assertContains( 'contact-form', $slugs );
		$this->assertContains( 'newsletter', $slugs );
		$this->assertNotContains( 'stats', $slugs );
		$this->assertSame( 1, $data['counts']['enabled'] );
		$this->assertGreaterThan( 0, $data['counts']['offline_safe'] );
		$this->assertSame( 1, $data['counts']['partial'] );
	}

	public function test_get_dashboard_data_includes_documentation_redirect_urls() {
		$data     = Jetpack_Offline_Mode_Features::get_dashboard_data();
		$features = array_combine( wp_list_pluck( $data['features'], 'slug' ), $data['features'] );

		$this->assertArrayHasKey( 'contact-form', $features );
		$this->assertArrayHasKey( 'newsletter', $features );
		$this->assertStringStartsWith( 'https://jetpack.com/redirect/?', $features['contact-form']['documentation_url'] );
		$this->assertStringContainsString( 'source=jetpack-support-contact-form', $features['contact-form']['documentation_url'] );
		$this->assertStringStartsWith( 'https://jetpack.com/redirect/?', $features['newsletter']['documentation_url'] );
		$this->assertStringContainsString( 'url=https%3A%2F%2Fjetpack.com%2Fsupport%2Fnewsletter', $features['newsletter']['documentation_url'] );
	}

	public function test_partial_module_callback_allows_curated_partial_module() {
		$this->assertTrue(
			Jetpack_Offline_Mode_Features::allow_partial_module_in_offline_mode( false, 'subscriptions', array() )
		);
		$this->assertFalse(
			Jetpack_Offline_Mode_Features::allow_partial_module_in_offline_mode( false, 'stats', array() )
		);
		$this->assertTrue(
			Jetpack_Offline_Mode_Features::allow_partial_module_in_offline_mode( true, 'stats', array() )
		);
	}

	public function test_registry_filter_allows_newsletter_underlying_module_activation_in_offline_mode() {
		$callback     = array( 'Jetpack_Offline_Mode_Features', 'allow_partial_module_in_offline_mode' );
		$added_filter = false;

		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );

		if ( false === has_filter( 'jetpack_offline_mode_allow_module_activation', $callback ) ) {
			add_filter( 'jetpack_offline_mode_allow_module_activation', $callback, 10, 3 );
			$added_filter = true;
		}

		try {
			$this->assertTrue( Jetpack::activate_module( 'subscriptions', false, false ) );
			$this->assertTrue( Jetpack::is_module_active( 'subscriptions' ) );
		} finally {
			Jetpack::update_active_modules( array() );
			if ( $added_filter ) {
				remove_filter( 'jetpack_offline_mode_allow_module_activation', $callback, 10 );
			}
			remove_filter( 'jetpack_offline_mode', '__return_true' );
			StatusCache::clear();
		}
	}
}
