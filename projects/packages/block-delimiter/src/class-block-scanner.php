<?php
/**
 * Efficiently scan through block structure in document without parsing
 * the entire block tree and all of its JSON attributes into memory.
 *
 * @package automattic/block-delimiter
 */

declare( strict_types = 1 );

namespace Automattic;

use Exception;
use WP_HTML_Span;

/**
 * Class for efficiently scanning through block structure in a document
 * without parsing the entire block tree and JSON attributes into memory.
 *
 * This class follows design values of the HTML API:
 *  - minimize allocations and strive for zero memory overhead
 *  - make costs explicit; pay only for what you need
 *  - follow a streaming, re-entrant design for pausing and aborting
 *
 * For usage, jump straight to {@see self::next_delimiter}.
 */
class Block_Scanner {
	/**
	 * Indicates if the last operation failed, otherwise
	 * will be `null` for success.
	 *
	 * @var string|null
	 */
	private $last_error = null;

	/**
	 * Indicates failures from decoding JSON attributes.
	 *
	 * @var int
	 */
	private $last_json_error = JSON_ERROR_NONE;

	/**
	 * Holds a reference to the original source text from which to
	 * extract the parsed spans of the delimiter.
	 *
	 * @var string
	 */
	private $source_text;

	/**
	 * Byte offset into source text where entire delimiter begins.
	 *
	 * @var int
	 */
	private $delimiter_at = 0;

	/**
	 * Byte length of full span of delimiter.
	 *
	 * @var int
	 */
	private $delimiter_length = 0;

	/**
	 * Byte offset where namespace span begins.
	 *
	 * @var int
	 */
	private $namespace_at = 0;

	/**
	 * Byte length of namespace span, or `0` if implicitly in the "core" namespace.
	 *
	 * @var int
	 */
	private $namespace_length = 0;

	/**
	 * Byte offset where block name span begins.
	 *
	 * @var int
	 */
	private $name_at = 0;

	/**
	 * Byte length of block name span.
	 *
	 * @var int
	 */
	private $name_length = 0;

	/**
	 * Whether the delimiter contains the block self-closing flag.
	 *
	 * This may be erroneous if present within a block closer,
	 * therefore the {@see self::has_void_flag} can be used by
	 * calling code to perform appropriate error-handling.
	 *
	 * @var bool
	 */
	private $has_void_flag = false;

	/**
	 * Byte offset where JSON attributes span begins.
	 *
	 * @var int
	 */
	private $json_at;

	/**
	 * Byte length of JSON attributes span, or `0` if none are present.
	 *
	 * @var int
	 */
	private $json_length;

	/**
	 * Indicates what kind of block comment delimiter this represents.
	 *
	 * One of:
	 *
	 *  - `static::OPENER` If the delimiter is opening a block.
	 *  - `static::CLOSER` If the delimiter is closing an open block.
	 *  - `static::VOID`   If the delimiter represents a void block with no inner content.
	 *
	 * If a parsed comment delimiter contains both the closing and the void
	 * flags then it will be interpreted as a void block to match the behavior
	 * of the official block parser, however, this is a mistake and probably
	 * the block ought to close an open block of the same name, if one is open.
	 *
	 * @var string
	 */
	private $type;

	/**
	 * Creates a new block scanner.
	 *
	 * Example:
	 *
	 *     $scanner = Block_Scanner::create( $html );
	 *     while ( $scanner->next_delimiter() ) {
	 *          if ( $scanner->opens_block( 'core/image' ) ) {
	 *             echo "Found an image!\n";
	 *         }
	 *     }
	 *
	 * This function is currently a stub so that future improvements can add configuration
	 * options and reject creation, which cannot occur directly inside class constructors.
	 *
	 * @see self::next_delimiter
	 *
	 * @param string $source_text Input document potentially containing block content.
	 * @return ?self Created block scanner, if successfully created.
	 */
	public static function create( string $source_text ): ?self {
		return new self( $source_text );
	}

	/**
	 * Scan to the next block delimiter in a document, indicating if one was found.
	 *
	 * Block comment delimiters must be valid HTML comments and may contain JSON.
	 * This search does not determine, however, if the JSON is valid.
	 *
	 * Example delimiters:
	 *
	 *     `<!-- wp:paragraph {"dropCap": true} -->`
	 *     `<!-- wp:separator /-->`
	 *     `<!-- /wp:paragraph -->`
	 *
	 * In the case that a block comment delimiter contains both the void indicator and
	 * also the closing indicator, it will be treated as a void block.
	 *
	 * Example:
	 *
	 *     // Find all image block opening delimiters.
	 *     $images = array();
	 *     $scanner = Block_Scanner::create( $html );
	 *     while ( $scanner->next_delimiter() ) {
	 *         if ( $scanner->opens_block( 'core/image' ) ) {
	 *             $images[] = $scanner->get_span();
	 *         }
	 *     }
	 *
	 * Not all blocks have explicit delimiters. Non-block content at the top-level of
	 * a document (so-called “HTML soup”) forms implicit blocks containing neither a
	 * block name nor block attributes. Because this content often comprises only
	 * HTML whitespace and adds undo performance burden, it is skipped by default.
	 * To scan the implicit freeform blocks, pass the `$freeform_blocks` argument.
	 *
	 * Example:
	 *
	 *     $html    = '<!-- wp:void /-->\n<!-- wp:void /-->';
	 *     $blocks  = [
	 *       [ 'blockName' => 'core/void' ],
	 *       [ 'blockName' => null ],
	 *       [ 'blockName' => 'core/void' ],
	 *     ];
	 *     $scanner = Block_Scanner::create( $html );
	 *     while ( $scanner->next_delimiter( freeform_blocks: 'visit' ) {
	 *         ...
	 *     }
	 *
	 * In some cases it may be useful to conditionally visit the implicit freeform
	 * blocks, such as when determining if a post contains freeform content that
	 * isn’t purely whitespace.
	 *
	 * Example:
	 *
	 *     $seen_block_types   = [];
	 *     $freeform_blocks    = 'visit';
	 *     $scanner            = Block_Scanner::create( $html );
	 *     while ( $scanner->next_delimiter( freeform_blocks: $freeform_blocks ) {
	 *         if ( ! $scanner->opens_block() ) {
	 *             continue;
	 *         }
	 *
	 *         // Stop wasting time visiting freeform blocks after one has been found.
	 *         if ('visit' === $freeform_blocks ) {
	 *             if ( $scanner->is_non_whitespace_freeform() ) {
	 *                 $freeform_blocks = 'skip';
	 *                 $seen_block_types['core/freeform'] = true;
	 *             }
	 *             continue;
	 *         }
	 *
	 *         $seen_block_types[ $scanner->get_block_type() ] = true;
	 *     }
	 *
	 * @param string $freeform_blocks Optional. Pass `visit` to match freeform HTML content
	 *                                not surrounded by block delimiters. Defaults to `skip`.
	 * @return bool Whether a block delimiter was matched.
	 */
	public function next_delimiter( string $freeform_blocks = 'skip' ): bool { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( $this->last_error ) {
			return false;
		}

		$text      = $this->source_text;
		$end       = strlen( $text );
		$at        = $this->delimiter_at + $this->delimiter_length;
		$found_one = false;

		while ( $at < $end ) {
			/*
			 * Find the next possible opening.
			 *
			 * This follows the behavior in the official block parser, which treats a post
			 * as a list of blocks with nested HTML. If HTML comment syntax appears within
			 * an HTML attribute value, SCRIPT or STYLE element, or in other select places,
			 * which it can do inside of HTML, then the block parsing may break.
			 *
			 * For a more robust parse scan through the document with the HTML API. In
			 * practice, this has not been a problem in the entire history of blocks.
			 */
			$comment_opening_at = strpos( $text, '<!--', $at );
			if ( false === $comment_opening_at ) {
				return false;
			}

			$opening_whitespace_at     = $comment_opening_at + 4;
			$opening_whitespace_length = strspn( $text, " \t\f\r\n", $opening_whitespace_at );
			if ( 0 === $opening_whitespace_length ) {
				$at = $this->find_html_comment_end( $comment_opening_at, $end );
				continue;
			}

			$wp_prefix_at = $opening_whitespace_at + $opening_whitespace_length;
			if ( $wp_prefix_at >= $end ) {
				$this->last_error = self::INCOMPLETE_INPUT;
				return false;
			}

			$has_closer = false;
			if ( '/' === $text[ $wp_prefix_at ] ) {
				$has_closer = true;
				++$wp_prefix_at;
			}

			if ( 0 !== substr_compare( $text, 'wp:', $wp_prefix_at, 3 ) ) {
				$at = $this->find_html_comment_end( $comment_opening_at, $end );
				continue;
			}

			$namespace_at = $wp_prefix_at + 3;
			if ( $namespace_at >= $end ) {
				$this->last_error = self::INCOMPLETE_INPUT;
				return false;
			}

			$start_of_namespace = $text[ $namespace_at ];

			// The namespace must start with a-z.
			if ( 'a' > $start_of_namespace || 'z' < $start_of_namespace ) {
				$at = $this->find_html_comment_end( $comment_opening_at, $end );
				continue;
			}

			$namespace_length = 1 + strspn( $text, 'abcdefghijklmnopqrstuvwxyz0123456789-_', $namespace_at + 1 );
			$separator_at     = $namespace_at + $namespace_length;
			if ( $separator_at >= $end ) {
				$this->last_error = self::INCOMPLETE_INPUT;
				return false;
			}

			$has_separator = '/' === $text[ $separator_at ];
			if ( $has_separator ) {
				$name_at       = $separator_at + 1;
				$start_of_name = $text[ $name_at ];
				if ( 'a' > $start_of_name || 'z' < $start_of_name ) {
					$at = $this->find_html_comment_end( $comment_opening_at, $end );
					continue;
				}

				$name_length = 1 + strspn( $text, 'abcdefghijklmnopqrstuvwxyz0123456789-_', $name_at + 1 );
			} else {
				$name_at          = $namespace_at;
				$name_length      = $namespace_length;
				$namespace_length = 0;
			}

			$after_name_whitespace_at     = $name_at + $name_length;
			$after_name_whitespace_length = strspn( $text, " \t\f\r\n", $after_name_whitespace_at );
			if ( 0 === $after_name_whitespace_length ) {
				$at = $this->find_html_comment_end( $comment_opening_at, $end );
				continue;
			}

			$json_at = $after_name_whitespace_at + $after_name_whitespace_length;
			if ( $json_at >= $end ) {
				$this->last_error = self::INCOMPLETE_INPUT;
				return false;
			}
			$has_json    = '{' === $text[ $json_at ];
			$json_length = 0;

			/*
			 * For the final span of the delimiter it's most efficient to find the end
			 * of the HTML comment and work backwards. This prevents complicated parsing
			 * inside the JSON span, which cannot contain the HTML comment terminator.
			 *
			 * This also matches the behavior in the official block parser, though it
			 * allows for matching invalid JSON content.
			 */
			$comment_closing_at = strpos( $text, '-->', $json_at );
			if ( false === $comment_closing_at ) {
				$this->last_error = self::INCOMPLETE_INPUT;
				return false;
			}

			/*
			 * It looks like this logic leaves an error in here, when the position
			 * overlaps the JSON or block name. However, for neither of those is it
			 * possible to parse a valid block if that last overlapping character
			 * is the void flag. This, therefore, will be valid regardless of how
			 * the rest of the comment delimiter is written.
			 */
			if ( '/' === $text[ $comment_closing_at - 1 ] ) {
				$has_void_flag    = true;
				$void_flag_length = 1;
			} else {
				$has_void_flag    = false;
				$void_flag_length = 0;
			}

			/*
			 * If there's no JSON, then the span of text after the name
			 * until the comment closing must be completely whitespace.
			 */
			if ( ! $has_json ) {
				$max_whitespace_length = $comment_closing_at - $json_at - $void_flag_length;

				// This shouldn't be possible, but it can't be allowed regardless.
				if ( $max_whitespace_length < 0 ) {
					$at = $this->find_html_comment_end( $comment_opening_at, $end );
					continue;
				}

				$closing_whitespace_length = strspn( $text, " \t\f\r\n", $json_at, $comment_closing_at - $json_at - $void_flag_length );
				if ( 0 === $after_name_whitespace_length + $closing_whitespace_length ) {
					$at = $this->find_html_comment_end( $comment_opening_at, $end );
					continue;
				}

				// This must be a block delimiter!
				$found_one = true;
				break;
			}

			// There's no JSON, so attempt to find its boundary.
			$after_json_whitespace_length = 0;
			for ( $char_at = $comment_closing_at - $void_flag_length - 1; $char_at > $json_at; $char_at-- ) {
				$char = $text[ $char_at ];

				switch ( $char ) {
					case ' ':
					case "\t":
					case "\f":
					case "\r":
					case "\n":
						++$after_json_whitespace_length;
						continue 2;

					case '}':
						$json_length = $char_at - $json_at + 1;
						break 2;

					default:
						++$at;
						continue 3;
				}
			}

			if ( 0 === $json_length || 0 === $after_json_whitespace_length ) {
				$at = $this->find_html_comment_end( $comment_opening_at, $end );
				continue;
			}

			// This must be a block delimiter!
			$found_one = true;
			break;
		}

		if ( ! $found_one ) {
			return false;
		}

		$this->delimiter_at     = $comment_opening_at;
		$this->delimiter_length = $comment_closing_at + 3 - $comment_opening_at;

		$this->namespace_at     = $namespace_at;
		$this->namespace_length = $namespace_length;

		$this->name_at     = $name_at;
		$this->name_length = $name_length;

		$this->json_at     = $json_at;
		$this->json_length = $json_length;

		$this->type = $has_closer
			? static::CLOSER
			: ( $has_void_flag ? static::VOID : static::OPENER );

		$this->has_void_flag = $has_void_flag;

		return true;
	}

	/**
	 * Constructor function.
	 *
	 * @param string $source_text Input document potentially containing block content.
	 */
	private function __construct( string $source_text ) {
		$this->source_text = $source_text;
	}

	/**
	 * Returns the byte-offset after the ending character of an HTML comment,
	 * assuming the proper starting byte offset.
	 *
	 * @param int $comment_starting_at Where the HTML comment started, the leading `<`.
	 * @param int $search_end          Last offset in which to search, for limiting search span.
	 * @return int Offset after the current HTML comment ends, or `$end` if no end was found.
	 */
	private function find_html_comment_end( int $comment_starting_at, int $search_end ): int {
		$text = $this->source_text;

		// Find span-of-dashes comments which look like `<!----->`.
		$span_of_dashes = strspn( $text, '-', $comment_starting_at + 2 );
		if (
			$comment_starting_at + 2 + $span_of_dashes < $search_end &&
			'>' === $text[ $comment_starting_at + 2 + $span_of_dashes ]
		) {
			return $comment_starting_at + $span_of_dashes + 1;
		}

		// Otherwise, there are other characters inside the comment, find the first `-->` or `--!>`.
		$now_at = $comment_starting_at + 4;
		while ( $now_at < $search_end ) {
			$dashes_at = strpos( $text, '--', $now_at );
			if ( false === $dashes_at ) {
				$this->last_error = self::INCOMPLETE_INPUT;
				return $search_end;
			}

			$closer_must_be_at = $dashes_at + 2 + strspn( $text, '-', $dashes_at + 2 );
			if ( $closer_must_be_at < $search_end && '!' === $text[ $closer_must_be_at ] ) {
				$closer_must_be_at++;
			}

			if ( $closer_must_be_at < $search_end && '>' === $text[ $closer_must_be_at ] ) {
				return $closer_must_be_at + 1;
			}

			$now_at++;
		}

		return $search_end;
	}

	/**
	 * Indicates if the last attempt to parse a block comment delimiter
	 * failed, if set, otherwise `null` if the last attempt succeeded.
	 *
	 * @return string|null
	 */
	public function get_last_error() {
		return $this->last_error;
	}

	/**
	 * Indicates if the last attempt to parse a block’s JSON attributes failed.
	 *
	 * @see JSON_ERROR_NONE, JSON_ERROR_DEPTH, etc…
	 *
	 * @return int JSON_ERROR_ code from last attempt to parse block JSON attributes.
	 */
	public function get_last_json_error(): int {
		return $this->last_json_error;
	}

	/**
	 * Returns the type of the block comment delimiter.
	 *
	 * One of:
	 *
	 *  - `static::OPENER`
	 *  - `static::CLOSER`
	 *  - `static::VOID`
	 *
	 * @return string type of the block comment delimiter.
	 */
	public function get_delimiter_type(): string {
		return $this->type;
	}

	/**
	 * Returns whether the delimiter contains the void flag.
	 *
	 * This should be avoided except in cases of handling errors with
	 * block closers containing the void flag. For normative use,
	 * {@see self::get_delimiter_type}.
	 *
	 * @return bool
	 */
	public function has_void_flag(): bool {
		return $this->has_void_flag;
	}

	/**
	 * Indicates if the block delimiter represents a block of the given type.
	 *
	 * Since the "core" namespace may be implicit, it's allowable to pass
	 * either the fully-qualified block type with namespace and block name
	 * as well as the shorthand version only containing the block name, if
	 * the desired block is in the "core" namespace.
	 *
	 * Example:
	 *
	 *     $is_core_paragraph = $scanner->is_block_type( 'paragraph' );
	 *     $is_core_paragraph = $scanner->is_block_type( 'core/paragraph' );
	 *     $is_formula        = $scanner->is_block_type( 'math-block/formula' );
	 *
	 * @param string $block_type Block type name for the desired block.
	 *                           E.g. "paragraph", "core/paragraph", "math-blocks/formula".
	 * @return bool Whether this delimiter represents a block of the given type.
	 */
	public function is_block_type( string $block_type ): bool {
		// This is a core/freeform text block, it’s special.
		if ( 0 === $this->name_length ) {
			return 'core/freeform' === $block_type || 'freeform' === $block_type;
		}

		$slash_at = strpos( $block_type, '/' );
		if ( false === $slash_at ) {
			$namespace  = 'core';
			$block_name = $block_type;
		} else {
			// @todo Get lengths but avoid the allocation, use substr_compare below.
			$namespace  = substr( $block_type, 0, $slash_at );
			$block_name = substr( $block_type, $slash_at + 1 );
		}

		// Only the 'core' namespace is allowed to be omitted.
		if ( 0 === $this->namespace_length && 'core' !== $namespace ) {
			return false;
		}

		// If given an explicit namespace, they must match.
		if (
			0 !== $this->namespace_length && (
				strlen( $namespace ) !== $this->namespace_length ||
				0 !== substr_compare( $this->source_text, $namespace, $this->namespace_at, $this->namespace_length )
			)
		) {
			return false;
		}

		// The block name must match.
		return (
			strlen( $block_name ) === $this->name_length &&
			0 === substr_compare( $this->source_text, $block_name, $this->name_at, $this->name_length )
		);
	}

	/**
	 * Indicates if the matched delimiter is an opening or void delimiter
	 * (i.e. it opens the block) of the given type, if a type is provided.
	 *
	 * This is a helper method to ease handling of code inspecting where
	 * blocks start, and of checking if the blocks are of a given type.
	 * The function is variadic to allow for checking if the delimiter
	 * opens one of many possible block types.
	 *
	 * Example:
	 *
	 *     $scanner = Block_Scanner::create( $html );
	 *     while ( $scanner->next_delimiter() ) {
	 *         if ( $scanner->opens_block( 'core/code', 'syntaxhighlighter/code' ) ) {
	 *             echo "Found code!";
	 *             continue;
	 *         }
	 *
	 *         if ( $scanner->opens_block( 'core/image' ) ) {
	 *             echo "Found an image!";
	 *             continue;
	 *         }
	 *
	 *         if ( $scanner->opens_block() ) {
	 *             echo "Found a new block!";
	 *         }
	 *     }
	 *
	 * @see self::is_block_type
	 *
	 * @param string|null ...$block_type Optional. Is the matched block type one of these?
	 *                                    If none are provided, will not test block type.
	 * @return bool Whether the matched block delimiter opens a block, and whether it
	 *              opens a block of one of the given block types, if provided.
	 */
	public function opens_block( ...$block_type ): bool {
		if ( static::CLOSER === $this->type ) {
			return false;
		}

		if ( count( $block_type ) === 0 ) {
			return true;
		}

		foreach ( $block_type as $block ) {
			if ( $this->is_block_type( $block ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Indicates if the matched delimiter is implied due to top-level
	 * non-block content in the post.
	 *
	 * @see self::is_non_whitespace_freeform
	 *
	 * @return bool Whether or not the matched delimiter is implied as `core/freeform`.
	 */
	public function is_freeform(): bool {
		return 0 === $this->name_length;
	}

	/**
	 * Indicates if the matched delimiter is implicit and surrounding
	 * top-level non-block content that contains non-whitespace text.
	 *
	 * Many block serializers introduce newlines between block delimiters,
	 * so the presence of top-level non-block content does not imply that
	 * there are “real” freeform HTML blocks. Checking if there is content
	 * beyond whitespace is a more certain check, such as for determining
	 * whether to load CSS for the freeform or fallback block type.
	 *
	 * @see self::is_freeform
	 *
	 * @return bool
	 */
	public function is_non_whitespace_freeform(): bool {
		if ( 0 !== $this->name_length ) {
			return false;
		}

		// For now, return false as this method is not yet fully implemented.
		// @todo Implement logic to check if freeform content contains non-whitespace text.
		return false;
	}

	/**
	 * Allocates a substring for the block type and returns the
	 * fully-qualified name, including the namespace.
	 *
	 * This function allocates a substring for the given block type. This
	 * allocation will be small and likely fine in most cases, but it's
	 * preferable to call {@link self::is_block_type} if only needing
	 * to know whether the delimiter is for a given block type, as that
	 * function is more efficient for this purpose and avoids the allocation.
	 *
	 * Example:
	 *
	 *     // Avoid.
	 *     'core/paragraph' = $scanner->get_block_type();
	 *
	 *     // Prefer.
	 *     $scanner->is_block_type( 'core/paragraph' );
	 *     $scanner->is_block_type( 'paragraph' );
	 *
	 * @return string Fully-qualified block namespace and type, e.g. "core/paragraph".
	 */
	public function get_block_type(): string {
		// This is a core/freeform text block, it’s special.
		if ( 0 === $this->name_length ) {
			return 'core/freeform';
		}

		// This is implicitly in the "core" namespace.
		if ( 0 === $this->namespace_length ) {
			$block_name = substr( $this->source_text, $this->name_at, $this->name_length );
			return "core/{$block_name}";
		}

		return substr( $this->source_text, $this->namespace_at, $this->namespace_length + $this->name_length + 1 );
	}

	/**
	 * Returns a lazy wrapper around the block attributes, which can be used
	 * for efficiently interacting with the JSON attributes.
	 *
	 * @throws Exception This function is not yet implemented.
	 *
	 * @todo Create a lazy JSON wrapper so specific attributes can be
	 *       efficiently queried without parsing everything and loading
	 *       the entire object into memory.
	 * @todo After realistic benchmarking, see if JsonStreamingParser\Parser
	 *       could be used — it would need to be fast enough for the reduction
	 *       in memory use to be worth it, compared to {@see \json_decode}.
	 *
	 * @see \JsonStreamingParser\Parser
	 *
	 * @return never
	 */
	public function get_attributes(): void {
		throw new Exception( 'Lazy attribute parsing not yet supported' );
	}

	/**
	 * Attempts to parse and return the entire JSON attributes from the delimiter,
	 * allocating memory and processing the JSON span in the process.
	 *
	 * This does not return any parsed attributes for a closing block delimiter
	 * even if there is a span of JSON content; this JSON is a parsing error.
	 *
	 * Consider calling {@link self::get_attributes} instead if it's not
	 * necessary to read all the attributes at the same time, as that provides
	 * a more efficient mechanism for typical use cases.
	 *
	 * Since the JSON span inside the comment delimiter may not be valid JSON,
	 * this function will return `null` if it cannot parse the span and set the
	 * {@see self::get_last_json_error} to the appropriate JSON_ERROR_ constant.
	 *
	 * If the delimiter contains no JSON span, it will also return `null`,
	 * but the last error will be set to {@see JSON_ERROR_NONE}.
	 *
	 * Example:
	 *
	 *     $scanner = Block_Scanner::create( '<!-- wp:image {"url": "https://wordpress.org/favicon.ico"} -->' );
	 *     $scanner->next_delimiter();
	 *     $memory_hungry_and_slow_attributes = $scanner->allocate_and_return_parsed_attributes();
	 *     $memory_hungry_and_slow_attributes === array( 'url' => 'https://wordpress.org/favicon.ico' );
	 *
	 *     $scanner = Block_Scanner::create( '<!-- /wp:image {"url": "https://wordpress.org/favicon.ico"} -->' );
	 *     $scanner->next_delimiter();
	 *     null            = $scanner->allocate_and_return_parsed_attributes();
	 *     JSON_ERROR_NONE = $scanner->get_last_json_error();
	 *
	 *     $scanner = Block_Scanner::create( '<!-- wp:separator {} /-->' );
	 *     $scanner->next_delimiter();
	 *     array() === $scanner->allocate_and_return_parsed_attributes();
	 *
	 *     $scanner = Block_Scanner::create( '<!-- wp:separator /-->' );
	 *     $scanner->next_delimiter();
	 *     null = $scanner->allocate_and_return_parsed_attributes();
	 *
	 *     $scanner = Block_Scanner::create( '<!-- wp:image {"url} -->' );
	 *     $scanner->next_delimiter();
	 *     null                 = $scanner->allocate_and_return_parsed_attributes();
	 *     JSON_ERROR_CTRL_CHAR = $scanner->get_last_json_error();
	 *
	 * @return array|null Parsed JSON attributes, if present and valid, otherwise `null`.
	 */
	public function allocate_and_return_parsed_attributes(): ?array {
		$this->last_json_error = JSON_ERROR_NONE;

		if ( static::CLOSER === $this->type ) {
			return null;
		}

		if ( 0 === $this->json_length ) {
			return null;
		}

		$json_span = substr( $this->source_text, $this->json_at, $this->json_length );
		$parsed    = json_decode( $json_span, null, 512, JSON_OBJECT_AS_ARRAY | JSON_INVALID_UTF8_SUBSTITUTE );

		$last_error            = json_last_error();
		$this->last_json_error = $last_error;

		return ( JSON_ERROR_NONE === $last_error && is_array( $parsed ) )
			? $parsed
			: null;
	}

	/**
	 * Returns the span representing the currently-matched delimiter,
	 * if matched, otherwise `null`.
	 *
	 * Note that for freeform blocks this will return a span of length
	 * zero, since there is no explicit block delimiter.
	 *
	 * Example:
	 *
	 *     $scanner = Block_Scanner::create( '<!-- wp:void /-->' );
	 *     null     === $scanner->get_span();
	 *
	 *     $scanner->next_delimiter();
	 *     WP_HTML_Span( 0, 17 ) === $scanner->get_span();
	 *
	 * @return WP_HTML_Span|null Span of text in source text spanning matched delimiter.
	 */
	public function get_span(): ?WP_HTML_Span {
		return new WP_HTML_Span( $this->delimiter_at, $this->delimiter_length );
	}

	// Debugging methods not meant for production use.

	/**
	 * Prints a debugging message showing the structure of the parsed delimiter.
	 *
	 * This is not meant to be used in production!
	 *
	 * @access private
	 */
	public function debug_print_structure(): void {
		$c = ( ! defined( 'STDOUT' ) || posix_isatty( STDOUT ) )
			? function ( $color = null ) { return $color; } // phpcs:ignore
			: function ( $color ) { return ''; }; // phpcs:ignore

		if ( $this->is_block_type( 'core/freeform' ) ) {
			$closer = static::CLOSER === $this->get_delimiter_type() ? '/' : '';
			echo "{$c( "\e[90m" )}<!-- "; // phpcs:ignore
			echo "{$c( "\e[0;31m" )}{$closer}"; // phpcs:ignore
			echo "{$c("\e[90m" )}wp:"; // phpcs:ignore
			echo "{$c( "\e[0;34m" )}freeform"; // phpcs:ignore
			echo "{$c( "\e[0;36m" )} {$c("\e[90m")}-->\n"; // phpcs:ignore
			return;
		}

		$namespace  = substr( $this->source_text, $this->namespace_at, $this->namespace_length );
		$slash      = 0 === $this->namespace_length ? '' : '/';
		$block_name = substr( $this->source_text, $this->name_at, $this->name_length );
		$closer     = static::CLOSER === $this->type ? '/' : '';
		$json       = substr( $this->source_text, $this->json_at, $this->json_length );

		$opener_whitespace_at     = $this->delimiter_at + 4;
		$opener_whitespace_length = $this->namespace_at - 3 - $opener_whitespace_at - ( static::CLOSER === $this->type ? 1 : 0 );

		$after_name_whitespace_at     = $this->name_at + $this->name_length;
		$after_name_whitespace_length = $this->json_at - $after_name_whitespace_at;

		$closing_whitespace_at     = $this->json_at + $this->json_length;
		$closing_whitespace_length = $this->delimiter_at + $this->delimiter_length - 3 - $closing_whitespace_at;

		if ( '/' === $this->source_text[ $this->delimiter_at + $this->delimiter_length - 4 ] ) {
			$void_flag = '/';
			--$closing_whitespace_length;
		} else {
			$void_flag = '';
		}

		$w = function ( $whitespace ) use ( $c ) {
			return $c( "\e[2;90m" ) . str_replace( array( ' ', "\t", "\f", "\r", "\n" ), array( '␣', '␉', '␌', '␍', '␤' ), $whitespace );
		};

		echo "{$c( "\e[90m" )}<!--"; // phpcs:ignore
		echo $w( substr( $this->source_text, $opener_whitespace_at, $opener_whitespace_length ) ); // phpcs:ignore
		echo "{$c( "\e[0;31m" )}{$closer}"; // phpcs:ignore
		echo "{$c("\e[90m" )}wp:{$c( "\e[2;34m" )}{$namespace}"; // phpcs:ignore
		echo "{$c( "\e[2;90m" )}{$slash}"; // phpcs:ignore
		echo "{$c( "\e[0;34m" )}{$block_name}"; // phpcs:ignore
		echo $w( substr( $this->source_text, $after_name_whitespace_at, $after_name_whitespace_length ) ); // phpcs:ignore
		echo "{$c("\e[0;2;32m" )}{$json}"; // phpcs:ignore
		echo $w( substr( $this->source_text, $closing_whitespace_at, $closing_whitespace_length ) ); // phpcs:ignore
		echo "{$c( "\e[0;36m" )}{$void_flag}{$c("\e[90m")}-->\n"; // phpcs:ignore
	}

	// Constant declarations that would otherwise pollute the top of the class.

	/**
	 * Indicates that the block comment delimiter closes an open block.
	 */
	const CLOSER = 'closer';

	/**
	 * Indicates that the parser started parsing a block comment delimiter, but
	 * the input document ended before it could finish. The document was likely truncated.
	 */
	const INCOMPLETE_INPUT = 'incomplete-input';

	/**
	 * Indicates that the block comment delimiter opens a block.
	 */
	const OPENER = 'opener';

	/**
	 * Indicates that the parser has not yet attempted to parse a block comment delimiter.
	 */
	const UNINITIALIZED = 'uninitialized';

	/**
	 * Indicates that the block comment delimiter represents a void block
	 * with no inner content of any kind.
	 */
	const VOID = 'void';
}
