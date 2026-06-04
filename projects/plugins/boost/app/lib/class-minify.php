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
	 * Reasons passed to the jetpack_boost_js_minify_fallback action. Kept as
	 * constants so the contract is machine-checkable rather than a prose-only enum;
	 * the string values are the public wire format hook consumers compare against.
	 */
	private const FALLBACK_EXCEPTION    = 'exception';
	private const FALLBACK_ERROR        = 'error';
	private const FALLBACK_EMPTY_OUTPUT = 'empty_output';
	private const FALLBACK_LOOKS_BROKEN = 'looks_broken';

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
			// \Error subclasses (\OutOfMemoryError, \TypeError, \ParseError) signal
			// server pressure or a genuine bug rather than unsupported syntax. We
			// still fall back -- a performance optimization must never white-screen
			// the page -- but report a distinct reason so the condition is
			// distinguishable from ordinary unsupported syntax via the hook.
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
		// Pass the original input so the scanner can apply its gross-truncation
		// backstop to bundles too large to scan in full. See Js_Structure_Scanner.
		if ( Js_Structure_Scanner::looks_broken( $minified_js, $js ) ) {
			return self::fallback_js( $js, self::FALLBACK_LOOKS_BROKEN );
		}

		return $minified_js;
	}

	/**
	 * Serve the original (un-re-minified) JS when minification is declined, and
	 * surface the reason so the safety net is observable in production.
	 *
	 * Without this, on a host where the concatenation cache is not writable the
	 * fallback can fire on every request for a given bundle indefinitely with
	 * nothing in any log to explain why a bundle is larger or slower than expected.
	 *
	 * @param string          $js     The original JS that will be served.
	 * @param string          $reason One of 'exception', 'error', 'empty_output', 'looks_broken'.
	 * @param \Throwable|null $error  The throwable, when the fallback was triggered by one.
	 *
	 * @return string The original JS, unchanged.
	 */
	private static function fallback_js( $js, $reason, $error = null ) {
		// js() has no type hint, so a caller can pass a non-string (the \Error-arm
		// test does exactly that); measure length defensively rather than assume.
		$bytes = is_string( $js ) ? strlen( $js ) : 0;

		try {
			/**
			 * Fires when Minify::js() declines its minified output and serves the
			 * original JS instead. Lets operators and logging plugins measure how
			 * often the safety net fires and for which reason. This is the always-on
			 * observability surface; the error_log below is only a debug aid.
			 *
			 * @since $$next-version$$
			 *
			 * @param string          $reason Why the fallback fired: 'exception', 'error', 'empty_output', or 'looks_broken'.
			 * @param int             $bytes  Length of the original JS being served, in bytes.
			 * @param \Throwable|null $error  The throwable when triggered by one, otherwise null.
			 */
			do_action( 'jetpack_boost_js_minify_fallback', $reason, $bytes, $error );
		} catch ( \Throwable $hook_error ) {
			// A misbehaving hook callback must never turn a handled fallback into a
			// fatal error -- degrading gracefully to the original bundle is the whole
			// point of this method. Surface the hook failure only under WP_DEBUG.
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( 'Jetpack Boost: jetpack_boost_js_minify_fallback hook threw: ' . $hook_error->getMessage() );
			}
		}

		// The hook above is the production observability surface. The error_log is a
		// debug aid only: gating it behind WP_DEBUG keeps a recurring fallback (which
		// on a no-writable-cache host can fire every request) from flooding the log.
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
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
