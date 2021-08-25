<?php

namespace Automattic\Jetpack\PostList;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Post_Image class.
 *
 * @package automattic/jetpack-post-list
 */
class Test_Post_Image extends TestCase {
	/**
	 * Return null if our class value exists, but it's outside a class attribute.
	 */
	public function test_return_null_when_not_in_class() {
		$post_content = 'wp-image-24';

		$attachment_id = Post_Image::get_first_image_id_from_post_content( $post_content );
		$this->assertSame( null, $attachment_id );
	}

	/**
	 * Return null if our class value exists, but it's in something other than an image tag.
	 */
	public function test_return_null_when_not_on_an_img() {
		$post_content = '<div class="wp-image-24"></div>';

		$attachment_id = Post_Image::get_first_image_id_from_post_content( $post_content );
		$this->assertSame( null, $attachment_id );
	}

	/**
	 * Returns ID when it is the only class value on the img tag.
	 */
	public function test_find_id_only_class_value() {
		$post_content = '<img class="wp-image-24" />';

		$attachment_id = Post_Image::get_first_image_id_from_post_content( $post_content );
		$this->assertSame( 24, $attachment_id );
	}

	/**
	 * Returns ID when found in the middle of class value.
	 */
	public function test_find_id_in_the_middle() {
		$post_content = '<img class="first wp-image-24 end" />';

		$attachment_id = Post_Image::get_first_image_id_from_post_content( $post_content );
		$this->assertSame( 24, $attachment_id );
	}

	/**
	 * Returns ID when found on the end of class value.
	 */
	public function test_find_id_on_the_end() {
		$post_content = '<img class="first wp-image-24" />';

		$attachment_id = Post_Image::get_first_image_id_from_post_content( $post_content );
		$this->assertSame( 24, $attachment_id );
	}

	/**
	 * Returns ID when found on the front of class value.
	 */
	public function test_find_id_on_the_front() {
		$post_content = '<img class="wp-image-24 end" />';

		$attachment_id = Post_Image::get_first_image_id_from_post_content( $post_content );
		$this->assertSame( 24, $attachment_id );
	}

	/**
	 * Get the image attachment ID from an example post with a gallery.
	 */
	public function test_get_id_from_gallery_image() {
		$post_content_gallery_image = '<!-- wp:paragraph -->
<p>Welcome to WordPress.</p>
<!-- /wp:paragraph -->

<!-- wp:gallery {"ids":[14],"linkTo":"none"} -->
<figure class="wp-block-gallery columns-1 is-cropped"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="http://localhost/wp-content/uploads/2021/08/b311c1481829913164f33a353de10a66-1-1024x448.jpeg" alt="" data-id="14" data-full-url="http://localhost/wp-content/uploads/2021/08/b311c1481829913164f33a353de10a66-1.jpeg" data-link="http://localhost/2021/08/20/hello-world/b311c1481829913164f33a353de10a66-1/" class="wp-image-14"/></figure></li></ul></figure>
<!-- /wp:gallery -->';

		$attachment_id = Post_Image::get_first_image_id_from_post_content( $post_content_gallery_image );
		$this->assertSame( 14, $attachment_id );
	}

	/**
	 * Get the image attachment ID from an example post with a slideshow.
	 */
	public function test_get_id_from_slideshow_image() {
		$post_content_slideshow_image = '<!-- wp:jetpack/slideshow {"ids":[18,5],"sizeSlug":"large"} -->
<div class="wp-block-jetpack-slideshow aligncenter" data-effect="slide"><div class="wp-block-jetpack-slideshow_container swiper-container"><ul class="wp-block-jetpack-slideshow_swiper-wrapper swiper-wrapper"><li class="wp-block-jetpack-slideshow_slide swiper-slide"><figure><img alt="" class="wp-block-jetpack-slideshow_image wp-image-18" data-id="18" src="http://localhost/wp-content/uploads/2021/08/b311c1481829913164f33a353de10a66-2-1024x448.jpeg"/></figure></li><li class="wp-block-jetpack-slideshow_slide swiper-slide"><figure><img alt="" class="wp-block-jetpack-slideshow_image wp-image-5" data-id="5" src="http://localhost/wp-content/uploads/2021/08/201D3C7E-1BAE-4896-81A5-C848E2FC2AD1-1024x768.jpeg"/></figure></li></ul><a class="wp-block-jetpack-slideshow_button-prev swiper-button-prev swiper-button-white" role="button"></a><a class="wp-block-jetpack-slideshow_button-next swiper-button-next swiper-button-white" role="button"></a><a aria-label="Pause Slideshow" class="wp-block-jetpack-slideshow_button-pause" role="button"></a><div class="wp-block-jetpack-slideshow_pagination swiper-pagination swiper-pagination-white"></div></div></div>
<!-- /wp:jetpack/slideshow -->';

		$attachment_id = Post_Image::get_first_image_id_from_post_content( $post_content_slideshow_image );
		$this->assertSame( 18, $attachment_id );
	}

	/**
	 * Get the image attachment ID from an example post with an image block.
	 */
	public function test_get_id_from_image_block() {
		$post_content_image_block = '<!-- wp:image {"id":24,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://localhost/wp-content/uploads/2021/08/b311c1481829913164f33a353de10a66-3-1024x448.jpeg" alt="" class="wp-image-24"/></figure>
<!-- /wp:image -->';

		$attachment_id = Post_Image::get_first_image_id_from_post_content( $post_content_image_block );
		$this->assertSame( 24, $attachment_id );
	}
}
