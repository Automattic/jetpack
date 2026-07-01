<?php
namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Js_Structure_Scanner;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;

/**
 * Class Js_Structure_Scanner_Test
 *
 * @package Automattic\Jetpack_Boost\Tests\Lib
 */
class Js_Structure_Scanner_Test extends Base_TestCase {

	/**
	 * Structurally broken / truncated output must be flagged.
	 */
	public function test_detects_breakage() {
		$broken = array(
			'unbalanced brace'        => 'function f(){if(a){',
			'unterminated template'   => 'var a=`abc',
			'unterminated string'     => 'var a="abc',
			'unterminated regex'      => "var a=/abc\nx",
			'unterminated regex eof'  => 'var a=/abc',
			'regex class raw newline' => "var a=/[ab\nc]/",
			'regex raw cr'            => "var a=/ab\rc/",
			'string raw lf'           => "var s=\"ab\ncd\";",
			'string raw cr'           => "var s=\"ab\rcd\";",
			'extra closing bracket'   => 'a)}',
			'bool member !0.x'        => 'var z=!0.toString()',
			'bool member !1.x'        => 'x=!1.valueOf()',
			'bool member e (no exp)'  => 'var z=!0.entries()',
			'unterminated block cmt'  => 'var a=1;/* still open',
			'truncated mid call'      => 'foo(bar,baz',
			'regex after throw eof'   => 'throw /bad',
			'regex escaped newline'   => "var a=/ab\\\nc/",
			'line comment cr break'   => "var z=1;//c\r{{{",
		);

		foreach ( $broken as $label => $js ) {
			$this->assertTrue(
				Js_Structure_Scanner::looks_broken( $js ),
				"Expected broken: $label"
			);
		}
	}

	/**
	 * Valid (if tricky) minified JS must never be flagged as broken -- a false
	 * positive needlessly skips minification. These exercise the regex-vs-division
	 * disambiguation, regex character classes, template interpolation, string
	 * escapes, and the trailing source-map comment.
	 */
	public function test_passes_valid_js() {
		$valid = array(
			'regex after return'       => 'function f(){return/x/g}',
			'division chain'           => 'var x=a/b/c',
			'regex in paren'           => 'f(/x/)',
			'slash in char class'      => 'var x=/a[/]b/g',
			'char-class slash test'    => '/[/]/.test(x)',
			'regex after binary plus'  => 'var s=x+"|"+/\\d{1,2}/.source',
			'postfix increment div'    => 'var x=i++/2',
			'keyword as property'      => 'var x=a.return/b',
			'template with object'     => 'var x=`a${ {k:1} }b`',
			'template with call'       => 'var x=`${render({id:1})}`',
			'nested template'          => 'var x=`${`${y}`}`',
			'string with brace'        => 'var a="}";',
			'single-quote escape'      => "var x='a\\'b';",
			'double-quote escape'      => 'var y="a\\"b";',
			'string line continuation' => "var s=\"ab\\\ncd\";",
			'string crlf continuation' => "var s=\"ab\\\r\ncd\";",
			'line comment newline'     => "var z=1;//c\nvar w=2",
			'division after paren'     => 'var q=a()/b',
			'string with comment'      => 'var d="//not a comment";',
			'source map at eof'        => 'var a=1;//# sourceMappingURL=x.js.map',
			'iife'                     => '(function(){})()',
			'double-dot member'        => 'var z=!0..toString()',
			'negated number'           => 'var z=!0.5',
			'negated exponent'         => 'var z=!0.e5',
			'negated exponent signed'  => 'var z=!1.e+5',
			'negated exponent upper'   => 'var z=!0.E3',
			'arrow returns object'     => 'const f=()=>({a:1})',
			'block comment braces'     => 'var a=1;/* { ( [ */var b=2',
			'regex after throw'        => 'function f(){throw /a|b/g}',
			'cr in line comment ok'    => "var a=1;//c\rvar b=2",
		);

		foreach ( $valid as $label => $js ) {
			$this->assertFalse(
				Js_Structure_Scanner::looks_broken( $js ),
				"Expected intact: $label"
			);
		}
	}

	/**
	 * Documented, accepted false positives: valid JavaScript the scanner reports
	 * as "broken" because resolving it would need a full parser. A `/` after `}`
	 * is read as a regex rather than division, since telling a block `}` apart
	 * from an object-literal `}` needs statement-vs-expression context. The
	 * verdict is fail-safe (it only skips re-minification, never corrupts output),
	 * so we lock the behavior in here rather than risk a false negative. If the
	 * heuristic ever learns this case, update these expectations.
	 */
	public function test_object_literal_division_is_accepted_false_positive() {
		// The false positive generalizes to any object-literal `}` followed by a
		// division `/` anywhere in the bundle -- not just the parenthesized form.
		// Because a single occurrence skips re-minification for the whole bundle,
		// these are locked in so the full scope is visible to future authors.
		$accepted = array(
			'object-literal division'   => '({}/2)',
			'object division in stmt'   => 'var x={}/2;',
			'object division in call'   => 'f({}/2)',
			'object division in array'  => '[{}/2]',
			'populated object division' => 'var o={a:1}/2;',
		);

		foreach ( $accepted as $label => $js ) {
			$this->assertTrue(
				Js_Structure_Scanner::looks_broken( $js ),
				"Accepted false positive changed behavior: $label"
			);
		}
	}

	/**
	 * Realistic modern bundles (a few MB) are now scanned in full, so the
	 * truncation signature is caught rather than silently bypassed by an
	 * aggressive size cap.
	 */
	public function test_scans_multi_megabyte_bundles() {
		// ~3 MB, comfortably under the 8 MB cap, and genuinely truncated.
		$truncated = str_repeat( 'a();', 200000 ) . '`unterminated template';
		$this->assertTrue( Js_Structure_Scanner::looks_broken( $truncated ) );
	}

	/**
	 * Output larger than the scan budget is not lexed in full. With no original to
	 * compare against, it is assumed intact (the fail-safe default).
	 */
	public function test_oversized_input_without_original_is_assumed_intact() {
		$big = str_repeat( 'a', 9 * 1024 * 1024 ) . '`'; // >8 MB, unterminated template.
		$this->assertFalse( Js_Structure_Scanner::looks_broken( $big ) );
	}

	/**
	 * Above the scan cap, an output far smaller than its original input is treated
	 * as truncated via the cheap size-delta backstop.
	 */
	public function test_oversized_gross_truncation_detected_via_size_delta() {
		$original  = str_repeat( 'x', 20 * 1024 * 1024 ); // 20 MB input.
		$truncated = str_repeat( 'x', 9 * 1024 * 1024 );  // 9 MB output (<50% of input), above cap.
		$this->assertTrue( Js_Structure_Scanner::looks_broken( $truncated, $original ) );
	}

	/**
	 * Above the scan cap, an output within a normal minification ratio of its
	 * original input is trusted -- the size-delta backstop must not fire on
	 * ordinary (even aggressive) minification.
	 */
	public function test_oversized_normal_ratio_is_trusted() {
		$original = str_repeat( 'x', 10 * 1024 * 1024 ); // 10 MB input.
		$output   = str_repeat( 'x', 9 * 1024 * 1024 );  // 9 MB output (>50% of input), above cap.
		$this->assertFalse( Js_Structure_Scanner::looks_broken( $output, $original ) );
	}

	/**
	 * Pathologically deep structural nesting (here, runaway template
	 * interpolations) is itself a corruption signature: the lexer caps its own
	 * nesting depth and reports "broken" rather than letting $stack/$frames grow
	 * until the PHP memory limit fatals. That fatal would be uncatchable and
	 * white-screen the page, so the depth cap is part of the fail-safe contract.
	 */
	public function test_pathological_nesting_is_flagged_before_exhausting_memory() {
		// 60k `${ openers (no closers) push well past MAX_NESTING_DEPTH.
		$deeply_nested = str_repeat( '`${', 60000 );
		$this->assertTrue( Js_Structure_Scanner::looks_broken( $deeply_nested ) );
	}

	public function test_handles_empty_input() {
		$this->assertFalse( Js_Structure_Scanner::looks_broken( '' ) );
	}
}
