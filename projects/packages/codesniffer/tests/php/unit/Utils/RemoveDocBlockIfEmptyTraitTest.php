<?php

namespace Automattic\Jetpack\Codesniffer\Tests\Utils;

use Automattic\Jetpack\Codesniffer\Utils\RemoveDocBlockIfEmptyTrait;
use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHPUnit\Framework\Attributes\DataProvider;

class RemoveDocBlockIfEmptyTraitTest extends TestCase {

	/**
	 * @dataProvider provideRemoveDocBlockIfEmpty
	 * @param string                                     $content File content to test with.
	 * @param array{string|int,string|null,int,string}[] $toReplace Tokens to replace before running the function.
	 * @param string                                     $expect Expected fixed content.
	 */
	#[DataProvider( 'provideRemoveDocBlockIfEmpty' )]
	public function testRemoveDocBlockIfEmpty( $content, $toReplace, $expect ) {
		$tmp = new class() {
			use RemoveDocBlockIfEmptyTrait {
				RemoveDocBlockIfEmptyTrait::removeDocBlockIfEmpty as public;
			}
		};

		$phpcsFile = $this->createPhpcsFile( $content );
		$phpcsFile->fixer->startFile( $phpcsFile );
		$phpcsFile->fixer->enabled = true;

		$stackPtr = $phpcsFile->findNext( T_DOC_COMMENT_OPEN_TAG, 0 );
		$this->assertIsInt( $stackPtr );

		// Needs a warning added to work.
		$this->assertTrue( $phpcsFile->addFixableWarning( '🤷', $stackPtr, 'Dummy.Dummy.Dummy.Dummy' ) );

		$phpcsFile->fixer->beginChangeset();

		foreach ( $toReplace as $n => list( $tokenType, $tokenValue, $tokenDelta, $replaceValue ) ) {
			$idx = $phpcsFile->findNext( $tokenType, 0, null, false, $tokenValue );
			$this->assertIsInt( $idx, "toReplace index $n" );
			$this->assertTrue( $phpcsFile->fixer->replaceToken( $idx + $tokenDelta, $replaceValue ) );
		}

		$this->assertTrue( $tmp->removeDocBlockIfEmpty( $phpcsFile, $stackPtr ) );
		$this->assertTrue( $phpcsFile->fixer->endChangeset() );

		$phpcsFile->fixer->fixFile();
		$actual = $phpcsFile->fixer->getContents();
		$this->assertSame( $expect, $actual );
	}

	public static function provideRemoveDocBlockIfEmpty() {
		yield 'Doc block with content, no replacements' => array(
			<<<'EOF'
				<?php

				class X {
					/**
					 * Doc block.
					 */
					function x() {}
				}
				EOF,
			array(),
			<<<'EOF'
				<?php

				class X {
					/**
					 * Doc block.
					 */
					function x() {}
				}
				EOF,
		);

		yield 'Minimal doc block with content, no replacements' => array(
			<<<'EOF'
				<?php

				class X {
					/**XXX*/
					function x() {}
				}
				EOF,
			array(),
			<<<'EOF'
				<?php

				class X {
					/**XXX*/
					function x() {}
				}
				EOF,
		);

		yield 'Empty doc block, no replacements' => array(
			<<<'EOF'
				<?php

				class X {
					/**
					 *
					 */
					function x() {}
				}
				EOF,
			array(),
			<<<'EOF'
				<?php

				class X {
					function x() {}
				}
				EOF,
		);

		yield 'Minimal empty doc block, no replacements' => array(
			<<<'EOF'
				<?php

				class X {
					/***/
					function x() {}
				}
				EOF,
			array(),
			<<<'EOF'
				<?php

				class X {
					function x() {}
				}
				EOF,
		);

		yield 'Doc block with tag, no replacements' => array(
			<<<'EOF'
				<?php

				class X {
					/**
					 * @foo
					 */
					function x() {}
				}
				EOF,
			array(),
			<<<'EOF'
				<?php

				class X {
					/**
					 * @foo
					 */
					function x() {}
				}
				EOF,
		);

		yield 'Doc block with phpcs ignore comment, no replacements' => array(
			<<<'EOF'
				<?php

				class X {
					/**
					 * phpcs:ignore A.B.C.D
					 */
					function x() {}
				}
				EOF,
			array(),
			<<<'EOF'
				<?php

				class X {
					/**
					 * phpcs:ignore A.B.C.D
					 */
					function x() {}
				}
				EOF,
		);

		yield 'Doc block with tag, replaced with empty' => array(
			<<<'EOF'
				<?php

				class X {
					/**
					 * @foo
					 */
					function x() {}
				}
				EOF,
			array(
				array( T_DOC_COMMENT_TAG, '@foo', 0, '' ),
			),
			<<<'EOF'
				<?php

				class X {
					function x() {}
				}
				EOF,
		);

		yield 'Doc block with tags, only one replaced with empty' => array(
			<<<'EOF'
				<?php

				class X {
					/**
					 * @foo baz
					 * @bar
					 */
					function x() {}
				}
				EOF,
			array(
				array( T_DOC_COMMENT_TAG, '@foo', -1, '' ), // T_DOC_COMMENT_WHITESPACE before
				array( T_DOC_COMMENT_TAG, '@foo', 0, '' ),
				array( T_DOC_COMMENT_STRING, 'baz', -1, '' ), // T_DOC_COMMENT_WHITESPACE before
				array( T_DOC_COMMENT_STRING, 'baz', 0, '' ),
			),
			<<<'EOF'
				<?php

				class X {
					/**
					 *
					 * @bar
					 */
					function x() {}
				}
				EOF,
		);

		yield 'Doc block content added to a whitespace token' => array(
			<<<'EOF'
				<?php

				class X {
					/**
					 */
					function x() {}
				}
				EOF,
			array(
				array( T_DOC_COMMENT_WHITESPACE, "\n", 1, "\t * @foo\n\t " ),
			),
			<<<'EOF'
				<?php

				class X {
					/**
					 * @foo
					 */
					function x() {}
				}
				EOF,
		);

		yield 'Doc block content added to the start token' => array(
			<<<'EOF'
				<?php

				class X {
					/**
					 */
					function x() {}
				}
				EOF,
			array(
				array( T_DOC_COMMENT_OPEN_TAG, null, 0, "/**\n\t * @foo" ),
			),
			<<<'EOF'
				<?php

				class X {
					/**
					 * @foo
					 */
					function x() {}
				}
				EOF,
		);

		yield 'Doc block content added to the end token' => array(
			<<<'EOF'
				<?php

				class X {
					/**
					 */
					function x() {}
				}
				EOF,
			array(
				array( T_DOC_COMMENT_CLOSE_TAG, null, 0, "* @foo\n\t */" ),
			),
			<<<'EOF'
				<?php

				class X {
					/**
					 * @foo
					 */
					function x() {}
				}
				EOF,
		);

		// Someday we may detect this case and remove the doc block while keeping the extra content.
		yield 'Edge case: Something added after the doc block' => array(
			<<<'EOF'
				<?php

				class X {
					/**
					 */
					function x() {}
				}
				EOF,
			array(
				array( T_DOC_COMMENT_CLOSE_TAG, null, 0, "*/\n\t#[Attr]" ),
			),
			<<<'EOF'
				<?php

				class X {
					/**
					 */
					#[Attr]
					function x() {}
				}
				EOF,
		);

		// Someday we may detect this case and remove the doc block while keeping the extra content.
		yield 'Edge case: Something added before the doc block' => array(
			<<<'EOF'
				<?php

				class X {
					/**
					 */
					function x() {}
				}
				EOF,
			array(
				array( T_DOC_COMMENT_OPEN_TAG, null, 0, "#[Attr]\n\t/**" ),
			),
			<<<'EOF'
				<?php

				class X {
					#[Attr]
					/**
					 */
					function x() {}
				}
				EOF,
		);
	}

	public function testError() {
		$tmp = new class() {
			use RemoveDocBlockIfEmptyTrait {
				RemoveDocBlockIfEmptyTrait::removeDocBlockIfEmpty as public;
			}
		};

		$phpcsFile = $this->createPhpcsFile( "<?php\n\nclass X{}\n" );
		$phpcsFile->fixer->startFile( $phpcsFile );
		$phpcsFile->fixer->enabled = true;

		$stackPtr = $phpcsFile->findNext( T_CLASS, 0 );
		$this->assertIsInt( $stackPtr );

		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage( '$stackPtr must be of type T_DOC_COMMENT_OPEN_TAG' );
		$tmp->removeDocBlockIfEmpty( $phpcsFile, $stackPtr );
	}
}
