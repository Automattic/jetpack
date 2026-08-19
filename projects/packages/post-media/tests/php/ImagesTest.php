<?php
/**
 * Tests for the Images class.
 *
 * @package automattic/jetpack-post-media
 */

use Automattic\Jetpack\Post_Media\Images;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Post_Media\Images
 * @covers \Automattic\Jetpack\Post_Media\Images::from_thumbnail
 */
#[CoversClass( Images::class )]
#[CoversMethod( Images::class, 'from_thumbnail' )]
class ImagesTest extends BaseTestCase {

	/**
	 * Set up the test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Set up an admin user so wp_update_post does not apply wp_kses_post sanitization.
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		// Ensure upload directory exists with proper permissions.
		$upload_dir = wp_upload_dir();
		wp_mkdir_p( $upload_dir['basedir'] );
		wp_mkdir_p( $upload_dir['path'] );

		// Force an absolute URL for attachment URLs during testing.
		add_filter(
			'wp_get_attachment_url',
			function ( $url ) {
				$site_url = 'http://example.org';
				if ( ! empty( $url ) && ! preg_match( '/^http(s)?:\/\//i', $url ) ) {
					return $site_url . $url;
				}
				return $url;
			}
		);

		add_filter(
			'upload_dir',
			function ( $upload_dir ) {
				$site_url = 'http://example.org';

				if ( ! preg_match( '/^http(s)?:\/\//i', $upload_dir['url'] ) ) {
					$upload_dir['url'] = $site_url . $upload_dir['url'];
				}

				if ( ! preg_match( '/^http(s)?:\/\//i', $upload_dir['baseurl'] ) ) {
					$upload_dir['baseurl'] = $site_url . $upload_dir['baseurl'];
				}

				return $upload_dir;
			}
		);

		// In WorDBless, image files do not physically exist on disk,
		// so image_downsize() cannot resolve image data.
		// This filter provides the full-size image data from attachment metadata.
		add_filter(
			'image_downsize',
			function ( $out, $id ) {
				$meta = wp_get_attachment_metadata( $id );
				if ( ! $meta || ! isset( $meta['width'] ) || ! isset( $meta['height'] ) ) {
					return $out;
				}
				$url = wp_get_attachment_url( $id );
				if ( ! $url ) {
					return $out;
				}
				return array( $url, $meta['width'], $meta['height'], false );
			},
			10,
			2
		);
	}

	/**
	 * Helper to create a post.
	 *
	 * @param array $args Post arguments.
	 * @return int Post ID.
	 */
	protected function create_post( $args = array() ) {
		$defaults = array(
			'post_status' => 'publish',
			'post_type'   => 'post',
			'post_title'  => 'Test Post',
		);

		return wp_insert_post( array_merge( $defaults, $args ) );
	}

	/**
	 * Helper to create an attachment object.
	 *
	 * @param string $filename Filename.
	 * @param int    $parent Parent post ID.
	 * @param array  $args Attachment arguments.
	 * @return int Attachment ID.
	 */
	protected function create_attachment( $filename, $parent = 0, $args = array() ) {
		$defaults = array(
			'post_title'     => $filename,
			'post_content'   => '',
			'post_type'      => 'attachment',
			'post_parent'    => $parent,
			'post_mime_type' => 'image/jpeg',
		);

		$attachment_data = array_merge( $defaults, $args );
		return wp_insert_attachment( $attachment_data, $filename, $parent );
	}

	/**
	 * @author blobaugh
	 * @author Alda Vigdís <alda.vigdis@automattic.com>
	 * @since jetpack-2.7
	 */
	public function test_from_html_single_quotes() {
		$s = '<img ANYTHINGATALLHERE src="bob.jpg" MOREANYTHINGHERE width="200" height="200" alt="Alt Text." />';

		$result = Images::from_html( $s );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		$this->assertEquals( 'Alt Text.', $result[0]['alt_text'] );
		$this->assertEquals( 200, $result[0]['src_width'] );
		$this->assertEquals( 200, $result[0]['src_height'] );
	}

	/**
	 * @author blobaugh
	 * @author Alda Vigdís <alda.vigdis@automattic.com>
	 * @since jetpack-2.7
	 */
	public function test_from_html_double_quotes() {
		$s = "<img ANYTHINGATALLHERE src='bob.jpg' MOREANYTHINGHERE width='200' height='200' alt='Alt Text.' />";

		$result = Images::from_html( $s );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		$this->assertEquals( 'Alt Text.', $result[0]['alt_text'] );
		$this->assertEquals( 200, $result[0]['src_width'] );
		$this->assertEquals( 200, $result[0]['src_height'] );
	}

	/**
	 * Ensure that Gravatar images are not included in the list of images extracted from the post contents (html).
	 *
	 * @since jetpack-13.7
	 */
	public function test_from_html_gravatar() {
		$s = '<img class="jetpack-blogging-prompt__answers-gravatar wp-hovercard-attachment grav-hashed grav-hijack" aria-hidden="true" src="https://0.gravatar.com/avatar/89f071d1932fe8c204a3381e00bd6794ddc28bcdb0642f29c9f48beaa5e277af?s=96&d=identicon&r=G">';

		$result = Images::from_html( $s );

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Test image size extract in src filename
	 */
	public function test_from_html_size() {
		$s = "<img src='img-2300x1300.jpg' />";

		$result = Images::from_html( $s );

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

		$result = Images::from_html( $s );

		$this->assertEquals( array(), $result );
	}

	public function test_from_html_alt_utf8() {
		$s = '<img src="bob.jpg" width="200" height="200" alt="Ḽơᶉëᶆ ȋṕšᶙṁ ḍỡḽǭᵳ ʂǐť ӓṁệẗ" />';

		$result = Images::from_html( $s );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		$this->assertEquals( 'Ḽơᶉëᶆ ȋṕšᶙṁ ḍỡḽǭᵳ ʂǐť ӓṁệẗ', $result[0]['alt_text'] );
	}

	/**
	 * @author scotchfield
	 * @since jetpack-3.2
	 */
	public function test_from_slideshow_is_array() {
		if ( ! class_exists( 'Jetpack_Slideshow_Shortcode' ) ) {
			$this->markTestSkipped( 'Jetpack_Slideshow_Shortcode not available' );
		}

		$slideshow = new \Jetpack_Slideshow_Shortcode(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- @phan-suppress-current-line PhanUndeclaredClassMethod -- Checked with class_exists().

		$post_id = $this->create_post(
			array(
				'post_content' => '[slideshow]',
			)
		);

		$images = Images::from_slideshow( $post_id );

		$this->assertIsArray( $images );
	}

	/**
	 * Create a post with a gallery shortcode containing a few images attached to the post.
	 *
	 * @since jetpack-13.2.0
	 *
	 * @return array $post_info {
	 * An array of information about our post.
	 *  @type int   $post_id  Post ID.
	 *  @type array $img_urls Image URLs we'll look to extract.
	 * }
	 */
	protected function get_post_with_gallery_shortcode() {
		$img_dimensions = array(
			'width'  => 300,
			'height' => 250,
		);
		$alt_text       = 'An image in a gallery shortcode';

		// Create post.
		$post_id  = $this->create_post();
		$img_urls = array();

		// Attach images.
		foreach ( array( 'image.jpg', 'image2.jpg' ) as $img_name ) {
			$attachment_id = $this->create_attachment(
				$img_name,
				$post_id,
				array(
					'post_mime_type' => 'image/jpeg',
				)
			);
			wp_update_attachment_metadata( $attachment_id, $img_dimensions );
			update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt_text );

			$img_urls[ $attachment_id ] = wp_get_attachment_url( $attachment_id );
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
	 * @since jetpack-3.2
	 */
	public function test_from_gallery_is_array() {
		$post_info = $this->get_post_with_gallery_shortcode();

		$images = Images::from_gallery( $post_info['post_id'] );

		$this->assertIsArray( $images );
	}

	/**
	 * @author robfelty
	 * @since jetpack-13.2
	 */
	public function test_from_gallery_is_correct_array() {
		$post_info = $this->get_post_with_gallery_shortcode();

		$images   = Images::from_gallery( $post_info['post_id'] );
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
	 * Test if WooCommerce product gallery images are extracted from product meta.
	 *
	 * @since 0.1.4
	 */
	public function test_from_gallery_includes_woocommerce_product_gallery_images() {
		$img_dimensions = array(
			'width'  => 300,
			'height' => 250,
		);
		$alt_text       = 'An image in a WooCommerce product gallery';

		$post_id  = $this->create_post(
			array(
				'post_type' => 'product',
			)
		);
		$img_urls = array();

		foreach ( array( 'product-gallery-image.jpg', 'product-gallery-image-2.jpg' ) as $img_name ) {
			$attachment_id = $this->create_attachment(
				$img_name,
				$post_id,
				array(
					'post_mime_type' => 'image/jpeg',
				)
			);
			wp_update_attachment_metadata( $attachment_id, $img_dimensions );
			update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt_text );

			$img_urls[ $attachment_id ] = wp_get_attachment_url( $attachment_id );
		}

		update_post_meta( $post_id, '_product_image_gallery', implode( ',', array_keys( $img_urls ) ) );

		$images = Images::from_gallery( $post_id );

		$this->assertCount( 2, $images );
		$img_urls = array_values( $img_urls );
		$this->assertEquals( $img_urls[0], $images[0]['src'] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
		$this->assertEquals( $alt_text, $images[0]['alt_text'] );
		$this->assertEquals( $img_urls[1], $images[1]['src'] );
		$this->assertEquals( 300, $images[1]['src_width'] );
		$this->assertEquals( 250, $images[1]['src_height'] );
	}

	/**
	 * Test if WooCommerce product gallery meta is ignored for non-product posts.
	 *
	 * @since 0.1.4
	 */
	public function test_from_gallery_ignores_woocommerce_product_gallery_meta_for_non_products() {
		$post_id       = $this->create_post();
		$attachment_id = $this->create_attachment(
			'post-gallery-image.jpg',
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);

		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'width'  => 300,
				'height' => 250,
			)
		);
		update_post_meta( $post_id, '_product_image_gallery', (string) $attachment_id );

		$this->assertEmpty( Images::from_gallery( $post_id ) );
	}

	/**
	 * @author scotchfield
	 * @author Alda Vigdís <alda.vigdis@automattic.com>
	 * @since jetpack-3.2
	 */
	public function test_from_attachment_is_correct_array() {
		$this->markTestSkipped( 'from_attachment() relies on get_posts() to find child attachments, which is not supported in WorDBless.' );
	}

	/**
	 * @author robfelty
	 * @since jetpack-13.2
	 */
	public function test_from_attachment_without_meta_is_correct_array() {
		$img_name = 'image-250x200.jpg';
		$alt_text = '250 x 200 image.';

		$post_id       = $this->create_post();
		$attachment_id = $this->create_attachment(
			$img_name,
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
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
		$images = Images::from_html( $post_id );
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
	 * @since jetpack-6.9.0
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

		$post_id       = $this->create_post();
		$attachment_id = $this->create_attachment(
			$img_name,
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
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

		$second_post_id = $this->create_post(
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
	 * @since jetpack-6.9.0
	 */
	public function test_from_image_block_from_post_id_is_array() {
		$post_info = $this->get_post_with_image_block();

		$images = Images::from_blocks( $post_info['post_id'] );

		$this->assertCount( 1, $images );
	}

	/**
	 * Test if the array extracted from Image blocks include the image URL and alt text.
	 *
	 * @since jetpack-6.9.0
	 */
	public function test_from_image_block_from_post_id_is_correct_array() {
		$post_info = $this->get_post_with_image_block();

		$images = Images::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $post_info['img_url'], $images[0]['src'] );
		$this->assertEquals( $post_info['alt_text'], $images[0]['alt_text'] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
	}

	/**
	 * Test if an image block with an externally hosted image is not extracted by Post Images.
	 *
	 * @since jetpack-6.9.0
	 */
	public function test_from_image_block_from_html_is_empty_array() {
		$html = '<!-- wp:image --><div class="wp-block-image"><figure class="wp-block-image"><img src="https://example.com/image.jpg" alt=""/></figure></div><!-- /wp:image -->';

		$images = Images::from_blocks( $html );

		$this->assertEmpty( $images );
	}

	/**
	 * Create a post with a gallery block containing a few images attached to another post.
	 *
	 * @since jetpack-6.9.0
	 *
	 * @return array $post_info {
	 * An array of information about our post.
	 *  @type int   $post_id  Post ID.
	 *  @type array $img_urls Image URLs we'll look to extract.
	 * }
	 */
	protected function get_post_with_gallery_block() {
		$img_dimensions = array(
			'width'  => 300,
			'height' => 250,
		);

		// Create post.
		$post_id  = $this->create_post();
		$img_urls = array();

		// Attach images.
		foreach ( array( 'image.jpg', 'image2.jpg' ) as $img_name ) {
			$attachment_id = $this->create_attachment(
				$img_name,
				$post_id,
				array(
					'post_mime_type' => 'image/jpeg',
				)
			);
			wp_update_attachment_metadata( $attachment_id, $img_dimensions );

			$img_urls[ $attachment_id ] = wp_get_attachment_url( $attachment_id );
		}

		// Gallery markup.
		$gallery_html = sprintf(
			'<!-- wp:gallery {"ids":[%s]} --><ul class="wp-block-gallery columns-3 is-cropped">',
			implode( ',', array_keys( $img_urls ) )
		);
		foreach ( $img_urls as $img_id => $img_url ) {
			$gallery_html .= sprintf(
				'<li class="blocks-gallery-item"><figure><img src="%1$s" alt="" data-id="%2$d" class="wp-image-%2$d"/></figure></li>',
				$img_url,
				$img_id
			);
		}
		$gallery_html .= '</ul><!-- /wp:gallery -->';

		// Create another post with those pictures.
		$second_post_id = $this->create_post(
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
	 * @since jetpack-6.9.0
	 */
	public function test_from_gallery_block_from_post_id_is_correct_array() {
		$post_info = $this->get_post_with_gallery_block();

		$images = Images::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $images[0]['src'], $post_info['img_urls'][0] );
		$this->assertEquals( $images[1]['src'], $post_info['img_urls'][1] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
	}

	/**
	 * Test if the array extracted from Gallery blocks include the image URL.
	 *
	 * @since jetpack-6.9.0
	 */
	public function test_get_attachment_data_returns_false_on_unavailable_data() {
		$this->assertFalse( Images::get_attachment_data( PHP_INT_MAX, '', 200, 200 ) );

		$post = $this->get_post_with_image_block();

		// Testing the height condition.
		$this->assertFalse( Images::get_attachment_data( $post['post_id'], '', 200, PHP_INT_MAX ) );

		// Testing the width condition.
		$this->assertFalse( Images::get_attachment_data( $post['post_id'], '', PHP_INT_MAX, 200 ) );
	}

	/**
	 * Create a post with a columns block that includes an image block, and some text.
	 *
	 * @since jetpack-7.8.0
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

		$post_id       = $this->create_post();
		$attachment_id = $this->create_attachment(
			$img_name,
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
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

		$second_post_id = $this->create_post(
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
	 * @since jetpack-7.8.0
	 */
	public function test_from_columns_block_from_post_id_is_array() {
		$post_info = $this->get_post_with_columns_block();

		$images = Images::from_blocks( $post_info['post_id'] );

		$this->assertCount( 1, $images );
	}

	/**
	 * Test if the array extracted from Colunms blocks include the image URL and alt text.
	 *
	 * @since jetpack-7.8.0
	 */
	public function test_from_columns_block_from_post_id_is_correct_array() {
		$post_info = $this->get_post_with_columns_block();

		$images = Images::from_blocks( $post_info['post_id'] );

		$this->assertEquals( $post_info['img_url'], $images[0]['src'] );
		$this->assertEquals( $post_info['alt_text'], $images[0]['alt_text'] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
	}

	/**
	 * Test if a Colunms block with an externally hosted image is not extracted by Post Images.
	 *
	 * @since jetpack-6.9.0
	 */
	public function test_from_columns_block_from_html_is_empty_array() {
		$html = '<!-- wp:columns --><div class="wp-block-columns has-2-columns"><!-- wp:column --><div class="wp-block-column"><!-- wp:image --><figure class="wp-block-image"><img src="https://example.com/image.jpg" alt=""/></figure><!-- /wp:image --></div><!-- /wp:column --><!-- wp:column --><div class="wp-block-column"><!-- wp:paragraph --><p>Some text</p><!-- /wp:paragraph --></div><!-- /wp:column --></div><!-- /wp:columns -->';

		$images = Images::from_blocks( $html );

		$this->assertEmpty( $images );
	}

	/**
	 * Create a post with an image block containing a large image attached to another post.
	 *
	 * @since jetpack-9.1.0
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

		$post_id = $this->create_post();

		foreach ( $media_items as $key => $media ) {
			$attachment_id = $this->create_attachment(
				$media['name'],
				$post_id,
				array(
					'post_mime_type' => $media['mime_type'],
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
				$img_dimensions['width'],
				$img_dimensions['height'],
				$media_item['url']
			);
		}
		$story_html  = rtrim( $story_html, ',' );
		$story_html .= ']} --><div class="wp-block-jetpack-story wp-story"></div><!-- /wp:jetpack/story -->';

		// Create another post with that story.
		$second_post_id = $this->create_post( array( 'post_content' => $story_html ) );

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
	 * @since jetpack-9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_no_videopress() {
		$media_types = array( 'image', 'video' );
		$post_info   = $this->get_post_with_story_block( $media_types );

		$images = Images::from_blocks( $post_info['post_id'] );

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
	 * @since jetpack-9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_videopress() {
		$media_types = array( 'image', 'videopress' );
		$post_info   = $this->get_post_with_story_block( $media_types );

		$images = Images::from_blocks( $post_info['post_id'] );

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
	 * @since jetpack-9.1.0
	 */
	public function test_from_story_block_from_post_id_is_correct_array_videopress_wpcom() {
		$media_types = array( 'image', 'videopress' );
		$post_info   = $this->get_post_with_story_block( $media_types, true );

		$images = Images::from_blocks( $post_info['post_id'] );

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
	 * @since jetpack-11.4
	 *
	 * @param int|string|null $post_id  The post ID.
	 */
	#[DataProvider( 'provider_gravatar_invalid_posts' )]
	public function test_from_gravatar_invalid( $post_id ) {
		$image_details = Images::from_gravatar( $post_id );
		$this->assertEquals( array(), $image_details );
	}

	/**
	 * Test data for our tests for Images::from_gravatar.
	 *
	 * @return array
	 */
	public static function provider_gravatar_invalid_posts() {

		return array(
			'invalid (null) post id'                  => array(
				null,
			),
			'post id does not match an existing post' => array(
				PHP_INT_MAX,
			),
		);
	}

	/**
	 * Test if the array extracted has a valid image when sending a valid post.
	 *
	 * @since jetpack-11.4
	 */
	public function test_from_gravatar_returns_valid_image() {

		$post_id = $this->create_post();

		$images = Images::from_gravatar( $post_id );

		$this->assertCount( 1, $images );
		$this->assertEquals( 'image', $images[0]['type'] );
		$this->assertEquals( 'gravatar', $images[0]['from'] );
		$this->assertStringContainsString( 'gravatar.com/avatar/', $images[0]['src'] );
		$this->assertEquals( 96, $images[0]['src_width'] );
		$this->assertEquals( 96, $images[0]['src_height'] );
		$this->assertNotEmpty( $images[0]['href'] );
		$this->assertSame( '', $images[0]['alt_text'] );
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
	 * @since jetpack-14.6
	 * @see https://github.com/Automattic/jetpack/issues/40349
	 * @dataProvider provide_thumbnail_sizes_for_photon
	 * @param int   $original_width Width of the original image.
	 * @param int   $original_height Height of the original image.
	 * @param array $expected Expected dimensions after resize.
	 */
	#[DataProvider( 'provide_thumbnail_sizes_for_photon' )]
	public function test_determine_thumbnail_size_for_photon( $original_width, $original_height, $expected ) {
		$max_dimension = Images::get_max_thumbnail_dimension();
		if ( 1200 !== $max_dimension ) {
			$this->markTestSkipped( 'Max dimension is not 1200px, skipping test as the data provider assumes 1200px max dimension.' );
		}
		$this->assertSame( $expected, Images::determine_thumbnail_size_for_photon( $original_width, $original_height ) );
	}

	/**
	 * Test if an array of images can be extracted from Image blocks using Block_Scanner.
	 *
	 * @since jetpack-14.8
	 * @since jetpack-14.9 Updated to use Block_Scanner.
	 */
	public function test_from_blocks_with_block_scanner() {
		$post_info = $this->get_post_with_image_block();

		$images = Images::from_blocks( $post_info['post_id'] );

		$this->assertCount( 1, $images );
		$this->assertEquals( $post_info['img_url'], $images[0]['src'] );
		$this->assertEquals( $post_info['alt_text'], $images[0]['alt_text'] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
	}

	/**
	 * Test if an array of images can be extracted from Gallery blocks using Block_Scanner.
	 *
	 * @since jetpack-14.8
	 * @since jetpack-14.9 Updated to use Block_Scanner.
	 */
	public function test_from_blocks_with_gallery_block_scanner() {
		$post_info = $this->get_post_with_gallery_block();

		$images = Images::from_blocks( $post_info['post_id'] );

		$this->assertCount( 2, $images );
		$this->assertEquals( $post_info['img_urls'][0], $images[0]['src'] );
		$this->assertEquals( $post_info['img_urls'][1], $images[1]['src'] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
	}

	/**
	 * Test if an array of images can be extracted from Columns blocks using Block_Scanner.
	 *
	 * @since jetpack-14.8
	 * @since jetpack-14.9 Updated to use Block_Scanner.
	 */
	public function test_from_blocks_with_columns_block_scanner() {
		$post_info = $this->get_post_with_columns_block();

		$images = Images::from_blocks( $post_info['post_id'] );

		$this->assertCount( 1, $images );
		$this->assertEquals( $post_info['img_url'], $images[0]['src'] );
		$this->assertEquals( $post_info['alt_text'], $images[0]['alt_text'] );
		$this->assertEquals( 300, $images[0]['src_width'] );
		$this->assertEquals( 250, $images[0]['src_height'] );
	}

	/**
	 * Test if an array of images can be extracted from Story blocks using Block_Scanner.
	 *
	 * @since jetpack-14.8
	 * @since jetpack-14.9 Updated to use Block_Scanner.
	 */
	public function test_from_blocks_with_story_block_scanner() {
		$media_types = array( 'image', 'videopress' );
		$post_info   = $this->get_post_with_story_block( $media_types );

		$images = Images::from_blocks( $post_info['post_id'] );

		$this->assertCount( 2, $images );
		$this->assertEquals( $post_info['img_urls'][0], $images[0]['src'] );

		// The second media is a VideoPress video, so expect a poster URL.
		$expected_poster_url = str_replace( 'mp4', 'jpg', $post_info['img_urls'][1] );
		$this->assertEquals( $expected_poster_url, $images[1]['src'] );
	}

	/**
	 * Test if an array of images can be extracted from mixed blocks using Block_Scanner.
	 *
	 * @since jetpack-14.8
	 * @since jetpack-14.9 Updated to use Block_Scanner.
	 */
	public function test_from_blocks_with_mixed_blocks_scanner() {
		$img_name       = 'image.jpg';
		$alt_text       = 'Alt Text.';
		$img_dimensions = array(
			'width'  => 300,
			'height' => 250,
		);

		$post_id       = $this->create_post();
		$attachment_id = $this->create_attachment(
			$img_name,
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);
		wp_update_attachment_metadata( $attachment_id, $img_dimensions );
		update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt_text );

		$img_url = wp_get_attachment_url( $attachment_id );

		// Create a post with mixed blocks (image, gallery, columns)
		$post_html = sprintf(
			'<!-- wp:image {"id":%2$d} --><div class="wp-block-image"><figure class="wp-block-image"><img src="%1$s" alt="" class="wp-image-%2$d"/></figure></div><!-- /wp:image -->' .
			'<!-- wp:gallery {"ids":[%2$d]} --><figure class="wp-block-gallery has-nested-images columns-default is-cropped"><figure class="wp-block-image"><img src="%1$s" alt="" class="wp-image-%2$d"/></figure></figure><!-- /wp:gallery -->' .
			'<!-- wp:columns --><div class="wp-block-columns has-2-columns"><!-- wp:column --><div class="wp-block-column"><!-- wp:image {"id":%2$d} --><figure class="wp-block-image"><img src="%1$s" alt="" class="wp-image-%2$d"/></figure><!-- /wp:image --></div><!-- /wp:column --><!-- wp:column --><div class="wp-block-column"><!-- wp:paragraph --><p>Some text</p><!-- /wp:paragraph --></div><!-- /wp:column --></div><!-- /wp:columns -->',
			$img_url,
			$attachment_id
		);

		$second_post_id = $this->create_post(
			array(
				'post_content' => $post_html,
			)
		);

		$images = Images::from_blocks( $second_post_id );

		// Should find 3 images (1 from image block, 1 from gallery, 1 from columns)
		$this->assertCount( 3, $images );
		foreach ( $images as $image ) {
			$this->assertEquals( $img_url, $image['src'] );
			$this->assertEquals( $alt_text, $image['alt_text'] );
			$this->assertEquals( 300, $image['src_width'] );
			$this->assertEquals( 250, $image['src_height'] );
		}
	}
	/**
	 * Test that images with the jetpack-ignore-thumbnail CSS class are excluded from from_html().
	 *
	 * Copied from PR #47183.
	 */
	public function test_from_html_ignores_jetpack_ignore_thumbnail_class() {
		$html = '<img src="qr-code-300x300.jpg" width="300" height="300" class="jetpack-ignore-thumbnail" alt="QR Code" />'
			. '<img src="real-image-400x300.jpg" width="400" height="300" alt="Real Image" />';

		$result = Images::from_html( $html );

		$this->assertCount( 1, $result );
		$this->assertStringContainsString( 'real-image', $result[0]['src'] );
	}

	/**
	 * Test that the jetpack_postimages_exclude_image filter can exclude images from from_html().
	 *
	 * Copied from PR #47183.
	 */
	public function test_from_html_exclude_image_filter() {
		$html = '<img src="https://example.com/qr-code-300x300.jpg" width="300" height="300" alt="QR Code" />'
			. '<img src="https://example.com/photo-400x300.jpg" width="400" height="300" alt="Photo" />';

		$callback = function ( $exclude, $image ) {
			if ( false !== strpos( $image['src'], 'qr-code' ) ) {
				return true;
			}
			return $exclude;
		};

		add_filter( 'jetpack_postimages_exclude_image', $callback, 10, 2 );

		$result = Images::from_html( $html );

		remove_filter( 'jetpack_postimages_exclude_image', $callback, 10 );

		$this->assertCount( 1, $result );
		$this->assertStringContainsString( 'photo', $result[0]['src'] );
	}

	/**
	 * Test that image blocks with the jetpack-ignore-thumbnail CSS class are excluded from from_blocks().
	 *
	 * Copied from PR #47183.
	 */
	public function test_from_blocks_ignores_jetpack_ignore_thumbnail_class() {
		$img_dimensions = array(
			'width'  => 300,
			'height' => 250,
		);

		$post_id         = $this->create_post();
		$skip_attachment = $this->create_attachment(
			'skip-image.jpg',
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);
		wp_update_attachment_metadata( $skip_attachment, $img_dimensions );

		$keep_attachment = $this->create_attachment(
			'keep-image.jpg',
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);
		wp_update_attachment_metadata( $keep_attachment, $img_dimensions );

		$skip_url = wp_get_attachment_url( $skip_attachment );
		$keep_url = wp_get_attachment_url( $keep_attachment );

		$post_html = sprintf(
			'<!-- wp:image {"id":%1$d,"className":"jetpack-ignore-thumbnail"} --><div class="wp-block-image"><figure class="wp-block-image jetpack-ignore-thumbnail"><img src="%2$s" alt="" class="wp-image-%1$d"/></figure></div><!-- /wp:image -->'
			. '<!-- wp:image {"id":%3$d} --><div class="wp-block-image"><figure class="wp-block-image"><img src="%4$s" alt="" class="wp-image-%3$d"/></figure></div><!-- /wp:image -->',
			$skip_attachment,
			$skip_url,
			$keep_attachment,
			$keep_url
		);

		$second_post_id = $this->create_post(
			array(
				'post_content' => $post_html,
			)
		);

		$images = Images::from_blocks( $second_post_id );

		$this->assertCount( 1, $images );
		$this->assertEquals( $keep_url, $images[0]['src'] );
	}

	/**
	 * Test that the jetpack_postimages_exclude_image filter can exclude images from from_blocks().
	 *
	 * Copied from PR #47183.
	 */
	public function test_from_blocks_exclude_image_filter() {
		$img_dimensions = array(
			'width'  => 300,
			'height' => 250,
		);

		$post_id         = $this->create_post();
		$attachment_id_1 = $this->create_attachment(
			'exclude-me.jpg',
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);
		wp_update_attachment_metadata( $attachment_id_1, $img_dimensions );

		$attachment_id_2 = $this->create_attachment(
			'keep-me.jpg',
			$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);
		wp_update_attachment_metadata( $attachment_id_2, $img_dimensions );

		$url_1 = wp_get_attachment_url( $attachment_id_1 );
		$url_2 = wp_get_attachment_url( $attachment_id_2 );

		$post_html = sprintf(
			'<!-- wp:image {"id":%1$d} --><div class="wp-block-image"><figure class="wp-block-image"><img src="%2$s" alt="" class="wp-image-%1$d"/></figure></div><!-- /wp:image -->'
			. '<!-- wp:image {"id":%3$d} --><div class="wp-block-image"><figure class="wp-block-image"><img src="%4$s" alt="" class="wp-image-%3$d"/></figure></div><!-- /wp:image -->',
			$attachment_id_1,
			$url_1,
			$attachment_id_2,
			$url_2
		);

		$second_post_id = $this->create_post(
			array(
				'post_content' => $post_html,
			)
		);

		$callback = function ( $exclude, $image ) use ( $url_1 ) {
			if ( $image['src'] === $url_1 ) {
				return true;
			}
			return $exclude;
		};

		add_filter( 'jetpack_postimages_exclude_image', $callback, 10, 2 );

		$images = Images::from_blocks( $second_post_id );

		remove_filter( 'jetpack_postimages_exclude_image', $callback, 10 );

		$this->assertCount( 1, $images );
		$this->assertEquals( $url_2, $images[0]['src'] );
	}
} // end class
