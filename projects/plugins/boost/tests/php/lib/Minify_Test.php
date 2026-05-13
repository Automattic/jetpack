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

	public function test_js_skips_minification_when_template_literals_present() {
		$js_with_template_literal = 'var greeting = `Hello, ${name}!`;
var multiline = `line one
line two`;';

		// Must return the original JS unchanged to avoid MatthiasMullie truncation.
		$this->assertSame( $js_with_template_literal, Minify::js( $js_with_template_literal ) );
	}

	public function test_js_minifies_when_no_template_literals() {
		$js = 'var x = 1 ;   var y = 2 ;';
		$this->assertNotSame( $js, Minify::js( $js ) );
	}
}
