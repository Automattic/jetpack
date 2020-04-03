<?php

require_jetpack_file( 'extensions/blocks/slideshow/slideshow.php' );

class WP_Test_Jetpack_Shortcodes_Slideshow extends WP_UnitTestCase {

	/**
	 * The mock IDs.
	 *
	 * @var string
	 */
	public $ids;

	public function setUp() {
		if ( ! defined( 'TESTING_IN_JETPACK' ) || ! TESTING_IN_JETPACK ) {
			switch_to_blog( 104104364 ); // test.wordpress.com
			$this->ids = '161,162';
			return;
		}

		// Otherwise, create the two images we're going to be using ourselves!
		$a1 = self::factory()->attachment->create_object( 'image1.jpg', 0, array(
			'file'           => 'image1.jpg',
			'post_mime_type' => 'image/jpeg',
			'post_type'      => 'attachment',
		) );

		$a2 = self::factory()->attachment->create_object( 'image1.jpg', 0, array(
			'file'           => 'image2.jpg',
			'post_mime_type' => 'image/jpeg',
			'post_type'      => 'attachment',
		) );

		$this->ids = "{$a1},{$a2}";
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Slideshow_Shortcode::shortcode_callback
	 * @since 3.2
	 */
	public function test_shortcodes_slideshow_exists() {
		$this->assertEquals( shortcode_exists( 'slideshow' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Slideshow_Shortcode::shortcode_callback
	 * @since 3.2
	 */
	public function test_shortcodes_slideshow() {
		$content = '[slideshow]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	public function test_shortcodes_slideshow_no_js() {
		$content = '[gallery type="slideshow" ids="' . $this->ids . '"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( 0, strpos( $shortcode_content, '<p class="jetpack-slideshow-noscript robots-nocontent">This slideshow requires JavaScript.</p>' ) );
	}

	public function test_shortcodes_slideshow_html() {
		$content = '[gallery type="slideshow" ids="' . $this->ids . '"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( ! false, strpos( $shortcode_content, 'class="slideshow-window jetpack-slideshow' ) );
	}

	public function test_shortcodes_slideshow_autostart_off() {
		$content = '[gallery type="slideshow" ids="' . $this->ids . '" autostart="false"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( ! false, strpos( $shortcode_content, 'data-autostart="false"' ) );
	}

	public function test_shortcodes_slideshow_autostart_on() {
		$content = '[gallery type="slideshow" ids="' . $this->ids . '" autostart="true"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( ! false, strpos( $shortcode_content, 'data-autostart="true"' ) );
	}

	/**
	 * Gets the test data for test_shortcodes_slideshow_amp().
	 *
	 * @return array The test data.
	 */
	public function get_slideshow_shortcode_amp() {
		return array(
			'without_autostart_attribute' => array(
				'[gallery type="slideshow" ids="' . $this->ids . ']',
				'<div class="wp-block-jetpack-slideshow wp-amp-block wp-block-jetpack-slideshow__autoplay wp-block-jetpack-slideshow__autoplay-playing" id="wp-block-jetpack-slideshow__1"><div class="wp-block-jetpack-slideshow_container swiper-container"><amp-carousel width="800" height="600" layout="responsive" type="slides" data-next-button-aria-label="Next Slide" data-prev-button-aria-label="Previous Slide" controls loop autoplay delay=3000 id="wp-block-jetpack-slideshow__amp-carousel__1" on="slideChange:wp-block-jetpack-slideshow__amp-pagination__1.toggle(index=event.index, value=true)"><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div></amp-carousel><a aria-label="Pause Slideshow" class="wp-block-jetpack-slideshow_button-pause" role="button" on="tap:wp-block-jetpack-slideshow__amp-carousel__1.toggleAutoplay(toggleOn=false),wp-block-jetpack-slideshow__1.toggleClass(class=wp-block-jetpack-slideshow__autoplay-playing,force=false)"></a><a aria-label="Play Slideshow" class="wp-block-jetpack-slideshow_button-play" role="button" on="tap:wp-block-jetpack-slideshow__amp-carousel__1.toggleAutoplay(toggleOn=true),wp-block-jetpack-slideshow__1.toggleClass(class=wp-block-jetpack-slideshow__autoplay-playing,force=true)"></a><amp-selector id="wp-block-jetpack-slideshow__amp-pagination__1" class="wp-block-jetpack-slideshow_pagination swiper-pagination swiper-pagination-bullets amp-pagination" on="select:wp-block-jetpack-slideshow__amp-carousel__1.goToSlide(index=event.targetOption)" layout="container"><button option="0" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 1" selected></button><button option="1" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 2" ></button><button option="2" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 3" ></button><button option="3" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 4" ></button><button option="4" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 5" ></button><button option="5" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 6" ></button><button option="6" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 7" ></button><button option="7" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 8" ></button><button option="8" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 9" ></button><button option="9" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 10" ></button><button option="10" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 11" ></button><button option="11" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 12" ></button><button option="12" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 13" ></button><button option="13" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 14" ></button></amp-selector></div></div>',
			),
			'with_autostart_attribute'    => array(
				'[gallery type="slideshow" ids="' . $this->ids . '" autostart="true"]',
				'<div class="wp-block-jetpack-slideshow wp-amp-block wp-block-jetpack-slideshow__autoplay wp-block-jetpack-slideshow__autoplay-playing" id="wp-block-jetpack-slideshow__2"><div class="wp-block-jetpack-slideshow_container swiper-container"><amp-carousel width="800" height="600" layout="responsive" type="slides" data-next-button-aria-label="Next Slide" data-prev-button-aria-label="Previous Slide" controls loop autoplay delay=3000 id="wp-block-jetpack-slideshow__amp-carousel__2" on="slideChange:wp-block-jetpack-slideshow__amp-pagination__2.toggle(index=event.index, value=true)"><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div><div class="wp-block-jetpack-slideshow_slide"><figure><img width="1" height="1" src="http://example.org/wp-content/uploads/image1.jpg" class="wp-block-jetpack-slideshow_image" alt="" object-fit="contain" /></figure></div></amp-carousel><a aria-label="Pause Slideshow" class="wp-block-jetpack-slideshow_button-pause" role="button" on="tap:wp-block-jetpack-slideshow__amp-carousel__2.toggleAutoplay(toggleOn=false),wp-block-jetpack-slideshow__2.toggleClass(class=wp-block-jetpack-slideshow__autoplay-playing,force=false)"></a><a aria-label="Play Slideshow" class="wp-block-jetpack-slideshow_button-play" role="button" on="tap:wp-block-jetpack-slideshow__amp-carousel__2.toggleAutoplay(toggleOn=true),wp-block-jetpack-slideshow__2.toggleClass(class=wp-block-jetpack-slideshow__autoplay-playing,force=true)"></a><amp-selector id="wp-block-jetpack-slideshow__amp-pagination__2" class="wp-block-jetpack-slideshow_pagination swiper-pagination swiper-pagination-bullets amp-pagination" on="select:wp-block-jetpack-slideshow__amp-carousel__2.goToSlide(index=event.targetOption)" layout="container"><button option="0" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 1" selected></button><button option="1" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 2" ></button><button option="2" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 3" ></button><button option="3" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 4" ></button><button option="4" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 5" ></button><button option="5" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 6" ></button><button option="6" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 7" ></button><button option="7" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 8" ></button><button option="8" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 9" ></button><button option="9" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 10" ></button><button option="10" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 11" ></button><button option="11" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 12" ></button><button option="12" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 13" ></button><button option="13" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 14" ></button><button option="14" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 15" ></button><button option="15" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 16" ></button></amp-selector></div></div>',
			),
			'with_no_valid_id'            => array(
				sprintf( '[gallery type="slideshow" ids="%d"]', PHP_INT_MAX ),
				'',
			),
		);
	}

	/**
	 * Test slideshow shortcode output in AMP.
	 *
	 * @dataProvider get_slideshow_shortcode_amp
	 * @covers Jetpack_Slideshow_Shortcode::shortcode_callback()
	 * @since 8.5.0
	 *
	 * @param string $shortcode The initial shortcode.
	 * @param string $expected  The expected markup, after processing the shortcode.
	 */
	public function test_shortcodes_slideshow_amp( $shortcode, $expected ) {
		add_filter( 'jetpack_is_amp_request', '__return_true' );

		$this->assertEquals( $expected, do_shortcode( $shortcode ) );
	}
}
