<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the utility methods.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use WorDBless\BaseTestCase;
use function Automattic\Jetpack\Publicize\Social_Image_Generator\get_image_url;

/**
 * Testing the utility methods.
 */
class Utilities_Test extends BaseTestCase {
	/**
	 * Post ID of the testing post.
	 *
	 * @var int $post_id
	 */
	protected $post_id;

	/**
	 * Initialize tests
	 *
	 * @before
	 */
	public function set_up() {
		$this->post_id = wp_insert_post(
			array(
				'post_title'   => 'hello',
				'post_content' => 'world',
				'post_status'  => 'publish',
			)
		);
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
	 * Test that image URL is returned when token is set.
	 */
	public function test_image_url_returns_url_if_token_set() {
		$token = 'testtoken';
		$this->update_image_generator_settings( array( 'token' => $token ) );
		// TODO: update URL
		$this->assertEquals( get_image_url( $this->post_id ), 'https://example.com/' . $token );
	}

	/**
	 * Test that image URL defaults to empty string.
	 */
	public function test_image_url_returns_empty_string_if_no_token_set() {
		$this->assertEquals( get_image_url( $this->post_id ), '' );
	}
}
