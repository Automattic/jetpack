<?php
/**
 * Implement the minify class.
 *
 * @link       https://automattic.com
 * @since      0.2
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use JShrink\Minifier;

/**
 * Class Minify
 */
class Minify {

	/**
	 * Strips whitespace from JavaScript scripts.
	 *
	 * @param string $js Input JS string.
	 *
	 * @return string String with whitespace stripped.
	 */
	public static function js( $js ) {
		require_once JETPACK_BOOST_DIR_PATH . '/vendor/tedivm/jshrink/src/JShrink/Minifier.php';

		try {
			$minified_js = Minifier::minify( $js );
		} catch ( \Exception $e ) {
			return $js;
		}

		return $minified_js;
	}
}
