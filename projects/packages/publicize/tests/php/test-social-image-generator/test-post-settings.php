<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Post_Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Social_Image_Generator\Post_Settings;
use Automattic\Jetpack\Publicize\Social_Image_Generator\Templates;
use WorDBless\BaseTestCase;

/**
 * Testing the Post_Settings class.
 */
class Post_Settings_Test extends BaseTestCase {
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
	 */
	public function set_up() {
		$publicize = $this->getMockBuilder( Publicize::class )->disableOriginalConstructor()->setMethods( null )->getMock();
		$publicize->register_post_meta();

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
	 * Test that it correctly returns enabled or disabled.
	 */
	public function test_correctly_returns_enabled_status() {
		$settings = new Post_Settings( $this->post_id );
		$this->assertFalse( $settings->is_enabled() );
		$this->update_image_generator_settings( array( 'enabled' => true ) );
		$settings = new Post_Settings( $this->post_id );
		$this->assertTrue( $settings->is_enabled() );
	}

	/**
	 * Test that it returns correct text for generated image.
	 */
	public function test_correctly_returns_text_for_generated_image() {
		$this->update_image_generator_settings( array( 'custom_text' => 'world' ) );
		$settings = new Post_Settings( $this->post_id );
		$this->assertEquals( 'world', $settings->get_custom_text() );
	}

	/**
	 * Test that text for generated image defaults to post title if not set.
	 */
	public function test_text_for_generated_image_defaults_to_post_title() {
		$settings = new Post_Settings( $this->post_id );
		$this->assertEquals( 'hello', $settings->get_custom_text() );
	}

	/**
	 * Test that image for generated image defaults to featured image.
	 */
	public function test_image_defaults_to_featured_image() {
		$settings = new Post_Settings( $this->post_id );
		$this->assertNull( $settings->get_image_url() );
		set_post_thumbnail( $this->post_id, $this->attachment_id );
		$this->assertEquals( '/wp-content/uploads/jetpack-logo.png', $settings->get_image_url() );
		delete_post_thumbnail( $this->post_id );
	}

	/**
	 * Test that a custom image returns correctly if it is available.
	 */
	public function test_custom_image_returns_correctly_if_set() {
		$this->update_image_generator_settings( array( 'image_type' => 'custom' ) );
		$settings = new Post_Settings( $this->post_id );
		$this->assertNull( $settings->get_image_url() );
		$this->update_image_generator_settings(
			array(
				'image_type' => 'custom',
				'image_id'   => $this->attachment_id,
			)
		);
		$settings = new Post_Settings( $this->post_id );
		$this->assertEquals( '/wp-content/uploads/jetpack-logo.png', $settings->get_image_url() );
	}

	/**
	 * Test that no image is returned when user picks the "No Image" option.
	 */
	public function test_no_image_is_returned_when_image_is_set_to_none() {
		$this->update_image_generator_settings(
			array(
				'image_type' => 'none',
				'image_id'   => $this->attachment_id,
			)
		);
		$settings = new Post_Settings( $this->post_id );
		$this->assertNull( $settings->get_image_url() );
	}

	/**
	 * Test that it returns correct template for generated image.
	 */
	public function test_correctly_returns_template_for_generated_image() {
		$this->update_image_generator_settings( array( 'template' => 'example' ) );
		$settings = new Post_Settings( $this->post_id );
		$this->assertEquals( 'example', $settings->get_template() );
	}

	/**
	 * Test that text for generated image defaults to default template if not set.
	 */
	public function test_text_for_generated_image_defaults_to_default_template() {
		$settings = new Post_Settings( $this->post_id );
		$this->assertEquals( Templates::DEFAULT_TEMPLATE, $settings->get_template() );
	}

	/**
	 * Test that token is returned correctly.
	 */
	public function test_correctly_returns_token_if_available() {
		$token    = 'testtoken';
		$settings = new Post_Settings( $this->post_id );
		$this->assertEmpty( $settings->get_token() );
		$this->update_image_generator_settings( array( 'token' => $token ) );
		$settings = new Post_Settings( $this->post_id );
		$this->assertEquals( $settings->get_token(), $token );
	}
}
