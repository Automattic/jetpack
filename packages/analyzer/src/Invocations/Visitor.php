<?php

namespace Automattic\Jetpack\Analyzer\Invocations;

use PhpParser\NodeVisitorAbstract;
use PhpParser\Node;
use Automattic\Jetpack\Analyzer\Utils;

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
				$function_name = '$' . Utils::maybe_stringify( $node->name->var->name ) . '[' . Utils::maybe_stringify( $node->name->dim->value ) . ']';
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
