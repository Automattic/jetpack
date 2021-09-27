<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Vimeo extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Tear down each test.
	 *
	 * @inheritDoc
	 */
	public function tear_down() {
		unset( $GLOBALS['content_width'] );
		parent::tear_down();
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

		$this->assertStringContainsString( 'vimeo.com/video/' . $video_id, $shortcode_content );
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

		$this->assertStringContainsString( 'vimeo.com/video/' . $video_id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::vimeo_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vimeo_w_h_old_format() {
		$video_id = '141358';
		$width    = '350';
		$height   = '500';
		$content  = '[vimeo ' . $video_id . ' w=' . $width . '&h=' . $height . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertStringContainsString( 'width="' . $width . '"', $shortcode_content );
		$this->assertStringContainsString( 'height="' . $height . '"', $shortcode_content );
	}

	/**
	 * @covers ::vimeo_shortcode
	 * @since 8.2
	 */
	public function test_shortcodes_vimeo_w_h_new_format() {
		$video_id = '141358';
		$width    = '350';
		$height   = '500';
		$content  = '[vimeo ' . $video_id . ' w=' . $width . ' h=' . $height . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertStringContainsString( 'width="' . $width . '"', $shortcode_content );
		$this->assertStringContainsString( 'height="' . $height . '"', $shortcode_content );
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

		$this->assertStringContainsString( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertStringContainsString( 'width="' . $width . '"', $shortcode_content );
		$this->assertStringContainsString( 'height="' . $height . '"', $shortcode_content );
	}

	/**
	 * Test processing of vimeo URLs in post content.
	 *
	 * @author Toro_Unit
	 * @covers ::vimeo_shortcode
	 * @since 3.9
	 */
	public function test_replace_url_with_iframe_in_the_content() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'Embeds are handled by core on WordPress.com. See D27860-code' );
			return;
		}

		global $post;

		$video_id = '141358';
		$url      = 'http://vimeo.com/' . $video_id;
		$post     = $this->factory->post->create_and_get( array( 'post_content' => $url ) );

		do_action( 'init' );
		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		wp_reset_postdata();
		$this->assertStringContainsString( '<div class="embed-vimeo"', $actual );

		if ( wp_lazy_loading_enabled( 'iframe', null ) ) {
			$this->assertStringContainsString( '<iframe loading="lazy" src="https://player.vimeo.com/video/' . $video_id . '"', $actual );
		} else {
			$this->assertStringContainsString( '<iframe src="https://player.vimeo.com/video/' . $video_id . '"', $actual );
		}
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

		$this->assertStringContainsString( $player, vimeo_link( "[vimeo $video_id]" ) );
		$this->assertStringContainsString( $player, vimeo_link( "[vimeo http://vimeo.com/$video_id]" ) );
		$this->assertStringContainsString( $player, vimeo_link( "[vimeo https://vimeo.com/$video_id]" ) );
		$this->assertStringContainsString( $player, vimeo_link( "[vimeo //vimeo.com/$video_id]" ) );
		$this->assertStringContainsString( $player, vimeo_link( "[vimeo vimeo.com/$video_id]" ) );
		$this->assertStringContainsString( $player, vimeo_link( "http://vimeo.com/$video_id" ) );
		$this->assertStringContainsString( $player, vimeo_link( "https://vimeo.com/$video_id" ) );
		$this->assertStringContainsString( $player, vimeo_link( "//vimeo.com/$video_id" ) );
		$this->assertStringContainsString( $player, vimeo_link( "vimeo.com/$video_id" ) );

		$this->assertEquals( $text_link, vimeo_link( $text_link ) );
		// phpcs:ignore Squiz.PHP.CommentedOutCode.Found
		// $this->assertEquals( $url_link, vimeo_link( $url_link ) );

		$mixed = vimeo_link( "[vimeo $video_id]\nvimeo.com/$video_id\n$text_link\n$url_link" );
		$this->assertStringContainsString( $player, $mixed );
		$this->assertStringContainsString( $text_link, $mixed );
		// phpcs:ignore Squiz.PHP.CommentedOutCode.Found
		// $this->assertStringContainsString( $url_link, $mixed );
	}

	public function test_shortcodes_vimeo_autoplay_loop() {
		$video_id = '141358';
		$autoplay = '1';
		$loop     = '1';
		$content  = '[vimeo ' . $video_id . ' autoplay=' . $autoplay . ' loop=' . $loop . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertStringContainsString( 'loop=' . $loop, $shortcode_content );
		$this->assertStringContainsString( 'autoplay=' . $autoplay, $shortcode_content );
	}

	public function test_shortcodes_vimeo_autoplay_loop_off() {
		$video_id = '141358';
		$autoplay = '0';
		$loop     = '0';
		$content  = '[vimeo ' . $video_id . ' autoplay=' . $autoplay . ' loop=' . $loop . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertStringNotContainsString( 'loop=' . $loop, $shortcode_content );
		$this->assertStringNotContainsString( 'autoplay=' . $autoplay, $shortcode_content );
	}

	public function test_shortcodes_vimeo_old_args() {
		$video_id = '141358';
		$args     = 'h=500&w=350';
		$content  = '[vimeo ' . $video_id . ' ' . $args . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertStringContainsString( 'width="350"', $shortcode_content );
		$this->assertStringContainsString( 'height="500"', $shortcode_content );
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
			'empty_attr_array'           => array(
				array(),
				'<!-- vimeo error: not a vimeo video -->',
			),
			'no_width_or_height_in_attr' => array(
				array( 'id' => '24246' ),
				'<amp-vimeo data-videoid="24246" layout="responsive" width="600" height="338"></amp-vimeo>'
			),
			'normal_attributes_present'  => array(
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
	 *
	 * @param array  $attr The shortcode attributes.
	 * @param string $expected The expected return value.
	 */
	public function test_jetpack_amp_vimeo_shortcode( $attr, $expected ) {
		// Test AMP version. On AMP views, we only show a link.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com does not run the latest version of the AMP plugin yet.' );
			return;
		}

		unset( $GLOBALS['content_width'] );
		add_filter( 'jetpack_is_amp_request', '__return_true' );

		$this->assertEquals( $expected, vimeo_shortcode( $attr ) );
	}

	/**
	 * Tests the Vimeo shortcode filter in an AMP view when there is a global $content_width value.
	 */
	public function test_jetpack_amp_vimeo_shortcode_global_content_width() {
		// Test AMP version. On AMP views, we only show a link.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com does not run the latest version of the AMP plugin yet.' );
			return;
		}

		add_filter( 'jetpack_is_amp_request', '__return_true' );

		$video_id                 = '624432';
		$content_width            = 650;
		$expected_height          = 366;
		$GLOBALS['content_width'] = $content_width;

		$this->assertEquals(
			'<amp-vimeo data-videoid="' . $video_id .'" layout="responsive" width="' . $content_width . '" height="' . $expected_height .'"></amp-vimeo>',
			vimeo_shortcode( array( 'id' => $video_id ) )
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
