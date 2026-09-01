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
 * "broken". This generalizes to any object-literal `}` followed by `/` anywhere
 * in a source file (`f({}/2)`, `[{}/2]`, `var o={a:1}/2`), and because one
 * occurrence skips re-minification of that whole file's contribution to the
 * bundle, the cost is more than a single statement's worth of compression. It is
 * still fail-safe
 * (it only skips re-minification, never corrupts output), so the heuristic stays
 * simple rather than guess at block-vs-expression context; the new fallback
 * observability hook lets the real-world frequency be measured.
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
	 * Upper bound (in bytes) on output we will fully scan per call.
	 *
	 * The scan only runs on a cache miss, but on hosts where the concatenation
	 * cache is not writable the _jb_static path re-minifies (and would re-scan)
	 * on every request, so the per-call cost must stay bounded. This is set high
	 * enough to cover realistic modern bundles (Tailwind/SPA/plugin-heavy output
	 * routinely runs a few MB) so the truncation signature is actually caught,
	 * rather than silently bypassed for anything above an aggressive cap.
	 *
	 * For the rare bundle larger than this, the full lexer scan is skipped, but a
	 * cheap gross-truncation backstop still runs when the original input is known
	 * (see looks_broken()).
	 */
	private const MAX_SCAN_BYTES = 8388608; // 8 MB.

	/**
	 * Above MAX_SCAN_BYTES we cannot afford the full scan, but a minified output
	 * that is dramatically smaller than its input is the truncation signature by
	 * itself. Real-world minification shrinks JS by ~20-40%; an output below this
	 * fraction of the original is treated as truncated. The threshold is
	 * deliberately conservative so it only trips on gross truncation, never on
	 * ordinary (even aggressive) minification.
	 *
	 * Blind spot: a size-preserving break above the cap (e.g. an unterminated
	 * template at EOF, which drops only a byte or two) leaves the ratio normal and
	 * is not caught -- and because no fallback fires, the observability hook does not
	 * surface it either. Accepted because minification runs per source file, so the
	 * cap only engages for a pathological multi-MB single source file, a vanishingly
	 * rare input for this corruption.
	 */
	private const TRUNCATION_RATIO = 0.5;

	/**
	 * Upper bound on simultaneous open brackets / template-interpolation frames.
	 *
	 * $stack and $frames grow with structural nesting depth, which is bounded by
	 * input bytes but not proportional to them: a small file of runaway `${`/`[`/`(`
	 * openers can amplify into hundreds of MB of frame state and trip the PHP memory
	 * limit. That fatal is NOT a \Throwable, so Minify::js()'s try/catch cannot catch
	 * it -- it would white-screen the page, the exact failure this scanner exists to
	 * prevent. Nesting this deep never occurs in legitimate output (real code nests a
	 * few levels), so reaching the cap is itself a corruption/abuse signature: the
	 * scan stops and returns "broken", routing the caller to the fail-safe original
	 * bytes.
	 *
	 * Kept to a few thousand rather than higher: the check runs after each push, so
	 * the cap also bounds peak frame state, and each interp frame is a small array.
	 * A higher cap (e.g. 100k) lets ~150 KB of runaway `${` openers build ~22 MB of
	 * state before tripping -- enough to OOM-fatal a low-memory shared host (Boost's
	 * core audience) before the cap engages, reintroducing the white-screen. At a few
	 * thousand the peak stays well under 1 MB while still sitting orders of magnitude
	 * above any real nesting.
	 */
	private const MAX_NESTING_DEPTH = 2000;

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
	 * Coordinates with $frames: an `interp` frame snapshots count($stack) at
	 * push time, and closes_interpolation() uses that snapshot to tell a '}'
	 * that ends `${ ... }` apart from one that closes an ordinary block.
	 *
	 * @var string[]
	 */
	private $stack = array();

	/**
	 * Template / interpolation frames.
	 *
	 * Each frame is one of:
	 *   - array( 'type' => 'template' ): inside the body of a `...` literal.
	 *   - array( 'type' => 'interp', 'depth' => int ): inside `${ ... }`; the
	 *     'depth' field captures count($stack) at the moment the frame was
	 *     pushed, so closes_interpolation() can pair this '}' with the matching
	 *     '${' rather than a sibling code block. See scan_template() and
	 *     closes_interpolation().
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
	 * @since 4.6.0
	 *
	 * @param string      $js          Minified JS to inspect.
	 * @param string|null $original_js The pre-minification input, when available. Used
	 *                                 only for the gross-truncation backstop on inputs
	 *                                 too large to scan in full (see MAX_SCAN_BYTES).
	 *
	 * @return bool True if it looks broken; false if it looks intact.
	 */
	public static function looks_broken( $js, $original_js = null ) {
		$js = (string) $js;

		// Empty output is handled by the caller.
		if ( '' === $js ) {
			return false;
		}

		// Output larger than the scan budget is not lexed in full. Fall back to a
		// cheap size-delta check against the original: a minified output far smaller
		// than its input is the truncation signature even without a full scan. With
		// no original to compare against, assume intact.
		$len = strlen( $js );
		if ( $len > self::MAX_SCAN_BYTES ) {
			if ( null === $original_js ) {
				return false;
			}
			$original_len = strlen( (string) $original_js );
			return $original_len > 0 && $len < ( $original_len * self::TRUNCATION_RATIO );
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
				case self::ST_BLOCK_COMMENT:
					$broken = $this->scan_block_comment();
					break;
				default:
					return true; // Unknown state: fail safe.
			}
			if ( $broken ) {
				return true;
			}

			// Structural nesting this deep never occurs in legitimate output; stop
			// before unbounded $stack/$frames growth can exhaust memory (an
			// uncatchable fatal). The depth itself is a corruption signature, so the
			// fail-safe verdict is "broken".
			if ( count( $this->stack ) > self::MAX_NESTING_DEPTH
				|| count( $this->frames ) > self::MAX_NESTING_DEPTH ) {
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
	 * @return bool True to short-circuit as broken (unterminated string).
	 */
	private function scan_string() {
		$c = $this->js[ $this->pos ];
		if ( '\\' === $c ) {
			// Escape sequence, including a line continuation (`\` then a line
			// terminator). A CRLF continuation is three bytes (`\` + CR + LF), so
			// consume the trailing LF too -- otherwise it is left at the new position
			// and trips the raw-newline check below, falsely flagging a valid
			// continuation as broken. A lone CR or LF after `\` is the normal 2-byte
			// skip.
			if ( "\r" === $this->peek() && "\n" === $this->peek( 2 ) ) {
				$this->pos += 3;
			} else {
				$this->pos += 2;
			}
			return false;
		}
		// A raw LF/CR inside a string literal is a syntax error (a real newline must
		// be escaped or a line continuation), so it never appears in valid minified
		// output -- only in truncated/corrupted output where the closing quote was
		// lost and a later quote happened to re-open the state. Checking ASCII LF/CR
		// is zero-false-positive and keeps the byte-oriented lexer simple.
		if ( "\n" === $c || "\r" === $c ) {
			return true; // Unterminated string literal.
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
			// Unlike a string (where `\<LF>` is a valid line continuation), a line
			// terminator cannot be escaped inside a regex literal -- a backslash
			// immediately before a raw LF/CR is the truncation signature. Check the
			// escaped byte before skipping over the pair.
			$escaped = $this->peek();
			if ( "\n" === $escaped || "\r" === $escaped ) {
				return true; // Unterminated regex literal.
			}
			$this->pos += 2;
			return false;
		}
		// A raw line terminator (LF or CR) is invalid anywhere in a regex literal,
		// including inside a [...] character class, so this check sits above the
		// re_class branch.
		if ( "\n" === $c || "\r" === $c ) {
			return true; // Unterminated regex literal.
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
		++$this->pos;
		return false;
	}

	/**
	 * Scan one step while inside a // line comment.
	 *
	 * @return bool
	 */
	private function scan_line_comment() {
		// CR, LF, and CRLF all end a line comment in JS; a bare CR must close it too,
		// otherwise code after a CR-only line ending is swallowed and broken input
		// can read as intact. (CRLF closes on the CR; the trailing LF is then a
		// no-op space in code state.)
		$c = $this->js[ $this->pos ];
		if ( "\n" === $c || "\r" === $c ) {
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
				'throw'      => 1,
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
