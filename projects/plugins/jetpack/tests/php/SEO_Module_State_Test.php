<?php
/**
 * Tests SEO module-state cleanup and dashboard reads.
 *
 * @package jetpack
 */

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\SEO\Dashboard_Data;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class SEO_Module_State_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @dataProvider provide_module_states
	 * @param array $active_modules Active module slugs.
	 */
	#[DataProvider( 'provide_module_states' )]
	public function test_cleanup_deletes_obsolete_options_without_changing_activation( $active_modules ) {
		Jetpack_Options::update_option( 'active_modules', $active_modules );
		update_option( 'jetpack_seo_sitemap_enabled', ! in_array( 'sitemaps', $active_modules, true ) );
		update_option( 'jetpack_seo_canonical_urls_enabled', ! in_array( 'canonical-urls', $active_modules, true ) );
		update_option( 'jetpack_seo_module_state_reconciled', true );
		update_option( 'jetpack_seo_suppress_wp_sitemap', true );
		update_option( 'jetpack_seo_surface_visible', true );

		$modules   = new Modules();
		$sitemaps  = $modules->is_active( 'sitemaps' );
		$canonical = $modules->is_active( 'canonical-urls' );

		for ( $run = 0; $run < 2; ++$run ) {
			Jetpack::cleanup_seo_module_state_options();

			$this->assertNull( get_option( 'jetpack_seo_sitemap_enabled', null ) );
			$this->assertNull( get_option( 'jetpack_seo_canonical_urls_enabled', null ) );
			$this->assertNull( get_option( 'jetpack_seo_module_state_reconciled', null ) );
			$this->assertSame( $active_modules, Jetpack_Options::get_option( 'active_modules' ) );
			$this->assertSame( $sitemaps, $modules->is_active( 'sitemaps' ) );
			$this->assertSame( $canonical, $modules->is_active( 'canonical-urls' ) );
			$this->assertTrue( (bool) get_option( 'jetpack_seo_suppress_wp_sitemap' ) );
			$this->assertTrue( (bool) get_option( 'jetpack_seo_surface_visible' ) );
		}
	}

	/**
	 * @return array Module activation combinations.
	 */
	public static function provide_module_states() {
		return array(
			'both active'    => array( array( 'sitemaps', 'canonical-urls' ) ),
			'both inactive'  => array( array() ),
			'sitemaps only'  => array( array( 'sitemaps' ) ),
			'canonical only' => array( array( 'canonical-urls' ) ),
		);
	}

	/**
	 * Cleanup remains registered for sites upgrading from any older release.
	 */
	public function test_cleanup_is_registered_on_version_updates() {
		$this->assertSame( 10, has_action( 'updating_jetpack_version', array( 'Jetpack', 'cleanup_seo_module_state_options' ) ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_dashboard_preserves_wpcom_simple_module_semantics() {
		define( 'IS_WPCOM', true );
		update_option( 'jetpack_seo_sitemap_enabled', false );
		update_option( 'jetpack_seo_canonical_urls_enabled', false );
		add_filter( 'jetpack_active_modules', '__return_empty_array' );

		$this->assertTrue( Dashboard_Data::get_settings_data()['sitemap_active'] );
		$this->assertTrue( Dashboard_Data::get_settings_data()['canonical_active'] );
		$this->assertTrue( Dashboard_Data::get_overview_data()['site_visibility']['sitemap_active'] );
	}

	/**
	 * Private-site filtering affects dashboard reads without changing stored activation.
	 */
	public function test_dashboard_honors_private_site_filtering() {
		if ( ! function_exists( '\Private_Site\filter_jetpack_active_modules' ) ) {
			require_once __DIR__ . '/files/wpcomsh-private-site-filter.php';
		}

		$active_modules = array( 'sitemaps', 'canonical-urls' );
		Jetpack_Options::update_option( 'active_modules', $active_modules );
		update_option( 'jetpack_seo_sitemap_enabled', true );
		update_option( 'jetpack_seo_canonical_urls_enabled', false );
		add_filter( 'jetpack_active_modules', '\Private_Site\filter_jetpack_active_modules' );

		try {
			$this->assertFalse( Dashboard_Data::get_overview_data()['site_visibility']['sitemap_active'] );
			$this->assertFalse( Dashboard_Data::get_settings_data()['sitemap_active'] );
			$this->assertTrue( Dashboard_Data::get_settings_data()['canonical_active'] );

			Jetpack::cleanup_seo_module_state_options();

			$this->assertSame( $active_modules, Jetpack_Options::get_option( 'active_modules' ) );
			$this->assertFalse( Dashboard_Data::get_settings_data()['sitemap_active'] );
		} finally {
			remove_filter( 'jetpack_active_modules', '\Private_Site\filter_jetpack_active_modules' );
		}

		$this->assertTrue( Dashboard_Data::get_overview_data()['site_visibility']['sitemap_active'] );
		$this->assertTrue( Dashboard_Data::get_settings_data()['sitemap_active'] );
	}
}
