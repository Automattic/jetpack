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

	/**
	 * Gets string representation of the Node's class
	 *
	 * @param Node $node Node.
	 * @param any  $class_for_self Class reference.
	 * @return string
	 */
	public static function node_to_class_name( $node, $class_for_self = null ) {
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

			$dim_val = '';
			if ( $node->dim instanceof Node\Expr\Variable ) {
				$dim_val = '[$' . self::maybe_stringify( $node->dim->name ) . ']';
			} elseif ( $node->dim instanceof Node\Expr\PropertyFetch ) {
				$dim_val = '[$' . self::maybe_stringify( $node->dim->var->name ) . ']';
			} elseif ( $node->dim instanceof Node\Expr\ArrayDimFetch ) {
				$dim_val = '[$' . self::maybe_stringify( $node->dim->var->name ) . '["' . self::maybe_stringify( $node->dim->dim->value ) . '"]]';
			} else {
				$dim_val = '[' . self::maybe_stringify( $node->dim->value ) . ']';
			}
			$class_name = '$' . self::maybe_stringify( $node->var->name ) . $dim_val;
		} else {
			if ( method_exists( $node, 'toCodeString' ) ) {
				$class_name = $node->toCodeString();
			} else {
				$class_name = get_class( $node );
			}
		}

		if ( $class_name === '\\self' && ! is_null( $class_for_self ) ) {
			$class_name = $class_for_self;
		}

		return $class_name;
	}

		/**
		 * Get string representation of a passed object
		 *
		 * @param any $object Any object type.
		 * @return string
		 */
	public static function maybe_stringify( $object ) {
		$is_stringifiable = (
			is_numeric( $object )
			|| is_string( $object )
			|| (
				is_object( $object )
				&& method_exists( $object, '__toString' )
			)
		);

		if ( $is_stringifiable ) {
			return (string) $object;
		}

		if ( is_null( $object ) ) {
			return '';
		}

		// Objects that need additional recursion to properly stringify
		// are of no interest to us because we won't know what classes
		// or methods they use without runtime analysis.
		return get_class( $object );
	}

	/**
	 * Check if a node has a docblock containing a specific comment string.
	 *
	 * @param PhpParser/Node $node    Current node we are parsing.
	 * @param string         $comment Comment to match.
	 * @return boolean
	 */
	public static function has_doc_comment( $node, $comment ) {
		if ( $node->getDocComment() && false !== strpos( $node->getDocComment(), $comment ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Check if a node contains a call to a function name.
	 * Any part of the function name will be matched.
	 *
	 * @param PhpParser/Node $node Current node we are parsing.
	 * @param string         $name Function name to match.
	 * @return boolean
	 */
	public static function has_function_call( $node, $name ) {
		if ( empty( $node->getStmts() ) ) {
			return false;
		}

		foreach ( $node->getStmts() as $stmt ) {
			if ( ! $stmt instanceof Node\Stmt\Expression || ! $stmt->expr instanceof Node\Expr\FuncCall ) {
				continue;
			}
			if ( false !== strpos( $stmt->expr->name->toCodeString(), $name ) ) {
				return true;
			}
		}

		return false;
	}

}
