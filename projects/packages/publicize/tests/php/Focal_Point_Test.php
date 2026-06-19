<?php
/**
 * Tests for focal point crop helpers.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Publicize\Focal_Point
 */
#[CoversClass( Focal_Point::class )]
class Focal_Point_Test extends BaseTestCase {

	/**
	 * Attachment URLs keyed by ID.
	 *
	 * @var array
	 */
	private $attachment_urls = array();

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_photon_development_mode', '__return_false' );
		add_filter( 'wp_get_attachment_url', array( $this, 'filter_attachment_url' ), 10, 2 );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_photon_development_mode', '__return_false' );
		remove_filter( 'wp_get_attachment_url', array( $this, 'filter_attachment_url' ), 10 );

		$this->attachment_urls = array();

		parent::tear_down();
	}

	/**
	 * Filter attachment URLs for deterministic Photon assertions.
	 *
	 * @param string $url Attachment URL.
	 * @param int    $attachment_id Attachment ID.
	 * @return string Attachment URL.
	 */
	public function filter_attachment_url( $url, $attachment_id ) {
		return $this->attachment_urls[ $attachment_id ] ?? $url;
	}

	/**
	 * Test that missing raw focal point meta returns null.
	 */
	public function test_get_for_image_returns_null_without_stored_meta() {
		$attachment_id = $this->create_image_attachment();

		$this->assertNull( Focal_Point::get_for_image( $attachment_id ) );
	}

	/**
	 * Test that a valid focal point is returned.
	 */
	public function test_get_for_image_returns_valid_stored_meta() {
		$attachment_id = $this->create_image_attachment();

		update_post_meta(
			$attachment_id,
			Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT,
			array(
				'x' => 0.25,
				'y' => 0.75,
			)
		);

		$this->assertSame(
			array(
				'x' => 0.25,
				'y' => 0.75,
			),
			Focal_Point::get_for_image( $attachment_id )
		);
	}

	/**
	 * Test that malformed focal point meta returns null.
	 */
	public function test_get_for_image_returns_null_for_invalid_meta() {
		$attachment_id = $this->create_image_attachment();

		update_post_meta(
			$attachment_id,
			Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT,
			array(
				'x' => 1.2,
				'y' => 0.5,
			)
		);

		$this->assertNull( Focal_Point::get_for_image( $attachment_id ) );
	}

	/**
	 * Test the centered-and-clamped crop rectangle math.
	 */
	public function test_crop_rect_centers_and_clamps_to_edges() {
		$aspect = Focal_Point::OG_IMAGE_WIDTH / Focal_Point::OG_IMAGE_HEIGHT;

		$this->assertSame(
			array(
				'x'      => 500,
				'y'      => 0,
				'width'  => 2000,
				'height' => 1050,
			),
			Focal_Point::crop_rect( 3000, 1050, 0.5, 0.5, $aspect )
		);

		$this->assertSame(
			array(
				'x'      => 0,
				'y'      => 0,
				'width'  => 2000,
				'height' => 1050,
			),
			Focal_Point::crop_rect( 3000, 1050, 0, 0.5, $aspect )
		);

		$this->assertSame(
			array(
				'x'      => 1000,
				'y'      => 0,
				'width'  => 2000,
				'height' => 1050,
			),
			Focal_Point::crop_rect( 3000, 1050, 1, 0.5, $aspect )
		);
	}

	/**
	 * Test that cropped URLs use crop before resize.
	 */
	public function test_get_cropped_url_uses_crop_before_resize() {
		$attachment_id = $this->create_image_attachment( 3000, 1050, 'source.jpg' );
		$url           = Focal_Point::get_cropped_url( $attachment_id, 0.5, 0.5 );
		$args          = $this->get_query_args( $url );

		$this->assertStringStartsWith( 'https://i0.wp.com/example.com/uploads/source.jpg?', $url );
		$crop_position   = strpos( $url, 'crop=' );
		$resize_position = strpos( $url, 'resize=' );

		$this->assertNotFalse( $crop_position );
		$this->assertNotFalse( $resize_position );
		$this->assertGreaterThan( $crop_position, $resize_position );
		$this->assertSame( '500px,0px,2000px,1050px', $args['crop'] );
		$this->assertSame( '1200,630', $args['resize'] );
	}

	/**
	 * Test that images are not upscaled when no crop is needed.
	 */
	public function test_get_cropped_image_does_not_upscale_when_no_crop_is_needed() {
		$attachment_id = $this->create_image_attachment( 800, 420, 'small.jpg' );

		update_post_meta(
			$attachment_id,
			Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT,
			array(
				'x' => 0.75,
				'y' => 0.5,
			)
		);

		$image = Focal_Point::get_cropped_image( $attachment_id );

		$this->assertIsArray( $image );
		$this->assertSame( 'https://example.com/uploads/small.jpg', $image['url'] );
		$this->assertSame( 800, $image['width'] );
		$this->assertSame( 420, $image['height'] );
	}

	/**
	 * Test that smaller images are cropped without being upscaled.
	 */
	public function test_get_cropped_image_crops_without_upscaling() {
		$attachment_id = $this->create_image_attachment( 800, 600, 'small-tall.jpg' );

		update_post_meta(
			$attachment_id,
			Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT,
			array(
				'x' => 0.5,
				'y' => 0.6,
			)
		);

		$image = Focal_Point::get_cropped_image( $attachment_id );

		$this->assertIsArray( $image );
		$args = $this->get_query_args( $image['url'] );

		$this->assertSame( 800, $image['width'] );
		$this->assertSame( 420, $image['height'] );
		$this->assertSame( '0px,150px,800px,420px', $args['crop'] );
		$this->assertArrayNotHasKey( 'resize', $args );
	}

	/**
	 * Test that unsupported image URLs return null.
	 */
	public function test_get_cropped_url_returns_null_for_unsupported_image() {
		$attachment_id = $this->create_image_attachment( 3000, 1050, 'vector.svg', 'image/svg+xml' );

		$this->assertNull( Focal_Point::get_cropped_url( $attachment_id, 0.5, 0.5 ) );
	}

	/**
	 * Test that signed source URLs fall back when Photon would drop the query string.
	 */
	public function test_get_cropped_url_returns_null_when_source_query_string_would_be_dropped() {
		$attachment_id = $this->create_image_attachment( 3000, 1050, 'signed.jpg' );

		$this->attachment_urls[ $attachment_id ] = 'https://example.com/uploads/signed.jpg?signature=test';

		$this->assertNull( Focal_Point::get_cropped_url( $attachment_id, 0.5, 0.5 ) );
	}

	/**
	 * Test that transformed CDN source URLs fall back.
	 */
	public function test_get_cropped_url_returns_null_for_transformed_cdn_source() {
		$attachment_id = $this->create_image_attachment( 3000, 1050, 'transformed.jpg' );

		$this->attachment_urls[ $attachment_id ] = 'https://i0.wp.com/example.com/uploads/transformed.jpg?resize=100,100';

		$this->assertNull( Focal_Point::get_cropped_url( $attachment_id, 0.5, 0.5 ) );
	}

	/**
	 * Test that invalid attachment dimensions return null.
	 */
	public function test_get_cropped_url_returns_null_for_invalid_dimensions() {
		$attachment_id = $this->create_image_attachment( 3000, 1050, 'invalid-dimensions.jpg' );

		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'width'  => -1,
				'height' => 1050,
				'file'   => '2026/06/invalid-dimensions.jpg',
			)
		);

		$this->assertNull( Focal_Point::get_cropped_url( $attachment_id, 0.5, 0.5 ) );
	}

	/**
	 * Create an image attachment with metadata.
	 *
	 * @param int    $width Image width.
	 * @param int    $height Image height.
	 * @param string $filename File name.
	 * @param string $mime_type Mime type.
	 * @return int Attachment ID.
	 */
	private function create_image_attachment( $width = 3000, $height = 1050, $filename = 'test.jpg', $mime_type = 'image/jpeg' ) {
		$attachment_id = wp_insert_attachment(
			array(
				'post_mime_type' => $mime_type,
				'post_title'     => $filename,
				'post_status'    => 'inherit',
			)
		);

		update_post_meta( $attachment_id, '_wp_attached_file', '2026/06/' . $filename );
		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'width'  => $width,
				'height' => $height,
				'file'   => '2026/06/' . $filename,
			)
		);

		$this->attachment_urls[ $attachment_id ] = 'https://example.com/uploads/' . $filename;

		return $attachment_id;
	}

	/**
	 * Get decoded query args from a URL.
	 *
	 * @param string $url URL.
	 * @return array Query args.
	 */
	private function get_query_args( $url ) {
		parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $args );

		return $args;
	}
}
