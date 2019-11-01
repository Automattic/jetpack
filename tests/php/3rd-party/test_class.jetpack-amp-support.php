<?php

require_once JETPACK__PLUGIN_DIR . '3rd-party/class.jetpack-amp-support.php';

/**
 * Tests for class Jetpack_AMP_Support.
 */
class WP_Test_Jetpack_AMP_Support extends WP_UnitTestCase {

	/**
	 * Gets the test data for test_build_attributes_string().
	 *
	 * @return array The test data.
	 */
	public function get_build_tag_data() {
		return array(
			'tag_no_attributes_or_content'      => array(
				'div',
				array(),
				'',
				'<div ></div>',
			),
			'tag_single_attribute_no_content'   => array(
				'div',
				array( 'object-fit' => 'cover' ),
				'',
				'<div object-fit="cover"></div>',
			),
			'tag_single_attribute_with_content' => array(
				'div',
				array( 'object-fit' => 'cover' ),
				'<span>Here is some text</span>',
				'<div object-fit="cover"><span>Here is some text</span></div>',
			),
			'tag_two_attributes_with_content'   => array(
				'div',
				array(
					'object-fit' => 'cover',
					'lightbox'   => '',
				),
				'<figure></figure>',
				'<div object-fit="cover" lightbox><figure></figure></div>',
			),
		);
	}

	/**
	 * Test build_attributes_string.
	 *
	 * @dataProvider get_build_tag_data
	 * @covers Jetpack_AMP_Support::build_tag()
	 *
	 * @param string $tag_name The tag name.
	 * @param array  $attributes An associative array of $attribute => $value pairs.
	 * @param string $content The inner content for the tag.
	 * @param string $expected The expected return value of the function.
	 */
	public function test_build_tag( $tag_name, $attributes, $content, $expected ) {
		$this->assertEquals( $expected, Jetpack_AMP_Support::build_tag( $tag_name, $attributes, $content ) );
	}
}
