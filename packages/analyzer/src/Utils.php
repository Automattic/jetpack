<?php

namespace Automattic\Jetpack\Analyzer;

use PhpParser\Node;

/**
 * Shared code that probably should be a trait
 */
class Utils {
	/**
	 * parses the node used to describe parameter defaults into a string for easy comparison
	 */
	static function get_param_default_as_string( $default, $current_class ) {
		if ( $default instanceof Node\Expr\Array_ ) {
			return 'array()';
		} elseif ( $default instanceof Node\Expr\ConstFetch ) {
			return $default->name->toCodeString();
		} elseif ( $default instanceof Node\Scalar\LNumber || $default instanceof Node\Scalar\DNumber ) {
			return $default->value;
		} elseif ( $default instanceof Node\Scalar\String_ ) {
			return '\'' . $default->value . '\'';
		} elseif ( $default instanceof Node\Expr\UnaryMinus ) {
			return '-' . self::get_param_default_as_string( $default->expr, $current_class );
		} elseif ( $default instanceof Node\Expr\UnaryPlus ) {
			return '+' . self::get_param_default_as_string( $default->expr, $current_class );
		} elseif ( $default instanceof Node\Expr\ClassConstFetch ) {
			return self::node_to_class_name( $default->class, $current_class ) . '::' . $default->name->name;
		} else {
			return $default;
		}
	}

	static function node_to_class_name( $node, $class_for_self = null ) {
		if ( $node instanceof Node\Expr\Variable
			|| $node instanceof Node\Stmt\Class_ ) {
			$class_name = $node->name;
		} elseif ( $node instanceof Node\Name ) {
			$class_name = '\\' . implode( '\\', $node->parts );
		} elseif ( $node instanceof Node\Expr\PropertyFetch ) {
			$class_name =
						'$'
						. self::maybe_stringify( $node->var->name )
						. '->' . self::maybe_stringify( $node->name->name );
		} elseif ( $node instanceof Node\Expr\ArrayDimFetch ) {

			$class_name =
						'$'
						. self::maybe_stringify( $node->var->name )
						. '[' . self::maybe_stringify( $node->dim->value )
						. ']';
		} else {
			if ( method_exists( $node, 'toCodeString' ) ) {
				$class_name = $node->toCodeString();
			} else {
				$class_name = get_class( $node );
			}
		}

		if ( $class_name  === '\\self' && ! is_null( $class_for_self ) ) {
			$class_name = $class_for_self;
		}

		return $class_name;
	}

	static function maybe_stringify( $object ) {
		$is_stringifiable = (
			is_string( $object )
			|| (
				is_object( $object )
				&& method_exists( $object, '__toString' )
			)
		);

		if ( $is_stringifiable ) {
			return (string) $object;
		}

		// Objects that need additional recursion to properly stringify
		// are of no interest to us because we won't know what classes
		// or methods they use without runtime analysis.
		return get_class( $object );
	}
}
