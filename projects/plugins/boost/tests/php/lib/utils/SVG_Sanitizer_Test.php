<?php
/**
 * SVG Sanitizer Test
 *
 * @package automattic\jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Utils;

use Automattic\Jetpack_Boost\Lib\Utils\SVG_Sanitizer;
use WorDBless\BaseTestCase;

/**
 * Test SVG_Sanitizer class
 *
 * @package automattic\jetpack-boost
 * @covers \Automattic\Jetpack_Boost\Lib\Utils\SVG_Sanitizer
 */
class SVG_Sanitizer_Test extends BaseTestCase {
	/**
	 * Test basic SVG with allowed elements
	 */
	public function test_basic_svg_with_allowed_elements() {
		$sanitizer = new SVG_Sanitizer();
		$input     = '<svg><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>';
		$expected  = '<svg><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>';
		$this->assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );
	}

	/**
	 * Test SVG with disallowed script elements
	 */
	public function test_svg_with_disallowed_script() {
		$sanitizer = new SVG_Sanitizer();
		$input     = '<svg><circle cx="50" cy="50" r="40" /><script>alert("xss")</script></svg>';
		$expected  = '<svg><circle cx="50" cy="50" r="40" /></svg>';
		$this->assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );
	}

	/**
	 * Test SVG with disallowed HTML elements
	 */
	public function test_svg_with_disallowed_html() {
		$sanitizer = new SVG_Sanitizer();
		$input     = '<svg><circle cx="50" cy="50" r="40" /><a href="javascript:alert(1)">Click me</a></svg>';
		$expected  = '<svg><circle cx="50" cy="50" r="40" /></svg>';
		$this->assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );
	}

	/**
	 * Test SVG with disallowed attributes
	 */
	public function test_svg_with_disallowed_attributes() {
		$sanitizer = new SVG_Sanitizer();
		$input     = '<svg><circle cx="50" cy="50" r="40" onclick="alert(1)" /></svg>';
		$expected  = '<svg><circle cx="50" cy="50" r="40" /></svg>';
		$this->assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );
	}

	/**
	 * Test SVG with nested disallowed elements
	 */
	public function test_svg_with_nested_disallowed_elements() {
		$sanitizer = new SVG_Sanitizer();
		$input     = '<svg><g><script>bad()</script><circle cx="50" cy="50" r="40" /><style>bad{}</style></g></svg>';
		$expected  = '<svg><g><circle cx="50" cy="50" r="40" /></g></svg>';
		$this->assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );
	}

	/**
	 * Test malformed SVG
	 */
	public function test_malformed_svg() {
		$sanitizer = new SVG_Sanitizer();
		$input     = '<svg><circle cx="50" cy="50" r="40"<script>alert(1)</script>/></svg>';
		$expected  = '<svg><circle cx="50" cy="50" r="40" /></svg>';
		$this->assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );
	}

	/**
	 * Test empty input
	 */
	public function test_empty_input() {
		$sanitizer = new SVG_Sanitizer();
		$input     = '';
		$expected  = '';
		$this->assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );
	}

	/**
	 * Test non-SVG input
	 */
	public function test_non_svg_input() {
		$sanitizer = new SVG_Sanitizer();
		$input     = '<p>Hello <script>alert(1)</script>World</p>';
		$expected  = '';
		$this->assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );
	}

	/**
	 * Test that custom allowed HTML rules work properly
	 */
	public function test_custom_allowed_html() {
		$sanitizer = new SVG_Sanitizer();

		// Define custom allowed HTML that only allows circle elements
		$allowed_html = array(
			'svg'    => array(),
			'circle' => array(
				'cx' => true,
				'cy' => true,
				'r'  => true,
			),
		);

		$input    = '<svg><circle cx="50" cy="50" r="40" /><rect width="100" height="100" /></svg>';
		$expected = '<svg><circle cx="50" cy="50" r="40" /></svg>';
		$this->assertSame(
			$expected,
			$sanitizer->remove_disallowed_tags_and_content( $input, $allowed_html )
		);
	}
}
