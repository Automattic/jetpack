<?php
/**
 * Node visitor to strip docs.
 *
 * @package automattic/jetpack-stub-generator
 */

namespace Automattic\Jetpack\StubGenerator;

use PHPStan\PhpDocParser\Ast\AbstractNodeVisitor;
use PHPStan\PhpDocParser\Ast\Node;
use PHPStan\PhpDocParser\Ast\NodeTraverser;
use PHPStan\PhpDocParser\Ast\PhpDoc\PhpDocTextNode;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Node visitor to strip docs.
 */
class StripDocsPhpDocNodeVisitor extends AbstractNodeVisitor {

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
	public function enterNode( Node $node ) {
		// Summary and descriptions come in as PhpDocTextNode.
		if ( $node instanceof PhpDocTextNode ) {
			return NodeTraverser::REMOVE_NODE;
		}

		// The description on tags like `@param` comes in as a property.
		// @phan-suppress-next-line PhanUndeclaredProperty -- It's being checked right here.
		if ( ! empty( $node->description ) ) {
			// @phan-suppress-next-line PhanUndeclaredProperty -- It's being checked just above.
			$node->description = '';
		}
	}
}
