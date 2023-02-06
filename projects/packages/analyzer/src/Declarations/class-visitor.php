<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

use Automattic\Jetpack\Analyzer\Utils;
use PhpParser\Node;
use PhpParser\NodeVisitorAbstract;

class Visitor extends NodeVisitorAbstract {
	private $current_class;
	private $declarations;
	private $current_relative_path;

	public function __construct( $current_relative_path, $declarations ) {
		$this->current_relative_path = $current_relative_path;
		$this->declarations          = $declarations;
		$this->current_class         = null;
	}

	public function enterNode( Node $node ) {

		if ( $node instanceof Node\Stmt\Class_ ) {
			$namespaced_name     = '\\' . implode( '\\', $node->namespacedName->parts );
			$this->current_class = $namespaced_name;

			$this->declarations->add( new Class_( $this->current_relative_path, $node->getLine(), $namespaced_name ) );
			return;
		}

		if ( $node instanceof Node\Stmt\Property && $node->isPublic() ) {
			$this->declarations->add( new Class_Property( $this->current_relative_path, $node->getLine(), $this->current_class, $node->props[0]->name->name, $node->isStatic() ) );
			return;
		}

		if ( $node instanceof Node\Stmt\ClassConst && $node->isPublic() ) {
			foreach ( $node->consts as $const ) {
				$this->declarations->add( new Class_Const( $this->current_relative_path, $node->getLine(), $this->current_class, $const->name->name ) );
			}
			return;
		}

		if ( $node instanceof Node\Stmt\ClassMethod && $node->isPublic() ) {
			// ClassMethods are also listed inside interfaces, which means current_class is null
			// so we ignore these
			if ( ! $this->current_class ) {
				return;
			}

			// Check for a doc block or a function call to indicate the method is deprecated.
			$deprecated = Utils::has_doc_comment( $node, '@deprecated' ) || Utils::has_function_call( $node, '_deprecated_function' );
			$method     = new Class_Method( $this->current_relative_path, $node->getLine(), $this->current_class, $node->name->name, $node->isStatic(), $deprecated );
			foreach ( $node->getParams() as $param ) {
				$param_default = Utils::get_param_default_as_string( $param->default, $this->current_class );
				$method->add_param( $param->var->name, $param_default, $param->type, $param->byRef, $param->variadic );
			}
			$this->declarations->add( $method );
			return;
		}

		if ( $node instanceof Node\Stmt\Function_ ) {
			// Check for a doc block or a function call to indicate the function is deprecated.
			$deprecated = Utils::has_doc_comment( $node, '@deprecated' ) || Utils::has_function_call( $node, '_deprecated_function' );
			$function   = new Function_( $this->current_relative_path, $node->getLine(), $node->name->name, $deprecated );
			foreach ( $node->getParams() as $param ) {
				$param_default = Utils::get_param_default_as_string( $param->default, $this->current_class );
				$function->add_param( $param->var->name, $param_default, $param->type, $param->byRef, $param->variadic );
			}
			$this->declarations->add( $function );
			return;
		}
	}

	public function leaveNode( Node $node ) {
		if ( $node instanceof Node\Stmt\Class_ ) {
			$this->current_class = null;
		}
	}
}
