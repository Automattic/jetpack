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
	 * Cleans up after each test.
	 *
	 * @inheritDoc
	 */
	public function tear_down() {
		remove_filter( 'jetpack_is_amp_request', '__return_true' );
		wp_dequeue_script( 'jetpack-carousel' );
		wp_deregister_script( 'jetpack-carousel' );
		parent::tear_down();
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
	 * Test that Jetpack Carousel is not enabled for Gallery blocks using the core lightbox.
	 */
	public function test_filter_gallery_block_render_skips_core_gallery_with_lightbox_enabled() {
		global $post;

		$post          = self::factory()->post->create_and_get();
		$block_content = '<figure class="wp-block-gallery has-nested-images"></figure>';
		$block         = array(
			'blockName' => 'core/gallery',
			'attrs'     => array(
				'linkTo' => 'lightbox',
			),
		);

		$this->assertSame( $block_content, $this->instance->filter_gallery_block_render( $block_content, $block ) );
		$this->assertFalse( wp_script_is( 'jetpack-carousel' ) );
	}

	/**
	 * Test that Jetpack Carousel is still enabled for Gallery blocks without the core lightbox.
	 */
	public function test_filter_gallery_block_render_adds_data_when_core_gallery_lightbox_is_disabled() {
		global $post;

		$post          = self::factory()->post->create_and_get();
		$block_content = '<figure class="wp-block-gallery has-nested-images"></figure>';
		$block         = array(
			'blockName' => 'core/gallery',
			'attrs'     => array(
				'lightbox' => array(
					'enabled' => false,
				),
			),
		);

		$result = $this->instance->filter_gallery_block_render( $block_content, $block );

		$this->assertStringContainsString( 'data-carousel-extra=', $result );
		$this->assertTrue( wp_script_is( 'jetpack-carousel' ) );
	}

	/**
	 * Test that core image attributes are kept when the parent Gallery block uses the core lightbox.
	 */
	public function test_remove_core_lightbox_in_gallery_keeps_image_attributes_when_parent_gallery_lightbox_is_enabled() {
		$parsed_block = array(
			'blockName' => 'core/image',
			'attrs'     => array(
				'id' => 123,
			),
		);
		$parent_block = (object) array(
			'name'       => 'core/gallery',
			'attributes' => array(
				'linkTo' => 'lightbox',
			),
		);

		$result = $this->instance->remove_core_lightbox_in_gallery( $parsed_block, $parsed_block, $parent_block );

		$this->assertSame( $parsed_block, $result );
	}

	/**
	 * Test that core image lightbox settings are removed when Jetpack Carousel handles the parent Gallery block.
	 */
	public function test_remove_core_lightbox_in_gallery_removes_image_lightbox_when_parent_gallery_lightbox_is_disabled() {
		$parsed_block = array(
			'blockName' => 'core/image',
			'attrs'     => array(
				'lightbox' => array(
					'enabled' => true,
				),
			),
		);
		$parent_block = (object) array(
			'name'       => 'core/gallery',
			'attributes' => array(
				'lightbox' => array(
					'enabled' => false,
				),
			),
		);

		$result = $this->instance->remove_core_lightbox_in_gallery( $parsed_block, $parsed_block, $parent_block );

		$this->assertArrayNotHasKey( 'lightbox', $result['attrs'] );
	}
}
