<?php

namespace Automattic\Jetpack\Codesniffer\Tests\Utils;

use Automattic\Jetpack\Codesniffer\Utils\Attributes;
use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHPUnit\Framework\Attributes\DataProvider;
use Throwable;

class AttributesTest extends TestCase {

	/**
	 * @dataProvider provideGetAttributesForDeclaration
	 * @param string          $content File content to test with.
	 * @param string|int      $startType Token to lookup for `$start`.
	 * @param array|Throwable $expect Expected result: attributes or exception thrown.
	 */
	#[DataProvider( 'provideGetAttributesForDeclaration' )]
	public function testGetAttributesForDeclaration( $content, $startType, $expect ) {
		$phpcsFile = $this->createPhpcsFile( $content );
		$start     = $phpcsFile->findNext( $startType, 0 );
		$this->assertIsInt( $start );

		if ( $expect instanceof Throwable ) {
			$this->expectException( get_class( $expect ) );
			$this->expectExceptionMessage( $expect->getMessage() );
		}

		$ret = Attributes::getAttributesForDeclaration( $phpcsFile, $start );
		if ( ! $expect instanceof Throwable ) {
			$actual = array();
			$tokens = $phpcsFile->getTokens();
			foreach ( $ret as $attr ) {
				$actual[] = array(
					'name'       => $attr['name'],
					'ptrtoken'   => $tokens[ $attr['ptr'] ]['content'],
					'content'    => $phpcsFile->getTokensAsString( $attr['start'], $attr['end'] - $attr['start'] + 1, true ),
					'params'     => is_array( $attr['params'] ) ? array_map(
						function ( $p ) {
							return $p['raw']; },
						$attr['params']
					) : null,
					'isMulti'    => $attr['isMulti'],
					'attcontent' => $phpcsFile->getTokensAsString( $attr['attstart'], $attr['attend'] - $attr['attstart'] + 1, true ),
				);
			}

			foreach ( $expect as $i => $e ) {
				if ( ! $e['isMulti'] ) {
					$expect[ $i ]['attcontent'] = $e['content'];
				}
			}

			$this->assertSame( $expect, $actual );
		}
	}

	public static function provideGetAttributesForDeclaration() {
		$cases = array(
			'Class'                          => array(
				<<<'EOF'
					<?php

					#[Attribute]
					/** Misplaced doc block. */
					#[Multi1, Multi2( "param", 42 )]
					// A comment.
					#[\Some\Namespaced\Attribute ()]
					abstract class Foo {}
					EOF,
				T_CLASS,
				array(
					array(
						'name'     => 'Attribute',
						'ptrtoken' => 'Attribute',
						'content'  => '#[Attribute]',
						'params'   => null,
						'isMulti'  => false,
					),
					array(
						'name'       => 'Multi1',
						'ptrtoken'   => 'Multi1',
						'content'    => 'Multi1',
						'params'     => null,
						'isMulti'    => true,
						'attcontent' => '#[Multi1, Multi2( "param", 42 )]',
					),
					array(
						'name'       => 'Multi2',
						'ptrtoken'   => 'Multi2',
						'content'    => 'Multi2( "param", 42 )',
						'params'     => array(
							1 => '"param"',
							2 => '42',
						),
						'isMulti'    => true,
						'attcontent' => '#[Multi1, Multi2( "param", 42 )]',
					),
					array(
						'name'     => '\\Some\\Namespaced\\Attribute',
						'ptrtoken' => 'Attribute',
						'content'  => '#[\Some\Namespaced\Attribute ()]',
						'params'   => array(),
						'isMulti'  => false,
					),
				),
			),

			'Interface'                      => array(
				<<<'EOF'
					<?php
					#[Attribute]
					interface Foo {}
					EOF,
				T_INTERFACE,
				array(
					array(
						'name'     => 'Attribute',
						'ptrtoken' => 'Attribute',
						'content'  => '#[Attribute]',
						'params'   => null,
						'isMulti'  => false,
					),
				),
			),

			'Trait'                          => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Doc block! */
					#[Attribute]
					trait Foo {}
					EOF,
				T_TRAIT,
				array(
					array(
						'name'     => 'Attribute',
						'ptrtoken' => 'Attribute',
						'content'  => '#[Attribute]',
						'params'   => null,
						'isMulti'  => false,
					),
				),
			),

			'Function'                       => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Doc block! */
					#[Attribute]
					function foo() {}
					EOF,
				T_FUNCTION,
				array(
					array(
						'name'     => 'Attribute',
						'ptrtoken' => 'Attribute',
						'content'  => '#[Attribute]',
						'params'   => null,
						'isMulti'  => false,
					),
				),
			),

			'Method'                         => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Class doc block. */
					#[ClassAttribute( /** Not this one */ )]
					class Foo {
						/** Doc block! */
						#[Attribute]
						function bar() {}
					}
					EOF,
				T_FUNCTION,
				array(
					array(
						'name'     => 'Attribute',
						'ptrtoken' => 'Attribute',
						'content'  => '#[Attribute]',
						'params'   => null,
						'isMulti'  => false,
					),
				),
			),

			'Property'                       => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Class doc block. */
					#[ClassAttribute( /** Not this one */ )]
					class Foo {
						/** Doc block! */
						#[Attribute]
						public $bar;
					}
					EOF,
				T_VARIABLE,
				array(
					array(
						'name'     => 'Attribute',
						'ptrtoken' => 'Attribute',
						'content'  => '#[Attribute]',
						'params'   => null,
						'isMulti'  => false,
					),
				),
			),

			'Class constant'                 => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Class doc block. */
					#[ClassAttribute( /** Not this one */ )]
					class Foo {
						/** Doc block! */
						#[Attribute]
						const BAR = 42;
					}
					EOF,
				T_CONST,
				array(
					array(
						'name'     => 'Attribute',
						'ptrtoken' => 'Attribute',
						'content'  => '#[Attribute]',
						'params'   => null,
						'isMulti'  => false,
					),
				),
			),

			'Global constant'                => array(
				<<<'EOF'
					<?php
					const BAR = 42;
					EOF,
				T_CONST,
				new RuntimeException( 'T_CONST token is not a class/trait constant declaration.' ),
			),

			'Arbitrary variable'             => array(
				<<<'EOF'
					<?php
					$bar = 42;
					EOF,
				T_VARIABLE,
				new RuntimeException( 'T_VARIABLE token is not a class/trait property declaration.' ),
			),

			'Some other token'               => array(
				<<<'EOF'
					<?php
					$bar = 42;
					EOF,
				T_OPEN_TAG,
				new RuntimeException( 'Token type "T_OPEN_TAG" is not supported.' ),
			),

			'Nothing preceeding'             => array(
				'<?php interface I {}class Foo {}',
				T_CLASS,
				array(),
			),

			'One-element multiple-attribute' => array(
				<<<'EOF'
					<?php

					#[Multi1,]
					abstract class Foo {}
					EOF,
				T_CLASS,
				array(
					array(
						'name'       => 'Multi1',
						'ptrtoken'   => 'Multi1',
						'content'    => 'Multi1',
						'params'     => null,
						'isMulti'    => true,
						'attcontent' => '#[Multi1,]',
					),
				),
			),

			'Nospace'                        => array(
				<<<'EOF'
					<?php
					#[A,B(),C]#[D("e")]class Foo {}
					EOF,
				T_CLASS,
				array(
					array(
						'name'       => 'A',
						'ptrtoken'   => 'A',
						'content'    => 'A',
						'params'     => null,
						'isMulti'    => true,
						'attcontent' => '#[A,B(),C]',
					),
					array(
						'name'       => 'B',
						'ptrtoken'   => 'B',
						'content'    => 'B()',
						'params'     => array(),
						'isMulti'    => true,
						'attcontent' => '#[A,B(),C]',
					),
					array(
						'name'       => 'C',
						'ptrtoken'   => 'C',
						'content'    => 'C',
						'params'     => null,
						'isMulti'    => true,
						'attcontent' => '#[A,B(),C]',
					),
					array(
						'name'     => 'D',
						'ptrtoken' => 'D',
						'content'  => '#[D("e")]',
						'params'   => array( 1 => '"e"' ),
						'isMulti'  => false,
					),
				),
			),
		);

		foreach ( $cases as $name => $case ) {
			yield $name => $case;
			if ( str_contains( $case[0], '#[Attribute]' ) ) {
				yield "$name, no attributes" => array(
					str_replace( '#', '//', $case[0] ),
					$case[1],
					array(),
				);
			}
		}
	}

	/**
	 * @dataProvider provideFindAttributeInsertionPointForDeclaration
	 * @param string     $content File content to test with.
	 * @param string|int $startType Token to lookup for `$start`.
	 * @param string|int $expectType Token to lookup for the expected return value.
	 * @param ?string    $expectValue Value for the expected return token.
	 * @param int        $expectDelta Adjustmend for the expected return token.
	 */
	#[DataProvider( 'provideFindAttributeInsertionPointForDeclaration' )]
	public function testFindAttributeInsertionPointForDeclaration( $content, $startType, $expectType, $expectValue, $expectDelta ) {
		$phpcsFile = $this->createPhpcsFile( $content );
		$start     = $phpcsFile->findNext( $startType, 0 );
		$this->assertIsInt( $start );

		$expect = $phpcsFile->findNext( $expectType, 0, null, false, $expectValue );
		$this->assertIsInt( $expect );
		$expect += $expectDelta;

		$actual = Attributes::findAttributeInsertionPointForDeclaration( $phpcsFile, $start );
		$this->assertSame( $expect, $actual );
	}

	public static function provideFindAttributeInsertionPointForDeclaration() {
		yield 'General declaration' => array(
			<<<'EOF'
				<?php
				/** File doc block. */

				#[AttributeX]
				#[Attribute( /** Not this one */ )]
				abstract class Foo {}
				EOF,
			T_CLASS,
			T_ABSTRACT,
			null,
			0,
		);

		yield 'Whitespace before start of line' => array(
			<<<'EOF'
				<?php
				class Foo {
					#[Attribute]
					public function bar(){}
				}
				EOF,
			T_FUNCTION,
			T_PUBLIC,
			null,
			-1,
		);

		yield 'Whitespace but no start of line after attribute' => array(
			<<<'EOF'
				<?php
				class Foo {
					#[Attribute] public function bar(){}
				}
				EOF,
			T_FUNCTION,
			T_PUBLIC,
			null,
			0,
		);

		yield 'No whitespace after attribute' => array(
			<<<'EOF'
				<?php
				class Foo {
					#[Attribute]public function bar(){}
				}
				EOF,
			T_FUNCTION,
			T_PUBLIC,
			null,
			0,
		);

		yield 'Declaration with no attributes' => array(
			<<<'EOF'
				<?php

				/** Doc comment */
				abstract class Foo {}
				EOF,
			T_CLASS,
			T_ABSTRACT,
			null,
			0,
		);

		yield 'No attributes, Whitespace before start of line' => array(
			<<<'EOF'
				<?php
				class Foo {
					public function bar(){}
				}
				EOF,
			T_FUNCTION,
			T_PUBLIC,
			null,
			-1,
		);

		yield 'Declaration with nothing before it' => array(
			<<<'EOF'
				<?php

				class Foo {function bar(){}}
				EOF,
			T_FUNCTION,
			T_FUNCTION,
			null,
			0,
		);

		yield 'No whitespace to forward past' => array(
			<<<'EOF'
				<?php

				class Foo {public $bar;}
				EOF,
			T_VARIABLE,
			T_PUBLIC,
			null,
			0,
		);

		yield 'Don\'t forward past doc comments' => array(
			<<<'EOF'
				<?php

				abstract class Foo {
					/** Doc comment */ public function bar();
				}
				EOF,
			T_FUNCTION,
			T_DOC_COMMENT_CLOSE_TAG,
			null,
			1,
		);
	}
}
