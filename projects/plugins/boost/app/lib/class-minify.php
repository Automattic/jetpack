<?php
/**
 * Implement the minify class.
 *
 * @link       https://automattic.com
 * @since      0.2
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use JShrink\Minifier as JSMinifier;
use tubalmartin\CssMin\Minifier as CSSMinifier;

/**
 * Class Minify
 */
class Minify {

	/**
	 * @var Minify - Holds the CssMin\Minifier instance, for reuse on subsequent calls.
	 */
	private static $css_minifier;

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
			$minified_js = JSMinifier::minify( $js );
		} catch ( \Exception $e ) {
			return $js;
		}

		return $minified_js;
	}

	/**
	 * Minifies the supplied CSS code, returning its minified form.
	 */
	public static function css( $css ) {
		if ( ! self::$css_minifier ) {
			self::$css_minifier = new CSSMinifier();
		}

		return self::$css_minifier->run( $css );
	}
}
