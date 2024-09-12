<?php
/**
 * Implement the minify class.
 *
 * @link       https://automattic.com
 * @since      0.2
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use MatthiasMullie\Minify\JS as JSMinifier;
use tubalmartin\CssMin\Minifier as CSSMinifier;

/**
 * Class Minify
 */
class Minify {

	/**
	 * @var CSSMinifier - Holds the CssMin\Minifier instance, for reuse on subsequent calls.
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
		try {
			$minifier    = new JSMinifier( $js );
			$minified_js = $minifier->minify();
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
