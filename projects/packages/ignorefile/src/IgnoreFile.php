<?php
/**
 * Implementation of the gitignore "spec".
 *
 * @package automattic/ignorefile
 */

namespace Automattic;

use Automattic\IgnoreFile\InvalidPatternException;
use CallbackFilterIterator;
use FilterIterator;
use InvalidArgumentException;
use Iterator;
use RecursiveCallbackFilterIterator;
use RecursiveIterator;
use SplFileInfo;

/**
 * Implementation of the gitignore "spec".
 *
 * @link https://git-scm.com/docs/gitignore
 */
class IgnoreFile {

	/**
	 * Set true to throw on invalid patterns.
	 *
	 * @var bool
	 */
	public $strictMode = false;

	/**
	 * Loaded patterns.
	 *
	 * @var array
	 */
	private $patterns = array();

	/**
	 * Add one or more pattern lines, or import from another IgnoreFile instance.
	 *
	 * The `$prefix` is intended for use when you're loading multiple `.gitignore` files from
	 * multiple places in the filesystem. As you load each file, pass the path to the file
	 * as `$prefix` (either relative to a common base or absolute).
	 *
	 * @param string|IgnoreFile|(string|IgnoreFile)[] $patterns Patterns to add. Acceptable values are:
	 *   - A string, possibly containing newlines, representing the contents of a `.gitignore` file.
	 *   - Another `IgnoreFile` instance, which will be merged into the current instance.
	 *   - An array of strings (no newlines allowed) and/or IgnoreFile instances.
	 * @param string                                  $prefix All (string) patterns must match relative to this prefix.
	 *   This is not applied to patterns copied from another Ignore instance.
	 * @throws InvalidArgumentException If arguments are invalid.
	 * @throws InvalidPatternException If patterns are invalid and `$this->strictMode` is set.
	 */
	public function add( $patterns, $prefix = '' ) {
		if ( '' !== $prefix && substr( $prefix, -1 ) !== '/' ) {
			throw new InvalidArgumentException( 'Prefix must end in `/`' );
		}

		if ( is_string( $patterns ) ) {
			if ( substr( $patterns, 0, 3 ) === "\xef\xbb\xbf" ) { // UTF-8 BOM
				$patterns = substr( $patterns, 3 );
			}
			$patterns = explode( "\n", $patterns );
		} elseif ( ! is_array( $patterns ) ) {
			$patterns = array( $patterns );
		}

		foreach ( $patterns as $idx => $pat ) {
			if ( $pat instanceof IgnoreFile ) {
				$this->patterns = array_merge( $this->patterns, $pat->patterns );
				continue;
			}

			$pat = (string) $pat;

			// Line may not contain newlines. But DWIM and ignore trailing newlines.
			$pat = rtrim( $pat, "\r\n" );
			if ( strpos( $pat, "\r" ) !== false || strpos( $pat, "\n" ) !== false ) {
				if ( $this->strictMode ) {
					throw new InvalidPatternException( "Pattern at index $idx may not contain newlines" );
				}
				continue;
			}

			// A blank line matches no files. Trailing spaces are ignored unless they are quoted with backslash ("\").
			// A line starting with # serves as a comment.
			if ( trim( $pat ) === '' || '#' === $pat[0] ) {
				continue;
			}

			$orig = $pat;

			// Trailing spaces are ignored unless they are quoted with backslash ("\").
			$pat = preg_replace( '/(?<!\\\\) +$/', '', $pat );

			// A prefix "!" negates the pattern.
			$negate = '!' === $pat[0];
			if ( $negate ) {
				$pat = (string) substr( $pat, 1 );
				if ( '' === $pat ) {
					if ( $this->strictMode ) {
						throw new InvalidPatternException( "Pattern at index $idx consists of only `!`" );
					}
					continue;
				}
			}

			try {
				$regex = $this->patternToRegex( $pat, $idx );
			} catch ( InvalidPatternException $ex ) {
				if ( $this->strictMode ) {
					throw $ex;
				}
				continue;
			}

			$this->patterns[] = array(
				'prefix'  => $prefix,
				'negate'  => $negate,
				'pattern' => $orig,
				'regex'   => $regex,
			);
		}
	}

	/**
	 * Filter an array of paths to remove any that are ignored.
	 *
	 * See `ignores()` for notes on how to pass paths.
	 *
	 * @param (string|SplFileInfo)[] $paths Paths.
	 * @return (string|SplFileInfo)[]
	 */
	public function filter( array $paths ) {
		return array_filter( $paths, array( $this, 'notIgnores' ) );
	}

	/**
	 * Indicate whether the path is ignored.
	 *
	 * If `$prefix` was used with `add()`, the paths passed should be equivalent (relative to the
	 * same common base, or absolute if `add()` was passed absolute paths).
	 *
	 * Directories must include a trailing `/` to be recognized as such. Without that, they'll be
	 * treated as files.
	 *
	 * @param string|SplFileInfo $path Path to test.
	 * @return bool If the path is ignored.
	 */
	public function ignores( $path ) {
		$ret = $this->test( $path );
		return $ret['ignored'];
	}

	/**
	 * Indicate whether the path is not ignored.
	 *
	 * This is, basically, `! $this->ignores( $path )`. It's convenient for
	 * passing to `array_filter()` or the like.
	 *
	 * @param string $path Path to test.
	 * @return bool If the path is not ignored.
	 */
	public function notIgnores( $path ) {
		$ret = $this->test( $path );
		return ! $ret['ignored'];
	}

	/**
	 * Indicate whether the path is ignored or unignored.
	 *
	 * There are three possible return values:
	 *
	 * - `array( 'ignored' => true, 'unignored' => false, 'pattern' => string )` => Path is ignored.
	 * - `array( 'ignored' => false, 'unignored' => true, 'pattern' => string )` => Path is explicitly unignored.
	 * - `array( 'ignored' => false, 'unignored' => false, 'pattern' => null )` => Path is neither ignored nor unignored.
	 *
	 * @param string|SplFileInfo $path Path to test.
	 * @return array As above.
	 */
	public function test( $path ) {
		if ( $path instanceof SplFileInfo ) {
			$path = $path->isDir() ? "$path/" : "$path";
		}

		$parentPath = dirname( $path ) . '/';
		if ( './' !== $parentPath && $parentPath !== $path ) {
			$parent = $this->test( $parentPath );
			if ( $parent['ignored'] ) {
				return $parent;
			}
		}

		$ret = array(
			'ignored'   => false,
			'unignored' => false,
			'pattern'   => null,
		);

		foreach ( $this->patterns as $pat ) {
			// Prefix match.
			if ( '' === $pat['prefix'] ) {
				$p = $path;
			} else {
				$l = strlen( $pat['prefix'] );
				if ( substr( $path, 0, $l ) !== $pat['prefix'] ) {
					continue;
				}
				$p = (string) substr( $path, $l );
			}

			if ( preg_match( $pat['regex'], $p ) ) {
				$ret = array(
					'ignored'   => ! $pat['negate'],
					'unignored' => $pat['negate'],
					'pattern'   => $pat['pattern'],
				);
			}
		}

		return $ret;
	}

	/**
	 * Filter an iterator.
	 *
	 * When using FileSystemIterator or its subclasses, do not use CURRENT_AS_PATHNAME
	 * as that does not include the necessary trailing `/` on directory names.
	 *
	 * @param Iterator $iter Iterator to filter.
	 * @return FilterIterator|FilterIterator&RecursiveIterator Filtered iterator. If the input implements `RecursiveIterator`, the returned iterator does too.
	 */
	public function filterIterator( Iterator $iter ) {
		if ( $iter instanceof RecursiveIterator ) {
			return new RecursiveCallbackFilterIterator( $iter, array( $this, 'notIgnores' ) );
		}
		return new CallbackFilterIterator( $iter, array( $this, 'notIgnores' ) );
	}

	/**
	 * Convert a pattern to a PCRE regex.
	 *
	 * @param string     $pat Pattern.
	 * @param string|int $idx Index for errors.
	 * @return string Regex.
	 * @throws InvalidPatternException If pattern is invalid.
	 */
	protected function patternToRegex( $pat, $idx ) {
		$orig = $pat;

		// If there is a separator at the beginning or middle (or both) of the pattern, then the pattern is relative to the $prefix. Otherwise, it has an implicit "**/" at the start.
		$pos = strpos( $pat, '/' );
		if ( false === $pos || strlen( $pat ) - 1 === $pos ) {
			$pat = ( '/' === $pat[0] ? '**' : '**/' ) . $pat;
		}

		// Collapse any multiple "/".
		$pat = preg_replace( '#//+#', '/', $pat );

		// Collapse any "/**/**/".
		$pat = preg_replace( '#(?:^|/)\*\*/(?:\*\*/)+#', '/**/', $pat );

		$re = '#';

		// A leading "**/" means match in all directories. Otherwise, it's anchored to the start.
		// A leading "/**/" is the same.
		if ( substr( $pat, 0, 3 ) === '**/' || substr( $pat, 0, 4 ) === '/**/' ) {
			$re .= '(?:^|/)';
			$pat = (string) substr( $pat, '/' === $pat[0] ? 4 : 3 );
		} else {
			$re .= '^';
			// Ignore a leading "/".
			if ( '/' === $pat[0] ) {
				$pat = (string) substr( $pat, 1 );
			}
		}

		$atDir = true;
		$noBT  = false;
		while ( '' !== $pat ) {
			// A trailing "/**" matches everything inside.
			if ( '/**' === $pat ) {
				$re   .= ( $noBT ? ')' : '' ) . ( $atDir ? '' : '/' ) . '.++';
				$atDir = true;
				$noBT  = false;
				break;
			}

			// A slash followed by two consecutive asterisks then a slash matches zero or more directories.
			if ( substr( $pat, 0, 4 ) === '/**/' ) {
				// Avoid creating a poorly-performing regex if someone does something weird with backslashes or something that stops the collapsing above from working.
				if ( substr( $re, -11 ) !== '(?:[^/]+/)*' ) {
					$re .= ( $noBT ? ')' : '' ) . ( $atDir ? '' : '/' ) . '(?:[^/]+/)*';
				}
				$pat   = (string) substr( $pat, 4 );
				$atDir = true;
				$noBT  = false;
				continue;
			}

			// An asterisk "*" matches anything except a slash.
			if ( '*' === $pat[0] ) {
				// Avoid creating a poorly-performing regex if someone does like "/foo**".
				if ( substr( $re, -5 ) !== '[^/]*' ) {
					if ( $atDir && ! $noBT ) {
						$re  .= '(?>';
						$noBT = true;
					}
					// Use a lookahead to ensure the component isn't empty, if the "*" is at the start of a component.
					if ( $atDir ) {
						$re .= '(?=[^/])';
					}
					$re .= '[^/]*';
				}
				$pat   = (string) substr( $pat, 1 );
				$atDir = false;
				continue;
			}

			// The character "?" matches any one character except "/".
			if ( '?' === $pat[0] ) {
				if ( $atDir && ! $noBT ) {
					$re  .= '(?>';
					$noBT = true;
				}
				$re   .= '[^/]';
				$pat   = (string) substr( $pat, 1 );
				$atDir = false;
				continue;
			}

			// Probably a bracket expression. Complex.
			if ( '[' === $pat[0] ) {
				$pat           = (string) substr( $pat, 1 );
				$savedPat      = $pat;
				$cre           = '';
				$needLookahead = false;

				// If the charset is negated, we also need to include `/` in the list of characters to exclude.
				// Note use of '^' as the negator is unspecified behavior.
				if ( '' !== $pat && ( '!' === $pat[0] || '^' === $pat[0] ) ) {
					$cre .= '^/';
					$pat  = (string) substr( $pat, 1 );
				}

				$first = true;
				while ( '' !== $pat && ( $first || ']' !== $pat[0] ) ) {
					$first = false;

					// Special stuff.
					if ( substr( $pat, 0, 2 ) === '[.' ) {
						throw new InvalidPatternException( "Collating symbols (`[.` inside a bracket expression) are not supported (in pattern at index $idx)" );
					}
					if ( substr( $pat, 0, 2 ) === '[=' ) {
						throw new InvalidPatternException( "Equivalence classes (`[=` inside a bracket expression) are not supported (in pattern at index $idx)" );
					}
					if ( substr( $pat, 0, 2 ) === '[:' ) {
						$pos = strpos( $pat, ':]' );
						if ( false === $pos ) {
							throw new InvalidPatternException( "Invalid character class in bracket expression near `$pat` (in pattern at index $idx)" );
						}
						$class = substr( $pat, 0, $pos + 2 );
						$pat   = (string) substr( $pat, $pos + 2 );
						switch ( $class ) {
							case '[:alnum:]': // @codeCoverageIgnore
							case '[:alpha:]': // @codeCoverageIgnore
							case '[:blank:]': // @codeCoverageIgnore
							case '[:cntrl:]': // @codeCoverageIgnore
							case '[:digit:]': // @codeCoverageIgnore
							case '[:lower:]': // @codeCoverageIgnore
							case '[:space:]': // @codeCoverageIgnore
							case '[:upper:]': // @codeCoverageIgnore
							case '[:xdigit:]': // @codeCoverageIgnore
								$cre .= $class;
								break;
							case '[:graph:]': // @codeCoverageIgnore
							case '[:print:]': // @codeCoverageIgnore
							case '[:punct:]': // @codeCoverageIgnore
								// These contain "/", without an easy way to exclude it. So use a lookahead.
								$needLookahead = true;
								$cre          .= $class;
								break;
							default:
								throw new InvalidPatternException( "Unrecognized character class $class in bracket expression (in pattern at index $idx)" );
						}
						continue;
					}

					// Range or character.
					$c1  = mb_substr( $pat, 0, 1, 'UTF8' );
					$pat = mb_substr( $pat, 1, null, 'UTF8' );
					if ( '\\' === $c1 ) {
						if ( '' === $pat ) {
							break;
						}
						$c1  = mb_substr( $pat, 0, 1, 'UTF8' );
						$pat = mb_substr( $pat, 1, null, 'UTF8' );
					}
					if ( strlen( $pat ) > 1 && '-' === $pat[0] && ']' !== $pat[1] ) {
						$c2  = mb_substr( $pat, 1, 1, 'UTF8' );
						$pat = mb_substr( $pat, 2, null, 'UTF8' );
						if ( '\\' === $c2 ) {
							if ( '' === $pat ) {
								break;
							}
							$c2  = mb_substr( $pat, 0, 1, 'UTF8' );
							$pat = mb_substr( $pat, 1, null, 'UTF8' );
						}

						// If the start of the range is `/`, move it past.
						if ( '/' === $c1 ) {
							$c1 = '0';
						}
						// If the end of the range is `/`, move it back.
						if ( '/' === $c2 ) {
							$c2 = '.';
						}
						// Inverted ranges match nothing.
						if ( strcmp( $c1, $c2 ) > 0 ) {
							continue;
						}
						if ( $c1 === $c2 ) {
							$cre .= preg_quote( $c1, '#' );
						} elseif ( strcmp( $c1, '/' ) < 0 && strcmp( '/', $c2 ) < 0 ) {
							// Range contains `/`, split it.
							$cre .= '.' !== $c1 ? preg_quote( $c1, '#' ) . '-.' : '.';
							$cre .= '0' !== $c2 ? '0-' . preg_quote( $c2, '#' ) : '0';
						} else {
							$cre .= preg_quote( $c1, '#' ) . '-' . preg_quote( $c2, '#' );
						}
					} elseif ( '/' !== $c1 ) { // If it's a "/" for a positive pattern, we need to omit it. If it's a "/" for a negated pattern, we already included it.
						$cre .= preg_quote( $c1, '#' );
					}
				}

				// If we reached the end of the pattern, it's not actually a bracket expression. Record a literal "[" and continue.
				if ( '' === $pat ) {
					if ( $atDir && ! $noBT ) {
						$re  .= '(?>';
						$noBT = true;
					}
					$re   .= preg_quote( '[', '#' );
					$pat   = $savedPat;
					$atDir = false;
					continue;
				}

				// Check for an attempt to match nothing.
				if ( '' === $cre ) {
					return '#(*FAIL)#';
				}

				if ( $atDir && ! $noBT ) {
					$re  .= '(?>';
					$noBT = true;
				}
				if ( $needLookahead ) {
					// If we couldn't exclude it when building the bracket expression, use a lookahead to ensure it doesn't match a "/".
					$re .= '(?!/)';
				}
				$re   .= "[$cre]";
				$pat   = (string) substr( $pat, 1 ); // Remove the trailing ']'.
				$atDir = false;
				continue;
			}

			// Outside of a range, backslash escapes a character.
			if ( '\\' === $pat ) {
				// If a pattern ends with an unescaped <backslash>, it is unspecified whether the pattern does not match anything or the pattern is treated as invalid.
				// We treat it as invalid here.
				throw new InvalidPatternException( "Unexpected trailing backslash in pattern `$orig` at index $idx" );
			}
			if ( '\\' === $pat[0] ) {
				if ( '/' === $pat[1] ) {
					// Special case this becuase of so much other special "/" handling.
					$pat = (string) substr( $pat, 1 );
					continue;
				}
				if ( $atDir && ! $noBT ) {
					$re  .= '(?>';
					$noBT = true;
				}
				$re   .= preg_quote( mb_substr( $pat, 1, 1, 'UTF8' ), '#' );
				$pat   = mb_substr( $pat, 2, null, 'UTF8' );
				$atDir = false;
				continue;
			}

			// "/" separates path components.
			if ( '/' === $pat[0] ) {
				$re   .= ( $noBT ? ')' : '' ) . ( $atDir ? '' : '/' );
				$pat   = (string) substr( $pat, 1 );
				$atDir = true;
				$noBT  = false;
				continue;
			}

			// Else, it's just a regular character.
			if ( $atDir && ! $noBT ) {
				$re  .= '(?>';
				$noBT = true;
			}
			$re   .= preg_quote( mb_substr( $pat, 0, 1, 'UTF8' ), '#' );
			$pat   = mb_substr( $pat, 1, null, 'UTF8' );
			$atDir = false;
		}

		$re .= ( $noBT ? ')' : '' ) . ( $atDir ? '' : '/?' ) . '$#u';

		return $re;
	}
}
