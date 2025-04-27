<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Minify;

use Automattic\Jetpack_Boost\Lib\Minify\Config;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;

class Functions_Service_Test extends Base_TestCase {
	protected function set_up() {
		parent::set_up();

		if ( ! defined( 'WP_CONTENT_DIR' ) ) {
			define( 'WP_CONTENT_DIR', '/tmp/wordpress/wp-content' );
		}

		// Mock add_action
		Functions\expect( 'add_action' )->andReturn( true );

		// Clean up any test files before each test
		if ( file_exists( Config::get_static_cache_dir_path() . '/404' ) ) {
			unlink( Config::get_static_cache_dir_path() . '/404' );
		}
		require_once __DIR__ . '/../../../../app/lib/minify/loader.php';
	}

	public function test_404_tester_when_404_file_exists() {
		// Create mock 404 file
		$cache_dir = Config::get_static_cache_dir_path();
		if ( ! is_dir( $cache_dir ) ) {
			mkdir( $cache_dir, 0775, true );
		}
		file_put_contents( $cache_dir . '/404', '1' );

		Functions\expect( 'home_url' )
			->once()
			->with( '/wp-content/boost-cache/static/testing_404.js' )
			->andReturn( 'http://example.com/wp-content/boost-cache/static/testing_404.js' );

		Functions\expect( 'wp_remote_get' )
			->once()
			->with( 'http://example.com/wp-content/boost-cache/static/testing_404.js' );

		Functions\expect( 'wp_delete_file' )
			->once()
			->with( $cache_dir . '/404' );

		Functions\expect( 'update_site_option' )
			->once()
			->with( 'jetpack_boost_static_minification', 1 );

		$this->assertSame( 1, jetpack_boost_404_tester() );
	}

	public function test_404_tester_when_404_file_does_not_exist() {
		Functions\expect( 'home_url' )
			->once()
			->with( '/wp-content/boost-cache/static/testing_404.js' )
			->andReturn( 'http://example.com/wp-content/boost-cache/static/testing_404.js' );

		Functions\expect( 'wp_remote_get' )
			->once()
			->with( 'http://example.com/wp-content/boost-cache/static/testing_404.js' );

		Functions\expect( 'update_site_option' )
			->once()
			->with( 'jetpack_boost_static_minification', 0 );

		$this->assertSame( 0, jetpack_boost_404_tester() );
	}

	public function test_404_tester_disabled_by_constant() {
		if ( ! defined( 'JETPACK_BOOST_DISABLE_404_TESTER' ) ) {
			define( 'JETPACK_BOOST_DISABLE_404_TESTER', true );
		}

		Functions\expect( 'wp_remote_get' )->never();
		Functions\expect( 'update_site_option' )->never();

		$this->assertNull( jetpack_boost_404_tester() );
	}

	protected function tear_down() {
		parent::tear_down();

		// Clean up any test files after each test
		if ( file_exists( Config::get_static_cache_dir_path() . '/404' ) ) {
			unlink( Config::get_static_cache_dir_path() . '/404' );
		}

		$path = '/tmp/wordpress/wp-content/boost-cache/static/';
		while ( $path !== '/tmp' ) {
			if ( is_dir( $path ) ) {
				rmdir( $path );
			}
			$path = dirname( $path );
		}
	}
}
