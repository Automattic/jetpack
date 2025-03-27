<?php
/**
 * Utility class with functions for navigating token streams.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Codesniffer\Utils;

use PHP_CodeSniffer\Files\File;

/**
 * Utility class with functions for navigating token streams.
 */
class Navigation {

	/**
	 * Find the start of a run of tokens.
	 *
	 * This is fairly similar to `$phpcsFile->findPrevious( $types, $start, $end, true, null, true )`
	 * but has been updated to work with attributes and returns the earliest
	 * matching token rather than the token before that.
	 *
	 * For paired tokens, such as `T_ATTRIBUTE` / `T_ATTRIBUTE_END`, only
	 * the end token needs to be included in `$types`. The corresponding start
	 * token will be returned if appropriate.
	 *
	 * @param File             $phpcsFile The file where the token was found.
	 * @param int|string|array $types   The type(s) of tokens in the run.
	 * @param int              $start   The position to start searching from in the token stack.
	 * @param int|null         $end     The end position to fail if no token is found. if not specified or null, end will default to the start of the token stack.
	 *                                  If all tokens up to and including `$end` are in the run, `$end` is returned.
	 * @return int|false Position of the first token in the run, or false if `$start` is not in `$types`.
	 */
	public static function findStartOfRun( File $phpcsFile, $types, $start, $end = null ) {
		$tokens = $phpcsFile->getTokens();
		$types  = (array) $types;
		$types  = array_combine( $types, $types );

		if ( $end === null ) {
			$end = 0;
		}

		for ( $i = $start; $i >= $end; $i-- ) {
			if ( ! isset( $types[ $tokens[ $i ]['code'] ] ) ) {
				return $i === $start ? false : $i + 1;
			}

			// Handle any closer generically, instead of hardcoding a list like findPrevious() does.
			foreach ( $tokens[ $i ] as $k => $v ) {
				if ( str_ends_with( $k, '_opener' ) ) {
					$k2 = substr( $k, 0, -7 ) . '_closer';
					if ( isset( $tokens[ $v ][ $k2 ] ) && $tokens[ $v ][ $k2 ] === $i ) {
						$i = $v;
						break;
					}
				}
			}
		}

		return isset( $types[ $tokens[ $end ]['code'] ] ) ? $end : false;
	}

	/**
	 * Find the end of a run of tokens.
	 *
	 * This is fairly similar to `$phpcsFile->findNext( $types, $start, $end, true, null, true )`
	 * but has been updated to work with attributes and returns the earliest
	 * matching token rather than the token before that.
	 *
	 * For paired tokens, such as `T_ATTRIBUTE` / `T_ATTRIBUTE_END`, only
	 * the start token needs to be included in `$types`. The corresponding end
	 * token will be returned if appropriate.
	 *
	 * @param File             $phpcsFile The file where the token was found.
	 * @param int|string|array $types   The type(s) of tokens in the run.
	 * @param int              $start   The position to start searching from in the token stack.
	 * @param int|null         $end     The end position to fail if no token is found. if not specified or null, end will default to the end of the token stack.
	 *                                  If all tokens up to and including `$end` are in the run, `$end` is returned.
	 * @return int|false Position of the first token in the run, or false if `$start` is not in `$types`.
	 */
	public static function findEndOfRun( File $phpcsFile, $types, $start, $end = null ) {
		$tokens = $phpcsFile->getTokens();
		$types  = (array) $types;
		$types  = array_combine( $types, $types );

		if ( $end === null ) {
			$end = $phpcsFile->numTokens;
		}

		for ( $i = $start; $i <= $end; $i++ ) {
			if ( ! isset( $types[ $tokens[ $i ]['code'] ] ) ) {
				return $i === $start ? false : $i - 1;
			}

			// Handle any opener generically, instead of hardcoding a list like findNext() does.
			foreach ( $tokens[ $i ] as $k => $v ) {
				if ( str_ends_with( $k, '_closer' ) ) {
					$k2 = substr( $k, 0, -7 ) . '_opener';
					if ( isset( $tokens[ $v ][ $k2 ] ) && $tokens[ $v ][ $k2 ] === $i ) {
						$i = $v;
						break;
					}
				}
			}
		}

		return isset( $types[ $tokens[ $end ]['code'] ] ) ? $end : false;
	}

	/**
	 * Find a token in a run of tokens.
	 *
	 * This is a little like `$phpcsFile->findPrevious( $types, $start, $end, false, $value, true )`
	 * but it will fail when a token not in `$runTypes` is reached.
	 *
	 * For paired tokens, such as `T_ATTRIBUTE` / `T_ATTRIBUTE_END`, only
	 * the end token needs to be included in `$runTypes`. Tokens in between a
	 * start/end pair are not checked.
	 *
	 * @param File             $phpcsFile The file where the token was found.
	 * @param int|string|array $types     The type(s) of tokens to find.
	 * @param int|string|array $runTypes  The type(s) of tokens in the run.
	 * @param int              $start     The position to start searching from in the token stack.
	 * @param int|null         $end       The end position to fail if no token is found. if not specified or null, end will default to the start of the token stack.
	 * @param string|null      $value   The value that the token(s) must be equal to. If value is omitted, tokens with any value will be returned.
	 * @return int|false Position of the first token in the run, or false if `$start` is not in `$types`.
	 */
	public static function findPreviousInRun( File $phpcsFile, $types, $runTypes, $start, $end = null, $value = null ) {
		$tokens   = $phpcsFile->getTokens();
		$types    = (array) $types;
		$types    = array_combine( $types, $types );
		$runTypes = (array) $runTypes;
		$runTypes = array_combine( $runTypes, $runTypes );

		if ( $end === null ) {
			$end = 0;
		}

		for ( $i = $start; $i >= $end; $i-- ) {
			if ( isset( $types[ $tokens[ $i ]['code'] ] ) && ( $value === null || $tokens[ $i ]['content'] === $value ) ) {
				return $i;
			}

			if ( ! isset( $runTypes[ $tokens[ $i ]['code'] ] ) ) {
				return false;
			}

			// Handle any closer generically, instead of hardcoding a list like findPrevious() does.
			foreach ( $tokens[ $i ] as $k => $v ) {
				if ( str_ends_with( $k, '_opener' ) ) {
					$k2 = substr( $k, 0, -7 ) . '_closer';
					if ( isset( $tokens[ $v ][ $k2 ] ) && $tokens[ $v ][ $k2 ] === $i ) {
						$i = $v;
						if ( isset( $types[ $tokens[ $i ]['code'] ] ) && ( $value === null || $tokens[ $i ]['content'] === $value ) ) {
							return $i;
						}
						break;
					}
				}
			}
		}

		return false;
	}

	/**
	 * Find a token in a run of tokens.
	 *
	 * This is a little like `$phpcsFile->findNext( $types, $start, $end, false, $value, true )`
	 * but it will fail when a token not in `$runTypes` is reached.
	 *
	 * For paired tokens, such as `T_ATTRIBUTE` / `T_ATTRIBUTE_END`, only
	 * the start token needs to be included in `$runTypes`. Tokens in between a
	 * start/end pair are not checked.
	 *
	 * @param File             $phpcsFile The file where the token was found.
	 * @param int|string|array $types     The type(s) of tokens to find.
	 * @param int|string|array $runTypes  The type(s) of tokens in the run.
	 * @param int              $start     The position to start searching from in the token stack.
	 * @param int|null         $end       The end position to fail if no token is found. if not specified or null, end will default to the end of the token stack.
	 * @param string|null      $value   The value that the token(s) must be equal to. If value is omitted, tokens with any value will be returned.
	 * @return int|false Position of the first token in the run, or false if `$start` is not in `$types`.
	 */
	public static function findNextInRun( File $phpcsFile, $types, $runTypes, $start, $end = null, $value = null ) {
		$tokens   = $phpcsFile->getTokens();
		$types    = (array) $types;
		$types    = array_combine( $types, $types );
		$runTypes = (array) $runTypes;
		$runTypes = array_combine( $runTypes, $runTypes );

		if ( $end === null ) {
			$end = $phpcsFile->numTokens;
		}

		for ( $i = $start; $i <= $end; $i++ ) {
			if ( isset( $types[ $tokens[ $i ]['code'] ] ) && ( $value === null || $tokens[ $i ]['content'] === $value ) ) {
				return $i;
			}

			if ( ! isset( $runTypes[ $tokens[ $i ]['code'] ] ) ) {
				return false;
			}

			// Handle any closer generically, instead of hardcoding a list like findPrevious() does.
			foreach ( $tokens[ $i ] as $k => $v ) {
				if ( str_ends_with( $k, '_closer' ) ) {
					$k2 = substr( $k, 0, -7 ) . '_opener';
					if ( isset( $tokens[ $v ][ $k2 ] ) && $tokens[ $v ][ $k2 ] === $i ) {
						$i = $v;
						if ( isset( $types[ $tokens[ $i ]['code'] ] ) && ( $value === null || $tokens[ $i ]['content'] === $value ) ) {
							return $i;
						}
						break;
					}
				}
			}
		}

		return false;
	}
}
