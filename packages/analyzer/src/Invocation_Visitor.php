<?php

namespace Automattic\Jetpack\Analyzer;

use PhpParser\NodeVisitorAbstract;
use PhpParser\Node;

class Invocation_Visitor extends NodeVisitorAbstract {
	public $analyzer;

	public function __construct( $analyzer ) {
		$this->analyzer = $analyzer;
	}

	public function enterNode( Node $node ) {

		// if ( $node instanceof Node\Stmt\Class_ ) {
		// 	$this->current_class = $node->name->name;
		// 	$this->add( new Class_Declaration( $this->current_relative_path, $node->getLine(), $node->name->name ) );
		// }
		// if ( $node instanceof Node\Stmt\Property && $node->isPublic() ) {
		// 	$this->add( new Class_Property_Declaration( $this->current_relative_path, $node->getLine(), $this->current_class, $node->props[0]->name->name, $node->isStatic() ) );
		// }
		// if ( $node instanceof Node\Stmt\ClassMethod && $node->isPublic() ) {
		// 	// ClassMethods are also listed inside interfaces, which means current_class is null
		// 	// so we ignore these
		// 	if ( ! $this->current_class ) {
		// 		return;
		// 	}
		// 	$method = new Class_Method_Declaration( $this->current_relative_path, $node->getLine(), $this->current_class, $node->name->name, $node->isStatic() );
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