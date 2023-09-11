<?php
/**
 * Sniff for textdomains to some additiona functions.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\Functions;

use InvalidArgumentException;
use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Util\Common as Util_Common;
use PHP_CodeSniffer\Util\Tokens;

/**
 * Sniff for textdomains to some additiona functions.
 *
 * Checks that `wp_set_script_translations()` and `Assets::register_script()` are passed
 * a correct domain.
 */
class I18nSniff implements Sniff {

	/**
	 * Text domain.
	 *
	 * @var string[]|string
	 */
	public $text_domain;

	/**
	 * Returns the token types that this sniff is interested in.
	 *
	 * @return array(int)
	 */
	public function register() {
		return array( T_STRING );
	}

	/**
	 * Processes the tokens that this sniff is interested in.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr The position in the stack where the token was found.
	 * @return void|int Next token or null.
	 * @throws RuntimeException If `text_domain` isn't set.
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		if ( ! $this->text_domain ) {
			throw new RuntimeException( 'text_domain property is not set for ' . Util_Common::getSniffCode( static::class ) );
		}
		$domains = array_values( (array) $this->text_domain );

		$tokens = $phpcsFile->getTokens();

		// If it's a function call, it'll be followed by an open-paren which will have a matching close-paren.
		$opener = $phpcsFile->findNext( Tokens::$emptyTokens, $stackPtr + 1, null, true );
		if ( ! isset( $tokens[ $opener ]['parenthesis_closer'] ) ) {
			return $opener;
		}

		// Determine the function name.
		$func = $tokens[ $stackPtr ]['content'];
		$prev = $stackPtr;
		while ( false !== $prev ) {
			$prev = $phpcsFile->findPrevious( Tokens::$emptyTokens, $prev - 1, null, true, null, true );
			if ( false === $prev ) {
				break; // @codeCoverageIgnore
			} elseif ( T_OBJECT_OPERATOR === $tokens[ $prev ]['code'] ) {
				$func = '->' . $func;
				$prev = false;
			} elseif ( T_NS_SEPARATOR === $tokens[ $prev ]['code'] ) {
				$func = '\\' . $func;
				$prev = $phpcsFile->findPrevious( Tokens::$emptyTokens, $prev - 1, null, true, null, true );
				if ( $prev && T_STRING === $tokens[ $prev ]['code'] ) {
					$func = $tokens[ $prev ]['content'] . $func;
				} else {
					$prev = false;
				}
			} elseif ( \T_DOUBLE_COLON === $tokens[ $prev ]['code'] ) {
				$func = '::' . $func;
				$prev = $phpcsFile->findPrevious( Tokens::$emptyTokens, $prev - 1, null, true, null, true );
				if ( $prev && T_STRING === $tokens[ $prev ]['code'] ) {
					$func = $tokens[ $prev ]['content'] . $func;
				} else {
					$prev = false;
				}
			} else {
				$prev = false;
			}
		}

		// Handle a call to `wp_set_script_translations()`.
		if ( 'wp_set_script_translations' === $func || '\\wp_set_script_translations' === $func ) {
			$args = $this->getArgs( $phpcsFile, $opener );
			if ( ! isset( $args[1] ) ) {
				// No domain arg.
				$fixable = count( $domains ) === 1 && count( $args ) === 1;
				if ( in_array( 'default', $domains, true ) ) {
					$phpcsFile->addWarning(
						'Missing domain arg. If this text string is supposed to use a WP Core translation, use the "default" text domain.',
						$stackPtr,
						'DomainDefault'
					);
				} elseif ( $phpcsFile->addError( 'Missing domain arg.', $stackPtr, 'MissingDomain', array(), 0, $fixable ) && $fixable ) {
					$phpcsFile->fixer->addContent( $args[0][1], ", '" . addcslashes( $domains[0], "'\\" ) . "'" );
				}
			} else {
				// Check the domain arg.
				$this->checkDomain( $phpcsFile, $args[1][0], $args[1][1] );
			}
			return $opener;
		}

		if ( 'Assets::register_script' === $func ||
			'Automattic\\Jetpack\\Assets::register_script' === $func ||
			'\\Automattic\\Jetpack\\Assets::register_script' === $func
		) {
			$args = $this->getArgs( $phpcsFile, $opener );

			// Has an `$options` arg?
			if ( ! isset( $args[3] ) ) {
				return $opener;
			}

			// `$options` is an array?
			$code = $tokens[ $args[3][0] ]['code'];
			if ( T_ARRAY !== $code && T_OPEN_SHORT_ARRAY !== $code && T_OPEN_SQUARE_BRACKET !== $code ) {
				return $opener;
			}

			// Go through the values in the array looking for 'textdomain'.
			$idx   = isset( $tokens[ $args[3][0] ]['parenthesis_opener'] ) ? $tokens[ $args[3][0] ]['parenthesis_opener'] : $args[3][0];
			$end   = $args[3][1];
			$start = $phpcsFile->findNext( Tokens::$emptyTokens, $idx + 1, $end, true );
			$toks  = array( T_OPEN_CURLY_BRACKET, T_OPEN_SQUARE_BRACKET, T_OPEN_PARENTHESIS, T_OPEN_SHORT_ARRAY, T_COMMA );
			$idx   = $start;
			while ( false !== $idx ) {
				$idx = $phpcsFile->findNext( $toks, $idx, $end );
				if ( false === $idx || T_COMMA === $tokens[ $idx ]['code'] ) {
					if ( false === $idx ) {
						$idx = $end;
					}
					// Assume people won't be strange about option array keys.
					if ( "'textdomain'" === $tokens[ $start ]['content'] ||
						'"textdomain"' === $tokens[ $start ]['content']
					) {
						$next = $phpcsFile->findNext( Tokens::$emptyTokens, $start + 1, $idx, true );
						if ( false !== $next && T_DOUBLE_ARROW === $tokens[ $next ]['code'] ) {
							$next = $phpcsFile->findNext( Tokens::$emptyTokens, $next + 1, $idx, true );
							$prev = $phpcsFile->findPrevious( Tokens::$emptyTokens, $idx - 1, null, true );
							if ( false !== $next && $prev >= $next ) {
								$this->checkDomain( $phpcsFile, $next, $prev );
							}
						}
					}
					$idx   = $phpcsFile->findNext( Tokens::$emptyTokens, $idx + 1, $end, true );
					$start = $idx;
				} elseif ( isset( $tokens[ $idx ]['parenthesis_closer'] ) ) {
					$idx = $tokens[ $idx ]['parenthesis_closer'];
				} elseif ( isset( $tokens[ $idx ]['bracket_closer'] ) ) {
					$idx = $tokens[ $idx ]['bracket_closer'];
				}
			}
		}
	}

	/**
	 * Extract the argument tokens for a function call.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $opener The index of the open paren.
	 * @return int[][] Array of token start and end indexes.
	 * @throws InvalidArgumentException If $opener isn't an open-paren.
	 */
	private function getArgs( File $phpcsFile, $opener ) {
		$tokens = $phpcsFile->getTokens();
		if ( ! isset( $tokens[ $opener ]['parenthesis_closer'] ) ) {
			throw new InvalidArgumentException( 'Opener has no parenthesis_closer' ); // @codeCoverageIgnore
		}
		$end = $tokens[ $opener ]['parenthesis_closer'];

		$args = array();

		$idx = $phpcsFile->findNext( Tokens::$emptyTokens, $opener + 1, $end, true );
		if ( false === $idx ) {
			return $args;
		}

		// We count commas to find the next parameter. But skip over any `{...}`, `[...]`, or `(...)` that might have internal commas.
		$toks  = array( T_OPEN_CURLY_BRACKET, T_OPEN_SQUARE_BRACKET, T_OPEN_PARENTHESIS, T_OPEN_SHORT_ARRAY, T_COMMA );
		$start = $idx;
		while ( false !== $idx ) {
			$idx = $phpcsFile->findNext( $toks, $idx, $end );
			if ( false === $idx || T_COMMA === $tokens[ $idx ]['code'] ) {
				if ( false === $idx ) {
					$idx = $end;
				}
				$prev   = $phpcsFile->findPrevious( Tokens::$emptyTokens, $idx - 1, null, true );
				$args[] = array( $start, $prev );
				$idx    = $phpcsFile->findNext( Tokens::$emptyTokens, $idx + 1, $end, true );
				$start  = $idx;
			} elseif ( isset( $tokens[ $idx ]['parenthesis_closer'] ) ) {
				$idx = $tokens[ $idx ]['parenthesis_closer'];
			} elseif ( isset( $tokens[ $idx ]['bracket_closer'] ) ) {
				$idx = $tokens[ $idx ]['bracket_closer'];
			}
		}

		return $args;
	}

	/**
	 * Check a token for being a domain.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $start Starting token.
	 * @param int  $end Ending token.
	 */
	private function checkDomain( File $phpcsFile, $start, $end ) {
		$tokens = $phpcsFile->getTokens();

		$code = $start === $end ? $tokens[ $start ]['code'] : 'expression';

		// For some reason double-quoted strings come in as T_CONSTANT_ENCAPSED_STRING if
		// they don't have any variable interpolations.
		if ( T_CONSTANT_ENCAPSED_STRING === $code && '"' === $tokens[ $start ]['content'][0] ) {
			$code = T_DOUBLE_QUOTED_STRING;
		}

		if ( T_CONSTANT_ENCAPSED_STRING === $code ) {
			$content = strtr(
				substr( $tokens[ $start ]['content'], 1, -1 ),
				array(
					"\\'"  => "'",
					'\\\\' => '\\',
				)
			);
		} elseif ( T_DOUBLE_QUOTED_STRING === $code ) {
			$hasvar  = false;
			$content = preg_replace_callback(
				'/\\\\([0-7]{1,3}|x[0-9A-Fa-f]{1,2}|u\{[0-9A-Fa-f]+\}|.)|\$[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*/',
				function ( $m ) use ( &$hasvar ) {
					if ( '$' === $m[0][0] ) {
						$hasvar = $hasvar ? $hasvar : $m[0];
						return $m[0];
					}
					if ( strlen( $m[1] ) === 1 ) {
						return $m[1];
					}
					if ( 'x' === $m[1][0] ) {
						return chr( hexdec( substr( $m[1], 1 ) ) );
					}
					if ( 'u' === $m[1][0] ) {
						$codepoint = hexdec( substr( $m[1], 2, -1 ) );
						if ( function_exists( 'mb_chr' ) ) {
							// phpcs:ignore PHPCompatibility.FunctionUse.NewFunctions.mb_chrFound
							return mb_chr( $codepoint, 'UTF-8' );
						}
						return mb_convert_encoding( pack( 'N', $codepoint ), 'UTF-8', 'UTF-32BE' );
					}
					return chr( octdec( $m[1] ) );
				},
				substr( $tokens[ $start ]['content'], 1, -1 )
			);
			if ( $hasvar ) {
				$phpcsFile->addError( 'The domain must not contain interpolated variables. Found %s.', $start, 'InterpolatedVariable', array( $hasvar ) );
				return;
			}
		} else {
			// Some non-literal.
			$phpcsFile->addError( 'Domain is not a string literal.', $start, 'DomainNotLiteral' );
			return;
		}

		$domains = array_values( (array) $this->text_domain );
		if ( ! in_array( $content, $domains, true ) ) {
			$fix = $phpcsFile->addError(
				'Mismatched text domain. Expected \'%s\' but got \'%s\'.',
				$start,
				'TextDomainMismatch',
				array(
					implode( "' or '", $domains ),
					$content,
				),
				0,
				count( $domains ) === 1
			);
			if ( $fix && count( $domains ) === 1 ) {
				$phpcsFile->fixer->replaceToken( $start, "'" . addcslashes( $domains[0], "'\\" ) . "'" );
			}
		}
	}

}
