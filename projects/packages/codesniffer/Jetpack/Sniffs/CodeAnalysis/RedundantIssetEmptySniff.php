<?php
/**
 * Sniff for redundant pairings of `isset()` and `empty()` on the same argument.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\CodeAnalysis;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Util\Tokens;

/**
 * Flags redundant pairings of `isset()` and `empty()` on the same argument.
 */
class RedundantIssetEmptySniff implements Sniff {

	/**
	 * Token types this sniff is interested in.
	 *
	 * @return int[]
	 */
	public function register() {
		return array( T_BOOLEAN_AND, T_BOOLEAN_OR, T_LOGICAL_AND, T_LOGICAL_OR );
	}

	/**
	 * Process a `&&` / `and` or `||` / `or` token and inspect its left and right operands.
	 *
	 * @param File $phpcs_file File being scanned.
	 * @param int  $stack_ptr  Position of the operator token.
	 */
	public function process( File $phpcs_file, $stack_ptr ) {
		$left  = $this->parse_left( $phpcs_file, $stack_ptr );
		$right = $this->parse_right( $phpcs_file, $stack_ptr );
		if ( ! $left || ! $right || $left['argument'] !== $right['argument'] ) {
			return;
		}

		// Normalize operand order.
		$pair = array( $left['type'], $right['type'] );
		sort( $pair );

		$op_code = $phpcs_file->getTokens()[ $stack_ptr ]['code'];
		$is_and  = T_BOOLEAN_AND === $op_code || T_LOGICAL_AND === $op_code;

		if ( $is_and && array( 'isset', 'not_empty' ) === $pair ) {
			$error_code = 'RedundantIsset';
			$message    = '`! empty( %s )` already implies `isset( %s )`. The `isset()` check is redundant; use `! empty( %s )` alone.';
		} elseif ( $is_and && array( 'empty', 'not_isset' ) === $pair ) {
			$error_code = 'RedundantEmpty';
			$message    = '`! isset( %s )` already implies `empty( %s )`. The `empty()` check is redundant; use `! isset( %s )` alone.';
		} elseif ( ! $is_and && array( 'empty', 'not_isset' ) === $pair ) {
			$error_code = 'RedundantNotIsset';
			$message    = '`empty( %s )` already covers `! isset( %s )`. The `! isset()` check is redundant; use `empty( %s )` alone.';
		} elseif ( ! $is_and && array( 'isset', 'not_empty' ) === $pair ) {
			$error_code = 'RedundantNotEmpty';
			$message    = '`isset( %s )` already covers `! empty( %s )`. The `! empty()` check is redundant; use `isset( %s )` alone.';
		} else {
			return;
		}

		$arg = $left['argument'];
		$phpcs_file->addWarning( $message, $stack_ptr, $error_code, array( $arg, $arg, $arg ) );
	}

	/**
	 * Parse the left side of an operator.
	 *
	 * Looks back in this order:
	 *   `!` <- `func` <- `(` <- `)`
	 *
	 * @param File $phpcs_file File being scanned.
	 * @param int  $op_ptr     Position of the `&&` or `||` token.
	 *
	 * @return array{type:string,argument:string}|null
	 */
	private function parse_left( File $phpcs_file, $op_ptr ) {
		$tokens = $phpcs_file->getTokens();
		$close  = $phpcs_file->findPrevious( Tokens::$emptyTokens, $op_ptr - 1, null, true );
		if (
			! $close // no previous token
			|| T_CLOSE_PARENTHESIS !== $tokens[ $close ]['code'] // previous token isn't a closed parenthesis
			|| ! isset( $tokens[ $close ]['parenthesis_opener'] ) // previous closed parenthesis doesn't have an opening match
		) {
			return null;
		}
		$open = $tokens[ $close ]['parenthesis_opener'];
		$func = $phpcs_file->findPrevious( Tokens::$emptyTokens, $open - 1, null, true );
		if ( false === $func ) {
			return null;
		}
		$bang    = $phpcs_file->findPrevious( Tokens::$emptyTokens, $func - 1, null, true );
		$has_bang = false !== $bang && T_BOOLEAN_NOT === $tokens[ $bang ]['code'];

		return $this->analyze( $phpcs_file, $func, $open, $close, $has_bang );
	}

	/**
	 * Parse the right side of an operator.
	 * 
	 * Looks forward in this order:
	 *   `!` -> `func` -> `(` -> `)`
	 *
	 * @param File $phpcs_file File being scanned.
	 * @param int  $op_ptr     Position of the `&&` or `||` token.
	 *
	 * @return array{type:string,argument:string}|null
	 */
	private function parse_right( File $phpcs_file, $op_ptr ) {
		$tokens  = $phpcs_file->getTokens();
		$func    = $phpcs_file->findNext( Tokens::$emptyTokens, $op_ptr + 1, null, true );
		$has_bang = false;

		// If it's actually a bang, let's record it and track down the actual function.
		if ( $func && T_BOOLEAN_NOT === $tokens[ $func ]['code'] ) {
			$has_bang = true;
			$func    = $phpcs_file->findNext( Tokens::$emptyTokens, $func + 1, null, true );
		}
		if ( ! $func ) {
			return null;
		}
		$open = $phpcs_file->findNext( Tokens::$emptyTokens, $func + 1, null, true );
		if (
			! $open // no next token
			|| T_OPEN_PARENTHESIS !== $tokens[ $open ]['code'] // next token isn't an open parenthesis
			|| ! isset( $tokens[ $open ]['parenthesis_closer'] ) // next open parenthesis doesn't have a closing match
		) {
			return null;
		}
		return $this->analyze( $phpcs_file, $func, $open, $tokens[ $open ]['parenthesis_closer'], $has_bang );
	}

	/**
	 * Analyze a function call. Returns null if the token
	 * isn't isset/empty or if the call has multiple arguments.
	 *
	 * @param File $phpcs_file File being scanned.
	 * @param int  $func_ptr   Position of the `isset`/`empty` token.
	 * @param int  $open_ptr   Position of the matching `(`.
	 * @param int  $close_ptr  Position of the matching `)`.
	 * @param bool $has_bang   Whether the call is negated by `!`.
	 *
	 * @return array{type:string,argument:string}|null
	 */
	private function analyze( File $phpcs_file, $func_ptr, $open_ptr, $close_ptr, $has_bang ) {
		$tokens    = $phpcs_file->getTokens();
		$func_code = $tokens[ $func_ptr ]['code'];

		// If it's not a function we care about, abort.
		if ( T_ISSET !== $func_code && T_EMPTY !== $func_code ) {
			return null;
		}

		$parts = array();
		$depth = 0;
		for ( $i = $open_ptr + 1; $i < $close_ptr; $i++ ) {
			$code = $tokens[ $i ]['code'];
			if ( T_COMMA === $code && 0 === $depth ) {
				return null; // Multi-arg isset() doesn't have a multi-arg empty() counterpart.
			}
			if ( T_OPEN_PARENTHESIS === $code || T_OPEN_SHORT_ARRAY === $code || T_OPEN_SQUARE_BRACKET === $code ) {
				++$depth;
			} elseif ( T_CLOSE_PARENTHESIS === $code || T_CLOSE_SHORT_ARRAY === $code || T_CLOSE_SQUARE_BRACKET === $code ) {
				--$depth;
			}
			if ( ! in_array( $code, Tokens::$emptyTokens, true ) ) {
				$parts[] = $tokens[ $i ]['content'];
			}
		}
		$argument = implode( '', $parts );
		if ( '' === $argument ) {
			return null;
		}

		$base = T_ISSET === $func_code ? 'isset' : 'empty';
		return array(
			'type'     => $has_bang ? "not_$base" : $base,
			'argument' => $argument,
		);
	}
}
