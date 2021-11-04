<?php

namespace Automattic\Jetpack\Analyzer\Invocations;

use Automattic\Jetpack\Analyzer\Utils;
use PhpParser\Node;
use PhpParser\NodeVisitorAbstract;

class Visitor extends NodeVisitorAbstract {
	private $invocations;
	private $file_path;
	/**
	 * PrettyPrinter class.
	 *
	 * @var \PhpParser\PrettyPrinter\Standard
	 */
	private $printer;

	public function __construct( $file_path, $invocations ) {
		$this->file_path   = $file_path;
		$this->invocations = $invocations;
		$this->printer     = new \PhpParser\PrettyPrinter\Standard();
	}

	public function enterNode( Node $node ) {

		// if ( $node instanceof Node\Expr ) {
		// try {
		// $newCode = $this->printer->prettyPrintExpr( $node );
		// } catch ( $th ) {
		// prettyPrintExpr throws for unsupported nodes. Lets ignore these.
		// }
		// }.

		$out = '';
		if ( $node instanceof Node\Expr\New_ ) {
			$out = new New_( $this->file_path, $node->getLine(), Utils::node_to_class_name( $node->class ) );
		} elseif ( $node instanceof Node\Expr\StaticCall ) {
			// TODO - args.
			$out = new Static_Call( $this->file_path, $node->getLine(), Utils::node_to_class_name( $node->class ), $node->name->name );
		} elseif ( $node instanceof Node\Expr\StaticPropertyFetch ) {
			if ( ! $node->name instanceof Node\Expr\BinaryOp\Concat ) {
				$out = new Static_Property( $this->file_path, $node->getLine(), Utils::node_to_class_name( $node->class ), $node->name->name );
			}
			// else {
			// // handle case like `self::${ 'prev_' . $taxonomy }`.
			// }.
		} elseif ( $node instanceof Node\Expr\FuncCall ) {
			// TODO - args.
			if ( $node->name instanceof Node\Expr\Variable ) {
				$function_name = '$' . Utils::maybe_stringify( $node->name->name );
			} elseif ( $node->name instanceof Node\Expr\ArrayDimFetch ) {
				$function_name = $this->getArrayToken( $node->name );
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
			} elseif ( $node->name instanceof Node\Expr\Include_ ) {
				// calls like this: ( require "$root_dir/modules.php" )( $root_dir ).
				$function_name = ''; // do nothing :shrug:.
			} else {
				$function_name = implode( '\\', $node->name->parts );
			}

			$out = new Function_Call( $this->file_path, $node->getLine(), $function_name );
		} elseif ( $node instanceof Node\Expr\ClassConstFetch ) {
			$out = new Static_Const( $this->file_path, $node->getLine(), Utils::node_to_class_name( $node->class ), $node->name->name );
		} else {
			// print_r( $node );
		}

		if ( '' !== $out ) {
			$this->invocations->add( $out );
		}
	}

	/**
	 * Leave node handler
	 *
	 * @param Node $node node object.
	 */
	public function leaveNode( Node $node ) {
	}

		/**
		 * Recursively generates a (multidimentional) array invocation token.
		 *
		 * @param Node $node node object.
		 * @return string
		 */
	private function getArrayToken( Node $node ) {
		$dimension = false;
		$name      = null;
		if ( isset( $node->dim->value ) ) {
			$dimension = $node->dim->value;
		} elseif ( isset( $node->dim->name ) ) {
			$dimension = $node->dim->name;
		} else {
			trigger_error( 'Unable to find the array dimension name' ); // phpcs:ignore
		}
		if ( isset( $node->var ) && $node->var instanceof Node\Expr\ArrayDimFetch ) {
			$name = $this->getArrayToken( $node->var );
		} else {
			$name = '$' . Utils::maybe_stringify( $node->var->name );
		}

		return $name . '[\'' . Utils::maybe_stringify( $dimension ) . '\']';
	}

}
