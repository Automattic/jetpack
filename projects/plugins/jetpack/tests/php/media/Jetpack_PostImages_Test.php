<?php
use Automattic\Jetpack\Image_CDN\Image_CDN;
require_once JETPACK__PLUGIN_DIR . 'modules/shortcodes/slideshow.php';

/**
 * @covers Jetpack_PostImages
 * @covers Jetpack_PostImages::from_thumbnail
 */
class Jetpack_PostImages_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @author blobaugh
	 * @author Alda Vigdís <alda.vigdis@automattic.com>
	 * @since 2.7
	 */
	public function test_from_html_single_quotes() {
		$s = '<img ANYTHINGATALLHERE src="bob.jpg" MOREANYTHINGHERE width="200" height="200" alt="Alt Text." />';

		$result = Jetpack_PostImages::from_html( $s );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		$this->assertEquals( 'Alt Text.', $result[0]['alt_text'] );
		$this->assertEquals( 200, $result[0]['src_width'] );
		$this->assertEquals( 200, $result[0]['src_height'] );
	}

	/**
	 * @author blobaugh
	 * @author Alda Vigdís <alda.vigdis@automattic.com>
	 * @since 2.7
	 */
	public function test_from_html_double_quotes() {
		$s = "<img ANYTHINGATALLHERE src='bob.jpg' MOREANYTHINGHERE width='200' height='200' alt='Alt Text.' />";

		$result = Jetpack_PostImages::from_html( $s );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		$this->assertEquals( 'Alt Text.', $result[0]['alt_text'] );
		$this->assertEquals( 200, $result[0]['src_width'] );
		$this->assertEquals( 200, $result[0]['src_height'] );
	}

	/**
	 * Ensure that Gravatar images are not included in the list of images extracted from the post contents (html).
	 *
	 * @since 13.7
	 */
	public function test_from_html_gravatar() {
		$s = '<img class="jetpack-blogging-prompt__answers-gravatar wp-hovercard-attachment grav-hashed grav-hijack" aria-hidden="true" src="https://0.gravatar.com/avatar/89f071d1932fe8c204a3381e00bd6794ddc28bcdb0642f29c9f48beaa5e277af?s=96&d=identicon&r=G">';

		$result = Jetpack_PostImages::from_html( $s );

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Test image size extract in src filename
	 */
	public function test_from_html_size() {
		$s = "<img src='img-2300x1300.jpg' />";

		$result = Jetpack_PostImages::from_html( $s );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		$this->assertEquals( 2300, $result[0]['src_width'] );
		$this->assertEquals( 1300, $result[0]['src_height'] );
	}

	/**
	 * Test ignoring unrealistic image sizes from src filename
	 */
	public function test_from_html_no_size() {
		$s = "<img src='img-851958915511220x220.jpg' />";

		$result = Jetpack_PostImages::from_html( $s );

		$this->assertEquals( array(), $result );
	}

	public function test_from_html_alt_utf8() {
		$s = '<img src="bob.jpg" width="200" height="200" alt="Ḽơᶉëᶆ ȋṕšᶙṁ ḍỡḽǭᵳ ʂǐť ӓṁệẗ" />';

		$result = Jetpack_PostImages::from_html( $s );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		$this->assertEquals( 'Ḽơᶉëᶆ ȋṕšᶙṁ ḍỡḽǭᵳ ʂǐť ӓṁệẗ', $result[0]['alt_text'] );
	}

	/**
	 * @author scotchfield
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
	 * Create a post with a gallery shortcode containing a few images attached to the post.
	 *
	 * @since 13.2.0
	 *
	 * @return array $post_info {
	 * An array of information about our post.
	 *  @type int   $post_id  Post ID.
	 *  @type array $img_urls Image URLs we'll look to extract.
	 * }
	 */
	protected function get_post_with_gallery_shortcode() {
		$img_urls       = array(
			'image.jpg'  => 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/image.jpg',
			'image2.jpg' => 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/image2.jpg',
		);
		$img_dimensions = array(
			'width'  => 300,
			'height' => 250,
		);
		$alt_text       = 'An image in a gallery shortcode';

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
			update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt_text );

			// Update our array to store attachment IDs. We'll need them later.
			$img_urls[ $attachment_id ] = wp_get_attachment_url( $attachment_id );
			unset( $img_urls[ $img_name ] );
		}

		// Gallery markup.
		$gallery_html = sprintf(
			'[gallery ids="%s"]',
			implode( ',', array_keys( $img_urls ) )
		);
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => $gallery_html,
			)
		);

		return array(
			'post_id'  => $post_id,
			'img_urls' => array_values( $img_urls ),
		);
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_from_gallery_is_array() {
		$post_info = $this->get_post_with_gallery_shortcode();

		$images = Jetpack_PostImages::from_gallery( $post_info['post_id'] );

		$this->assertIsArray( $images );
	}

	/**
	 * @author robfelty
	 * @since 13.2
	 */
	public function test_from_gallery_is_correct_array() {
		$post_info = $this->get_post_with_gallery_shortcode();

		$images   = Jetpack_PostImages::from_gallery( $post_info['post_id'] );
		$alt_text = 'An image in a gallery shortcode';

		$this->assertIsArray( $images );
		$this->assertCount( 2, $images );
		$this->assertEquals( $post_info['img_urls'][0], $images[0]['src'] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
		$this->assertEquals( $alt_text, $images[0]['alt_text'] );
		$this->assertEquals( $post_info['img_urls'][1], $images[1]['src'] );
		$this->assertEquals( 300, $images[1]['src_width'] );
		$this->assertEquals( 250, $images[1]['src_height'] );
	}

	/**
	 * @author scotchfield
	 * @author Alda Vigdís <alda.vigdis@automattic.com>
	 * @since 3.2
	 */
	public function test_from_attachment_is_correct_array() {
		$img_name       = 'image.jpg';
		$alt_text       = 'Alt Text.';
		$img_dimensions = array(
			'width'  => 300,
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
		$img_html = '<img src="' . $img_url . '" width="300" height="250" alt="' . $alt_text . '"/>';

		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => $img_html,
			)
		);

		$images = Jetpack_PostImages::from_attachment( $post_id );

		$this->assertCount( 1, $images );
		$this->assertEquals( $img_url, $images[0]['src'] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
		$this->assertEquals( $alt_text, $images[0]['alt_text'] );
	}

	/**
	 * @author robfelty
	 * @since 13.2
	 */
	public function test_from_attachment_without_meta_is_correct_array() {
		$img_name = 'image-250x200.jpg';
		$alt_text = '250 x 200 image.';

		$post_id       = self::factory()->post->create();
		$attachment_id = self::factory()->attachment->create_object(
			$img_name,
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
				'post_type'      => 'attachment',
			)
		);
		$img_meta      = array(
			'width'  => 1024,
			'height' => 768,
		);
		wp_update_attachment_metadata( $attachment_id, $img_meta );
		update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt_text );

		$img_url  = wp_get_attachment_url( $attachment_id );
		$img_html = '<img src="' . $img_url . '" alt="' . $alt_text . '"/>';

		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => $img_html,
			)
		);

		add_filter( 'jetpack_postimages_ignore_minimum_dimensions', '__return_true', 66 );
		$images = Jetpack_PostImages::from_html( $post_id );
		remove_filter( 'jetpack_postimages_ignore_minimum_dimensions', '__return_true', 66 );

		$this->assertCount( 1, $images );
		$this->assertEquals( $img_url, $images[0]['src'] );
		$this->assertEquals( 250, $images[0]['src_width'] );
		$this->assertEquals( 200, $images[0]['src_height'] );
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
			'width'  => 300,
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
	 * @since 6.9.0
	 */
	public function test_from_image_block_from_post_id_is_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
		}

		$post_info = $this->get_post_with_image_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertCount( 1, $images );
	}

	/**
	 * Test if the array extracted from Image blocks include the image URL and alt text.
	 *
	 * @since 6.9.0
	 */
	public function test_from_image_block_from_post_id_is_correct_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
		}

		$post_info = $this->get_post_with_image_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $post_info['img_url'], $images[0]['src'] );
		$this->assertEquals( $post_info['alt_text'], $images[0]['alt_text'] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
	}

	/**
	 * Test if an image block with an externally hosted image is not extracted by Post Images.
	 *
	 * @since 6.9.0
	 */
	public function test_from_image_block_from_html_is_empty_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
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
			'width'  => 300,
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
	 * @since 6.9.0
	 */
	public function test_from_gallery_block_from_post_id_is_correct_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
		}

		$post_info = $this->get_post_with_gallery_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $images[0]['src'], $post_info['img_urls'][0] );
		$this->assertEquals( $images[1]['src'], $post_info['img_urls'][1] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
	}

	/**
	 * Test if the array extracted from Gallery blocks include the image URL.
	 *
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
			'width'  => 300,
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
	 * @since 7.8.0
	 */
	public function test_from_columns_block_from_post_id_is_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
		}

		$post_info = $this->get_post_with_columns_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertCount( 1, $images );
	}

	/**
	 * Test if the array extracted from Colunms blocks include the image URL and alt text.
	 *
	 * @since 7.8.0
	 */
	public function test_from_columns_block_from_post_id_is_correct_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
		}

		$post_info = $this->get_post_with_columns_block();

		$images = Jetpack_PostImages::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $post_info['img_url'], $images[0]['src'] );
		$this->assertEquals( $post_info['alt_text'], $images[0]['alt_text'] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
	}

	/**
	 * Test if a Colunms block with an externally hosted image is not extracted by Post Images.
	 *
	 * @since 6.9.0
	 */
	public function test_from_columns_block_from_html_is_empty_array() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
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
	 * @since 9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_no_videopress() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
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
	 * @since 9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_videopress() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
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
	 * @since 9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_videopress_wpcom() {
		if ( ! function_exists( 'parse_blocks' ) ) {
			$this->markTestSkipped( 'parse_blocks not available. Block editor not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
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
	public static function provider_gravatar_invalid_posts() {

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

	/**
	 * Test image resizing with Photon when image is too large.
	 *
	 * @since 14.6
	 * @see https://github.com/Automattic/jetpack/issues/40349
	 */
	public function test_from_thumbnail_resizes_large_image_with_photon() {
		// Mock photon being active
		add_filter(
			'jetpack_active_modules',
			function ( $modules ) {
				$modules[] = 'photon';
				return $modules;
			}
		);

		Image_CDN::instance();

		// Create test image attachment
		$filename = dirname( __DIR__ ) . '/files/large-featured-image.png';
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$this->assertFalse( $upload['error'] );

		$attachment_id = $this->make_attachment( $upload );

		// Create post and set featured image
		$post_id = self::factory()->post->create();
		set_post_thumbnail( $post_id, $attachment_id );

		// Get image data
		$images = Jetpack_PostImages::from_thumbnail( $post_id );

		$this->assertCount( 1, $images );
		$this->assertEquals( 1200, $images[0]['src_width'] );
		$this->assertEquals( 800, $images[0]['src_height'] );
		$this->assertStringContainsString( 'i0.wp.com', $images[0]['src'], 'Image URL should be transformed by Photon' );

		remove_all_filters( 'jetpack_active_modules' );
	}

	/**
	 * Test image resizing with Photon when custom image size exists.
	 *
	 * @since 14.6
	 * @see https://github.com/Automattic/jetpack/issues/40349
	 */
	public function test_from_thumbnail_resizes_large_image_with_photon_and_custom_size() {
		// Mock photon being active
		add_filter(
			'jetpack_active_modules',
			function ( $modules ) {
				$modules[] = 'photon';
				return $modules;
			}
		);

		Image_CDN::instance();

		// Add custom image size with hard crop.
		add_image_size( 'test-size', 1200, 1200, true );

		// Create test image attachment
		$filename = dirname( __DIR__ ) . '/files/large-featured-image.png';
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$this->assertFalse( $upload['error'] );

		$attachment_id = $this->make_attachment( $upload );

		// Create post and set featured image
		$post_id = self::factory()->post->create();
		set_post_thumbnail( $post_id, $attachment_id );

		// Get image data
		$images = Jetpack_PostImages::from_thumbnail( $post_id );

		$this->assertCount( 1, $images );
		$this->assertEquals( 1200, $images[0]['src_width'] );
		$this->assertEquals( 800, $images[0]['src_height'] );
		$this->assertStringContainsString( 'i0.wp.com', $images[0]['src'], 'Image URL should be transformed by Photon' );

		// Cleanup
		remove_image_size( 'test-size' );
		remove_all_filters( 'jetpack_active_modules' );
	}

	/**
	 * Data provider for test_determine_thumbnail_size_for_photon.
	 *
	 * @return array Test cases with original dimensions and expected output.
	 */
	public static function provide_thumbnail_sizes_for_photon() {
		return array(
			'landscape_image'           => array(
				2000, // Original width
				1333, // Original height
				array(
					'width'  => 1200,
					'height' => 800,
				), // Expected dimensions
			),
			'portrait_image'            => array(
				1333, // Original width
				2000, // Original height
				array(
					'width'  => 800,
					'height' => 1200,
				), // Expected dimensions
			),
			'square_image'              => array(
				2000, // Original width
				2000, // Original height
				array(
					'width'  => 1200,
					'height' => 1200,
				), // Expected dimensions
			),
			'small_image'               => array(
				800, // Original width
				600, // Original height
				array(
					'width'  => 800,
					'height' => 600,
				), // Expected dimensions - no resize needed
			),
			'image_virtually_same_size' => array(
				1201, // Original width
				672, // Original height
				array(
					'width'  => 1201,
					'height' => 672,
				), // Close enough to 1200 to not resize.
			),
		);
	}

	/**
	 * Tests if the ::determine_thumbnail_size_for_photon method returns the correct size.
	 *
	 * @since 14.6
	 * @see https://github.com/Automattic/jetpack/issues/40349
	 * @dataProvider provide_thumbnail_sizes_for_photon
	 * @param int   $original_width Width of the original image.
	 * @param int   $original_height Height of the original image.
	 * @param array $expected Expected dimensions after resize.
	 */
	public function test_determine_thumbnail_size_for_photon( $original_width, $original_height, $expected ) {
		$max_dimension = Jetpack_PostImages::get_max_thumbnail_dimension();
		if ( 1200 !== $max_dimension ) {
			$this->markTestSkipped( 'Max dimension is not 1200px, skipping test as the data provider assumes 1200px max dimension.' );
		}
		$this->assertSame( $expected, Jetpack_PostImages::determine_thumbnail_size_for_photon( $original_width, $original_height ) );
	}

	/**
	 * Helper function to create an attachment
	 *
	 * @param array $upload Upload data array.
	 * @return int Attachment ID.
	 */
	protected function make_attachment( $upload ) {
		$type = '';
		if ( ! empty( $upload['type'] ) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'] );
			if ( $mime ) {
				$type = $mime['type'];
			}
		}

		$attachment = array(
			'post_title'     => basename( $upload['file'] ),
			'post_content'   => '',
			'post_type'      => 'attachment',
			'post_parent'    => 0,
			'post_mime_type' => $type,
			'guid'           => $upload['url'],
		);

		$id = wp_insert_attachment( $attachment, $upload['file'] );

		// Make sure wp_generate_attachment_metadata creates the intermediate sizes
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$metadata = wp_generate_attachment_metadata( $id, $upload['file'] );

		wp_update_attachment_metadata( $id, $metadata );

		return $id;
	}
} // end class
