<?php
/**
 * Hide Repeated Featured Image Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/hide-repeated-featured-image/hide-repeated-featured-image.php';

/**
 * Tests for wpcom_post_opens_with_featured_image().
 */
class Hide_Repeated_Featured_Image_Test extends \WorDBless\BaseTestCase {
	/**
	 * Featured image attachment ID.
	 *
	 * @var int
	 */
	private $attachment_id;

	/**
	 * Create the featured image attachment.
	 */
	public function set_up() {
		parent::set_up();

		// Without a user, kses runs on save and WorDBless keeps its slashes in the stored content.
		kses_remove_filters();

		$this->attachment_id = wp_insert_attachment(
			array(
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'Condor',
			),
			'2026/09/condor.jpg'
		);
	}

	/**
	 * Restore kses.
	 */
	public function tear_down() {
		kses_init();
		parent::tear_down();
	}

	/**
	 * Create a post with the featured image set.
	 *
	 * @param string $content Post content.
	 * @return int
	 */
	private function create_post( string $content ): int {
		$post_id = wp_insert_post(
			array(
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);
		update_post_meta( $post_id, '_thumbnail_id', $this->attachment_id );

		return $post_id;
	}

	/**
	 * An image block for the featured image.
	 *
	 * @return string
	 */
	private function opening_photo(): string {
		return '<!-- wp:image {"id":' . $this->attachment_id . '} --><figure class="wp-block-image"><img src="https://example.com/condor-1024x768.jpg" class="wp-image-' . $this->attachment_id . '"/></figure><!-- /wp:image -->';
	}

	public function test_post_opening_with_the_featured_image() {
		$this->assertTrue( wpcom_post_opens_with_featured_image( $this->create_post( $this->opening_photo() . '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->' ) ) );
	}

	public function test_imported_image_without_a_class_matches_by_file_path() {
		$this->assertTrue( wpcom_post_opens_with_featured_image( $this->create_post( '<p><img src="https://i0.wp.com/example.com/wp-content/uploads/2026/09/condor-300x200.jpg?ssl=1"></p>' ) ) );
	}

	public function test_text_before_the_photo() {
		$this->assertFalse( wpcom_post_opens_with_featured_image( $this->create_post( '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->' . $this->opening_photo() ) ) );
	}

	public function test_a_different_opening_photo() {
		$this->assertFalse( wpcom_post_opens_with_featured_image( $this->create_post( '<img src="https://example.com/wp-content/uploads/2026/09/other.jpg">' ) ) );
	}

	public function test_paywall_before_the_photo() {
		$this->assertFalse( wpcom_post_opens_with_featured_image( $this->create_post( '<!-- wp:jetpack/paywall /-->' . $this->opening_photo() ) ) );
	}

	public function test_gallery_opening_with_the_photo() {
		$this->assertFalse( wpcom_post_opens_with_featured_image( $this->create_post( '<!-- wp:gallery --><figure class="wp-block-gallery has-nested-images">' . $this->opening_photo() . '</figure><!-- /wp:gallery -->' ) ) );
	}

	public function test_post_without_a_featured_image() {
		$post_id = wp_insert_post( array( 'post_content' => $this->opening_photo() ) );

		$this->assertFalse( wpcom_post_opens_with_featured_image( $post_id ) );
	}
}
