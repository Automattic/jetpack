<?php

namespace Automattic\Jetpack\Codesniffer\Tests\Utils;

use Automattic\Jetpack\Codesniffer\Utils\AddUseClassTrait;
use Automattic\Jetpack\Codesniffer\Utils\NamespaceInfo;
use PHPUnit\Framework\Attributes\DataProvider;

class AddUseClassTraitTest extends TestCase {

	/**
	 * @dataProvider provideAddUseClass
	 * @param string                $content File content to test with.
	 * @param array<string,?string> $toAdd Class names and optional aliases to add.
	 * @param string|\Throwable     $expect Expected fixed content or thrown exception.
	 */
	#[DataProvider( 'provideAddUseClass' )]
	public function testAddUseClass( $content, $toAdd, $expect ) {
		$tmp = new class() {
			use AddUseClassTrait {
				AddUseClassTrait::addUseClass as public;
			}
		};

		$phpcsFile = $this->createPhpcsFile( $content );
		$phpcsFile->fixer->startFile( $phpcsFile );
		$phpcsFile->fixer->enabled = true;

		$stackPtr = $phpcsFile->findNext( T_CLASS, 0, null );
		if ( $stackPtr === false ) {
			$stackPtr = $phpcsFile->numTokens - 1;
		}

		if ( $expect instanceof \Throwable ) {
			$this->expectException( get_class( $expect ) );
			$this->expectExceptionMessage( $expect->getMessage() );
		}

		// Needs a warning added to work.
		$this->assertTrue( $phpcsFile->addFixableWarning( '🤷', $stackPtr, 'Dummy.Dummy.Dummy.Dummy' ) );

		$nsinfo = NamespaceInfo::getNamespaceInfo( $phpcsFile, $stackPtr );
		$phpcsFile->fixer->beginChangeset();
		foreach ( $toAdd as $className => $alias ) {
			$this->assertTrue( $tmp->addUseClass( $phpcsFile, $nsinfo, $className, $alias ) );
		}
		$phpcsFile->fixer->endChangeset();

		$phpcsFile->fixer->fixFile();
		$actual = $phpcsFile->fixer->getContents();
		if ( ! $expect instanceof \Throwable ) {
			$this->assertSame( $expect, $actual );
		}
	}

	public static function provideAddUseClass() {
		$content = <<<'EOF'
		<?php
		/**
		 * Test file.
		 */

		namespace Foo;

		use Bar;

		class X {}
		EOF;

		yield 'NS+use, Add an alias' => array(
			$content,
			array( '\\Some\\Thing' => null ),
			str_replace( "use Bar;\n", "use Bar;\nuse Some\\Thing;\n", $content ),
		);
		yield 'NS+use, Add an alias with "as"' => array(
			$content,
			array( '\\Some\\Thing' => 'XXX' ),
			str_replace( "use Bar;\n", "use Bar;\nuse Some\\Thing as XXX;\n", $content ),
		);
		yield 'NS+use, Add a conflicting alias' => array(
			$content,
			array( '\\Some\\Thing' => 'Bar' ),
			new \RuntimeException( 'Alias `Bar` already exists for \\Bar, cannot alias to Some\\Thing.' ),
		);
		yield 'NS+use, Add something that already exists' => array(
			$content,
			array( '\\Bar' => null ),
			$content,
		);
		yield 'NS+use, Add two aliases' => array(
			$content,
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			str_replace( "use Bar;\n", "use Bar;\nuse Some\\Thing;\nuse Some\\OtherThing;\n", $content ),
		);

		$content = <<<'EOF'
		<?php
		/**
		 * Test file.
		 */

		namespace Foo;

		// a comment.

		/** Class comment */
		class X {}
		EOF;

		yield 'NS+no use, Add an alias' => array(
			$content,
			array( '\\Some\\Thing' => null ),
			str_replace( "// a comment.\n", "// a comment.\n\nuse Some\\Thing;\n", $content ),
		);
		yield 'NS+no use, Add an alias with "as"' => array(
			$content,
			array( '\\Some\\Thing' => 'XXX' ),
			str_replace( "// a comment.\n", "// a comment.\n\nuse Some\\Thing as XXX;\n", $content ),
		);
		yield 'NS+no use, Add two aliases' => array(
			$content,
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			str_replace( "// a comment.\n", "// a comment.\n\nuse Some\\Thing;\nuse Some\\OtherThing;\n", $content ),
		);

		$content = <<<'EOF'
		<?php
		/**
		 * Test file.
		 */

		use Xyz\Bar;

		class X {}
		EOF;

		yield 'No NS+use, Add an alias' => array(
			$content,
			array( '\\Some\\Thing' => null ),
			str_replace( "use Xyz\\Bar;\n", "use Xyz\\Bar;\nuse Some\\Thing;\n", $content ),
		);
		yield 'No NS+use, Add an alias with "as"' => array(
			$content,
			array( '\\Some\\Thing' => 'XXX' ),
			str_replace( "use Xyz\\Bar;\n", "use Xyz\\Bar;\nuse Some\\Thing as XXX;\n", $content ),
		);
		yield 'No NS+use, Add a conflicting alias' => array(
			$content,
			array( '\\Some\\Thing' => 'Bar' ),
			new \RuntimeException( 'Alias `Bar` already exists for \\Xyz\\Bar, cannot alias to Some\\Thing.' ),
		);
		yield 'No NS+use, Add something that already exists' => array(
			$content,
			array( '\\Xyz\\Bar' => null ),
			$content,
		);
		yield 'No NS+use, Add two aliases' => array(
			$content,
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			str_replace( "use Xyz\\Bar;\n", "use Xyz\\Bar;\nuse Some\\Thing;\nuse Some\\OtherThing;\n", $content ),
		);

		$content = <<<'EOF'
		<?php
		/**
		 * Test file.
		 */

		/** Class comment */
		class X {}
		EOF;

		yield 'No NS+no use, Add an alias' => array(
			$content,
			array( '\\Some\\Thing' => null ),
			str_replace( "Test file.\n */\n", "Test file.\n */\n\nuse Some\\Thing;\n", $content ),
		);
		yield 'No NS+no use, Add an alias with "as"' => array(
			$content,
			array( '\\Some\\Thing' => 'XXX' ),
			str_replace( "Test file.\n */\n", "Test file.\n */\n\nuse Some\\Thing as XXX;\n", $content ),
		);
		yield 'No NS+no use, Add two aliases' => array(
			$content,
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			str_replace( "Test file.\n */\n", "Test file.\n */\n\nuse Some\\Thing;\nuse Some\\OtherThing;\n", $content ),
		);

		$content = <<<'EOF'
		<?php
		/**
		 * Test file.
		 */

		namespace Foo {
			use Thing;
			use XXX;
		}

		namespace Bar {
			use Bar;

			$x = null;
			$z = function () use ( &$x ) {};

			class X {}
		}

		namespace Baz {
			use XXX;
		}
		EOF;

		yield 'Block NS+use, Add an alias' => array(
			$content,
			array( '\\Some\\Thing' => null ),
			str_replace( "use Bar;\n", "use Bar;\n\tuse Some\\Thing;\n", $content ),
		);
		yield 'Block NS+use, Add an alias with "as"' => array(
			$content,
			array( '\\Some\\Thing' => 'XXX' ),
			str_replace( "use Bar;\n", "use Bar;\n\tuse Some\\Thing as XXX;\n", $content ),
		);
		yield 'Block NS+use, Add a conflicting alias' => array(
			$content,
			array( '\\Some\\Thing' => 'Bar' ),
			new \RuntimeException( 'Alias `Bar` already exists for \\Bar, cannot alias to Some\\Thing.' ),
		);
		yield 'Block NS+use, Add something that already exists' => array(
			$content,
			array( '\\Bar' => null ),
			$content,
		);
		yield 'Block NS+use, Add two aliases' => array(
			$content,
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			str_replace( "use Bar;\n", "use Bar;\n\tuse Some\\Thing;\n\tuse Some\\OtherThing;\n", $content ),
		);

		$content = <<<'EOF'
		<?php
		/**
		 * Test file.
		 */

		namespace Foo {
			use Thing;
			use XXX;
		}

		namespace Bar {
			class X {}
		}

		namespace Baz {
			use XXX;
		}
		EOF;

		yield 'Block NS+no use, Add an alias' => array(
			$content,
			array( '\\Some\\Thing' => null ),
			str_replace( "namespace Bar {\n", "namespace Bar {\n\n use Some\\Thing;\n", $content ),
		);
		yield 'Block NS+no use, Add an alias with "as"' => array(
			$content,
			array( '\\Some\\Thing' => 'XXX' ),
			str_replace( "namespace Bar {\n", "namespace Bar {\n\n use Some\\Thing as XXX;\n", $content ),
		);
		yield 'Block NS+no use, Add two aliases' => array(
			$content,
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			str_replace( "namespace Bar {\n", "namespace Bar {\n\n use Some\\Thing;\n use Some\\OtherThing;\n", $content ),
		);

		$content = <<<'EOF'
		<?php
		/**
		 * Test file.
		 */

		namespace Foo;
		use Thing;
		use XXX;

		namespace Bar;
		use Bar;

		class X {}

		namespace Baz;
		use XXX;
		EOF;

		yield 'Multi-NS+use, Add an alias' => array(
			$content,
			array( '\\Some\\Thing' => null ),
			str_replace( "use Bar;\n", "use Bar;\nuse Some\\Thing;\n", $content ),
		);
		yield 'Multi-NS+use, Add an alias with "as"' => array(
			$content,
			array( '\\Some\\Thing' => 'XXX' ),
			str_replace( "use Bar;\n", "use Bar;\nuse Some\\Thing as XXX;\n", $content ),
		);
		yield 'Multi-NS+use, Add a conflicting alias' => array(
			$content,
			array( '\\Some\\Thing' => 'Bar' ),
			new \RuntimeException( 'Alias `Bar` already exists for \\Bar, cannot alias to Some\\Thing.' ),
		);
		yield 'Multi-NS+use, Add something that already exists' => array(
			$content,
			array( '\\Bar' => null ),
			$content,
		);
		yield 'Multi-NS+use, Add two aliases' => array(
			$content,
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			str_replace( "use Bar;\n", "use Bar;\nuse Some\\Thing;\nuse Some\\OtherThing;\n", $content ),
		);

		$content = <<<'EOF'
		<?php
		/**
		 * Test file.
		 */

		namespace Foo;
		use Thing;
		use XXX;

		namespace Bar;
		class X {}

		namespace Baz;
		use XXX;
		EOF;

		yield 'Multi-NS+no use, Add an alias' => array(
			$content,
			array( '\\Some\\Thing' => null ),
			str_replace( "namespace Bar;\n", "namespace Bar;\n\n use Some\\Thing;\n", $content ),
		);
		yield 'Multi-NS+no use, Add an alias with "as"' => array(
			$content,
			array( '\\Some\\Thing' => 'XXX' ),
			str_replace( "namespace Bar;\n", "namespace Bar;\n\n use Some\\Thing as XXX;\n", $content ),
		);
		yield 'Multi-NS+no use, Add two aliases' => array(
			$content,
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			str_replace( "namespace Bar;\n", "namespace Bar;\n\n use Some\\Thing;\n use Some\\OtherThing;\n", $content ),
		);

		yield 'No whitespace still works' => array(
			"<?php\nnamespace Foo;class X{}",
			array( '\\Some\\Thing' => null ),
			"<?php\nnamespace Foo;\n use Some\\Thing;\nclass X{}",
		);
		yield 'No whitespace still works x2' => array(
			"<?php\nnamespace Foo;class X{}",
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			"<?php\nnamespace Foo;\n use Some\\Thing;\n use Some\\OtherThing;\nclass X{}",
		);

		yield 'Odd comment before use still works' => array(
			"<?php\nnamespace Foo {\n\t/* ??? */ use Bar;\n\tclass X{}\n}\n",
			array( '\\Some\\Thing' => null ),
			"<?php\nnamespace Foo {\n\t/* ??? */ use Bar;\n\tuse Some\\Thing;\n\tclass X{}\n}\n",
		);

		yield 'Odd comment before use still works x2' => array(
			"<?php\nnamespace Foo {\n\t/* ??? */ use Bar;\n\tclass X{}\n}\n",
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			"<?php\nnamespace Foo {\n\t/* ??? */ use Bar;\n\tuse Some\\Thing;\n\tuse Some\\OtherThing;\n\tclass X{}\n}\n",
		);

		yield 'Mostly empty file still works' => array(
			'<?php',
			array( '\\Some\\Thing' => null ),
			"<?php\nuse Some\\Thing;\n",
		);

		yield 'Mostly empty file still works x2' => array(
			'<?php',
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			"<?php\nuse Some\\Thing;\nuse Some\\OtherThing;\n",
		);

		yield 'Mostly empty file still works (2)' => array(
			"<?php\n\n// Nothing here.\n\n",
			array( '\\Some\\Thing' => null ),
			"<?php\n\nuse Some\\Thing;\n\n// Nothing here.\n\n",
		);

		yield 'Mostly empty file still works (2) x2' => array(
			"<?php\n\n// Nothing here.\n\n",
			array(
				'\\Some\\Thing'      => null,
				'\\Some\\OtherThing' => null,
			),
			"<?php\n\nuse Some\\Thing;\nuse Some\\OtherThing;\n\n// Nothing here.\n\n",
		);
	}
}
