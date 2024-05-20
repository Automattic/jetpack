<?php
/**
 * Node visitor to resolve class names in the docs.
 *
 * @package automattic/jetpack-stub-generator
 */

namespace Automattic\Jetpack\StubGenerator\PhpDocParser;

use PhpParser\Builder\Property as PropertyBuilder;
use PhpParser\NameContext;
use PhpParser\Node\Name;
use PHPStan\PhpDocParser\Ast\AbstractNodeVisitor;
use PHPStan\PhpDocParser\Ast\Node;
use PHPStan\PhpDocParser\Ast\Type\ArrayShapeItemNode;
use PHPStan\PhpDocParser\Ast\Type\IdentifierTypeNode;
use PHPStan\PhpDocParser\Ast\Type\ObjectShapeItemNode;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Node visitor to resolve class names in the docs.
 *
 * The expectation here is that there's a \PhpParser\NodeVisitor which runs this over the phpdoc comment of each visited
 * node, and that visitor is itself called after a \PhpParser\NodeVisitor\NameResolver that's using the same
 * NameContext as was passed to this.
 *
 * If the NameContext is currently processing a non-empty namespace, then non-fully-qualified class names are rewritten
 * to be either fully-qualified or relative to the NameContext's namespace rather than making use of any `use` aliases.
 *
 * The "relative to" bit semi-accidentally avoids mangling unrecognized class names, `@phan-type` aliases, and the like
 * most of the time, since the NameContext will probably "resolve" them relative to the namespace then the relative-to
 * transform will turn them back.
 */
class NameResolver extends AbstractNodeVisitor {

	/**
	 * OutputInterface.
	 *
	 * @var OutputInterface
	 */
	private $output;

	/**
	 * NameContext from the \PhpParser\NodeVisitor\NameResolver this is coordinating with.
	 *
	 * @var NameContext
	 */
	private $nameContext;

	/**
	 * Constructor.
	 *
	 * @param NameContext     $nameContext NameContext from the \PhpParser\NodeVisitor\NameResolver this is coordinating with.
	 * @param OutputInterface $output OutputInterface.
	 */
	public function __construct( NameContext $nameContext, OutputInterface $output ) {
		$this->nameContext = $nameContext;
		$this->output      = $output;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Inherited.
	public function enterNode( Node $node ) {
		// Flag array/object shape keys to not be resolved as class names.
		if ( ( $node instanceof ArrayShapeItemNode || $node instanceof ObjectShapeItemNode ) && $node->keyName instanceof IdentifierTypeNode ) {
			$node->keyName->setAttribute( 'not_a_class_name', true );
		}

		$ns = $this->nameContext->getNamespace();
		if ( $ns && $node instanceof IdentifierTypeNode && ! $node->getAttribute( 'not_a_class_name' ) ) {
			$name = self::normalizeType( $node->name );
			if ( $name instanceof Name && ! $name->isFullyQualified() && ! $this->isSpecialName( $name->name ) ) {
				$name = $this->nameContext->getResolvedClassName( $name );
				if ( strpos( strtolower( $name ), strtolower( $ns . '\\' ) ) === 0 ) {
					$name = new Name( substr( $name, strlen( $ns ) + 1 ) );
				}
				$node->name = $name->toCodeString();
			}
		}
	}

	/**
	 * Normalize a type string.
	 *
	 * Unfortunately PhpParser\BuilderHelpers is marked internal, so we have to
	 * hack around it instead.
	 *
	 * @param string $type Type.
	 * @return ?\PhpParser\Node Result.
	 */
	private static function normalizeType( string $type ) {
		return ( new PropertyBuilder( 'dummy' ) )->setType( $type )->getNode()->type;
	}

	/**
	 * Guess whether a string seems to be a special name.
	 *
	 * @param string $name Name.
	 * @return bool
	 */
	public function isSpecialName( string $name ): bool {
		return in_array(
			$name,
			array(
				'associative-array',
				'callable-array',
				'callable-object',
				'callable-string',
				'class-string',
				'list',
				'non-empty-array',
				'non-empty-associative-array',
				'non-empty-list',
				'resource',
			),
			true
		);
	}
}
