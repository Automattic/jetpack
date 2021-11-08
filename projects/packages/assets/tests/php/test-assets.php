<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Assets methods
 *
 * @package automattic/jetpack-assets
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Constants as Jetpack_Constants;
use Brain\Monkey;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Assets test suite.
 */
class AssetsTest extends TestCase {
	use \Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();
		$plugin_dir = dirname( dirname( dirname( dirname( __DIR__ ) ) ) ) . '/';
		Jetpack_Constants::set_constant( 'JETPACK__PLUGIN_FILE', $plugin_dir . 'jetpack.php' );

		Functions\stubs(
			array(
				'wp_parse_url'  => 'parse_url',
				'add_query_arg' => function ( ...$args ) {
					$this->assertCount( 3, $args );
					list( $k, $v, $url ) = $args;
					$url .= ( strpos( $url, '?' ) === false ? '?' : '&' ) . rawurlencode( $k ) . '=' . rawurlencode( $v );
					return $url;
				},
				'plugins_url'   => function ( $path, $plugin_path ) use ( $plugin_dir ) {
					$plugin_path = dirname( $plugin_path );
					$this->stringStartsWith( $plugin_dir, $plugin_path );
					return 'http://www.example.com/wp-content/plugins/jetpack/' . substr( $plugin_path, strlen( $plugin_dir ) ) . '/' . $path;
				},
			)
		);
	}

	/**
	 * Run after every test.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();

		// Clear the instance.
		$rc = new \ReflectionClass( Assets::class );
		$rp = $rc->getProperty( 'instance' );
		$rp->setAccessible( true );
		$rp->setValue( null );
	}

	/**
	 * Test get_file_url_for_environment
	 *
	 * @author ebinnion goldsounds
	 * @dataProvider get_file_url_for_environment_data_provider
	 *
	 * @param string $min_path        minified path.
	 * @param string $non_min_path    non-minified path.
	 * @param bool   $is_script_debug Is SCRIPT_DEBUG enabled.
	 * @param string $expected        Expected result.
	 * @param string $not_expected    Non expected result.
	 */
	public function test_get_file_url_for_environment( $min_path, $non_min_path, $is_script_debug, $expected, $not_expected ) {
		Constants::set_constant( 'SCRIPT_DEBUG', $is_script_debug );
		$file_url = Assets::get_file_url_for_environment( $min_path, $non_min_path );

		// note the double-$$ here, $(non_)min_path is referenced by var name.
		$this->assertStringContainsString( $$expected, $file_url );
		$this->assertStringNotContainsString( $$not_expected, $file_url );
	}

	/**
	 * Test that get_file_url_for_environment returns a full URL when given a full URL
	 *
	 * @author jeherve
	 * @dataProvider get_file_url_for_environment_full_urls_data_provider
	 *
	 * @param string $url Full URL we want to enqueue.
	 */
	public function test_get_file_url_for_environment_full_url( $url ) {
		$file_url = Assets::get_file_url_for_environment( $url, $url );

		$this->assertEquals( $url, $file_url );
	}

	/**
	 * Test that get_file_url_for_environment returns a full package asset url when package path is provided.
	 *
	 * @param string $min_path        minified path.
	 * @param string $non_min_path    non-minified path.
	 * @param string $package_path    Package path.
	 * @param bool   $is_script_debug Is SCRIPT_DEBUG enabled.
	 * @param string $expected        Expected result.
	 * @param string $not_expected    Non expected result.
	 *
	 * @author       davidlonjon
	 * @dataProvider get_file_url_for_environment_package_path_data_provider
	 */
	public function test_get_file_url_for_environment_package_path( $min_path, $non_min_path, $package_path, $is_script_debug, $expected, $not_expected ) {
		Constants::set_constant( 'SCRIPT_DEBUG', $is_script_debug );
		$file_url = Assets::get_file_url_for_environment( $min_path, $non_min_path, $package_path );

		$this->assertStringContainsString( $expected, $file_url );
		$this->assertStringNotContainsString( $not_expected, $file_url );
	}

	/**
	 * Tests ability for a filter to map specific URLs.
	 *
	 * @author kraftbj
	 * @see p58i-8nS-p2
	 */
	public function test_get_file_url_for_environment_with_filter() {
		Filters\expectApplied( 'jetpack_get_file_for_environment' )->once()->andReturn( 'special-test.js' );

		$file_url = Assets::get_file_url_for_environment( 'test.min.js', 'test.js' );

		$this->assertStringContainsString( 'special-test.js', $file_url );
	}

	/**
	 * Possible values for test_get_file_url_for_environment.
	 */
	public function get_file_url_for_environment_data_provider() {
		return array(
			'script-debug-true'  => array(
				'_inc/build/shortcodes/js/recipes.js',
				'modules/shortcodes/js/recipes.js',
				true,
				'non_min_path',
				'min_path',
			),
			'script-debug-false' => array(
				'_inc/build/shortcodes/js/recipes.js',
				'modules/shortcodes/js/recipes.js',
				false,
				'min_path',
				'non_min_path',
			),
		);
	}

	/**
	 * Possible values for test_get_file_url_for_environment.
	 */
	public function get_file_url_for_environment_full_urls_data_provider() {
		return array(
			'full_url'          => array( 'https://jetpack.com/scripts/test.js' ),
			'protocol_relative' => array( '//jetpack.com/styles/test.css' ),
		);
	}

	/**
	 * Possible values for test_get_file_url_for_environment.
	 */
	public function get_file_url_for_environment_package_path_data_provider() {
		$min_path     = 'src/js/test.min.js';
		$non_min_path = 'src/js/test.js';
		$package_path = dirname( dirname( dirname( dirname( __DIR__ ) ) ) ) . '/packages/test-package/test-package.php';

		return array(
			'script-debug-true'  => array(
				$min_path,
				$non_min_path,
				$package_path,
				true,
				'wp-content/plugins/jetpack/packages/test-package/' . $non_min_path,
				'wp-content/plugins/jetpack/packages/test-package/' . $min_path,

			),
			'script-debug-false' => array(
				$min_path,
				$non_min_path,
				$package_path,
				false,
				'wp-content/plugins/jetpack/packages/test-package/' . $min_path,
				'wp-content/plugins/jetpack/packages/test-package/' . $non_min_path,
			),
		);
	}

	/**
	 * Test that enqueue_async_script calls wp_enqueue_script
	 */
	public function test_enqueue_async_script_calls_wp_enqueue_script() {
		Functions\expect( 'wp_enqueue_script' )
			->once()
			->with( 'handle', Assets::get_file_url_for_environment( '/minpath.js', '/path.js' ), array(), '123', true );
		Assets::enqueue_async_script( 'handle', '/minpath.js', '/path.js', array(), '123', true );
		$asset_instance = Assets::instance();
		$this->assertEquals( 10, (int) has_filter( 'script_loader_tag', array( $asset_instance, 'script_add_async' ) ) );
	}

	/**
	 * Test whether static resources are properly updated to use a WordPress.com static domain.
	 *
	 * @covers Automattic\Jetpack\Assets::staticize_subdomain
	 * @dataProvider get_resources_urls
	 *
	 * @param string $original       Source URL.
	 * @param string $expected_http  Expected WordPress.com Static URL when we're mocking a site using HTTP.
	 * @param string $expected_https Expected WordPress.com Static URL when we're mocking a site using HTTPS.
	 */
	public function test_staticize_subdomain( $original, $expected_http, $expected_https ) {
		Functions\when( 'is_ssl' )->justReturn( false );
		$static_resource = Assets::staticize_subdomain( $original );
		$this->assertStringContainsString( $expected_http, $static_resource );

		Functions\when( 'is_ssl' )->justReturn( true );
		$static_resource = Assets::staticize_subdomain( $original );
		$this->assertEquals( $expected_https, $static_resource );
	}

	/**
	 * Data provider to test staticize_subdomain
	 */
	public function get_resources_urls() {
		return array(
			'non_wpcom_domain'  => array(
				'https://example.org/thing.jpg',
				'https://example.org/thing.jpg',
				'https://example.org/thing.jpg',
			),
			'wp_in_the_name'    => array(
				'https://examplewp.com/thing.jpg',
				'https://examplewp.com/thing.jpg',
				'https://examplewp.com/thing.jpg',
			),
			'local_domain'      => array(
				'https://localhost/dir/thing.jpg',
				'https://localhost/dir/thing.jpg',
				'https://localhost/dir/thing.jpg',
			),
			'wordpresscom'      => array(
				'https://wordpress.com/i/blank.jpg',
				'.wp.com/i/blank.jpg',
				'https://s-ssl.wordpress.com/i/blank.jpg',
			),
			'wpcom'             => array(
				'https://wp.com/i/blank.jpg',
				'.wp.com/i/blank.jpg',
				'https://s-ssl.wordpress.com/i/blank.jpg',
			),
			'www_wordpresscom'  => array(
				'https://www.wordpress.com/i/blank.jpg',
				'.wp.com/i/blank.jpg',
				'https://s-ssl.wordpress.com/i/blank.jpg',
			),
			'http_wordpresscom' => array(
				'http://wordpress.com/i/blank.jpg',
				'.wp.com/i/blank.jpg',
				'https://s-ssl.wordpress.com/i/blank.jpg',
			),
		);
	}

	/**
	 * Test `normalize_path`.
	 *
	 * @dataProvider provide_normalize_path
	 * @param string $path Path.
	 * @param string $expect Expect.
	 */
	public function test_normalize_path( $path, $expect ) {
		$this->assertSame( $expect, Assets::normalize_path( $path ) );
	}

	/** Data provider for `test_normalize_path` */
	public static function provide_normalize_path() {
		return array(
			array( 'foo/bar/baz', 'foo/bar/baz' ),
			array( '/foo/bar/baz', '/foo/bar/baz' ),
			array( '/foo/../bar/baz', '/bar/baz' ),
			array( '/foo//../bar/baz', '/bar/baz' ),
			array( './foo', 'foo' ),
			array( '../foo/bar', 'foo/bar' ),
			array( '/foo/bar/bar/../../baz', '/foo/baz' ),
			array( '/foo/../../../bar/baz', '/bar/baz' ),
			array( '/foo/bar/./baz', '/foo/bar/baz' ),
			array( '/foo/bar/./../baz', '/foo/baz' ),
			array( 'http://example.com', 'http://example.com' ),
			array( 'http://example.com?', 'http://example.com?' ),
			array( 'http://example.com/foo/bar/../baz', 'http://example.com/foo/baz' ),
			array( 'http://example.com/foo/../../bar/', 'http://example.com/bar' ),
			array( 'http://example.com/foo/bar/../baz?path=a/../b', 'http://example.com/foo/baz?path=a/../b' ),
			array( 'http://user@example.com/foo/../../bar/', 'http://user@example.com/bar' ),
			array( 'http://user:pass@example.com:81/foo/.#frag', 'http://user:pass@example.com:81/foo#frag' ),
		);
	}

	/**
	 * Test `register_script` and `enqueue_script`.
	 *
	 * @dataProvider provide_register_script
	 * @param array $args Arguments for `register_script`.
	 * @param array $expect Map of function to expected arguments.
	 * @param array $extra Map of additional settings:
	 *   - is_script_debug: Value for `SCRIPT_DEBUG`.
	 *   - is_rtl: Value for `is_rtl()`.
	 *   - exception: Exception expected to be thrown.
	 */
	public function test_register_script( $args, $expect, $extra = array() ) {
		Functions\stubs(
			array(
				'filemtime'   => function ( $v ) {
					return crc32( $v );
				},
				'wp_style_is' => function ( $handle, $list = 'enqueued' ) {
					return ( 'wp-components' === $handle && 'registered' === $list );
				},
			)
		);
		foreach ( $expect as $func => $with ) {
			Functions\expect( $func )
				->once()
				->with( ...$with );
		}

		if ( isset( $extra['is_script_debug'] ) ) {
			Constants::set_constant( 'SCRIPT_DEBUG', $extra['is_script_debug'] );
		}
		if ( isset( $extra['is_rtl'] ) ) {
			Functions\when( 'is_rtl' )->justReturn( $extra['is_rtl'] );
		}
		if ( isset( $extra['exception'] ) ) {
			$this->expectException( get_class( $extra['exception'] ) );
			$this->expectExceptionMessage( $extra['exception']->getMessage() );
		}
		if ( isset( $extra['enqueue'] ) ) {
			$obj = $this->getMockBuilder( \stdClass::class )
				->setMethods( array( 'get_data' ) )
				->getMock();
			$obj->expects( $this->once() )->method( 'get_data' )->with( ...$extra['enqueue'][0] )->willReturn( $extra['enqueue'][1] );
			Functions\expect( 'wp_scripts' )->once()->andReturn( $obj );
		}

		Assets::register_script( ...$args );

		// Check whether $options['async'] was honored.
		$rc = new \ReflectionClass( Assets::instance() );
		$rp = $rc->getProperty( 'defer_script_handles' );
		$rp->setAccessible( true );
		$this->assertSame(
			isset( $extra['async'] ) ? $extra['async'] : array(),
			$rp->getValue( Assets::instance() )
		);
	}

	/** Data provider for `test_register_script` */
	public static function provide_register_script() {
		$url_base = 'http://www.example.com/wp-content/plugins/jetpack/packages/assets/tests/php/test-assets-files';
		return array(
			'Single JS file'                            => array(
				array( 'single-file', 'test-assets-files/single-js-file.js', __FILE__ ),
				array(
					'wp_register_script' => array(
						'single-file',
						"$url_base/single-js-file.js?minify=false",
						array(),
						231206287,
						false,
					),
					'wp_script_add_data' => array( 'single-file', 'Jetpack::Assets::hascss', false ),
				),
			),
			'Single JS file, override version and deps' => array(
				array(
					'single-file',
					'test-assets-files/single-js-file.js',
					__FILE__,
					array(
						'version'      => 'foobar',
						'dependencies' => array( 'xyz' ),
					),
				),
				array(
					'wp_register_script' => array(
						'single-file',
						"$url_base/single-js-file.js?minify=false",
						array( 'xyz' ),
						'foobar',
						false,
					),
					'wp_script_add_data' => array( 'single-file', 'Jetpack::Assets::hascss', false ),
				),
			),

			'JS and CSS'                                => array(
				array( 'handle', 'test-assets-files/js-and-css.js', __FILE__ ),
				array(
					'wp_register_script' => array(
						'handle',
						"$url_base/js-and-css.js?minify=false",
						array( 'wp-polyfill' ),
						'ver-from-js-and-css',
						false,
					),
					'wp_register_style'  => array( 'handle', "$url_base/js-and-css.css?minify=false", array(), 'ver-from-js-and-css', 'all' ),
					'wp_script_add_data' => array( 'handle', 'Jetpack::Assets::hascss', true ),
				),
				array( 'is_rtl' => false ),
			),
			'JS and CSS, override version, deps, minify, is_rtl, in_footer, css_deps, and media' => array(
				array(
					'handle',
					'test-assets-files/js-and-css.js',
					__FILE__,
					array(
						'version'          => 'foobaz',
						'in_footer'        => true,
						'minify'           => null,
						'media'            => 'screen',
						'dependencies'     => array( 'qwerty', 'uiop' ),
						'css_dependencies' => array( 'asdf' ),
					),
				),
				array(
					'wp_register_script' => array(
						'handle',
						"$url_base/js-and-css.js",
						array( 'wp-polyfill', 'qwerty', 'uiop' ),
						'foobaz',
						true,
					),
					'wp_register_style'  => array( 'handle', "$url_base/js-and-css.css", array( 'asdf' ), 'foobaz', 'screen' ),
					'wp_script_add_data' => array( 'handle', 'Jetpack::Assets::hascss', true ),
				),
				array( 'is_rtl' => true ),
			),

			'Everything'                                => array(
				array( 'handle', 'test-assets-files/everything.js', __FILE__, array( 'nonmin_path' => 'test-assets-files/everything.src.js' ) ),
				array(
					'wp_register_script' => array(
						'handle',
						"$url_base/everything.js?minify=false",
						array( 'wp-polyfill', 'wp-components', 'wp-i18n' ),
						'ver-from-everything',
						false,
					),
					'wp_register_style'  => array( 'handle', "$url_base/everything.css?minify=false", array( 'wp-components' ), 'ver-from-everything', 'all' ),
					'wp_script_add_data' => array( 'handle', 'Jetpack::Assets::hascss', true ),
				),
				array( 'is_rtl' => false ),
			),
			'Everything, override version, deps, css_deps, minify, is_rtl, in_footer, is_script_debug, and media' => array(
				array(
					'handle',
					'test-assets-files/everything.js',
					__FILE__,
					array(
						'nonmin_path'      => 'test-assets-files/everything.src.js',
						'version'          => 'foobaz',
						'in_footer'        => true,
						'minify'           => true,
						'media'            => 'screen',
						'dependencies'     => array( 'qwerty', 'uiop' ),
						'css_dependencies' => array( 'asdf' ),
					),
				),
				array(
					'wp_register_script' => array(
						'handle',
						"$url_base/everything.src.js?minify=true",
						array( 'wp-polyfill', 'wp-components', 'wp-i18n', 'qwerty', 'uiop' ),
						'foobaz',
						true,
					),
					'wp_register_style'  => array( 'handle', "$url_base/everything.rtl.css?minify=true", array( 'wp-components', 'asdf' ), 'foobaz', 'screen' ),
					'wp_script_add_data' => array( 'handle', 'Jetpack::Assets::hascss', true ),
				),
				array(
					'is_script_debug' => true,
					'is_rtl'          => true,
				),
			),

			'Override paths'                            => array(
				array(
					'single-file',
					'test-assets-files/single-js-file.js',
					__FILE__,
					array(
						'css_path'   => 'test-assets-files/everything.css',
						'asset_path' => 'test-assets-files/js-and-css.asset.php',
					),
				),
				array(
					'wp_register_script' => array(
						'single-file',
						"$url_base/single-js-file.js?minify=false",
						array( 'wp-polyfill' ),
						'ver-from-js-and-css',
						false,
					),
					'wp_register_style'  => array( 'single-file', "$url_base/everything.rtl.css?minify=false", array(), 'ver-from-js-and-css', 'all' ),
					'wp_script_add_data' => array( 'single-file', 'Jetpack::Assets::hascss', true ),
				),
				array( 'is_rtl' => true ),
			),

			'Async'                                     => array(
				array( 'single-file', 'test-assets-files/single-js-file.js', __FILE__, array( 'async' => true ) ),
				array(
					'wp_register_script' => array(
						'single-file',
						"$url_base/single-js-file.js?minify=false",
						array(),
						231206287,
						false,
					),
					'wp_script_add_data' => array( 'single-file', 'Jetpack::Assets::hascss', false ),
				),
				array( 'async' => array( 'single-file' ) ),
			),

			'Enqueue'                                   => array(
				array( 'single-file', 'test-assets-files/single-js-file.js', __FILE__, array( 'enqueue' => true ) ),
				array(
					'wp_register_script' => array(
						'single-file',
						"$url_base/single-js-file.js?minify=false",
						array(),
						231206287,
						false,
					),
					'wp_script_add_data' => array( 'single-file', 'Jetpack::Assets::hascss', false ),
					'wp_enqueue_script'  => array( 'single-file' ),
				),
				array( 'enqueue' => array( array( 'single-file', 'Jetpack::Assets::hascss' ), false ) ),
			),
			'Enqueue, with CSS'                         => array(
				array( 'everything', 'test-assets-files/everything.js', __FILE__, array( 'enqueue' => true ) ),
				array(
					'wp_register_script' => array(
						'everything',
						"$url_base/everything.js?minify=false",
						array( 'wp-polyfill', 'wp-components', 'wp-i18n' ),
						'ver-from-everything',
						false,
					),
					'wp_register_style'  => array( 'everything', "$url_base/everything.css?minify=false", array( 'wp-components' ), 'ver-from-everything', 'all' ),
					'wp_script_add_data' => array( 'everything', 'Jetpack::Assets::hascss', true ),
					'wp_enqueue_script'  => array( 'everything' ),
					'wp_enqueue_style'   => array( 'everything' ),
				),
				array(
					'is_rtl'  => false,
					'enqueue' => array( array( 'everything', 'Jetpack::Assets::hascss' ), true ),
				),
			),

			'Bad path'                                  => array(
				array( 'single-file', 'test-assets-files/single-js-file.jsx', __FILE__ ),
				array(),
				array( 'exception' => new \InvalidArgumentException( '$path must end in ".js"' ) ),
			),
			'Bad css_path'                              => array(
				array( 'single-file', 'test-assets-files/single-js-file.js', __FILE__, array( 'css_path' => 'foo.js' ) ),
				array(),
				array( 'exception' => new \InvalidArgumentException( '$options[\'css_path\'] must end in ".css"' ) ),
			),
		);
	}
}
