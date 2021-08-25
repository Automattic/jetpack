<?php

namespace Automattic\Jetpack\PostList;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the admin class.
 *
 * @package automattic/jetpack-post-list
 */
class Test_Post_Image extends TestCase {

	/**
	 * Just getting things stubbed out.
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
}
