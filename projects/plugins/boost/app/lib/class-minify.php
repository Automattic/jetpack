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
		} catch ( \Throwable $e ) {
			return $js;
		}

		// The bundled MatthiasMullie minifier is regex-based and ES5-era: it can
		// SILENTLY corrupt modern JS without throwing. The classic case is a `//`
		// inside a (nested) template literal being eaten as a line comment to
		// end-of-line, which drops the closing backtick and everything after it,
		// truncating the bundle -> "Unexpected end of input" in the browser. The
		// try/catch above never fires for this because nothing is thrown.
		//
		// As a safety net, structurally validate the output: if it looks broken,
		// fall back to the original (still concatenated, just not re-minified)
		// bytes. A slightly larger working bundle beats a smaller broken one.
		if ( '' === (string) $minified_js && '' !== (string) $js ) {
			return $js;
		}
		if ( Js_Structure_Scanner::looks_broken( $minified_js ) ) {
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
		} catch ( \Throwable $e ) {
			return $css;
		}

		return $minified_css;
	}
}
