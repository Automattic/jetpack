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
use InvalidArgumentException;
use Mockery;
use PHPUnit\Framework\Constraint\Constraint;
use PHPUnit\Framework\TestCase;
use Wikimedia\TestingAccessWrapper;

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
		$plugin_dir = dirname( __DIR__, 4 ) . '/';
		Jetpack_Constants::set_constant( 'JETPACK__PLUGIN_FILE', $plugin_dir . 'jetpack.php' );

		Functions\stubs(
			array(
				'wp_parse_url'   => 'parse_url',
				'wp_json_encode' => 'json_encode',
				'esc_html'       => function ( $text ) {
					return htmlspecialchars( $text, ENT_QUOTES );
				},
				'esc_html__'     => function ( $text ) {
					return htmlspecialchars( $text, ENT_QUOTES );
				},
				'add_query_arg'  => function ( ...$args ) {
					$this->assertCount( 3, $args );
					list( $k, $v, $url ) = $args;
					$url .= ( strpos( $url, '?' ) === false ? '?' : '&' ) . "$k=$v";
					return $url;
				},
				'plugins_url'    => function ( $path, $plugin_path ) use ( $plugin_dir ) {
					$plugin_path = dirname( $plugin_path ) . '/';
					$this->assertStringStartsWith( $plugin_dir, $plugin_path );
					return 'http://www.example.com/wp-content/plugins/jetpack/' . substr( $plugin_path, strlen( $plugin_dir ) ) . $path;
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
		Jetpack_Constants::clear_constants();

		// Clear the instance.
		$wrap             = TestingAccessWrapper::newFromClass( Assets::class );
		$wrap->instance   = null;
		$wrap->domain_map = array();
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
		$package_path = dirname( __DIR__, 4 ) . '/packages/test-package/test-package.php';

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
	 * @param array{string,string,string,4?:array} $args Arguments for `register_script`.
	 * @param array                                $expect Map of function to expected arguments.
	 * @param array                                $extra Map of additional settings:
	 *   - is_script_debug: Value for `SCRIPT_DEBUG`.
	 *   - is_rtl: Value for `is_rtl()`.
	 *   - exception: Exception expected to be thrown.
	 */
	public function test_register_script( $args, $expect, $extra = array() ) {
		Functions\stubs(
			array(
				'__'          => function ( $v ) {
					return $v;
				},
				'filemtime'   => function ( $v ) {
					return crc32( basename( $v ) );
				},
				'wp_style_is' => function ( $handle, $list = 'enqueued' ) {
					return ( 'wp-components' === $handle && 'registered' === $list );
				},
			)
		);
		foreach ( $expect as $func => $with ) {
			Functions\expect( $func )
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
			// @phan-suppress-next-line PhanDeprecatedFunction -- Keep using setMethods until we drop PHP 7.0 support.
			$obj = $this->getMockBuilder( \stdClass::class )
				->setMethods( array( 'get_data' ) )
				->getMock();
			$obj->method( 'get_data' )->with( ...$extra['enqueue'][0] )->willReturn( $extra['enqueue'][1] );
			Functions\expect( 'wp_scripts' )->andReturn( $obj );
		}

		Assets::register_script( ...$args );
	}

	/**
	 * Data provider for `test_register_script`
	 *
	 * @return array{array{string,string,string,4?:array},array<string,array>,2?:array}[]
	 */
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
						2883865438,
						array(
							'in_footer' => false,
							'strategy'  => '',
						),
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
						'textdomain'   => 'foobaz',
					),
				),
				array(
					'wp_register_script'         => array(
						'single-file',
						"$url_base/single-js-file.js?minify=false",
						array( 'xyz' ),
						'foobar',
						array(
							'in_footer' => false,
							'strategy'  => '',
						),
					),
					'wp_set_script_translations' => array( 'single-file', 'foobaz' ),
					'wp_script_add_data'         => array( 'single-file', 'Jetpack::Assets::hascss', false ),
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
						array(
							'in_footer' => false,
							'strategy'  => '',
						),
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
						array(
							'in_footer' => true,
							'strategy'  => '',
						),
					),
					'wp_register_style'  => array( 'handle', "$url_base/js-and-css.css", array( 'asdf' ), 'foobaz', 'screen' ),
					'wp_script_add_data' => array( 'handle', 'Jetpack::Assets::hascss', true ),
				),
				array( 'is_rtl' => true ),
			),

			'Everything'                                => array(
				array(
					'handle',
					'test-assets-files/everything.js',
					__FILE__,
					array(
						'nonmin_path' => 'test-assets-files/everything.src.js',
						'textdomain'  => 'foobar',
					),
				),
				array(
					'wp_register_script'         => array(
						'handle',
						"$url_base/everything.js?minify=false",
						array( 'wp-polyfill', 'wp-components', 'wp-i18n' ),
						'ver-from-everything',
						array(
							'in_footer' => false,
							'strategy'  => '',
						),
					),
					'wp_set_script_translations' => array( 'handle', 'foobar' ),
					'wp_register_style'          => array( 'handle', "$url_base/everything.css?minify=false", array( 'wp-components' ), 'ver-from-everything', 'all' ),
					'wp_script_add_data'         => array( 'handle', 'Jetpack::Assets::hascss', true ),
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
						'textdomain'       => 'foobar',
					),
				),
				array(
					'wp_register_script'         => array(
						'handle',
						"$url_base/everything.src.js?minify=true",
						array( 'wp-polyfill', 'wp-components', 'wp-i18n', 'qwerty', 'uiop' ),
						'foobaz',
						array(
							'in_footer' => true,
							'strategy'  => '',
						),
					),
					'wp_set_script_translations' => array( 'handle', 'foobar' ),
					'wp_register_style'          => array( 'handle', "$url_base/everything.rtl.css?minify=true", array( 'wp-components', 'asdf' ), 'foobaz', 'screen' ),
					'wp_script_add_data'         => array( 'handle', 'Jetpack::Assets::hascss', true ),
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
						array(
							'in_footer' => false,
							'strategy'  => '',
						),
					),
					'wp_register_style'  => array( 'single-file', "$url_base/everything.rtl.css?minify=false", array(), 'ver-from-js-and-css', 'all' ),
					'wp_script_add_data' => array( 'single-file', 'Jetpack::Assets::hascss', true ),
				),
				array( 'is_rtl' => true ),
			),

			'Async'                                     => array(
				array( 'single-file', 'test-assets-files/single-js-file.js', __FILE__, array( 'async' => true ) ),
				array(
					'wp_register_script'   => array(
						'single-file',
						"$url_base/single-js-file.js?minify=false",
						array(),
						2883865438,
						array(
							'in_footer' => false,
							'strategy'  => 'defer',
						),
					),
					'wp_script_add_data'   => array( 'single-file', 'Jetpack::Assets::hascss', false ),
					'_deprecated_argument' => array( 'Automattic\Jetpack\Assets::register_script', Mockery::type( 'string' ), 'The `async` option is deprecated in favor of `strategy`' ),
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
						2883865438,
						array(
							'in_footer' => false,
							'strategy'  => '',
						),
					),
					'wp_script_add_data' => array( 'single-file', 'Jetpack::Assets::hascss', false ),
					'wp_enqueue_script'  => array( 'single-file' ),
				),
				array( 'enqueue' => array( array( 'single-file', 'Jetpack::Assets::hascss' ), false ) ),
			),
			'Enqueue, with CSS'                         => array(
				array(
					'everything',
					'test-assets-files/everything.js',
					__FILE__,
					array(
						'enqueue'    => true,
						'textdomain' => 'foobar',
					),
				),
				array(
					'wp_register_script'         => array(
						'everything',
						"$url_base/everything.js?minify=false",
						array( 'wp-polyfill', 'wp-components', 'wp-i18n' ),
						'ver-from-everything',
						array(
							'in_footer' => false,
							'strategy'  => '',
						),
					),
					'wp_set_script_translations' => array( 'everything', 'foobar' ),
					'wp_register_style'          => array( 'everything', "$url_base/everything.css?minify=false", array( 'wp-components' ), 'ver-from-everything', 'all' ),
					'wp_script_add_data'         => array( 'everything', 'Jetpack::Assets::hascss', true ),
					'wp_enqueue_script'          => array( 'everything' ),
					'wp_enqueue_style'           => array( 'everything' ),
				),
				array(
					'is_rtl'  => false,
					'enqueue' => array( array( 'everything', 'Jetpack::Assets::hascss' ), true ),
				),
			),

			'Bad path'                                  => array(
				array( 'single-file', 'test-assets-files/single-js-file.jsx', __FILE__ ),
				array(),
				array( 'exception' => new InvalidArgumentException( '$path must end in ".js"' ) ),
			),
			'Bad css_path'                              => array(
				array( 'single-file', 'test-assets-files/single-js-file.js', __FILE__, array( 'css_path' => 'foo.js' ) ),
				array(),
				array( 'exception' => new InvalidArgumentException( '$options[\'css_path\'] must end in ".css"' ) ),
			),
			'wp-i18n without textdomain'                => array(
				array( 'everything', 'test-assets-files/everything.js', __FILE__, array() ),
				array(
					'wp_register_script' => array(
						'everything',
						"$url_base/everything.js?minify=false",
						array( 'wp-polyfill', 'wp-components', 'wp-i18n' ),
						'ver-from-everything',
						array(
							'in_footer' => false,
							'strategy'  => '',
						),
					),
					'_doing_it_wrong'    => array( Assets::class . '::register_script', 'Script &quot;everything&quot; depends on wp-i18n but does not specify &quot;textdomain&quot;', '' ),
					'wp_register_style'  => array( 'everything', "$url_base/everything.css?minify=false", array( 'wp-components' ), 'ver-from-everything', 'all' ),
					'wp_script_add_data' => array( 'everything', 'Jetpack::Assets::hascss', true ),
				),
				array(
					'is_rtl' => false,
				),
			),
			'Strategy Defer'                            => array(
				array( 'single-file', 'test-assets-files/single-js-file.js', __FILE__, array( 'strategy' => 'defer' ) ),
				array(
					'wp_register_script' => array(
						'single-file',
						"$url_base/single-js-file.js?minify=false",
						array(),
						2883865438,
						array(
							'in_footer' => false,
							'strategy'  => 'defer',
						),
					),
					'wp_script_add_data' => array( 'single-file', 'Jetpack::Assets::hascss', false ),
				),
				array(),
			),
			'Strategy Async'                            => array(
				array( 'single-file', 'test-assets-files/single-js-file.js', __FILE__, array( 'strategy' => 'async' ) ),
				array(
					'wp_register_script' => array(
						'single-file',
						"$url_base/single-js-file.js?minify=false",
						array(),
						2883865438,
						array(
							'in_footer' => false,
							'strategy'  => 'async',
						),
					),
					'wp_script_add_data' => array( 'single-file', 'Jetpack::Assets::hascss', false ),
				),
				array(),
			),
		);
	}

	/**
	 * Test wp_default_scripts_hook.
	 *
	 * @dataProvider provide_wp_default_scripts_hook
	 * @param array  $expect_filter Expected filter.
	 * @param string $expect_js Expected JS.
	 * @param array  $options Options for the test.
	 */
	public function test_wp_default_scripts_hook( $expect_filter, $expect_js, $options = array() ) {
		$options += array(
			'constants'  => array(),
			'locale'     => 'en_US',
			'domain_map' => array(),
		);

		$constants = $options['constants'] + array(
			'ABSPATH'        => '/path/to/wordpress/',
			'WP_CONTENT_DIR' => '/path/to/wordpress/wp-content',
			'WP_LANG_DIR'    => '/path/to/wordpress/wp-content/languages',
		);
		foreach ( $constants as $k => $v ) {
			Jetpack_Constants::set_constant( $k, $v );
		}

		TestingAccessWrapper::newFromClass( Assets::class )->domain_map = $options['domain_map'];

		Functions\expect( 'determine_locale' )->andReturn( $options['locale'] );
		Functions\expect( 'site_url' )->andReturnUsing(
			function ( $v ) {
				return "http://example.com$v";
			}
		);
		Functions\expect( 'content_url' )->andReturnUsing(
			function ( $v ) {
				return "http://example.com/wp-content/$v";
			}
		);

		$obj = Filters\expectApplied( 'jetpack_i18n_state' )->once()->with( $expect_filter );
		// @phan-suppress-next-line PhanImpossibleTypeComparison -- Phan gets confused.
		if ( array_key_exists( 'filter', $options ) ) {
			$obj->andReturn( $options['filter'] );
		}

		// @phan-suppress-next-line PhanDeprecatedFunction -- Keep using setMethods until we drop PHP 7.0 support.
		$mock = $this->getMockBuilder( \stdClass::class )
			->setMethods( array( 'add', 'add_inline_script' ) )
			->getMock();

		// Unfortunately PHPUnit deprecated withConsecutive with no replacement, so we have to roll our own version.
		// https://github.com/sebastianbergmann/phpunit/issues/4026
		$with_consecutive = function ( ...$groups ) {
			$ct         = count( $groups[0] );
			$value_sets = array();
			foreach ( $groups as $group ) {
				for ( $i = 0; $i < $ct; $i++ ) {
					$value_sets[ $i ][] = $group[ $i ] instanceof Constraint ? $group[ $i ] : $this->equalTo( $group[ $i ] );
				}
			}
			$funcs = array();
			for ( $i = 0; $i < $ct; $i++ ) {
				$funcs[] = $this->callback(
					function ( $value ) use ( $value_sets, $i ) {
						static $set = null;
						$set        = $set ?? $value_sets[ $i ]; // @phan-suppress-current-line PhanTypePossiblyInvalidDimOffset -- False positive.
						$expect     = array_shift( $set );
						$expect->evaluate( $value );
						return true;
					}
				);
			}
			return $funcs;
		};

		$mock->expects( $this->exactly( 2 ) )->method( 'add' )
			->with(
				...$with_consecutive(
					array(
						'wp-jp-i18n-loader',
						$this->logicalOr(
							'http://www.example.com/wp-content/plugins/jetpack/packages/assets/build/i18n-loader.js?minify=true',
							'http://www.example.com/wp-content/plugins/jetpack/packages/assets/src/js/i18n-loader.js?minify=true'
						),
						array( 'wp-i18n' ),
					),
					array( 'wp-jp-i18n-state', false, array( 'wp-deprecated', 'wp-jp-i18n-loader' ) )
				)
			);
		$mock->expects( $this->exactly( 3 ) )->method( 'add_inline_script' )
			->with(
				...$with_consecutive(
					array( 'wp-jp-i18n-loader', $expect_js ),
					array( 'wp-jp-i18n-state', 'wp.deprecated( "wp-jp-i18n-state", { alternative: "wp-jp-i18n-loader" } );' ),
					array( 'wp-jp-i18n-state', 'wp.jpI18nState = wp.jpI18nLoader.state;' )
				)
			);

		// @phan-suppress-next-line PhanTypeMismatchArgument -- We don't have a WP_Scripts definition to create a mock from. 🤷
		Assets::wp_default_scripts_hook( $mock );
	}

	/** Data provider for test_wp_default_scripts_hook. */
	public function provide_wp_default_scripts_hook() {
		$expect_filter = array(
			'baseUrl'     => 'http://example.com/wp-content/languages/',
			'locale'      => 'en_US',
			'domainMap'   => array(),
			'domainPaths' => array(),
		);

		return array(
			'Basic test'                         => array(
				$expect_filter,
				'wp.jpI18nLoader.state = {"baseUrl":"http://example.com/wp-content/languages/","locale":"en_US","domainMap":{},"domainPaths":{}};',
			),
			'Basic test (2)'                     => array(
				array(
					'baseUrl'     => 'http://example.com/wp-includes/languages/',
					'locale'      => 'de_DE',
					'domainMap'   => array(
						'jetpack-foo' => 'plugins/jetpack',
						'jetpack-bar' => 'themes/sometheme',
						'core'        => 'default',
					),
					'domainPaths' => array(
						'jetpack-foo' => 'path/to/foo/',
					),
				),
				'wp.jpI18nLoader.state = {"baseUrl":"http://example.com/wp-includes/languages/","locale":"de_DE","domainMap":{"jetpack-foo":"plugins/jetpack","jetpack-bar":"themes/sometheme","core":"default"},"domainPaths":{"jetpack-foo":"path/to/foo/"}};',
				array(
					'constants'  => array( 'WP_LANG_DIR' => '/path/to/wordpress/wp-includes/languages' ),
					'locale'     => 'de_DE',
					'domain_map' => array(
						'jetpack-foo' => array( 'jetpack', 'plugins', '1.2.3', 'path/to/foo' ),
						'jetpack-bar' => array( 'sometheme', 'themes', '1.2.3', '' ),
						'core'        => array( 'default', 'core', '1.2.3', '' ),
					),
				),
			),
			'Bad WP_LANG_DIR'                    => array(
				array( 'baseUrl' => false ) + $expect_filter,
				'console.warn( "Failed to determine languages base URL. Is WP_LANG_DIR in the WordPress root?" );',
				array(
					'constants' => array( 'WP_LANG_DIR' => '/not/path/to/wordpress/wp-content/languages' ),
				),
			),
			'WP_LANG_DIR in wp-includes'         => array(
				array( 'baseUrl' => 'http://example.com/wp-includes/languages/' ) + $expect_filter,
				'wp.jpI18nLoader.state = {"baseUrl":"http://example.com/wp-includes/languages/","locale":"en_US","domainMap":{},"domainPaths":{}};',
				array(
					'constants' => array( 'WP_LANG_DIR' => '/path/to/wordpress/wp-includes/languages' ),
				),
			),
			'WP_CONTENT_DIR not in ABSPATH'      => array(
				array( 'baseUrl' => 'http://example.com/wp-content/languages/' ) + $expect_filter,
				'wp.jpI18nLoader.state = {"baseUrl":"http://example.com/wp-content/languages/","locale":"en_US","domainMap":{},"domainPaths":{}};',
				array(
					'constants' => array(
						'ABSPATH'        => '/srv/htdocs/__wp__/',
						'WP_CONTENT_DIR' => '/srv/htdocs/wp-content',
						'WP_LANG_DIR'    => '/srv/htdocs/wp-content/languages',
					),
				),
			),
			'Filter'                             => array(
				array( 'baseUrl' => false ) + $expect_filter,
				'wp.jpI18nLoader.state = {"baseUrl":"http://example.org/languages/","locale":"klingon","domainMap":{"foo":"plugins/bar"},"domainPaths":{"foo":"path/to/bar/"}};',
				array(
					'constants' => array( 'WP_LANG_DIR' => '/not/path/to/wordpress/wp-content/languages' ),
					'filter'    => array(
						'baseUrl'     => 'http://example.org/languages/',
						'locale'      => 'klingon',
						'domainMap'   => array( 'foo' => 'plugins/bar' ),
						'domainPaths' => array( 'foo' => 'path/to/bar/' ),
					),
				),
			),
			'Bad filter: not array'              => array(
				$expect_filter,
				'console.warn( "I18n state deleted by jetpack_i18n_state hook" );',
				array( 'filter' => null ),
			),
			'Bad filter: baseUrl is not set'     => array(
				$expect_filter,
				'console.warn( "I18n state deleted by jetpack_i18n_state hook" );',
				array(
					'filter' => array(
						'locale'      => 'en_US',
						'domainMap'   => array(),
						'domainPaths' => array(),
					),
				),
			),
			'Bad filter: locale is not set'      => array(
				$expect_filter,
				'console.warn( "I18n state deleted by jetpack_i18n_state hook" );',
				array(
					'filter' => array(
						'baseUrl'     => 'http://example.com/wp-content/languages/',
						'domainMap'   => array(),
						'domainPaths' => array(),
					),
				),
			),
			'Bad filter: locale is bad'          => array(
				$expect_filter,
				'console.warn( "I18n state deleted by jetpack_i18n_state hook" );',
				array(
					'filter' => array(
						'baseUrl'     => 'http://example.com/wp-content/languages/',
						'locale'      => false,
						'domainMap'   => array(),
						'domainPaths' => array(),
					),
				),
			),
			'Bad filter: domainMap is not set'   => array(
				$expect_filter,
				'console.warn( "I18n state deleted by jetpack_i18n_state hook" );',
				array(
					'filter' => array(
						'baseUrl'     => 'http://example.com/wp-content/languages/',
						'locale'      => 'en_US',
						'domainPaths' => array(),
					),
				),
			),
			'Bad filter: domainMap is bad'       => array(
				$expect_filter,
				'console.warn( "I18n state deleted by jetpack_i18n_state hook" );',
				array(
					'filter' => array(
						'baseUrl'     => 'http://example.com/wp-content/languages/',
						'locale'      => 'en_US',
						'domainMap'   => (object) array(),
						'domainPaths' => array(),
					),
				),
			),
			'Bad filter: domainPaths is not set' => array(
				$expect_filter,
				'console.warn( "I18n state deleted by jetpack_i18n_state hook" );',
				array(
					'filter' => array(
						'baseUrl'   => 'http://example.com/wp-content/languages/',
						'locale'    => 'en_US',
						'domainMap' => array(),
					),
				),
			),
			'Bad filter: domainPaths is bad'     => array(
				$expect_filter,
				'console.warn( "I18n state deleted by jetpack_i18n_state hook" );',
				array(
					'filter' => array(
						'baseUrl'     => 'http://example.com/wp-content/languages/',
						'locale'      => 'en_US',
						'domainMap'   => array(),
						'domainPaths' => (object) array(),
					),
				),
			),
		);
	}

	/** Test textdomain aliasing and hook adding. */
	public function test_alias_textdomain() {
		Filters\expectAdded( 'gettext_foo' )->once()->with( array( Assets::class, 'filter_gettext' ), 10, 3 );
		Filters\expectAdded( 'ngettext_foo' )->once()->with( array( Assets::class, 'filter_ngettext' ), 10, 5 );
		Filters\expectAdded( 'gettext_with_context_foo' )->once()->with( array( Assets::class, 'filter_gettext_with_context' ), 10, 4 );
		Filters\expectAdded( 'ngettext_with_context_foo' )->once()->with( array( Assets::class, 'filter_ngettext_with_context' ), 10, 6 );
		Filters\expectAdded( 'gettext_bar' )->once()->with( array( Assets::class, 'filter_gettext' ), 10, 3 );
		Filters\expectAdded( 'ngettext_bar' )->once()->with( array( Assets::class, 'filter_ngettext' ), 10, 5 );
		Filters\expectAdded( 'gettext_with_context_bar' )->once()->with( array( Assets::class, 'filter_gettext_with_context' ), 10, 4 );
		Filters\expectAdded( 'ngettext_with_context_bar' )->once()->with( array( Assets::class, 'filter_ngettext_with_context' ), 10, 6 );
		Filters\expectAdded( 'load_script_translation_file' )->once()->with( array( Assets::class, 'filter_load_script_translation_file' ), 10, 3 );

		Assets::alias_textdomain( 'foo', 'one', 'plugins', '1.2.3', 'path/to/foo/1.2.3' );
		Assets::alias_textdomain( 'foo', 'two', 'plugins', '1.2.4', 'path/to/foo/1.2.4' );
		Assets::alias_textdomain( 'bar', 'one', 'themes', '1.2.3', 'path/to/bar/1.2.3' );
		Assets::alias_textdomain( 'bar', 'two', 'themes', '1.2.2', 'path/to/bar/1.2.2' );

		$this->assertEquals(
			array(
				'foo' => array( 'two', 'plugins', '1.2.4', 'path/to/foo/1.2.4' ),
				'bar' => array( 'one', 'themes', '1.2.3', 'path/to/bar/1.2.3' ),
			),
			TestingAccessWrapper::newFromClass( Assets::class )->domain_map
		);
	}

	/** Test textdomain aliasing with bad type. */
	public function test_alias_textdomain__bad_type() {
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Type must be "plugins", "themes", or "core"' );
		Assets::alias_textdomain( 'foo', 'one', 'bogus', '1.2.5' );
	}

	/** Test alias_textdomains_from_file */
	public function test_alias_textdomains_from_file() {
		Assets::alias_textdomains_from_file( __DIR__ . '/test-assets-files/i18n-map.php' );
		$this->assertEquals(
			array(
				'foo' => array( 'target', 'plugins', '1.2.3', 'path/to/foo' ),
				'bar' => array( 'target', 'plugins', '4.5.6', '' ),
			),
			TestingAccessWrapper::newFromClass( Assets::class )->domain_map
		);
	}

	/** Test textdomain aliasing called after wp_default_scripts. */
	public function test_alias_textdomain__after_wp_default_scripts() {
		do_action( 'wp_default_scripts' );
		Functions\expect( '_doing_it_wrong' )->once()->with(
			Assets::class . '::alias_textdomain',
			'Textdomain aliases should be registered before the <code>wp_default_scripts</code> hook. This notice was triggered by the <code>foo</code> domain.',
			''
		);
		Assets::alias_textdomain( 'foo', 'one', 'plugins', '1.2.5' );
	}

	/** Test filter_gettext. */
	public function test_filter_gettext() {
		TestingAccessWrapper::newFromClass( Assets::class )->domain_map = array( 'olddomain' => array( 'newdomain', 'plugins', '1.2.3', '' ) );

		Functions\expect( '__' )->once()->with( 'foo', 'newdomain' )->andReturn( 'oo-fay' );
		Functions\expect( '__' )->never()->with( 'bar', 'newdomain' );

		$this->assertEquals( 'oo-fay', Assets::filter_gettext( 'foo', 'foo', 'olddomain' ) );
		$this->assertEquals( 'foo', Assets::filter_gettext( 'foo', 'bar', 'olddomain' ) );
		$this->assertEquals( 'bar', Assets::filter_gettext( 'bar', 'foo', 'olddomain' ) );
	}

	/** Test filter_ngettext. */
	public function test_filter_ngettext() {
		TestingAccessWrapper::newFromClass( Assets::class )->domain_map = array( 'olddomain' => array( 'newdomain', 'plugins', '1.2.3', '' ) );

		Functions\expect( '_n' )->once()->with( 'foo', 'foos', 10, 'newdomain' )->andReturn( 'oos-fay' );
		Functions\expect( '_n' )->never()->with( 'bar', 'bars', 42, 'newdomain' );

		$this->assertEquals( 'oos-fay', Assets::filter_ngettext( 'foo', 'foo', 'foos', 10, 'olddomain' ) );
		$this->assertEquals( 'foo', Assets::filter_ngettext( 'foo', 'bar', 'bars', 10, 'olddomain' ) );
		$this->assertEquals( 'bar', Assets::filter_ngettext( 'bar', 'foo', 'foos', 10, 'olddomain' ) );
	}

	/** Test filter_gettext_with_context. */
	public function test_filter_gettext_with_context() {
		TestingAccessWrapper::newFromClass( Assets::class )->domain_map = array( 'olddomain' => array( 'newdomain', 'plugins', '1.2.3', '' ) );

		Functions\expect( '_x' )->once()->with( 'foo', 'context', 'newdomain' )->andReturn( 'oo-fay' );
		Functions\expect( '_x' )->never()->with( 'bar', 'context', 'newdomain' );

		$this->assertEquals( 'oo-fay', Assets::filter_gettext_with_context( 'foo', 'foo', 'context', 'olddomain' ) );
		$this->assertEquals( 'foo', Assets::filter_gettext_with_context( 'foo', 'bar', 'context', 'olddomain' ) );
		$this->assertEquals( 'bar', Assets::filter_gettext_with_context( 'bar', 'foo', 'context', 'olddomain' ) );
	}

	/** Test filter_ngettext_with_context. */
	public function test_filter_ngettext_with_context() {
		TestingAccessWrapper::newFromClass( Assets::class )->domain_map = array( 'olddomain' => array( 'newdomain', 'plugins', '1.2.3', '' ) );

		Functions\expect( '_nx' )->once()->with( 'foo', 'foos', 10, 'context', 'newdomain' )->andReturn( 'oos-fay' );
		Functions\expect( '_nx' )->never()->with( 'bar', 'bars', 42, 'context', 'newdomain' );

		$this->assertEquals( 'oos-fay', Assets::filter_ngettext_with_context( 'foo', 'foo', 'foos', 10, 'context', 'olddomain' ) );
		$this->assertEquals( 'foo', Assets::filter_ngettext_with_context( 'foo', 'bar', 'bars', 10, 'context', 'olddomain' ) );
		$this->assertEquals( 'bar', Assets::filter_ngettext_with_context( 'bar', 'foo', 'foos', 10, 'context', 'olddomain' ) );
	}

	/**
	 * Test filter_load_script_translation_file.
	 *
	 * @dataProvider provide_filter_load_script_translation_file
	 * @param array{false|string,string,string} $args Arguments to the filter.
	 * @param array                             $is_readable Expected files passed to `is_readable()` and the corresponding return values.
	 * @param string|false                      $expect Expected return value.
	 */
	public function test_filter_load_script_translation_file( $args, $is_readable, $expect ) {
		Jetpack_Constants::set_constant( 'WP_LANG_DIR', '/path/to/wordpress/wp-content/languages' );
		TestingAccessWrapper::newFromClass( Assets::class )->domain_map = array(
			'one'   => array( 'new1', 'plugins', '1.2.3', 'path/to/one' ),
			'two'   => array( 'new2', 'themes', '1.2.3', '' ),
			'three' => array( 'new3', 'core', '1.2.3', '' ),
		);
		Functions\when( 'is_readable' )->alias(
			function ( $file ) use ( $is_readable ) {
				if ( isset( $is_readable[ $file ] ) ) {
					return $is_readable[ $file ];
				}
				throw new InvalidArgumentException( "Unexpected call to is_readable( $file )" );
			}
		);

		$this->assertSame( $expect, Assets::filter_load_script_translation_file( ...$args ) );
	}

	/**
	 * Data provider for test_filter_load_script_translation_file.
	 *
	 * @return array{array{false|string,string,string},array<string,bool>,string|false}[]
	 */
	public function provide_filter_load_script_translation_file() {
		return array(
			'Passed false'                 => array(
				array( false, 'handle', 'one' ),
				array(),
				false,
			),
			'Unmapped domain'              => array(
				array( '/path/to/wherever/one-en_piglatin-abcdefhash.json', 'handle', 'four' ),
				array(),
				'/path/to/wherever/one-en_piglatin-abcdefhash.json',
			),
			'Requested file exists'        => array(
				array( '/path/to/wherever/one-en_piglatin-abcdefhash.json', 'handle', 'one' ),
				array( '/path/to/wherever/one-en_piglatin-abcdefhash.json' => true ),
				'/path/to/wherever/one-en_piglatin-abcdefhash.json',
			),
			'Mapped file exists'           => array(
				array( '/path/to/wherever/one-en_piglatin-abcdefhash.json', 'handle', 'one' ),
				array(
					'/path/to/wherever/one-en_piglatin-abcdefhash.json' => false,
					'/path/to/wordpress/wp-content/languages/plugins/new1-en_piglatin-abcdefhash.json' => true,
				),
				'/path/to/wordpress/wp-content/languages/plugins/new1-en_piglatin-abcdefhash.json',
			),
			'Mapped file is missing'       => array(
				array( '/path/to/wherever/two-en_piglatin-abcdefhash.json', 'handle', 'two' ),
				array(
					'/path/to/wherever/two-en_piglatin-abcdefhash.json' => false,
					'/path/to/wordpress/wp-content/languages/themes/new2-en_piglatin-abcdefhash.json' => false,
				),
				'/path/to/wherever/two-en_piglatin-abcdefhash.json',
			),
			'Mapped to core'               => array(
				array( '/path/to/wherever/three-en_piglatin-abcdefhash.json', 'handle', 'three' ),
				array(
					'/path/to/wherever/three-en_piglatin-abcdefhash.json' => false,
					'/path/to/wordpress/wp-content/languages/new3-en_piglatin-abcdefhash.json' => true,
				),
				'/path/to/wordpress/wp-content/languages/new3-en_piglatin-abcdefhash.json',
			),
			'Domain not in requested file' => array(
				array( '/path/to/wherever/something-en_piglatin-abcdefhash.json', 'handle', 'two' ),
				array(
					'/path/to/wherever/something-en_piglatin-abcdefhash.json' => false,
				),
				'/path/to/wherever/something-en_piglatin-abcdefhash.json',
			),
		);
	}
}
