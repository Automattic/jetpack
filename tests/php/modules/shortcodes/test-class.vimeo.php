<?php

class WP_Test_Jetpack_Shortcodes_Vimeo extends WP_UnitTestCase {

	/**
	 * Tear down each test.
	 *
	 * @inheritDoc
	 */
	public function tearDown() {
		unset( $GLOBALS['content_width'] );
		parent::tearDown();
	}

	/**
	 * @author scotchfield
	 * @covers ::vimeo_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vimeo_exists() {
		$this->assertEquals( shortcode_exists( 'vimeo' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::vimeo_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vimeo() {
		$content = '[vimeo]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::vimeo_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vimeo_id() {
		$video_id = '141358';
		$content  = '[vimeo ' . $video_id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::vimeo_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vimeo_url() {
		$video_id = '141358';
		$url      = 'http://vimeo.com/' . $video_id;
		$content  = '[vimeo ' . $url . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::vimeo_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vimeo_w_h() {
		$video_id = '141358';
		$width    = '350';
		$height   = '500';
		$content  = '[vimeo ' . $video_id . ' w=' . $width . '&h=' . $height . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertContains( 'width="' . $width . '"', $shortcode_content );
		$this->assertContains( 'height="' . $height . '"', $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::vimeo_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vimeo_width_height() {
		$video_id = '141358';
		$width    = '350';
		$height   = '500';
		$content  = '[vimeo ' . $video_id . ' width=' . $width . ' height=' . $height . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertContains( 'width="' . $width . '"', $shortcode_content );
		$this->assertContains( 'height="' . $height . '"', $shortcode_content );
	}

	/**
	 * @author Toro_Unit
	 * @covers ::vimeo_shortcode
	 * @since 3.9
	 */
	public function test_replace_url_with_iframe_in_the_content() {
		global $post;

		$video_id = '141358';
		$url = 'http://vimeo.com/' . $video_id;
		$post = $this->factory->post->create_and_get( array( 'post_content' => $url ) );

		do_action( 'init' );
		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		wp_reset_postdata();
		$this->assertContains( '<div class="embed-vimeo"', $actual );
		$this->assertContains( '<iframe src="https://player.vimeo.com/video/'.$video_id.'"', $actual );
	}

	/**
	 * @author Automattic
	 * @covers ::vimeo_shortcode
	 * @since 4.0.0
	 */
	public function test_replace_in_comments() {
		$video_id = '141358';
		$player = '<iframe src="https://player.vimeo.com/video/' . $video_id . '"';
		$text_link = 'Vimeo <a href="https://vimeo.com/123456">link</a>';
		$url_link = 'Link <a href="https://vimeo.com/123456">https://vimeo.com/123456</a>';

		$this->assertContains( $player, vimeo_link( "[vimeo $video_id]" ) );
		$this->assertContains( $player, vimeo_link( "[vimeo http://vimeo.com/$video_id]" ) );
		$this->assertContains( $player, vimeo_link( "[vimeo https://vimeo.com/$video_id]" ) );
		$this->assertContains( $player, vimeo_link( "[vimeo //vimeo.com/$video_id]" ) );
		$this->assertContains( $player, vimeo_link( "[vimeo vimeo.com/$video_id]" ) );
		$this->assertContains( $player, vimeo_link( "http://vimeo.com/$video_id" ) );
		$this->assertContains( $player, vimeo_link( "https://vimeo.com/$video_id" ) );
		$this->assertContains( $player, vimeo_link( "//vimeo.com/$video_id" ) );
		$this->assertContains( $player, vimeo_link( "vimeo.com/$video_id" ) );

		$this->assertEquals( $text_link, vimeo_link( $text_link ) );
		//$this->assertEquals( $url_link, vimeo_link( $url_link ) );

		$mixed = vimeo_link( "[vimeo $video_id]\nvimeo.com/$video_id\n$text_link\n$url_link" );
		$this->assertContains( $player, $mixed );
		$this->assertContains( $text_link, $mixed );
		//$this->assertContains( $url_link, $mixed );
	}

	public function test_shortcodes_vimeo_autoplay_loop() {
		$video_id = '141358';
		$autoplay = '1';
		$loop     = '1';
		$content  = '[vimeo ' . $video_id . ' autoplay=' . $autoplay . ' loop=' . $loop . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertContains( 'loop=' . $loop, $shortcode_content );
		$this->assertContains( 'autoplay=' . $autoplay, $shortcode_content );
	}

	public function test_shortcodes_vimeo_autoplay_loop_off() {
		$video_id = '141358';
		$autoplay = '0';
		$loop     = '0';
		$content  = '[vimeo ' . $video_id . ' autoplay=' . $autoplay . ' loop=' . $loop . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertNotContains( 'loop=' . $loop, $shortcode_content );
		$this->assertNotContains( 'autoplay=' . $autoplay, $shortcode_content );
	}

	public function test_shortcodes_vimeo_old_args() {
		$video_id = '141358';
		$args     = 'h=500&w=350';
		$content  = '[vimeo ' . $video_id . ' ' . $args . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertContains( 'width="350"', $shortcode_content );
		$this->assertContains( 'height="500"', $shortcode_content );
	}

	public function test_vimeo_embed_to_shortcode_1() {
		$embed     = '<iframe src="http://player.vimeo.com/video/18427511" width="400" height="225" frameborder="0"></iframe><p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>';
		$shortcode = vimeo_embed_to_shortcode( $embed );

		$expected_shortcode = '[vimeo 18427511 w=400 h=225]<p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	function test_vimeo_embed_to_shortcode_2() {
		$embed     = '<iframe src="https://player.vimeo.com/video/18427511" width="400" height="225" frameborder="0"></iframe><p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>';
		$shortcode = vimeo_embed_to_shortcode( $embed );

		$expected_shortcode = '[vimeo 18427511 w=400 h=225]<p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	function test_vimeo_embed_to_shortcode_3() {
		$embed     = '<iframe src="//player.vimeo.com/video/81408697?byline=0&amp;badge=0&amp;color=ffffff" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe><p><a href="http://vimeo.com/81408697">Partly Cloudy Redux</a> from <a href="http://vimeo.com/level1">Level 1</a> on <a href="https://vimeo.com">Vimeo</a>.</p>';
		$shortcode = vimeo_embed_to_shortcode( $embed );

		$expected_shortcode = '[vimeo 81408697 w=500 h=281]<p><a href="http://vimeo.com/81408697">Partly Cloudy Redux</a> from <a href="http://vimeo.com/level1">Level 1</a> on <a href="https://vimeo.com">Vimeo</a>.</p>';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	function test_vimeo_embed_to_shortcode_4() {
		$embed     = '<iframe src="//player.vimeo.com/video/81408697?byline=0&amp;badge=0&amp;color=ffffff" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
		$shortcode = vimeo_embed_to_shortcode( $embed );

		$expected_shortcode = '[vimeo 81408697 w=500 h=281]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	function test_vimeo_embed_to_shortcode_5() {
		$embed     = '<iframe src="//player.vimeo.com/video/81408697"></iframe>';
		$shortcode = vimeo_embed_to_shortcode( $embed );

		$expected_shortcode = '[vimeo 81408697]';

		$this->assertEquals( $expected_shortcode, $shortcode );
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
				array( 'id' => '62245' ),
				null,
			),
			'empty_attr_array'           => array(
				'<div>Initial shortcode</div>',
				'vimeo',
				array(),
				null,
			),
			'no_width_or_height_in_attr' => array(
				'<div>Initial shortcode</div>',
				'vimeo',
				array( 'id' => '24246' ),
				'<amp-vimeo data-videoid="24246" layout="responsive" width="600" height="338"></amp-vimeo>'
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
	 * Tests that the Vimeo shortcode filter produces the right HTML.
	 *
	 * @dataProvider get_vimeo_shortcode_data
	 * @covers ::amp_vimeo_shortcode()
	 *
	 * @param string $html The html passed to the filter.
	 * @param string $shortcode_tag The tag (name) of the shortcode, like 'vimeo'.
	 * @param array  $attr The shortcode attributes.
	 * @param string $expected The expected return value.
	 */
	public function test_jetpack_amp_vimeo_shortcode( $html, $shortcode_tag, $attr, $expected ) {
		unset( $GLOBALS['content_width'] );
		add_filter( 'jetpack_is_amp_request', '__return_true' );

		if ( null === $expected ) {
			$expected = $html;
		}

		$this->assertEquals( $expected, jetpack_amp_vimeo_shortcode( $html, $shortcode_tag, $attr ) );
	}

	/**
	 * Tests the Vimeo shortcode filter when there is a global $content_width value.
	 *
	 * @covers ::jetpack_amp_vimeo_shortcode()
	 */
	public function test_jetpack_amp_vimeo_shortcode_global_content_width() {
		add_filter( 'jetpack_is_amp_request', '__return_true' );

		$video_id                 = '624432';
		$content_width            = 650;
		$expected_height          = 366;
		$GLOBALS['content_width'] = $content_width;

		$this->assertEquals(
			'<amp-vimeo data-videoid="' . $video_id .'" layout="responsive" width="' . $content_width . '" height="' . $expected_height .'"></amp-vimeo>',
			jetpack_amp_vimeo_shortcode(
				'<div><span>Initial shortcode</span></div>',
				'vimeo',
				array(
					'id' => $video_id,
				)
			)
		);
	}

	/**
	 * Tests that the Vimeo shortcode filter does not filter the markup on non-AMP endpoints.
	 *
	 * @covers ::jetpack_amp_vimeo_shortcode()
	 */
	public function test_jetpack_amp_vimeo_shortcode_non_amp() {
		add_filter( 'jetpack_is_amp_request', '__return_false' );
		$initial_shortcode_markup = '<div><span>Shortcode here</span></div>';

		$this->assertEquals(
			$initial_shortcode_markup,
			jetpack_amp_vimeo_shortcode(
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
	 * Gets the testing data for jetpack_shortcode_get_vimeo_dimensions().
	 *
	 * @return array The testing data.
	 */
	public function get_vimeo_dimensions_data() {
		return array(
			'no_width_or_height'          => array(
				array(),
				array( 600, 338 ),
			),
			'only_width'                  => array(
				array( 'width' => 800 ),
				array( 800, 450 ),
			),
			'only_height'                 => array(
				array( 'height' => 400 ),
				array( 600, 400 ),
			),
			'width_and_height'            => array(
				array(
					'width'  => 600,
					'height' => 400,
				),
				array( 600, 400 ),
			),
			'width_and_height_as_strings' => array(
				array(
					'width'  => '600',
					'height' => '400',
				),
				array( 600, 400 ),
			),
		);
	}

	/**
	 * Tests jetpack_shortcode_get_vimeo_dimensions, when there is no global $content_width.
	 *
	 * @dataProvider get_vimeo_dimensions_data
	 * @covers ::jetpack_shortcode_get_vimeo_dimensions()
	 *
	* @param array $attr The shortcode attributes.
	* @param array $expected The expected dimensions.
	 */
	function test_jetpack_shortcode_get_vimeo_dimensions_no_global_content_width( $attr, $expected ) {
		unset( $GLOBALS['content_width'] );
		$this->assertEquals( $expected, jetpack_shortcode_get_vimeo_dimensions( $attr ) );
	}

	/**
	 * Tests jetpack_shortcode_get_vimeo_dimensions, when there is a global $content_width.
	 *
	 * @covers ::jetpack_shortcode_get_vimeo_dimensions()
	 */
	function test_jetpack_shortcode_get_vimeo_dimensions_with_global_content_width() {
		$width                    = 500;
		$height                   = 281;
		$GLOBALS['content_width'] = $width;
		$this->assertEquals(
			array( $width, $height ),
			jetpack_shortcode_get_vimeo_dimensions( array() )
		);
	}
}
