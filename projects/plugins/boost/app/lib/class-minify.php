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
	 * Reasons passed to the jetpack_boost_js_minify_fallback action. Public so hook
	 * consumers can compare against Minify::FALLBACK_* instead of bare strings; the
	 * string values are the stable wire format and must not change.
	 *
	 * @since 4.6.0
	 */
	public const FALLBACK_EXCEPTION    = 'exception';
	public const FALLBACK_ERROR        = 'error';
	public const FALLBACK_SCAN_ERROR   = 'scan_error';
	public const FALLBACK_EMPTY_OUTPUT = 'empty_output';
	public const FALLBACK_LOOKS_BROKEN = 'looks_broken';

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
			// Ordinary failure (e.g. a PCRE backtrack-limit hit on a huge bundle):
			// serve the original input rather than nothing.
			return self::fallback_js( $js, self::FALLBACK_EXCEPTION, $e );
		} catch ( \Error $e ) {
			// \Error subclasses (e.g. \TypeError, \ParseError) signal a genuine bug
			// rather than unsupported syntax. We still fall back -- a performance
			// optimization must never white-screen the page -- but report a distinct
			// reason so the condition is distinguishable from ordinary unsupported
			// syntax via the hook. (A true memory-limit fatal is not a \Throwable and
			// cannot be caught here at all; the scanner instead bounds its own nesting
			// depth so it never provokes one -- see Js_Structure_Scanner.)
			return self::fallback_js( $js, self::FALLBACK_ERROR, $e );
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
			return self::fallback_js( $js, self::FALLBACK_EMPTY_OUTPUT );
		}

		// The structural scan runs outside the minifier try/catch above, so guard it
		// too: any \Throwable from the scan itself must degrade to the original rather
		// than white-screen the page. It reports the distinct 'scan_error' reason so a
		// scanner fault is never conflated with a minifier-level 'error' in the hook's
		// (released, immutable) reason contract. (Memory exhaustion is a fatal, not a
		// \Throwable, so it cannot be caught -- the scanner instead bounds its own
		// nesting depth to avoid provoking one.) Pass the original input so the scanner
		// can apply its gross-truncation backstop to bundles too large to scan in full.
		// See Js_Structure_Scanner.
		try {
			$looks_broken = Js_Structure_Scanner::looks_broken( $minified_js, $js );
		} catch ( \Throwable $e ) {
			return self::fallback_js( $js, self::FALLBACK_SCAN_ERROR, $e );
		}
		if ( $looks_broken ) {
			return self::fallback_js( $js, self::FALLBACK_LOOKS_BROKEN );
		}

		return $minified_js;
	}

	/**
	 * Serve the original (un-re-minified) JS when minification is declined, and
	 * surface the reason so the safety net is observable in production.
	 *
	 * Observability policy: the jetpack_boost_js_minify_fallback action is the
	 * always-on surface and fires on every fallback (including the abnormal
	 * 'error' arm), so monitoring should hook it. The error_log calls are a debug
	 * aid only and are gated behind WP_DEBUG: a recurring fallback on a
	 * no-writable-cache host can fire every request, and unconditional logging
	 * would flood the log without telling an operator anything the hook cannot.
	 *
	 * @param string          $js     The original JS that will be served.
	 * @param string          $reason One of the FALLBACK_* constants.
	 * @param \Throwable|null $error  The throwable, when the fallback was triggered by one.
	 *
	 * @return string The original JS, unchanged.
	 */
	private static function fallback_js( $js, $reason, $error = null ) {
		// js() has no type hint, so a caller can pass a non-string (the \Error-arm
		// test does exactly that); measure length defensively rather than assume.
		$bytes    = is_string( $js ) ? strlen( $js ) : 0;
		$is_debug = defined( 'WP_DEBUG' ) && WP_DEBUG;

		try {
			/**
			 * Fires when Minify::js() declines its minified output and serves the
			 * original JS instead. This is the always-on observability surface for
			 * the minify safety net: it fires on every fallback, including the
			 * abnormal 'error' / 'scan_error' arms (e.g. \TypeError / \ParseError),
			 * so register a callback here to monitor how often -- and why -- it
			 * engages. Callbacks must not throw; a throwing callback is swallowed so
			 * it cannot break minification.
			 *
			 * @since 4.6.0
			 *
			 * @param string          $reason Why the fallback fired: one of the Minify::FALLBACK_* values ('exception', 'error', 'scan_error', 'empty_output', 'looks_broken'). 'error' is a \Throwable raised by the minifier itself; 'scan_error' is a \Throwable raised by the structural scanner -- both carry it in $error.
			 * @param int             $bytes  Length of the original JS being served, in bytes.
			 * @param \Throwable|null $error  The throwable when triggered by one, otherwise null. Its message may embed an internal filesystem path (e.g. an IOException), so consumers should not surface it unsanitized.
			 */
			do_action( 'jetpack_boost_js_minify_fallback', $reason, $bytes, $error );
		} catch ( \Throwable $hook_error ) {
			// A misbehaving hook callback must never turn a handled fallback into a
			// fatal error -- degrading gracefully to the original bundle is the whole
			// point of this method. Surface the hook failure only under WP_DEBUG.
			if ( $is_debug ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( 'Jetpack Boost: jetpack_boost_js_minify_fallback hook threw: ' . $hook_error->getMessage() );
			}
		}

		if ( $is_debug ) {
			$detail = $error instanceof \Throwable
				? sprintf( ' (%s: %s)', get_class( $error ), $error->getMessage() )
				: '';
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( sprintf( 'Jetpack Boost: Minify::js() fell back to original JS [reason=%s, bytes=%d]%s', $reason, $bytes, $detail ) );
		}

		return $js;
	}

	/**
	 * Minifies the supplied CSS code, returning its minified form.
	 */
	public static function css( $css ) {
		try {
			$minifier     = new CSSMinifier( $css );
			$minified_css = $minifier->minify();
		} catch ( \Throwable $e ) {
			// Unlike js(), CSS uses a single \Throwable catch: there is no structural
			// validator for CSS output, and CSS minification has not shown the
			// silent-corruption failure mode that motivated splitting js()'s catch.
			return $css;
		}

		return $minified_css;
	}
}
