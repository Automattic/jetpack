<?php
/**
 * A function to replace PHPUnit's `->withConsecutive()`.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\Constraint\Callback;
use PHPUnit\Framework\Constraint\Constraint;
use PHPUnit\Framework\Constraint\IsEqual;

/**
 * Reimplement `withConsecutive` for PHPUnit.
 *
 * Unfortunately PHPUnit deprecated withConsecutive with no replacement, so we
 * have to roll our own version.
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4026
 *
 * Where previously you'd have done like
 * ```
 * ->withConsecutive(
 *   [ first, call, args ],
 *   [ second, call, args ],
 *   [ and, so, on ]
 * )
 * ```
 * you can do like this now
 * ```
 * ->with( ...with_consecutive(
 *   [ first, call, args ],
 *   [ second, call, args ],
 *   [ and, so, on ]
 * ) )
 * ```
 *
 * @param array ...$args Sets of arguments as you'd have passed to `->withConsecutive()`.
 * @return Constraint[] Array of constraints to pass to `->with()`.
 * @throws InvalidArgumentException If arguments are invalid.
 */
function with_consecutive( ...$args ) {
	if ( ! $args ) {
		throw new InvalidArgumentException( 'Must pass at least one set of arguments' );
	}

	$ct         = count( $args[0] );
	$value_sets = array();
	foreach ( $args as $group ) {
		if ( count( $group ) !== $ct ) {
			throw new InvalidArgumentException( 'All sets of arguments must be the same length' );
		}
		for ( $i = 0; $i < $ct; $i++ ) {
			$value_sets[ $i ][] = $group[ $i ] instanceof Constraint ? $group[ $i ] : new IsEqual( $group[ $i ] );
		}
	}
	$funcs = array();
	for ( $i = 0; $i < $ct; $i++ ) {
		$funcs[] = new Callback(
			function ( $value ) use ( $value_sets, $i ) {
				static $set = null;
				$set        = $set ?? $value_sets[ $i ]; // @phan-suppress-current-line PhanTypePossiblyInvalidDimOffset -- False positive.
				if ( ! $set ) {
					$n = count( $value_sets[ $i ] ); // @phan-suppress-current-line PhanTypePossiblyInvalidDimOffset -- False positive.
					throw new InvalidArgumentException( "More calls than argument sets. Use `->expects( \$this->exactly( $n ) )` or the like when mocking the method to avoid this." );
				}
				$expect = array_shift( $set );
				$expect->evaluate( $value );
				return true;
			}
		);
	}
	return $funcs;
}
