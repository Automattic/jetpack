<?php
/**
 * Tests for Publicize_Base::get_social_opengraph_image().
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
use PHPUnit\Framework\Attributes\CoversMethod;
use WorDBless\BaseTestCase;
use function Automattic\Jetpack\Publicize\Social_Image_Generator\get_image_url;

/**
 * @covers \Automattic\Jetpack\Publicize\Publicize_Base::get_social_opengraph_image
 */
#[CoversMethod( Publicize_Base::class, 'get_social_opengraph_image' )]
class Get_Social_Opengraph_Image_Test extends BaseTestCase {

	/**
	 * Attachment URLs keyed by ID.
	 *
	 * @var array
	 */
	private $attachment_urls = array();

	/**
	 * Attachment image sources keyed by ID.
	 *
	 * @var array
	 */
	private $attachment_image_sources = array();

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_photon_development_mode', '__return_false' );
		add_filter( 'wp_get_attachment_url', array( $this, 'filter_attachment_url' ), 10, 2 );
		add_filter( 'wp_get_attachment_image_src', array( $this, 'filter_attachment_image_src' ), 10, 2 );

		$this->set_active_plan_features( array( 'social-image-focal-point' ) );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_photon_development_mode', '__return_false' );
		remove_filter( 'wp_get_attachment_url', array( $this, 'filter_attachment_url' ), 10 );
		remove_filter( 'wp_get_attachment_image_src', array( $this, 'filter_attachment_image_src' ), 10 );

		$this->attachment_urls          = array();
		$this->attachment_image_sources = array();

		self::reset_active_plan_cache();

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
	 * Filter attachment image sources for deterministic assertions.
	 *
	 * @param array|false $image Attachment image source.
	 * @param int         $attachment_id Attachment ID.
	 * @return array|false Attachment image source.
	 */
	public function filter_attachment_image_src( $image, $attachment_id ) {
		return $this->attachment_image_sources[ $attachment_id ] ?? $image;
	}

	/**
	 * Test that attached media with a focal point returns an uncropped Open Graph image.
	 */
	public function test_attached_media_with_focal_point_returns_uncropped_image() {
		$post_id       = $this->create_post();
		$attachment_id = $this->create_image_attachment( 3000, 1050, 'attached.jpg' );

		$this->set_focal_point( $attachment_id, 0.75, 0.5 );
		update_post_meta(
			$post_id,
			Publicize_Base::POST_JETPACK_SOCIAL_OPTIONS,
			array( 'attached_media' => array( array( 'id' => $attachment_id ) ) )
		);

		$image = ( new Publicize() )->get_social_opengraph_image( $post_id );

		$this->assertSame( 'https://example.com/uploads/attached-1200.jpg', $image['url'] );
		$this->assertSame( 1200, $image['width'] );
		$this->assertSame( 420, $image['height'] );
	}

	/**
	 * Test that a featured image with a focal point is used when no media is attached.
	 */
	public function test_featured_image_with_focal_point_is_used_without_attached_media() {
		$post_id       = $this->create_post();
		$attachment_id = $this->create_image_attachment( 3000, 1050, 'featured.jpg' );

		$this->set_focal_point( $attachment_id, 0.75, 0.5 );
		update_post_meta( $post_id, '_thumbnail_id', $attachment_id );

		$image = ( new Publicize() )->get_social_opengraph_image( $post_id );
		$args  = $this->get_query_args( $image['url'] );

		$this->assertSame( 1200, $image['width'] );
		$this->assertSame( 630, $image['height'] );
		$this->assertSame( '1000px,0px,2000px,1050px', $args['crop'] );
		$this->assertSame( '1200,630', $args['resize'] );
	}

	/**
	 * Test that a featured image without a focal point preserves existing behavior.
	 */
	public function test_featured_image_without_focal_point_does_not_override() {
		$post_id       = $this->create_post();
		$attachment_id = $this->create_image_attachment( 3000, 1050, 'plain-featured.jpg' );

		update_post_meta( $post_id, '_thumbnail_id', $attachment_id );

		$this->assertSame( array(), ( new Publicize() )->get_social_opengraph_image( $post_id ) );
	}

	/**
	 * Test that the focal crop is skipped when the site lacks the feature.
	 */
	public function test_featured_image_focal_crop_requires_feature() {
		$this->set_active_plan_features( array() );

		$post_id       = $this->create_post();
		$attachment_id = $this->create_image_attachment( 3000, 1050, 'gated-featured.jpg' );

		$this->set_focal_point( $attachment_id, 0.75, 0.5 );
		update_post_meta( $post_id, '_thumbnail_id', $attachment_id );

		$this->assertSame( array(), ( new Publicize() )->get_social_opengraph_image( $post_id ) );
	}

	/**
	 * Test that Social Image Generator remains higher priority than focal crops.
	 */
	public function test_social_image_generator_takes_priority() {
		$post_id       = $this->create_post();
		$attachment_id = $this->create_image_attachment( 3000, 1050, 'sig-fallback.jpg' );

		$this->set_focal_point( $attachment_id, 0.75, 0.5 );
		update_post_meta(
			$post_id,
			Publicize_Base::POST_JETPACK_SOCIAL_OPTIONS,
			array(
				'attached_media'           => array( array( 'id' => $attachment_id ) ),
				'image_generator_settings' => array(
					'enabled' => true,
					'token'   => 'test-token',
				),
			)
		);

		$image = ( new Publicize() )->get_social_opengraph_image( $post_id );

		$this->assertSame( get_image_url( $post_id ), $image['url'] );
		$this->assertSame( 1200, $image['width'] );
		$this->assertSame( 630, $image['height'] );
	}

	/**
	 * Create a post.
	 *
	 * @return int Post ID.
	 */
	private function create_post() {
		return wp_insert_post(
			array(
				'post_title'  => 'SOCIAL-506 post',
				'post_status' => 'publish',
			)
		);
	}

	/**
	 * Create an image attachment with metadata.
	 *
	 * @param int    $width Image width.
	 * @param int    $height Image height.
	 * @param string $filename File name.
	 * @return int Attachment ID.
	 */
	private function create_image_attachment( $width, $height, $filename ) {
		$attachment_id = wp_insert_attachment(
			array(
				'post_mime_type' => 'image/jpeg',
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

		$this->attachment_urls[ $attachment_id ]          = 'https://example.com/uploads/' . $filename;
		$this->attachment_image_sources[ $attachment_id ] = array(
			'https://example.com/uploads/' . preg_replace( '/\.(jpe?g|png|webp|gif)$/i', '-1200.$1', $filename ),
			1200,
			420,
			false,
		);

		return $attachment_id;
	}

	/**
	 * Store a focal point on an attachment.
	 *
	 * @param int   $attachment_id Attachment ID.
	 * @param float $x X axis.
	 * @param float $y Y axis.
	 */
	private function set_focal_point( $attachment_id, $x, $y ) {
		update_post_meta(
			$attachment_id,
			Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT,
			array(
				'x' => $x,
				'y' => $y,
			)
		);
	}

	/**
	 * Set the active plan features.
	 *
	 * @param array $features Active plan features.
	 */
	private function set_active_plan_features( $features ) {
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = $features;
		update_option( Current_Plan::PLAN_OPTION, $plan, true );
		self::reset_active_plan_cache();
	}

	/**
	 * Force the next `Current_Plan::get()` to re-read from the option store.
	 */
	private static function reset_active_plan_cache() {
		$reflection = new \ReflectionClass( Current_Plan::class );
		$property   = $reflection->getProperty( 'active_plan_cache' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
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
