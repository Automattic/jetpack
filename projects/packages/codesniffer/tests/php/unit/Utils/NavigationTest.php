<?php

namespace Automattic\Jetpack\Codesniffer\Tests\Utils;

use Automattic\Jetpack\Codesniffer\Utils\Navigation;
use PHP_CodeSniffer\Util\Tokens;
use PHPCSUtils\Tokens\Collections;
use PHPUnit\Framework\Attributes\DataProvider;

class NavigationTest extends TestCase {

	/**
	 * @dataProvider provideFindStartOfRun
	 * @param string           $content File content to test with.
	 * @param string|int       $startType Token to lookup for `$start`.
	 * @param ?string          $startValue Value for `$start`.
	 * @param int              $startDelta Adjustmend for `$start`.
	 * @param string|int|null  $endType Token to lookup for `$end`.
	 * @param ?string          $endValue Value for `$end`.
	 * @param int              $endDelta Adjustmend for `$end`.
	 * @param (string|int)[]   $types Types for the run.
	 * @param string|int|false $expectType Token to lookup for the expected return value.
	 * @param ?string          $expectValue Value for the expected return token.
	 * @param int              $expectDelta Adjustmend for the expected return token.
	 */
	#[DataProvider( 'provideFindStartOfRun' )]
	public function testFindStartOfRun( $content, $startType, $startValue, $startDelta, $endType, $endValue, $endDelta, $types, $expectType, $expectValue, $expectDelta ) {
		$phpcsFile = $this->createPhpcsFile( $content );

		$start = $phpcsFile->findNext( $startType, 0, null, false, $startValue );
		$this->assertIsInt( $start );
		$start += $startDelta;

		if ( $endType !== null ) {
			$end = $phpcsFile->findNext( $endType, 0, null, false, $endValue );
			$this->assertIsInt( $end );
			$end += $endDelta;
		} else {
			$end = null;
		}

		if ( $expectType === false ) {
			$expect = false;
		} else {
			$expect = $phpcsFile->findNext( $expectType, 0, null, false, $expectValue );
			$this->assertIsInt( $expect );
			$expect += $expectDelta;
		}

		$this->assertSame( $expect, Navigation::findStartOfRun( $phpcsFile, $types, $start, $end ) );
	}

	public static function provideFindStartOfRun() {
		$content = <<<'EOF'
			<?php
			/** File comment */

			use Foo;

			// Some comment.

			/**
			 * Class comment.
			 */
			#[Attribute, Attribute2( /** Comment */ )]
			abstract class X {}
			EOF;

		yield 'Look backwards from T_CLASS' => array(
			$content,
			T_CLASS,
			null,
			-1,
			null,
			null,
			0,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
			T_STRING,
			'Foo',
			2,
		);

		yield 'Look backwards from T_CLASS with end match' => array(
			$content,
			T_CLASS,
			null,
			-1,
			T_COMMENT,
			"// Some comment.\n",
			1,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
			T_COMMENT,
			"// Some comment.\n",
			1,
		);

		yield 'Look backwards from T_CLASS with end no-match' => array(
			$content,
			T_CLASS,
			null,
			-1,
			T_STRING,
			'Foo',
			1,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
			T_STRING,
			'Foo',
			2,
		);

		yield 'Look backwards from T_CLASS with end no-match (2)' => array(
			$content,
			T_CLASS,
			null,
			-1,
			T_USE,
			null,
			0,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
			T_STRING,
			'Foo',
			2,
		);

		yield 'Look backwards from T_CLASS, forgot about modifiers' => array(
			$content,
			T_CLASS,
			null,
			-1,
			null,
			null,
			0,
			Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
			T_CLASS,
			null,
			-1,
		);

		yield 'Look backwards from T_CLASS, forgot about attributes' => array(
			$content,
			T_CLASS,
			null,
			-1,
			null,
			null,
			0,
			Collections::classModifierKeywords() + Tokens::$emptyTokens,
			T_ATTRIBUTE_END,
			null,
			1,
		);

		yield 'Start on T_CLASS instead of before it' => array(
			$content,
			T_CLASS,
			null,
			0,
			null,
			null,
			0,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
			false,
			null,
			0,
		);
	}

	/**
	 * @dataProvider provideFindEndOfRun
	 * @param string           $content File content to test with.
	 * @param string|int       $startType Token to lookup for `$start`.
	 * @param ?string          $startValue Value for `$start`.
	 * @param int              $startDelta Adjustmend for `$start`.
	 * @param string|int|null  $endType Token to lookup for `$end`.
	 * @param ?string          $endValue Value for `$end`.
	 * @param int              $endDelta Adjustmend for `$end`.
	 * @param (string|int)[]   $types Types for the run.
	 * @param string|int|false $expectType Token to lookup for the expected return value.
	 * @param ?string          $expectValue Value for the expected return token.
	 * @param int              $expectDelta Adjustmend for the expected return token.
	 */
	#[DataProvider( 'provideFindEndOfRun' )]
	public function testFindEndOfRun( $content, $startType, $startValue, $startDelta, $endType, $endValue, $endDelta, $types, $expectType, $expectValue, $expectDelta ) {
		$phpcsFile = $this->createPhpcsFile( $content );

		$start = $phpcsFile->findNext( $startType, 0, null, false, $startValue );
		$this->assertIsInt( $start );
		$start += $startDelta;

		if ( $endType !== null ) {
			$end = $phpcsFile->findNext( $endType, 0, null, false, $endValue );
			$this->assertIsInt( $end );
			$end += $endDelta;
		} else {
			$end = null;
		}

		if ( $expectType === false ) {
			$expect = false;
		} else {
			$expect = $phpcsFile->findNext( $expectType, 0, null, false, $expectValue );
			$this->assertIsInt( $expect );
			$expect += $expectDelta;
		}

		$this->assertSame( $expect, Navigation::findEndOfRun( $phpcsFile, $types, $start, $end ) );
	}

	public static function provideFindEndOfRun() {
		$content = <<<'EOF'
			<?php
			/** File comment */

			use Foo;

			// Some comment.

			/**
			 * Class comment.
			 */
			#[Attribute, Attribute2( /** Comment */ )]
			abstract class X {}
			EOF;

		yield 'Look forwards from start' => array(
			$content,
			T_OPEN_TAG,
			null,
			1,
			null,
			null,
			0,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			T_USE,
			null,
			-1,
		);

		yield 'Look forwards from start with end match' => array(
			$content,
			T_OPEN_TAG,
			null,
			1,
			T_DOC_COMMENT_CLOSE_TAG,
			null,
			0,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			T_DOC_COMMENT_CLOSE_TAG,
			null,
			0,
		);

		yield 'Look forwards from start with end no-match' => array(
			$content,
			T_OPEN_TAG,
			null,
			1,
			T_USE,
			null,
			0,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			T_USE,
			null,
			-1,
		);

		yield 'Look forwards from start with end no-match (2)' => array(
			$content,
			T_OPEN_TAG,
			null,
			1,
			T_CLASS,
			null,
			0,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			T_USE,
			null,
			-1,
		);

		yield 'Look forwards from inline comment' => array(
			$content,
			T_COMMENT,
			"// Some comment.\n",
			1,
			null,
			null,
			0,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			T_CLASS,
			null,
			-1,
		);

		yield 'Look forwards from inline comment, forgot about attributes' => array(
			$content,
			T_COMMENT,
			"// Some comment.\n",
			1,
			null,
			null,
			0,
			Collections::classModifierKeywords() + Tokens::$emptyTokens,
			T_ATTRIBUTE,
			null,
			-1,
		);

		yield 'Look forwards from T_CLASS' => array(
			$content,
			T_CLASS,
			null,
			0,
			null,
			null,
			0,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			false,
			null,
			0,
		);
	}

	/**
	 * @dataProvider provideFindPreviousInRun
	 * @param string           $content File content to test with.
	 * @param string|int       $startType Token to lookup for `$start`.
	 * @param ?string          $startValue Value for `$start`.
	 * @param int              $startDelta Adjustmend for `$start`.
	 * @param string|int|null  $endType Token to lookup for `$end`.
	 * @param ?string          $endValue Value for `$end`.
	 * @param int              $endDelta Adjustmend for `$end`.
	 * @param (string|int)[]   $types Types to look for.
	 * @param (string|int)[]   $runTypes Types for the run.
	 * @param ?string          $value Value for the call.
	 * @param string|int|false $expectType Token to lookup for the expected return value.
	 * @param ?string          $expectValue Value for the expected return token.
	 * @param int              $expectDelta Adjustmend for the expected return token.
	 */
	#[DataProvider( 'provideFindPreviousInRun' )]
	public function testFindPreviousInRun( $content, $startType, $startValue, $startDelta, $endType, $endValue, $endDelta, $types, $runTypes, $value, $expectType, $expectValue, $expectDelta ) {
		$phpcsFile = $this->createPhpcsFile( $content );

		$start = $phpcsFile->findNext( $startType, 0, null, false, $startValue );
		$this->assertIsInt( $start );
		$start += $startDelta;

		if ( $endType !== null ) {
			$end = $phpcsFile->findNext( $endType, 0, null, false, $endValue );
			$this->assertIsInt( $end );
			$end += $endDelta;
		} else {
			$end = null;
		}

		if ( $expectType === false ) {
			$expect = false;
		} else {
			$expect = $phpcsFile->findNext( $expectType, 0, null, false, $expectValue );
			$this->assertIsInt( $expect );
			$expect += $expectDelta;
		}

		$this->assertSame( $expect, Navigation::findPreviousInRun( $phpcsFile, $types, $runTypes, $start, $end, $value ) );
	}

	public static function provideFindPreviousInRun() {
		$content = <<<'EOF'
			<?php
			/** File comment */

			use Foo;

			// Some comment.

			/**
			 * Class comment.
			 */
			#[Attribute, Attribute2( /** Comment */ )]
			abstract class X {}
			EOF;

		yield 'Look backwards from T_CLASS for T_DOC_COMMENT_CLOSE_TAG' => array(
			$content,
			T_CLASS,
			null,
			-1,
			null,
			null,
			0,
			T_DOC_COMMENT_CLOSE_TAG,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
			null,
			T_DOC_COMMENT_STRING,
			'Class comment.',
			3,
		);

		yield 'Look backwards from T_CLASS for T_DOC_COMMENT_OPEN_TAG' => array(
			$content,
			T_CLASS,
			null,
			-1,
			null,
			null,
			0,
			T_DOC_COMMENT_OPEN_TAG,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
			null,
			T_COMMENT,
			"// Some comment.\n",
			2,
		);

		yield 'Look backwards from T_CLASS for T_USE' => array(
			$content,
			T_CLASS,
			null,
			-1,
			null,
			null,
			0,
			T_USE,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
			null,
			false,
			null,
			0,
		);

		yield 'Look backwards from T_CLASS with end' => array(
			$content,
			T_CLASS,
			null,
			-1,
			T_ABSTRACT,
			null,
			-1,
			T_DOC_COMMENT_OPEN_TAG,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
			null,
			false,
			null,
			0,
		);

		yield 'Find attribute name by value' => array(
			$content,
			T_ATTRIBUTE_END,
			null,
			-1,
			T_ATTRIBUTE,
			null,
			0,
			T_STRING,
			Tokens::$emptyTokens + array(
				T_STRING            => T_STRING,
				T_COMMA             => T_COMMA,
				T_CLOSE_PARENTHESIS => T_CLOSE_PARENTHESIS,
			),
			'Attribute',
			T_STRING,
			'Attribute',
			0,
		);

		yield 'Not-find attribute name by value' => array(
			$content,
			T_ATTRIBUTE_END,
			null,
			-1,
			T_ATTRIBUTE,
			null,
			0,
			T_STRING,
			Tokens::$emptyTokens + array(
				T_STRING            => T_STRING,
				T_COMMA             => T_COMMA,
				T_CLOSE_PARENTHESIS => T_CLOSE_PARENTHESIS,
			),
			'Attribute3',
			false,
			null,
			0,
		);

		yield 'Run is an unindexed array' => array(
			"<?php\n/** Doc comment */\n   \n\nclass X {}\n",
			T_CLASS,
			null,
			-1,
			null,
			null,
			0,
			T_DOC_COMMENT_CLOSE_TAG,
			array( T_WHITESPACE ),
			null,
			T_DOC_COMMENT_CLOSE_TAG,
			null,
			0,
		);

		yield 'Run is a single literal' => array(
			"<?php\n/** Doc comment */\n   \n\nclass X {}\n",
			T_CLASS,
			null,
			-1,
			null,
			null,
			0,
			T_DOC_COMMENT_CLOSE_TAG,
			T_WHITESPACE,
			null,
			T_DOC_COMMENT_CLOSE_TAG,
			null,
			0,
		);
	}

	/**
	 * @dataProvider provideFindNextInRun
	 * @param string           $content File content to test with.
	 * @param string|int       $startType Token to lookup for `$start`.
	 * @param ?string          $startValue Value for `$start`.
	 * @param int              $startDelta Adjustmend for `$start`.
	 * @param string|int|null  $endType Token to lookup for `$end`.
	 * @param ?string          $endValue Value for `$end`.
	 * @param int              $endDelta Adjustmend for `$end`.
	 * @param (string|int)[]   $types Types to look for.
	 * @param (string|int)[]   $runTypes Types for the run.
	 * @param ?string          $value Value for the call.
	 * @param string|int|false $expectType Token to lookup for the expected return value.
	 * @param ?string          $expectValue Value for the expected return token.
	 * @param int              $expectDelta Adjustmend for the expected return token.
	 */
	#[DataProvider( 'provideFindNextInRun' )]
	public function testFindNextInRun( $content, $startType, $startValue, $startDelta, $endType, $endValue, $endDelta, $types, $runTypes, $value, $expectType, $expectValue, $expectDelta ) {
		$phpcsFile = $this->createPhpcsFile( $content );

		$start = $phpcsFile->findNext( $startType, 0, null, false, $startValue );
		$this->assertIsInt( $start );
		$start += $startDelta;

		if ( $endType !== null ) {
			$end = $phpcsFile->findNext( $endType, 0, null, false, $endValue );
			$this->assertIsInt( $end );
			$end += $endDelta;
		} else {
			$end = null;
		}

		if ( $expectType === false ) {
			$expect = false;
		} else {
			$expect = $phpcsFile->findNext( $expectType, 0, null, false, $expectValue );
			$this->assertIsInt( $expect );
			$expect += $expectDelta;
		}

		$this->assertSame( $expect, Navigation::findNextInRun( $phpcsFile, $types, $runTypes, $start, $end, $value ) );
	}

	public static function provideFindNextInRun() {
		$content = <<<'EOF'
			<?php // phpcs:ignore
			/** File comment */

			use Foo;

			// Some comment.

			/**
			 * Class comment.
			 */
			#[Attribute, Attribute2( /** Comment */ )]
			abstract class X {}
			EOF;

		yield 'Look forwards from start for T_DOC_COMMENT_OPEN_TAG' => array(
			$content,
			T_OPEN_TAG,
			null,
			1,
			null,
			null,
			0,
			T_DOC_COMMENT_OPEN_TAG,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			null,
			T_DOC_COMMENT_STRING,
			'File comment ',
			-2,
		);

		yield 'Look forwards from start for T_DOC_COMMENT_CLOSE_TAG' => array(
			$content,
			T_OPEN_TAG,
			null,
			1,
			null,
			null,
			0,
			T_DOC_COMMENT_CLOSE_TAG,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			null,
			T_DOC_COMMENT_STRING,
			'File comment ',
			1,
		);

		yield 'Look forwards from start for T_USE' => array(
			$content,
			T_OPEN_TAG,
			null,
			1,
			null,
			null,
			0,
			T_USE,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			null,
			T_USE,
			null,
			0,
		);

		yield 'Look forwards from start for T_CLASS' => array(
			$content,
			T_OPEN_TAG,
			null,
			1,
			null,
			null,
			0,
			T_CLASS,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			null,
			false,
			null,
			0,
		);

		yield 'Look forwards from start for T_USE with end' => array(
			$content,
			T_OPEN_TAG,
			null,
			1,
			T_DOC_COMMENT_STRING,
			'File comment ',
			1,
			T_USE,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			null,
			false,
			null,
			0,
		);

		yield 'Look forwards from inline comment for T_CLASS' => array(
			$content,
			T_COMMENT,
			"// Some comment.\n",
			1,
			null,
			null,
			0,
			T_CLASS,
			Collections::classModifierKeywords() + Tokens::$emptyTokens + array( T_ATTRIBUTE => T_ATTRIBUTE ),
			null,
			T_CLASS,
			null,
			0,
		);

		yield 'Look forwards from inline comment for T_CLASS, forgot about attributes' => array(
			$content,
			T_COMMENT,
			"// Some comment.\n",
			1,
			null,
			null,
			0,
			T_CLASS,
			Collections::classModifierKeywords() + Tokens::$emptyTokens,
			null,
			false,
			null,
			0,
		);

		yield 'Find attribute name by value' => array(
			$content,
			T_ATTRIBUTE,
			null,
			1,
			T_ATTRIBUTE_END,
			null,
			0,
			T_STRING,
			Tokens::$emptyTokens + array(
				T_STRING            => T_STRING,
				T_COMMA             => T_COMMA,
				T_CLOSE_PARENTHESIS => T_CLOSE_PARENTHESIS,
			),
			'Attribute2',
			T_STRING,
			'Attribute2',
			0,
		);

		yield 'Not-find attribute name by value' => array(
			$content,
			T_ATTRIBUTE,
			null,
			1,
			T_ATTRIBUTE_END,
			null,
			0,
			T_STRING,
			Tokens::$emptyTokens + array(
				T_STRING            => T_STRING,
				T_COMMA             => T_COMMA,
				T_CLOSE_PARENTHESIS => T_CLOSE_PARENTHESIS,
			),
			'Attribute3',
			false,
			null,
			0,
		);

		yield 'Run is an unindexed array' => array(
			"<?php\n/** Doc comment */\n   \n\nclass X {}\n",
			T_OPEN_TAG,
			null,
			1,
			null,
			null,
			0,
			T_CLASS,
			array_values( Tokens::$emptyTokens ),
			null,
			T_CLASS,
			null,
			0,
		);

		yield 'Run is a single literal' => array(
			"<?php\n\n   \n\nclass X {}\n",
			T_OPEN_TAG,
			null,
			1,
			null,
			null,
			0,
			T_CLASS,
			T_WHITESPACE,
			null,
			T_CLASS,
			null,
			0,
		);
	}
}
