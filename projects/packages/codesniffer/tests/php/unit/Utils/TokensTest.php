<?php

namespace Automattic\Jetpack\Codesniffer\Tests\Utils;

use Automattic\Jetpack\Codesniffer\Utils\Tokens;
use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHP_CodeSniffer\Util\Tokens as PHPCS_Tokens;
use PHPCSUtils\Tokens\Collections;
use PHPUnit\Framework\Attributes\DataProvider;
use Throwable;

class TokensTest extends TestCase {

	/**
	 * @dataProvider provideTokensPreceedingDeclaration
	 * @param string                   $content File content to test with.
	 * @param string|int               $startType Token to lookup for `$start`.
	 * @param (string|int)[]|Throwable $expect Expected return value.
	 */
	#[DataProvider( 'provideTokensPreceedingDeclaration' )]
	public function testTokensPreceedingDeclaration( $content, $startType, $expect ) {
		$phpcsFile = $this->createPhpcsFile( $content );
		$start     = $phpcsFile->findNext( $startType, 0 );
		$this->assertIsInt( $start );

		if ( $expect instanceof Throwable ) {
			$this->expectException( get_class( $expect ) );
			$this->expectExceptionMessage( $expect->getMessage() );
		}

		$actual = Tokens::tokensPreceedingDeclaration( $phpcsFile, $start );

		if ( ! $expect instanceof Throwable ) {
			ksort( $expect );
			ksort( $actual );
			$this->assertSame( $expect, $actual );
		}
	}

	public static function provideTokensPreceedingDeclaration() {
		yield 'Class' => array(
			<<<'EOF'
				<?php
				class Foo {}
				EOF,
			T_CLASS,
			Collections::classModifierKeywords() + PHPCS_Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
		);

		yield 'Interface' => array(
			<<<'EOF'
				<?php
				interface Foo {}
				EOF,
			T_INTERFACE,
			PHPCS_Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
		);

		yield 'Trait' => array(
			<<<'EOF'
				<?php
				trait Foo {}
				EOF,
			T_TRAIT,
			PHPCS_Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
		);

		yield 'Function' => array(
			<<<'EOF'
				<?php
				function foo() {}
				EOF,
			T_FUNCTION,
			PHPCS_Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
		);

		yield 'Method' => array(
			<<<'EOF'
				<?php
				class Foo {
					function bar() {}
				}
				EOF,
			T_FUNCTION,
			PHPCS_Tokens::$methodPrefixes + PHPCS_Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
		);

		yield 'Property' => array(
			<<<'EOF'
				<?php
				class Foo {
					public $bar;
				}
				EOF,
			T_VARIABLE,
			Collections::propertyModifierKeywords() + Collections::propertyTypeTokens() + PHPCS_Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
		);

		yield 'Class constant' => array(
			<<<'EOF'
				<?php
				class Foo {
					const BAR = 42;
				}
				EOF,
			T_CONST,
			Collections::constantModifierKeywords() + PHPCS_Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
		);

		yield 'Global constant' => array(
			<<<'EOF'
				<?php
				const BAR = 42;
				EOF,
			T_CONST,
			PHPCS_Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END ),
		);

		yield 'Arbitrary variable' => array(
			<<<'EOF'
				<?php
				$bar = 42;
				EOF,
			T_VARIABLE,
			new RuntimeException( 'T_VARIABLE token is not a class/trait property declaration.' ),
		);

		yield 'Some other token' => array(
			<<<'EOF'
				<?php
				$bar = 42;
				EOF,
			T_OPEN_TAG,
			new RuntimeException( 'Token type "T_OPEN_TAG" is not supported.' ),
		);
	}
}
