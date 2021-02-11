<?php

namespace Automattic\Jetpack\Analyzer\Invocations;

use Automattic\Jetpack\Analyzer\Utils;
use PhpParser\Node;
use PhpParser\NodeVisitorAbstract;

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
				new New_( $this->file_path, $node->getLine(), Utils::node_to_class_name( $node->class ) )
			);
		} elseif ( $node instanceof Node\Expr\StaticCall ) {
			// TODO - args
			$this->invocations->add(
				new Static_Call( $this->file_path, $node->getLine(), Utils::node_to_class_name( $node->class ), $node->name->name )
			);
		} elseif ( $node instanceof Node\Expr\StaticPropertyFetch ) {
			$this->invocations->add(
				new Static_Property( $this->file_path, $node->getLine(), Utils::node_to_class_name( $node->class ), $node->name->name )
			);
		} elseif ( $node instanceof Node\Expr\FuncCall ) {
			// TODO - args
			if ( $node->name instanceof Node\Expr\Variable ) {
				$function_name = '$' . Utils::maybe_stringify( $node->name->name );
			} elseif ( $node->name instanceof Node\Expr\ArrayDimFetch ) {
				$dimension = false;
				if ( isset( $node->name->dim->value ) ) {
					$dimension = $node->name->dim->value;
				} elseif ( isset( $node->name->dim->name ) ) {
					$dimension = $node->name->dim->name;
				} else {
					trigger_error( 'Unable to find the array dimension name' ); // phpcs:ignore
				}
				$function_name = '$' . Utils::maybe_stringify( $node->name->var->name ) . '[' . Utils::maybe_stringify( $dimension ) . ']';
			} elseif ( $node->name instanceof Node\Expr\Closure ) {
				$function_name = 'Anonymous Closure';
			} elseif ( $node->name instanceof Node\Expr\New_ ) {
				$this->enterNode( $node->name );
				$function_name = 'new ' . Utils::node_to_class_name( $node->name->class );
			} elseif ( $node->name instanceof Node\Expr\PropertyFetch ) {
				$function_name = $node->name->var->name . '->' . $node->name->name->name;
			} elseif ( $node->name instanceof Node\Expr\FuncCall ) {
				$this->enterNode( $node->name );
				$function_name = $node->name->name;
			} elseif ( $node->name instanceof Node\Expr\MethodCall ) {
				$this->enterNode( $node->name );
				$function_name = $node->name->var->name . '->' . $node->name->name->name;
			} else {
				$function_name = implode( '\\', $node->name->parts );
			}

			$this->invocations->add( new Function_Call( $this->file_path, $node->getLine(), $function_name ) );
		} elseif ( $node instanceof Node\Expr\ClassConstFetch ) {
			$this->invocations->add(
				new Static_Const( $this->file_path, $node->getLine(), Utils::node_to_class_name( $node->class ), $node->name->name )
			);
		} else {
			// print_r( $node );
		}
	}

	public function leaveNode( Node $node ) {
	}
}
