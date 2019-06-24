<?php

namespace Automattic\Jetpack\Analyzer;

use PhpParser\NodeVisitorAbstract;
use PhpParser\Node;

class Declaration_Visitor extends NodeVisitorAbstract {
	private $current_class;
	private $declarations;
	private $current_relative_path;

	public function __construct( $current_relative_path, $declarations ) {
		$this->current_relative_path = $current_relative_path;
		$this->declarations = $declarations;
	}

	public function enterNode( Node $node ) {
		if ( $node instanceof Node\Stmt\Class_ ) {
			// $this->current_class = $node->name->name;
			$this->current_class = implode( '\\', $node->namespacedName->parts );

			$this->declarations->add( new Class_Declaration( $this->current_relative_path, $node->getLine(), $node->name->name ) );
		}
		if ( $node instanceof Node\Stmt\Property && $node->isPublic() ) {
			$this->declarations->add( new Class_Property_Declaration( $this->current_relative_path, $node->getLine(), $this->current_class, $node->props[0]->name->name, $node->isStatic() ) );
		}
		if ( $node instanceof Node\Stmt\ClassMethod && $node->isPublic() ) {
			// ClassMethods are also listed inside interfaces, which means current_class is null
			// so we ignore these
			if ( ! $this->current_class ) {
				return;
			}
			$method = new Class_Method_Declaration( $this->current_relative_path, $node->getLine(), $this->current_class, $node->name->name, $node->isStatic() );
			foreach ( $node->getParams() as $param ) {
				$method->add_param( $param->var->name, $param->default, $param->type, $param->byRef, $param->variadic );
			}
			$this->declarations->add( $method );
		}
		if ( $node instanceof Node\Stmt\Function_ ) {
			$function = new Function_Declaration( $this->current_relative_path, $node->getLine(), $node->name->name );
			foreach ( $node->getParams() as $param ) {
				$function->add_param( $param->var->name, $param->default, $param->type, $param->byRef, $param->variadic );
			}
			$this->declarations->add( $function  );
		}
	}

	public function leaveNode( Node $node ) {
		if ( $node instanceof Node\Stmt\Class_ ) {
			$this->current_class = null;
		}
	}
}