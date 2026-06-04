<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Minify;

use Automattic\Jetpack_Boost\Tests\Base_TestCase;

/**
 * Class Functions_Helpers_Test
 *
 * @package Automattic\Jetpack_Boost\Tests\Lib\Minify
 */
class Functions_Helpers_Test extends Base_TestCase {

	protected function set_up() {
		parent::set_up();
		require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/functions-helpers.php';
	}

	/**
	 * The already-minified check is the load-bearing skip that keeps the serving
	 * path from re-minifying (and corrupting) assets shipped as `.min.js` /
	 * `.min.css`. Locked in so a regex change can't silently re-enable
	 * re-minification of already-minified bundles.
	 */
	public function test_detects_already_minified_paths() {
		$already_minified = array(
			'/wp-content/plugins/jetpack-boost/app/modules/image-guide/dist/guide.min.js',
			'/var/www/wp-content/uploads/cache/abc123.min.js',
			'/some/path/styles.min.css',
			'guide.min.js',
			'styles.min.css',
		);

		foreach ( $already_minified as $path ) {
			$this->assertTrue(
				jetpack_boost_page_optimize_is_already_minified( $path ),
				"Expected already-minified: $path"
			);
		}
	}

	public function test_non_minified_paths_pass_through() {
		$not_minified = array(
			'/wp-content/plugins/foo/script.js',
			'/wp-content/themes/bar/style.css',
			// ".min" must be immediately followed by the extension.
			'/path/to/app.min.js.bak',
			'/path/to/jquery.minified.js',
			'/path/to/file.minjs',
			'/path/to/file.mincss',
			// ".min" alone (no real extension) is not a minified asset.
			'/path/to/foo.min',
			'',
		);

		foreach ( $not_minified as $path ) {
			$this->assertFalse(
				jetpack_boost_page_optimize_is_already_minified( $path ),
				"Expected not already-minified: $path"
			);
		}
	}
}
