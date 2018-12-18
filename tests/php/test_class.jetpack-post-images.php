<?php

class WP_Test_Jetpack_PostImages extends WP_UnitTestCase {

	/**
	 * @author blobaugh
	 * @covers Jetpack_PostImages::from_html
	 * @since 2.7
	 */
	public function test_from_html_single_quotes() {
		$s = '<img ANYTHINGATALLHERE src="bob.jpg" MOREANYTHINGHERE width="200" height="200" />';

		$result = Jetpack_PostImages::from_html( $s );

		$this->assertInternalType( 'array', $result );
		$this->assertFalse( empty( $result ) );
	}

	/**
	 * @author blobaugh
	 * @covers Jetpack_PostImages::from_html
	 * @since 2.7
	 */
	public function test_from_html_double_quotes() {
		$s = "<img ANYTHINGATALLHERE src='bob.jpg' MOREANYTHINGHERE width='200' height='200' />";

		$result = Jetpack_PostImages::from_html( $s );


		$this->assertInternalType( 'array', $result );
		$this->assertFalse( empty( $result ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_PostImages::from_slideshow
	 * @since 3.2
	 */
	public function test_from_slideshow_is_array() {
		require_once plugin_dir_path( realpath( dirname( __FILE__ ) . '/../../modules/shortcodes/slideshow.php' ) ) . 'slideshow.php';

		$slideshow = new Jetpack_Slideshow_Shortcode();

		$post_id = $this->factory->post->create( array(
			'post_content' => '[slideshow]',
		) );

		$images = Jetpack_PostImages::from_slideshow( $post_id );

		$this->assertInternalType( 'array', $images );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_PostImages::from_gallery
	 * @since 3.2
	 */
	public function test_from_gallery_is_array() {
		$post_id = $this->factory->post->create( array(
			'post_content' => '[gallery 1,2,3]',
		) );

		$images = Jetpack_PostImages::from_gallery( $post_id );

		$this->assertInternalType( 'array', $images );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_PostImages::from_attachment
	 * @since 3.2
	 */
	public function test_from_attachment_is_correct_array() {
		$img_name = 'image.jpg';
		$img_url = 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/' . $img_name;
		$img_html = '<img src="' . $img_url . '" width="250" height="250"/>';
		$img_dimensions = array( 'width' => 250, 'height' => 250 );

		$post_id = $this->factory->post->create( array(
			'post_content' => $img_html,
		) );
		$attachment_id = $this->factory->attachment->create_object( $img_name, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		wp_update_attachment_metadata( $attachment_id, $img_dimensions );

		$images = Jetpack_PostImages::from_attachment( $post_id );

		$this->assertEquals( count( $images ), 1 );
		$this->assertEquals( $images[ 0 ][ 'src' ], $img_url );
	}

	/**
	 * Create a post with an image block containing a large image attached to another post.
	 *
	 * @since 6.9.0
	 *
	 * @return array $post_info {
	 * An array of information about our post.
	 * 	@type int $post_id Post ID.
	 * 	@type string $img_url Image URL we'll look to extract.
	 * }
	 */
	protected function get_post_with_image_block() {
		$img_name = 'image.jpg';
		$img_url = 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/' . $img_name;
		$img_dimensions = array( 'width' => 250, 'height' => 250 );

		$post_id = $this->factory->post->create();
		$attachment_id = $this->factory->attachment->create_object( $img_name, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		wp_update_attachment_metadata( $attachment_id, $img_dimensions );

		// Create another post with that picture.
		$post_html = sprintf(
			'<!-- wp:image {"id":%2$d} --><div class="wp-block-image"><figure class="wp-block-image"><img src="%1$s" alt="" class="wp-image-%2$d"/></figure></div><!-- /wp:image -->',
			$img_url,
			$attachment_id
		);
		$second_post_id = $this->factory->post->create( array(
			'post_content' => $post_html,
		) );

		return array(
			'post_id' => $second_post_id,
			'img_url' => $img_url,
		);
	}

	/**
	 * Test if an array of images can be extracted from Image blocks in the new block editor.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_blocks_from_post_id_is_array() {
		$post_info = $this->get_post_with_image_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertEquals( count( $images ), 1 );
	}

	/**
	 * Test if the array extracted from Image blocks include the image URL.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_blocks_from_post_id_is_correct_array() {
		$post_info = $this->get_post_with_image_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $images[ 0 ][ 'src' ], $post_info['img_url'] );
	}

	/**
	 * Test if an image block with an externally hosted image is not extracted by Post Images.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_blocks_from_html_is_empty_array() {
		$html = '<!-- wp:image --><div class="wp-block-image"><figure class="wp-block-image"><img src="https://example.com/image.jpg" alt=""/></figure></div><!-- /wp:image -->';

		$images = Jetpack_PostImages::from_blocks( $html );

		$this->assertEmpty( $images );
	}
} // end class
