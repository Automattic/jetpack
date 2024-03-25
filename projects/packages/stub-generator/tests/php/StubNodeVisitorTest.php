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
		);
	}
}
