<?php
/**
 * Tests for the SEO switch's hold on the SEO modules.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers Jetpack::load_modules
 * @covers ::jetpack_seo_dashboard_purge_sitemap
 * @covers ::jetpack_seo_dashboard_queue_sitemap_purge
 */
#[CoversMethod( Jetpack::class, 'load_modules' )]
#[CoversFunction( 'jetpack_seo_dashboard_purge_sitemap' )]
#[CoversFunction( 'jetpack_seo_dashboard_queue_sitemap_purge' )]
class Jetpack_SEO_Dashboard_Module_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * While the SEO switch is off, Jetpack leaves a saved-on SEO module unloaded and still reports it on.
	 *
	 * Separate processes, since a module file loads only once per process.
	 *
	 * @dataProvider provide_switch_states
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param bool $on Whether the SEO switch is on.
	 */
	#[DataProvider( 'provide_switch_states' )]
	#[PreserveGlobalState( false )]
	#[RunInSeparateProcess]
	public function test_seo_switch_decides_whether_seo_modules_load( $on ) {
		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		add_filter(
			'jetpack_active_modules',
			static function () use ( $on ) {
				return $on ? array( 'canonical-urls', 'seo-dashboard' ) : array( 'canonical-urls' );
			}
		);

		Jetpack::load_modules();

		$this->assertSame( $on ? 1 : 0, did_action( 'jetpack_module_loaded_canonical-urls' ) );
		$this->assertTrue( Jetpack::is_module_active( 'canonical-urls' ) );
	}

	/**
	 * Switching SEO off purges the sitemap cache, and switching it on queues the purge for Sitemaps' next load.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[PreserveGlobalState( false )]
	#[RunInSeparateProcess]
	public function test_seo_switch_purges_the_sitemap_cache() {
		Jetpack_Options::update_option( 'active_modules', array( 'sitemaps' ) );
		require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemaps.php';
		require_once JETPACK__PLUGIN_DIR . 'modules/seo-dashboard.php';
		$module = 'seo-dashboard';

		do_action( "jetpack_deactivate_module_$module", $module );
		$this->assertSame( 1, did_action( 'jetpack_sitemap_index_updated' ) );

		delete_option( 'jetpack_sitemap_pending_cache_purge' );
		do_action( "jetpack_activate_module_$module", $module );
		$this->assertSame( 'urls', get_option( 'jetpack_sitemap_pending_cache_purge' ) );
	}

	/**
	 * @return array<string, array{bool}>
	 */
	public static function provide_switch_states() {
		return array(
			'switch on'  => array( true ),
			'switch off' => array( false ),
		);
	}
}
