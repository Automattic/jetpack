<?php
namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Minify;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;

/**
 * Class Minify_Test
 *
 * @package Automattic\Jetpack_Boost\Tests\Lib
 */
class Minify_Test extends Base_TestCase {
	public function test_js() {
		$expanded_js = 'var one = "one";
var two = "two";
var three = "three";';

		$minified_js = 'var one="one";var two="two";var three="three"';

		$this->assertEquals( $minified_js, Minify::js( $expanded_js ) );
	}

	/**
	 * Valid ES6 that the minifier can shrink without breaking should still be
	 * minified -- the structural guard must not over-broadly skip minification.
	 */
	public function test_js_minifies_valid_es6_with_backticks() {
		// The `${ name }` is kept in a single-quoted PHP string so PHP does not
		// try to interpolate it.
		$source   = "function greet( name ) {\n\treturn " . '`hello ${ name }`' . ";\n}";
		$minified = Minify::js( $source );

		$this->assertStringNotContainsString( "\n", $minified, 'Valid ES6 should still be minified.' );
		// The template literal contents are preserved verbatim by the minifier.
		$this->assertStringContainsString( '`hello ${ name }`', $minified );
	}

	/**
	 * The bundled minifier silently truncates a `//` inside a nested template
	 * literal (the real HOG-534 / HOG-535 corruption). When that happens, js()
	 * must fall back to the original, un-re-minified bytes rather than serve a
	 * truncated bundle. (assertSame proves the fallback fired: a non-broken
	 * result would be the shorter minified output, not the original.)
	 */
	public function test_js_falls_back_when_minification_truncates() {
		$source  = "function f(e,t,n){const r=new Error(`each_key_duplicate\n";
		$source .= '${n?`Keyed each block has duplicate key \`${n}\` at indexes ${e} and ${t}`:';
		$source .= '`Keyed each block has duplicate key at indexes ${e} and ${t}`}' . "\n";
		$source .= 'https://svelte.dev/e/each_key_duplicate`);return r;}(1,2,3);';

		$this->assertSame( $source, Minify::js( $source ) );
	}

	/**
	 * When the minifier reduces non-empty input to nothing (e.g. a comment-only
	 * file), js() keeps the original rather than serving an empty bundle.
	 */
	public function test_js_falls_back_when_minification_is_empty() {
		$source = '/* only a comment */';
		$this->assertSame( $source, Minify::js( $source ) );
	}

	/**
	 * If the underlying minifier throws (e.g. a PCRE backtrack limit), js()
	 * returns the original input.
	 */
	public function test_js_returns_original_when_minifier_throws() {
		$old_limit = ini_get( 'pcre.backtrack_limit' );
		$old_jit   = ini_get( 'pcre.jit' );
		ini_set( 'pcre.backtrack_limit', '1' );
		ini_set( 'pcre.jit', '0' );
		try {
			$source = 'var x="' . str_repeat( 'a', 5000 ) . '";';
			$this->assertSame( $source, Minify::js( $source ) );
		} finally {
			ini_set( 'pcre.backtrack_limit', $old_limit );
			ini_set( 'pcre.jit', $old_jit );
		}
	}

	public function test_js_handles_empty_input() {
		$this->assertSame( '', Minify::js( '' ) );
	}

	public function test_css_minifies() {
		$source = '.example { color: red; }';
		$min    = Minify::css( $source );
		$this->assertStringContainsString( 'color:red', $min );
		// assertLessThan( $expected, $actual ) -> asserts $actual < $expected,
		// i.e. the minified CSS is shorter than the source.
		$this->assertLessThan( strlen( $source ), strlen( $min ), 'Minified CSS should be shorter than the source.' );
	}

	/**
	 * If the CSS minifier throws, css() returns the original input.
	 */
	public function test_css_returns_original_when_minifier_throws() {
		$old_limit = ini_get( 'pcre.backtrack_limit' );
		$old_jit   = ini_get( 'pcre.jit' );
		ini_set( 'pcre.backtrack_limit', '1' );
		ini_set( 'pcre.jit', '0' );
		try {
			$source = '.a{content:"' . str_repeat( 'a', 5000 ) . '"}';
			$this->assertSame( $source, Minify::css( $source ) );
		} finally {
			ini_set( 'pcre.backtrack_limit', $old_limit );
			ini_set( 'pcre.jit', $old_jit );
		}
	}
}
