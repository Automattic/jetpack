<?php
/**
 * Node visitor to resolve names in phpdoc comments.
 *
 * @package automattic/jetpack-stub-generator
 */

namespace Automattic\Jetpack\StubGenerator\PhpParser;

use Automattic\Jetpack\StubGenerator\PhpDocParser\NameResolver as PhpDocParser_NameResolver;
use PhpParser\Comment\Doc;
use PhpParser\NameContext;
use PhpParser\Node;
use PhpParser\NodeVisitorAbstract;
use PHPStan\PhpDocParser\Ast\NodeTraverser;
use PHPStan\PhpDocParser\Ast\NodeVisitor\CloningVisitor;
use PHPStan\PhpDocParser\Lexer\Lexer;
use PHPStan\PhpDocParser\Parser\ConstExprParser;
use PHPStan\PhpDocParser\Parser\PhpDocParser;
use PHPStan\PhpDocParser\Parser\TokenIterator;
use PHPStan\PhpDocParser\Parser\TypeParser;
use PHPStan\PhpDocParser\Printer\Printer;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Node visitor to resolve names in phpdoc comments.
 *
 * This coordinates with PhpParser\NodeVisitor\NameResolver, and must come after it.
 */
class PhpDocNameResolver extends NodeVisitorAbstract {

	/**
	 * OutputInterface.
	 *
	 * @var OutputInterface
	 */
	private $output;

	/**
	 * PHPDoc lexer
	 *
	 * @var Lexer
	 */
	private $lexer;

	/**
	 * PHPDoc parser
	 *
	 * @var PhpDocParser
	 */
	private $parser;

	/**
	 * PHPDoc traverser
	 *
	 * @var NodeTraverser
	 */
	private $traverser;

	/**
	 * PHPDoc printer
	 *
	 * @var Printer
	 */
	private $printer;

	/**
	 * Constructor.
	 *
	 * @param NameContext     $nameContext From the \PhpParser\NodeVisitor\NameResolver this is coordinating with.
	 * @param OutputInterface $output OutputInterface.
	 */
	public function __construct( NameContext $nameContext, OutputInterface $output ) {
		$this->output    = $output;
		$usedAttributes  = array(
			'lines'   => true,
			'indexes' => true,
		);
		$this->lexer     = new Lexer();
		$constExprParser = new ConstExprParser( true, true, $usedAttributes );
		$typeParser      = new TypeParser( $constExprParser, true, $usedAttributes );
		$this->parser    = new PhpDocParser( $typeParser, $constExprParser, true, true, $usedAttributes );
		$this->traverser = new NodeTraverser( array( new CloningVisitor(), new PhpDocParser_NameResolver( $nameContext, $output ) ) );
		$this->printer   = new Printer();
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Inherited.
	public function enterNode( Node $node ) {
		$docComment = $node->getDocComment();
		if ( $docComment ) {
			$tokens         = new TokenIterator( $this->lexer->tokenize( $docComment->getText() ) );
			$oldDoc         = $this->parser->parse( $tokens );
			list( $newDoc ) = $this->traverser->traverse( array( $oldDoc ) );
			'@phan-var \PHPStan\PhpDocParser\Ast\PhpDoc\PhpDocNode $newDoc';
			$node->setDocComment( new Doc( $this->printer->printFormatPreserving( $newDoc, $oldDoc, $tokens ) ) );
		}
	}
}
