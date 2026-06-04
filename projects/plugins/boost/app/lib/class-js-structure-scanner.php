<?php
/**
 * Heuristic structural validator for minified JavaScript.
 *
 * @link       https://automattic.com
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Answers one narrow question: does a chunk of minified JS look structurally
 * broken/truncated? It is NOT a full JS validator (PHP has none built in) -- it
 * is a single left-to-right lexer pass that tracks string/template/regex/comment
 * state so brackets inside those are ignored, counts bracket nesting in code, and
 * reports "broken" when, at EOF, a string/template/regex/block-comment is still
 * open or brackets are unbalanced. That is exactly the signature of the truncation
 * corruption the bundled MatthiasMullie minifier produces on modern JS.
 *
 * It deliberately fails safe: a "broken" verdict only causes the caller to skip
 * re-minification for that bundle, so ambiguity is cheap to get wrong.
 *
 * Known blind spot: corruption that stays perfectly balanced (e.g. semantic-only
 * damage that still parses) returns "intact". Those do not crash the page and are
 * not what this guard targets.
 *
 * Known (harmless) false positives: a `/` after `}` is read as a regex, not
 * division, because telling a block `}` apart from an object-literal `}` needs a
 * full parser; so valid object-literal division such as `({}/2)` is reported
 * "broken". Because the verdict is fail-safe (it only skips re-minification),
 * these cost a little compression, never correctness, so the heuristic stays
 * simple rather than guess at block-vs-expression context.
 */
class Js_Structure_Scanner {

	/**
	 * Lexer states.
	 */
	private const ST_CODE          = 0;
	private const ST_STRING        = 1; // Inside a '...' or "..." string.
	private const ST_TEMPLATE      = 2; // Inside a `...` template literal.
	private const ST_REGEX         = 3; // Inside a /.../ regex literal.
	private const ST_LINE_COMMENT  = 4; // Inside a // comment.
	private const ST_BLOCK_COMMENT = 5; // Inside a /* */ comment.

	/**
	 * Upper bound (in bytes) on output we will scan per call.
	 *
	 * The scan only runs on a cache miss, but on hosts where the concatenation
	 * cache is not writable the _jb_static path re-minifies (and would re-scan)
	 * on every request, so the per-call cost must stay bounded. Truncation makes
	 * the output smaller, so a very large output is unlikely to be the truncated
	 * case; above this size we trust the minifier rather than pay the scan.
	 */
	private const MAX_SCAN_BYTES = 2097152; // 2 MB.

	/**
	 * JS being scanned and its length.
	 *
	 * @var string
	 */
	private $js;

	/**
	 * @var int
	 */
	private $len;

	/**
	 * Current scan offset.
	 *
	 * @var int
	 */
	private $pos = 0;

	/**
	 * Current lexer state (one of the ST_* constants).
	 *
	 * @var int
	 */
	private $state = self::ST_CODE;

	/**
	 * The quote character that opened the current string ('  or ").
	 *
	 * @var string
	 */
	private $string_quote = '';

	/**
	 * Stack of currently open brackets ('{', '(', '[').
	 *
	 * @var string[]
	 */
	private $stack = array();

	/**
	 * Template / interpolation frames.
	 *
	 * @var array[]
	 */
	private $frames = array();

	/**
	 * True once an extra or mismatched closing bracket has been seen.
	 *
	 * @var bool
	 */
	private $unmatched = false;

	/**
	 * True while inside a regex [...] character class.
	 *
	 * @var bool
	 */
	private $re_class = false;

	/**
	 * Last significant char seen in code state.
	 *
	 * @var string
	 */
	private $prev = '';

	/**
	 * The significant char before $prev.
	 *
	 * @var string
	 */
	private $prev_prev = '';

	/**
	 * Last identifier/keyword seen in code state.
	 *
	 * @var string
	 */
	private $prev_word = '';

	/**
	 * Whether $prev_word was a member access (immediately after a '.').
	 *
	 * @var bool
	 */
	private $prev_dot = false;

	/**
	 * Whether the given minified JS looks structurally broken/truncated.
	 *
	 * @param string $js Minified JS to inspect.
	 *
	 * @return bool True if it looks broken; false if it looks intact.
	 */
	public static function looks_broken( $js ) {
		$js = (string) $js;

		// Empty output is handled by the caller; oversized output is assumed
		// intact (see MAX_SCAN_BYTES).
		if ( '' === $js || strlen( $js ) > self::MAX_SCAN_BYTES ) {
			return false;
		}

		return ( new self( $js ) )->run();
	}

	/**
	 * @param string $js Minified JS to inspect.
	 */
	private function __construct( $js ) {
		$this->js  = $js;
		$this->len = strlen( $js );
	}

	/**
	 * Run the scan and return the verdict.
	 *
	 * @return bool
	 */
	private function run() {
		while ( $this->pos < $this->len ) {
			switch ( $this->state ) {
				case self::ST_CODE:
					$broken = $this->scan_code();
					break;
				case self::ST_STRING:
					$broken = $this->scan_string();
					break;
				case self::ST_TEMPLATE:
					$broken = $this->scan_template();
					break;
				case self::ST_REGEX:
					$broken = $this->scan_regex();
					break;
				case self::ST_LINE_COMMENT:
					$broken = $this->scan_line_comment();
					break;
				default: // Block comment.
					$broken = $this->scan_block_comment();
					break;
			}
			if ( $broken ) {
				return true;
			}
		}

		return $this->is_broken_at_eof();
	}

	/**
	 * Scan one step while in code state.
	 *
	 * @return bool True to short-circuit as broken.
	 */
	private function scan_code() {
		$c = $this->js[ $this->pos ];

		// `true`/`false` shortened to !0/!1 before a member access (e.g.
		// true.toString() -> !0.toString()) is invalid: `0.` is a numeric literal,
		// so the following identifier is a syntax error. This stays bracket-balanced,
		// so check it explicitly. Excludes the exponent case: `0.e5` / `0.e+5` is a
		// valid numeric literal, so `!0.e5` is valid and must not be flagged.
		if ( '!' === $c
			&& ( '0' === $this->peek( 1 ) || '1' === $this->peek( 1 ) )
			&& '.' === $this->peek( 2 )
			&& self::is_ident_start( $this->peek( 3 ) )
			&& ! $this->is_exponent_at( 3 ) ) {
			return true;
		}

		if ( '/' === $c ) {
			$next = $this->peek();
			if ( '/' === $next ) {
				$this->state = self::ST_LINE_COMMENT;
				$this->pos  += 2;
				return false;
			}
			if ( '*' === $next ) {
				$this->state = self::ST_BLOCK_COMMENT;
				$this->pos  += 2;
				return false;
			}
			if ( $this->regex_allowed_here() ) {
				$this->state    = self::ST_REGEX;
				$this->re_class = false;
			}
			$this->record_prev( '/' );
			++$this->pos;
			return false;
		}

		if ( "'" === $c || '"' === $c ) {
			$this->state        = self::ST_STRING;
			$this->string_quote = $c;
			++$this->pos;
			return false;
		}

		if ( '`' === $c ) {
			$this->frames[] = array( 'type' => 'template' );
			$this->state    = self::ST_TEMPLATE;
			++$this->pos;
			return false;
		}

		if ( '{' === $c || '(' === $c || '[' === $c ) {
			$this->stack[] = $c;
			$this->record_prev( $c );
			++$this->pos;
			return false;
		}

		if ( '}' === $c || ')' === $c || ']' === $c ) {
			// A '}' may close a template interpolation (${ ... }) rather than a
			// code block: the interpolation pushed its own '{' on the stack, so this
			// '}' closes the interpolation when that '{' is the current stack top.
			if ( '}' === $c && $this->closes_interpolation() ) {
				array_pop( $this->frames );
				array_pop( $this->stack ); // The '{' from ${.
				$this->state = self::ST_TEMPLATE;
				$this->record_prev( '`' );
				++$this->pos;
				return false;
			}

			$expected = ( '}' === $c ) ? '{' : ( ( ')' === $c ) ? '(' : '[' );
			if ( empty( $this->stack ) || end( $this->stack ) !== $expected ) {
				$this->unmatched = true;
			} else {
				array_pop( $this->stack );
			}
			$this->record_prev( $c );
			++$this->pos;
			return false;
		}

		if ( ctype_space( $c ) ) {
			++$this->pos;
			return false;
		}

		if ( self::is_ident_char( $c ) ) {
			$start = $this->pos;
			while ( $this->pos < $this->len && self::is_ident_char( $this->js[ $this->pos ] ) ) {
				++$this->pos;
			}
			$this->prev_dot  = ( '.' === $this->prev );
			$this->prev_prev = $this->prev;
			$this->prev      = $this->js[ $this->pos - 1 ];
			$this->prev_word = substr( $this->js, $start, $this->pos - $start );
			return false;
		}

		// Any other significant char (operators like + - * . etc.).
		$this->record_prev( $c );
		++$this->pos;
		return false;
	}

	/**
	 * Scan one step while inside a '...' or "..." string.
	 *
	 * @return bool
	 */
	private function scan_string() {
		$c = $this->js[ $this->pos ];
		if ( '\\' === $c ) {
			$this->pos += 2;
			return false;
		}
		if ( $c === $this->string_quote ) {
			$this->return_to_code( $c );
		}
		++$this->pos;
		return false;
	}

	/**
	 * Scan one step while inside a `...` template literal.
	 *
	 * @return bool
	 */
	private function scan_template() {
		$c = $this->js[ $this->pos ];
		if ( '\\' === $c ) {
			$this->pos += 2;
			return false;
		}
		if ( '`' === $c ) {
			$top = end( $this->frames );
			if ( $top && 'template' === $top['type'] ) {
				array_pop( $this->frames );
			}
			$this->return_to_code( '`' );
			++$this->pos;
			return false;
		}
		if ( '$' === $c && '{' === $this->peek() ) {
			$this->frames[] = array(
				'type'  => 'interp',
				'depth' => count( $this->stack ),
			);
			$this->stack[]  = '{'; // The '{' from ${.
			$this->return_to_code( '{' );
			$this->pos += 2;
			return false;
		}
		++$this->pos;
		return false;
	}

	/**
	 * Scan one step while inside a /.../ regex literal.
	 *
	 * @return bool True to short-circuit as broken (unterminated regex).
	 */
	private function scan_regex() {
		$c = $this->js[ $this->pos ];
		if ( '\\' === $c ) {
			$this->pos += 2;
			return false;
		}
		if ( $this->re_class ) {
			if ( ']' === $c ) {
				$this->re_class = false;
			}
			++$this->pos;
			return false;
		}
		if ( '[' === $c ) {
			$this->re_class = true;
			++$this->pos;
			return false;
		}
		if ( '/' === $c ) {
			$this->return_to_code( '/' );
			++$this->pos;
			while ( $this->pos < $this->len && ctype_alpha( $this->js[ $this->pos ] ) ) {
				++$this->pos; // Skip regex flags.
			}
			return false;
		}
		if ( "\n" === $c ) {
			return true; // Unterminated regex literal.
		}
		++$this->pos;
		return false;
	}

	/**
	 * Scan one step while inside a // line comment.
	 *
	 * @return bool
	 */
	private function scan_line_comment() {
		if ( "\n" === $this->js[ $this->pos ] ) {
			$this->state = self::ST_CODE;
		}
		++$this->pos;
		return false;
	}

	/**
	 * Scan one step while inside a block comment.
	 *
	 * @return bool
	 */
	private function scan_block_comment() {
		if ( '*' === $this->js[ $this->pos ] && '/' === $this->peek() ) {
			$this->state = self::ST_CODE;
			$this->pos  += 2;
			return false;
		}
		++$this->pos;
		return false;
	}

	/**
	 * Verdict once the whole input has been consumed.
	 *
	 * @return bool
	 */
	private function is_broken_at_eof() {
		// A line comment running to EOF is valid (e.g. a trailing
		// `//# sourceMappingURL=...` with no final newline). Every other open state
		// at EOF is a genuinely unterminated construct.
		if ( self::ST_LINE_COMMENT === $this->state ) {
			$this->state = self::ST_CODE;
		}

		if ( self::ST_CODE !== $this->state ) {
			return true; // Unterminated string/template/regex/block-comment.
		}
		if ( ! empty( $this->stack ) ) {
			return true; // Unbalanced brackets.
		}
		if ( ! empty( $this->frames ) ) {
			return true; // Unterminated template/interpolation.
		}

		return $this->unmatched; // Saw an extra/mismatched closing bracket.
	}

	/**
	 * Whether the current '}' closes a template interpolation rather than a block.
	 *
	 * @return bool
	 */
	private function closes_interpolation() {
		$top = end( $this->frames );
		return $top && 'interp' === $top['type'] && ( $top['depth'] + 1 ) === count( $this->stack );
	}

	/**
	 * Whether a `/` at the current position begins a regex literal (vs division).
	 *
	 * JavaScript cannot decide this locally; lexers approximate it from the
	 * previous significant token: after a value (identifier, number, `)`, `]`,
	 * postfix ++/--) `/` is division; after an operator/keyword that expects an
	 * operand next, `/` begins a regex.
	 *
	 * @return bool
	 */
	private function regex_allowed_here() {
		$prev = $this->prev;

		if ( '' === $prev ) {
			return true; // Start of input.
		}

		// Postfix ++ / -- yields a value, so a following `/` is division.
		if ( ( '+' === $prev && '+' === $this->prev_prev ) || ( '-' === $prev && '-' === $this->prev_prev ) ) {
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
			return ! $this->prev_dot && '' !== $this->prev_word && isset( $kw[ $this->prev_word ] );
		}

		// Closing bracket ) ], a '.', etc. -> division.
		return false;
	}

	/**
	 * Record the most recent significant token (without changing state).
	 *
	 * @param string $char The token char.
	 */
	private function record_prev( $char ) {
		$this->prev_prev = $this->prev;
		$this->prev      = $char;
		$this->prev_word = '';
		$this->prev_dot  = false;
	}

	/**
	 * Return to code state, recording $char as the most recent token.
	 *
	 * @param string $char The token char (the closing delimiter / interpolation brace).
	 */
	private function return_to_code( $char ) {
		$this->state = self::ST_CODE;
		$this->record_prev( $char );
	}

	/**
	 * Look ahead from the current position.
	 *
	 * @param int $offset How far ahead to peek (default the next char).
	 *
	 * @return string The char, or '' if out of range.
	 */
	private function peek( $offset = 1 ) {
		$i = $this->pos + $offset;
		return ( $i < $this->len ) ? $this->js[ $i ] : '';
	}

	/**
	 * Whether $c can appear within a JS identifier.
	 *
	 * @param string $c Single character.
	 * @return bool
	 */
	private static function is_ident_char( $c ) {
		return '' !== $c && ( ctype_alnum( $c ) || '_' === $c || '$' === $c );
	}

	/**
	 * Whether $c can start a JS identifier.
	 *
	 * @param string $c Single character.
	 * @return bool
	 */
	private static function is_ident_start( $c ) {
		return '' !== $c && ( ctype_alpha( $c ) || '_' === $c || '$' === $c );
	}

	/**
	 * Whether the chars at $offset begin a valid exponent part (the `e5` of the
	 * numeric literal `0.e5`). Lets the !0/!1 member-access check tell a real,
	 * broken member access (`!0.toString()`) apart from a valid exponent
	 * literal (`!0.e5`), which is not a member access at all.
	 *
	 * @param int $offset Offset from the current position.
	 * @return bool
	 */
	private function is_exponent_at( $offset ) {
		$c = $this->peek( $offset );
		if ( 'e' !== $c && 'E' !== $c ) {
			return false;
		}
		$next = $this->peek( $offset + 1 );
		if ( '+' === $next || '-' === $next ) {
			$next = $this->peek( $offset + 2 );
		}
		return '' !== $next && ctype_digit( $next );
	}
}
