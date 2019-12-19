<?php

class WP_Test_Jetpack_Shortcodes_Youtube extends WP_UnitTestCase {

	/**
	 * Mock global $content_width value.
	 *
	 * @var int
	 */
	const CONTENT_WIDTH = 600;

	/**
	 * Tear down after each test.
	 *
	 * @inheritDoc
	 */
	public function tearDown() {
		unset( $GLOBALS['content_width'] );
		parent::tearDown();
	}

	/**
	 * @author scotchfield
	 * @covers ::youtube_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_youtube_exists() {
		$this->assertEquals( shortcode_exists( 'youtube' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::youtube_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_youtube() {
		$content = '[youtube]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::youtube_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_youtube_url() {
		$youtube_id = 'JaNH56Vpg-A';
		$url = 'http://www.youtube.com/watch?v=' . $youtube_id;
		$content = '[youtube=' . $url . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $youtube_id, $shortcode_content );
	}

	/**
	 * @author Toro_Unit
	 * @covers ::youtube_shortcode
	 * @since 3.9
	 */
	public function test_replace_url_with_iframe_in_the_content() {
		global $post;

		$youtube_id = 'JaNH56Vpg-A';
		$url = 'http://www.youtube.com/watch?v=' . $youtube_id;
		$post = $this->factory->post->create_and_get( array( 'post_content' => $url ) );

		wpcom_youtube_embed_crazy_url_init();
		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		wp_reset_postdata();
		$this->assertContains( '<span class="embed-youtube"', $actual );
		$this->assertContains( "<iframe class='youtube-player'", $actual );
		$this->assertContains( "https://www.youtube.com/embed/$youtube_id", $actual );

	}

	/**
	 * Gets the test data for jetpack_shortcode_youtube_args().
	 *
	 * @return array[] The test data.
	 */
	public function get_youtube_args_data() {
		return array(
			'empty_url'                        => array(
				array(),
				false,
			),
			'only_in_query'                    => array(
				array( 'query' => 'foo=baz&bar=example&even=more' ),
				array(
					'foo'  => 'baz',
					'bar'  => 'example',
					'even' => 'more',
				)
			),
			'only_in_fragment'                 => array(
				array( 'fragment' => 'example=shown&additional=here' ),
				false,
			),
			'in_query_and_fragment'            => array(
				array(
					'query'    => 'foo=baz&example=more',
					'fragment' => 'add=another&there=more',
				),
				array(
					'foo'     => 'baz',
					'example' => 'more',
					'add'     => 'another',
					'there'   => 'more',
				)
			),
			'query_and_fragment_have_same_key' => array(
				array(
					'query'    => 'foo=inquery',
					'fragment' => 'foo=infragment',
				),
				array( 'foo' => 'inquery' )
			),
		);
	}

	/**
	 * Test jetpack_shortcode_youtube_args.
	 *
	 * @dataProvider get_youtube_args_data
	 * @covers ::jetpack_shortcode_youtube_args
	 *
	 * @param array      $url The parsed URL in which to look for query args.
	 * @param array|bool $expected The expected return value of the tested function.
	 */
	public function test_jetpack_shortcode_youtube_args( $url, $expected ) {
		$this->assertEquals( $expected, jetpack_shortcode_youtube_args( $url ) );
	}

	/**
	 * Gets the test data for jetpack_amp_youtube_shortcode().
	 *
	 * @return array[] The test data.
	 */
	public function get_amp_youtube_data() {
		$height                   = 360;
		$width                    = 640;
		$GLOBALS['content_width'] = $width;

		return array(
			'no_url'                  => array(
				'',
				'<a href="" class="amp-wp-embed-fallback"></a>',
			),
			'valid_url'               => array(
				'https://www.youtube.com/watch?v=SVRiktFlWxI',
				'<amp-youtube data-videoid="SVRiktFlWxI" layout="responsive" width="' . $width . '" height="' . $height . '"></amp-youtube>',
			),
			'short_youtube_url'       => array(
				'https://youtu.be/gS6_xOABTWo',
				'<amp-youtube data-videoid="gS6_xOABTWo" layout="responsive" width="' . $width . '" height="' . $height . '"></amp-youtube>',
			),
			'url_without_id'          => array(
				'https://youtube.com',
				'<a href="https://youtube.com" class="amp-wp-embed-fallback">https://youtube.com</a>',
			),
			'with_v_query_param'      => array(
				'https://www.youtube.com/watch?v=WVbQ-oro7FQ',
				'<amp-youtube data-videoid="WVbQ-oro7FQ" layout="responsive" width="' . $width . '" height="' . $height . '"></amp-youtube>',
			),
			'only_width_in_url'       => array(
				'youtube="https://www.youtube.com/watch?v=SVRiktFlWxI&w=850"',
				'<amp-youtube data-videoid="SVRiktFlWxI" layout="responsive" width="850" height="479"></amp-youtube>',
			),
			'only_height_in_url'      => array(
				'youtube="https://www.youtube.com/watch?v=SVRiktFlWxI&h=550"',
				'<amp-youtube data-videoid="SVRiktFlWxI" layout="responsive" width="' . $width . '" height="550"></amp-youtube>',
			),
			'width_and_height_in_url' => array(
				'youtube="https://www.youtube.com/watch?v=SVRiktFlWxI&w=600&h=400"',
				'<amp-youtube data-videoid="SVRiktFlWxI" layout="responsive" width="600" height="400"></amp-youtube>',
			),
		);
	}

	/**
	 * Test jetpack_amp_youtube_shortcode.
	 *
	 * @dataProvider get_amp_youtube_data
	 * @covers ::jetpack_amp_youtube_shortcode
	 *
	 * @param array  $url The shortcode URL.
	 * @param string $expected The expected shortcode returned from the function.
	 */
	public function test_jetpack_amp_youtube_shortcode( $url, $expected ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com does not run the latest version of the AMP plugin yet.' );
			return;
		}

		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$this->assertEquals( $expected, jetpack_amp_youtube_shortcode( $url ) );
	}

	/**
	 * Gets the test data for get_amp_youtube_shortcode_data().
	 *
	 * @return array[] The test data.
	 */
	public function get_amp_youtube_shortcode_data() {
		return array(
			'empty_argument'  => array(
				array(),
				array( self::CONTENT_WIDTH, 338 ),
			),
			'only_w_present'  => array(
				array( 'w' => 500 ),
				array( 500, 282 ),
			),
			'only_h_present'  => array(
				array( 'h' => 600 ),
				array( self::CONTENT_WIDTH, 600 ),
			),
			'w_and_h_present' => array(
				array(
					'w' => 500,
					'h' => 400,
				),
				array( 500, 400 ),
			),
		);
	}

	/**
	 * Test jetpack_amp_youtube_shortcode.
	 *
	 * @dataProvider get_amp_youtube_shortcode_data
	 * @covers ::jetpack_shortcode_youtube_dimensions
	 *
	 * @param array  $query_args The query args to pass to the function.
	 * @param string $expected The expected return value.
	 */
	public function test_jetpack_shortcode_youtube_dimensions( $query_args, $expected ) {
		$GLOBALS['content_width'] = self::CONTENT_WIDTH;
		$this->assertEquals( $expected, jetpack_shortcode_youtube_dimensions( $query_args ) );
	}
}
