<?php
/**
 * Tests for letting the a8c proxy see unlaunched Big Sky sites on Atomic.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE\Coming_soon;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/coming-soon/coming-soon.php';

/**
 * Class Coming_Soon_A8c_Proxy_Test
 */
class Coming_Soon_A8c_Proxy_Test extends \WorDBless\BaseTestCase {

	/**
	 * An unlaunched Big Sky site on WordPress.com on Atomic, opened logged out from the a8c proxy.
	 */
	public function set_up() {
		parent::set_up();
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 2 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', 'wpcomsh.php' );
		Status_Cache::clear();

		update_option( 'wpcom_public_coming_soon', 1 );
		update_option( 'big_sky_enable', '1' );

		wp_set_current_user( 0 );
		$GLOBALS['wp_query']         = new \WP_Query();
		$GLOBALS['wp_query']->is_404 = true;
	}

	/**
	 * Clean up.
	 */
	public function tear_down() {
		Constants::clear_constants();
		Status_Cache::clear();
		unset( $_GET['wpcom_show_coming_soon'] );
		$GLOBALS['wp_query'] = new \WP_Query();
		parent::tear_down();
	}

	/**
	 * The proxy sees the real site, uncached, with the banner.
	 *
	 * Separate process: nocache_headers() is a no-op once PHPUnit has printed.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_the_proxy_sees_the_real_site_uncached() {
		$nocache_calls = 0;
		add_filter(
			'nocache_headers',
			function ( $headers ) use ( &$nocache_calls ) {
				++$nocache_calls;
				return $headers;
			}
		);

		$this->assertFalse( should_show_coming_soon_page() );

		$this->assertSame( 1, $nocache_calls, 'The edge cache must not keep the real page.' );
		$this->assertTrue( DONOTCACHEPAGE, 'Nor a page-cache plugin on the site.' );
		$this->assertNotFalse( has_action( 'wp_footer', __NAMESPACE__ . '\render_unlaunched_site_banner' ) );
	}

	/**
	 * Off the proxy, visitors still get Coming Soon.
	 */
	public function test_a_visitor_off_the_proxy_gets_coming_soon() {
		Constants::set_constant( 'AT_PROXIED_REQUEST', false );

		$this->assertTrue( should_show_coming_soon_page() );
		$this->assertFalse( has_action( 'wp_footer', __NAMESPACE__ . '\render_unlaunched_site_banner' ) );
	}

	/**
	 * Simple sites, and Atomic sites that are not WordPress.com, keep Coming Soon.
	 */
	public function test_a_site_that_is_not_wpcom_on_atomic_keeps_coming_soon() {
		Constants::clear_single_constant( 'WPCOMSH__PLUGIN_FILE' );
		Status_Cache::clear();

		$this->assertFalse( is_unlaunched_big_sky_site_seen_from_a8c_proxy() );
	}

	/**
	 * Having the plugin is not enough: WordPress.com has to have turned Big Sky on.
	 */
	public function test_a_site_without_big_sky_turned_on_keeps_coming_soon() {
		delete_option( 'big_sky_enable' );
		$this->assertFalse( is_unlaunched_big_sky_site_seen_from_a8c_proxy() );

		update_option( 'big_sky_enable', '0' );
		$this->assertFalse( is_unlaunched_big_sky_site_seen_from_a8c_proxy() );
	}

	/**
	 * The banner button shows what visitors see.
	 */
	public function test_the_button_shows_coming_soon_again() {
		$this->assertTrue( is_unlaunched_big_sky_site_seen_from_a8c_proxy() );

		$_GET['wpcom_show_coming_soon'] = '1';
		$this->assertFalse( is_unlaunched_big_sky_site_seen_from_a8c_proxy() );
	}

	/**
	 * A launched site is left alone, so nothing gets marked uncacheable.
	 */
	public function test_a_launched_site_is_left_alone() {
		update_option( 'wpcom_public_coming_soon', 0 );

		$this->assertFalse( should_show_coming_soon_page() );
		$this->assertFalse( has_action( 'wp_footer', __NAMESPACE__ . '\render_unlaunched_site_banner' ) );
	}

	/**
	 * The banner says the site is not launched and links back to Coming Soon.
	 */
	public function test_the_banner_says_the_site_is_not_launched() {
		ob_start();
		render_unlaunched_site_banner();
		$banner = ob_get_clean();

		$this->assertStringContainsString( 'This site is not launched.', $banner );
		$this->assertStringContainsString( 'wpcom_show_coming_soon=1', $banner );
	}
}
