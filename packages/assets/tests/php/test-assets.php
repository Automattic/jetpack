<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Assets methods
 *
 * @package automattic/jetpack-assets
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;
use Automattic\Jetpack\Constants as Jetpack_Constants;
use Brain\Monkey;
use Brain\Monkey\Filters;

/**
 * Retrieves a URL within the plugins or mu-plugins directory.
 *
 * @param string $path        Extra path appended to the end of the URL, including the relative directory if $plugin is supplied.
 * @param string $plugin_path A full path to a file inside a plugin or mu-plugin.
 *                            The URL will be relative to its directory.
 *                            Typically this is done by passing __FILE__ as the argument.
 */
function plugins_url( $path, $plugin_path ) {
	return $plugin_path . $path;
}

/**
 * Enqueue a script.
 *
 * Registers the script if $src provided (does NOT overwrite), and enqueues it.
 *
 * @param string           $handle    Name of the script. Should be unique.
 * @param string           $src       Full URL of the script, or path of the script relative to the WordPress root directory.
 *                                    Default empty.
 * @param string[]         $deps      Optional. An array of registered script handles this script depends on. Default empty array.
 * @param string|bool|null $ver       Optional. String specifying script version number, if it has one, which is added to the URL
 *                                    as a query string for cache busting purposes. If version is set to false, a version
 *                                    number is automatically added equal to current installed WordPress version.
 *                                    If set to null, no version is added.
 * @param bool             $in_footer Optional. Whether to enqueue the script before </body> instead of in the <head>.
 *                                    Default 'false'.
 */
function wp_enqueue_script( $handle, $src = '', $deps = array(), $ver = false, $in_footer = false ) {
	$GLOBALS['_was_called_wp_enqueue_script'][] = array( $handle, $src, $deps, $ver, $in_footer );
}

/**
 * A wrapper for PHP's parse_url()
 *
 * @param string $url       The URL to parse.
 * @param int    $component The specific component to retrieve. Use one of the PHP
 *                          predefined constants to specify which one.
 *                          Defaults to -1 (= return all parts as an array).
 */
function wp_parse_url( $url, $component = -1 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	return parse_url( $url ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
}

/**
 * Assets test suite.
 */
class AssetsTest extends TestCase {

	/**
	 * Test setup.
	 */
	public function setUp() {
		Monkey\setUp();
		$plugin_file = dirname( dirname( dirname( dirname( __DIR__ ) ) ) ) . '/jetpack.php';
		Jetpack_Constants::set_constant( 'JETPACK__PLUGIN_FILE', $plugin_file );

	}

	/**
	 * Run after every test.
	 */
	public function tearDown() {
		Monkey\tearDown();
		$GLOBALS['_was_called_wp_enqueue_script'] = array();
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
		$this->assertContains( $$expected, $file_url );
		$this->assertNotContains( $$not_expected, $file_url );
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
	 * Tests ability for a filter to map specific URLs.
	 *
	 * @author kraftbj
	 * @see p58i-8nS-p2
	 */
	public function test_get_file_url_for_environment_with_filter() {
		Filters\expectApplied( 'jetpack_get_file_for_environment' )->once()->andReturn( 'special-test.js' );

		$file_url = Assets::get_file_url_for_environment( 'test.min.js', 'test.js' );

		$this->assertContains( 'special-test.js', $file_url );
	}

	/**
	 * Possible values for test_get_file_url_for_environment.
	 */
	public function get_file_url_for_environment_data_provider() {
		return array(
			'script-debug-true'  => array(
				'_inc/build/shortcodes/js/instagram.js',
				'modules/shortcodes/js/instagram.js',
				true,
				'non_min_path',
				'min_path',
			),
			'script-debug-false' => array(
				'_inc/build/shortcodes/js/instagram.js',
				'modules/shortcodes/js/instagram.js',
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
	 * Test that enqueue_async_script calls adds the script_loader_tag filter
	 */
	public function test_enqueue_async_script_adds_script_loader_tag_filter() {
		Assets::enqueue_async_script( 'handle', 'minpath.js', 'path.js', array(), '123', true );
		$asset_instance = Assets::instance();
		self::assertTrue( has_filter( 'script_loader_tag', array( $asset_instance, 'script_add_async' ) ) );
	}

	/**
	 * Test that enqueue_async_script calls wp_enqueue_script
	 */
	public function test_enqueue_async_script_calls_wp_enqueue_script() {
		Assets::enqueue_async_script( 'handle', '/minpath.js', '/path.js', array(), '123', true );
		$this->assertEquals(
			$GLOBALS['_was_called_wp_enqueue_script'],
			array( array( 'handle', Assets::get_file_url_for_environment( '/minpath.js', '/path.js' ), array(), '123', true ) )
		);
	}
}
