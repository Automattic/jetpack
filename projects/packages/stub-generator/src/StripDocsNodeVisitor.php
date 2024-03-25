<?php
/**
 * Node visitor to strip docs.
 *
 * @package automattic/jetpack-stub-generator
 */

namespace Automattic\Jetpack\StubGenerator;

use PhpParser\Node;
use PhpParser\NodeVisitorAbstract;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Node visitor to strip docs.
 */
class StripDocsNodeVisitor extends NodeVisitorAbstract {

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

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing,VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Inherited.
	public function enterNode( Node $node ) {
		// @todo Write this.
	}
}
