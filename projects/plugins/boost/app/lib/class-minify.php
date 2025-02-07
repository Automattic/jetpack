<?php
/**
 * Implement the minify class.
 *
 * @link       https://automattic.com
 * @since      0.2
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use MatthiasMullie\Minify\CSS as CSSMinifier;
use MatthiasMullie\Minify\JS as JSMinifier;

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
		try {
			$minifier     = new CSSMinifier( $css );
			$minified_css = $minifier->minify();
		} catch ( \Exception $e ) {
			return $css;
		}

		return $minified_css;
	}
}
