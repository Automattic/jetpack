<?php

namespace Automattic\Jetpack\Codesniffer\Tests\Utils;

use Automattic\Jetpack\Codesniffer\Utils\AddDocBlockTagsTrait;
use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHP_CodeSniffer\Util\Tokens as PHPCS_Tokens;
use PHPUnit\Framework\Attributes\DataProvider;

class AddDocBlockTagsTraitTest extends TestCase {

	/**
	 * @dataProvider provideAddDocBlockTags
	 * @param string      $content File content to test with.
	 * @param string|int  $tokenType Token type to search for to determine the `$stackPtr` to pass.
	 * @param string|null $tokenValue Token value to search for to determine the `$stackPtr` to pass.
	 * @param string[][]  $tagSets Tags to add for multiple calls.
	 * @param string      $expect Expected fixed content.
	 */
	#[DataProvider( 'provideAddDocBlockTags' )]
	public function testAddDocBlockTags( $content, $tokenType, $tokenValue, $tagSets, $expect ) {
		$tmp = new class() {
			use AddDocBlockTagsTrait {
				AddDocBlockTagsTrait::addDocBlockTags as public;
			}
		};

		$phpcsFile = $this->createPhpcsFile( $content );
		$phpcsFile->fixer->startFile( $phpcsFile );
		$phpcsFile->fixer->enabled = true;

		$stackPtr = $phpcsFile->findNext( $tokenType, 0, null, false, $tokenValue );
		$this->assertIsInt( $stackPtr );

		// Needs a warning added to work.
		$this->assertTrue( $phpcsFile->addFixableWarning( '🤷', $stackPtr, 'Dummy.Dummy.Dummy.Dummy' ) );

		$phpcsFile->fixer->beginChangeset();
		foreach ( $tagSets as $i => $tags ) {
			$this->assertTrue( $tmp->addDocBlockTags( $phpcsFile, $stackPtr, $tags ), "For tag set $i" );
		}
		$this->assertTrue( $phpcsFile->fixer->endChangeset() );

		$phpcsFile->fixer->fixFile();
		$actual = $phpcsFile->fixer->getContents();
		$this->assertSame( $expect, $actual );
	}

	public static function provideAddDocBlockTags() {
		yield 'Do nothing' => array(
			"<?php\nclass X {}\n",
			T_CLASS,
			null,
			array( array() ),
			"<?php\nclass X {}\n",
		);

		$tokens     = array(
			array( T_DOC_COMMENT_OPEN_TAG, null ),
			array( T_DOC_COMMENT_CLOSE_TAG, null ),
			array( T_FUNCTION, null ),
		);
		$tagSetSets = array(
			'single call'    => array(
				array( '@tag1', '@tag2 value', "@tag3 has\nmultiple\nlines" ),
			),
			'multiple calls' => array(
				array( '@tag1' ),
				array( '@tag2 value' ),
				array( "@tag3 has\nmultiple\nlines" ),
			),
		);
		foreach ( $tokens as list( $tokenType, $tokenValue ) ) {
			$n = PHPCS_Tokens::tokenName( $tokenType );
			foreach ( $tagSetSets as $k => $tagSets ) {
				yield "Add tags to existing doc block, $k, target $n" => array(
					<<<'EOF'
						<?php
						/**
						 * Doc block.
						 */
						function x() {}
						EOF,
					$tokenType,
					$tokenValue,
					$tagSets,
					<<<'EOF'
						<?php
						/**
						 * Doc block.
						 * @tag1
						 * @tag2 value
						 * @tag3 has
						 *  multiple
						 *  lines
						 */
						function x() {}
						EOF,
				);

				yield "Add tags to existing short doc block, $k, target $n" => array(
					<<<'EOF'
						<?php
						/** Doc block. */
						function x() {}
						EOF,
					$tokenType,
					$tokenValue,
					$tagSets,
					<<<'EOF'
						<?php
						/** Doc block.
						 * @tag1
						 * @tag2 value
						 * @tag3 has
						 *  multiple
						 *  lines
						 */
						function x() {}
						EOF,
				);

				yield "Add tags to existing indented doc block, $k, target $n" => array(
					<<<'EOF'
						<?php
						class A {
							/**
							 * Doc block.
							 */
							public function x() {}
						}
						EOF,
					$tokenType,
					$tokenValue,
					$tagSets,
					<<<'EOF'
						<?php
						class A {
							/**
							 * Doc block.
							 * @tag1
							 * @tag2 value
							 * @tag3 has
							 *  multiple
							 *  lines
							 */
							public function x() {}
						}
						EOF,
				);

				yield "Add tags to existing indented short doc block, $k, target $n" => array(
					<<<'EOF'
						<?php
						class A {
							/** Doc block. */
							public function x() {}
						}
						EOF,
					$tokenType,
					$tokenValue,
					$tagSets,
					<<<'EOF'
						<?php
						class A {
							/** Doc block.
							 * @tag1
							 * @tag2 value
							 * @tag3 has
							 *  multiple
							 *  lines
							 */
							public function x() {}
						}
						EOF,
				);
			}
		}

		$tokenType  = T_DOC_COMMENT_TAG;
		$tokenValue = '@foo';
		$n          = PHPCS_Tokens::tokenName( $tokenType );
		foreach ( $tagSetSets as $k => $tagSets ) {
			yield "Add tags to existing doc block, $k, target $n" => array(
				<<<'EOF'
					<?php
					/**
					 * Doc block.
					 * @foo
					 */
					function x() {}
					EOF,
				$tokenType,
				$tokenValue,
				$tagSets,
				<<<'EOF'
					<?php
					/**
					 * Doc block.
					 * @tag1
					 * @tag2 value
					 * @tag3 has
					 *  multiple
					 *  lines
					 * @foo
					 */
					function x() {}
					EOF,
			);

			yield "Add tags to existing short doc block, $k, target $n" => array(
				<<<'EOF'
					<?php
					/** @foo */
					function x() {}
					EOF,
				$tokenType,
				$tokenValue,
				$tagSets,
				<<<'EOF'
					<?php
					/**
					 * @tag1
					 * @tag2 value
					 * @tag3 has
					 *  multiple
					 *  lines
					 * @foo */
					function x() {}
					EOF,
			);

			yield "Add tags to existing indented doc block, $k, target $n" => array(
				<<<'EOF'
					<?php
					class A {
						/**
						 * Doc block.
						 * @foo
						 */
						public function x() {}
					}
					EOF,
				$tokenType,
				$tokenValue,
				$tagSets,
				<<<'EOF'
					<?php
					class A {
						/**
						 * Doc block.
						 * @tag1
						 * @tag2 value
						 * @tag3 has
						 *  multiple
						 *  lines
						 * @foo
						 */
						public function x() {}
					}
					EOF,
			);

			yield "Add tags to existing indented short doc block, $k, target $n" => array(
				<<<'EOF'
					<?php
					class A {
						/** @foo */
						public function x() {}
					}
					EOF,
				$tokenType,
				$tokenValue,
				$tagSets,
				<<<'EOF'
					<?php
					class A {
						/**
						 * @tag1
						 * @tag2 value
						 * @tag3 has
						 *  multiple
						 *  lines
						 * @foo */
						public function x() {}
					}
					EOF,
			);
		}

		foreach ( $tagSetSets as $k => $tagSets ) {
			yield "Add tags with no existing doc block, $k" => array(
				<<<'EOF'
					<?php
					function x() {}
					EOF,
				T_FUNCTION,
				null,
				$tagSets,
				<<<'EOF'
					<?php
					/**
					 * @tag1
					 * @tag2 value
					 * @tag3 has
					 *  multiple
					 *  lines
					 */
					function x() {}
					EOF,
			);

			yield "Add tags with no existing doc block, indented, $k" => array(
				<<<'EOF'
					<?php
					class A {
						public function x() {}
					}
					EOF,
				T_FUNCTION,
				null,
				$tagSets,
				<<<'EOF'
					<?php
					class A {
						/**
						 * @tag1
						 * @tag2 value
						 * @tag3 has
						 *  multiple
						 *  lines
						 */
						public function x() {}
					}
					EOF,
			);

			yield "Add tags with no existing doc block, no newlines, indented, $k" => array(
				<<<'EOF'
					<?php
					class A { public function x() {} }
					EOF,
				T_FUNCTION,
				null,
				$tagSets,
				<<<'EOF'
					<?php
					class A {
					 /**
					  * @tag1
					  * @tag2 value
					  * @tag3 has
					  *  multiple
					  *  lines
					  */
					 public function x() {} }
					EOF,
			);

			yield "Add tags with no existing doc block, no whitespace, indented, $k" => array(
				<<<'EOF'
					<?php
					class A{public function x(){}}
					EOF,
				T_FUNCTION,
				null,
				$tagSets,
				<<<'EOF'
					<?php
					class A{
					/**
					 * @tag1
					 * @tag2 value
					 * @tag3 has
					 *  multiple
					 *  lines
					 */
					public function x(){}}
					EOF,
			);
		}
	}

	public function testHandlingRemovedTagsInComment() {
		$tmp = new class() {
			use AddDocBlockTagsTrait {
				AddDocBlockTagsTrait::addDocBlockTags as public;
			}
		};

		$content = <<<'EOF'
		<?php
		/**
		 * @foo bar
		 */
		EOF;
		$expect  = <<<'EOF'
		<?php
		/**
		 * @new
		 */
		EOF;

		$phpcsFile = $this->createPhpcsFile( $content );
		$phpcsFile->fixer->startFile( $phpcsFile );
		$phpcsFile->fixer->enabled = true;

		$stackPtr = $phpcsFile->findNext( T_DOC_COMMENT_OPEN_TAG, 0 );
		$this->assertIsInt( $stackPtr );
		$end = $phpcsFile->findNext( T_DOC_COMMENT_CLOSE_TAG, 0 );
		$this->assertIsInt( $end );

		// Needs a warning added to work.
		$this->assertTrue( $phpcsFile->addFixableWarning( '🤷', $stackPtr, 'Dummy.Dummy.Dummy.Dummy' ) );

		$phpcsFile->fixer->beginChangeset();

		// Remove the content of the doc comment.
		for ( $i = $stackPtr + 1; $i < $end; $i++ ) {
			$phpcsFile->fixer->replaceToken( $i, '' );
		}

		$this->assertTrue( $tmp->addDocBlockTags( $phpcsFile, $stackPtr, array( '@new' ) ) );
		$this->assertTrue( $phpcsFile->fixer->endChangeset() );

		$phpcsFile->fixer->fixFile();
		$actual = $phpcsFile->fixer->getContents();
		$this->assertSame( $expect, $actual );
	}

	public function testHandlingUnsafeChanges() {
		$tmp = new class() {
			use AddDocBlockTagsTrait {
				AddDocBlockTagsTrait::addDocBlockTags as public;
			}
		};

		$content = <<<'EOF'
		<?php
		/**
		 * Comment.
		 */
		EOF;

		$phpcsFile = $this->createPhpcsFile( $content );
		$phpcsFile->fixer->startFile( $phpcsFile );
		$phpcsFile->fixer->enabled = true;

		$stackPtr = $phpcsFile->findNext( T_DOC_COMMENT_OPEN_TAG, 0 );
		$this->assertIsInt( $stackPtr );
		$end = $phpcsFile->findNext( T_DOC_COMMENT_CLOSE_TAG, 0 );
		$this->assertIsInt( $end );

		// Needs a warning added to work.
		$this->assertTrue( $phpcsFile->addFixableWarning( '🤷', $stackPtr, 'Dummy.Dummy.Dummy.Dummy' ) );

		$phpcsFile->fixer->beginChangeset();

		$this->assertTrue( $tmp->addDocBlockTags( $phpcsFile, $stackPtr, array( '@foo' ) ) );

		// Do a manual change to the token we're updating.
		for ( $i = $stackPtr + 1; $i < $end; $i++ ) {
			if ( str_contains( $phpcsFile->fixer->getTokenContent( $i ), '@foo' ) ) {
				$phpcsFile->fixer->addContentBefore( $i, 'XXX' );
			}
		}

		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage(
			"Unsafe multiple call to Automattic\\Jetpack\\Codesniffer\\Utils\\AddDocBlockTagsTrait::addDocBlockTags:\n<<<<<<<\n * @foo\n\n=======\nXXX * @foo\n \n>>>>>>>"
		);
		$tmp->addDocBlockTags( $phpcsFile, $stackPtr, array( '@bar' ) );
	}
}
