<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Minify;

use Automattic\Jetpack_Boost\Lib\Minify\Config;
use Automattic\Jetpack_Boost\Lib\Minify\File_Paths;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;

class Functions_Service_Test extends Base_TestCase {
	private const LIST_ID = '0123456789';

	private $fixtures = array();
	private $cache_dir;

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
		Functions\when( 'wp_cache_get' )->justReturn( false );
		Functions\when( 'site_url' )->justReturn( 'http://example.com' );
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

		$this->assertCount( 151, jetpack_boost_page_optimize_decode_older_list( $list ) );
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
			$list = self::LIST_ID;
		} else {
			$this->store_list( array( '/one.css', '/two.min.css' ) );
		}
		$output = 'fallback' === $route
			? $this->fallback_output( $list )
			: jetpack_boost_build_minify_output( '/wp-content/boost-cache/static/' . self::LIST_ID . '.min.css' );

		$this->assertSame( 'a{background:url(/i.png)}b{color:red}', $output['content'] );
		$this->assertContains( 'Content-Type: text/css', $output['headers'] );
	}

	public static function provide_ordinary_lists() {
		return array(
			'stored list, _jb_static route'         => array( 'fallback', 'stored' ),
			'stored list, boost-cache/static route' => array( 'static', 'stored' ),
			'encoded older list, _jb_static route'  => array( 'fallback', '-' . base64_encode( gzcompress( '/one.css,/two.min.css?m=1&cb=1' ) ) ),
			'plain older list, _jb_static route'    => array( 'fallback', '/one.css,/two.min.css?m=1' ),
		);
	}

	/**
	 * @dataProvider provide_routes
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_issued_script_list_is_served( $route ) {
		$this->write_fixture( 'one.min.js', 'one()' );
		$this->write_fixture( 'two.min.js', 'two()' );
		$this->mock_stored_paths( array( '/one.min.js', '/two.min.js' ) );

		$output = 'fallback' === $route
			? $this->fallback_output( self::LIST_ID )
			: jetpack_boost_build_minify_output( '/wp-content/boost-cache/static/' . self::LIST_ID . '.min.js' );

		$this->assertSame( "one();\ntwo();", $output['content'] );
	}

	/**
	 * @dataProvider provide_unissued_lists
	 */
	#[DataProvider( 'provide_unissued_lists' )]
	public function test_unissued_list_is_refused( $list, $status ) {
		$this->write_fixture( 'one.css', 'a{color:red}' );
		$this->write_fixture( 'two.css', 'b{color:red}' );
		$this->store_list( array( '/one.css', '/two.css' ) );

		$this->assertSame( $status, $this->status_of_fallback_request( $list ) );
	}

	public static function provide_unissued_lists() {
		return array(
			'plain list, other order' => array( '/two.css,/one.css?m=1', 400 ),
			'plain list, subset'      => array( '/one.css', 400 ),
			'encoded list, repeated'  => array( '-' . base64_encode( gzcompress( '/one.css,/two.css,/one.css' ) ), 400 ),
			'ID that is not stored'   => array( 'abcdefabcd', 404 ),
		);
	}

	/**
	 * @dataProvider provide_static_refusals
	 */
	#[DataProvider( 'provide_static_refusals' )]
	public function test_static_route_refuses_any_other_file_name( $file_name ) {
		$this->write_fixture( 'one.css', 'a{color:red}' );
		$this->mock_stored_paths( array( '/one.css' ) );

		$request = fn() => jetpack_boost_build_minify_output( '/wp-content/boost-cache/static/' . $file_name );

		$this->assertSame( 404, $this->status_of( $request ) );
	}

	public static function provide_static_refusals() {
		return array(
			'stored ID without .min in the name'         => array( self::LIST_ID . '.css' ),
			'ID that is not stored'                      => array( 'abcdefabcd.min.css' ),
			'extension of a type the list does not hold' => array( self::LIST_ID . '.min.js' ),
		);
	}

	public function test_static_route_does_not_look_up_a_name_that_is_not_an_id() {
		$this->fail_if_called( 'get_option' );

		$request = fn() => jetpack_boost_build_minify_output( '/wp-content/boost-cache/static/0123456789abcdef.min.css' );

		$this->assertSame( 404, $this->status_of( $request ) );
	}

	/**
	 * @dataProvider provide_malformed_ids
	 */
	#[DataProvider( 'provide_malformed_ids' )]
	public function test_malformed_id_is_not_looked_up( $list ) {
		$this->fail_if_called( 'get_option' );

		$this->assertSame( 404, $this->status_of( fn() => jetpack_boost_page_optimize_get_issued_list( $list ) ) );
	}

	public static function provide_malformed_ids() {
		return array(
			'too long'         => array( self::LIST_ID . 'a' ),
			'too short'        => array( '012345678' ),
			'upper case'       => array( 'ABCDEFABCD' ),
			'not hexadecimal'  => array( 'ghijklmnop' ),
			'trailing newline' => array( self::LIST_ID . "\n" ),
			'with a suffix'    => array( self::LIST_ID . '&x=1' ),
		);
	}

	public function test_older_list_is_matched_by_its_newest_file_time() {
		$this->write_fixture( 'one.css', 'a{color:red}' );
		$this->write_fixture( 'two.css', 'b{color:red}' );
		$this->write_fixture( 'three.css', 'c{color:red}' );
		touch( $this->fixtures['/one.css'], 1000 );
		touch( $this->fixtures['/two.css'], 3000 );
		touch( $this->fixtures['/three.css'], 2000 );
		$paths = array( '/one.css', '/two.css', '/three.css' );
		$id    = $this->store_list( $paths );

		$this->assertSame( $id, jetpack_boost_page_optimize_get_issued_list( implode( ',', $paths ) . '?m=1' )->get_cache_id() );
	}

	public function test_static_route_refuses_the_older_form_of_an_issued_list() {
		$this->write_fixture( 'one.css', 'a{color:red}' );
		$this->write_fixture( 'two.css', 'b{color:red}' );
		$this->store_list( array( '/one.css', '/two.css' ) );

		$encoded = '-' . base64_encode( gzcompress( '/one.css,/two.css' ) );
		$this->assertStringNotContainsString( '/', $encoded );

		$request = fn() => jetpack_boost_build_minify_output( '/wp-content/boost-cache/static/' . $encoded . '.min.css' );

		$this->assertSame( 404, $this->status_of( $request ) );
	}

	public function test_older_list_needs_the_same_paths_as_the_stored_list() {
		$this->write_fixture( 'one.css', 'a{color:red}' );
		$this->write_fixture( 'two.css', 'b{color:red}' );
		Functions\when( 'get_option' )->justReturn(
			array(
				'expire' => time() + 60,
				'data'   => array(
					'paths'        => array( '/two.css' ),
					'mtime'        => 1,
					'cache_buster' => 1,
				),
			)
		);

		$this->assertSame( 400, $this->status_of_fallback_request( '/one.css' ) );
	}

	public function test_older_and_stored_forms_share_one_list_id() {
		$this->write_fixture( 'one.css', 'a{color:red}' );
		$this->write_fixture( 'two.css', 'b{color:red}' );
		$id = $this->store_list( array( '/one.css', '/two.css' ) );

		$this->assertSame( $id, jetpack_boost_page_optimize_get_issued_list( '/one.css,/two.css?m=1' )->get_cache_id() );
	}

	public function test_older_form_and_stored_id_of_a_list_share_one_cache_key() {
		$this->write_fixture( 'one.css', 'a{color:red}' );
		$this->write_fixture( 'two.css', 'b{color:red}' );
		$id = $this->store_list( array( '/one.css', '/two.css' ) );

		$_SERVER['REQUEST_METHOD'] = 'GET';
		$encoded                   = '-' . base64_encode( gzcompress( '/one.css,/two.css?m=1&cb=1' ) );

		$this->assertSame(
			jetpack_boost_page_optimize_get_request_cache_key( '/_jb_static/??' . $id ),
			jetpack_boost_page_optimize_get_request_cache_key( '/_jb_static/??' . $encoded )
		);
	}

	public function test_requests_for_one_list_share_one_cache_key() {
		$key = jetpack_boost_page_optimize_get_cache_key( self::LIST_ID, '/_jb_static/??' . self::LIST_ID );

		$this->assertIsString( $key );
		$this->assertSame( $key, jetpack_boost_page_optimize_get_cache_key( self::LIST_ID, '/_jb_static/?x=1?' . self::LIST_ID ) );
		$this->assertNotSame( $key, jetpack_boost_page_optimize_get_cache_key( 'abcdefabcd', '/_jb_static/??abcdefabcd' ) );
	}

	public function test_response_under_another_path_is_not_cached() {
		$this->assertFalse( jetpack_boost_page_optimize_get_cache_key( self::LIST_ID, '/wp-content/_jb_static/??' . self::LIST_ID ) );
	}

	public function test_site_in_a_subdirectory_has_its_own_cache_key() {
		$root_key = jetpack_boost_page_optimize_get_cache_key( self::LIST_ID, '/_jb_static/??' . self::LIST_ID );

		Functions\when( 'site_url' )->justReturn( 'http://example.com/blog' );

		$key = jetpack_boost_page_optimize_get_cache_key( self::LIST_ID, '/blog/_jb_static/??' . self::LIST_ID );
		$this->assertIsString( $key );
		$this->assertNotSame( $root_key, $key );
	}

	public function test_request_with_no_prefix_is_cached_on_a_subdirectory_site() {
		Functions\when( 'site_url' )->justReturn( 'http://example.com/blog' );

		$key = jetpack_boost_page_optimize_get_cache_key( self::LIST_ID, '/_jb_static/??' . self::LIST_ID );

		$this->assertIsString( $key );
		$this->assertNotSame( $key, jetpack_boost_page_optimize_get_cache_key( self::LIST_ID, '/blog/_jb_static/??' . self::LIST_ID ) );
	}

	/**
	 * @dataProvider provide_static_cache_limits
	 */
	#[DataProvider( 'provide_static_cache_limits' )]
	public function test_static_route_stores_a_response_only_within_the_cache_limit( $limit, $stored ) {
		$this->write_fixture( 'one.min.css', 'a{color:red}' );
		$this->mock_stored_paths( array( '/one.min.css' ) );
		Functions\when( 'jetpack_boost_page_optimize_cache_max_bytes' )->justReturn( $limit );

		$dir      = Config::get_static_cache_dir_path();
		$file     = $dir . '/' . self::LIST_ID . '.min.css';
		$existing = $dir . '/abcdefabcd.min.css';
		if ( ! is_dir( $dir ) ) {
			mkdir( $dir, 0775, true );
		}
		file_put_contents( $existing, '1234567890' );

		ob_start();
		// Silenced because PHPUnit's own output means these response headers cannot be sent.
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@jetpack_boost_handle_minify_request( '/wp-content/boost-cache/static/' . self::LIST_ID . '.min.css' );
		$content = ob_get_clean();
		$exists  = file_exists( $file );
		if ( $exists ) {
			unlink( $file );
		}
		unlink( $existing );

		$this->assertSame( 'a{color:red}', $content );
		$this->assertSame( $stored, $exists );
	}

	public static function provide_static_cache_limits() {
		return array(
			'within the limit'                          => array( 1000, true ),
			'body fits, but not with the existing file' => array( 15, false ),
		);
	}

	/**
	 * @dataProvider provide_incomplete_cached_responses
	 */
	#[DataProvider( 'provide_incomplete_cached_responses' )]
	public function test_cached_response_without_usable_headers_is_rebuilt( $meta ) {
		$this->make_cache_dir();
		$cache_file = $this->cache_dir . '/page-optimize-cache-key';
		$meta_file  = $this->cache_dir . '/page-optimize-cache-meta-key';
		file_put_contents( $cache_file, 'body' );
		if ( null !== $meta ) {
			file_put_contents( $meta_file, $meta );
		}

		$this->assertFalse( jetpack_boost_page_optimize_read_cached_response( $cache_file, $meta_file ) );
	}

	public static function provide_incomplete_cached_responses() {
		return array(
			'no headers file'    => array( null ),
			'empty headers file' => array( '' ),
		);
	}

	public function test_stored_response_is_read_back_with_its_headers() {
		$this->store_response( 'body' );

		$this->assertSame(
			array(
				'content' => 'body',
				'headers' => array( 'Content-Type: text/css' ),
			),
			jetpack_boost_page_optimize_read_cached_response( $this->cache_dir . '/page-optimize-cache-key', $this->cache_dir . '/page-optimize-cache-meta-key' )
		);
	}

	public function test_response_and_headers_are_stored_without_temporary_files() {
		$this->store_response( 'body' );

		$this->assertSame( 'body', file_get_contents( $this->cache_dir . '/page-optimize-cache-key' ) );
		$this->assertSame( '{"headers":["Content-Type: text/css"]}', file_get_contents( $this->cache_dir . '/page-optimize-cache-meta-key' ) );
		$this->assertCount( 2, glob( $this->cache_dir . '/*' ) );
	}

	public function test_response_is_not_stored_past_the_total_cache_limit() {
		$this->make_cache_dir();
		file_put_contents( $this->cache_dir . '/page-optimize-cache-old', str_repeat( 'x', 80 ) );
		Functions\when( 'jetpack_boost_page_optimize_cache_max_bytes' )->justReturn( 100 );

		$this->store_response( str_repeat( 'y', 21 ) );

		$this->assertSame( array( $this->cache_dir . '/page-optimize-cache-old' ), glob( $this->cache_dir . '/*' ) );
	}

	public function test_missing_list_is_not_kept_in_the_missing_options_cache() {
		Functions\when( 'wp_cache_get' )->justReturn(
			array(
				'jb_transient_concat_paths_abcdefabcd' => true,
				'other'                                => true,
			)
		);
		Functions\expect( 'wp_cache_set' )->once()->with( 'notoptions', array( 'other' => true ), 'options' );

		$this->assertNull( File_Paths::get_issued( 'abcdefabcd' ) );
	}

	public function test_minify_caches_are_emptied_once_for_each_cache_rules_version() {
		$options = array();
		Functions\when( 'get_site_option' )->alias(
			function ( $option ) use ( &$options ) {
				return $options[ $option ] ?? false;
			}
		);
		Functions\when( 'update_site_option' )->alias(
			function ( $option, $value ) use ( &$options ) {
				// Options read back as strings.
				$options[ $option ] = (string) $value;
			}
		);
		Functions\when( 'wp_delete_file' )->alias( 'unlink' );

		$dir  = Config::get_static_cache_dir_path();
		$file = $dir . '/0123456789.min.css';
		if ( ! is_dir( $dir ) ) {
			mkdir( $dir, 0775, true );
		}

		file_put_contents( $file, 'a{color:red}' );
		jetpack_boost_minify_empty_caches_for_rules();
		$this->assertFileDoesNotExist( $file );

		file_put_contents( $file, 'a{color:red}' );
		jetpack_boost_minify_empty_caches_for_rules();
		$this->assertFileExists( $file );

		$options['jetpack_boost_minify_cache_rules_applied'] = (string) ( JETPACK_BOOST_MINIFY_CACHE_RULES_VERSION + 1 );
		jetpack_boost_minify_empty_caches_for_rules();
		$this->assertFileDoesNotExist( $file );
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

	private function mock_stored_paths( $paths, $id = self::LIST_ID ) {
		Functions\when( 'get_option' )->alias(
			function ( $option ) use ( $paths, $id ) {
				if ( 'jb_transient_concat_paths_' . $id !== $option ) {
					return false;
				}

				return array(
					'expire' => time() + 60,
					'data'   => array(
						'paths'        => $paths,
						'mtime'        => 1,
						'cache_buster' => 1,
					),
				);
			}
		);
	}

	/**
	 * Store a list through jetpack_boost_page_optimize_generate_concat_path(), keyed by handle as stylesheet lists are.
	 */
	private function store_list( $paths ) {
		$options = array();
		Functions\when( 'update_option' )->alias(
			function ( $option, $value ) use ( &$options ) {
				$options[ $option ] = $value;
			}
		);
		Functions\when( 'get_option' )->alias(
			function ( $option ) use ( &$options ) {
				return $options[ $option ] ?? false;
			}
		);

		$mapping = new class( $this->fixtures ) {
			private $fixtures;

			public function __construct( $fixtures ) {
				$this->fixtures = $fixtures;
			}

			public function uri_path_to_fs_path( $uri ) {
				return $this->fixtures[ $uri ];
			}
		};

		$handles = array_map( fn( $path ) => 'handle-' . $path, $paths );

		return jetpack_boost_page_optimize_generate_concat_path( array_combine( $handles, $paths ), $mapping );
	}

	private function make_cache_dir() {
		$this->cache_dir = sys_get_temp_dir() . '/' . uniqid( 'jb-minify-cache-', true );
		mkdir( $this->cache_dir );
	}

	private function store_response( $content ) {
		if ( ! $this->cache_dir ) {
			$this->make_cache_dir();
		}
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );

		jetpack_boost_page_optimize_store_cached_response(
			$this->cache_dir . '/page-optimize-cache-key',
			$this->cache_dir . '/page-optimize-cache-meta-key',
			array(
				'content' => $content,
				'headers' => array( 'Content-Type: text/css' ),
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
			return $this->status_of_fallback_request( self::LIST_ID );
		}

		$extension = pathinfo( $paths[0], PATHINFO_EXTENSION );

		return $this->status_of( fn() => jetpack_boost_build_minify_output( '/wp-content/boost-cache/static/' . self::LIST_ID . '.min.' . $extension ) );
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

		if ( $this->cache_dir ) {
			foreach ( glob( $this->cache_dir . '/*' ) as $file ) {
				unlink( $file );
			}
			rmdir( $this->cache_dir );
		}

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
