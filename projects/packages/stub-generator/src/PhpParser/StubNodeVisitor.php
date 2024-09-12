<?php
/**
 * Node visitor to extract stubs.
 *
 * @package automattic/jetpack-stub-generator
 */

namespace Automattic\Jetpack\StubGenerator\PhpParser;

<<<PHAN
@phan-type ClassDefs = '*'|array<string,'*'|array{constant?:'*'|string[],property?:'*'|string[],method?:'*'|string[]}>
@phan-type Definitions = array{constant:'*'|string[],function:'*'|string[],class:ClassDefs,interface:ClassDefs,trait:ClassDefs}
PHAN;

use PhpParser\BuilderFactory;
use PhpParser\Comment\Doc as DocComment;
use PhpParser\Node;
use PhpParser\Node\Expr\BinaryOp\Concat as BinaryOp_Concat;
use PhpParser\Node\Expr\FuncCall;
use PhpParser\Node\Name;
use PhpParser\Node\Scalar\MagicConst\Namespace_ as MagicConst_Namespace;
use PhpParser\Node\Scalar\String_;
use PhpParser\Node\Stmt\Class_;
use PhpParser\Node\Stmt\ClassConst;
use PhpParser\Node\Stmt\ClassMethod;
use PhpParser\Node\Stmt\Const_;
use PhpParser\Node\Stmt\Expression;
use PhpParser\Node\Stmt\Function_;
use PhpParser\Node\Stmt\Interface_;
use PhpParser\Node\Stmt\Namespace_;
use PhpParser\Node\Stmt\Property;
use PhpParser\Node\Stmt\Return_;
use PhpParser\Node\Stmt\Trait_;
use PhpParser\NodeFinder;
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitorAbstract;
use PhpParser\PrettyPrinter\Standard as PrettyPrinter_Standard;
use RuntimeException;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Node visitor to extract stubs.
 *
 * Note this visitor must be queued after `NameResolver` and `ParentConnectingVisitor`,
 * as it depends on the properties and attributes those add.
 */
class StubNodeVisitor extends NodeVisitorAbstract {

	/**
	 * File being processed.
	 *
	 * @var string
	 */
	private $file;

	/**
	 * Definitions of what to keep.
	 *
	 * @var array
	 * @phan-var Definitions
	 */
	private $defs;

	/**
	 * OutputInterface.
	 *
	 * @var OutputInterface
	 */
	private $output;

	/**
	 * Nesting depth.
	 *
	 * @var int
	 */
	private $depth;

	/**
	 * Collected namespaces.
	 *
	 * @var Namespace_[]
	 */
	public $namespaces = array();

	/**
	 * Constructor.
	 *
	 * @param OutputInterface $output OutputInterface.
	 */
	public function __construct( OutputInterface $output ) {
		$this->output = $output;
	}

	/**
	 * Set the definitions of what to keep.
	 *
	 * @param string       $file File being processed.
	 * @param string|array $defs File definitions.
	 */
	public function setDefs( string $file, $defs ): void {
		$this->file = $file;
		if ( $defs === '*' ) {
			$this->defs = array(
				'constant'  => '*',
				'function'  => '*',
				'class'     => '*',
				'trait'     => '*',
				'interface' => '*',
			);
		} else {
			$this->defs = $defs + array(
				'constant'  => array(),
				'function'  => array(),
				'class'     => array(),
				'trait'     => array(),
				'interface' => array(),
			);
		}
	}

	/**
	 * Determine which def field to use for a class/interface/trait memeber.
	 *
	 * @param ?Node  $node Node.
	 * @param string $type 'method', 'property', or 'constant'.
	 * @return array{?Node,string|array} Containing node and definitions, or null if none found.
	 * @phan-return array{?Node,?ClassDefs}
	 */
	private function selectDef( ?Node $node, string $type ): array {
		$which  = null;
		$parent = $node;
		do {
			if ( $parent === null ) {
				return array( null, null );
			} elseif ( $parent instanceof Class_ ) {
				$which = 'class';
			} elseif ( $parent instanceof Interface_ ) {
				$which = 'interface';
			} elseif ( $parent instanceof Trait_ ) {
				$which = 'trait';
			} else {
				$parent = $parent->getAttribute( 'parent' );
			}
		} while ( $which === null );
		assert( $which !== null ); // @phpcs:ignore MediaWiki.Usage.ForbiddenFunctions.assert -- for Phan

		if ( $this->defs[ $which ] === '*' ) {
			return array( $parent, '*' );
		}
		$parentName = $parent->namespacedName->toString();
		if ( empty( $this->defs[ $which ][ $parentName ] ) ) {
			return array( $parent, array() );
		}
		if ( $this->defs[ $which ][ $parentName ] === '*' ) {
			return array( $parent, '*' );
		}
		return array( $parent, $this->defs[ $which ][ $parentName ][ $type ] ?? array() );
	}

	/**
	 * Get the namespace name for a node.
	 *
	 * @param Node $node Node.
	 * @return string Namespace name.
	 */
	private function getNamespaceName( Node $node ): string {
		$ns = $node;
		while ( $ns && ! $ns instanceof Namespace_ ) {
			$ns = $ns->getAttribute( 'parent' );
		}
		return $ns && $ns->name ? $ns->name->toString() : '';
	}

	/**
	 * Output debugging info.
	 *
	 * @param string $msg Message.
	 */
	private function debug( $msg ) {
		if ( $this->output->isDebug() ) {
			$this->output->writeln( str_repeat( ' ', $this->depth ) . $msg );
		}
	}

	/**
	 * Throw an exception.
	 *
	 * @param Node   $node Node being processed.
	 * @param string $msg Exception message.
	 * @return never
	 * @throws RuntimeException Always.
	 */
	public function fatal( $node, $msg ) {
		throw new RuntimeException( "$msg at {$this->file}:{$node->getStartLine()} (node {$node->getType()})" );
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing,VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Inherited.
	public function beforeTraverse( array $nodes ) {
		$this->depth = 0;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Inherited.
	public function enterNode( Node $node ) {
		++$this->depth;

		if ( $node instanceof Namespace_ ) {
			// We always need to parse the children of namespaces.
			$this->debug( "Processing namespace '{$node->name}'" );
			return null;
		}

		if ( $node instanceof Class_ || $node instanceof Trait_ || $node instanceof Interface_ ) {
			$which = $node instanceof Class_ ? 'class' : ( $node instanceof Trait_ ? 'trait' : 'interface' );

			if ( $this->defs[ $which ] === '*' || isset( $this->defs[ $which ][ $node->namespacedName->toString() ] ) ) {
				$this->debug( "Processing $which {$node->namespacedName}" );
				return null;
			}

			$this->debug( "Skipping $which {$node->namespacedName}" );
			--$this->depth;
			return self::REMOVE_NODE;
		}

		if ( $node instanceof Function_ ) {
			if ( $this->defs['function'] === '*' || in_array( $node->namespacedName->toString(), $this->defs['function'], true ) ) {
				// Ignore anything inside the function.
				if ( $node->stmts ) {
					$this->addFunctionReturnType( $node );
					$this->mutateForFuncGetArgs( $node );
					$node->stmts = array();
				}
				$this->debug( "Keeping function {$node->namespacedName}" );
				return null;
			}

			$this->debug( "Skipping function {$node->namespacedName}" );
			--$this->depth;
			return self::REMOVE_NODE;
		}

		if ( $node instanceof Const_ ) {
			$kept = array();
			foreach ( $node->consts as $const ) {
				if ( $this->defs['constant'] === '*' || in_array( $const->namespacedName->toString(), $this->defs['constant'], true ) ) {
					$this->debug( "Keeping constant {$const->namespacedName}" );
					$kept[] = $const;
				} else {
					$this->debug( "Skipping constant {$const->namespacedName}" );
				}
			}
			if ( $kept ) {
				$node->consts = $kept;
				return null;
			}

			--$this->depth;
			return self::REMOVE_NODE;
		}

		// @phan-suppress-next-line PhanUndeclaredProperty -- Phan's inferrence is limited.
		if ( $node instanceof Expression && $node->expr instanceof FuncCall && $node->expr->name instanceof Name && $node->expr->name->toString() === 'define' ) {
			// @phan-suppress-next-line PhanUndeclaredProperty -- Phan's inferrence is limited.
			$arg = $node->expr->args[0]->value;
			if ( $arg instanceof String_ ) {
				$constName = $arg->value;
			} elseif ( $arg instanceof BinaryOp_Concat && $arg->left instanceof MagicConst_Namespace && $arg->right instanceof String_ ) {
				// @phan-suppress-next-line PhanUndeclaredProperty -- Phan's inferrence is limited.
				$constName = $this->getNamespaceName( $node ) . $arg->right->value;
			} else {
				$code = ( new PrettyPrinter_Standard() )->prettyPrintExpr( $arg );
				$this->debug( "Skipping define `$code` because I can't stringify it" );
				return self::REMOVE_NODE;
			}
			if ( $this->defs['constant'] === '*' || in_array( $constName, $this->defs['constant'], true ) ) {
				$this->debug( "Keeping define {$constName}" );
				return null;
			}

			$this->debug( "Skipping define {$constName}" );
			--$this->depth;
			return self::REMOVE_NODE;
		}

		if ( $node instanceof ClassMethod ) {
			list( $parent, $defs ) = $this->selectDef( $node, 'method' );
			if ( $parent === null || $defs === null ) {
				$this->fatal( $node, 'No parent found' );
			}
			if ( $parent instanceof Class_ && $node->isPrivate() ) {
				$this->debug( "Skipping private method {$node->name}" );
			} elseif ( $parent instanceof Class_ && $parent->isFinal() && $node->isProtected() ) {
				$this->debug( "Skipping final-class protected method {$node->name}" );
			} elseif ( $defs === '*' || in_array( $node->name->toString(), $defs, true ) ) {
				// Ignore anything inside the method.
				if ( $node->stmts ) {
					$this->mutateForFuncGetArgs( $node );
					$node->stmts = array();
				}
				$this->debug( "Keeping method {$node->name}" );
				return null;
			} else {
				$this->debug( "Skipping method {$node->name}" );
			}

			--$this->depth;
			return self::REMOVE_NODE;
		}

		if ( $node instanceof Property ) {
			list( $parent, $defs ) = $this->selectDef( $node, 'property' );
			if ( $parent === null || $defs === null ) {
				$this->fatal( $node, 'No parent found' );
			}

			$kept = array();
			foreach ( $node->props as $prop ) {
				if ( $parent instanceof Class_ && $node->isPrivate() ) {
					$this->debug( "Skipping private property \${$prop->name}" );
				} elseif ( $parent instanceof Class_ && $parent->isFinal() && $node->isProtected() ) {
					$this->debug( "Skipping final-class protected property \${$prop->name}" );
				} elseif ( $defs === '*' || in_array( $prop->name->toString(), $defs, true ) ) {
					$this->debug( "Keeping property \${$prop->name}" );
					$kept[] = $prop;
				} else {
					$this->debug( "Skipping property \${$prop->name}" );
				}
			}
			if ( $kept ) {
				$node->props = $kept;
				return null;
			}

			--$this->depth;
			return self::REMOVE_NODE;
		}

		if ( $node instanceof ClassConst ) {
			list( $parent, $defs ) = $this->selectDef( $node, 'constant' );
			if ( $parent === null || $defs === null ) {
				$this->fatal( $node, 'No parent found' );
			}

			$kept = array();
			foreach ( $node->consts as $const ) {
				if ( $parent instanceof Class_ && $node->isPrivate() ) {
					$this->debug( "Skipping private const {$const->name}" );
				} elseif ( $parent instanceof Class_ && $parent->isFinal() && $node->isProtected() ) {
					$this->debug( "Skipping final-class protected const {$const->name}" );
				} elseif ( $defs === '*' || in_array( $const->name->toString(), $defs, true ) ) {
					$this->debug( "Keeping const {$const->name}" );
					$kept[] = $const;
				} else {
					$this->debug( "Skipping const {$const->name}" );
				}
			}
			if ( $kept ) {
				$node->consts = $kept;
				return null;
			}

			--$this->depth;
			return self::REMOVE_NODE;
		}
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Inherited.
	public function leaveNode( Node $node ) {
		--$this->depth;

		if ( $node instanceof Class_ ||
			$node instanceof Trait_ ||
			$node instanceof Interface_ ||
			$node instanceof Function_ ||
			$node instanceof Const_ ||
			// @phan-suppress-next-line PhanUndeclaredProperty -- Phan's inferrence is limited
			$node instanceof Expression && $node->expr instanceof FuncCall && $node->expr->name instanceof Name && $node->expr->name->toString() === 'define'
		) {
			$nsName = $this->getNamespaceName( $node );
			if ( ! isset( $this->namespaces[ $nsName ] ) ) {
				$this->namespaces[ $nsName ] = new Namespace_( $nsName === '' ? null : new Name( $nsName ) );
			}
			$this->namespaces[ $nsName ]->stmts[] = $node;

		}
	}

	/**
	 * Mutate a function/method's signature if it uses `func_get_args()`.
	 *
	 * @param Function_|ClassMethod $node Node.
	 */
	private function mutateForFuncGetArgs( Node $node ): void {
		// First, see if the function already uses varargs.
		foreach ( $node->getParams() as $param ) {
			if ( $param->variadic ) {
				return;
			}
		}

		// See if the function contains a call to `func_get_args()`.
		$call = ( new NodeFinder() )->findFirst(
			$node->stmts,
			function ( Node $n ) {
				return $n instanceof FuncCall && $n->name instanceof Name && in_array( $n->name->toString(), array( 'func_get_args', 'func_get_arg', 'func_num_args' ), true );
			}
		);

		if ( $call !== null ) {
			$node->params[] = ( new BuilderFactory() )->param( 'func_get_args' )->makeVariadic()->getNode();
		}
	}

	/**
	 * Add function return type.
	 *
	 * If a function stub has no declared return type and no phpdoc, Phan seems
	 * to assume "void". If there are any non-empty `return` statements in the
	 * function body, document it as "mixed" so Phan won't give bogus PhanTypeVoidAssignment
	 * and the like.
	 *
	 * This doesn't seem to apply to methods though. 🤷
	 *
	 * @param Function_ $node Node.
	 */
	private function addFunctionReturnType( Function_ $node ): void {
		// First, see if the function already has a return type, either declared or phpdoc.
		if ( $node->getReturnType() !== null ||
			preg_match( '/@(phan-|phan-real-)?return /', (string) $node->getDocComment() )
		) {
			return;
		}

		$visitor   = new class() extends NodeVisitorAbstract {
			/**
			 * Whether a return was found.
			 *
			 * @var bool
			 */
			public $found = false;

			// phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Inherited.
			public function enterNode( Node $n ) {
				if ( $n instanceof Return_ && $n->expr ) {
					$this->found = true;
					return self::STOP_TRAVERSAL;
				}

				if ( $n instanceof \PhpParser\Node\Expr\Closure || $n instanceof ClassMethod || $n instanceof Function_ ) {
					return self::DONT_TRAVERSE_CHILDREN;
				}

				return null;
			}
		};
		$traverser = new NodeTraverser( $visitor );
		$traverser->traverse( $node->stmts );

		if ( $visitor->found ) {
			$docComment = $node->getDocComment() ? $node->getDocComment()->getText() : '/** */';
			$docComment = rtrim( substr( $docComment, 0, -2 ), " \t" ) . "\n * @phan-return mixed Dummy doc for stub.\n */";
			$node->setDocComment( new DocComment( $docComment ) );
		}
	}
}
