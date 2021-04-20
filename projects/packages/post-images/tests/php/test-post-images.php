<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack;

use WorDBless\BaseTestCase;

/**
 * Test Post_Images class
 *
 * @package automattic/jetpack-post-images
 */
class Test_Post_Images extends BaseTestCase {
	/**
	 * Test Alt text.
	 *
	 * @var string
	 */
	private $alt_text = 'Alt Text.';

	/**
	 * Test fetching alt content of images from HTML.
	 *
	 * @covers \Automattic\Jetpack\Post_Images::from_html
	 *
	 * @dataProvider get_html_with_alt_content
	 *
	 * @since 2.7
	 *
	 * @param string $html         HTML markup.
	 * @param string $expected_alt Expected Alt content found in HTML content.
	 */
	public function test_alt_from_html( $html, $expected_alt ) {
		$result = Post_Images::from_html( $html );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		$this->assertEquals( $expected_alt, $result[0]['alt_text'] );
	}

	/**
	 * Sample HTML markup to be examined in test_alt_from_html
	 *
	 * @covers \Automattic\Jetpack\Post_Images::from_html
	 */
	public function get_html_with_alt_content() {
		return array(
			'Double quotes' => array(
				'<img ANYTHINGATALLHERE src="bob.jpg" MOREANYTHINGHERE width="200" height="200" alt="Alt Text." />',
				$this->alt_text,
			),
			'Single quotes' => array(
				"<img ANYTHINGATALLHERE src='bob.jpg' MOREANYTHINGHERE width='200' height='200' alt='Alt Text.' />",
				$this->alt_text,
			),
		);
	}

	/**
	 * Tests that images can be fetched from a gallery shortcode.
	 *
	 * @covers \Automattic\Jetpack\Post_Images::from_gallery
	 *
	 * @since 3.2
	 */
	public function test_from_gallery_is_array() {
		$post_id = wp_insert_post(
			array(
				'post_content' => '[gallery 1,2,3]',
			)
		);

		$images = Post_Images::from_gallery( $post_id );

		$this->assertIsArray( $images );
	}

	/**
	 * Test that we can get info about an image attached to a post.
	 *
	 * @author scotchfield
	 * @author Alda Vigdís <alda.vigdis@automattic.com>
	 * @covers \Automattic\Jetpack\Post_Images::from_attachment
	 * @since 3.2
	 */
	public function test_from_attachment_is_correct_array() {
		$post_id       = wp_insert_post(
			array(
				'post_title'   => 'hello',
				'post_content' => 'world',
				'post_status'  => 'publish',
			)
		);
		$attachment_id = $this->create_upload_object( __DIR__ . '/wp-logo.jpg', array(), $post_id );

		$img_url  = wp_get_attachment_url( $attachment_id );
		$img_html = '<img src="' . $img_url . '" width="250" height="250" alt="' . $this->alt_text . '"/>';

		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => $img_html,
			)
		);

		$images = Post_Images::from_attachment( $post_id );

		$this->assertCount( 1, $images );
		$this->assertEquals( $img_url, $images[0]['src'] );
		$this->assertEquals( $this->alt_text, $images[0]['alt_text'] );
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
		$post_id       = wp_insert_post(
			array(
				'post_title'   => 'hello',
				'post_content' => 'world',
				'post_status'  => 'publish',
			)
		);
		$attachment_id = $this->create_upload_object( __DIR__ . '/wp-logo.jpg', array(), $post_id );

		$img_url = wp_get_attachment_url( $attachment_id );

		// Create another post with that picture.
		$post_html = sprintf(
			'<!-- wp:image {"id":%2$d} --><div class="wp-block-image"><figure class="wp-block-image"><img src="%1$s" alt="" class="wp-image-%2$d"/></figure></div><!-- /wp:image -->',
			$img_url,
			$attachment_id
		);

		$second_post_id = wp_insert_post(
			array(
				'post_content' => $post_html,
			)
		);

		return array(
			'post_id'  => $second_post_id,
			'img_url'  => $img_url,
			'alt_text' => $this->alt_text,
		);
	}

	/**
	 * Test if an array can be extracted from Image blocks, and includes the image URL and alt text.
	 *
	 * @covers \Automattic\Jetpack\Post_Images::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_image_block_from_post_id_is_correct_array() {
		$post_info = $this->get_post_with_image_block();

		$images = Post_Images::from_blocks( $post_info['post_id'] );

		$this->assertCount( 1, $images );
		$this->assertEquals( $post_info['img_url'], $images[0]['src'] );
		$this->assertEquals( $post_info['alt_text'], $images[0]['alt_text'] );
	}

	/**
	 * Test if an image block with an externally hosted image is not extracted by Post Images.
	 *
	 * @covers \Automattic\Jetpack\Post_Images::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_image_block_from_html_is_empty_array() {
		$html = '<!-- wp:image --><div class="wp-block-image"><figure class="wp-block-image"><img src="https://example.com/image.jpg" alt=""/></figure></div><!-- /wp:image -->';

		$images = Post_Images::from_blocks( $html );

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
		$img_urls = array(
			'image.jpg'  => __DIR__ . '/wp-logo.jpg',
			'image2.jpg' => __DIR__ . '/wp-logo.jpg',
		);

		// Create post.
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'hello',
				'post_content' => 'world',
				'post_status'  => 'publish',
			)
		);
		// Attach images.
		foreach ( $img_urls as $img_name => $img_url ) {
			$attachment_id = $this->create_upload_object( $img_url, array(), $post_id );

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
				'https://example.org' . $img_url,
				$img_id
			);
		}
		$gallery_html .= '</ul><!-- /wp:gallery -->';

		// Create another post with those pictures.
		$second_post_id = wp_insert_post(
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
	 * @covers \Automattic\Jetpack\Post_Images::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_gallery_block_from_post_id_is_correct_array() {
		$post_info = $this->get_post_with_gallery_block();

		$images = Post_Images::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $post_info['img_urls'][0], $images[0]['src'] );
		$this->assertEquals( $post_info['img_urls'][1], $images[1]['src'] );
	}

	/**
	 * Test if the array extracted from Gallery blocks include the image URL.
	 *
	 * @covers \Automattic\Jetpack\Post_Images::get_attachment_data
	 * @since 6.9.0
	 */
	public function test_get_attachment_data_returns_false_on_unavailable_data() {
		$this->assertFalse( Post_Images::get_attachment_data( PHP_INT_MAX, '', 200, 200 ) );

		$post = $this->get_post_with_image_block();

		// Testing the height condition.
		$this->assertFalse( Post_Images::get_attachment_data( $post['post_id'], '', 200, PHP_INT_MAX ) );

		// Testing the width condition.
		$this->assertFalse( Post_Images::get_attachment_data( $post['post_id'], '', PHP_INT_MAX, 200 ) );
	}

	/**
	 * Create a post with a columns block that includes an image block, and some text.
	 *
	 * @since 7.8.0
	 *
	 * @return array $post_info {
	 * An array of information about our post.
	 * @type int $post_id Post ID.
	 * @type string $img_url Image URL we'll look to extract.
	 * }
	 */
	protected function get_post_with_columns_block() {
		$post_id       = wp_insert_post( array() );
		$attachment_id = $this->create_upload_object( __DIR__ . '/wp-logo.jpg', array(), $post_id );

		$img_url = wp_get_attachment_url( $attachment_id );

		// Create another post with that picture.
		$post_html = sprintf(
			'<!-- wp:columns --><div class="wp-block-columns has-2-columns"><!-- wp:column --><div class="wp-block-column"><!-- wp:image {"id":%2$d} --><figure class="wp-block-image"><img src="%1$s" alt="" class="wp-image-%2$d"/></figure><!-- /wp:image --></div><!-- /wp:column --><!-- wp:column --><div class="wp-block-column"><!-- wp:paragraph --><p>Some text</p><!-- /wp:paragraph --></div><!-- /wp:column --></div><!-- /wp:columns -->',
			$img_url,
			$attachment_id
		);

		$second_post_id = wp_insert_post(
			array(
				'post_content' => $post_html,
			)
		);

		return array(
			'post_id'  => $second_post_id,
			'img_url'  => $img_url,
			'alt_text' => $this->alt_text,
		);
	}

	/**
	 * Test if an array of images can be extracted from column blocks in the new block editor.
	 *
	 * @covers \Automattic\Jetpack\Post_Images::from_blocks
	 *
	 * @since 7.8.0
	 */
	public function test_from_columns_block_from_post_id_is_array() {
		$post_info = $this->get_post_with_columns_block();

		$images = Post_Images::from_blocks( $post_info['post_id'] );

		$this->assertCount( 1, $images );
	}

	/**
	 * Test if the array extracted from Colunms blocks include the image URL and alt text.
	 *
	 * @covers \Automattic\Jetpack\Post_Images::from_blocks
	 *
	 * @since 7.8.0
	 */
	public function test_from_columns_block_from_post_id_is_correct_array() {
		$post_info = $this->get_post_with_columns_block();

		$images = Post_Images::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $post_info['img_url'], $images[0]['src'] );
		$this->assertEquals( $post_info['alt_text'], $images[0]['alt_text'] );
	}

	/**
	 * Test if a Colunms block with an externally hosted image is not extracted by Post Images.
	 *
	 * @covers \Automattic\Jetpack\Post_Images::from_blocks
	 * @since 6.9.0
	 */
	public function test_from_columns_block_from_html_is_empty_array() {
		$html = '<!-- wp:columns --><div class="wp-block-columns has-2-columns"><!-- wp:column --><div class="wp-block-column"><!-- wp:image --><figure class="wp-block-image"><img src="https://example.com/image.jpg" alt=""/></figure><!-- /wp:image --></div><!-- /wp:column --><!-- wp:column --><div class="wp-block-column"><!-- wp:paragraph --><p>Some text</p><!-- /wp:paragraph --></div><!-- /wp:column --></div><!-- /wp:columns -->';

		$images = Post_Images::from_blocks( $html );

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
		$img_args = array(
			'width'  => 1080,
			'height' => 1920,
		);
		$post_id  = wp_insert_post( array() );

		foreach ( $media_items as $key => $media ) {
			$img_args['mime_type'] = $media['mime_type'];
			$attachment_id         = $this->create_upload_object( __DIR__ . '/wp-logo.jpg', $img_args, $post_id );

			if ( 'video/videopress' === $media['mime_type'] ) {
				if ( $wpcom_mode ) {
					$videopress_meta = array(
						'thumb' => str_replace( 'mp4', 'jpg', wp_basename( wp_get_attachment_url( $attachment_id ) ) ),
					);
				} else {
					$videopress_meta = array(
						'videopress' => array(
							'poster' => str_replace( 'mp4', 'jpg', wp_get_attachment_url( $attachment_id ) ),
							'width'  => $img_args['width'],
							'height' => $img_args['height'],
						),
					);
				}

				wp_update_attachment_metadata( $attachment_id, array_merge( $img_args, $videopress_meta ) ); // careful here, before instead of img_args we were using just image dimensions.
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
				$img_args['width'],
				$img_args['height']
			);
		}
		$story_html  = rtrim( $story_html, ',' );
		$story_html .= ']} --><div class="wp-block-jetpack-story wp-story"></div><!-- /wp:jetpack/story -->';

		// Create another post with that story.
		$second_post_id = wp_insert_post( array( 'post_content' => $story_html ) );

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
	 * @covers \Automattic\Jetpack\Post_Images::from_blocks
	 * @since 9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_no_videopress() {
		$media_types = array( 'image', 'video' );
		$post_info   = $this->get_post_with_story_block( $media_types );

		$images = Post_Images::from_blocks( $post_info['post_id'] );

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
	 * @covers \Automattic\Jetpack\Post_Images::from_blocks
	 * @since 9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_videopress() {
		$media_types = array( 'image', 'videopress' );
		$post_info   = $this->get_post_with_story_block( $media_types );

		$images = Post_Images::from_blocks( $post_info['post_id'] );

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
	 * @covers \Automattic\Jetpack\Post_Images::from_blocks
	 * @since 9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_videopress_wpcom() {
		$media_types = array( 'image', 'videopress' );
		$post_info   = $this->get_post_with_story_block( $media_types, true );

		$images = Post_Images::from_blocks( $post_info['post_id'] );

		$this->assertCount( 2, $images );

		$this->assertEquals( $post_info['img_urls'][0], $images[0]['src'] );

		// The second media is a VideoPress video, so expect a poster URL.
		$expected_poster_url = str_replace( 'mp4', 'jpg', $post_info['img_urls'][1] );
		$this->assertEquals( $expected_poster_url, $images[1]['src'] );
	}

	/**
	 * Create a media attachment.
	 *
	 * @param string $file     File path.
	 * @param array  $img_args Array of extra info about image.
	 * @param int    $parent   Parent post ID.
	 *
	 * @return int Attachment ID.
	 */
	public function create_upload_object( $file, $img_args, $parent = 0 ) {
		$contents       = file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$upload         = wp_upload_bits( basename( $file ), null, $contents );
		$img_dimensions = array(
			'width'  => ! empty( $img_args['width'] ) ? $img_args['width'] : 250,
			'height' => ! empty( $img_args['height'] ) ? $img_args['height'] : 250,
		);

		$type = '';
		if ( ! empty( $upload['type'] ) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'], null );
			if ( $mime ) {
				$type = $mime['type'];
			}
		}

		$attachment = array(
			'post_title'     => basename( $upload['file'] ),
			'post_content'   => '',
			'post_type'      => 'attachment',
			'post_parent'    => $parent,
			'post_mime_type' => ! empty( $img_args['mime_type'] ) ? $img_args['mime_type'] : $type,
			'guid'           => 'https://example.org' . $upload['url'],
		);

		// Save the data.

		$id = wp_insert_attachment( $attachment, $upload['file'], $parent );

		// Update general metadata.
		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );

		// Update dimensions.
		wp_update_attachment_metadata( $id, $img_dimensions );

		// Update alt text.
		update_post_meta( $id, '_wp_attachment_image_alt', $this->alt_text );

		return $id;
	}
}
