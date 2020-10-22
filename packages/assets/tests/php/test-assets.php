<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Assets methods
 *
 * @package automattic/jetpack-assets
 */

namespace Automattic\Jetpack;

/**
 * Assets test suite.
 */
class AssetsTest extends \WorDBless\BaseTestCase {

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

		$this->assertContains( $expected, $file_url );
		$this->assertNotContains( $not_expected, $file_url );
	}

	/**
	 * Tests ability for a filter to map specific URLs.
	 *
	 * @author kraftbj
	 * @see p58i-8nS-p2
	 */
	public function test_get_file_url_for_environment_with_filter() {
		add_filter(
			'jetpack_get_file_for_environment',
			function() {
				return 'special-test.js';
			}
		);

		$file_url = Assets::get_file_url_for_environment( 'test.min.js', 'test.js' );

		$this->assertContains( 'special-test.js', $file_url );
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
		$package_path = '/var/html/wp-content/plugins/jetpack/packages/test-package/test-package.php';

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
	 * Test that enqueue_async_script calls adds the script_loader_tag filter
	 */
	public function test_enqueue_async_script_adds_script_loader_tag_filter() {
		Assets::enqueue_async_script( 'handle', 'minpath.js', 'path.js', array(), '123', true );
		$asset_instance = Assets::instance();
		self::assertEquals( 10, has_filter( 'script_loader_tag', array( $asset_instance, 'script_add_async' ) ) );
	}

	/**
	 * Test that enqueue_async_script calls wp_enqueue_script
	 */
	public function test_enqueue_async_script_calls_wp_enqueue_script() {
		Assets::enqueue_async_script( 'test-handle', '/minpath.js', '/path.js', array(), '123', true );

		$this->assertTrue( wp_script_is( 'test-handle', 'enqueued' ) );

		$enqueued_script = wp_scripts()->query( 'test-handle', 'registered' );

		$this->assertEquals( Assets::get_file_url_for_environment( '/minpath.js', '/path.js' ), $enqueued_script->src );
		$this->assertEquals( '123', $enqueued_script->ver );

	}
}
