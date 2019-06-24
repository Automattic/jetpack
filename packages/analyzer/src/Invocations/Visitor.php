<?php

namespace Automattic\Jetpack\Analyzer\Invocations;

use PhpParser\NodeVisitorAbstract;
use PhpParser\Node;

class Visitor extends NodeVisitorAbstract {
	private $invocations;
	private $file_path;

	public function __construct( $file_path, $invocations ) {
		$this->file_path = $file_path;
		$this->invocations = $invocations;
	}

	public function enterNode( Node $node ) {
		if ( $node instanceof Node\Expr\New_ ) {
			$this->invocations->add( new New_( $this->file_path, $node->getLine(), $node->class->toCodeString() ) );
		} elseif( $node instanceof Node\Expr\StaticCall ) {
			$this->invocations->add( new Static_Call( $this->file_path, $node->getLine(), $node->class->toCodeString(), $node->name->name ) );
		} else {
			// print_r( $node );
		}
	}

	public function leaveNode( Node $node ) {
	}
}