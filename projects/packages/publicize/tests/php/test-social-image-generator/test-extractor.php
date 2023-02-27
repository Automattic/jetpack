<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Extractor.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Social_Image_Generator\Extractor;
use WorDBless\BaseTestCase;

/**
 * Testing the SIG Extractor.
 */
class Extractor_Test extends BaseTestCase {
	/**
	 * Post ID of the testing post.
	 *
	 * @var int $post_id
	 */
	protected $post_id;

	/**
	 * ID of the test attachment.
	 *
	 * @var int $attachment_id
	 */
	protected $attachment_id;

	/**
	 * Initialize tests
	 *
	 * @before
	 */
	public function set_up() {
		$this->post_id       = wp_insert_post(
			array(
				'post_title'   => 'hello',
				'post_content' => 'world',
				'post_status'  => 'publish',
			)
		);
		$this->attachment_id = $this->create_upload_object( realpath( __DIR__ . '/..' ) . '/images/jetpack-logo.png' );
	}

	/**
	 * Update the settings for the image generator.
	 *
	 * @param array $value Array of settings to update.
	 */
	private function update_image_generator_settings( $value ) {
		update_post_meta( $this->post_id, Publicize::POST_JETPACK_SOCIAL_OPTIONS, array( 'image_generator_settings' => $value ) );
	}

	/**
	 * Reset settings after each test.
	 */
	public function tear_down() {
		$this->update_image_generator_settings( array() );
	}

	/**
	 * Create an upload.
	 *
	 * @param string  $file File path.
	 * @param integer $parent Parent post ID.
	 * @return integer
	 */
	public function create_upload_object( $file, $parent = 0 ) {
		$contents = file_get_contents( $file ); // phpcs:ignore
		$upload   = wp_upload_bits( basename( $file ), null, $contents );

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
			'post_mime_type' => $type,
			'guid'           => $upload['url'],
		);

		// Save the data.
		$id = wp_insert_attachment( $attachment, $upload['file'], $parent );

		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );

		return $id;
	}

	/**
	 * Test that the extractor correctly returns enabled or disabled.
	 */
	public function test_correctly_returns_enabled_status() {
		$extractor = new Extractor( $this->post_id );
		$this->assertFalse( $extractor->is_enabled() );

		$this->update_image_generator_settings( array( 'is_enabled' => true ) );
		$extractor = new Extractor( $this->post_id );
		$this->assertTrue( $extractor->is_enabled() );
	}

	/**
	 * Test that extractor returns correct text for generated image.
	 */
	public function test_correctly_returns_text_for_generated_image() {
		$this->update_image_generator_settings( array( 'custom_text' => 'world' ) );
		$extractor = new Extractor( $this->post_id );
		$this->assertEquals( 'world', $extractor->get_generated_image_text() );
	}

	/**
	 * Test that text for generated image defaults to post title if not set.
	 */
	public function test_text_for_generated_image_defaults_to_post_title() {
		$extractor = new Extractor( $this->post_id );
		$this->assertEquals( 'hello', $extractor->get_generated_image_text() );
	}

	/**
	 * Test that background image for generated image is returned correctly.
	 */
	public function test_correctly_returns_url_to_background_image_if_available() {
		$extractor = new Extractor( $this->post_id );
		$this->assertEmpty( $extractor->get_generated_image_background_image_url() );
		$this->update_image_generator_settings( array( 'image_id' => $this->attachment_id ) );
		$extractor = new Extractor( $this->post_id );
		$this->assertEquals( '/wp-content/uploads/jetpack-logo.png', $extractor->get_generated_image_background_image_url() );
	}

	/**
	 * Test that token is returned correctly.
	 */
	public function test_correctly_returns_token_if_available() {
		$token     = 'testtoken';
		$extractor = new Extractor( $this->post_id );
		$this->assertEmpty( $extractor->get_token() );
		$this->update_image_generator_settings( array( 'token' => $token ) );
		$extractor = new Extractor( $this->post_id );
		$this->assertEquals( $extractor->get_token(), $token );
	}

	/**
	 * Test that image URL is returned when token is set.
	 */
	public function test_image_url_returns_url_if_token_set() {
		$token = 'testtoken';
		$this->update_image_generator_settings( array( 'token' => $token ) );
		// TODO: update URL
		$extractor = new Extractor( $this->post_id );
		$this->assertEquals( $extractor->get_image_url(), 'https://example.com/' . $token );
	}

	/**
	 * Test that image URL defaults to empty string.
	 */
	public function test_image_url_returns_empty_string_if_no_token_set() {
		$extractor = new Extractor( $this->post_id );
		$this->assertSame( '', $extractor->get_image_url() );
	}
}
