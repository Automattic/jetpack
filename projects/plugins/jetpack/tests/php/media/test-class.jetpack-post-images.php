<?php

require_jetpack_file( 'modules/shortcodes/slideshow.php' );

class WP_Test_Jetpack_PostImages extends WP_UnitTestCase {

	/**
	 * @author blobaugh
	 * @author Alda Vigdís <alda.vigdis@automattic.com>
	 * @covers Jetpack_PostImages::from_html
	 * @since 2.7
	 */
	public function test_from_html_single_quotes() {
		$s = '<img ANYTHINGATALLHERE src="bob.jpg" MOREANYTHINGHERE width="200" height="200" alt="Alt Text." />';

		$result = Jetpack_PostImages::from_html( $s );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		$this->assertEquals( 'Alt Text.', $result[0]['alt_text'] );
	}

	/**
	 * @author blobaugh
	 * @author Alda Vigdís <alda.vigdis@automattic.com>
	 * @covers Jetpack_PostImages::from_html
	 * @since 2.7
	 */
	public function test_from_html_double_quotes() {
		$s = "<img ANYTHINGATALLHERE src='bob.jpg' MOREANYTHINGHERE width='200' height='200' alt='Alt Text.' />";

		$result = Jetpack_PostImages::from_html( $s );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		$this->assertEquals( 'Alt Text.', $result[0]['alt_text'] );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_PostImages::from_slideshow
	 * @since 3.2
	 */
	public function test_from_slideshow_is_array() {
		$slideshow = new Jetpack_Slideshow_Shortcode(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		$post_id = self::factory()->post->create(
			array(
				'post_content' => '[slideshow]',
			)
		);

		$images = Jetpack_PostImages::from_slideshow( $post_id );

		$this->assertIsArray( $images );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_PostImages::from_gallery
	 * @since 3.2
	 */
	public function test_from_gallery_is_array() {
		$post_id = self::factory()->post->create(
			array(
				'post_content' => '[gallery 1,2,3]',
			)
		);

		$images = Jetpack_PostImages::from_gallery( $post_id );

		$this->assertIsArray( $images );
	}

	/**
	 * @author scotchfield
	 * @author Alda Vigdís <alda.vigdis@automattic.com>
	 * @covers Jetpack_PostImages::from_attachment
	 * @since 3.2
	 */
	public function test_from_attachment_is_correct_array() {
		$img_name       = 'image.jpg';
		$alt_text       = 'Alt Text.';
		$img_dimensions = array(
			'width'  => 250,
			'height' => 250,
		);

		$post_id       = self::factory()->post->create();
		$attachment_id = self::factory()->attachment->create_object(
			$img_name,
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
				'post_type'      => 'attachment',
			)
		);
		wp_update_attachment_metadata( $attachment_id, $img_dimensions );
		update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt_text );

		$img_url  = wp_get_attachment_url( $attachment_id );
		$img_html = '<img src="' . $img_url . '" width="250" height="250" alt="' . $alt_text . '"/>';

		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => $img_html,
			)
		);

		$images = Jetpack_PostImages::from_attachment( $post_id );

		$this->assertCount( 1, $images );
		$this->assertEquals( $img_url, $images[0]['src'] );
		$this->assertEquals( $alt_text, $images[0]['alt_text'] );
	}

	/**
	 * Create a post with an image block containing a large image attached to another post.
	 *
	 * @since 6.9.0
	 *
	 * @return array $post_info {
	 * An array of information about our post.
	 *  @type int $post_id Post ID.
	 *  @type string $img_url Image URL we'll look to extract.
	 * }
	 */
	protected function get_post_with_image_block() {
		$img_name       = 'image.jpg';
		$alt_text       = 'Alt Text.';
		$img_dimensions = array(
			'width'  => 250,
			'height' => 250,
		);

		$post_id       = self::factory()->post->create();
		$attachment_id = self::factory()->attachment->create_object(
			$img_name,
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
				'post_type'      => 'attachment',
			)
		);
		wp_update_attachment_metadata( $attachment_id, $img_dimensions );
		update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt_text );

		$img_url = wp_get_attachment_url( $attachment_id );

		// Create another post with that picture.
		$post_html = sprintf(
			'<!-- wp:image {"id":%2$d} --><div class="wp-block-image"><figure class="wp-block-image"><img src="%1$s" alt="" class="wp-image-%2$d"/></figure></div><!-- /wp:image -->',
			$img_url,
			$attachment_id
		);

		$second_post_id = self::factory()->post->create(
			array(
				'post_content' => $post_html,
			)
		);

		return array(
			'post_id'  => $second_post_id,
			'img_url'  => $img_url,
			'alt_text' => $alt_text,
		);
	}

	/**
	 * Test if an array of images can be extracted from Image blocks in the new block editor.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_image_block_from_post_id_is_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return;
		}

		$post_info = $this->get_post_with_image_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertEquals( count( $images ), 1 );
	}

	/**
	 * Test if the array extracted from Image blocks include the image URL and alt text.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_image_block_from_post_id_is_correct_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return;
		}

		$post_info = $this->get_post_with_image_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $post_info['img_url'], $images[0]['src'] );
		$this->assertEquals( $post_info['alt_text'], $images[0]['alt_text'] );
	}

	/**
	 * Test if an image block with an externally hosted image is not extracted by Post Images.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_image_block_from_html_is_empty_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return;
		}

		$html = '<!-- wp:image --><div class="wp-block-image"><figure class="wp-block-image"><img src="https://example.com/image.jpg" alt=""/></figure></div><!-- /wp:image -->';

		$images = Jetpack_PostImages::from_blocks( $html );

		$this->assertEmpty( $images );
	}

	/**
	 * Create a post with a gallery block containing a few images attached to another post.
	 *
	 * @since 6.9.0
	 *
	 * @return array $post_info {
	 * An array of information about our post.
	 *  @type int   $post_id  Post ID.
	 *  @type array $img_urls Image URLs we'll look to extract.
	 * }
	 */
	protected function get_post_with_gallery_block() {
		$img_urls       = array(
			'image.jpg'  => 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/image.jpg',
			'image2.jpg' => 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/image2.jpg',
		);
		$img_dimensions = array(
			'width'  => 250,
			'height' => 250,
		);

		// Create post.
		$post_id = self::factory()->post->create();
		// Attach images.
		foreach ( $img_urls as $img_name => $img_url ) {
			$attachment_id = self::factory()->attachment->create_object(
				$img_name,
				$post_id,
				array(
					'post_mime_type' => 'image/jpeg',
					'post_type'      => 'attachment',
				)
			);
			wp_update_attachment_metadata( $attachment_id, $img_dimensions );

			// Update our array to store attachment IDs. We'll need them later.
			$img_urls[ $attachment_id ] = wp_get_attachment_url( $attachment_id );
			unset( $img_urls[ $img_name ] );
		}

		// Gallery markup.
		$gallery_html = sprintf(
			'<!-- wp:gallery {"ids":[%s]} --><ul class="wp-block-gallery columns-3 is-cropped">',
			implode( ',', array_keys( $img_urls ) )
		);
		foreach ( $img_urls as $img_id => $img_url ) {
			$gallery_html .= sprintf(
				'<li class="blocks-gallery-item"><figure><img src="%1$s" alt="" data-id="%2$d" class="wp-image-%2$d"/></figure></li>',
				$img_id,
				$img_url
			);
		}
		$gallery_html .= '</ul><!-- /wp:gallery -->';

		// Create another post with those pictures.
		$second_post_id = self::factory()->post->create(
			array(
				'post_content' => $gallery_html,
			)
		);

		return array(
			'post_id'  => $second_post_id,
			'img_urls' => array_values( $img_urls ),
		);
	}

	/**
	 * Test if the array extracted from Gallery blocks include the image URL.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_gallery_block_from_post_id_is_correct_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return;
		}

		$post_info = $this->get_post_with_gallery_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $images[0]['src'], $post_info['img_urls'][0] );
		$this->assertEquals( $images[1]['src'], $post_info['img_urls'][1] );
	}

	/**
	 * Test if the array extracted from Gallery blocks include the image URL.
	 *
	 * @covers Jetpack_PostImages::get_attachment_data
	 * @since 6.9.0
	 */
	public function test_get_attachment_data_returns_false_on_unavailable_data() {
		$this->assertFalse( Jetpack_PostImages::get_attachment_data( PHP_INT_MAX, '', 200, 200 ) );

		$post = $this->get_post_with_image_block();

		// Testing the height condition.
		$this->assertFalse( Jetpack_PostImages::get_attachment_data( $post['post_id'], '', 200, PHP_INT_MAX ) );

		// Testing the width condition.
		$this->assertFalse( Jetpack_PostImages::get_attachment_data( $post['post_id'], '', PHP_INT_MAX, 200 ) );
	}

	/**
	 * Create a post with a columns block that includes an image block, and some text.
	 *
	 * @since 7.8.0
	 *
	 * @return array $post_info {
	 * An array of information about our post.
	 *  @type int $post_id Post ID.
	 *  @type string $img_url Image URL we'll look to extract.
	 * }
	 */
	protected function get_post_with_columns_block() {
		$img_name       = 'image.jpg';
		$alt_text       = 'Alt Text.';
		$img_dimensions = array(
			'width'  => 250,
			'height' => 250,
		);

		$post_id       = self::factory()->post->create();
		$attachment_id = self::factory()->attachment->create_object(
			$img_name,
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
				'post_type'      => 'attachment',
			)
		);
		wp_update_attachment_metadata( $attachment_id, $img_dimensions );
		update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt_text );

		$img_url = wp_get_attachment_url( $attachment_id );

		// Create another post with that picture.
		$post_html = sprintf(
			'<!-- wp:columns --><div class="wp-block-columns has-2-columns"><!-- wp:column --><div class="wp-block-column"><!-- wp:image {"id":%2$d} --><figure class="wp-block-image"><img src="%1$s" alt="" class="wp-image-%2$d"/></figure><!-- /wp:image --></div><!-- /wp:column --><!-- wp:column --><div class="wp-block-column"><!-- wp:paragraph --><p>Some text</p><!-- /wp:paragraph --></div><!-- /wp:column --></div><!-- /wp:columns -->',
			$img_url,
			$attachment_id
		);

		$second_post_id = self::factory()->post->create(
			array(
				'post_content' => $post_html,
			)
		);

		return array(
			'post_id'  => $second_post_id,
			'img_url'  => $img_url,
			'alt_text' => $alt_text,
		);
	}

	/**
	 * Test if an array of images can be extracted from column blocks in the new block editor.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 *
	 * @since 7.8.0
	 */
	public function test_from_columns_block_from_post_id_is_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return;
		}

		$post_info = $this->get_post_with_columns_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertEquals( count( $images ), 1 );
	}

	/**
	 * Test if the array extracted from Colunms blocks include the image URL and alt text.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 *
	 * @since 7.8.0
	 */
	public function test_from_columns_block_from_post_id_is_correct_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return;
		}

		$post_info = $this->get_post_with_columns_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $post_info['img_url'], $images[0]['src'] );
		$this->assertEquals( $post_info['alt_text'], $images[0]['alt_text'] );
	}

	/**
	 * Test if a Colunms block with an externally hosted image is not extracted by Post Images.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_columns_block_from_html_is_empty_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return;
		}

		$html = '<!-- wp:columns --><div class="wp-block-columns has-2-columns"><!-- wp:column --><div class="wp-block-column"><!-- wp:image --><figure class="wp-block-image"><img src="https://example.com/image.jpg" alt=""/></figure><!-- /wp:image --></div><!-- /wp:column --><!-- wp:column --><div class="wp-block-column"><!-- wp:paragraph --><p>Some text</p><!-- /wp:paragraph --></div><!-- /wp:column --></div><!-- /wp:columns -->';

		$images = Jetpack_PostImages::from_blocks( $html );

		$this->assertEmpty( $images );
	}

	/**
	 * Create a post with an image block containing a large image attached to another post.
	 *
	 * @since 9.1.0
	 *
	 * @param array $story_media A representative array of the media in the story. Each is one of 'image', 'video', or 'videopress'.
	 * @param bool  $wpcom_mode  If true, handles VideoPress videos the way WP.com does. Defaults to false.
	 * @return array $post_info {
	 * An array of information about our post.
	 *  @type int $post_id Post ID.
	 *  @type array $img_urls Image URLs we'll look to extract.
	 * }
	 */
	protected function get_post_with_story_block( $story_media, $wpcom_mode = false ) {
		$media_items = array();
		foreach ( $story_media as $story_media ) {
			if ( 'image' === $story_media ) {
				$media_items[] = array(
					'name'      => 'image.jpg',
					'mime_type' => 'image/jpeg',
					'type'      => 'image',
				);
			} elseif ( 'videopress' === $story_media ) {
				$media_items[] = array(
					'name'      => 'video.mp4',
					'mime_type' => 'video/videopress',
					'type'      => 'video',
				);
			} elseif ( 'video' === $story_media ) {
				$media_items[] = array(
					'name'      => 'video.mp4',
					'mime_type' => 'video/mp4',
					'type'      => 'video',
				);
			}
		}
		$img_dimensions = array(
			'width'  => 1080,
			'height' => 1920,
		);

		$post_id = self::factory()->post->create();

		foreach ( $media_items as $key => $media ) {
			$attachment_id = self::factory()->attachment->create_object(
				$media['name'],
				$post_id,
				array(
					'post_mime_type' => $media['mime_type'],
					'post_type'      => 'attachment',
				)
			);
			wp_update_attachment_metadata( $attachment_id, $img_dimensions );

			if ( 'video/videopress' === $media['mime_type'] ) {
				if ( $wpcom_mode ) {
					$videopress_meta = array(
						'thumb' => str_replace( 'mp4', 'jpg', wp_basename( wp_get_attachment_url( $attachment_id ) ) ),
					);
				} else {
					$videopress_meta = array(
						'videopress' => array(
							'poster' => str_replace( 'mp4', 'jpg', wp_get_attachment_url( $attachment_id ) ),
							'width'  => $img_dimensions['width'],
							'height' => $img_dimensions['height'],
						),
					);
				}

				wp_update_attachment_metadata( $attachment_id, array_merge( $img_dimensions, $videopress_meta ) );
			}

			// Update our array to store attachment IDs. We'll need them later.
			$media['attachment_id'] = $attachment_id;
			$media['url']           = wp_get_attachment_url( $attachment_id );
			unset( $media['name'] );
			$media_items[ $key ] = $media;
		}

		$story_html = '<!-- wp:jetpack/story {"mediaFiles":[';
		foreach ( $media_items as $media_item ) {
			$story_html .= sprintf(
				'{"alt":"","id":%1$d,"type":"%2$s","mime":"%3$s","caption":"","width":%4$d,"height":%5$d,"url":"%6$s"},',
				$media_item['attachment_id'],
				$media_item['type'],
				$media_item['mime_type'],
				$media_item['url'],
				$img_dimensions['width'],
				$img_dimensions['height']
			);
		}
		$story_html  = rtrim( $story_html, ',' );
		$story_html .= ']} --><div class="wp-block-jetpack-story wp-story"></div><!-- /wp:jetpack/story -->';

		// Create another post with that story.
		$second_post_id = self::factory()->post->create( array( 'post_content' => $story_html ) );

		$image_urls = array_map(
			function ( $element ) {
				return $element['url'];
			},
			$media_items
		);

		return array(
			'post_id'  => $second_post_id,
			'img_urls' => $image_urls,
		);
	}

	/**
	 * Test if the array extracted from a Story block includes the correct image URLs.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 * @since 9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_no_videopress() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return;
		}

		$media_types = array( 'image', 'video' );
		$post_info   = $this->get_post_with_story_block( $media_types );

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		// We can't get a preview image for non-VideoPress video, so the video
		// should have been skipped and only the image extracted.
		$this->assertCount( 1, $images );

		$this->assertEquals( $post_info['img_urls'][0], $images[0]['src'] );
	}

	/**
	 * Test if the array extracted from a Story block includes the correct image URLs.
	 *
	 * For this test we simulate VideoPress being enabled for the site.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 * @since 9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_videopress() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return;
		}

		$media_types = array( 'image', 'videopress' );
		$post_info   = $this->get_post_with_story_block( $media_types );

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertCount( 2, $images );

		$this->assertEquals( $post_info['img_urls'][0], $images[0]['src'] );

		// The second media is a VideoPress video, so expect a poster URL.
		$expected_poster_url = str_replace( 'mp4', 'jpg', $post_info['img_urls'][1] );
		$this->assertEquals( $expected_poster_url, $images[1]['src'] );
	}

	/**
	 * Test if the array extracted from a Story block includes the correct image URLs.
	 *
	 * For this test we simulate 'WP.com mode' for VideoPress, which has a different structure for attachment meta.
	 *
	 * @covers Jetpack_PostImages::from_blocks
	 * @since 9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_videopress_wpcom() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return;
		}

		$media_types = array( 'image', 'videopress' );
		$post_info   = $this->get_post_with_story_block( $media_types, true );

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertCount( 2, $images );

		$this->assertEquals( $post_info['img_urls'][0], $images[0]['src'] );

		// The second media is a VideoPress video, so expect a poster URL.
		$expected_poster_url = str_replace( 'mp4', 'jpg', $post_info['img_urls'][1] );
		$this->assertEquals( $expected_poster_url, $images[1]['src'] );
	}

	/**
	 * Test if the array extracted is empty in case post_id is invalid.
	 *
	 * @covers Jetpack_PostImages::from_gravatar
	 * @dataProvider provider_gravatar_invalid_posts
	 *
	 * @since 11.4
	 *
	 * @param int|string|null $post_id  The post ID.
	 */
	public function test_from_gravatar_invalid( $post_id ) {
		$image_details = Jetpack_PostImages::from_gravatar( $post_id );
		$this->assertEquals( array(), $image_details );
	}

	/**
	 * Test data for our tests for Jetpack_PostImages::from_gravatar.
	 *
	 * @return array
	 */
	public function provider_gravatar_invalid_posts() {

		return array(
			'invalid (null) post id'                  => array(
				null,
			),
			'post id does not match an existing post' => array(
				5,
			),
		);
	}

	/**
	 * Test if the array extracted has a valid image when sending a valid post.
	 *
	 * @covers Jetpack_PostImages::from_gravatar
	 * @since 11.4
	 */
	public function test_from_gravatar_returns_valid_image() {

		$post_id = self::factory()->post->create();

		$images = Jetpack_PostImages::from_gravatar( $post_id );

		$this->assertCount( 1, $images );
		$this->assertEquals( 'image', $images[0]['type'] );
		$this->assertEquals( 'gravatar', $images[0]['from'] );
		$this->assertStringContainsString( 'gravatar.com/avatar/?s=96&d=mm&r=g', $images[0]['src'] );
		$this->assertEquals( 96, $images[0]['src_width'] );
		$this->assertEquals( 96, $images[0]['src_height'] );
		$this->assertNotEmpty( $images[0]['href'] );
		$this->assertSame( '', $images[0]['alt_text'] );
	}

} // end class
