<?php
/**
 * Tests for the jetpack-stub-generator PhpParser\PhpDocNameResolver class.
 *
 * @package automattic/jetpack-stub-generator
 */

// phpcs:disable PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696

namespace Automattic\Jetpack\StubGenerator\Tests\PhpParser;

use Automattic\Jetpack\StubGenerator\PhpParser\PhpDocNameResolver;
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitor\NameResolver;
use PhpParser\ParserFactory;
use PhpParser\PrettyPrinter\Standard as PrettyPrinter_Standard;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Output\BufferedOutput;

/**
 * Tests for the jetpack-stub-generator PhpDocNameResolver class.
 *
 * @covers \Automattic\Jetpack\StubGenerator\PhpParser\PhpDocNameResolver
 * @covers \Automattic\Jetpack\StubGenerator\PhpDocParser\NameResolver
 */
class PhpDocNameResolverTest extends TestCase {

	/**
	 * Test the visitor.
	 *
	 * @dataProvider provideIntegration
	 * @param string $input Input PHP code (no leading `<?php` needed).
	 * @param string $expect Expected output PHP code.
	 * @param int    $verbosity Output verbosity.
	 * @param string $expectOutput Expected console output.
	 */
	public function testIntegration( string $input, string $expect, int $verbosity = BufferedOutput::VERBOSITY_NORMAL, string $expectOutput = '' ) {
		$output       = new BufferedOutput( $verbosity );
		$parser       = ( new ParserFactory() )->createForHostVersion();
		$traverser    = new NodeTraverser();
		$nameResolver = new NameResolver();
		$traverser->addVisitor( $nameResolver );
		$visitor = new PhpDocNameResolver( $nameResolver->getNameContext(), $output );
		$traverser->addVisitor( $visitor );

		$stmts = $parser->parse( "<?php\n$input" );
		$this->assertNotNull( $stmts );

		$stmts = $traverser->traverse( $stmts );

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
			'Simple use'             => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				use Some\NS\Sub\Baz;
				use Aliased as Something;

				class Bar {
					/**
					 * @var Foo
					 */
					public $foo;

					/**
					 * @var Bar
					 */
					public $bar;

					/**
					 * @var \Bar
					 */
					public $rootbar;

					/**
					 * @var Baz
					 */
					public $baz;

					/**
					 * @var \Qu\ux
					 */
					public $quux;

					/**
					 * @var Something
					 */
					public $something;
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				use Some\NS\Sub\Baz;
				use Aliased as Something;
				class Bar
				{
					/**
					 * @var \Other\NS\Foo
					 */
					public $foo;
					/**
					 * @var Bar
					 */
					public $bar;
					/**
					 * @var \Bar
					 */
					public $rootbar;
					/**
					 * @var Sub\Baz
					 */
					public $baz;
					/**
					 * @var \Qu\ux
					 */
					public $quux;
					/**
					 * @var \Aliased
					 */
					public $something;
				}
				PHP,
			),
			'Union type'             => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				class Bar {
					/**
					 * @var Foo|Bar|null
					 */
					public $bar;
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				class Bar
				{
					/**
					 * @var \Other\NS\Foo|Bar|null
					 */
					public $bar;
				}
				PHP,
			),
			'Array shapes'           => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				class Bar {
					/**
					 * @var array{foo:Foo,bar:Bar,best?:Foo|Bar|null}
					 */
					public $thing;

					/**
					 * @var array<string,Foo|Bar>
					 */
					public $map;
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				class Bar
				{
					/**
					 * @var array{foo:\Other\NS\Foo,bar:Bar,best?:\Other\NS\Foo|Bar|null}
					 */
					public $thing;
					/**
					 * @var array<string,\Other\NS\Foo|Bar>
					 */
					public $map;
				}
				PHP,
			),
			'Object shapes'          => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				class Bar {
					/**
					 * @var object{foo:Foo,bar:Bar,best?:Foo|Bar|null}
					 */
					public $thing;
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				class Bar
				{
					/**
					 * @var object{foo:\Other\NS\Foo,bar:Bar,best?:\Other\NS\Foo|Bar|null}
					 */
					public $thing;
				}
				PHP,
			),
			'Array type'             => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				class Bar {
					/**
					 * @var Foo[]
					 */
					public $foos;

					/**
					 * @var Foo[]|Bar[]
					 */
					public $foosOrBars;

					/**
					 * @var (Foo|Bar)[]
					 */
					public $fooOrBars;
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				class Bar
				{
					/**
					 * @var \Other\NS\Foo[]
					 */
					public $foos;
					/**
					 * @var \Other\NS\Foo[]|Bar[]
					 */
					public $foosOrBars;
					/**
					 * @var (\Other\NS\Foo|Bar)[]
					 */
					public $fooOrBars;
				}
				PHP,
			),
			'Callable type'          => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				class Bar {
					/**
					 * @var callable(Foo,Bar,bool):(Foo|Bar)
					 */
					public $callback;

					/**
					 * @var callable(Foo $foo,Bar $bar,bool $b):Foo
					 */
					public $callback2;

					/**
					 * @var callable(Foo...):void
					 */
					public $callback3;

					/**
					 * @var Closure(Foo,Bar,bool):(Foo|Bar)
					 */
					public $closure;
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				class Bar
				{
					/**
					 * @var callable(\Other\NS\Foo,Bar,bool):(\Other\NS\Foo|Bar)
					 */
					public $callback;
					/**
					 * @var callable(\Other\NS\Foo $foo,Bar $bar,bool $b):\Other\NS\Foo
					 */
					public $callback2;
					/**
					 * @var callable(\Other\NS\Foo...):void
					 */
					public $callback3;
					/**
					 * @var Closure(\Other\NS\Foo,Bar,bool):(\Other\NS\Foo|Bar)
					 */
					public $closure;
				}
				PHP,
			),
			'Conditional type'       => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				/**
				 * Phan doesn't seem to support this, but the doc parser does.
				 *
				 * @param $size Name.
				 * @return ($size is positive-int ? non-empty-array<Foo> : Foo[])
				 */
				function makeFoos( int $size ): array {
				}

				/**
				 * @template T of Foo|Bar
				 */
				class XXX {
					/**
					 * @var (T is Foo ? Foo : Foo|T )
					 */
					public $var;
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				/**
				 * Phan doesn't seem to support this, but the doc parser does.
				 *
				 * @param $size Name.
				 * @return ($size is positive-int ? non-empty-array<\Other\NS\Foo> : \Other\NS\Foo[])
				 */
				function makeFoos(int $size): array
				{
				}
				/**
				 * @template T of \Other\NS\Foo|Bar
				 */
				class XXX
				{
					/**
					 * @var (T is \Other\NS\Foo ? \Other\NS\Foo : \Other\NS\Foo|T )
					 */
					public $var;
				}
				PHP,
			),
			'Const type'             => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				class Bar {
					/**
					 * @var '*'
					 */
					public $star;
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				class Bar
				{
					/**
					 * @var '*'
					 */
					public $star;
				}
				PHP,
			),
			'Generic type'           => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				class Bar {
					/**
					 * @var array<Foo>
					 */
					public $var;

					/**
					 * @var Foo<int>
					 */
					public $var2;
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				class Bar
				{
					/**
					 * @var array<\Other\NS\Foo>
					 */
					public $var;
					/**
					 * @var \Other\NS\Foo<int>
					 */
					public $var2;
				}
				PHP,
			),
			'Intersection type'      => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				/**
				 * @param Foo&Bar $param
				 */
				function huh( $param ) {
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				/**
				 * @param \Other\NS\Foo&Bar $param
				 */
				function huh($param)
				{
				}
				PHP,
			),
			'Nullable type'          => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				/**
				 * @param ?Foo $param
				 */
				function func( ?Foo $param ) {
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				/**
				 * @param ?\Other\NS\Foo $param
				 */
				function func(?\Other\NS\Foo $param)
				{
				}
				PHP,
			),
			'Offset type'            => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				/**
				 * Phan doesn't seem to support this, but the doc parser does.
				 *
				 * @phan-type AMap = array{foo:Foo,bar:Bar,best?:Foo|Bar|null}
				 * @param AMap $map
				 * @return AMap['bar']
				 */
				function huh( $map ) {
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				/**
				 * Phan doesn't seem to support this, but the doc parser does.
				 *
				 * @phan-type AMap = array{foo:\Other\NS\Foo,bar:Bar,best?:\Other\NS\Foo|Bar|null}
				 * @param AMap $map
				 * @return AMap['bar']
				 */
				function huh($map)
				{
				}
				PHP,
			),
			'This type'              => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				class Bar {
					/**
					 * @return $this
					 */
					public function chainable() {}
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				class Bar
				{
					/**
					 * @return $this
					 */
					public function chainable()
					{
					}
				}
				PHP,
			),
			'Param and returns'      => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				/**
				 * Map a Foo.
				 *
				 * @param string $name Name.
				 * @param Foo|null $foo Foo to munge.
				 * @param array<string,Foo> &$map Map.
				 * @return ?Foo Munged Foo.
				 */
				function mapFoo( string $name, ?Foo $foo, array &$map ): ?Foo {
					$ret = $map[$name] ?? null;
					if ( $foo ) {
						$map[$name] = $foo;
					}
					return $ret;
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				/**
				 * Map a Foo.
				 *
				 * @param string $name Name.
				 * @param \Other\NS\Foo|null $foo Foo to munge.
				 * @param array<string,\Other\NS\Foo> &$map Map.
				 * @return ?\Other\NS\Foo Munged Foo.
				 */
				function mapFoo(string $name, ?\Other\NS\Foo $foo, array &$map): ?\Other\NS\Foo
				{
					$ret = $map[$name] ?? null;
					if ($foo) {
						$map[$name] = $foo;
					}
					return $ret;
				}
				PHP,
			),
			'Various built-in types' => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				class Bar {
					/**
					 * @var null|bool|int|float|string|array|object|resource|iterable
					 */
					public $var;

					/**
					 * @var true|false|null
					 */
					public $tristate;

					/**
					 * @var mixed
					 */
					public $mixed;

					/**
					 * @return never
					 */
					public function neverReturns() {}

					/**
					 * @return void
					 */
					public function nothing(): void {}

					/**
					 * @return self
					 */
					public function self() {}

					/**
					 * @return static
					 */
					public function static() {}
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				class Bar
				{
					/**
					 * @var null|bool|int|float|string|array|object|resource|iterable
					 */
					public $var;
					/**
					 * @var true|false|null
					 */
					public $tristate;
					/**
					 * @var mixed
					 */
					public $mixed;
					/**
					 * @return never
					 */
					public function neverReturns()
					{
					}
					/**
					 * @return void
					 */
					public function nothing(): void
					{
					}
					/**
					 * @return self
					 */
					public function self()
					{
					}
					/**
					 * @return static
					 */
					public function static()
					{
					}
				}
				PHP,
			),
			'Various extended types' => array(
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;

				class Bar
				{
					/**
					 * @var list<Foo>
					 */
					public $list;

					/**
					 * @var non-empty-list<Foo>
					 */
					public $list2;

					/**
					 * @var non-empty-array<int, Foo>
					 */
					public $arr;

					/**
					 * @var associative-array<int, Foo>
					 */
					public $assoc;

					/**
					 * @var non-empty-associative-array<int, Foo>
					 */
					public $assoc2;

					/**
					 * @var class-string
					 */
					public $classname;

					/**
					 * @var class-string<Foo>
					 */
					public $classname2;

					/**
					 * @var callable-string|callable-object|callable-array
					 */
					public $callable;
				}
				PHP,
				<<<'PHP'
				namespace Some\NS;

				use Other\NS\Foo;
				class Bar
				{
					/**
					 * @var list<\Other\NS\Foo>
					 */
					public $list;
					/**
					 * @var non-empty-list<\Other\NS\Foo>
					 */
					public $list2;
					/**
					 * @var non-empty-array<int, \Other\NS\Foo>
					 */
					public $arr;
					/**
					 * @var associative-array<int, \Other\NS\Foo>
					 */
					public $assoc;
					/**
					 * @var non-empty-associative-array<int, \Other\NS\Foo>
					 */
					public $assoc2;
					/**
					 * @var class-string
					 */
					public $classname;
					/**
					 * @var class-string<\Other\NS\Foo>
					 */
					public $classname2;
					/**
					 * @var callable-string|callable-object|callable-array
					 */
					public $callable;
				}
				PHP,
			),
		);
	}
}
