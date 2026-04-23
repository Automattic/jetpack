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

	public function test_js_skips_minification_for_template_literals() {
		$es6_js = 'const greet = ( name ) => {
	return `Hello, ${ name }!`;
};';

		// MatthiasMullie corrupts ES6 template literals; the original must be returned unchanged.
		$this->assertEquals( $es6_js, Minify::js( $es6_js ) );
	}
}
