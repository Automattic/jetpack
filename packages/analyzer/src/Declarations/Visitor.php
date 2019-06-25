<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

use PhpParser\NodeVisitorAbstract;
use PhpParser\Node;

class Visitor extends NodeVisitorAbstract {
	private $current_class;
	private $declarations;
	private $current_relative_path;

	public function __construct( $current_relative_path, $declarations ) {
		$this->current_relative_path = $current_relative_path;
		$this->declarations = $declarations;
		$this->current_class = null;
	}

	public function enterNode( Node $node ) {

		if ( $node instanceof Node\Stmt\Class_ ) {
			$namespaced_name = '\\' . implode( '\\', $node->namespacedName->parts );
			$this->current_class = $namespaced_name;

			$this->declarations->add( new Class_( $this->current_relative_path, $node->getLine(), $namespaced_name ) );
			return;
		}

		if ( $node instanceof Node\Stmt\Property && $node->isPublic() ) {
			$this->declarations->add( new Class_Property( $this->current_relative_path, $node->getLine(), $this->current_class, $node->props[0]->name->name, $node->isStatic() ) );
			return;
		}

		if ( $node instanceof Node\Stmt\ClassMethod && $node->isPublic() ) {
			// ClassMethods are also listed inside interfaces, which means current_class is null
			// so we ignore these
			if ( ! $this->current_class ) {
				return;
			}
			$method = new Class_Method( $this->current_relative_path, $node->getLine(), $this->current_class, $node->name->name, $node->isStatic() );
			foreach ( $node->getParams() as $param ) {
				$method->add_param( $param->var->name, $param->default, $param->type, $param->byRef, $param->variadic );
			}
			$this->declarations->add( $method );
			return;
		}

		if ( $node instanceof Node\Stmt\Function_ ) {
			$function = new Function_( $this->current_relative_path, $node->getLine(), $node->name->name );
			foreach ( $node->getParams() as $param ) {
				$function->add_param( $param->var->name, $param->default, $param->type, $param->byRef, $param->variadic );
			}
			$this->declarations->add( $function  );
			return;
		}
	}

	public function leaveNode( Node $node ) {
		if ( $node instanceof Node\Stmt\Class_ ) {
			$this->current_class = null;
		}
	}
}