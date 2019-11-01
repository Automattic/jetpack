<?php

require_once JETPACK__PLUGIN_DIR . '3rd-party/class.jetpack-amp-shortcodes.php';

/**
 * Tests for class Jetpack_AMP_Shortcodes.
 */
class WP_Test_Jetpack_AMP_Shortcodes extends WP_UnitTestCase {

	/**
	 * Tear down each test.
	 *
	 * @inheritDoc
	 */
	public function tearDown() {
		remove_all_filters( 'jetpack_is_amp_request' );
		unset( $GLOBALS['content_width'] );
	}

	/**
	 * Gets the test data for the Vimeo shortcodes.
	 *
	 * @return array An associative array of test data.
	 */
	public function get_vimeo_shortcode_data() {
		return array(
			'not_a_vimeo_shortcode'      => array(
				'<amp-youtube></amp-youtube>',
				'youtube',
				array(
					'id' => '62245'
				),
				null,
			),
			'empty_attr_array'           => array(
				'<div>Initial shortcode</div>',
				'vimeo',
				array(),
				'',
			),
			'no_width_or_height_in_attr' => array(
				'<div>Initial shortcode</div>',
				'vimeo',
				array(
					'id' => '24246'
				),
				'<amp-vimeo data-videoid="24246" layout="responsive" width="600" height="338"></amp-vimeo>'
			),
			'only_url_not_id_in_attr'    => array(
				'<div>Initial shortcode</div>',
				'vimeo',
				array(
					'url'    => 'https://vimeo.com/45879568',
					'width'  => '800',
					'height' => '600',
				),
				'<amp-vimeo data-videoid="45879568" layout="responsive" width="800" height="600"></amp-vimeo>'
			),
			'normal_attributes_present'  => array(
				'<div>Initial shortcode</div>',
				'vimeo',
				array(
					'id'     => '623422',
					'width'  => '900',
					'height' => '1200',
				),
				'<amp-vimeo data-videoid="623422" layout="responsive" width="900" height="1200"></amp-vimeo>'
			),
		);
	}

	/**
	 * Tests init.
	 *
	 * @covers Jetpack_AMP_Shortcodes::init()
	 */
	public function test_init() {
		Jetpack_AMP_Shortcodes::init();
		$this->assertEquals( 10, has_filter( 'do_shortcode_tag', array( 'Jetpack_AMP_Support', 'filter_vimeo_shortcode' ) ) );
	}

	/**
	 * Tests that the Vimeo shortcode filter produces the right HTML.
	 *
	 * @dataProvider get_vimeo_shortcode_data
	 * @covers Jetpack_AMP_Shortcodes::filter_vimeo_shortcode()
	 * @covers Jetpack_AMP_Shortcodes::render_vimeo()
	 *
	 * @param string $html The html passed to the filter.
	 * @param string $shortcode_tag The tag (name) of the shortcode, like 'vimeo'.
	 * @param array  $attr The shortcode attributes.
	 * @param string $expected The expected return value.
	 */
	public function test_filter_vimeo_shortcode( $html, $shortcode_tag, $attr, $expected ) {
		unset( $GLOBALS['content_width'] );
		add_filter( 'jetpack_is_amp_request', '__return_true' );

		if ( null === $expected ) {
			$expected = $html;
		}

		$this->assertEquals( $expected, Jetpack_AMP_Shortcodes::filter_vimeo_shortcode( $html, $shortcode_tag, $attr ) );
	}

	/**
	 * Tests the Vimeo shortcode filter when there is a global $content_width value.
	 *
	 * @covers Jetpack_AMP_Shortcodes::filter_vimeo_shortcode()
	 */
	public function test_filter_vimeo_shortcode_global_content_width() {
		add_filter( 'jetpack_is_amp_request', '__return_true' );

		$video_id                 = '624432';
		$content_width            = 650;
		$expected_height          = 366;
		$GLOBALS['content_width'] = $content_width;

		$this->assertEquals(
			'<amp-vimeo data-videoid="' . $video_id .'" layout="responsive" width="' . $content_width . '" height="' . $expected_height .'"></amp-vimeo>',
			Jetpack_AMP_Shortcodes::filter_vimeo_shortcode(
				'<div><span>Initial shortcode</span></div>',
				'vimeo',
				array(
					'id'     => $video_id,
					'width'  => '1000',
					'height' => '600',
				)
			)
		);
	}

	/**
	 * Tests that the Vimeo shortcode filter does not filter the markup on non-AMP endpoints.
	 *
	 * @covers Jetpack_AMP_Shortcodes::filter_vimeo_shortcode()
	 */
	public function test_filter_vimeo_shortcode_non_amp() {
		$initial_shortcode_markup = '<div><span>Shortcode here</span></div>';

		$this->assertEquals(
			$initial_shortcode_markup,
			Jetpack_AMP_Shortcodes::filter_vimeo_shortcode(
				$initial_shortcode_markup,
				'vimeo',
				array(
					'id'     => '624432',
					'width'  => '800',
					'height' => '400',
				)
			)
		);
	}

	/**
	 * Gets the test data for test_get_vimeo_id_from_attr().
	 *
	 * @return array The test data.
	 */
	public function get_vimeo_id_from_attr_data() {
		return array(
			'id_is_present_in_attr' => array(
				array( 'id' => '52324' ),
				'52324'
			),
			'attr_has_a_url' => array(
				array( 'url' => 'https://vimeo.com/52324' ),
				'52324'
			),
			'attr_has_a_valid_url_at_0_index' => array(
				array( 0 => 'https://vimeo.com/52324' ),
				'52324'
			),
			'attr_has_an_invalid_url_at_0_index' => array(
				array( 0 => 'https://example.com/52324' ),
				''
			),
		);
	}

	/**
	 * Tests get_vimeo_id_from_attr.
	 *
	 * @dataProvider get_vimeo_id_from_attr_data
	 * @covers Jetpack_AMP_Shortcodes::get_vimeo_id_from_attr()
	 *
	 * @param array $attr The attributes to pass to the method.
	 * @param string $expected The expected return value.
	 */
	public function test_get_vimeo_id_from_attr( $attr, $expected ) {
		$this->assertEquals( $expected, Jetpack_AMP_Shortcodes::get_vimeo_id_from_attr( $attr ) );
	}

	/**
	 * Gets the test data for test_get_vimeo_id_from_url().
	 *
	 * @return array An associative array of test data.
	 */
	public function get_video_id_data() {
		return array(
			'wrong_url_non_vimeo'                      => array(
				'https://example.com/242425',
				'',
			),
			'wrong_url_no_number'                      => array(
				'https://vimeo.com/notanumber',
				'',
			),
			'wrong_url_starts_with_non_numeric_values' => array(
				'https://vimeo.com/starts-with-this242425',
				'',
			),
			'correct_vimeo_url_with_www'               => array(
				'https://www.vimeo.com/242425',
				242425,
			),
			'correct_vimeo_url_without_www'            => array(
				'https://vimeo.com/242425',
				242425,
			),
		);
	}

	/**
	 * Tests get_vimeo_id_from_url.
	 *
	 * @dataProvider get_video_id_data
	 * @covers Jetpack_AMP_Shortcodes::get_vimeo_id_from_url()
	 *
	 * @param string $url The URL to pass to the function.
	 * @param string $expected The expected return value.
	 */
	public function test_get_vimeo_id_from_url( $url, $expected ) {
		$this->assertEquals( $expected, Jetpack_AMP_Shortcodes::get_vimeo_id_from_url( $url ) );
	}

	/**
	 * Gets the test data for test_build_attributes_string().
	 *
	 * @return array The test data.
	 */
	public function get_build_attributes_string_data() {
		return array(
			'no_attribute'                           => array(
				array(),
				'',
			),
			'attribute_with_no_value'                => array(
				array( 'lightbox' => '' ),
				'lightbox',
			),
			'attribute_with_a_value'                 => array(
				array( 'lightbox' => 'true' ),
				'lightbox="true"',
			),
			'attribute_with_a_value_and_one_without' => array(
				array(
					'lightbox' => '',
					'class'    => 'example',
				),
				'lightbox class="example"',
			),
			'several_attributes'                     => array(
				array(
					'lightbox'   => 'true',
					'class'      => 'example',
					'object-fit' => 'cover',
					'style'      => 'display:block'
				),
				'lightbox="true" class="example" object-fit="cover" style="display:block"',
			),
		);
	}

	/**
	 * Test build_attributes_string.
	 *
	 * @dataProvider get_build_attributes_string_data
	 * @covers Jetpack_AMP_Shortcodes::build_attributes_string()
	 *
	 * @param array $attributes An associative array of $attribute => $value.
	 */
	public function test_build_attributes_string( $attributes, $expected ) {
		$this->assertEquals( $expected, Jetpack_AMP_Shortcodes::build_attributes_string( $attributes ) );
	}

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
	 * @covers Jetpack_AMP_Shortcodes::build_tag()
	 *
	 * @param string $tag_name The tag name.
	 * @param array  $attributes An associative array of $attribute => $value pairs.
	 * @param string $content The inner content for the tag.
	 * @param string $expected The expected return value of the function.
	 */
	public function test_build_tag( $tag_name, $attributes, $content, $expected ) {
		$this->assertEquals( $expected, Jetpack_AMP_Shortcodes::build_tag( $tag_name, $attributes, $content ) );
	}
}
