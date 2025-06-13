<?php

namespace Automattic\Jetpack\Codesniffer\Tests\Utils;

use Automattic\Jetpack\Codesniffer\Utils\NamespaceInfo;
use PHPUnit\Framework\Attributes\DataProvider;

class NamespaceInfoTest extends TestCase {

	/**
	 * @dataProvider provideBasics
	 * @param string     $content File content to test with.
	 * @param string     $locator Locator comment.
	 * @param string|int $tokenType Token type to look for after the locator comment.
	 * @param array      $expectInfo Expected namespace info.
	 * @param array      $expectAliases Expected aliases.
	 */
	#[DataProvider( 'provideBasics' )]
	public function testBasics( $content, $locator, $tokenType, $expectInfo, $expectAliases ) {
		$phpcsFile = $this->createPhpcsFile( $content );
		$stackPtr  = $this->findTargetToken( $phpcsFile, $locator, $tokenType );
		$this->assertIsInt( $stackPtr );

		$nsinfo = NamespaceInfo::getNamespaceInfo( $phpcsFile, $stackPtr );
		$this->assertSame( $expectInfo, $nsinfo );
		$aliases = NamespaceInfo::getClassAliases( $phpcsFile, $nsinfo );
		$this->assertSame( $expectAliases, $aliases );
	}

	public static function provideBasics() {
		yield 'File with standard namespace' => array(
			<<<'EOF'
				<?php
				/**
				 * Test file.
				 */

				namespace Some\Namespace;

				use Exception;
				use A\B\C;

				/* here */
				class Foo {}
				EOF,
			'/* here */',
			T_CLASS,
			array(
				'ptr'     => 12,
				'name'    => 'Some\\Namespace',
				'nsStart' => 17,
				'nsEnd'   => null,
			),
			array(
				'Exception' => '\\Exception',
				'C'         => '\\A\\B\\C',
			),
		);

		yield 'File with no namespace' => array(
			<<<'EOF'
				<?php
				/**
				 * Test file.
				 */

				use A\B\C;

				/* here */
				class Foo {}
				EOF,
			'/* here */',
			T_CLASS,
			array(
				'ptr'     => null,
				'name'    => '',
				'nsStart' => 0,
				'nsEnd'   => null,
			),
			array(
				'C' => '\\A\\B\\C',
			),
		);

		$content = <<<'EOF'
			<?php
			/**
			 * Test file.
			 */

			namespace Some\Namespace;

			use Exception;
			use A\B\C;

			/* here 1 */
			class Foo {}

			namespace AnotherNamespace;

			use X\Y\{Z1, Z2};
			use Q1, Q2;
			use SomeClass as SomeAlias;
			use function ns\foobar;
			use const ns\SOMECONST;

			$var = namespace\A_CONST;
			$tmp = function () use ( $var ) {};

			/* here 2 */
			class Bar {}

			namespace ThirdNamespace;
			/* here 3 */
			class Bar {}
			EOF;

		yield 'Multiple namespaces (1)' => array(
			$content,
			'/* here 1 */',
			T_CLASS,
			array(
				'ptr'     => 12,
				'name'    => 'Some\\Namespace',
				'nsStart' => 17,
				'nsEnd'   => 44,
			),
			array(
				'Exception' => '\\Exception',
				'C'         => '\\A\\B\\C',
			),
		);
		yield 'Multiple namespaces (2)' => array(
			$content,
			'/* here 2 */',
			T_CLASS,
			array(
				'ptr'     => 45,
				'name'    => 'AnotherNamespace',
				'nsStart' => 48,
				'nsEnd'   => 141,
			),
			array(
				'Z1'        => '\\X\\Y\\Z1',
				'Z2'        => '\\X\\Y\\Z2',
				'Q1'        => '\\Q1',
				'Q2'        => '\\Q2',
				'SomeAlias' => '\\SomeClass',
			),
		);
		yield 'Multiple namespaces (3)' => array(
			$content,
			'/* here 3 */',
			T_CLASS,
			array(
				'ptr'     => 142,
				'name'    => 'ThirdNamespace',
				'nsStart' => 145,
				'nsEnd'   => null,
			),
			array(),
		);

		$content = <<<'EOF'
			<?php
			/**
			 * Test file.
			 */

			namespace Some\Namespace {

				use Exception;
				use A\B\C;

				/* here 1 */
				class Foo {}
			}

			namespace AnotherNamespace {

				use X\Y\{Z1, Z2};
				use Q1, Q2;
				use SomeClass as SomeAlias;
				use function ns\foobar;
				use const ns\SOMECONST;

				$var = ns\SOMECONST;
				$tmp = function () use ( $var ) {};

				/* here 2 */
				class Bar {}
			}

			namespace ThirdNamespace {
				/* here 3 */
				class Bar {}
			}

			namespace {
				/* here 4 */
				class Bar {}
			}
			EOF;

		yield 'Namespace block (1)' => array(
			$content,
			'/* here 1 */',
			T_CLASS,
			array(
				'ptr'     => 12,
				'name'    => 'Some\\Namespace',
				'nsStart' => 18,
				'nsEnd'   => 49,
			),
			array(
				'Exception' => '\\Exception',
				'C'         => '\\A\\B\\C',
			),
		);
		yield 'Namespace block (2)' => array(
			$content,
			'/* here 2 */',
			T_CLASS,
			array(
				'ptr'     => 52,
				'name'    => 'AnotherNamespace',
				'nsStart' => 56,
				'nsEnd'   => 158,
			),
			array(
				'Z1'        => '\\X\\Y\\Z1',
				'Z2'        => '\\X\\Y\\Z2',
				'Q1'        => '\\Q1',
				'Q2'        => '\\Q2',
				'SomeAlias' => '\\SomeClass',
			),
		);
		yield 'Namespace block (3)' => array(
			$content,
			'/* here 3 */',
			T_CLASS,
			array(
				'ptr'     => 161,
				'name'    => 'ThirdNamespace',
				'nsStart' => 165,
				'nsEnd'   => 178,
			),
			array(),
		);
		yield 'Namespace block (4)' => array(
			$content,
			'/* here 4 */',
			T_CLASS,
			array(
				'ptr'     => 181,
				'name'    => '',
				'nsStart' => 183,
				'nsEnd'   => 196,
			),
			array(),
		);
	}

	public function testEmptyFile() {
		$phpcsFile = $this->createPhpcsFile( '' );
		$nsinfo    = NamespaceInfo::getNamespaceInfo( $phpcsFile, 0 );
		$this->assertSame(
			array(
				'ptr'     => null,
				'name'    => '',
				'nsStart' => 0,
				'nsEnd'   => null,
			),
			$nsinfo
		);
		$this->assertSame( array(), NamespaceInfo::getClassAliases( $phpcsFile, $nsinfo ) );
	}

	public function testCache() {
		$phpcsFile = $this->createPhpcsFile( "<?php\nnamespace Foo;\n" );
		// @phan-suppress-next-line PhanAccessMethodInternal
		\PHPCSUtils\Internal\Cache::set( $phpcsFile, NamespaceInfo::class . '::getNamespaceInfo', 1, array( 'cached' => true ) );
		$this->assertSame( array( 'cached' => true ), NamespaceInfo::getNamespaceInfo( $phpcsFile, $phpcsFile->numTokens - 1 ) );
		// @phan-suppress-next-line PhanAccessMethodInternal
		\PHPCSUtils\Internal\Cache::set( $phpcsFile, NamespaceInfo::class . '::getClassAliases', 1, array( 'aliasescached' => true ) );
		$this->assertSame( array( 'aliasescached' => true ), NamespaceInfo::getClassAliases( $phpcsFile, array( 'nsptr' => 1 ) ) );
	}

	/**
	 * @dataProvider provideQualifyClassName
	 * @param string $name Name to qualify.
	 * @param string $nsname Containing namespace name.
	 * @param array  $aliases Namespace alias map.
	 * @param string $expect Expected qualified name.
	 */
	#[DataProvider( 'provideQualifyClassName' )]
	public function testQualifyClassName( $name, $nsname, $aliases, $expect ) {
		$this->assertSame( $expect, NamespaceInfo::qualifyClassName( $name, $nsname, $aliases ) );
	}

	public static function provideQualifyClassName() {
		$aliases = array(
			'C'         => '\A\B\C',
			'Aliased'   => '\A\B\D',
			'Throwable' => '\Throwable',
		);

		yield 'NS, already qualified' => array(
			'\\Aliased',
			'Xyz',
			$aliases,
			'\\Aliased',
		);
		yield 'NS, namespace operator' => array(
			'namespace\\Aliased',
			'Xyz',
			$aliases,
			'\\Xyz\\Aliased',
		);
		yield 'NS, namespace operator 2' => array(
			'namespace\\Aliased\\Cls',
			'Xyz',
			$aliases,
			'\\Xyz\\Aliased\\Cls',
		);
		yield 'NS, known alias (1)' => array(
			'C',
			'Xyz',
			$aliases,
			'\\A\\B\\C',
		);
		yield 'NS, known alias (2)' => array(
			'Aliased',
			'Xyz',
			$aliases,
			'\\A\\B\\D',
		);
		yield 'NS, known alias (3)' => array(
			'Throwable',
			'Xyz',
			$aliases,
			'\\Throwable',
		);
		yield 'NS, alias prefix (1)' => array(
			'C\\Q',
			'Xyz',
			$aliases,
			'\\A\\B\\C\\Q',
		);
		yield 'NS, alias prefix (2)' => array(
			'Aliased\\X\\Y\\Z',
			'Xyz',
			$aliases,
			'\\A\\B\\D\\X\\Y\\Z',
		);
		yield 'NS, not aliased (1)' => array(
			'Foo',
			'Xyz',
			$aliases,
			'\\Xyz\\Foo',
		);
		yield 'NS, not aliased (2)' => array(
			'Bar\\Baz',
			'Xyz',
			$aliases,
			'\\Xyz\\Bar\\Baz',
		);
		yield 'NS, not confused by partial prefix' => array(
			'AliasedX',
			'Xyz',
			$aliases,
			'\\Xyz\\AliasedX',
		);

		$aliases = array(
			'C'       => '\A\B\C',
			'Aliased' => '\A\B\D',
		);

		yield 'No NS, already qualified' => array(
			'\\Aliased',
			'',
			$aliases,
			'\\Aliased',
		);
		yield 'No NS, namespace operator' => array(
			'namespace\\Aliased',
			'',
			$aliases,
			'\\Aliased',
		);
		yield 'No NS, namespace operator 2' => array(
			'namespace\\Aliased\\Cls',
			'',
			$aliases,
			'\\Aliased\\Cls',
		);
		yield 'No NS, known alias (1)' => array(
			'C',
			'',
			$aliases,
			'\\A\\B\\C',
		);
		yield 'No NS, known alias (2)' => array(
			'Aliased',
			'',
			$aliases,
			'\\A\\B\\D',
		);
		yield 'No NS, alias prefix (1)' => array(
			'C\\Q',
			'',
			$aliases,
			'\\A\\B\\C\\Q',
		);
		yield 'No NS, alias prefix (2)' => array(
			'Aliased\\X\\Y\\Z',
			'',
			$aliases,
			'\\A\\B\\D\\X\\Y\\Z',
		);
		yield 'No NS, not aliased (1)' => array(
			'Foo',
			'',
			$aliases,
			'\\Foo',
		);
		yield 'No NS, not aliased (2)' => array(
			'Bar\\Baz',
			'',
			$aliases,
			'\\Bar\\Baz',
		);
		yield 'No NS, not confused by partial prefix' => array(
			'AliasedX',
			'',
			$aliases,
			'\\AliasedX',
		);
	}

	/**
	 * @dataProvider provideUnqualifyClassName
	 * @param string $name Name to unqualify.
	 * @param string $nsname Containing namespace name.
	 * @param array  $aliases Namespace alias map.
	 * @param string $expect Expected unqualified name.
	 */
	#[DataProvider( 'provideUnqualifyClassName' )]
	public function testUnqualifyClassName( $name, $nsname, $aliases, $expect ) {
		$this->assertSame( $expect, NamespaceInfo::unqualifyClassName( $name, $nsname, $aliases ) );
		$this->assertSame( $expect, NamespaceInfo::unqualifyClassName( ltrim( $name, '\\' ), $nsname, $aliases ) );
	}

	public static function provideUnqualifyClassName() {
		$aliases = array(
			'C'         => '\A\B\C',
			'Aliased'   => '\A\B\D',
			'Throwable' => '\Throwable',
		);

		yield 'NS, namespace prefixed' => array(
			'\\Xyz\\AClass',
			'Xyz',
			$aliases,
			'AClass',
		);
		yield 'NS, namespace prefixed (2)' => array(
			'\\Xyz\\NS\\AClass',
			'Xyz',
			$aliases,
			'NS\\AClass',
		);
		yield 'NS, known alias' => array(
			'\\A\\B\\C',
			'Xyz',
			$aliases,
			'C',
		);
		yield 'NS, known alias (2)' => array(
			'\\A\\B\\D',
			'Xyz',
			$aliases,
			'Aliased',
		);
		yield 'NS, known alias (3)' => array(
			'\\Throwable',
			'Xyz',
			$aliases,
			'Throwable',
		);
		yield 'NS, known alias prefix' => array(
			'\\A\\B\\C\\D\\E',
			'Xyz',
			$aliases,
			'C\\D\\E',
		);
		yield 'NS, known alias prefix (2)' => array(
			'\\A\\B\\D\\X\\Y',
			'Xyz',
			$aliases,
			'Aliased\\X\\Y',
		);
		yield 'NS, not aliased' => array(
			'\\X\\Y\\Z',
			'Xyz',
			$aliases,
			'\\X\\Y\\Z',
		);
		yield 'NS, not confused by non-prefix' => array(
			'\\Xyzz\\AClass',
			'Xyz',
			$aliases,
			'\\Xyzz\\AClass',
		);
		yield 'NS, not broken by alias' => array(
			'\\Xyz\\C',
			'Xyz',
			$aliases,
			'\\Xyz\\C',
		);

		$aliases = array(
			'C'       => '\A\B\C',
			'Aliased' => '\A\B\D',
		);

		yield 'No NS, namespace prefixed' => array(
			'\\AClass',
			'',
			$aliases,
			'AClass',
		);
		yield 'No NS, namespace prefixed (2)' => array(
			'\\NS\\AClass',
			'',
			$aliases,
			'NS\\AClass',
		);
		yield 'No NS, known alias' => array(
			'\\A\\B\\C',
			'',
			$aliases,
			'C',
		);
		yield 'No NS, known alias (2)' => array(
			'\\A\\B\\D',
			'',
			$aliases,
			'Aliased',
		);
		yield 'No NS, known alias prefix' => array(
			'\\A\\B\\C\\D\\E',
			'',
			$aliases,
			'C\\D\\E',
		);
		yield 'No NS, known alias prefix (2)' => array(
			'\\A\\B\\D\\X\\Y',
			'',
			$aliases,
			'Aliased\\X\\Y',
		);

		$aliases = array(
			'X'    => '\X',
			'Foo'  => '\X\Foo',
			'Bar'  => '\X\Foo\Bar',
			'Bar2' => '\X\Foo2\Bar2',
			'Foo2' => '\X\Foo2',
			'Z2'   => '\X\Y\Z\Z2',
			'QQQ'  => '\X\Y\Z\Z2\Q\Q\Q',
		);

		yield 'Class matches NS name' => array(
			'\\X\\Y',
			'X\Y',
			$aliases,
			'X\\Y',
		);
		yield 'Prefer shorter namespace prefix' => array(
			'\\X\\Y\\Z',
			'X\Y',
			$aliases,
			'Z',
		);
		yield 'Prefer shorter sub-namespace import (1)' => array(
			'\\X\\Y\\Z\\Z2',
			'X\Y',
			$aliases,
			'Z2',
		);
		yield 'Prefer shorter sub-namespace import (2)' => array(
			'\\X\\Y\\Z\\Z2\\Q',
			'X\Y',
			$aliases,
			'Z2\\Q',
		);
		yield 'Prefer shorter sub-namespace import (3)' => array(
			'\\X\\Y\\Z\\Z2\\Q\\Q',
			'X\Y',
			$aliases,
			'Z2\\Q\\Q',
		);
		yield 'Prefer shorter sub-namespace import (4)' => array(
			'\\X\\Y\\Z\\Z2\\Q\\Q\\Q',
			'X\Y',
			$aliases,
			'QQQ',
		);
		yield 'Prefer shorter sub-namespace import (5)' => array(
			'\\X\\Y\\Z\\Z2\\Q\\Q\\Q\\Q',
			'X\Y',
			$aliases,
			'QQQ\\Q',
		);
		yield 'Prefer shorter alias' => array(
			'\\X\\Foo\\Bar',
			'X\Y',
			$aliases,
			'Bar',
		);
		yield 'Prefer shorter alias (2)' => array(
			'\\X\\Foo\\Bar\\Q',
			'X\Y',
			$aliases,
			'Bar\\Q',
		);
		yield 'Prefer shorter alias (3)' => array(
			'\\X\\Foo2\\Bar2',
			'X\Y',
			$aliases,
			'Bar2',
		);
		yield 'Prefer shorter alias (4)' => array(
			'\\X\\Foo2\\Bar2\\Q',
			'X\Y',
			$aliases,
			'Bar2\\Q',
		);
	}
}
