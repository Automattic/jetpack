<?php
/**
 * Tests for the jetpack-stub-generator PhpParser\StubNodeVisitor class.
 *
 * @package automattic/jetpack-stub-generator
 */

// phpcs:disable PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696

namespace Automattic\Jetpack\StubGenerator\Tests\PhpParser;

use Automattic\Jetpack\StubGenerator\PhpParser\StubNodeVisitor;
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
 * @covers \Automattic\Jetpack\StubGenerator\PhpParser\StubNodeVisitor
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
					/**
					 * @phan-return mixed Dummy doc for stub.
					 */
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
					/**
					 * @phan-return mixed Dummy doc for stub.
					 */
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
					/** Non-namespaced
					 * @phan-return mixed Dummy doc for stub.
					 */
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
					final public const FPUB = 'fpub';
				}
				final class Bar {
					public const PUB = 'pub';
					protected const PROT = 'prot';
					private const PRIV = 'priv';
					final public const FPUB = 'fpub';
				}
				trait TFoo {
					public const PUB = 'pub';
					protected const PROT = 'prot';
					private const PRIV = 'priv';
					final public const FPUB = 'fpub';
				}
				interface IFoo {
					public const PUB = 'pub';
					final public const FPUB = 'fpub';
				}
				PHP,
				'*',
				<<<'PHP'
				namespace {
					class Foo
					{
						public const PUB = 'pub';
						protected const PROT = 'prot';
						final public const FPUB = 'fpub';
					}
					final class Bar
					{
						public const PUB = 'pub';
						final public const FPUB = 'fpub';
					}
					trait TFoo
					{
						public const PUB = 'pub';
						protected const PROT = 'prot';
						private const PRIV = 'priv';
						final public const FPUB = 'fpub';
					}
					interface IFoo
					{
						public const PUB = 'pub';
						final public const FPUB = 'fpub';
					}
				}
				PHP,
				BufferedOutput::VERBOSITY_DEBUG,
				<<<'OUTPUT'
				 Processing class Foo
				  Keeping const PUB
				  Keeping const PROT
				  Skipping private const PRIV
				  Keeping const FPUB
				 Processing class Bar
				  Keeping const PUB
				  Skipping final-class protected const PROT
				  Skipping private const PRIV
				  Keeping const FPUB
				 Processing trait TFoo
				  Keeping const PUB
				  Keeping const PROT
				  Keeping const PRIV
				  Keeping const FPUB
				 Processing interface IFoo
				  Keeping const PUB
				  Keeping const FPUB
				OUTPUT . "\n",
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
			'Extract no class constants because we only want the class' => array(
				<<<'PHP'
				class Foo {
					const FOO = 'foo', BAR = 'bar';
					const BAZ = 'BAR';
				}
				PHP,
				array( 'class' => array( 'Foo' => array() ) ),
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
						'Some\NS\Foo' => array( 'constant' => array( 'BAR', 'Some\NS\BAZ' ) ),
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

			'Extract class properties, defs=*'            => array(
				<<<'PHP'
				class Foo {
					public $pub = 'pub';
					protected $prot = 'prot';
					private $priv = 'priv';
					public static $spub = 'spub';
					protected static $sprot = 'sprot';
					private static $spriv = 'spriv';
				}
				final class Bar {
					public $pub = 'pub';
					protected $prot = 'prot';
					private $priv = 'priv';
					public static $spub = 'spub';
					protected static $sprot = 'sprot';
					private static $spriv = 'spriv';
				}
				trait TFoo {
					public $pub = 'pub';
					protected $prot = 'prot';
					private $priv = 'priv';
					public static $spub = 'spub';
					protected static $sprot = 'sprot';
					private static $spriv = 'spriv';
				}
				interface IFoo {
					public $pub = 'pub';
					public static $spub = 'spub';
				}
				PHP,
				'*',
				<<<'PHP'
				namespace {
					class Foo
					{
						public $pub = 'pub';
						protected $prot = 'prot';
						public static $spub = 'spub';
						protected static $sprot = 'sprot';
					}
					final class Bar
					{
						public $pub = 'pub';
						public static $spub = 'spub';
					}
					trait TFoo
					{
						public $pub = 'pub';
						protected $prot = 'prot';
						private $priv = 'priv';
						public static $spub = 'spub';
						protected static $sprot = 'sprot';
						private static $spriv = 'spriv';
					}
					interface IFoo
					{
						public $pub = 'pub';
						public static $spub = 'spub';
					}
				}
				PHP,
				BufferedOutput::VERBOSITY_DEBUG,
				<<<'OUTPUT'
				 Processing class Foo
				  Keeping property $pub
				  Keeping property $prot
				  Skipping private property $priv
				  Keeping property $spub
				  Keeping property $sprot
				  Skipping private property $spriv
				 Processing class Bar
				  Keeping property $pub
				  Skipping final-class protected property $prot
				  Skipping private property $priv
				  Keeping property $spub
				  Skipping final-class protected property $sprot
				  Skipping private property $spriv
				 Processing trait TFoo
				  Keeping property $pub
				  Keeping property $prot
				  Keeping property $priv
				  Keeping property $spub
				  Keeping property $sprot
				  Keeping property $spriv
				 Processing interface IFoo
				  Keeping property $pub
				  Keeping property $spub
				OUTPUT . "\n",
			),
			'Extract class properties, class=*'           => array(
				<<<'PHP'
				class Foo {
					public $pub = 'pub';
					protected $prot = 'prot';
					private $priv = 'priv';
				}
				final class Bar {
					public $pub = 'pub';
					protected $prot = 'prot';
					private $priv = 'priv';
				}
				PHP,
				array( 'class' => '*' ),
				<<<'PHP'
				namespace {
					class Foo
					{
						public $pub = 'pub';
						protected $prot = 'prot';
					}
					final class Bar
					{
						public $pub = 'pub';
					}
				}
				PHP,
			),
			'Extract class properties, class[...]=*'      => array(
				<<<'PHP'
				class Foo {
					public $pub = 'pub';
					protected $prot = 'prot';
					private $priv = 'priv';
				}
				final class Bar {
					public $pub = 'pub';
					protected $prot = 'prot';
					private $priv = 'priv';
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
						public $pub = 'pub';
						protected $prot = 'prot';
					}
					final class Bar
					{
						public $pub = 'pub';
					}
				}
				PHP,
			),
			'Extract class properties, class[...].property=*' => array(
				<<<'PHP'
				class Foo {
					public $pub = 'pub';
					protected $prot = 'prot';
					private $priv = 'priv';
				}
				final class Bar {
					public $pub = 'pub';
					protected $prot = 'prot';
					private $priv = 'priv';
				}
				PHP,
				array(
					'class' => array(
						'Foo' => array( 'property' => '*' ),
						'Bar' => array( 'property' => '*' ),
					),
				),
				<<<'PHP'
				namespace {
					class Foo
					{
						public $pub = 'pub';
						protected $prot = 'prot';
					}
					final class Bar
					{
						public $pub = 'pub';
					}
				}
				PHP,
			),
			'Extract a selected class property by name'   => array(
				<<<'PHP'
				class Foo {
					public $foo = 'FOO', $bar = 'BAR';
					public $baz = 'bar';
				}
				trait TFoo {
					public $foo = 'FOO', $bar = 'BAR';
					public $baz = 'bar';
				}
				interface IFoo {
					public $foo = 'FOO', $bar = 'BAR';
					public $baz = 'bar';
				}
				PHP,
				array( 'class' => array( 'Foo' => array( 'property' => array( 'bar' ) ) ) ),
				<<<'PHP'
				namespace {
					class Foo
					{
						public $bar = 'BAR';
					}
				}
				PHP,
			),
			'Extract no class properties'                 => array(
				<<<'PHP'
				class Foo {
					public $foo = 'FOO', $bar = 'BAR';
					public $baz = 'bar';
				}
				PHP,
				array( 'class' => array( 'Foo' => array( 'method' => array( 'bar' ) ) ) ),
				<<<'PHP'
				namespace {
					class Foo
					{
					}
				}
				PHP,
			),
			'Extract no class properties because we only want the class' => array(
				<<<'PHP'
				class Foo {
					public $foo = 'FOO', $bar = 'BAR';
					public $baz = 'bar';
				}
				PHP,
				array( 'class' => array( 'Foo' => array() ) ),
				<<<'PHP'
				namespace {
					class Foo
					{
					}
				}
				PHP,
			),
			'Extract a selected class property by name from a namespaced class' => array(
				<<<'PHP'
				namespace Some\NS;
				class Foo {
					public $foo = 'FOO', $bar = 'BAR';
					public $baz = 'bar';
				}
				PHP,
				array(
					'class' => array(
						'Foo'         => '*',
						'Some\NS\Foo' => array( 'property' => array( 'bar', 'Some\NS\baz' ) ),
					),
				),
				<<<'PHP'
				namespace Some\NS;

				class Foo
				{
					public $bar = 'BAR';
				}
				PHP,
			),

			'Extract class methods, defs=*'               => array(
				<<<'PHP'
				class Foo {
					public function pub() { return 'pub'; }
					protected function prot() { return 'prot'; }
					private function priv() { return 'priv'; }
					public static function spub() { return 'spub'; }
					protected static function sprot() { return 'sprot'; }
					private static function spriv() { return 'spriv'; }
				}
				final class Bar {
					public function pub() { return 'pub'; }
					protected function prot() { return 'prot'; }
					private function priv() { return 'priv'; }
					public static function spub() { return 'spub'; }
					protected static function sprot() { return 'sprot'; }
					private static function spriv() { return 'spriv'; }
				}
				trait TFoo {
					public function pub() { return 'pub'; }
					protected function prot() { return 'prot'; }
					private function priv() { return 'priv'; }
					public static function spub() { return 'spub'; }
					protected static function sprot() { return 'sprot'; }
					private static function spriv() { return 'spriv'; }
				}
				interface IFoo {
					public function pub() { return 'pub'; }
					public static function spub() { return 'spub'; }
				}
				PHP,
				'*',
				<<<'PHP'
				namespace {
					class Foo
					{
						public function pub()
						{
						}
						protected function prot()
						{
						}
						public static function spub()
						{
						}
						protected static function sprot()
						{
						}
					}
					final class Bar
					{
						public function pub()
						{
						}
						public static function spub()
						{
						}
					}
					trait TFoo
					{
						public function pub()
						{
						}
						protected function prot()
						{
						}
						private function priv()
						{
						}
						public static function spub()
						{
						}
						protected static function sprot()
						{
						}
						private static function spriv()
						{
						}
					}
					interface IFoo
					{
						public function pub()
						{
						}
						public static function spub()
						{
						}
					}
				}
				PHP,
				BufferedOutput::VERBOSITY_DEBUG,
				<<<'OUTPUT'
				 Processing class Foo
				  Keeping method pub
				  Keeping method prot
				  Skipping private method priv
				  Keeping method spub
				  Keeping method sprot
				  Skipping private method spriv
				 Processing class Bar
				  Keeping method pub
				  Skipping final-class protected method prot
				  Skipping private method priv
				  Keeping method spub
				  Skipping final-class protected method sprot
				  Skipping private method spriv
				 Processing trait TFoo
				  Keeping method pub
				  Keeping method prot
				  Keeping method priv
				  Keeping method spub
				  Keeping method sprot
				  Keeping method spriv
				 Processing interface IFoo
				  Keeping method pub
				  Keeping method spub
				OUTPUT . "\n",
			),
			'Extract class methods, class=*'              => array(
				<<<'PHP'
				class Foo {
					public function pub() { return 'pub'; }
					protected function prot() { return 'prot'; }
					private function priv() { return 'priv'; }
				}
				final class Bar {
					public function pub() { return 'pub'; }
					protected function prot() { return 'prot'; }
					private function priv() { return 'priv'; }
				}
				PHP,
				array( 'class' => '*' ),
				<<<'PHP'
				namespace {
					class Foo
					{
						public function pub()
						{
						}
						protected function prot()
						{
						}
					}
					final class Bar
					{
						public function pub()
						{
						}
					}
				}
				PHP,
			),
			'Extract class methods, class[...]=*'         => array(
				<<<'PHP'
				class Foo {
					public function pub() { return 'pub'; }
					protected function prot() { return 'prot'; }
					private function priv() { return 'priv'; }
				}
				final class Bar {
					public function pub() { return 'pub'; }
					protected function prot() { return 'prot'; }
					private function priv() { return 'priv'; }
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
						public function pub()
						{
						}
						protected function prot()
						{
						}
					}
					final class Bar
					{
						public function pub()
						{
						}
					}
				}
				PHP,
			),
			'Extract class methods, class[...].method=*'  => array(
				<<<'PHP'
				class Foo {
					public function pub() { return 'pub'; }
					protected function prot() { return 'prot'; }
					private function priv() { return 'priv'; }
				}
				final class Bar {
					public function pub() { return 'pub'; }
					protected function prot() { return 'prot'; }
					private function priv() { return 'priv'; }
				}
				PHP,
				array(
					'class' => array(
						'Foo' => array( 'method' => '*' ),
						'Bar' => array( 'method' => '*' ),
					),
				),
				<<<'PHP'
				namespace {
					class Foo
					{
						public function pub()
						{
						}
						protected function prot()
						{
						}
					}
					final class Bar
					{
						public function pub()
						{
						}
					}
				}
				PHP,
			),
			'Extract a selected class method by name'     => array(
				<<<'PHP'
				class Foo {
					public function foo() { return 'FOO'; }
					public function bar() { return 'BAR'; }
					public function baz() { return 'bar'; }
				}
				trait TFoo {
					public function foo() { return 'FOO'; }
					public function bar() { return 'BAR'; }
					public function baz() { return 'bar'; }
				}
				interface IFoo {
					public function foo() { return 'FOO'; }
					public function bar() { return 'BAR'; }
					public function baz() { return 'bar'; }
				}
				PHP,
				array( 'class' => array( 'Foo' => array( 'method' => array( 'bar' ) ) ) ),
				<<<'PHP'
				namespace {
					class Foo
					{
						public function bar()
						{
						}
					}
				}
				PHP,
			),
			'Extract no class methods'                    => array(
				<<<'PHP'
				class Foo {
					public function foo() { return 'FOO'; }
					public function bar() { return 'BAR'; }
					public function baz() { return 'bar'; }
				}
				PHP,
				array( 'class' => array( 'Foo' => array( 'constant' => array( 'bar' ) ) ) ),
				<<<'PHP'
				namespace {
					class Foo
					{
					}
				}
				PHP,
			),
			'Extract no class methods because we only want the class' => array(
				<<<'PHP'
				class Foo {
					public function foo() { return 'FOO'; }
					public function bar() { return 'BAR'; }
					public function baz() { return 'bar'; }
				}
				PHP,
				array( 'class' => array( 'Foo' => array() ) ),
				<<<'PHP'
				namespace {
					class Foo
					{
					}
				}
				PHP,
			),
			'Extract a selected class method by name from a namespaced class' => array(
				<<<'PHP'
				namespace Some\NS;
				class Foo {
					public function foo() { return 'FOO'; }
					public function bar() { return 'BAR'; }
					public function baz() { return 'bar'; }
				}
				PHP,
				array(
					'class' => array(
						'Foo'         => '*',
						'Some\NS\Foo' => array( 'method' => array( 'bar', 'Some\NS\baz' ) ),
					),
				),
				<<<'PHP'
				namespace Some\NS;

				class Foo
				{
					public function bar()
					{
					}
				}
				PHP,
			),

			'Handling of use directives'                  => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				use Aliased as Baz;

				class Bar {
					public function mungeFoo( ?Foo $foo, $map ): Foo {}
					public function getBaz(): Baz {}
				}
				PHP,
				'*',
				<<<'PHP'
				namespace Some\NS;

				class Bar
				{
					public function mungeFoo(?\Other\NS\Foo $foo, $map): \Other\NS\Foo
					{
					}
					public function getBaz(): \Aliased
					{
					}
				}
				PHP,
			),

			'Handling of func_get_args()'                 => array(
				<<<'PHP'
				namespace Some\NS;

				function no_params() {
					func_get_args();
				}

				function no_varargs( $x, $y ) {
					func_get_args();
				}

				function has_varargs( $x, ...$args ) {
					func_get_args();
				}

				class Foo {
					public function no_params() {
						func_get_args();
					}

					public function no_varargs( $x, $y ) {
						func_get_args();
					}

					public function has_varargs( $x, ...$args ) {
						func_get_args();
					}
				}

				function uses_func_get_arg() {
					func_get_arg();
				}

				function uses_func_num_args() {
					func_num_args();
				}
				PHP,
				'*',
				<<<'PHP'
				namespace Some\NS;

				function no_params(...$func_get_args)
				{
				}
				function no_varargs($x, $y, ...$func_get_args)
				{
				}
				function has_varargs($x, ...$args)
				{
				}
				class Foo
				{
					public function no_params(...$func_get_args)
					{
					}
					public function no_varargs($x, $y, ...$func_get_args)
					{
					}
					public function has_varargs($x, ...$args)
					{
					}
				}
				function uses_func_get_arg(...$func_get_args)
				{
				}
				function uses_func_num_args(...$func_get_args)
				{
				}
				PHP,
			),

			'Function return type inference'              => array(
				<<<'PHP'
				namespace X;

				function no_return() {
				}

				function empty_return() {
					return;
				}

				function has_return() {
					if ( foo() ) {
						return;
					} else {
						return 42;
					}
				}

				function return_only_in_subfunctions() {
					function xxx() {
						return 42;
					}
					class Huh {
						public function xxx() {
							return 42;
						}
					}
					$x = function () {
						return 42;
					};
					$x = new class() {
						function xxx() {
							return 42;
						}
					};
				}

				function has_return_and_decl(): array {
					return array();
				}

				/** @return array */
				function has_return_and_phpdoc() {
					return array();
				}

				/** @phan-return array */
				function has_return_and_phan_phpdoc() {
					return array();
				}

				/** @phan-real-return array */
				function has_return_and_phan_phpdoc_real() {
					return array();
				}

				class Foo {
					function has_return() {
						return 42;
					}
				}
				PHP,
				'*',
				<<<'PHP'
				namespace X;

				function no_return()
				{
				}
				function empty_return()
				{
				}
				/**
				 * @phan-return mixed Dummy doc for stub.
				 */
				function has_return()
				{
				}
				function return_only_in_subfunctions()
				{
				}
				function has_return_and_decl(): array
				{
				}
				/** @return array */
				function has_return_and_phpdoc()
				{
				}
				/** @phan-return array */
				function has_return_and_phan_phpdoc()
				{
				}
				/** @phan-real-return array */
				function has_return_and_phan_phpdoc_real()
				{
				}
				class Foo
				{
					function has_return()
					{
					}
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
