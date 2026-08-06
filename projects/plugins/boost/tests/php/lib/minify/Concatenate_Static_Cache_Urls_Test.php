<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Minify;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use Automattic\Jetpack_Boost\Lib\Minify\Concatenate_CSS;
use Automattic\Jetpack_Boost\Lib\Minify\Concatenate_JS;
use WorDBless\BaseTestCase;
use WP_Scripts;
use WP_Styles;

if ( ! defined( 'JETPACK_BOOST_DIR_PATH' ) ) {
	define( 'JETPACK_BOOST_DIR_PATH', dirname( __DIR__, 4 ) );
}
require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/loader.php';

// The exclude lists both classes read call jetpack_boost_ds_get(), which lives outside the minify
// library. Without this the file passes only when another test booted the plugin first. Guarded,
// because that is what the configured suite does and these registrations are not idempotent.
if ( ! function_exists( 'jetpack_boost_ds_get' ) ) {
	require_once JETPACK_BOOST_DIR_PATH . '/wp-js-data-sync.php';
}

/**
 * BOOST-608: the URL these two classes emit is the user-visible contract. The helper tests next door
 * all pass while do_items() reads the migrated option directly, which is the bug. Assert on the
 * emitted tag, not on the helper.
 */
class Concatenate_Static_Cache_Urls_Test extends BaseTestCase {

	/**
	 * Directory holding the throwaway assets registered by these tests.
	 *
	 * @var string
	 */
	private $asset_dir;

	/**
	 * Absolute paths of the fixture files written by set_up(), so tear_down removes those and
	 * nothing else.
	 *
	 * @var string[]
	 */
	private $asset_files = array();

	public function set_up() {
		parent::set_up();

		// A leaked constant or a memoised host verdict decides which URL these render, so start from
		// a known host rather than only tidying up afterwards.
		Constants::clear_constants();
		Status_Cache::clear();

		// The assets must live under wp-content. Dependency_Path_Mapping resolves enqueued URLs back
		// to paths relative to it, and skips anything it cannot resolve. The pid suffix keeps
		// concurrent test processes from clobbering each other's fixtures.
		$this->asset_dir = WP_CONTENT_DIR . '/boost-concat-test-' . getmypid();
		if ( ! is_dir( $this->asset_dir ) ) {
			mkdir( $this->asset_dir, 0755, true );
		}

		$this->asset_files = array();
		foreach ( array(
			'a.css' => '.a{color:red}',
			'b.css' => '.b{color:blue}',
			'a.js'  => 'var a = 1;',
			'b.js'  => 'var b = 2;',
		) as $name => $contents ) {
			$path = $this->asset_dir . '/' . $name;
			file_put_contents( $path, $contents );
			$this->asset_files[] = $path;
		}
	}

	public function tear_down() {
		// Remove exactly the files set_up() wrote, then the directory if that emptied it. Tracking
		// paths rather than ownership means a part-way run cannot leave the fixture behind.
		foreach ( $this->asset_files as $file ) {
			if ( file_exists( $file ) ) {
				unlink( $file );
			}
		}
		if ( is_dir( $this->asset_dir ) ) {
			@rmdir( $this->asset_dir ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- best effort; a non-empty directory holds something this test did not create.
		}

		Constants::clear_constants();
		Status_Cache::clear();
		delete_site_option( 'jetpack_boost_static_minification' );

		parent::tear_down();
	}

	/**
	 * Put the site on WP Cloud, where the web server may answer wp-content 404s itself.
	 */
	private function pretend_to_be_on_wp_cloud() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 1 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 1 );
		Status_Cache::clear();
	}

	/**
	 * Put the site on WordPress.com Atomic: the WP Cloud constants plus wpcomsh, so
	 * get_hosting_provider() returns 'woa' rather than 'atomic'.
	 */
	private function pretend_to_be_on_wpcom_atomic() {
		$this->pretend_to_be_on_wp_cloud();
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', 'wpcomsh.php' );
		Status_Cache::clear();
	}

	private function asset_url( $name ) {
		return '/wp-content/' . basename( $this->asset_dir ) . '/' . $name;
	}

	private function render_styles() {
		$styles = new Concatenate_CSS( new WP_Styles() );
		$styles->add( 'boost-test-a', $this->asset_url( 'a.css' ), array(), null );
		$styles->add( 'boost-test-b', $this->asset_url( 'b.css' ), array(), null );
		$styles->enqueue( array( 'boost-test-a', 'boost-test-b' ) );

		// finally, so a throw inside do_items() surfaces as that failure rather than as a leaked
		// buffer tripping beStrictAboutOutputDuringTests.
		ob_start();
		try {
			$styles->do_items();
		} finally {
			$output = ob_get_clean();
		}

		return $output;
	}

	private function render_scripts() {
		$scripts = new Concatenate_JS( new WP_Scripts() );
		$scripts->add( 'boost-test-a', $this->asset_url( 'a.js' ), array(), null );
		$scripts->add( 'boost-test-b', $this->asset_url( 'b.js' ), array(), null );
		$scripts->enqueue( array( 'boost-test-a', 'boost-test-b' ) );

		ob_start();
		try {
			$scripts->do_items();
		} finally {
			$output = ob_get_clean();
		}

		return $output;
	}

	/**
	 * The migrated database says the 404 tester passed, but it passed on the previous host.
	 */
	public function test_css_falls_back_when_a_stale_verdict_arrives_on_wp_cloud() {
		update_site_option( 'jetpack_boost_static_minification', 1 );
		$this->pretend_to_be_on_wp_cloud();

		$output = $this->render_styles();

		$this->assertStringContainsString( '/_jb_static/??', $output );
		$this->assertStringNotContainsString( '/boost-cache/static/', $output );
	}

	public function test_js_falls_back_when_a_stale_verdict_arrives_on_wp_cloud() {
		update_site_option( 'jetpack_boost_static_minification', 1 );
		$this->pretend_to_be_on_wp_cloud();

		$output = $this->render_scripts();

		$this->assertStringContainsString( '/_jb_static/??', $output );
		$this->assertStringNotContainsString( '/boost-cache/static/', $output );
	}

	/**
	 * WordPress.com Atomic classifies as 'woa', not 'atomic'. These pin the guard to "anything but
	 * 'other'": narrowing it to one named provider must fail here, not on WordPress.com.
	 */
	public function test_css_falls_back_when_a_stale_verdict_arrives_on_wpcom_atomic() {
		update_site_option( 'jetpack_boost_static_minification', 1 );
		$this->pretend_to_be_on_wpcom_atomic();

		$output = $this->render_styles();

		$this->assertStringContainsString( '/_jb_static/??', $output );
		$this->assertStringNotContainsString( '/boost-cache/static/', $output );
	}

	public function test_js_falls_back_when_a_stale_verdict_arrives_on_wpcom_atomic() {
		update_site_option( 'jetpack_boost_static_minification', 1 );
		$this->pretend_to_be_on_wpcom_atomic();

		$output = $this->render_scripts();

		$this->assertStringContainsString( '/_jb_static/??', $output );
		$this->assertStringNotContainsString( '/boost-cache/static/', $output );
	}

	/**
	 * Hosts that can serve the static cache keep doing so. The guard only moves a site onto the
	 * fallback, never the other way.
	 */
	public function test_css_uses_static_cache_urls_on_a_supported_host() {
		update_site_option( 'jetpack_boost_static_minification', 1 );

		$output = $this->render_styles();

		$this->assertStringContainsString( '/boost-cache/static/', $output );
		$this->assertStringContainsString( '.min.css', $output );
		$this->assertStringNotContainsString( '/_jb_static/??', $output );
	}

	public function test_js_uses_static_cache_urls_on_a_supported_host() {
		update_site_option( 'jetpack_boost_static_minification', 1 );

		$output = $this->render_scripts();

		$this->assertStringContainsString( '/boost-cache/static/', $output );
		$this->assertStringContainsString( '.min.js', $output );
		$this->assertStringNotContainsString( '/_jb_static/??', $output );
	}

	public function test_css_falls_back_on_a_supported_host_when_the_tester_failed() {
		update_site_option( 'jetpack_boost_static_minification', 0 );

		$output = $this->render_styles();

		$this->assertStringContainsString( '/_jb_static/??', $output );
		$this->assertStringNotContainsString( '/boost-cache/static/', $output );
	}

	public function test_js_falls_back_on_a_supported_host_when_the_tester_failed() {
		update_site_option( 'jetpack_boost_static_minification', 0 );

		$output = $this->render_scripts();

		$this->assertStringContainsString( '/_jb_static/??', $output );
		$this->assertStringNotContainsString( '/boost-cache/static/', $output );
	}
}
