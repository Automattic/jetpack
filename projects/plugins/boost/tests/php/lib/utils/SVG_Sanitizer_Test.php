<?php
/**
 * SVG Sanitizer Test
 *
 * @package automattic\jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Utils;

use Automattic\Jetpack_Boost\Lib\Utils\SVG_Sanitizer;
use PHPUnit\Framework\Assert;
use WorDBless\BaseTestCase;

/**
 * Test SVG_Sanitizer class
 *
 * @package automattic\jetpack-boost
 * @covers \Automattic\Jetpack_Boost\Lib\Utils\SVG_Sanitizer
 */
class SVG_Sanitizer_Test extends BaseTestCase {
	/**
	 * Test that remove_disallowed_tags_and_content properly removes disallowed tags and their content
	 */
	public function test_remove_disallowed_tags_and_content() {
		$sanitizer = new SVG_Sanitizer();

		// Test basic SVG with allowed elements
		$input    = '<svg><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>';
		$expected = '<svg><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>';
		Assert::assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );

		// Test SVG with disallowed elements (script)
		$input    = '<svg><circle cx="50" cy="50" r="40" /><script>alert("xss")</script></svg>';
		$expected = '<svg><circle cx="50" cy="50" r="40" /></svg>';
		Assert::assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );

		// Test SVG with disallowed HTML elements
		$input    = '<svg><circle cx="50" cy="50" r="40" /><a href="javascript:alert(1)">Click me</a></svg>';
		$expected = '<svg><circle cx="50" cy="50" r="40" /></svg>';
		Assert::assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );

		// Test SVG with disallowed attributes
		$input    = '<svg><circle cx="50" cy="50" r="40" onclick="alert(1)" /></svg>';
		$expected = '<svg><circle cx="50" cy="50" r="40" /></svg>';
		Assert::assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );

		// Test SVG with nested disallowed elements
		$input    = '<svg><g><script>bad()</script><circle cx="50" cy="50" r="40" /><style>bad{}</style></g></svg>';
		$expected = '<svg><g><circle cx="50" cy="50" r="40" /></g></svg>';
		Assert::assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );

		// Test malformed SVG
		$input    = '<svg><circle cx="50" cy="50" r="40"<script>alert(1)</script>/></svg>';
		$expected = '<svg><circle cx="50" cy="50" r="40" /></svg>';
		Assert::assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );

		// Test empty input
		$input    = '';
		$expected = '';
		Assert::assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );

		// Test non-SVG input
		$input    = '<p>Hello <script>alert(1)</script>World</p>';
		$expected = '';
		Assert::assertSame( $expected, $sanitizer->remove_disallowed_tags_and_content( $input ) );
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

		// Test with custom allowed HTML
		$input    = '<svg><circle cx="50" cy="50" r="40" /><rect width="100" height="100" /></svg>';
		$expected = '<svg><circle cx="50" cy="50" r="40" /></svg>';
		Assert::assertSame(
			$expected,
			$sanitizer->remove_disallowed_tags_and_content( $input, $allowed_html )
		);
	}
}
