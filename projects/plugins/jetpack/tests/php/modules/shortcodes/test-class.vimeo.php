<?php
/**
 * Vimeo Shortcode and embed tests.
 *
 * @package automattic/jetpack
 */

/**
 * Shortcodes need external HTML requests to be converted to valid embed code (using smartframe's oembed endpoint)
 */
require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * Test our Vimeo embed feature (shortcode as well as embed code).
 */
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
	 * Test whether the shortcode is registered and can be used.
	 *
	 * @author scotchfield
	 * @covers ::vimeo_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vimeo_exists() {
		$this->assertEquals( shortcode_exists( 'vimeo' ), true );
	}

	/**
	 * Test whether a shortcode without any attributes doesn't get output in the content.
	 *
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
	 * Sample data with different sets of shortcode attrbutes.
	 */
	public function get_sample_shortcode_attributes() {
		$video_id = '141358';
		$width    = '350';
		$height   = '500';

		return array(
			'simple id'                            => array(
				$video_id,
				array( 'id' => $video_id ),
			),
			'simple url'                           => array(
				'http://vimeo.com/' . $video_id,
				array( 'id' => $video_id ),
			),
			'id and size attributes in old format' => array(
				$video_id . ' w=' . $width . '&h=' . $height,
				array(
					'id'     => $video_id,
					'width'  => $width,
					'height' => $height,
				),
			),
			'id and size attributes in new format' => array(
				$video_id . ' w=' . $width . ' h=' . $height,
				array(
					'id'     => $video_id,
					'width'  => $width,
					'height' => $height,
				),
			),
			'autoplay and loop on'                 => array(
				$video_id . ' autoplay=1 loop=1',
				array(
					'id'       => $video_id,
					'autoplay' => '1',
					'loop'     => '1',
				),
			),
			'autoplay and loop off'                => array(
				$video_id . ' autoplay=0 loop=0',
				array(
					'id'       => $video_id,
					'autoplay' => '0',
					'loop'     => '0',
				),
			),
		);
	}

	/**
	 * Test the shortcode with different sets of attributes.
	 *
	 * @dataProvider get_sample_shortcode_attributes
	 *
	 * @param string $attribute_string     A string of shortcode attributes.
	 * @param array  $extracted_attributes Expected extracted attributes.
	 */
	public function test_shortcode_attributes( $attribute_string, $extracted_attributes ) {
		$content           = '[vimeo ' . $attribute_string . ']';
		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'vimeo.com/video/' . $extracted_attributes['id'], $shortcode_content );

		/*
		 * Test that all attributes get extracted and added to the final output if they need to be.
		 * The ID attribute is a special one since it's added as part of the video embed URL.
		 */
		foreach ( $extracted_attributes as $attribute => $value ) {
			if ( 'id' === $attribute ) {
				continue;
			}

			if ( '0' !== $value ) {
				// Autoplay and loop are appended to the embed URL, not stored as attributes.
				if ( in_array( $attribute, array( 'autoplay', 'loop' ), true ) ) {
					$this->assertStringContainsString( $attribute . '=' . $value, $shortcode_content );
				} else {
					$this->assertStringContainsString( $attribute . '="' . $value . '"', $shortcode_content );
				}
			} else {
				$this->assertStringNotContainsString( $attribute . '="' . $value . '"', $shortcode_content );
			}
		}
	}

	/**
	 * Get different possible vimeo URL formats, and the expected URL.
	 */
	public function get_vimeo_urls() {
		return array(
			'simple id'               => array(
				'https://vimeo.com/6342264',
				'6342264',
			),
			'unlisted video'          => array(
				'https://vimeo.com/289091934/cd1f466bcc',
				'289091934',
			),
			'video within a playlist' => array(
				'https://vimeo.com/album/2838732/video/6342264',
				'6342264',
			),
			'player URL'              => array(
				'http://player.vimeo.com/video/18427511',
				'18427511',
			),
		);
	}

	/**
	 * Test processing of vimeo URLs in post content.
	 *
	 * @dataProvider get_vimeo_urls
	 *
	 * @covers ::vimeo_shortcode
	 * @since 3.9
	 *
	 * @param string $url      The URL to test.
	 * @param string $video_id The expected video ID.
	 */
	public function test_replace_url_with_iframe_in_the_content( $url, $video_id ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'Embeds are handled by core on WordPress.com. See D27860-code' );
			return;
		}

		global $post;

		$post = self::factory()->post->create_and_get( array( 'post_content' => $url ) );

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
	 * Test replacing vimeo content in comments.
	 *
	 * @author Automattic
	 * @covers ::vimeo_shortcode
	 * @since 4.0.0
	 */
	public function test_replace_in_comments() {
		$video_id  = '141358';
		$player    = '<iframe src="https://player.vimeo.com/video/' . $video_id . '"';
		$text_link = 'Vimeo <a href="https://vimeo.com/123456">link</a>';
		$url_link  = 'Link <a href="https://vimeo.com/123456">https://vimeo.com/123456</a>';

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

	/**
	 * Get different types of embed codes and the expected shortcode output.
	 */
	public function get_embed_to_shortcode_data() {
		return array(
			'http iFrame'                  => array(
				'<iframe src="http://player.vimeo.com/video/18427511" width="400" height="225" frameborder="0"></iframe><p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>',
				'[vimeo 18427511 w=400 h=225]<p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>',
			),
			'https iFrame'                 => array(
				'<iframe src="https://player.vimeo.com/video/18427511" width="400" height="225" frameborder="0"></iframe><p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>',
				'[vimeo 18427511 w=400 h=225]<p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>',
			),
			'no protocol'                  => array(
				'<iframe src="//player.vimeo.com/video/81408697?byline=0&amp;badge=0&amp;color=ffffff" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe><p><a href="http://vimeo.com/81408697">Partly Cloudy Redux</a> from <a href="http://vimeo.com/level1">Level 1</a> on <a href="https://vimeo.com">Vimeo</a>.</p>',
				'[vimeo 81408697 w=500 h=281]<p><a href="http://vimeo.com/81408697">Partly Cloudy Redux</a> from <a href="http://vimeo.com/level1">Level 1</a> on <a href="https://vimeo.com">Vimeo</a>.</p>',
			),
			'iFrame without description'   => array(
				'<iframe src="//player.vimeo.com/video/81408697?byline=0&amp;badge=0&amp;color=ffffff" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>',
				'[vimeo 81408697 w=500 h=281]',
			),
			'simple iFrame, no extra data' => array(
				'<iframe src="//player.vimeo.com/video/81408697"></iframe>',
				'[vimeo 81408697]',
			),
		);
	}

	/**
	 * Test that the embed code is converted to a shortcode.
	 *
	 * @dataProvider get_embed_to_shortcode_data
	 *
	 * @param string $embed_code The embed code to test.
	 * @param string $expected The expected shortcode output.
	 */
	public function test_vimeo_embed_to_shortcode_1( $embed_code, $expected ) {
		$shortcode = vimeo_embed_to_shortcode( $embed_code );
		$this->assertEquals( $expected, $shortcode );
	}

	/**
	 * Gets the test data for the Vimeo shortcodes.
	 *
	 * @return array An associative array of test data.
	 */
	public function get_amp_vimeo_shortcode_data() {
		return array(
			'empty_attr_array'           => array(
				array(),
				'<!-- vimeo error: not a vimeo video -->',
			),
			'no_width_or_height_in_attr' => array(
				array( 'id' => '24246' ),
				'<amp-vimeo data-videoid="24246" layout="responsive" width="600" height="338"></amp-vimeo>',
			),
			'normal_attributes_present'  => array(
				array(
					'id'     => '623422',
					'width'  => '900',
					'height' => '1200',
				),
				'<amp-vimeo data-videoid="623422" layout="responsive" width="900" height="1200"></amp-vimeo>',
			),
		);
	}

	/**
	 * Tests that the Vimeo shortcode filter produces the right HTML.
	 *
	 * @dataProvider get_amp_vimeo_shortcode_data
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
			'<amp-vimeo data-videoid="' . $video_id . '" layout="responsive" width="' . $content_width . '" height="' . $expected_height . '"></amp-vimeo>',
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
	public function test_jetpack_shortcode_get_vimeo_dimensions_no_global_content_width( $attr, $expected ) {
		unset( $GLOBALS['content_width'] );
		$this->assertEquals( $expected, jetpack_shortcode_get_vimeo_dimensions( $attr ) );
	}

	/**
	 * Tests jetpack_shortcode_get_vimeo_dimensions, when there is a global $content_width.
	 *
	 * @covers ::jetpack_shortcode_get_vimeo_dimensions()
	 */
	public function test_jetpack_shortcode_get_vimeo_dimensions_with_global_content_width() {
		$width                    = 500;
		$height                   = 281;
		$GLOBALS['content_width'] = $width;
		$this->assertEquals(
			array( $width, $height ),
			jetpack_shortcode_get_vimeo_dimensions( array() )
		);
	}
}
