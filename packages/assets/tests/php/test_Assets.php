<?php

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;
use Automattic\Jetpack\Constants as Jetpack_Constants;
use Brain\Monkey;
use Brain\Monkey\Filters;

function plugins_url( $path, $plugin_path ) {
	return $plugin_path . $path;
}

class AssetsTest extends TestCase {
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
	}

	/**
	 * @author ebinnion goldsounds
	 * @dataProvider get_file_url_for_environment_data_provider
	 */
	function test_get_file_url_for_environment( $min_path, $non_min_path, $is_script_debug, $expected, $not_expected ) {
		Constants::set_constant( 'SCRIPT_DEBUG', $is_script_debug );
		$file_url = Assets::get_file_url_for_environment( $min_path, $non_min_path );

		// note the double-$$ here, $(non_)min_path is referenced by var name
		$this->assertContains( $$expected, $file_url );
		$this->assertNotContains( $$not_expected, $file_url );
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

	function get_file_url_for_environment_data_provider() {
		return array(
			'script-debug-true' => array(
				'_inc/build/shortcodes/js/instagram.js',
				'modules/shortcodes/js/instagram.js',
				true,
				'non_min_path',
				'min_path'
			),
			'script-debug-false' => array(
				'_inc/build/shortcodes/js/instagram.js',
				'modules/shortcodes/js/instagram.js',
				false,
				'min_path',
				'non_min_path'
			),
		);
	}
}
