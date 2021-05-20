<?php
/**
 * Class WP_Test_Jetpack_Carousel.
 *
 * @package automattic/jetpack
 */

require_jetpack_file( 'modules/carousel/jetpack-carousel.php' );

/**
 * Class WP_Test_Jetpack_Carousel
 */
class WP_Test_Jetpack_Carousel extends WP_UnitTestCase {

	/**
	 * The tested instance.
	 *
	 * @var Jetpack_Carousel
	 */
	public $instance;

	/**
	 * Sets up each test.
	 *
	 * @inheritDoc
	 */
	public function setUp() {
		parent::setUp();
		$this->instance = new Jetpack_Carousel();
	}

	/**
	 * Clean up tests.
	 */
	public function tearDown() {
		update_option( 'blog_charset', 'utf-8' );
	}

	/**
	 * Gets the test data for test_add_data_img_tags_and_enqueue_assets().
	 *
	 * @return array The test data.
	 */
	public function get_data_img_tags() {
		return array(
			'amp_gallery_block'                          => array(
				'<figure class="wp-block-gallery columns-3 is-cropped"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg" alt="" data-id="8" data-full-url="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg" data-link="https://example.com/?attachment_id=8" class="wp-image-8" srcset="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg 1000wj" sizes="(max-width: 1000px) 100vw, 1000px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-1024x341.jpg" alt="Image Alignment 1200x4002" data-id="1029" data-full-url="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1.jpg" data-link="https://example.com/?attachment_id=1029" class="wp-image-1029" srcset="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-1024x341.jpg 1024w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-300x100.jpg 300w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-768x256.jpg 768w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1.jpg 1200w" sizes="(max-width: 1024px) 100vw, 1024px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg" alt="" data-id="10" data-full-url="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg" data-link="https://example.com/?attachment_id=10" class="wp-image-10" srcset="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg 600w, https://example.com/wp-content/uploads/2020/01/858-600x400-1-300x200.jpg 300w" sizes="(max-width: 600px) 100vw, 600px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-1024x768.jpg" alt="" data-id="549" data-full-url="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1.jpg" data-link="https://example.com/?attachment_id=549" class="wp-image-549" srcset="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-1024x768.jpg 1024w, https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-300x225.jpg 300w" sizes="(max-width: 1024px) 100vw, 1024px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/03/4-150x150-1.jpg" alt="" data-id="571" data-full-url="https://example.com/wp-content/uploads/2020/03/4-150x150-1.jpg" data-link="https://example.com/?attachment_id=571" class="wp-image-571"/></figure></li></ul></figure>',
				true,
				'<figure data-amp-lightbox="true" class="wp-block-gallery columns-3 is-cropped"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg" alt="" data-id="8" data-full-url="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg" data-link="https://example.com/?attachment_id=8" class="wp-image-8" srcset="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg 1000wj" sizes="(max-width: 1000px) 100vw, 1000px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-1024x341.jpg" alt="Image Alignment 1200x4002" data-id="1029" data-full-url="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1.jpg" data-link="https://example.com/?attachment_id=1029" class="wp-image-1029" srcset="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-1024x341.jpg 1024w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-300x100.jpg 300w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-768x256.jpg 768w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1.jpg 1200w" sizes="(max-width: 1024px) 100vw, 1024px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg" alt="" data-id="10" data-full-url="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg" data-link="https://example.com/?attachment_id=10" class="wp-image-10" srcset="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg 600w, https://example.com/wp-content/uploads/2020/01/858-600x400-1-300x200.jpg 300w" sizes="(max-width: 600px) 100vw, 600px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-1024x768.jpg" alt="" data-id="549" data-full-url="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1.jpg" data-link="https://example.com/?attachment_id=549" class="wp-image-549" srcset="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-1024x768.jpg 1024w, https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-300x225.jpg 300w" sizes="(max-width: 1024px) 100vw, 1024px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/03/4-150x150-1.jpg" alt="" data-id="571" data-full-url="https://example.com/wp-content/uploads/2020/03/4-150x150-1.jpg" data-link="https://example.com/?attachment_id=571" class="wp-image-571"/></figure></li></ul></figure>',
			),
			'amp_gallery_block_class_preceded_by_other_classes' => array(
				'<figure class="columns-3 is-cropped wp-block-gallery"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg" alt="" data-id="8" data-full-url="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg" data-link="https://example.com/?attachment_id=8" class="wp-image-8" srcset="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg 1000wj" sizes="(max-width: 1000px) 100vw, 1000px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-1024x341.jpg" alt="Image Alignment 1200x4002" data-id="1029" data-full-url="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1.jpg" data-link="https://example.com/?attachment_id=1029" class="wp-image-1029" srcset="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-1024x341.jpg 1024w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-300x100.jpg 300w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-768x256.jpg 768w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1.jpg 1200w" sizes="(max-width: 1024px) 100vw, 1024px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg" alt="" data-id="10" data-full-url="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg" data-link="https://example.com/?attachment_id=10" class="wp-image-10" srcset="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg 600w, https://example.com/wp-content/uploads/2020/01/858-600x400-1-300x200.jpg 300w" sizes="(max-width: 600px) 100vw, 600px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-1024x768.jpg" alt="" data-id="549" data-full-url="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1.jpg" data-link="https://example.com/?attachment_id=549" class="wp-image-549" srcset="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-1024x768.jpg 1024w, https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-300x225.jpg 300w" sizes="(max-width: 1024px) 100vw, 1024px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/03/4-150x150-1.jpg" alt="" data-id="571" data-full-url="https://example.com/wp-content/uploads/2020/03/4-150x150-1.jpg" data-link="https://example.com/?attachment_id=571" class="wp-image-571"/></figure></li></ul></figure>',
				true,
				'<figure data-amp-lightbox="true" class="columns-3 is-cropped wp-block-gallery"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg" alt="" data-id="8" data-full-url="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg" data-link="https://example.com/?attachment_id=8" class="wp-image-8" srcset="https://example.com/wp-content/uploads/2020/01/568-1000x1000-1.jpg 1000wj" sizes="(max-width: 1000px) 100vw, 1000px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-1024x341.jpg" alt="Image Alignment 1200x4002" data-id="1029" data-full-url="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1.jpg" data-link="https://example.com/?attachment_id=1029" class="wp-image-1029" srcset="https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-1024x341.jpg 1024w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-300x100.jpg 300w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1-768x256.jpg 768w, https://example.com/wp-content/uploads/2013/03/image-alignment-1200x4002-1.jpg 1200w" sizes="(max-width: 1024px) 100vw, 1024px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg" alt="" data-id="10" data-full-url="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg" data-link="https://example.com/?attachment_id=10" class="wp-image-10" srcset="https://example.com/wp-content/uploads/2020/01/858-600x400-1.jpg 600w, https://example.com/wp-content/uploads/2020/01/858-600x400-1-300x200.jpg 300w" sizes="(max-width: 600px) 100vw, 600px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-1024x768.jpg" alt="" data-id="549" data-full-url="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1.jpg" data-link="https://example.com/?attachment_id=549" class="wp-image-549" srcset="https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-1024x768.jpg 1024w, https://example.com/wp-content/uploads/2020/03/448-1600x1200-1-300x225.jpg 300w" sizes="(max-width: 1024px) 100vw, 1024px" /></figure></li><li class="blocks-gallery-item"><figure><img src="https://example.com/wp-content/uploads/2020/03/4-150x150-1.jpg" alt="" data-id="571" data-full-url="https://example.com/wp-content/uploads/2020/03/4-150x150-1.jpg" data-link="https://example.com/?attachment_id=571" class="wp-image-571"/></figure></li></ul></figure>',
			),
			'amp_gallery_shortcode'                      => array(
				'[gallery ids=571,6]',
				true,
				'[gallery amp-lightbox="true" ids=571,6]',
			),
			'amp_gallery_shortcode_more_attributes'      => array(
				'[gallery ids=571,6 icontag="div" captiontag="span"]',
				true,
				'[gallery amp-lightbox="true" ids=571,6 icontag="div" captiontag="span"]',
			),
			'amp_gallery_with_no_id'                     => array(
				'[gallery]',
				true,
			),
			'gallery_shortcode_non_amp_should_be_returned_unchanged' => array(
				'[gallery ids=571,6]',
			),
			'amp_single_image_should_have_lightbox'      => array(
				'<a href="https://example.com/726-300x300-2/"><img src="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg" alt="" class="wp-image-186" srcset="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg 300w, https://example.com/wp-content/uploads/2020/02/726-300x300-1-150x150.jpg 150w" sizes="(max-width: 300px) 100vw, 300px"></a>',
				true,
				'<img src="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg" alt=""  data-amp-lightbox="true" lightbox="true" class="wp-image-186" srcset="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg 300w, https://example.com/wp-content/uploads/2020/02/726-300x300-1-150x150.jpg 150w" sizes="(max-width: 300px) 100vw, 300px">',
			),
			'amp_single_image_should_not_have_lightbox_because_wrapped_in_link_to_media_file' => array(
				'<a href="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg"><img src="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg" alt="" class="wp-image-186" srcset="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg 300w, https://example.com/wp-content/uploads/2020/02/726-300x300-1-150x150.jpg 150w" sizes="(max-width: 300px) 100vw, 300px"></a>',
				true,
			),
			'amp_single_image_should_not_have_lightbox_because_not_wrapped_in_anchor' => array(
				'<img src="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg" alt="" class="wp-image-186" srcset="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg 300w, https://example.com/wp-content/uploads/2020/02/726-300x300-1-150x150.jpg 150w" sizes="(max-width: 300px) 100vw, 300px">',
				true,
				'<img src="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg" alt="" class="wp-image-186" srcset="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg 300w, https://example.com/wp-content/uploads/2020/02/726-300x300-1-150x150.jpg 150w" sizes="(max-width: 300px) 100vw, 300px">',
			),
			'amp_non_image_not_have_amp_lightbox'        => array(
				'<div class="entry-content"><p>This is some content</p><a href="https://example.com">Here is a link</a></div>',
				true,
			),
			'image_non_amp_should_not_have_amp_lightbox' => array(
				'<a href="https://example.com/726-300x300-2/"><img src="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg" alt="" class="wp-image-186" srcset="https://example.com/wp-content/uploads/2020/02/726-300x300-1.jpg 300w, https://example.com/wp-content/uploads/2020/02/726-300x300-1-150x150.jpg 150w" sizes="(max-width: 300px) 100vw, 300px"></a>',
			),
		);
	}

	/**
	 * Test add_data_img_tags_and_enqueue_assets.
	 *
	 * @dataProvider get_data_img_tags
	 * @covers Jetpack_Carousel::add_data_img_tags_and_enqueue_assets()
	 * @covers Jetpack_Carousel::maybe_add_amp_lightbox()
	 *
	 * @param string      $content The initial content to be filtered.
	 * @param bool        $is_amp Whether this is an AMP endpoint.
	 * @param string|null $expected The filtered content.
	 */
	public function test_add_data_img_tags_and_enqueue_assets( $content, $is_amp = false, $expected = null ) {
		if ( $is_amp ) {
			add_filter( 'jetpack_is_amp_request', '__return_true' );
		}

		if ( null === $expected ) {
			$expected = $content;
		}

		$this->assertEquals(
			$expected,
			$this->instance->add_data_img_tags_and_enqueue_assets( $content )
		);

		// The script should not be enqueued on AMP endpoints.
		if ( $is_amp ) {
			$this->assertFalse( wp_script_is( 'jetpack-carousel' ) );
		}
	}

	/**
	 * Test add_data_to_container.
	 *
	 * @covers Jetpack_Carousel::add_data_to_container()
	 */
	public function test_add_data_to_container() {
		$post_id = $this->factory->post->create();
		$extra   = 'data-carousel-extra=\'{"blog_id":1,"permalink":"http:\\/\\/example.org\\/?p=' . $post_id . '"}\'';

		$this->assertEquals( '<div class="gallery" ' . $extra . '></div>', $this->instance->add_data_to_container( '<div class="gallery"></div>' ) );
	}

	/**
	 * Set of example post data to be used with UTF-8 charset.
	 */
	public function utf_8_provider() {
		$extra = 'data-carousel-extra=\'{"blog_id":1,"permalink":"http:\\/\\/example.org\\/?p=%%%POST_ID%%%"}\'';

		return array(
			'ascii'                 => array( '<div class="gallery">hello</div>', '<div class="gallery" ' . $extra . '>hello</div>' ),
			'latin with diacritics' => array( '<div class="gallery">Ĵëṫṕãḉǩ</div>', '<div class="gallery" ' . $extra . '>Ĵëṫṕãḉǩ</div>' ),
			'encoded'               => array( '<div class="gallery">&#308;&euml;&#7787;&#7765;&atilde;&#7689;&#489;</div>', '<div class="gallery" ' . $extra . '>&#308;&euml;&#7787;&#7765;&atilde;&#7689;&#489;</div>' ),
			'japanese'              => array( '<div class="gallery">最高のパック</div>', '<div class="gallery" ' . $extra . '>最高のパック</div>' ),
			'linear b (4-byte)'     => array( '<div class="gallery">𐁂𐀐𐀷</div>', '<div class="gallery" ' . $extra . '>𐁂𐀐𐀷</div>' ),
			'emoji (4-byte)'        => array( '<div class="gallery">✈️🎒</div>', '<div class="gallery" ' . $extra . '>✈️🎒</div>' ),
		);
	}

	/**
	 * Test add_data_to_container with different characters with UTF-8.
	 *
	 * @covers Jetpack_Carousel::add_data_to_container()
	 * @dataProvider utf_8_provider
	 *
	 * @param string $input    Post content saved in WP.
	 * @param string $expected Post content with Carousel data added.
	 */
	public function test_add_data_to_container_with_utf_8_input( $input, $expected ) {
		$post_id  = $this->factory->post->create();
		$expected = str_replace( '%%%POST_ID%%%', $post_id, $expected );

		update_option( 'blog_charset', 'utf-8' );

		$this->assertEquals( $expected, $this->instance->add_data_to_container( $input ) );
	}

	/**
	 * Set of example post data to be used with big-5 charset.
	 */
	public function big_5_provider() {
		$extra = 'data-carousel-extra=\'{"blog_id":1,"permalink":"http:\\/\\/example.org\\/?p=%%%POST_ID%%%"}\'';

		return array(
			'ascii'                => array( '<div class="gallery">hello</div>', '<div class="gallery" ' . $extra . '>hello</div>' ),
			'common characters'    => array( "<div class=\"gallery\">\xB1\x60\xA5\xCE\xA6\x72</div>", "<div class=\"gallery\" $extra>\xB1\x60\xA5\xCE\xA6\x72</div>" ),
			'graphical characters' => array( "<div class=\"gallery\">\xA1\x4B\xA1\x4B</div>", "<div class=\"gallery\" $extra>\xA1\x4B\xA1\x4B</div>" ),
		);
	}

	/**
	 * Test add_data_to_container with Big5 (chinese char encoding) characters.
	 *
	 * @covers Jetpack_Carousel::add_data_to_container()
	 * @dataProvider big_5_provider
	 *
	 * @param string $input    Post content saved in WP.
	 * @param string $expected Post content with Carousel data added.
	 */
	public function test_add_data_to_container_with_big_5_input( $input, $expected ) {
		$post_id  = $this->factory->post->create();
		$expected = str_replace( '%%%POST_ID%%%', $post_id, $expected );

		update_option( 'blog_charset', 'big-5' );

		$this->assertEquals( $expected, $this->instance->add_data_to_container( $input ) );
	}
}
