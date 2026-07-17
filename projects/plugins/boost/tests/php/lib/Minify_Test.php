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
	 * returns the original input and reports the 'exception' reason via the hook.
	 * This is the most-likely production fallback, so its hook contract is locked
	 * in alongside the return value.
	 */
	public function test_js_returns_original_when_minifier_throws() {
		$old_limit = ini_get( 'pcre.backtrack_limit' );
		$old_jit   = ini_get( 'pcre.jit' );
		ini_set( 'pcre.backtrack_limit', '1' );
		ini_set( 'pcre.jit', '0' );
		try {
			$source = 'var x="' . str_repeat( 'a', 5000 ) . '";';

			Actions\expectDone( 'jetpack_boost_js_minify_fallback' )
				->once()
				->with( Minify::FALLBACK_EXCEPTION, strlen( $source ), Mockery::type( \Exception::class ) );

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
	 * \Error subclasses (specifically \TypeError here, standing in for the
	 * \OutOfMemoryError / \ParseError class the catch arm exists to surface) are
	 * not swallowed indistinguishably: js() reports the dedicated 'error' reason
	 * via the hook and still falls back to the original rather than white-screening.
	 */
	public function test_js_reports_error_subclasses_and_falls_back() {
		// The stdClass-to-string cast only raises a catchable \Error on PHP 7.4+;
		// on 7.2/7.3 it is a recoverable error PHPUnit surfaces as an \Exception, so
		// the catch(\Error) arm is genuinely unreachable there. Skip rather than
		// assert a path the older runtimes cannot take.
		if ( PHP_VERSION_ID < 70400 ) {
			$this->markTestSkipped( 'Requires PHP 7.4+: the \Error catch arm is unreachable on older versions.' );
		}

		// A non-stringable object makes the minifier constructor raise an \Error
		// ("Object of class stdClass could not be converted to string"). The point
		// is the catch(\Error) arm and its distinct hook reason, not this specific
		// trigger.
		$source = new \stdClass();

		Actions\expectDone( 'jetpack_boost_js_minify_fallback' )
			->once()
			->with( 'error', 0, Mockery::type( \Error::class ) );

		// fallback_js() only logs under WP_DEBUG, so no error_log redirection is
		// needed; the hook (asserted above) is the observability contract.
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Non-string is intentional: it triggers js()'s \Error catch arm.
		$this->assertSame( $source, Minify::js( $source ) );
	}

	/**
	 * The structural-validator ('looks_broken') fallback -- the most common
	 * production path -- fires the observability hook with the matching reason.
	 * Resilient to a future upstream minifier fix: if the bundled minifier stops
	 * corrupting this input, no fallback (and so no hook) is expected at all.
	 */
	public function test_js_looks_broken_fallback_fires_hook() {
		$source  = "function f(e,t,n){const r=new Error(`each_key_duplicate\n";
		$source .= '${n?`Keyed each block has duplicate key \`${n}\` at indexes ${e} and ${t}`:';
		$source .= '`Keyed each block has duplicate key at indexes ${e} and ${t}`}' . "\n";
		$source .= 'https://svelte.dev/e/each_key_duplicate`);return r;}(1,2,3);';

		$raw_minified = ( new JSMinifier( $source ) )->minify();
		if ( Js_Structure_Scanner::looks_broken( $raw_minified ) ) {
			Actions\expectDone( 'jetpack_boost_js_minify_fallback' )
				->once()
				->with( 'looks_broken', strlen( $source ), null );
		} else {
			Actions\expectDone( 'jetpack_boost_js_minify_fallback' )->never();
		}

		// Whichever path the bundled minifier takes, js() must never return broken JS.
		$this->assertFalse( Js_Structure_Scanner::looks_broken( Minify::js( $source ) ) );
	}

	/**
	 * A hook callback that throws must not break minification: js() swallows the
	 * hook error and still returns the original bundle.
	 */
	public function test_js_fallback_survives_throwing_hook() {
		$source = '/* only a comment */'; // Minifies to empty -> triggers a fallback.

		Actions\expectDone( 'jetpack_boost_js_minify_fallback' )
			->once()
			->andThrow( new \RuntimeException( 'misbehaving listener' ) );

		// Must not propagate the hook exception; returns the original input.
		$this->assertSame( $source, Minify::js( $source ) );
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
