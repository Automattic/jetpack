<?php

namespace Automattic\Jetpack\Analyzer\Invocations;

use PhpParser\NodeVisitorAbstract;
use PhpParser\Node;

class Visitor extends NodeVisitorAbstract {
	private $invocations;
	private $file_path;

	public function __construct( $file_path, $invocations ) {
		$this->file_path   = $file_path;
		$this->invocations = $invocations;
	}

	public function enterNode( Node $node ) {
		if ( $node instanceof Node\Expr\New_ ) {
			$this->invocations->add(
				new New_( $this->file_path, $node->getLine(), $this->node_to_class_name( $node->class ) )
			);
		} elseif ( $node instanceof Node\Expr\StaticCall ) {
			// TODO - args
			$this->invocations->add(
				new Static_Call( $this->file_path, $node->getLine(), $this->node_to_class_name( $node->class ), $node->name->name )
			);
		} elseif ( $node instanceof Node\Expr\StaticPropertyFetch ) {
			$this->invocations->add(
				new Static_Property( $this->file_path, $node->getLine(), $this->node_to_class_name( $node->class ), $node->name->name )
			);
		} elseif ( $node instanceof Node\Expr\FuncCall ) {
			// TODO - args
			if ( $node->name instanceof Node\Expr\Variable ) {
				$function_name = '$' . $this->maybe_stringify( $node->name->name );
			} else {
				$function_name = implode( '\\', $node->name->parts );
			}

			$this->invocations->add( new Function_Call( $this->file_path, $node->getLine(), $function_name ) );
		} elseif ( $node instanceof Node\Expr\ClassConstFetch ) {
			$this->invocations->add(
				new Static_Const( $this->file_path, $node->getLine(), $this->node_to_class_name( $node->class ), $node->name->name )
			);
		} else {
			// print_r( $node );
		}
	}

	public function leaveNode( Node $node ) {
	}

	private function node_to_class_name( $node ) {
		if ( $node instanceof Node\Expr\Variable
			|| $node instanceof Node\Stmt\Class_ ) {
			$class_name = $node->name;
		} elseif ( $node instanceof Node\Name ) {
			$class_name = '\\' . implode( '\\', $node->parts );
		} elseif ( $node instanceof Node\Expr\PropertyFetch ) {
			$class_name =
						'$'
						. $this->maybe_stringify( $node->var->name )
						. '->' . $this->maybe_stringify( $node->name->name );
		} elseif ( $node instanceof Node\Expr\ArrayDimFetch ) {

			$class_name =
						'$'
						. $this->maybe_stringify( $node->var->name )
						. '[' . $this->maybe_stringify( $node->dim->value )
						. ']';
		} else {
			if ( method_exists( $node, 'toCodeString' ) ) {
				$class_name = $node->toCodeString();
			} else {
				$class_name = get_class( $node );
			}
		}

		return $class_name;
	}

	private function maybe_stringify( $object ) {
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
