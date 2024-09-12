<?php
/**
 * Node visitor to strip docs.
 *
 * @package automattic/jetpack-stub-generator
 */

namespace Automattic\Jetpack\StubGenerator\PhpDocParser;

use PHPStan\PhpDocParser\Ast\AbstractNodeVisitor;
use PHPStan\PhpDocParser\Ast\Node;
use PHPStan\PhpDocParser\Ast\NodeTraverser;
use PHPStan\PhpDocParser\Ast\PhpDoc\DeprecatedTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\GenericTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\InvalidTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\MethodTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\ParamTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\PhpDocTagNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\PhpDocTextNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\PropertyTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\ReturnTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\TemplateTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\ThrowsTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\TypelessParamTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\VarTagValueNode;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Node visitor to strip docs.
 */
class StripDocsNodeVisitor extends AbstractNodeVisitor {

	/**
	 * OutputInterface.
	 *
	 * @var OutputInterface
	 */
	private $output;

	/**
	 * Constructor.
	 *
	 * @param OutputInterface $output OutputInterface.
	 */
	public function __construct( OutputInterface $output ) {
		$this->output = $output;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Inherited.
	public function leaveNode( Node $node ) {
		// Summary and descriptions come in as PhpDocTextNode.
		if ( $node instanceof PhpDocTextNode ) {
			return NodeTraverser::REMOVE_NODE;
		}

		// All at-tags.
		if ( $node instanceof PhpDocTagNode ) {
			$value = $node->value;

			// @param
			if ( $value instanceof ParamTagValueNode || $value instanceof TypelessParamTagValueNode ) {
				if ( strpos( $value->description, '@phan-output-reference' ) !== false ) {
					$value->description = '@phan-output-reference';
				} elseif ( strpos( $value->description, '@phan-ignore-reference' ) !== false ) {
					$value->description = '@phan-ignore-reference';
				} else {
					$value->description = '';
				}
				return null;
			}

			if (
				// @var
				$value instanceof VarTagValueNode ||
				// @return
				$value instanceof ReturnTagValueNode ||
				// @throws
				$value instanceof ThrowsTagValueNode ||
				// @deprecated
				$value instanceof DeprecatedTagValueNode ||
				// @property
				$value instanceof PropertyTagValueNode ||
				// @method
				$value instanceof MethodTagValueNode ||
				// @template
				$value instanceof TemplateTagValueNode
			) {
				$value->description = '';
				return null;
			}

			// Other tags we might want to keep.
			if ( $value instanceof GenericTagValueNode && in_array( $node->name, array( '@internal', '@phan-read-only', '@phan-write-only', '@phan-immutable', '@phan-side-effect-free' ), true ) ) {
				$value->value = '';
				return null;
			}

			// Drop invalid or unrecognized tags.
			if ( $value instanceof InvalidTagValueNode ) {
				$this->output->writeln( "Ignoring invalid tag `$node`", OutputInterface::VERBOSITY_DEBUG );
				return NodeTraverser::REMOVE_NODE;
			}

			$this->output->writeln( "Ignoring unrecognized tag `{$node->name}`", OutputInterface::VERBOSITY_DEBUG );
			return NodeTraverser::REMOVE_NODE;
		}
	}
}
