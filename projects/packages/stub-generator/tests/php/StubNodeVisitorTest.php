<?php
/**
 * Tests for the jetpack-stub-generator StubNodeVisitor class.
 *
 * @package automattic/jetpack-stub-generator
 */

// phpcs:disable PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696

namespace Automattic\Jetpack\StubGenerator\Tests;

use Automattic\Jetpack\StubGenerator\StubNodeVisitor;
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitor\NameResolver;
use PhpParser\NodeVisitor\ParentConnectingVisitor;
use PhpParser\ParserFactory;
use PhpParser\PrettyPrinter\Standard as PrettyPrinter_Standard;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Symfony\Component\Console\Output\BufferedOutput;

/**
 * Tests for the jetpack-stub-generator StubNodeVisitor class.
 *
 * @covers \Automattic\Jetpack\StubGenerator\StubNodeVisitor
 */
class StubNodeVisitorTest extends TestCase {

	/**
	 * Test the visitor.
	 *
	 * @dataProvider provideIntegration
	 * @param string       $input Input PHP code (no leading `<?php` needed).
	 * @param string|array $defs Definitions array for the visitor.
	 * @param string       $expect Expected output PHP code.
	 * @param int          $verbosity Output verbosity.
	 * @param string       $expectOutput Expected console output.
	 */
	public function testIntegration( string $input, $defs, string $expect, int $verbosity = BufferedOutput::VERBOSITY_NORMAL, string $expectOutput = '' ) {
		$output    = new BufferedOutput( $verbosity );
		$parser    = ( new ParserFactory() )->createForHostVersion();
		$traverser = new NodeTraverser();
		$traverser->addVisitor( new NameResolver() );
		$traverser->addVisitor( new ParentConnectingVisitor() );
		$visitor = new StubNodeVisitor( $output );
		$traverser->addVisitor( $visitor );

		$stmts = $parser->parse( "<?php\n$input" );
		$this->assertNotNull( $stmts );
		'@phan-var \PhpParser\Node[] $stmts';

		$visitor->setDefs( 'dummy.php', $defs );
		$traverser->traverse( $stmts );

		$stmts = array_values( $visitor->namespaces );

		$actual = ( new PrettyPrinter_Standard() )->prettyPrint( $stmts );
		$actual = preg_replace_callback(
			'/^(?:    )+/m',
			function ( $m ) {
				return str_repeat( "\t", strlen( $m[0] ) / 4 );
			},
			$actual
		);

		$this->assertSame( $expect, $actual );
		$this->assertSame( $expectOutput, $output->fetch() );
	}

	/**
	 * Data provider for testIntegration.
	 */
	public function provideIntegration() {
		return array(
			'Extract some functions, defs = *'            => array(
				<<<'PHP'
				function foo() {
					return true;
				}

				function bar( string $p ): bool {
					return $p === "yes";
				}
				PHP,
				'*',
				<<<'PHP'
				namespace {
					function foo()
					{
					}
					function bar(string $p): bool
					{
					}
				}
				PHP,
			),
			'Extract some functions, function = *'        => array(
				<<<'PHP'
				function foo() {
					return true;
				}

				function bar( string $p ): bool {
					return $p === "yes";
				}
				PHP,
				array( 'function' => '*' ),
				<<<'PHP'
				namespace {
					function foo()
					{
					}
					function bar(string $p): bool
					{
					}
				}
				PHP,
			),
			'Extract a selected function by name'         => array(
				<<<'PHP'
				function barf() {
					return true;
				}

				function foobar() {
					return true;
				}

				function foo( $bar ) {
					return true;
				}

				function bar( string $p ): bool {
					return $p === "yes";
				}
				PHP,
				array( 'function' => array( 'bar' ) ),
				<<<'PHP'
				namespace {
					function bar(string $p): bool
					{
					}
				}
				PHP,
			),
			'Extract no functions'                        => array(
				<<<'PHP'
				function foo() {
					return true;
				}

				function bar( string $p ): bool {
					return $p === "yes";
				}
				PHP,
				array( 'class' => array( 'bar' ) ),
				<<<'PHP'
				PHP,
			),
			'Extract namespaced functions'                => array(
				<<<'PHP'
				namespace {
					/** Non-namespaced */
					function foo() {
						return true;
					}

					/** Non-namespaced */
					function bar( string $p ): bool {
						return $p === "yes";
					}
				}

				namespace Some\NS {
					/** Namespaced */
					function foo() {
						return true;
					}

					/** Namespaced */
					function bar( string $p ): bool {
						return $p === "yes";
					}
				}
				PHP,
				array( 'function' => array( 'foo', 'Some\NS\bar' ) ),
				<<<'PHP'
				namespace {
					/** Non-namespaced */
					function foo()
					{
					}
				}
				namespace Some\NS {
					/** Namespaced */
					function bar(string $p): bool
					{
					}
				}
				PHP,
				BufferedOutput::VERBOSITY_DEBUG,
				<<<'OUTPUT'
				 Processing namespace ''
				  Keeping function foo
				  Skipping function bar
				 Processing namespace 'Some\NS'
				  Skipping function Some\NS\foo
				  Keeping function Some\NS\bar
				OUTPUT . "\n",
			),

			'Extract some constants, defs = *'            => array(
				<<<'PHP'
				const FOO = 'foo', BAR = 'bar';
				const BAZ = 'baz';
				PHP,
				'*',
				<<<'PHP'
				namespace {
					const FOO = 'foo', BAR = 'bar';
					const BAZ = 'baz';
				}
				PHP,
			),
			'Extract some constants, contant = *'         => array(
				<<<'PHP'
				const FOO = 'foo', BAR = 'bar';
				const BAZ = 'baz';
				PHP,
				array( 'constant' => '*' ),
				<<<'PHP'
				namespace {
					const FOO = 'foo', BAR = 'bar';
					const BAZ = 'baz';
				}
				PHP,
			),
			'Extract a selected constant by name'         => array(
				<<<'PHP'
				const FOO = 'foo', BAR = 'bar';
				const BAZ = 'BAR';
				PHP,
				array( 'constant' => array( 'BAR' ) ),
				<<<'PHP'
				namespace {
					const BAR = 'bar';
				}
				PHP,
			),
			'Extract no constants'                        => array(
				<<<'PHP'
				const FOO = 'foo', BAR = 'bar';
				const BAZ = 'BAR';
				PHP,
				array( 'function' => '*' ),
				<<<'PHP'
				PHP,
			),
			'Extract namespaced constants'                => array(
				<<<'PHP'
				namespace {
					const FOO = 'nn', BAR = 'nn';
					const BAZ = 'nn';
				}
				namespace Some\NS {
					const FOO = 'ns', BAR = 'ns';
					const BAZ = 'ns';
				}
				PHP,
				array( 'constant' => array( 'BAR', 'Some\NS\BAZ' ) ),
				<<<'PHP'
				namespace {
					const BAR = 'nn';
				}
				namespace Some\NS {
					const BAZ = 'ns';
				}
				PHP,
				BufferedOutput::VERBOSITY_DEBUG,
				<<<'OUTPUT'
				 Processing namespace ''
				  Skipping constant FOO
				  Keeping constant BAR
				  Skipping constant BAZ
				 Processing namespace 'Some\NS'
				  Skipping constant Some\NS\FOO
				  Skipping constant Some\NS\BAR
				  Keeping constant Some\NS\BAZ
				OUTPUT . "\n",
			),

			'Extract defined constants, defs = *'         => array(
				<<<'PHP'
				define( 'FOO', 'foo' );
				define( 'BAR', 'bar' );
				PHP,
				'*',
				<<<'PHP'
				namespace {
					\define('FOO', 'foo');
					\define('BAR', 'bar');
				}
				PHP,
			),
			'Extract some defined constants, contant = *' => array(
				<<<'PHP'
				define( 'FOO', 'foo' );
				define( 'BAR', 'bar' );
				PHP,
				array( 'constant' => '*' ),
				<<<'PHP'
				namespace {
					\define('FOO', 'foo');
					\define('BAR', 'bar');
				}
				PHP,
			),
			'Extract a selected defined constant by name' => array(
				<<<'PHP'
				define( 'FOO', 'BAR' );
				define( 'BAR', 'bar' );
				PHP,
				array( 'constant' => array( 'BAR' ) ),
				<<<'PHP'
				namespace {
					\define('BAR', 'bar');
				}
				PHP,
			),
			'Extract no defined constants'                => array(
				<<<'PHP'
				define( 'FOO', 'foo' );
				define( 'BAR', 'bar' );
				PHP,
				array( 'function' => '*' ),
				<<<'PHP'
				PHP,
			),
			'Extract namespaced defined constants'        => array(
				<<<'PHP'
				namespace {
					define( 'Some\NS\FOO', 'nn' );
					define( 'Some\NS\BAR', 'nn' );
				}
				namespace Some\NS {
					define( 'FOO', 'ns' );
					define( 'BAR', 'ns' );
				}
				PHP,
				array( 'constant' => array( 'BAR', 'Some\NS\FOO' ) ),
				// Yes, this is correct. `define()` doesn't respect `namespace`.
				<<<'PHP'
				namespace {
					\define('Some\NS\FOO', 'nn');
				}
				namespace Some\NS {
					define('BAR', 'ns');
				}
				PHP,
			),
			'Extract namespaced defined constants using __NAMESPACE__' => array(
				<<<'PHP'
				namespace {
					define( __NAMESPACE__ . '\\FOO', 'nn' );
					define( __NAMESPACE__ . '\\BAR', 'nn' );
				}
				namespace Some\NS {
					define( __NAMESPACE__ . '\\FOO', 'ns' );
					define( __NAMESPACE__ . '\\BAR', 'ns' );
				}
				namespace XXX {
					define( __NAMESPACE__ . '\\' . 'BAZ', 'ns' );
				}
				PHP,
				array( 'constant' => array( '\BAR', 'Some\NS\FOO', 'XXX\BAZ' ) ),
				<<<'PHP'
				namespace {
					\define(__NAMESPACE__ . '\BAR', 'nn');
				}
				namespace Some\NS {
					define(__NAMESPACE__ . '\FOO', 'ns');
				}
				PHP,
				BufferedOutput::VERBOSITY_DEBUG,
				<<<'OUTPUT'
				 Processing namespace ''
				  Skipping define \FOO
				  Keeping define \BAR
				 Processing namespace 'Some\NS'
				  Keeping define Some\NS\FOO
				  Skipping define Some\NS\BAR
				 Processing namespace 'XXX'
				  Skipping define `__NAMESPACE__ . '\\' . 'BAZ'` because I can't stringify it
				OUTPUT . "\n",
			),

			'Extract some classes, defs = *'              => array(
				<<<'PHP'
				class Foo {
				}

				class Bar {
				}
				PHP,
				'*',
				<<<'PHP'
				namespace {
					class Foo
					{
					}
					class Bar
					{
					}
				}
				PHP,
			),
			'Extract some classes, class = *'             => array(
				<<<'PHP'
				class Foo {
				}

				class Bar {
				}
				PHP,
				array( 'class' => '*' ),
				<<<'PHP'
				namespace {
					class Foo
					{
					}
					class Bar
					{
					}
				}
				PHP,
			),
			'Extract a selected class by name'            => array(
				<<<'PHP'
				class Barf {
				}

				class FooBar {
				}

				class Foo {
					function Bar(){}
				}

				class Bar {
				}
				PHP,
				array( 'class' => array( 'Bar' => array() ) ),
				<<<'PHP'
				namespace {
					class Bar
					{
					}
				}
				PHP,
			),
			'Extract no classes'                          => array(
				<<<'PHP'
				class Foo {
				}

				class Bar {
				}
				PHP,
				array( 'trait' => array( 'Bar' ) ),
				<<<'PHP'
				PHP,
			),
			'Extract namespaced classes'                  => array(
				<<<'PHP'
				namespace {
					/** Non-namespaced */
					class Foo {
					}

					/** Non-namespaced */
					class Bar {
					}
				}

				namespace Some\NS {
					/** Namespaced */
					class Foo {
					}

					/** Namespaced */
					class Bar {
					}
				}
				PHP,
				array(
					'class' => array(
						'Foo'         => array(),
						'Some\NS\Bar' => array(),
					),
				),
				<<<'PHP'
				namespace {
					/** Non-namespaced */
					class Foo
					{
					}
				}
				namespace Some\NS {
					/** Namespaced */
					class Bar
					{
					}
				}
				PHP,
				BufferedOutput::VERBOSITY_DEBUG,
				<<<'OUTPUT'
				 Processing namespace ''
				  Processing class Foo
				  Skipping class Bar
				 Processing namespace 'Some\NS'
				  Skipping class Some\NS\Foo
				  Processing class Some\NS\Bar
				OUTPUT . "\n",
			),

			'Extract trait vs interface vs class'         => array(
				<<<'PHP'
				class Foo {
				}
				trait Foo {
				}
				interface Foo {
				}

				class Bar {
				}
				trait Bar {
				}
				interface Bar {
				}

				class Baz {
				}
				trait Baz {
				}
				interface Baz {
				}
				PHP,
				array(
					'class'     => array( 'Foo' => array() ),
					'trait'     => array( 'Bar' => array() ),
					'interface' => array( 'Baz' => array() ),
				),
				<<<'PHP'
				namespace {
					class Foo
					{
					}
					trait Bar
					{
					}
					interface Baz
					{
					}
				}
				PHP,
			),

			'Extract class constants, defs=*'             => array(
				<<<'PHP'
				class Foo {
					public const PUB = 'pub';
					protected const PROT = 'prot';
					private const PRIV = 'priv';
				}
				final class Bar {
					public const PUB = 'pub';
					protected const PROT = 'prot';
					private const PRIV = 'priv';
				}
				trait TFoo {
					public const PUB = 'pub';
					protected const PROT = 'prot';
					private const PRIV = 'priv';
				}
				interface IFoo {
					public const PUB = 'pub';
				}
				PHP,
				'*',
				<<<'PHP'
				namespace {
					class Foo
					{
						public const PUB = 'pub';
						protected const PROT = 'prot';
					}
					final class Bar
					{
						public const PUB = 'pub';
					}
					trait TFoo
					{
						public const PUB = 'pub';
						protected const PROT = 'prot';
						private const PRIV = 'priv';
					}
					interface IFoo
					{
						public const PUB = 'pub';
					}
				}
				PHP,
			),
			'Extract class constants, class=*'            => array(
				<<<'PHP'
				class Foo {
					public const PUB = 'pub';
					protected const PROT = 'prot';
					private const PRIV = 'priv';
				}
				final class Bar {
					public const PUB = 'pub';
					protected const PROT = 'prot';
					private const PRIV = 'priv';
				}
				PHP,
				array( 'class' => '*' ),
				<<<'PHP'
				namespace {
					class Foo
					{
						public const PUB = 'pub';
						protected const PROT = 'prot';
					}
					final class Bar
					{
						public const PUB = 'pub';
					}
				}
				PHP,
			),
			'Extract class constants, class[...]=*'       => array(
				<<<'PHP'
				class Foo {
					public const PUB = 'pub';
					protected const PROT = 'prot';
					private const PRIV = 'priv';
				}
				final class Bar {
					public const PUB = 'pub';
					protected const PROT = 'prot';
					private const PRIV = 'priv';
				}
				PHP,
				array(
					'class' => array(
						'Foo' => '*',
						'Bar' => '*',
					),
				),
				<<<'PHP'
				namespace {
					class Foo
					{
						public const PUB = 'pub';
						protected const PROT = 'prot';
					}
					final class Bar
					{
						public const PUB = 'pub';
					}
				}
				PHP,
			),
			'Extract class constants, class[...].constant=*' => array(
				<<<'PHP'
				class Foo {
					public const PUB = 'pub';
					protected const PROT = 'prot';
					private const PRIV = 'priv';
				}
				final class Bar {
					public const PUB = 'pub';
					protected const PROT = 'prot';
					private const PRIV = 'priv';
				}
				PHP,
				array(
					'class' => array(
						'Foo' => array( 'constant' => '*' ),
						'Bar' => array( 'constant' => '*' ),
					),
				),
				<<<'PHP'
				namespace {
					class Foo
					{
						public const PUB = 'pub';
						protected const PROT = 'prot';
					}
					final class Bar
					{
						public const PUB = 'pub';
					}
				}
				PHP,
			),
			'Extract a selected class constant by name'   => array(
				<<<'PHP'
				class Foo {
					const FOO = 'foo', BAR = 'bar';
					const BAZ = 'BAR';
				}
				trait TFoo {
					const FOO = 'foo', BAR = 'bar';
					const BAZ = 'BAR';
				}
				interface IFoo {
					const FOO = 'foo', BAR = 'bar';
					const BAZ = 'BAR';
				}
				PHP,
				array( 'class' => array( 'Foo' => array( 'constant' => array( 'BAR' ) ) ) ),
				<<<'PHP'
				namespace {
					class Foo
					{
						const BAR = 'bar';
					}
				}
				PHP,
			),
			'Extract no class constants'                  => array(
				<<<'PHP'
				class Foo {
					const FOO = 'foo', BAR = 'bar';
					const BAZ = 'BAR';
				}
				PHP,
				array( 'class' => array( 'Foo' => array( 'method' => array( 'BAR' ) ) ) ),
				<<<'PHP'
				namespace {
					class Foo
					{
					}
				}
				PHP,
			),
			'Extract a selected class constant by name from a namespaced class' => array(
				<<<'PHP'
				namespace Some\NS;
				class Foo {
					const FOO = 'foo', BAR = 'bar';
					const BAZ = 'BAR';
				}
				PHP,
				array(
					'class' => array(
						'Foo'         => '*',
						'Some\NS\Foo' => array( 'constant' => array( 'BAR' ) ),
					),
				),
				<<<'PHP'
				namespace Some\NS;

				class Foo
				{
					const BAR = 'bar';
				}
				PHP,
			),
		);
	}

	/**
	 * Test the visitor when parent nodes aren't available.
	 *
	 * @dataProvider provideIntegration_NoParent
	 * @param string $input Input PHP class contents.
	 * @param string $expect Expected exception message.
	 */
	public function testIntegration_NoParent( string $input, string $expect ) {
		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage( $expect );

		$output    = new BufferedOutput();
		$parser    = ( new ParserFactory() )->createForHostVersion();
		$traverser = new NodeTraverser();
		$traverser->addVisitor( new NameResolver() );
		$visitor = new StubNodeVisitor( $output );
		$traverser->addVisitor( $visitor );

		$stmts = $parser->parse( "<?php\nclass Foo {\n$input\n}" );
		$this->assertNotNull( $stmts );
		'@phan-var \PhpParser\Node[] $stmts';

		$visitor->setDefs( 'dummy.php', '*' );
		$traverser->traverse( $stmts );
	}

	/**
	 * Data provider for testIntegration_NoParent.
	 */
	public function provideIntegration_NoParent() {
		return array(
			'ClassConst'  => array(
				'const C = "C";',
				'No parent found at dummy.php:3 (node Stmt_ClassConst)',
			),
			'Property'    => array(
				'public $prop;',
				'No parent found at dummy.php:3 (node Stmt_Property)',
			),
			'ClassMethod' => array(
				'public function method() {}',
				'No parent found at dummy.php:3 (node Stmt_ClassMethod)',
			),
		);
	}
}
