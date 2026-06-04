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
			'extra closing bracket'   => 'a)}',
			'bool member !0.x'        => 'var z=!0.toString()',
			'bool member !1.x'        => 'x=!1.valueOf()',
			'bool member e (no exp)'  => 'var z=!0.entries()',
			'unterminated block cmt'  => 'var a=1;/* still open',
			'truncated mid call'      => 'foo(bar,baz',
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
			'negated exponent'        => 'var z=!0.e5',
			'negated exponent signed' => 'var z=!1.e+5',
			'negated exponent upper'  => 'var z=!0.E3',
			'arrow returns object'    => 'const f=()=>({a:1})',
			'block comment braces'    => 'var a=1;/* { ( [ */var b=2',
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
		$accepted = array(
			'object-literal division' => '({}/2)',
			'object division in stmt' => 'var x={}/2;',
		);

		foreach ( $accepted as $label => $js ) {
			$this->assertTrue(
				Js_Structure_Scanner::looks_broken( $js ),
				"Accepted false positive changed behavior: $label"
			);
		}
	}

	/**
	 * Output larger than the scan budget is assumed intact (not scanned).
	 */
	public function test_skips_oversized_input() {
		$big = str_repeat( 'a();', 600000 ); // ~2.4 MB, above the scan cap.
		$this->assertFalse( Js_Structure_Scanner::looks_broken( $big ) );
	}

	public function test_handles_empty_input() {
		$this->assertFalse( Js_Structure_Scanner::looks_broken( '' ) );
	}
}
