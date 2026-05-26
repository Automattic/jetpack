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
use PHPStan\PhpDocParser\Ast\PhpDoc\ExtendsTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\GenericTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\InvalidTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\MethodTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\MixinTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\ParamTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\PhpDocTagNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\PhpDocTextNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\PropertyTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\ReturnTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\TemplateTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\ThrowsTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\TypelessParamTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\VarTagValueNode;
use PHPStan\PhpDocParser\Lexer\Lexer;
use PHPStan\PhpDocParser\Parser\PhpDocParser;
use PHPStan\PhpDocParser\Parser\TokenIterator;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Node visitor to strip docs.
 */
class StripDocsNodeVisitor extends AbstractNodeVisitor {

	/**
	 * Generic tags to keep, and whether they have args that should be preserved.
	 *
	 * @var array<string,bool>
	 */
	private const GENERIC_TAGS = array(
		'@abstract'              => false,
		'@inherits'              => true,
		'@internal'              => false,
		'@no-named-arguments'    => false,
		'@phan-closure-scope'    => true,
		'@phanclosurescope'      => true,
		'@phan-immutable'        => false,
		'@phan-read-only'        => false,
		'@phan-side-effect-free' => false,
		'@phan-write-only'       => false,
		'@readonly'              => false,
		'@seal-methods'          => false,
		'@seal-properties'       => false,
	);

	/**
	 * Whether to keep unrecognized tags.
	 *
	 * @var bool
	 */
	private $keepTags;

	/**
	 * OutputInterface.
	 *
	 * @var OutputInterface
	 */
	private $output;

	/**
	 * Lexer.
	 *
	 * @var Lexer|null
	 */
	private $lexer = null;

	/**
	 * PhpDocParser.
	 *
	 * @var PhpDocParser|null
	 */
	private $parser = null;

	/**
	 * Constructor.
	 *
	 * @param OutputInterface $output OutputInterface.
	 * @param bool            $keepTags Whether to keep unrecognized tags.
	 */
	public function __construct( OutputInterface $output, $keepTags ) {
		$this->output   = $output;
		$this->keepTags = $keepTags;
	}

	/**
	 * Get the parser and lexer.
	 *
	 * @return array{PhpDocParser,Lexer} Parser and lexer.
	 */
	private function getPhpDocParserAndLexer() {
		if ( ! $this->parser ) {
			$config          = new \PHPStan\PhpDocParser\ParserConfig(
				array(
					'lines'   => true,
					'indexes' => true,
				)
			);
			$this->lexer     = new Lexer( $config );
			$constExprParser = new \PHPStan\PhpDocParser\Parser\ConstExprParser( $config );
			$typeParser      = new \PHPStan\PhpDocParser\Parser\TypeParser( $config, $constExprParser );
			$this->parser    = new PhpDocParser( $config, $typeParser, $constExprParser );
		}

		return array( $this->parser, $this->lexer );
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

			// Hack to handle @unused-param
			if ( $value instanceof GenericTagValueNode && $node->name === '@unused-param' ) {
				list( $parser, $lexer ) = $this->getPhpDocParserAndLexer();
				$v                      = $parser->parseTagValue( new TokenIterator( $lexer->tokenize( $value->value ) ), '@param' );
				if ( $v instanceof ParamTagValueNode || $v instanceof TypelessParamTagValueNode ) {
					$node->value = $v;
					$value       = $node->value;
				}
			}

			// @param, @unused-param
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
				// @template, @template-covariant
				$value instanceof TemplateTagValueNode ||
				// @extends
				$value instanceof ExtendsTagValueNode ||
				// @mixin
				$value instanceof MixinTagValueNode
			) {
				$value->description = '';
				return null;
			}

			// Other tags we might want to keep.
			if ( $value instanceof GenericTagValueNode && isset( self::GENERIC_TAGS[ $node->name ] ) ) {
				if ( ! self::GENERIC_TAGS[ $node->name ] ) {
					$value->value = '';
				}
				return null;
			}

			// Drop invalid tags.
			if ( $value instanceof InvalidTagValueNode ) {
				$this->output->writeln( "Ignoring invalid tag `$node`", OutputInterface::VERBOSITY_DEBUG );
				return NodeTraverser::REMOVE_NODE;
			}

			// Keep unrecognized tags?
			if ( $this->keepTags ) {
				$this->output->writeln( "Keeping unrecognized tag `{$node->name}`", OutputInterface::VERBOSITY_DEBUG );
				// @phan-suppress-next-line PhanUndeclaredProperty - Testing before using.
				if ( isset( $value->description ) ) {
					// @phan-suppress-next-line PhanUndeclaredProperty - Tested before using.
					$value->description = '';
				}
				return null;
			}

			$this->output->writeln( "Ignoring unrecognized tag `{$node->name}`", OutputInterface::VERBOSITY_DEBUG );
			return NodeTraverser::REMOVE_NODE;
		}
	}
}
