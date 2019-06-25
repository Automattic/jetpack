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
			if (
				$node->class instanceof Node\Expr\Variable
				|| $node->class instanceof Node\Stmt\Class_
			) {
				$this->invocations->add(
					new New_( $this->file_path, $node->getLine(), $node->class->name )
				);
			} else {
				$this->invocations->add(
					new New_( $this->file_path, $node->getLine(), $node->class->toCodeString() )
				);
			}
		} elseif ( $node instanceof Node\Expr\StaticCall ) {
			// TODO - args
			$this->invocations->add( new Static_Call( $this->file_path, $node->getLine(), $node->class->toCodeString(), $node->name->name ) );
		} elseif ( $node instanceof Node\Expr\StaticPropertyFetch ) {
			$this->invocations->add( new Static_Property( $this->file_path, $node->getLine(), $node->class->toCodeString(), $node->name->name ) );
		} elseif ( $node instanceof Node\Expr\FuncCall ) {
			// TODO - args

			if ( $node->name instanceof Node\Expr\Variable ) {
				$function_name = '$' . $node->name->name;
			} else {
				$function_name = implode( '\\', $node->name->parts );
			}

			$this->invocations->add( new Function_Call( $this->file_path, $node->getLine(), $function_name ) );
		} else {
			// print_r( $node );
		}
	}

	public function leaveNode( Node $node ) {
	}
}
