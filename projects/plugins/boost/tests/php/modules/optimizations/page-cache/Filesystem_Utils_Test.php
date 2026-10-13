<?php

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack_Boost\Jetpack_Boost;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Error;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Rebuild_File;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Simple_Delete;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Request;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Storage\File_Storage;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

class Filesystem_Utils_Test extends TestCase {
	private $test_dir;
	private $boost_cache_dir;

	public function setUp(): void {
		parent::setUp();
		\Brain\Monkey\setUp();
		Functions\when( 'apply_filters_deprecated' )->alias(
			function ( $tag, $args ) {
				return $args[0];
			}
		);

		if ( ! defined( 'WP_CONTENT_DIR' ) ) {
			define( 'WP_CONTENT_DIR', '/tmp/wordpress/wp-content' );
		}
		if ( ! defined( 'HOUR_IN_SECONDS' ) ) {
			define( 'HOUR_IN_SECONDS', 3600 );
		}
		require_once __DIR__ . '/../../../../../app/modules/optimizations/page-cache/pre-wordpress/class-boost-cache.php';

		// Create a temporary test directory
		$this->test_dir        = sys_get_temp_dir() . '/boost-test-' . uniqid();
		$this->boost_cache_dir = WP_CONTENT_DIR . '/boost-cache';

		// Create test directories
		mkdir( $this->test_dir, 0755, true );
		mkdir( $this->boost_cache_dir, 0755, true );
	}

	public function tearDown(): void {
		\Brain\Monkey\tearDown();
		parent::tearDown();

		// Clean up test directories
		$this->recursive_rmdir( $this->test_dir );
		$this->recursive_rmdir( $this->boost_cache_dir );
	}

	private function recursive_rmdir( $dir ) {
		if ( is_dir( $dir ) ) {
			$objects = scandir( $dir );
			foreach ( $objects as $object ) {
				if ( $object !== '.' && $object !== '..' ) {
					if ( is_dir( $dir . '/' . $object ) ) {
						$this->recursive_rmdir( $dir . '/' . $object );
					} else {
						unlink( $dir . '/' . $object );
					}
				}
			}
			rmdir( $dir );
		}
	}

	public function test_is_boost_cache_directory() {
		$this->assertTrue( Filesystem_Utils::is_boost_cache_directory( $this->boost_cache_dir ) );
		$this->assertFalse( Filesystem_Utils::is_boost_cache_directory( $this->test_dir ) );
	}

	public function test_get_request_filename() {
		$parameters = array(
			'url'     => 'https://example.com',
			'cookies' => array( 'test' => 'value' ),
			'get'     => array( 'param' => 'value' ),
		);

		$filename = Filesystem_Utils::get_request_filename( '/', $parameters );
		$this->assertIsString( $filename );
		$this->assertStringEndsWith( '.html', $filename );
	}

	public function test_non_encodable_get_parameters_are_not_cached() {
		$parameters = array(
			'cookies' => array( 'test' => 'value' ),
			'get'     => array( 'param' => "\xFF" ),
		);
		$storage    = new File_Storage( 'example.com' );

		$this->assertFalse( Filesystem_Utils::get_request_filename( '/page/', $parameters ) );
		$this->assertInstanceOf( Boost_Cache_Error::class, $storage->write( '/page/', $parameters, 'Test content' ) );
		$this->assertFalse( is_dir( $this->boost_cache_dir . '/cache/example.com/page' ) );
		$this->assertFalse( $storage->read( '/page/', $parameters ) );
		$this->assertFalse( $storage->reset_rebuild_file( '/page/', $parameters ) );
	}

	public function test_non_array_key_filter_results_are_not_cached() {
		foreach ( array( 'invalid', 1, true, false, null, new \stdClass(), new \ArrayObject() ) as $components ) {
			Functions\when( 'apply_filters_deprecated' )->justReturn( $components );
			$this->assertFalse( Filesystem_Utils::get_request_filename( '/first/', array() ) );
			$this->assertFalse( Filesystem_Utils::get_request_filename( '/second/', array() ) );
		}
	}

	public function test_request_filename_includes_normalized_uri() {
		$parameters = array(
			'cookies' => array( 'test' => 'value' ),
			'get'     => array( 'param' => 'value' ),
		);

		$filename = Filesystem_Utils::get_request_filename( '/first/', $parameters );
		$this->assertNotSame( $filename, Filesystem_Utils::get_request_filename( '/second/', $parameters ) );
		$this->assertSame( $filename, Filesystem_Utils::get_request_filename( '/first?param=value', $parameters ) );
	}

	public function test_unparseable_request_paths_are_not_cached() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );

		foreach ( array( '/x:0', '/x:0?a=1', '/section:99999/' ) as $uri ) {
			$normalized_uri = Boost_Cache_Utils::normalize_request_uri( $uri );
			$request        = new Request( $normalized_uri, $parameters );

			$this->assertFalse( $normalized_uri );
			$this->assertFalse( Filesystem_Utils::get_request_filename( $uri, $parameters ) );
			$this->assertFalse( $request->is_cacheable() );
			$this->assertInstanceOf( Boost_Cache_Error::class, $storage->write( $uri, $parameters, 'invalid' ) );
			$this->assertFalse( $storage->read( $uri, $parameters ) );
			$this->assertFalse( $storage->reset_rebuild_file( $uri, $parameters ) );
		}
		$this->assertFalse( is_dir( $this->boost_cache_dir . '/cache/example.com' ) );
	}

	public function test_normalize_request_uri_collapses_leading_slashes() {
		$uri = Boost_Cache_Utils::normalize_request_uri( '/page/child?param=value' );

		$this->assertSame( '/page/child/', $uri );
		$this->assertSame( $uri, Boost_Cache_Utils::normalize_request_uri( '//page/child?param=value' ) );
		$this->assertSame( $uri, Boost_Cache_Utils::normalize_request_uri( '///page/child?param=value' ) );
	}

	public function test_leading_slash_normalization_does_not_depend_on_regex_limits() {
		$limit = ini_get( 'pcre.backtrack_limit' );
		try {
			ini_set( 'pcre.backtrack_limit', '0' );
			$first  = Boost_Cache_Utils::normalize_request_uri( '///first/?q=1' );
			$second = Boost_Cache_Utils::normalize_request_uri( '//second/?q=1' );
		} finally {
			ini_set( 'pcre.backtrack_limit', $limit );
		}
		$this->assertSame( '/first/', $first );
		$this->assertSame( '/second/', $second );
	}

	public function test_non_string_request_uris_are_not_cached() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );

		foreach ( array( false, null, 0, true, array(), new \stdClass() ) as $uri ) {
			// @phan-suppress-next-line PhanTypeMismatchArgument -- Deliberately passing a non-string value.
			$this->assertFalse( Boost_Cache_Utils::normalize_request_uri( $uri ) );
			// @phan-suppress-next-line PhanTypeMismatchArgument -- Deliberately passing a non-string value.
			$this->assertFalse( Filesystem_Utils::get_request_filename( $uri, $parameters ) );
		}
		$storage->write( '/', $parameters, 'root' );
		// @phan-suppress-next-line PhanTypeMismatchArgument -- Deliberately passing a non-string value.
		$this->assertFalse( $storage->read( false, $parameters ) );
		// @phan-suppress-next-line PhanTypeMismatchArgument -- Deliberately passing a non-string value.
		$this->assertInstanceOf( Boost_Cache_Error::class, $storage->write( false, $parameters, 'invalid' ) );
		$this->assertSame( 'root', $storage->read( '/', $parameters ) );
		$storage->clear( '/' );
		// @phan-suppress-next-line PhanTypeMismatchArgument -- Deliberately passing a non-string value.
		$this->assertFalse( $storage->reset_rebuild_file( false, $parameters ) );
		$this->assertFalse( $storage->read( '/', $parameters ) );
		$this->assertTrue( $storage->reset_rebuild_file( '/', $parameters ) );
		$this->assertSame( 'root', $storage->read( '/', $parameters ) );
	}

	public function test_zero_path_does_not_use_homepage_cache() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );

		$this->assertSame( '0/', Boost_Cache_Utils::normalize_request_uri( '0' ) );
		$this->assertSame( '0/', Boost_Cache_Utils::normalize_request_uri( '0?q=value' ) );
		$this->assertNotSame( Filesystem_Utils::get_request_filename( '/', $parameters ), Filesystem_Utils::get_request_filename( '0', $parameters ) );
		$storage->write( '/', $parameters, 'root' );
		$storage->write( '0/', $parameters, 'zero' );
		$this->assertSame( 'zero', $storage->read( '0', $parameters ) );
		$storage->clear(
			'0',
			array(
				'parameters' => $parameters,
				'rebuild'    => false,
			)
		);
		$this->assertFalse( $storage->read( '0/', $parameters ) );
		$this->assertSame( 'root', $storage->read( '/', $parameters ) );
		$storage->write( '0/child/', $parameters, 'child' );
		$storage->clear(
			'0',
			array(
				'recursive' => true,
				'rebuild'   => false,
			)
		);
		$this->assertFalse( $storage->read( '0/child/', $parameters ) );
		$this->assertSame( 'root', $storage->read( '/', $parameters ) );
	}

	public function test_request_fragments_are_not_cached() {
		Functions\expect( 'apply_filters' )->never();
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );
		$storage->write( '/', $parameters, 'root' );
		$storage->write( '/section/', $parameters, 'section' );

		foreach ( array( '/#x', '/section#anything', '/section#', '/?q=value#x' ) as $uri ) {
			$normalized_uri = Boost_Cache_Utils::normalize_request_uri( $uri );
			$request        = new Request( $normalized_uri, $parameters );

			$this->assertFalse( $normalized_uri );
			$this->assertFalse( Filesystem_Utils::get_request_filename( $uri, $parameters ) );
			$this->assertFalse( $request->is_cacheable() );
			$this->assertInstanceOf( Boost_Cache_Error::class, $storage->write( $uri, $parameters, 'invalid' ) );
			$this->assertFalse( $storage->read( $uri, $parameters ) );
			$this->assertFalse( $storage->reset_rebuild_file( $uri, $parameters ) );
		}
		$this->assertSame( 'root', $storage->read( '/', $parameters ) );
		$this->assertSame( 'section', $storage->read( '/section/', $parameters ) );
	}

	public function test_request_paths_changed_by_url_parsing_are_not_cached() {
		Functions\expect( 'apply_filters' )->never();
		foreach ( array( "/a\x00b/", "/a\x01b/", "/a\x7Fb/", 'http://example.com/page', 'http://example.com' ) as $uri ) {
			$normalized_uri = Boost_Cache_Utils::normalize_request_uri( $uri );
			$request        = new Request( $normalized_uri, array() );

			$this->assertFalse( $normalized_uri );
			$this->assertFalse( Filesystem_Utils::get_request_filename( $uri, array() ) );
			$this->assertFalse( $request->is_cacheable() );
		}
	}

	public function test_encoded_fragment_characters_keep_their_own_cache_key() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );
		$filename   = Filesystem_Utils::get_request_filename( '/%23x', $parameters );

		$this->assertSame( '/%23x/', Boost_Cache_Utils::normalize_request_uri( '/%23x' ) );
		$this->assertIsString( $filename );
		$this->assertNotSame( Filesystem_Utils::get_request_filename( '/', $parameters ), $filename );
		$storage->write( '/', $parameters, 'root' );
		$storage->write( '/%23x/', $parameters, 'encoded' );
		$this->assertSame( 'encoded', $storage->read( '/%23x/', $parameters ) );
		$this->assertSame( 'root', $storage->read( '/', $parameters ) );
	}

	public function test_url_fragments_do_not_change_purge_scope() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );
		$cache      = new Boost_Cache( $storage );

		$storage->write( '/', $parameters, 'root' );
		$storage->write( '/section/', $parameters, 'section' );
		$cache->delete_page( 'https://example.com/section/?q=value#anything', $parameters );
		$this->assertFalse( $storage->read( '/section/', $parameters ) );
		$this->assertSame( 'root', $storage->read( '/', $parameters ) );
		$storage->write( '/section/child/', $parameters, 'child' );
		$cache->delete_recursive( 'https://example.com/section/#anything' );
		$this->assertFalse( $storage->read( '/section/child/', $parameters ) );
		$this->assertSame( 'root', $storage->read( '/', $parameters ) );
	}

	public function test_targeted_url_invalidation_normalizes_leading_path_slashes() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );
		$cache      = new Boost_Cache( $storage );

		$storage->write( '/page/child/', $parameters, 'cached' );
		$cache->delete_page( 'https://example.com//page/child/', $parameters );
		$this->assertFalse( $storage->read( '/page/child/', $parameters ) );

		$storage->write( '/page/child/', $parameters, 'cached' );
		$cache->rebuild_page( 'https://example.com//page/child/', $parameters );
		$this->assertFalse( $storage->read( '/page/child/', $parameters ) );
		$this->assertTrue( $storage->reset_rebuild_file( '/page/child/', $parameters ) );
		$this->assertSame( 'cached', $storage->read( '/page/child/', $parameters ) );
	}

	public function test_public_url_purge_accepts_scheme_relative_urls() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );
		$host       = $_SERVER['HTTP_HOST'] ?? null;

		try {
			$_SERVER['HTTP_HOST'] = 'example.com';
			require_once __DIR__ . '/../../../../../app/modules/optimizations/page-cache/pre-wordpress/boost-cache-actions.php';
			$storage->write( '/page/', $parameters, 'cached' );
			jetpack_boost_delete_cache_for_url( '//example.com/page/' );
			$this->assertFalse( $storage->read( '/page/', $parameters ) );
		} finally {
			if ( null === $host ) {
				unset( $_SERVER['HTTP_HOST'] );
			} else {
				$_SERVER['HTTP_HOST'] = $host;
			}
		}
	}

	public function test_distinct_request_uris_share_a_directory_without_sharing_cached_content() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );

		$this->assertTrue( $storage->write( '/a<b/', $parameters, 'first page' ) );
		$this->assertTrue( $storage->write( '/ab/', $parameters, 'second page' ) );
		$this->assertSame( 'first page', $storage->read( '/a<b/', $parameters ) );
		$this->assertSame( 'second page', $storage->read( '/ab/', $parameters ) );
	}

	public function test_targeted_clear_with_non_encodable_parameters_preserves_existing_directory() {
		$invalid   = array(
			'cookies' => array(),
			'get'     => array( 'param' => "\xFF" ),
		);
		$storage   = new File_Storage( 'example.com' );
		$directory = $this->boost_cache_dir . '/cache/example.com/page';

		$this->assertTrue( Filesystem_Utils::create_directory( $directory ) );
		foreach ( array( false, true ) as $rebuild ) {
			$storage->clear(
				'/page/',
				array(
					'parameters' => $invalid,
					'rebuild'    => $rebuild,
				)
			);
			$this->assertDirectoryExists( $directory );
			$this->assertFileExists( $directory . '/index.html' );
		}
	}

	public function test_pathless_url_purges_homepage_and_recursive_cache() {
		$parameters = array();
		$storage    = new File_Storage( 'example.com' );
		$cache      = new Boost_Cache( $storage );

		$storage->write( '/', $parameters, 'root' );
		$storage->write( '/child/', $parameters, 'child' );
		$cache->delete_page( 'https://example.com', $parameters );
		$this->assertFalse( $storage->read( '/', $parameters ) );
		$this->assertSame( 'child', $storage->read( '/child/', $parameters ) );
		$storage->write( '/', $parameters, 'root' );
		$cache->delete_recursive( 'https://example.com' );
		$this->assertFalse( $storage->read( '/', $parameters ) );
		$this->assertFalse( $storage->read( '/child/', $parameters ) );
	}

	public function test_padded_url_purges_its_page() {
		$storage = new File_Storage( 'example.com' );
		$cache   = new Boost_Cache( $storage );
		$storage->write( '/', array(), 'root' );

		foreach ( array( ' https://example.com/page/', "\thttps://example.com/page/", "https://example.com/page/\r\n" ) as $url ) {
			$storage->write( '/page/', array(), 'page' );
			$cache->delete_page( $url, array() );
			$this->assertFalse( $storage->read( '/page/', array() ) );
			$this->assertSame( 'root', $storage->read( '/', array() ) );
		}
	}

	public function test_control_characters_in_purge_paths_preserve_existing_pages() {
		$storage = new File_Storage( 'example.com' );
		$cache   = new Boost_Cache( $storage );
		$storage->write( '/a_b/', array(), 'underscore' );
		$storage->write( '/ab/', array(), 'plain' );

		foreach ( array( "\x00", "\x01", "\t", "\r", "\n", "\x7F" ) as $character ) {
			foreach ( array( '/a' . $character . 'b/', 'https://example.com/a' . $character . 'b/' ) as $path ) {
				$cache->delete_page( $path, array() );
				$cache->delete_recursive( $path );
				$this->assertSame( 'underscore', $storage->read( '/a_b/', array() ) );
				$this->assertSame( 'plain', $storage->read( '/ab/', array() ) );
			}
		}
	}

	public function test_version_change_clears_old_cache_without_a_request_host() {
		Functions\when( 'delete_site_option' )->justReturn( true );
		Functions\when( 'jetpack_boost_ds_get' )->justReturn( false );
		Functions\when( 'jetpack_boost_minify_is_enabled' )->justReturn( false );
		Functions\when( 'home_url' )->justReturn( 'https://example.com:8080' );
		Functions\when( 'wp_parse_url' )->alias( 'parse_url' );
		$options = array( 'jetpack_boost_page_cache_uri_keys' => false );
		Functions\when( 'get_option' )->alias(
			function ( $name, $default = false ) use ( &$options ) {
				return $options[ $name ] ?? $default;
			}
		);
		Functions\expect( 'update_option' )->once()->with( 'jetpack_boost_page_cache_uri_keys', 1, false )->andReturnUsing(
			function ( $name, $value ) use ( &$options ) {
				$options[ $name ] = $value;
				return true;
			}
		);
		Functions\when( 'wp_next_scheduled' )->justReturn( true );
		$storage = new File_Storage( 'example.com:8080' );
		$other   = new File_Storage( 'other.example.com' );
		$storage->write( '/', array(), 'root' );
		$storage->write( '/page/', array(), 'page' );
		$other->write( '/', array(), 'other' );
		$old_file = $this->boost_cache_dir . '/cache/example.com:8080/page/' . md5( '' ) . '.html';
		file_put_contents( $old_file, 'old' );
		$plugin = ( new \ReflectionClass( Jetpack_Boost::class ) )->newInstanceWithoutConstructor();
		$host   = $_SERVER['HTTP_HOST'] ?? null;
		try {
			unset( $_SERVER['HTTP_HOST'] );
			$plugin->handle_version_change();
		} finally {
			if ( null === $host ) {
				unset( $_SERVER['HTTP_HOST'] );
			} else {
				$_SERVER['HTTP_HOST'] = $host;
			}
		}
		$this->assertFileDoesNotExist( $old_file );
		$this->assertFalse( $storage->read( '/', array() ) );
		$this->assertFalse( $storage->read( '/page/', array() ) );
		$this->assertSame( 'other', $other->read( '/', array() ) );
		$this->assertSame( 1, $options['jetpack_boost_page_cache_uri_keys'] );

		$storage->write( '/', array(), 'new root' );
		$storage->write( '/page/', array(), 'new page' );
		$plugin->handle_version_change();
		$this->assertSame( 'new root', $storage->read( '/', array() ) );
		$this->assertSame( 'new page', $storage->read( '/page/', array() ) );

		if ( ! defined( 'JETPACK_BOOST_VERSION' ) ) {
			define( 'JETPACK_BOOST_VERSION', '1.0.0' );
		}
		$options['jetpack_boost_version'] = JETPACK_BOOST_VERSION;
		$storage->write( '/', array(), 'new' );
		$plugin->schedule_version_change();
		$this->assertSame( 'new', $storage->read( '/', array() ) );
	}

	public function test_targeted_path_purge_preserves_unrelated_pages_with_repeated_leading_slashes() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );
		$cache      = new Boost_Cache( $storage );

		$storage->write( '/', $parameters, 'root' );
		$storage->write( '/section/', $parameters, 'section' );
		$storage->write( '/keep/', $parameters, 'keep' );
		$cache->delete_page( '///section/?x=1', $parameters );

		$this->assertSame( 'root', $storage->read( '/', $parameters ) );
		$this->assertFalse( $storage->read( '/section/', $parameters ) );
		$this->assertSame( 'keep', $storage->read( '/keep/', $parameters ) );
	}

	public function test_recursive_path_purge_preserves_unrelated_pages_with_repeated_leading_slashes() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );
		$cache      = new Boost_Cache( $storage );

		$storage->write( '/', $parameters, 'root' );
		$storage->write( '/section/', $parameters, 'section' );
		$storage->write( '/section/child/', $parameters, 'child' );
		$storage->write( '/keep/', $parameters, 'keep' );
		$cache->delete_recursive( '////section/' );

		$this->assertSame( 'root', $storage->read( '/', $parameters ) );
		$this->assertFalse( $storage->read( '/section/', $parameters ) );
		$this->assertFalse( $storage->read( '/section/child/', $parameters ) );
		$this->assertSame( 'keep', $storage->read( '/keep/', $parameters ) );
	}

	public function test_unparseable_urls_do_not_purge_existing_pages() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );
		$cache      = new Boost_Cache( $storage );

		$storage->write( '/', $parameters, 'root' );
		$storage->write( '/section/', $parameters, 'section' );
		foreach ( array( 'https://example.com:99999/section/', '//example.com:99999/section/' ) as $url ) {
			$cache->delete_page( $url, $parameters );
			$cache->delete_recursive( $url );
			$this->assertSame( 'root', $storage->read( '/', $parameters ) );
			$this->assertSame( 'section', $storage->read( '/section/', $parameters ) );
		}
	}

	public function test_empty_or_non_string_purge_inputs_preserve_existing_pages() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );
		$pages      = array(
			'/'               => 'root',
			'/section/'       => 'section',
			'/section/child/' => 'child',
		);
		foreach ( $pages as $uri => $content ) {
			$storage->write( $uri, $parameters, $content );
		}

		foreach ( array( '', ' ', false, null, 0, true, array(), new \stdClass() ) as $path ) {
			foreach ( array( false, true ) as $rebuild ) {
				$storage->clear(
					$path,
					array(
						'parameters' => $parameters,
						'rebuild'    => $rebuild,
					)
				);
				$storage->clear(
					$path,
					array(
						'recursive' => true,
						'rebuild'   => $rebuild,
					)
				);
				foreach ( $pages as $uri => $content ) {
					$this->assertSame( $content, $storage->read( $uri, $parameters ) );
				}
			}
		}
	}

	public function test_urls_with_unparseable_paths_do_not_purge_existing_pages() {
		$parameters = array(
			'cookies' => array(),
			'get'     => array(),
		);
		$storage    = new File_Storage( 'example.com' );
		$cache      = new Boost_Cache( $storage );

		$storage->write( '/', $parameters, 'root' );
		$storage->write( '/section/', $parameters, 'section' );
		foreach ( array( 'https://example.com/x:0', 'https://example.com/section:99999/' ) as $url ) {
			$cache->delete_page( $url, $parameters );
			$this->assertSame( 'root', $storage->read( '/', $parameters ) );
			$cache->delete_recursive( $url );
			$this->assertSame( 'root', $storage->read( '/', $parameters ) );
			$this->assertSame( 'section', $storage->read( '/section/', $parameters ) );
		}
	}

	public function test_is_rebuild_file() {
		$normal_file  = 'test.html';
		$rebuild_file = 'test.html.rebuild.html';

		$this->assertFalse( Filesystem_Utils::is_rebuild_file( $normal_file ) );
		$this->assertTrue( Filesystem_Utils::is_rebuild_file( $rebuild_file ) );
	}

	public function test_create_directory() {
		$new_dir = $this->boost_cache_dir . '/test-dir';

		$this->assertTrue( Filesystem_Utils::create_directory( $new_dir ) );
		$this->assertTrue( is_dir( $new_dir ) );
		$this->assertTrue( file_exists( $new_dir . '/index.html' ) );
	}

	public function test_write_to_file() {
		$test_file = $this->boost_cache_dir . '/test.html';
		$test_data = 'Test content';

		$result = Filesystem_Utils::write_to_file( $test_file, $test_data );
		$this->assertTrue( $result );
		$this->assertTrue( file_exists( $test_file ) );
		$this->assertEquals( $test_data, file_get_contents( $test_file ) );
	}

	public function test_delete_file() {
		$test_file = $this->boost_cache_dir . '/test.html';
		file_put_contents( $test_file, 'Test content' );

		$this->assertTrue( Filesystem_Utils::delete_file( $test_file ) );
		$this->assertFalse( file_exists( $test_file ) );
	}

	public function test_is_dir_empty() {
		$empty_dir     = $this->boost_cache_dir . '/empty-dir';
		$non_empty_dir = $this->boost_cache_dir . '/non-empty-dir';

		mkdir( $empty_dir, 0755, true );
		mkdir( $non_empty_dir, 0755, true );
		file_put_contents( $non_empty_dir . '/test.html', 'Test content' );

		$this->assertTrue( Filesystem_Utils::is_dir_empty( $empty_dir ) );
		$this->assertFalse( Filesystem_Utils::is_dir_empty( $non_empty_dir ) );
	}

	public function test_directory_iteration_delete_all() {
		$test_dir = $this->boost_cache_dir . '/walk-test';
		mkdir( $test_dir, 0755, true );
		file_put_contents( $test_dir . '/test1.html', 'Test 1' );
		file_put_contents( $test_dir . '/test2.html', 'Test 2' );
		mkdir( $test_dir . '/subdir', 0755, true );
		file_put_contents( $test_dir . '/subdir/test3.html', 'Test 3' );

		$result = Filesystem_Utils::iterate_directory( $test_dir, new Simple_Delete() );
		$this->assertTrue( $result === 5 );
		$this->assertFalse( file_exists( $test_dir ) );
	}

	public function test_directory_iteration_rebuild_all() {
		$test_dir = $this->boost_cache_dir . '/rebuild-test';
		mkdir( $test_dir, 0755, true );
		file_put_contents( $test_dir . '/test1.html', 'Test 1' );
		file_put_contents( $test_dir . '/test2.html', 'Test 2' );
		file_put_contents( $test_dir . '/test3.html.rebuild.html', 'Test 3' );

		$result = Filesystem_Utils::iterate_directory( $test_dir, new Rebuild_File() );
		$this->assertTrue( $result === 3 );
		$this->assertTrue( file_exists( $test_dir . '/test1.html.rebuild.html' ) );
		$this->assertTrue( file_exists( $test_dir . '/test2.html.rebuild.html' ) );

		// Trying to rebuild a file that is already a rebuild file should delete it.
		$this->assertFalse( file_exists( $test_dir . '/test3.html.rebuild.html' ) );
	}

	public function test_gc_expired_files() {
		$test_dir = $this->boost_cache_dir . '/cache/gc-test';
		mkdir( $test_dir, 0755, true );

		// Create test files with different modification times
		$file1 = $test_dir . '/test1.html';
		$file2 = $test_dir . '/test2.html';
		file_put_contents( $file1, 'Test 1' );
		file_put_contents( $file2, 'Test 2' );

		// Set file1 to be expired
		touch( $file1, time() - 3600 );

		$storage = new File_Storage( 'gc-test' );
		$count   = $storage->garbage_collect( 1800 );
		$this->assertSame( 1, $count );
		$this->assertFalse( file_exists( $file1 ) );
		$this->assertTrue( file_exists( $file2 ) );
	}

	public function test_delete_directory_removes_entire_tree() {
		// Mimic the layout of a real boost-cache directory, including index.html
		// placeholder files in every directory, and the logs/ and static/ subdirectories.
		mkdir( $this->boost_cache_dir . '/cache/example.com/some/page', 0755, true );
		mkdir( $this->boost_cache_dir . '/logs', 0755, true );
		mkdir( $this->boost_cache_dir . '/static', 0755, true );

		file_put_contents( $this->boost_cache_dir . '/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/cache/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/cache/example.com/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/cache/example.com/some/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/cache/example.com/some/page/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/cache/example.com/some/page/' . md5( 'request' ) . '.html', 'cached page' );
		file_put_contents( $this->boost_cache_dir . '/logs/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/logs/log-2026-06-11.log.php', 'log data' );
		file_put_contents( $this->boost_cache_dir . '/static/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/static/file.css', 'css' );

		$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );
		$this->assertTrue( $result );
		$this->assertFalse( file_exists( $this->boost_cache_dir ) );
	}

	public function test_delete_directory_with_deep_and_many_file_tree() {
		// Many files spread across many subdirectories.
		for ( $i = 0; $i < 20; $i++ ) {
			$dir = $this->boost_cache_dir . '/cache/example.com/page-' . $i;
			mkdir( $dir, 0755, true );
			file_put_contents( $dir . '/index.html', '' );
			for ( $j = 0; $j < 50; $j++ ) {
				file_put_contents( $dir . '/file-' . $j . '.html', 'cached content' );
			}
		}

		// A deeply nested directory tree.
		$deep_dir = $this->boost_cache_dir . '/cache/deep';
		for ( $i = 0; $i < 30; $i++ ) {
			$deep_dir .= '/level-' . $i;
		}
		mkdir( $deep_dir, 0755, true );
		file_put_contents( $deep_dir . '/leaf.html', 'cached content' );

		$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );
		$this->assertTrue( $result );
		$this->assertFalse( is_dir( $this->boost_cache_dir ) );
	}

	public function test_delete_directory_refuses_paths_outside_boost_cache() {
		file_put_contents( $this->test_dir . '/test.html', 'Test content' );

		$result = Filesystem_Utils::delete_directory( $this->test_dir );
		$this->assertInstanceOf( Boost_Cache_Error::class, $result );
		$this->assertEquals( 'invalid-directory', $result->get_error_code() );
		$this->assertTrue( is_dir( $this->test_dir ) );
		$this->assertTrue( file_exists( $this->test_dir . '/test.html' ) );
	}

	public function test_delete_directory_refuses_sibling_directory_with_boost_cache_prefix() {
		// A sibling like boost-cache-old passes is_boost_cache_directory()'s
		// substring match, so delete_directory()'s own strict containment
		// check is what must refuse it.
		$sibling = $this->boost_cache_dir . '-old';
		mkdir( $sibling, 0755, true );
		file_put_contents( $sibling . '/test.html', 'Test content' );

		try {
			$result = Filesystem_Utils::delete_directory( $sibling );
			$this->assertInstanceOf( Boost_Cache_Error::class, $result );
			$this->assertEquals( 'invalid-directory', $result->get_error_code() );
			$this->assertTrue( is_dir( $sibling ) );
			$this->assertTrue( file_exists( $sibling . '/test.html' ) );
		} finally {
			$this->recursive_rmdir( $sibling );
		}
	}

	public function test_delete_directory_refuses_file_path() {
		$file = $this->boost_cache_dir . '/cached-page.html';
		file_put_contents( $file, 'cached page' );

		$result = Filesystem_Utils::delete_directory( $file );
		$this->assertInstanceOf( Boost_Cache_Error::class, $result );
		$this->assertEquals( 'not-a-directory', $result->get_error_code() );
		$this->assertTrue( file_exists( $file ) );
	}

	public function test_delete_directory_returns_error_for_unreadable_subdirectory() {
		if ( function_exists( 'posix_geteuid' ) && 0 === posix_geteuid() ) {
			$this->markTestSkipped( 'Directory permission restrictions do not apply when running as root.' );
		}

		$locked = $this->boost_cache_dir . '/cache/locked';
		mkdir( $locked, 0755, true );
		file_put_contents( $locked . '/file.html', 'cached page' );
		chmod( $locked, 0000 );

		try {
			$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );
			$this->assertInstanceOf( Boost_Cache_Error::class, $result );
			$this->assertEquals( 'could-not-delete-directory', $result->get_error_code() );
		} finally {
			chmod( $locked, 0755 );
		}
	}

	public function test_delete_directory_sweeps_readable_entries_despite_unreadable_subdirectory() {
		if ( function_exists( 'posix_geteuid' ) && 0 === posix_geteuid() ) {
			$this->markTestSkipped( 'Directory permission restrictions do not apply when running as root.' );
		}

		// One unreadable subdirectory must not abort the whole cleanup: the walk is
		// best-effort (CATCH_GET_CHILD), so readable siblings are still deleted.
		$readable = $this->boost_cache_dir . '/cache/readable';
		mkdir( $readable, 0755, true );
		file_put_contents( $readable . '/file.html', 'cached page' );

		$locked = $this->boost_cache_dir . '/cache/locked';
		mkdir( $locked, 0755, true );
		file_put_contents( $locked . '/file.html', 'cached page' );
		chmod( $locked, 0000 );

		try {
			$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );

			// The unreadable subtree survives, so the overall result is still an error.
			$this->assertInstanceOf( Boost_Cache_Error::class, $result );
			$this->assertEquals( 'could-not-delete-directory', $result->get_error_code() );
			// ...but the readable sibling was swept rather than left behind.
			$this->assertFalse( is_dir( $readable ) );
		} finally {
			chmod( $locked, 0755 );
		}
	}

	public function test_delete_directory_with_missing_directory() {
		$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir . '/non-existent' );
		$this->assertTrue( $result );
	}

	public function test_delete_directory_unlinks_symlink_without_deleting_target() {
		if ( ! function_exists( 'symlink' ) ) {
			$this->markTestSkipped( 'symlink() is not available on this platform.' );
		}

		// A directory outside boost-cache, with a file in it, that must survive.
		$external_target = $this->test_dir . '/external-target';
		mkdir( $external_target, 0755, true );
		file_put_contents( $external_target . '/keep.txt', 'must survive' );

		// A symlink INSIDE the cache tree that points at the external directory.
		// The deletion loop must unlink the link itself, not follow it.
		if ( ! @symlink( $external_target, $this->boost_cache_dir . '/link-to-outside' ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$this->markTestSkipped( 'Could not create a symlink on this platform.' );
		}
		file_put_contents( $this->boost_cache_dir . '/cached.html', 'cached page' );

		$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );

		$this->assertTrue( $result );
		$this->assertFalse( is_dir( $this->boost_cache_dir ) );
		// The link was removed but its target and contents are untouched.
		$this->assertTrue( is_dir( $external_target ) );
		$this->assertTrue( file_exists( $external_target . '/keep.txt' ) );
	}

	public function test_delete_directory_refuses_symlinked_cache_root() {
		if ( ! function_exists( 'symlink' ) ) {
			$this->markTestSkipped( 'symlink() is not available on this platform.' );
		}

		// A directory outside boost-cache that must survive.
		$external_target = $this->test_dir . '/external-root-target';
		mkdir( $external_target, 0755, true );
		file_put_contents( $external_target . '/keep.txt', 'must survive' );

		// Replace the boost-cache root itself with a symlink to the external
		// directory. realpath() resolves both sides identically, so the
		// containment check passes; the is_link() guard is what must refuse it.
		rmdir( $this->boost_cache_dir );
		if ( ! @symlink( $external_target, $this->boost_cache_dir ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			mkdir( $this->boost_cache_dir, 0755, true );
			$this->markTestSkipped( 'Could not create a symlink on this platform.' );
		}

		try {
			$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );

			$this->assertInstanceOf( Boost_Cache_Error::class, $result );
			$this->assertEquals( 'invalid-directory', $result->get_error_code() );
			$this->assertTrue( is_dir( $external_target ) );
			$this->assertTrue( file_exists( $external_target . '/keep.txt' ) );
		} finally {
			// Remove the symlink so tearDown does not follow it into the target.
			if ( is_link( $this->boost_cache_dir ) ) {
				unlink( $this->boost_cache_dir );
			}
		}
	}

	public function test_delete_directory_returns_error_when_root_rmdir_fails() {
		if ( function_exists( 'posix_geteuid' ) && 0 === posix_geteuid() ) {
			$this->markTestSkipped( 'Directory permission restrictions do not apply when running as root.' );
		}

		// Files inside the cache delete fine, but a read-only parent makes the
		// final rmdir() of the root fail. This exercises the post-iteration
		// is_dir() guard, a different code path than the iterator-throw case.
		file_put_contents( $this->boost_cache_dir . '/cached.html', 'cached page' );
		$parent = dirname( $this->boost_cache_dir );
		chmod( $parent, 0555 );

		try {
			$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );

			$this->assertInstanceOf( Boost_Cache_Error::class, $result );
			$this->assertEquals( 'could-not-delete-directory', $result->get_error_code() );
			// The contents were removed but the root itself could not be.
			$this->assertTrue( is_dir( $this->boost_cache_dir ) );
			$this->assertFalse( file_exists( $this->boost_cache_dir . '/cached.html' ) );
		} finally {
			chmod( $parent, 0755 );
		}
	}

	public function test_invalid_directory_operations() {
		$non_existent_dir = $this->boost_cache_dir . '/non-existent';
		$invalid_dir      = $this->test_dir;

		// Test walk_directory with non-existent directory
		$result = Filesystem_Utils::iterate_directory( $non_existent_dir, new Simple_Delete() );
		$this->assertInstanceOf( Boost_Cache_Error::class, $result );
		$this->assertEquals( 'directory-missing', $result->get_error_code() );

		// Test walk_directory with invalid directory
		$result = Filesystem_Utils::iterate_directory( $invalid_dir, new Simple_Delete() );
		$this->assertInstanceOf( Boost_Cache_Error::class, $result );
		$this->assertEquals( 'invalid-directory', $result->get_error_code() );
	}

	public function test_iterate_directory_skips_unopenable_subdirectory_without_throwing() {
		if ( function_exists( 'posix_geteuid' ) && 0 === posix_geteuid() ) {
			$this->markTestSkipped( 'Directory permission restrictions do not apply when running as root.' );
		}

		// Reproduces the "Updating failed. Uncaught UnexpectedValueException:
		// RecursiveDirectoryIterator::__construct(...): Failed to open directory"
		// crash seen when editing a template. A full-site walk (rebuild_all)
		// reaches a subdirectory it cannot open — because a concurrent
		// invalidation / garbage-collection pass removed it mid-walk, or its
		// permissions changed — and RecursiveDirectoryIterator throws while
		// descending. An unopenable (0000) directory triggers the same throw at
		// the same point deterministically. The walk must be best-effort: skip
		// the entry and keep going rather than let the exception abort the
		// request.
		$root     = $this->boost_cache_dir . '/cache/example.com';
		$readable = $root . '/readable';
		$locked   = $root . '/locked';
		mkdir( $readable, 0755, true );
		mkdir( $locked, 0755, true );
		file_put_contents( $readable . '/page.html', 'cached page' );
		file_put_contents( $locked . '/page.html', 'cached page' );
		chmod( $locked, 0000 );

		try {
			$result = Filesystem_Utils::iterate_directory( $root, new Simple_Delete() );

			// The walk completed instead of throwing...
			$this->assertIsInt( $result );
			// ...and the readable sibling was still swept rather than left behind.
			$this->assertFalse( file_exists( $readable . '/page.html' ) );
		} finally {
			chmod( $locked, 0755 );
		}
	}

	public function test_iterate_files_returns_error_for_unreadable_directory() {
		if ( function_exists( 'posix_geteuid' ) && 0 === posix_geteuid() ) {
			$this->markTestSkipped( 'Directory permission restrictions do not apply when running as root.' );
		}

		// iterate_files() passes validation for a chmod-0000 directory - realpath()
		// and is_dir() only need search permission on the parent, which it has - but
		// scandir() then fails because reading the directory itself is denied. The
		// guard must return a controlled Boost_Cache_Error rather than let
		// array_diff( false, ... ) raise a TypeError (the same TOCTOU class of bug
		// this change fixes in iterate_directory()).
		$dir = $this->boost_cache_dir . '/cache/unreadable';
		mkdir( $dir, 0755, true );
		file_put_contents( $dir . '/page.html', 'cached page' );
		chmod( $dir, 0000 );

		try {
			$result = Filesystem_Utils::iterate_files( $dir, new Simple_Delete() );

			$this->assertInstanceOf( Boost_Cache_Error::class, $result );
			$this->assertEquals( 'could-not-read-directory', $result->get_error_code() );
		} finally {
			chmod( $dir, 0755 );
		}
	}
}
