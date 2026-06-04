<?php
namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Js_Structure_Scanner;
use Automattic\Jetpack_Boost\Lib\Minify;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Actions;
use MatthiasMullie\Minify\JS as JSMinifier;
use Mockery;

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
	 * A `//` inside a nested template literal is the input the bundled minifier
	 * silently truncates (the real corruption this guards against).
	 *
	 * The guarantee we assert is the one we actually own: js() must never return
	 * structurally broken JS for this input -- whether the minifier corrupts it
	 * (and we fall back to the original) or some future minifier version handles
	 * it cleanly. The guarded check additionally proves the fallback fires today,
	 * without breaking if upstream ever fixes the bug.
	 */
	public function test_js_never_returns_broken_output_for_nested_template() {
		$source  = "function f(e,t,n){const r=new Error(`each_key_duplicate\n";
		$source .= '${n?`Keyed each block has duplicate key \`${n}\` at indexes ${e} and ${t}`:';
		$source .= '`Keyed each block has duplicate key at indexes ${e} and ${t}`}' . "\n";
		$source .= 'https://svelte.dev/e/each_key_duplicate`);return r;}(1,2,3);';

		$result = Minify::js( $source );
		$this->assertFalse(
			Js_Structure_Scanner::looks_broken( $result ),
			'Minify::js() must never return structurally broken JS.'
		);

		// While the bundled minifier still corrupts this input, the guard must
		// fall back to the original (un-re-minified) bytes.
		$raw_minified = ( new JSMinifier( $source ) )->minify();
		if ( Js_Structure_Scanner::looks_broken( $raw_minified ) ) {
			$this->assertSame( $source, $result );
		}
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

	/**
	 * The fallback observability hook fires with the reason and the original byte
	 * length whenever js() declines its minified output.
	 */
	public function test_js_fallback_fires_observability_hook() {
		// A comment-only file minifies to empty, so js() falls back.
		$source = '/* only a comment */';

		Actions\expectDone( 'jetpack_boost_js_minify_fallback' )
			->once()
			->with( 'empty_output', strlen( $source ), null );

		$this->assertSame( $source, Minify::js( $source ) );
	}

	/**
	 * \Error subclasses (e.g. \TypeError, \OutOfMemoryError) are not swallowed
	 * silently: js() reports the 'error' reason via the hook, logs it, and still
	 * falls back to the original input rather than letting the page white-screen.
	 */
	public function test_js_reports_error_subclasses_and_falls_back() {
		// A non-stringable object makes the minifier constructor raise an \Error
		// ("Object of class stdClass could not be converted to string") -- a
		// deterministic stand-in for the \OutOfMemoryError / \TypeError / \ParseError
		// class this arm exists to surface.
		$source = new \stdClass();

		Actions\expectDone( 'jetpack_boost_js_minify_fallback' )
			->once()
			->with( 'error', 0, Mockery::type( \Error::class ) );

		// The 'error' arm always logs; redirect error_log to a temp file so the
		// test asserts on it instead of polluting the test output.
		$log     = tempnam( sys_get_temp_dir(), 'jb-minify-log-' );
		$old_log = ini_get( 'error_log' );
		ini_set( 'error_log', $log );
		try {
			$result = Minify::js( $source );
		} finally {
			ini_set( 'error_log', $old_log );
		}

		$this->assertSame( $source, $result );
		$this->assertStringContainsString( 'reason=error', (string) file_get_contents( $log ) );
		if ( file_exists( $log ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			unlink( $log );
		}
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
