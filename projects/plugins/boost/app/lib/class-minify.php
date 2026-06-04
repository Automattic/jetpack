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
	 * Scanner states for is_js_structurally_broken().
	 */
	private const ST_CODE          = 0;
	private const ST_SQ            = 1; // Inside a '...' string.
	private const ST_DQ            = 2; // Inside a "..." string.
	private const ST_TEMPLATE      = 3; // Inside a `...` template literal.
	private const ST_REGEX         = 4; // Inside a /.../ regex literal.
	private const ST_LINE_COMMENT  = 5; // Inside a // comment.
	private const ST_BLOCK_COMMENT = 6; // Inside a /* */ comment.

	/**
	 * Upper bound (in bytes) on output we will structurally scan per call.
	 *
	 * The scan only runs on a cache miss, but on hosts where the concatenation
	 * cache is not writable the _jb_static path re-minifies (and would re-scan)
	 * on every request, so the per-call cost must stay bounded. Truncation makes
	 * the output smaller, so a very large output is unlikely to be the truncated
	 * case; above this size we trust the minifier rather than pay the scan.
	 */
	private const MAX_SCAN_BYTES = 2097152; // 2 MB.

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
		// See HOG-534 / HOG-535.
		if ( '' === (string) $minified_js && '' !== (string) $js ) {
			return $js;
		}
		if ( self::is_js_structurally_broken( (string) $minified_js ) ) {
			return $js;
		}

		return $minified_js;
	}

	/**
	 * Heuristically determine whether a chunk of JavaScript is structurally broken.
	 *
	 * This is NOT a full JS validator (PHP has none built in). It is a single
	 * left-to-right lexer pass that answers one narrow question: "did this end
	 * cleanly?" It tracks string/template/regex/comment state so that brackets
	 * inside those are ignored, counts bracket nesting in code, and reports the
	 * output as broken when, at EOF, a string/template/regex/block-comment is
	 * still open or brackets are unbalanced. That is exactly the signature of the
	 * truncation corruption the bundled minifier produces.
	 *
	 * It deliberately fails safe: genuine ambiguity (and anything it cannot scan)
	 * resolves toward "intact" only when that is the cheaper-to-be-wrong choice; a
	 * needless "broken" verdict merely skips re-minification for that group.
	 *
	 * Known blind spots (return false / "intact" even though wrong): corruption
	 * that stays perfectly balanced, e.g. semantic-only damage that still parses.
	 * Those do not crash the page and are not what this guard targets.
	 *
	 * @param string $js Minified JS to inspect.
	 *
	 * @return bool True if the JS looks structurally broken/truncated.
	 */
	public static function is_js_structurally_broken( $js ) {
		$n = strlen( $js );
		if ( 0 === $n ) {
			return false;
		}
		if ( $n > self::MAX_SCAN_BYTES ) {
			// Too large to scan within a per-request budget; assume intact.
			return false;
		}

		$state     = self::ST_CODE;
		$stack     = array(); // Stack of currently open brackets.
		$frames    = array(); // Template / interpolation frames.
		$unmatched = false;   // Saw an extra or mismatched closing bracket.
		$re_class  = false;   // Inside a regex [...] character class.

		$prev      = '';      // Last significant char seen in code state.
		$prev_prev = '';      // Significant char before $prev.
		$prev_word = '';      // Last identifier/keyword seen in code state.
		$prev_dot  = false;   // Was the last identifier a member access (after '.')?

		$i = 0;
		while ( $i < $n ) {
			$c = $js[ $i ];

			switch ( $state ) {
				case self::ST_CODE:
					// `true`/`false` shortened to !0/!1 before a member access
					// (e.g. true.toString() -> !0.toString()) is invalid: `0.` is
					// a numeric literal, so the following identifier is a syntax
					// error. This stays bracket-balanced, so check it explicitly.
					if ( '!' === $c
						&& $i + 3 < $n
						&& ( '0' === $js[ $i + 1 ] || '1' === $js[ $i + 1 ] )
						&& '.' === $js[ $i + 2 ]
						&& self::is_ident_start( $js[ $i + 3 ] ) ) {
						return true;
					}

					if ( '/' === $c ) {
						$next = ( $i + 1 < $n ) ? $js[ $i + 1 ] : '';
						if ( '/' === $next ) {
							$state = self::ST_LINE_COMMENT;
							$i    += 2;
							break;
						}
						if ( '*' === $next ) {
							$state = self::ST_BLOCK_COMMENT;
							$i    += 2;
							break;
						}
						if ( self::regex_allowed_after( $prev, $prev_prev, $prev_word, $prev_dot ) ) {
							$state    = self::ST_REGEX;
							$re_class = false;
						}
						$prev_prev = $prev;
						$prev      = '/';
						$prev_word = '';
						$prev_dot  = false;
						++$i;
						break;
					}

					if ( "'" === $c ) {
						$state = self::ST_SQ;
						++$i;
						break;
					}
					if ( '"' === $c ) {
						$state = self::ST_DQ;
						++$i;
						break;
					}
					if ( '`' === $c ) {
						$frames[] = array( 'type' => 'template' );
						$state    = self::ST_TEMPLATE;
						++$i;
						break;
					}

					if ( '{' === $c || '(' === $c || '[' === $c ) {
						$stack[]   = $c;
						$prev_prev = $prev;
						$prev      = $c;
						$prev_word = '';
						$prev_dot  = false;
						++$i;
						break;
					}

					if ( '}' === $c || ')' === $c || ']' === $c ) {
						// A '}' may close a template interpolation (${ ... }) rather
						// than a code block. The interpolation pushed its own '{' on
						// the bracket stack and recorded the depth before it, so this
						// '}' closes the interpolation when that '{' is the stack top.
						if ( '}' === $c && ! empty( $frames ) ) {
							$top = end( $frames );
							if ( 'interp' === $top['type'] && ( $top['depth'] + 1 ) === count( $stack ) ) {
								array_pop( $frames );
								array_pop( $stack ); // The '{' from ${.
								$state     = self::ST_TEMPLATE;
								$prev_prev = $prev;
								$prev      = '`';
								$prev_word = '';
								$prev_dot  = false;
								++$i;
								break;
							}
						}

						$expected = ( '}' === $c ) ? '{' : ( ( ')' === $c ) ? '(' : '[' );
						if ( empty( $stack ) || end( $stack ) !== $expected ) {
							$unmatched = true;
						} else {
							array_pop( $stack );
						}
						$prev_prev = $prev;
						$prev      = $c;
						$prev_word = '';
						$prev_dot  = false;
						++$i;
						break;
					}

					if ( ' ' === $c || "\t" === $c || "\n" === $c || "\r" === $c || "\f" === $c || "\v" === $c ) {
						++$i;
						break;
					}

					if ( self::is_ident_char( $c ) ) {
						$j = $i;
						$w = '';
						while ( $j < $n && self::is_ident_char( $js[ $j ] ) ) {
							$w .= $js[ $j ];
							++$j;
						}
						$prev_dot  = ( '.' === $prev );
						$prev_prev = $prev;
						$prev      = $js[ $j - 1 ];
						$prev_word = $w;
						$i         = $j;
						break;
					}

					// Any other significant char (operators like + - * . etc.).
					$prev_prev = $prev;
					$prev      = $c;
					$prev_word = '';
					$prev_dot  = false;
					++$i;
					break;

				case self::ST_SQ:
					if ( '\\' === $c ) {
						$i += 2;
						break;
					}
					if ( "'" === $c ) {
						$state     = self::ST_CODE;
						$prev_prev = $prev;
						$prev      = "'";
						$prev_word = '';
						$prev_dot  = false;
					}
					++$i;
					break;

				case self::ST_DQ:
					if ( '\\' === $c ) {
						$i += 2;
						break;
					}
					if ( '"' === $c ) {
						$state     = self::ST_CODE;
						$prev_prev = $prev;
						$prev      = '"';
						$prev_word = '';
						$prev_dot  = false;
					}
					++$i;
					break;

				case self::ST_TEMPLATE:
					if ( '\\' === $c ) {
						$i += 2;
						break;
					}
					if ( '`' === $c ) {
						if ( ! empty( $frames ) ) {
							$top = end( $frames );
							if ( 'template' === $top['type'] ) {
								array_pop( $frames );
							}
						}
						$state     = self::ST_CODE;
						$prev_prev = $prev;
						$prev      = '`';
						$prev_word = '';
						$prev_dot  = false;
						++$i;
						break;
					}
					if ( '$' === $c && $i + 1 < $n && '{' === $js[ $i + 1 ] ) {
						$frames[]  = array(
							'type'  => 'interp',
							'depth' => count( $stack ),
						);
						$stack[]   = '{'; // The '{' from ${.
						$state     = self::ST_CODE;
						$prev_prev = $prev;
						$prev      = '{';
						$prev_word = '';
						$prev_dot  = false;
						$i        += 2;
						break;
					}
					++$i;
					break;

				case self::ST_REGEX:
					if ( '\\' === $c ) {
						$i += 2;
						break;
					}
					if ( $re_class ) {
						if ( ']' === $c ) {
							$re_class = false;
						}
						++$i;
						break;
					}
					if ( '[' === $c ) {
						$re_class = true;
						++$i;
						break;
					}
					if ( '/' === $c ) {
						$state     = self::ST_CODE;
						$prev_prev = $prev;
						$prev      = '/';
						$prev_word = '';
						$prev_dot  = false;
						++$i;
						// Skip regex flags.
						while ( $i < $n && ctype_alpha( $js[ $i ] ) ) {
							++$i;
						}
						break;
					}
					if ( "\n" === $c ) {
						return true; // Unterminated regex literal.
					}
					++$i;
					break;

				case self::ST_LINE_COMMENT:
					if ( "\n" === $c ) {
						$state = self::ST_CODE;
					}
					++$i;
					break;

				case self::ST_BLOCK_COMMENT:
					if ( '*' === $c && $i + 1 < $n && '/' === $js[ $i + 1 ] ) {
						$state = self::ST_CODE;
						$i    += 2;
						break;
					}
					++$i;
					break;
			}
		}

		// A line comment running to EOF is valid (e.g. a trailing
		// `//# sourceMappingURL=...` with no final newline). Every other open
		// state at EOF is a genuinely unterminated construct.
		if ( self::ST_LINE_COMMENT === $state ) {
			$state = self::ST_CODE;
		}

		if ( self::ST_CODE !== $state ) {
			return true; // Unterminated string/template/regex/block-comment.
		}
		if ( ! empty( $stack ) ) {
			return true; // Unbalanced brackets.
		}
		if ( ! empty( $frames ) ) {
			return true; // Unterminated template/interpolation.
		}
		if ( $unmatched ) {
			return true; // Saw an extra/mismatched closing bracket.
		}

		return false;
	}

	/**
	 * Whether a `/` following the given context begins a regex literal (vs division).
	 *
	 * JavaScript cannot decide this locally; lexers approximate it from the
	 * previous significant token: after a value (identifier, number, `)`, `]`,
	 * postfix ++/--) `/` is division; after an operator/keyword that expects an
	 * operand next, `/` begins a regex.
	 *
	 * @param string $prev      Last significant char in code state.
	 * @param string $prev_prev Significant char before $prev.
	 * @param string $prev_word Last identifier/keyword seen.
	 * @param bool   $prev_dot  Whether $prev_word was a member access (after '.').
	 *
	 * @return bool True if a regex literal is allowed here.
	 */
	private static function regex_allowed_after( $prev, $prev_prev, $prev_word, $prev_dot ) {
		if ( '' === $prev ) {
			return true; // Start of input.
		}

		// Postfix ++ / -- yields a value, so a following `/` is division.
		if ( ( '+' === $prev && '+' === $prev_prev ) || ( '-' === $prev && '-' === $prev_prev ) ) {
			return false;
		}

		// Punctuation/operators after which a regex literal is legal. Includes the
		// arithmetic/comparison binary operators so real minified expressions like
		// `x+"|"+/\d{1,2}/.source` (regex after a binary +) are not misread.
		static $puncts = array(
			'(' => 1,
			',' => 1,
			'=' => 1,
			':' => 1,
			'[' => 1,
			'!' => 1,
			'&' => 1,
			'|' => 1,
			'?' => 1,
			'{' => 1,
			';' => 1,
			'}' => 1,
			'+' => 1,
			'-' => 1,
			'*' => 1,
			'%' => 1,
			'<' => 1,
			'>' => 1,
			'~' => 1,
			'^' => 1,
		);
		if ( isset( $puncts[ $prev ] ) ) {
			return true;
		}

		// After a word: only the keywords below allow a regex, and only when the
		// word is not a property access (e.g. `a.return/b` is division).
		if ( self::is_ident_char( $prev ) ) {
			static $kw = array(
				'return'     => 1,
				'typeof'     => 1,
				'in'         => 1,
				'of'         => 1,
				'new'        => 1,
				'do'         => 1,
				'else'       => 1,
				'void'       => 1,
				'delete'     => 1,
				'instanceof' => 1,
				'case'       => 1,
				'yield'      => 1,
				'await'      => 1,
			);
			if ( ! $prev_dot && '' !== $prev_word && isset( $kw[ $prev_word ] ) ) {
				return true;
			}
			return false; // Identifier or number -> division.
		}

		// Closing bracket ) ], a '.', etc. -> division.
		return false;
	}

	/**
	 * Whether $c can appear within a JS identifier.
	 *
	 * @param string $c Single character.
	 * @return bool
	 */
	private static function is_ident_char( $c ) {
		return ctype_alnum( $c ) || '_' === $c || '$' === $c;
	}

	/**
	 * Whether $c can start a JS identifier.
	 *
	 * @param string $c Single character.
	 * @return bool
	 */
	private static function is_ident_start( $c ) {
		return ctype_alpha( $c ) || '_' === $c || '$' === $c;
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
