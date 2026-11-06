<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Minify;

use Automattic\Jetpack_Boost\Lib\Minify\Config;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;

class Functions_Service_Test extends Base_TestCase {
	private $fixtures = array();

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

		if ( ! defined( 'MONTH_IN_SECONDS' ) ) {
			define( 'MONTH_IN_SECONDS', 30 * 24 * 60 * 60 );
		}

		Functions\when( 'get_option' )->justReturn( false );
		Functions\when( 'wp_parse_url' )->alias( 'parse_url' );
		Functions\when( 'content_url' )->alias(
			function ( $path = '' ) {
				return 'http://example.com/wp-content' . $path;
			}
		);
		Functions\when( 'jetpack_boost_page_optimize_status_exit' )->alias(
			/** @return never */
			function ( $status ) {
				throw new \RuntimeException( 'Request refused', (int) $status );
			}
		);
		Functions\when( 'jetpack_boost_page_optimize_get_path' )->alias(
			function ( $uri ) {
				return $this->fixtures[ $uri ] ?? '/nonexistent' . $uri;
			}
		);
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

	public function test_encoded_list_over_limit_is_refused_before_lookup() {
		$this->stub_limits( array( 'encoded_list' => 20 ) );
		$this->fail_if_called( 'get_option' );

		$this->assertSame( 400, $this->status_of_fallback_request( '/a.js,/' . str_repeat( 'a', 20 ) . '.js' ) );
	}

	public function test_decoded_list_over_limit_is_refused() {
		$this->stub_limits( array( 'decoded_list' => 100 ) );

		$list = '-' . base64_encode( gzcompress( str_pad( '/a.js,/', 98, 'a' ) . '.js' ) );

		$this->assertSame( 400, $this->status_of_fallback_request( $list ) );
	}

	public function test_list_is_split_no_further_than_one_past_the_file_limit() {
		$list = implode( ',', array_fill( 0, 1000, '/a.js' ) );

		$this->assertCount( 151, jetpack_boost_page_optimize_get_file_paths( $list ) );
	}

	/**
	 * @dataProvider provide_routes
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_file_count_over_limit_is_refused( $route ) {
		$this->assertSame( 400, $this->status_of_request( $route, array_fill( 0, 151, '/a.js' ) ) );
	}

	/**
	 * @dataProvider provide_routes
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_total_file_bytes_over_limit_are_refused_before_any_file_is_read( $route ) {
		$this->stub_limits( array( 'files_read' => 10 ) );
		$this->write_fixture( 'one.min.js', '123456' );
		$this->write_fixture( 'two.min.js', '123456' );

		// The builders call this only after reading a file.
		$this->fail_if_called( 'jetpack_boost_page_optimize_is_already_minified' );

		$this->assertSame( 400, $this->status_of_request( $route, array( '/one.min.js', '/two.min.js' ) ) );
	}

	/**
	 * @dataProvider provide_routes
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_file_of_disallowed_type_is_refused_before_any_file_is_read( $route ) {
		$this->write_fixture( 'one.min.js', '123456' );
		$this->write_fixture( 'notes.txt', '123456' );

		$this->fail_if_called( 'jetpack_boost_page_optimize_is_already_minified' );

		$this->assertSame( 400, $this->status_of_request( $route, array( '/one.min.js', '/notes.txt' ) ) );
	}

	/**
	 * @dataProvider provide_routes
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_total_file_bytes_are_checked_again_while_reading( $route ) {
		$this->stub_limits( array( 'files_read' => 10 ) );
		$this->write_fixture( 'one.min.js', '123456' );
		$this->write_fixture( 'two.min.js', '123456' );
		Functions\when( 'jetpack_boost_page_optimize_check_files_size' )->justReturn();

		$this->assertSame( 400, $this->status_of_request( $route, array( '/one.min.js', '/two.min.js' ) ) );
	}

	/**
	 * @dataProvider provide_output_over_limit
	 */
	#[DataProvider( 'provide_output_over_limit' )]
	public function test_output_over_limit_is_refused( $route, $file, $content ) {
		$this->stub_limits( array( 'output' => strlen( $content ) ) );
		$this->write_fixture( $file, $content );

		$this->assertSame( 400, $this->status_of_request( $route, array( '/' . $file ) ) );
	}

	public static function provide_output_over_limit() {
		// The stylesheet grows when its URL is rewritten, but would fit again once minified.
		$css = 'a { background: url(i.png) }';

		return array(
			'stylesheet, _jb_static route'         => array( 'fallback', 'style.css', $css ),
			'stylesheet, boost-cache/static route' => array( 'static', 'style.css', $css ),
			'script, _jb_static route'             => array( 'fallback', 'script.min.js', 'abc' ),
			'script, boost-cache/static route'     => array( 'static', 'script.min.js', 'abc' ),
		);
	}

	/**
	 * @dataProvider provide_ordinary_lists
	 */
	#[DataProvider( 'provide_ordinary_lists' )]
	public function test_ordinary_list_is_served_in_full( $route, $list ) {
		$this->write_fixture( 'one.css', "a {\n\tbackground: url(i.png);\n}\n" );
		$this->write_fixture( 'two.min.css', 'b{color:red}' );

		if ( 'stored' === $list ) {
			$this->mock_stored_paths( array( '/one.css', '/two.min.css' ) );
		}
		$output = 'fallback' === $route
			? $this->fallback_output( $list )
			: jetpack_boost_build_minify_output( '/wp-content/boost-cache/static/stored.min.css' );

		$this->assertSame( 'a{background:url(/i.png)}b{color:red}', $output['content'] );
		$this->assertContains( 'Content-Type: text/css', $output['headers'] );
	}

	public static function provide_ordinary_lists() {
		return array(
			'stored list, _jb_static route'         => array( 'fallback', 'stored' ),
			'stored list, boost-cache/static route' => array( 'static', 'stored' ),
			'encoded list, _jb_static route'        => array( 'fallback', '-' . base64_encode( gzcompress( '/one.css,/two.min.css' ) ) ),
		);
	}

	/**
	 * @dataProvider provide_repeated_slash_and_dot_segment_paths
	 */
	#[DataProvider( 'provide_repeated_slash_and_dot_segment_paths' )]
	public function test_strip_parent_path_collapses_repeated_slashes_and_dot_segments( $parent, $path, $expected ) {
		$this->assertSame( $expected, jetpack_boost_strip_parent_path( $parent, $path ) );
	}

	public static function provide_repeated_slash_and_dot_segment_paths() {
		return array(
			'no parent'           => array( '', '/wp-content///plugins//a', '/wp-content/plugins/a' ),
			'subdirectory parent' => array( '/blog', '/blog//wp-content///a', '/wp-content/a' ),
			'dot segments'        => array( '', '/wp-content/./plugins/.//a/.', '/wp-content/plugins/a' ),
		);
	}

	public static function provide_routes() {
		return array(
			'_jb_static route'         => array( 'fallback' ),
			'boost-cache/static route' => array( 'static' ),
		);
	}

	private function fail_if_called( $function_name ) {
		Functions\when( $function_name )->alias(
			/** @return never */
			function () use ( $function_name ) {
				throw new \LogicException( "$function_name should not be called." );
			}
		);
	}

	private function stub_limits( $limits ) {
		$limits = array_merge(
			array(
				'encoded_list' => 1024,
				'decoded_list' => 1024,
				'files_read'   => 1024,
				'output'       => 1024,
			),
			$limits
		);
		Functions\when( 'jetpack_boost_page_optimize_limits' )->justReturn( $limits );
	}

	private function write_fixture( $name, $content ) {
		$this->fixtures[ '/' . $name ] = sys_get_temp_dir() . '/' . uniqid( 'jb-minify-', true ) . '-' . $name;
		file_put_contents( $this->fixtures[ '/' . $name ], $content );
	}

	private function mock_stored_paths( $paths ) {
		Functions\when( 'get_option' )->justReturn(
			array(
				'expire' => time() + 60,
				'data'   => array(
					'paths'        => $paths,
					'mtime'        => 1,
					'cache_buster' => 1,
				),
			)
		);
	}

	private function fallback_output( $list ) {
		$_SERVER['REQUEST_METHOD'] = 'GET';
		$_SERVER['REQUEST_URI']    = '/_jb_static/??' . $list;

		return jetpack_boost_page_optimize_build_output();
	}

	private function status_of_fallback_request( $list ) {
		return $this->status_of( fn() => $this->fallback_output( $list ) );
	}

	private function status_of_request( $route, $paths ) {
		$this->mock_stored_paths( $paths );

		if ( 'fallback' === $route ) {
			return $this->status_of_fallback_request( 'stored' );
		}

		return $this->status_of( fn() => jetpack_boost_build_minify_output( '/wp-content/boost-cache/static/stored.min.js' ) );
	}

	private function status_of( $request ) {
		try {
			$request();
		} catch ( \RuntimeException $exit ) {
			return $exit->getCode();
		}

		return 200;
	}

	protected function tear_down() {
		parent::tear_down();

		foreach ( $this->fixtures as $fixture ) {
			unlink( $fixture );
		}
		unset( $_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI'] );

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
