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

	/**
	 * Indexes feature data by slug.
	 *
	 * @param array $features Feature data.
	 * @return array
	 */
	private function index_features_by_slug( $features ) {
		return array_combine( wp_list_pluck( $features, 'slug' ), $features );
	}

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

	public function test_get_partial_features_contains_boost_when_plugin_is_active() {
		$active_plugins = get_option( 'active_plugins', array() );
		$partials       = array();

		update_option( 'active_plugins', array( 'boost/jetpack-boost.php' ) );

		try {
			$partials = Jetpack_Offline_Mode_Features::get_partial_features();
		} finally {
			update_option( 'active_plugins', $active_plugins );
		}

		$this->assertArrayHasKey( 'boost', $partials );
		$this->assertSame( '', $partials['boost']['module'] );
		$this->assertSame( 'partial', $partials['boost']['type'] );
		$this->assertFalse( $partials['boost']['toggleable'] );
		$this->assertSame( 'boost', $partials['boost']['group'] );
		$this->assertStringContainsString( 'Image Guide', $partials['boost']['limitation'] );
		$this->assertStringContainsString( 'Speed scores', $partials['boost']['limitation'] );
	}

	public function test_get_groups_returns_product_focused_categories() {
		$this->assertSame(
			array(
				'boost'              => 'Boost',
				'protect'            => 'Protect',
				'forms'              => 'Forms',
				'newsletter'         => 'Newsletter',
				'search'             => 'Search',
				'social'             => 'Social',
				'media'              => 'Media',
				'writing'            => 'Writing',
				'design'             => 'Design',
				'vaultpress-backups' => 'VaultPress Backup',
				'other'              => 'Other local features',
			),
			Jetpack_Offline_Mode_Features::get_groups()
		);
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
		$this->assertSame( 4, $data['counts']['partial'] );
	}

	public function test_get_dashboard_data_marks_mixed_offline_modules_as_partial() {
		$data     = Jetpack_Offline_Mode_Features::get_dashboard_data();
		$features = $this->index_features_by_slug( $data['features'] );

		foreach ( array( 'blocks', 'shortcodes', 'widgets' ) as $slug ) {
			$this->assertArrayHasKey( $slug, $features );
			$this->assertSame( 'partial', $features[ $slug ]['type'] );
			$this->assertTrue( $features[ $slug ]['toggleable'] );
			$this->assertNotEmpty( $features[ $slug ]['limitation'] );
		}
	}

	public function test_get_dashboard_data_includes_always_available_theme_tools() {
		$data     = Jetpack_Offline_Mode_Features::get_dashboard_data();
		$features = $this->index_features_by_slug( $data['features'] );

		$this->assertArrayHasKey( 'theme-tools', $features );
		$this->assertSame( 'always_available', $features['theme-tools']['type'] );
		$this->assertFalse( $features['theme-tools']['toggleable'] );
		$this->assertTrue( $features['theme-tools']['active'] );
		$this->assertSame( 'design', $features['theme-tools']['group'] );
	}

	public function test_get_dashboard_data_assigns_offline_features_to_product_groups() {
		$data     = Jetpack_Offline_Mode_Features::get_dashboard_data();
		$features = $this->index_features_by_slug( $data['features'] );

		$this->assertSame( 'forms', $features['contact-form']['group'] );
		$this->assertSame( 'writing', $features['blocks']['group'] );
		$this->assertSame( 'newsletter', $features['newsletter']['group'] );
		$this->assertSame( 'search', $features['seo-tools']['group'] );
		$this->assertSame( 'media', $features['tiled-gallery']['group'] );
		$this->assertSame( 'design', $features['widget-visibility']['group'] );
		$this->assertSame( 'social', $features['sharedaddy']['group'] );
	}

	public function test_get_dashboard_data_lists_connection_required_modules_outside_toggleable_features() {
		$data                    = Jetpack_Offline_Mode_Features::get_dashboard_data();
		$feature_slugs           = wp_list_pluck( $data['features'], 'slug' );
		$requires_connection     = $this->index_features_by_slug( $data['requires_connection'] );
		$partial_module_features = wp_list_pluck( Jetpack_Offline_Mode_Features::get_partial_features(), 'module' );

		foreach ( Jetpack::get_available_modules( false, false, true, null ) as $module ) {
			if ( in_array( $module, $partial_module_features, true ) ) {
				continue;
			}

			$this->assertArrayHasKey( $module, $requires_connection, $module . ' should be listed as requiring a connection.' );
			$this->assertNotContains( $module, $feature_slugs, $module . ' should not be toggleable in Offline Mode.' );
			$this->assertSame( 'requires_connection', $requires_connection[ $module ]['type'] );
		}
	}

	public function test_get_dashboard_data_includes_connection_required_non_module_features() {
		$data                = Jetpack_Offline_Mode_Features::get_dashboard_data();
		$requires_connection = wp_list_pluck( $data['requires_connection'], 'slug' );

		$this->assertContains( 'jetpack-ai', $requires_connection );
		$this->assertContains( 'scan', $requires_connection );
		$this->assertContains( 'activity-log', $requires_connection );
		$this->assertContains( 'payments', $requires_connection );
	}

	public function test_get_dashboard_data_assigns_connection_required_features_to_product_groups() {
		$data                = Jetpack_Offline_Mode_Features::get_dashboard_data();
		$requires_connection = $this->index_features_by_slug( $data['requires_connection'] );

		$this->assertSame( 'protect', $requires_connection['scan']['group'] );
		$this->assertSame( 'protect', $requires_connection['activity-log']['group'] );
		$this->assertSame( 'newsletter', $requires_connection['payments']['group'] );

		if ( isset( $requires_connection['search'] ) ) {
			$this->assertSame( 'search', $requires_connection['search']['group'] );
		}
	}

	public function test_get_dashboard_data_labels_enhanced_comments_clearly() {
		$data                = Jetpack_Offline_Mode_Features::get_dashboard_data();
		$requires_connection = $this->index_features_by_slug( $data['requires_connection'] );

		$this->assertArrayHasKey( 'comments', $requires_connection );
		$this->assertSame( 'Jetpack Comments', $requires_connection['comments']['name'] );
	}

	public function test_get_dashboard_data_includes_documentation_redirect_urls() {
		$data     = Jetpack_Offline_Mode_Features::get_dashboard_data();
		$features = $this->index_features_by_slug( $data['features'] );

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
