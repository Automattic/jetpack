<?php

namespace Automattic\Jetpack\Analyzer\Invocations;

use PhpParser\NodeVisitorAbstract;
use PhpParser\Node;

class Visitor extends NodeVisitorAbstract {
	public $invocations;

	public function __construct( $invocations ) {
		$this->invocations = $invocations;
	}

	public function enterNode( Node $node ) {

		if ( $node instanceof PhpParser\Node\Expr\New_ ) {
			print_r($node);
		// 	$this->current_class = $node->name->name;
		// 	$this->add( new Declarations\Class_( $this->current_relative_path, $node->getLine(), $node->name->name ) );
		}
		// if ( $node instanceof Node\Stmt\Property && $node->isPublic() ) {
		// 	$this->add( new Declarations\Class_Property( $this->current_relative_path, $node->getLine(), $this->current_class, $node->props[0]->name->name, $node->isStatic() ) );
		// }
		// if ( $node instanceof Node\Stmt\ClassMethod && $node->isPublic() ) {
		// 	// ClassMethods are also listed inside interfaces, which means current_class is null
		// 	// so we ignore these
		// 	if ( ! $this->current_class ) {
		// 		return;
		// 	}
		// 	$method = new Declarations\Class_Method( $this->current_relative_path, $node->getLine(), $this->current_class, $node->name->name, $node->isStatic() );
		// 	foreach ( $node->getParams() as $param ) {
		// 		$method->add_param( $param->var->name, $param->default, $param->type, $param->byRef, $param->variadic );
		// 	}
		// 	$this->add( $method );
		// }
	}

	public function leaveNode( Node $node ) {
		// if ( $node instanceof Node\Stmt\Class_ ) {
		// 	$this->current_class = null;
		// }
	}
}