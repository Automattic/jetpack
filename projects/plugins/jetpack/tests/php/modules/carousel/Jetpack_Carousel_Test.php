<?php
/**
 * Tests for Jetpack_Carousel.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/carousel/jetpack-carousel.php';

/**
 * Class Jetpack_Carousel_Test
 *
 * @covers \Jetpack_Carousel
 */
#[CoversClass( Jetpack_Carousel::class )]
class Jetpack_Carousel_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

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
	public function set_up() {
		parent::set_up();
		$this->instance = new Jetpack_Carousel();
	}

	/**
	 * Creates an image attachment populated with EXIF image metadata.
	 *
	 * @return WP_Post The attachment post object.
	 */
	private function create_image_attachment_with_exif() {
		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => dirname( __DIR__, 2 ) . '/jetpack-icon.jpg',
				'post_parent'    => 0,
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'Test Image',
				'post_content'   => 'Test Image Description',
				'post_excerpt'   => 'Test Image Caption',
				'post_status'    => 'publish',
			)
		);

		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'width'      => 100,
				'height'     => 100,
				'file'       => 'jetpack-icon.jpg',
				'image_meta' => array(
					'camera'        => 'JetpackCam',
					'aperture'      => '2.8',
					'focal_length'  => '35',
					'shutter_speed' => '0.005',
					'iso'           => '200',
				),
			)
		);

		return get_post( $attachment_id );
	}

	/**
	 * Gets the test data for test_add_data_img_tags_and_enqueue_assets().
	 *
	 * @return array The test data.
	 */
	public static function get_data_img_tags() {
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
	 * @param string      $content The initial content to be filtered.
	 * @param bool        $is_amp Whether this is an AMP endpoint.
	 * @param string|null $expected The filtered content.
	 */
	#[DataProvider( 'get_data_img_tags' )]
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
	 * When the EXIF display option is enabled (the default), add_data_to_images()
	 * should include the data-image-meta attribute.
	 */
	public function test_add_data_to_images_includes_image_meta_when_exif_enabled() {
		update_option( 'carousel_display_exif', 1 );
		$attachment = $this->create_image_attachment_with_exif();

		$attr = $this->instance->add_data_to_images( array(), $attachment );

		$this->assertArrayHasKey( 'data-image-meta', $attr );
		$this->assertStringContainsString( 'JetpackCam', $attr['data-image-meta'] );
		$this->assertArrayHasKey( 'data-attachment-id', $attr );
	}

	/**
	 * When the EXIF display option is disabled, add_data_to_images() should NOT
	 * include the data-image-meta attribute, while still emitting the other
	 * data-* attributes the carousel modal relies on.
	 */
	public function test_add_data_to_images_omits_image_meta_when_exif_disabled() {
		update_option( 'carousel_display_exif', 0 );
		$attachment = $this->create_image_attachment_with_exif();

		$attr = $this->instance->add_data_to_images( array(), $attachment );

		$this->assertArrayNotHasKey( 'data-image-meta', $attr );
		// Other attributes the modal needs must still be present.
		$this->assertArrayHasKey( 'data-attachment-id', $attr );
		$this->assertArrayHasKey( 'data-permalink', $attr );
		$this->assertArrayHasKey( 'data-image-title', $attr );
	}
}
