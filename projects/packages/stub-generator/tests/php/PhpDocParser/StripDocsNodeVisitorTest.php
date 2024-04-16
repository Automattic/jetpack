<?php
/**
 * Tests for the jetpack-stub-generator PhpDocParser\StripDocsNodeVisitor class.
 *
 * @package automattic/jetpack-stub-generator
 */

// phpcs:disable PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696

namespace Automattic\Jetpack\StubGenerator\Tests\PhpDocParser;

use Automattic\Jetpack\StubGenerator\PhpDocParser\StripDocsNodeVisitor;
use PHPStan\PhpDocParser\Ast\NodeTraverser;
use PHPStan\PhpDocParser\Ast\NodeVisitor\CloningVisitor;
use PHPStan\PhpDocParser\Lexer\Lexer;
use PHPStan\PhpDocParser\Parser\ConstExprParser;
use PHPStan\PhpDocParser\Parser\PhpDocParser;
use PHPStan\PhpDocParser\Parser\TokenIterator;
use PHPStan\PhpDocParser\Parser\TypeParser;
use PHPStan\PhpDocParser\Printer\Printer;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Output\BufferedOutput;

/**
 * Tests for the jetpack-stub-generator PhpDocParser\StripDocsNodeVisitor class.
 *
 * @covers \Automattic\Jetpack\StubGenerator\PhpDocParser\StripDocsNodeVisitor
 */
class StripDocsNodeVisitorTest extends TestCase {

	/**
	 * Test the visitor.
	 *
	 * @dataProvider provideIntegration
	 * @param string $input Input doc block.
	 * @param string $expect Expected output doc block.
	 * @param int    $verbosity Output verbosity.
	 * @param string $expectOutput Expected console output.
	 */
	public function testIntegration( string $input, string $expect, int $verbosity = BufferedOutput::VERBOSITY_NORMAL, string $expectOutput = '' ) {
		$output = new BufferedOutput( $verbosity );

		$usedAttributes  = array(
			'lines'   => true,
			'indexes' => true,
		);
		$lexer           = new Lexer();
		$constExprParser = new ConstExprParser( true, true, $usedAttributes );
		$typeParser      = new TypeParser( $constExprParser, true, $usedAttributes );
		$parser          = new PhpDocParser( $typeParser, $constExprParser, true, true, $usedAttributes );
		$traverser       = new NodeTraverser( array( new CloningVisitor(), new StripDocsNodeVisitor( $output ) ) );
		$printer         = new Printer();

		$tokens         = new TokenIterator( $lexer->tokenize( $input ) );
		$oldDoc         = $parser->parse( $tokens );
		list( $newDoc ) = $traverser->traverse( array( $oldDoc ) );
		'@phan-var \PHPStan\PhpDocParser\Ast\PhpDoc\PhpDocNode $newDoc';
		$actual = $printer->printFormatPreserving( $newDoc, $oldDoc, $tokens );

		$this->assertSame( $expect, $actual );
		$this->assertSame( $expectOutput, $output->fetch() );
	}

	/**
	 * Data provider for testIntegration.
	 */
	public function provideIntegration() {
		return array(
			'Simple doc comment'                     => array(
				<<<'PHPDOC'
				/** Something */
				PHPDOC,
				<<<'PHPDOC'
				/**  */
				PHPDOC,
			),
			'Summary and description'                => array(
				<<<'PHPDOC'
				/**
				 * This is a summary.
				 *
				 * This is the description. It may be multiple lines,
				 * and have other stuff in it too.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 */
				PHPDOC,
			),
			'@param'                                 => array(
				<<<'PHPDOC'
				/**
				 * @param string $param This is a parameter.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @param string $param
				 */
				PHPDOC,
			),
			'@param with complex type'               => array(
				<<<'PHPDOC'
				/**
				 * @param string|int|ClassName|array{key:array<string,?mixed>} $param This is a parameter with complex types.
				 *   It also has multiple lines of text with it.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @param string|int|ClassName|array{key: array<string, ?mixed>} $param
				 */
				PHPDOC,
			),
			'@param with no type'                    => array(
				<<<'PHPDOC'
				/**
				 * @param $param This is a parameter.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @param $param
				 */
				PHPDOC,
			),
			'@param with reference type'             => array(
				<<<'PHPDOC'
				/**
				 * @param string &$param This is a parameter. @phan-output-reference
				 * @param string &$param2 This is a parameter. @phan-ignore-reference
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @param string &$param @phan-output-reference
				 * @param string &$param2 @phan-ignore-reference
				 */
				PHPDOC,
			),
			'@var'                                   => array(
				<<<'PHPDOC'
				/**
				 * @var string $var A variable.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @var string $var
				 */
				PHPDOC,
			),
			'@var with no variable name'             => array(
				<<<'PHPDOC'
				/**
				 * @var string A variable.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @var string
				 */
				PHPDOC,
			),
			'@return'                                => array(
				<<<'PHPDOC'
				/**
				 * @return string Some string.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @return string
				 */
				PHPDOC,
			),
			'@return with complex type'              => array(
				<<<'PHPDOC'
				/**
				 * @return string|int|ClassName|array{key:array<string,?mixed>} This is a parameter with complex types.
				 *   It also has multiple lines of text with it.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @return string|int|ClassName|array{key: array<string, ?mixed>}
				 */
				PHPDOC,
			),
			'@throws'                                => array(
				<<<'PHPDOC'
				/**
				 * @throws Exception When it feels like it.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @throws Exception
				 */
				PHPDOC,
			),
			'@deprecated'                            => array(
				<<<'PHPDOC'
				/**
				 * @deprecated
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @deprecated
				 */
				PHPDOC,
			),
			'@deprecated with details'               => array(
				<<<'PHPDOC'
				/**
				 * @deprecated 1.2.3 Some replacement message.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @deprecated 
				 */
				PHPDOC,
			),
			'@property'                              => array(
				<<<'PHPDOC'
				/**
				 * @property int $magic_prop comment can go here
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @property int $magic_prop
				 */
				PHPDOC,
			),
			'@method'                                => array(
				<<<'PHPDOC'
				/**
				 * Various examples from https://github.com/phan/phan/wiki/Annotating-Your-Source-Code#method
				 *
				 * Note the `fooWithOptionalParam` example is apparently not supported. 🤷
				 *
				 * @method int fooWithReturnType() - Can be followed by optional description
				 * @method doSomething() implicitly has the void return type
				 * @method mixed doSomething() use this if you don't know the return type, or if the return type can be anything.
				 * @method fooWithOptionalNullableParam(string $x= null) The param $x is a nullable string. Null is the only value for which the default affects param type inference.
				 * @method static static_foo() This is a static method returning void.
				 * @method static int static_foo_with_return_type() - This is a static method returning int.
				 * @method static static static_foo_with_return_type_of_static() This is a static method returning an instance of a class implementing this interface.
				 * @method int myMethodWithUntypedParams($x) - Types are optional.
				 * @method int myMethodWithPHPDocParams(double $x, object|null $y) - PHPDoc types and union types can be used.
				 * @method int|string myMethodWithVariadicParams(int $a, int|string   ... $x ) ... and variadic types can be used.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @method int fooWithReturnType()
				 * @method doSomething()
				 * @method mixed doSomething()
				 * @method fooWithOptionalNullableParam(string $x = null)
				 * @method static static_foo()
				 * @method static int static_foo_with_return_type()
				 * @method static static static_foo_with_return_type_of_static()
				 * @method int myMethodWithUntypedParams($x)
				 * @method int myMethodWithPHPDocParams(double $x, object|null $y)
				 * @method int|string myMethodWithVariadicParams(int $a, int|string ...$x)
				 */
				PHPDOC,
			),
			'@template'                              => array(
				<<<'PHPDOC'
				/**
				 * @template T Some comment.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @template T
				 */
				PHPDOC,
			),

			'@var with no type (invalid)'            => array(
				<<<'PHPDOC'
				/**
				 * @var $var A variable
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 */
				PHPDOC,
			),
			'@var with no type (invalid), verbose'   => array(
				<<<'PHPDOC'
				/**
				 * @var $var A variable
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 */
				PHPDOC,
				BufferedOutput::VERBOSITY_DEBUG,
				<<<'OUTPUT'
				Ignoring invalid tag `@var $var A variable`
				OUTPUT . "\n",
			),
			'Various other generic recognized props' => array(
				<<<'PHPDOC'
				/**
				 * @internal Some text.
				 * @phan-read-only Some text.
				 * @phan-write-only Some text.
				 * @phan-immutable Some text.
				 * @phan-side-effect-free Some text.
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 * @internal 
				 * @phan-read-only 
				 * @phan-write-only 
				 * @phan-immutable 
				 * @phan-side-effect-free 
				 */
				PHPDOC,
			),

			'Arbitrary unhandled tag'                => array(
				<<<'PHPDOC'
				/**
				 * @since 1.2.3 Some description
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 */
				PHPDOC,
			),
			'Arbitrary unhandled tag, verbose'       => array(
				<<<'PHPDOC'
				/**
				 * @since 1.2.3 Some description
				 */
				PHPDOC,
				<<<'PHPDOC'
				/**
				 */
				PHPDOC,
				BufferedOutput::VERBOSITY_DEBUG,
				<<<'OUTPUT'
				Ignoring unrecognized tag `@since`
				OUTPUT . "\n",
			),
		);
	}
}
