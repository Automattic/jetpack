<?php

namespace Automattic\Jetpack\Codesniffer\Tests\Utils;

use Automattic\Jetpack\Codesniffer\Utils\DocBlocks;
use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHPUnit\Framework\Attributes\DataProvider;
use Throwable;

class DocBlocksTest extends TestCase {

	/**
	 * @dataProvider provideFindDocBlockForDeclaration
	 * @param string                 $content File content to test with.
	 * @param string|int             $startType Token to lookup for `$start`.
	 * @param string|false|Throwable $expect Expected result: doc block content, false, or exception thrown.
	 */
	#[DataProvider( 'provideFindDocBlockForDeclaration' )]
	public function testFindDocBlockForDeclaration( $content, $startType, $expect ) {
		$phpcsFile = $this->createPhpcsFile( $content );
		$start     = $phpcsFile->findNext( $startType, 0 );
		$this->assertIsInt( $start );

		if ( $expect instanceof Throwable ) {
			$this->expectException( get_class( $expect ) );
			$this->expectExceptionMessage( $expect->getMessage() );
		}

		$ret = DocBlocks::findDocBlockForDeclaration( $phpcsFile, $start );
		if ( ! $expect instanceof Throwable ) {
			if ( $ret === false ) {
				$actual = false;
			} else {
				$tokens = $phpcsFile->getTokens();
				$this->assertSame( T_DOC_COMMENT_OPEN_TAG, $tokens[ $ret ]['code'] );
				$actual = $phpcsFile->getTokensAsString( $ret, $tokens[ $ret ]['comment_closer'] - $ret + 1, true );
			}

			$this->assertSame( $expect, $actual );
		}
	}

	public static function provideFindDocBlockForDeclaration() {
		$cases = array(
			'Class'              => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Doc block! */
					#[Attribute]
					#[Attribute( /** Not this one */ )]
					abstract class Foo {}
					EOF,
				T_CLASS,
				'/** Doc block! */',
			),

			'Interface'          => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Doc block! */
					#[Attribute( /** Not this one */ )]
					interface Foo {}
					EOF,
				T_INTERFACE,
				'/** Doc block! */',
			),

			'Trait'              => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Doc block! */
					#[Attribute( /** Not this one */ )]
					trait Foo {}
					EOF,
				T_TRAIT,
				'/** Doc block! */',
			),

			'Function'           => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Doc block! */
					#[Attribute( /** Not this one */ )]
					function foo() {}
					EOF,
				T_FUNCTION,
				'/** Doc block! */',
			),

			'Method'             => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Class doc block. */
					class Foo {
						/** Doc block! */
						#[Attribute( /** Not this one */ )]
						function bar() {}
					}
					EOF,
				T_FUNCTION,
				'/** Doc block! */',
			),

			'Property'           => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Class doc block. */
					class Foo {
						/** Doc block! */
						#[Attribute( /** Not this one */ )]
						public $bar;
					}
					EOF,
				T_VARIABLE,
				'/** Doc block! */',
			),

			'Class constant'     => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Class doc block. */
					class Foo {
						/** Doc block! */
						#[Attribute( /** Not this one */ )]
						const BAR = 42;
					}
					EOF,
				T_CONST,
				'/** Doc block! */',
			),

			'Global constant'    => array(
				<<<'EOF'
					<?php
					/** File doc block. */

					/** Doc block! */
					#[Attribute( /** Not this one */ )]
					const BAR = 42;
					EOF,
				T_CONST,
				'/** Doc block! */',
			),

			'Arbitrary variable' => array(
				<<<'EOF'
					<?php
					$bar = 42;
					EOF,
				T_VARIABLE,
				new RuntimeException( 'T_VARIABLE token is not a class/trait property declaration.' ),
			),

			'Some other token'   => array(
				<<<'EOF'
					<?php
					$bar = 42;
					EOF,
				T_OPEN_TAG,
				new RuntimeException( 'Token type "T_OPEN_TAG" is not supported.' ),
			),
		);

		foreach ( $cases as $name => $case ) {
			yield $name => $case;

			if ( $case[2] === '/** Doc block! */' ) {
				yield "$name, no doc block" => array(
					str_replace( '/** Doc block! */', '"Not a doc block.";', $case[0] ),
					$case[1],
					false,
				);
			}
		}
	}

	/**
	 * @dataProvider provideFindDocBlockInsertionPointForDeclaration
	 * @param string     $content File content to test with.
	 * @param string|int $startType Token to lookup for `$start`.
	 * @param string|int $expectType Token to lookup for the expected return value.
	 * @param ?string    $expectValue Value for the expected return token.
	 * @param int        $expectDelta Adjustmend for the expected return token.
	 */
	#[DataProvider( 'provideFindDocBlockInsertionPointForDeclaration' )]
	public function testFindDocBlockInsertionPointForDeclaration( $content, $startType, $expectType, $expectValue, $expectDelta ) {
		$phpcsFile = $this->createPhpcsFile( $content );
		$start     = $phpcsFile->findNext( $startType, 0 );
		$this->assertIsInt( $start );

		$expect = $phpcsFile->findNext( $expectType, 0, null, false, $expectValue );
		$this->assertIsInt( $expect );
		$expect += $expectDelta;

		$actual = DocBlocks::findDocBlockInsertionPointForDeclaration( $phpcsFile, $start );
		$this->assertSame( $expect, $actual );
	}

	public static function provideFindDocBlockInsertionPointForDeclaration() {
		yield 'General declaration' => array(
			<<<'EOF'
				<?php
				/** File doc block. */

				#[AttributeX]
				#[Attribute( /** Not this one */ )]
				abstract class Foo {}
				EOF,
			T_CLASS,
			T_STRING,
			'AttributeX',
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
	}

	/**
	 * @dataProvider provideGetCommentTags
	 * @param string          $content File content to test with.
	 * @param string|int      $startType Token to lookup for `$start`.
	 * @param array|Throwable $expect Expected output.
	 * @param string[]        $expectTags Expected tag texts.
	 */
	#[DataProvider( 'provideGetCommentTags' )]
	public function testGetCommentTags( $content, $startType, $expect, $expectTags ) {
		$phpcsFile = $this->createPhpcsFile( $content );
		$start     = $phpcsFile->findNext( $startType, 0 );
		$this->assertIsInt( $start );

		if ( $expect instanceof Throwable ) {
			$this->expectException( get_class( $expect ) );
			$this->expectExceptionMessage( $expect->getMessage() );
		}

		$actual = DocBlocks::getCommentTags( $phpcsFile, $start );
		if ( ! $expect instanceof Throwable ) {
			$this->assertSame( $expect, $actual );
			$this->assertSame(
				$expectTags,
				array_map(
					function ( $tag ) use ( $phpcsFile ) {
						return $phpcsFile->getTokensAsString( $tag['startptr'], $tag['endptr'] - $tag['startptr'] + 1, true );
					},
					$actual
				)
			);
		}
	}

	public static function provideGetCommentTags() {
		yield 'Generic doc comment' => array(
			<<<'EOF'
				<?php
				/**
				 * This is a doc comment.
				 *
				 * @foo
				 * @bar This is bar.
				 * @bar Another copy of bar.
				 *   This one has multiple lines.
				 *
				 *   Lots of them.
				 * @bar @bar @bar
				 * @bar One more.
				 */
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			array(
				array(
					'name'     => '@foo',
					'content'  => '',
					'ptr'      => 14,
					'startptr' => 11,
					'endptr'   => 15,
				),
				array(
					'name'     => '@bar',
					'content'  => 'This is bar.',
					'ptr'      => 19,
					'startptr' => 16,
					'endptr'   => 22,
				),
				array(
					'name'     => '@bar',
					'content'  => "Another copy of bar.\nThis one has multiple lines.\n\nLots of them.",
					'ptr'      => 26,
					'startptr' => 23,
					'endptr'   => 42,
				),
				array(
					'name'     => '@bar',
					'content'  => '@bar @bar',
					'ptr'      => 46,
					'startptr' => 43,
					'endptr'   => 49,
				),
				array(
					'name'     => '@bar',
					'content'  => 'One more.',
					'ptr'      => 53,
					'startptr' => 50,
					'endptr'   => 56,
				),
			),
			array(
				" * @foo\n",
				" * @bar This is bar.\n",
				" * @bar Another copy of bar.\n *   This one has multiple lines.\n *\n *   Lots of them.\n",
				" * @bar @bar @bar\n",
				" * @bar One more.\n",
			),
		);

		yield 'Indented doc comment' => array(
			<<<'EOF'
				<?php
					/**
					 * This is a doc comment.
					 *
					 * @foo
					 * @bar This is bar.
					 * @bar Another copy of bar.
					 *   This one has multiple lines.
					 */
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			array(
				array(
					'name'     => '@foo',
					'content'  => '',
					'ptr'      => 15,
					'startptr' => 12,
					'endptr'   => 16,
				),
				array(
					'name'     => '@bar',
					'content'  => 'This is bar.',
					'ptr'      => 20,
					'startptr' => 17,
					'endptr'   => 23,
				),
				array(
					'name'     => '@bar',
					'content'  => "Another copy of bar.\nThis one has multiple lines.",
					'ptr'      => 27,
					'startptr' => 24,
					'endptr'   => 35,
				),
			),
			array(
				"\t * @foo\n",
				"\t * @bar This is bar.\n",
				"\t * @bar Another copy of bar.\n\t *   This one has multiple lines.\n",
			),
		);

		yield 'Doc comment with no tags' => array(
			<<<'EOF'
				<?php
				/**
				 * This is a doc comment.
				 *
				 * It has no tags. @foo is not a tag.
				 */
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			array(),
			array(),
		);

		yield 'Minimal tag' => array(
			<<<'EOF'
				<?php
				/**@foo*/
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			array(
				array(
					'name'     => '@foo',
					'content'  => '',
					'ptr'      => 2,
					'startptr' => 2,
					'endptr'   => 2,
				),
			),
			array( '@foo' ),
		);

		yield 'Slightly less minimal tag' => array(
			<<<'EOF'
				<?php
				/** @foo content */
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			array(
				array(
					'name'     => '@foo',
					'content'  => 'content',
					'ptr'      => 3,
					'startptr' => 3,
					'endptr'   => 5,
				),
			),
			array( '@foo content ' ),
		);

		yield 'Empty doc comment' => array(
			<<<'EOF'
				<?php
				/***/
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			array(),
			array(),
		);

		yield 'Not a doc comment' => array(
			<<<'EOF'
				<?php
				/* Not a doc comment */
				EOF,
			T_COMMENT,
			new RuntimeException( '$stackPtr must be of type T_DOC_COMMENT_OPEN_TAG' ),
			array(),
		);
	}

	/**
	 * @dataProvider provideGetIndent
	 * @param string           $content File content to test with.
	 * @param string|int       $startType Token to lookup for `$start`.
	 * @param string|Throwable $expect Expected output.
	 */
	#[DataProvider( 'provideGetIndent' )]
	public function testGetIndent( $content, $startType, $expect ) {
		$phpcsFile = $this->createPhpcsFile( $content );
		$start     = $phpcsFile->findNext( $startType, 0 );
		$this->assertIsInt( $start );

		if ( $expect instanceof Throwable ) {
			$this->expectException( get_class( $expect ) );
			$this->expectExceptionMessage( $expect->getMessage() );
		}

		$actual = DocBlocks::getIndent( $phpcsFile, $start );
		if ( ! $expect instanceof Throwable ) {
			$this->assertSame( $expect, $actual );
		}
	}

	public static function provideGetIndent() {
		yield 'Generic doc comment' => array(
			<<<'EOF'
				<?php
				/**
				 * This is a doc comment.
				 */
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			' ',
		);

		yield 'Indented doc comment' => array(
			<<<'EOF'
				<?php
				    /**
				     * This is a doc comment.
				     */
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			'     ',
		);

		yield 'Indented doc comment, tabs' => array(
			<<<'EOF'
				<?php
					/**
					 * This is a doc comment.
					 */
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			"\t ",
		);

		yield 'Doc comment with no stars' => array(
			<<<'EOF'
				<?php
				/**
				This is a doc comment.
				*/
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			' ',
		);

		yield 'Indented comment with no stars' => array(
			<<<'EOF'
				<?php
					/**
					This is a doc comment.
					*/
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			"\t ",
		);

		yield 'Single-line doc comment' => array(
			<<<'EOF'
				<?php
				/**@foo*/
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			' ',
		);

		yield 'Indented single-line doc comment' => array(
			<<<'EOF'
				<?php
						/**@foo*/
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			"\t\t ",
		);

		yield 'Not a doc comment' => array(
			<<<'EOF'
				<?php
				/* Not a doc comment */
				EOF,
			T_COMMENT,
			new RuntimeException( '$stackPtr must be of type T_DOC_COMMENT_OPEN_TAG' ),
		);

		yield 'Multiple comments in a row' => array(
			<<<'EOF'
				<?php
				/** Comment 1 */
					/**
					 * Comment 2
					 */
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			' ',
		);

		yield 'Doc comment in the middle of a line' => array(
			<<<'EOF'
				<?php
					$bar = 42; /** Doc comment. */
				EOF,
			T_DOC_COMMENT_OPEN_TAG,
			"\t            ",
		);
	}
}
