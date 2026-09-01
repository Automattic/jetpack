<?php

namespace Automattic\Jetpack\Codesniffer\Tests\Utils;

use Automattic\Jetpack\Codesniffer\Utils\IsTestClassTrait;
use PHP_CodeSniffer\Files\File;
use PHPUnit\Framework\Attributes\DataProvider;

class IsTestClassTraitTest extends TestCase {

	/**
	 * @dataProvider provideIsTestFile
	 * @param string     $content File content to test with.
	 * @param int|false  $stackPtr Stack ptr to test with.
	 * @param int|string $checkPtr Type of what $stackPtr points to, if not false, for a sanity check.
	 * @param string     $expect Expected result.
	 */
	#[DataProvider( 'provideIsTestFile' )]
	public function testIsTestFile( $content, $stackPtr, $checkPtr, $expect ) {
		$tmp = new class() {
			use IsTestClassTrait {
				IsTestClassTrait::isTestFile as public;
			}

			public function __construct() {
				// Clear cache before test.
				self::$testFileCache = array();
			}

			public $calledFor = null;

			private function isTestClass( File $phpcsFile, $classToken ): bool {
				$this->calledFor = $phpcsFile->getDeclarationName( $classToken );
				return true;
			}
		};

		$phpcsFile = $this->createPhpcsFile( $content );
		if ( $stackPtr !== false ) {
			$this->assertSame( $checkPtr, $phpcsFile->getTokens()[ $stackPtr ]['type'] );
		}

		$this->assertSame( $expect !== null, $tmp->isTestFile( $phpcsFile, $stackPtr ) );
		$this->assertSame( $expect, $tmp->calledFor );
	}

	public static function provideIsTestFile() {
		yield 'No ptr' => array(
			<<<'EOF'
				<?php
				class FooTest { public function testFoo() {} }
				EOF,
			false,
			null,
			'FooTest',
		);
		yield 'T_CLASS token' => array(
			<<<'EOF'
				<?php
				class FooTest { public function testFoo() {} }
				EOF,
			1,
			'T_CLASS',
			'FooTest',
		);
		yield 'T_FUNCTION token' => array(
			<<<'EOF'
				<?php
				class FooTest { public function testFoo() {} }
				EOF,
			9,
			'T_FUNCTION',
			'FooTest',
		);
		yield 'T_FUNCTION token in second class in file' => array(
			<<<'EOF'
				<?php
				class FooTest { public function testFoo() {} }
				class BarTest { public function testFoo() {} }
				EOF,
			28,
			'T_FUNCTION',
			'BarTest',
		);
		yield 'No ptr, no class' => array(
			<<<'EOF'
				<?php
				trait FooTest { public function testFoo() {} }
				EOF,
			false,
			null,
			null,
		);
	}

	public function testIsTestFileCache() {
		$tmp = new class() {
			use IsTestClassTrait {
				IsTestClassTrait::isTestFile as public;
			}

			public $count = 0;

			private function isTestClass() {
				++$this->count;
				return true;
			}
		};

		$phpcsFile = $this->createPhpcsFile( "<?php\nclass A {}\n" );
		$this->assertTrue( $tmp->isTestFile( $phpcsFile ) );
		$phpcsFile = $this->createPhpcsFile( "<?php\nclass A {}\n" );
		$this->assertTrue( $tmp->isTestFile( $phpcsFile ) );
		$this->assertSame( 1, $tmp->count );
	}

	/**
	 * @dataProvider provideIsTestClass
	 * @param string $content File content to test with.
	 * @param string $expect Expected result.
	 */
	#[DataProvider( 'provideIsTestClass' )]
	public function testIsTestClass( $content, $expect ) {
		$tmp = new class() {
			use IsTestClassTrait {
				IsTestClassTrait::isTestClass as public;
			}
		};

		$phpcsFile = $this->createPhpcsFile( $content );
		$stackPtr  = $phpcsFile->findNext( T_CLASS, 0 );
		if ( ! is_int( $stackPtr ) ) {
			var_dump( $phpcsFile->getTokens() );
		}
		$this->assertIsInt( $stackPtr );
		$this->assertSame( $expect, $tmp->isTestClass( $phpcsFile, $stackPtr ) );
	}

	public static function provideIsTestClass() {
		yield 'Generic class name' => array( "<?php\nclass Foo {}\n", false );
		yield "Class name ends in 'Test'" => array( "<?php\nclass FooTest {}\n", true );
		yield "Class name ends in 'TestCase'" => array( "<?php\nclass FooTestCase {}\n", true );
		yield "Class name ends in 'TestBase'" => array( "<?php\nclass FooTestBase {}\n", true );
		yield "Class name ends in 'TestCaseBase'" => array( "<?php\nclass FooTestCaseBase {}\n", true );
		yield "Class name ends in 'TestBaseCase'" => array( "<?php\nclass FooTestBaseCase {}\n", false );
		yield "Class name ends in 'Suite'" => array( "<?php\nclass FooSuite {}\n", true );
		yield "Class name ends in 'test'" => array( "<?php\nclass Footest {}\n", false );
		yield "Class name ends in 'Testcase'" => array( "<?php\nclass FooTestcase {}\n", false );
		yield "Class name ends in 'Testbase'" => array( "<?php\nclass FooTestbase {}\n", false );
		yield "Class name ends in 'TestCasebase'" => array( "<?php\nclass FooTestCasebase {}\n", false );
		yield "Class name ends in 'TestcaseBase'" => array( "<?php\nclass FooTestcaseBase {}\n", false );
		yield "Class name ends in 'Testcasebase'" => array( "<?php\nclass FooTestcasebase {}\n", false );

		yield 'Generic parent class name' => array( "<?php\nclass Foo extends Bar {}\n", false );
		yield "Parent name ends in 'Test'" => array( "<?php\nclass Foo extends BarTest {}\n", true );
		yield "Parent name ends in 'TestCase'" => array( "<?php\nclass Foo extends BarTestCase {}\n", true );
		yield "Parent name ends in 'TestBase'" => array( "<?php\nclass Foo extends BarTestBase {}\n", true );
		yield "Parent name ends in 'TestCaseBase'" => array( "<?php\nclass Foo extends BarTestCaseBase {}\n", true );
		yield "Parent name ends in 'TestBaseCase'" => array( "<?php\nclass Foo extends BarTestBaseCase {}\n", false );
		yield "Parent name ends in 'Suite'" => array( "<?php\nclass Foo extends BarSuite {}\n", true );
		yield "Parent name ends in 'test'" => array( "<?php\nclass Foo extends Bartest {}\n", false );
		yield "Parent name ends in 'Testcase'" => array( "<?php\nclass Foo extends BarTestcase {}\n", true );
		yield "Parent name ends in 'Testbase'" => array( "<?php\nclass Foo extends BarTestbase {}\n", true );
		yield "Parent name ends in 'TestCasebase'" => array( "<?php\nclass Foo extends BarTestCasebase {}\n", true );
		yield "Parent name ends in 'TestcaseBase'" => array( "<?php\nclass Foo extends BarTestcaseBase {}\n", true );
		yield "Parent name ends in 'Testcasebase'" => array( "<?php\nclass Foo extends BarTestcasebase {}\n", true );

		yield "Parent is 'WP_UnitTestCase_Base'" => array( "<?php\nclass Foo extends WP_UnitTestCase_Base {}\n", true );
		yield "Parent is '\\WP_UnitTestCase_Base'" => array( "<?php\nclass Foo extends \\WP_UnitTestCase_Base {}\n", true );
		yield "Parent is 'NotWP_UnitTestCase_Base'" => array( "<?php\nclass Foo extends NotWP_UnitTestCase_Base {}\n", false );
		yield "Parent is 'WP_Test_XXX_Case'" => array( "<?php\nclass Foo extends WP_Test_XXX_Case {}\n", true );
		yield "Parent is 'WP_Test_XXX_Base'" => array( "<?php\nclass Foo extends WP_Test_XXX_Base {}\n", true );
		yield "Parent is 'WP_Test_XXX_Suite'" => array( "<?php\nclass Foo extends WP_Test_XXX_Suite {}\n", true );
		yield "Parent is '\\WP_Test_XXX_Case'" => array( "<?php\nclass Foo extends \\WP_Test_XXX_Case {}\n", true );
		yield "Parent is 'NotWP_Test_XXX_Case'" => array( "<?php\nclass Foo extends NotWP_Test_XXX_Case {}\n", false );
	}

	public function testIsTestClass_badPtr() {
		$tmp = new class() {
			use IsTestClassTrait {
				IsTestClassTrait::isTestClass as public;
			}
		};

		$phpcsFile = $this->createPhpcsFile( "<?php\ntrait T {}" );
		$this->assertFalse( $tmp->isTestClass( $phpcsFile, 1000 ) );
		$this->assertFalse( $tmp->isTestClass( $phpcsFile, 1 ) );
	}
}
