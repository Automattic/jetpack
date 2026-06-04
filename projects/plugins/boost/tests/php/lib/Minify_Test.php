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
		$this->assertFalse( Minify::is_js_structurally_broken( $minified ) );
	}

	/**
	 * The bundled minifier silently truncates a `//` inside a nested template
	 * literal (the real HOG-534 / HOG-535 corruption). When that happens, js()
	 * must fall back to the original, un-re-minified bytes rather than serve a
	 * truncated bundle.
	 */
	public function test_js_falls_back_when_minification_truncates() {
		$source  = "function f(e,t,n){const r=new Error(`each_key_duplicate\n";
		$source .= '${n?`Keyed each block has duplicate key \`${n}\` at indexes ${e} and ${t}`:';
		$source .= '`Keyed each block has duplicate key at indexes ${e} and ${t}`}' . "\n";
		$source .= 'https://svelte.dev/e/each_key_duplicate`);return r;}(1,2,3);';

		// Sanity: the bundled minifier really does corrupt this input.
		$this->assertTrue(
			Minify::is_js_structurally_broken( ( new \MatthiasMullie\Minify\JS( $source ) )->minify() ),
			'Expected the bundled minifier to produce broken output for this input.'
		);

		// The public entry point must return the original bytes instead.
		$this->assertSame( $source, Minify::js( $source ) );
	}

	public function test_js_handles_empty_input() {
		$this->assertSame( '', Minify::js( '' ) );
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

	/**
	 * Output larger than the scan budget is assumed intact (not scanned).
	 */
	public function test_is_js_structurally_broken_skips_oversized_input() {
		$big = str_repeat( 'a();', 600000 ); // ~2.4 MB, above the scan cap.
		$this->assertFalse( Minify::is_js_structurally_broken( $big ) );
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

	/**
	 * Structurally broken / truncated output must be flagged.
	 */
	public function test_is_js_structurally_broken_detects_breakage() {
		$broken = array(
			'unbalanced brace'      => 'function f(){if(a){',
			'unterminated template' => 'var a=`abc',
			'unterminated string'   => 'var a="abc',
			'unterminated regex'    => "var a=/abc\nx",
			'extra closing bracket' => 'a)}',
			'bool member !0.x'      => 'var z=!0.toString()',
			'bool member !1.x'      => 'x=!1.valueOf()',
			'truncated mid call'    => 'foo(bar,baz',
		);

		foreach ( $broken as $label => $js ) {
			$this->assertTrue(
				Minify::is_js_structurally_broken( $js ),
				"Expected broken: $label"
			);
		}
	}

	/**
	 * Valid (if tricky) minified JS must never be flagged as broken -- a false
	 * positive needlessly skips minification. These exercise the regex-vs-division
	 * disambiguation, regex character classes, template interpolation, and the
	 * trailing source-map comment.
	 */
	public function test_is_js_structurally_broken_passes_valid_js() {
		$valid = array(
			'regex after return'      => 'function f(){return/x/g}',
			'division chain'          => 'var x=a/b/c',
			'regex in paren'          => 'f(/x/)',
			'slash in char class'     => 'var x=/a[/]b/g',
			'char-class slash test'   => '/[/]/.test(x)',
			'regex after binary plus' => 'var s=x+"|"+/\\d{1,2}/.source',
			'postfix increment div'   => 'var x=i++/2',
			'keyword as property'     => 'var x=a.return/b',
			'template with object'    => 'var x=`a${ {k:1} }b`',
			'template with call'      => 'var x=`${render({id:1})}`',
			'nested template'         => 'var x=`${`${y}`}`',
			'string with brace'       => 'var a="}";',
			'single-quote escape'     => "var x='a\\'b';",
			'double-quote escape'     => 'var y="a\\"b";',
			'line comment newline'    => "var z=1;//c\nvar w=2",
			'division after paren'    => 'var q=a()/b',
			'string with comment'     => 'var d="//not a comment";',
			'source map at eof'       => 'var a=1;//# sourceMappingURL=x.js.map',
			'iife'                    => '(function(){})()',
			'double-dot member'       => 'var z=!0..toString()',
			'negated number'          => 'var z=!0.5',
			'arrow returns object'    => 'const f=()=>({a:1})',
			'block comment braces'    => 'var a=1;/* { ( [ */var b=2',
		);

		foreach ( $valid as $label => $js ) {
			$this->assertFalse(
				Minify::is_js_structurally_broken( $js ),
				"Expected intact: $label"
			);
		}
	}
}
