<?php //phpcs:ignoreFile
namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Minify;
use Automattic\Jetpack_Boost\Tests\Base_Test_Case;

/**
 * Class WP_Test_Minify
 *
 * @package Automattic\Jetpack_Boost\Tests\Lib
 */
class WP_Test_Minify extends Base_Test_Case {
	public function test_js() {
		$expanded_js = 'var one = "one";
var two = "two";
var three = "three";';

		$minified_js = 'var one="one";var two="two";var three="three"';

		$this->assertEquals( $minified_js, Minify::js( $expanded_js ) );
	}
}
