<?php
/**
 * Tests for the tiled gallery carousel-image-args partial template.
 *
 * @package automattic/jetpack
 */

/**
 * Class Carousel_Image_Args_Template_Test
 */
class Carousel_Image_Args_Template_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Path to the partial under test.
	 *
	 * @var string
	 */
	private $template;

	/**
	 * Sets up each test.
	 *
	 * @inheritDoc
	 */
	public function set_up() {
		parent::set_up();
		$this->template = JETPACK__PLUGIN_DIR . 'modules/tiled-gallery/tiled-gallery/templates/partials/carousel-image-args.php';
	}

	/**
	 * Builds a stand-in gallery item backed by a real attachment carrying EXIF
	 * metadata. The anonymous object exposes only the methods the partial reads,
	 * avoiding the heavier Image CDN / srcset setup the real item performs.
	 *
	 * @return object
	 */
	private function create_stub_item_with_exif() {
		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => dirname( __DIR__, 2 ) . '/jetpack-icon.jpg',
				'post_parent'    => 0,
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'Test Image',
				'post_content'   => 'Test Image Description',
				'post_status'    => 'publish',
			)
		);

		$image = get_post( $attachment_id );
		$meta  = array(
			'camera'   => 'JetpackCam',
			'aperture' => '2.8',
		);

		return new class( $image, $meta ) {
			/**
			 * The attachment post backing the item.
			 *
			 * @var WP_Post
			 */
			public $image;

			/**
			 * The EXIF image metadata to return from fuzzy_image_meta().
			 *
			 * @var array
			 */
			private $meta;

			/**
			 * Constructor.
			 *
			 * @param WP_Post $image The attachment post.
			 * @param array   $meta  The EXIF image metadata.
			 */
			public function __construct( $image, $meta ) {
				$this->image = $image;
				$this->meta  = $meta;
			}

			/**
			 * Return the EXIF image metadata.
			 *
			 * @return array
			 */
			public function fuzzy_image_meta() {
				return $this->meta;
			}

			/**
			 * Return the image width.
			 *
			 * @return int
			 */
			public function meta_width() {
				return 100;
			}

			/**
			 * Return the image height.
			 *
			 * @return int
			 */
			public function meta_height() {
				return 100;
			}

			/**
			 * Return the medium file URL.
			 *
			 * @return string
			 */
			public function medium_file() {
				return 'http://example.org/medium.jpg';
			}

			/**
			 * Return the large file URL.
			 *
			 * @return string
			 */
			public function large_file() {
				return 'http://example.org/large.jpg';
			}
		};
	}

	/**
	 * Renders the partial with the given item in context.
	 *
	 * @param object $item The gallery item.
	 * @return string The rendered template output.
	 */
	private function render( $item ) {
		$context = array( 'item' => $item ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Read by the required template.
		ob_start();
		require $this->template;
		return ob_get_clean();
	}

	/**
	 * When the EXIF display option is enabled (the default), the partial should
	 * output the data-image-meta attribute.
	 */
	public function test_outputs_image_meta_when_exif_enabled() {
		update_option( 'carousel_display_exif', 1 );
		$output = $this->render( $this->create_stub_item_with_exif() );

		$this->assertStringContainsString( 'data-image-meta=', $output );
		$this->assertStringContainsString( 'JetpackCam', $output );
		$this->assertStringContainsString( 'data-attachment-id=', $output );
	}

	/**
	 * When the EXIF display option is disabled, the partial should NOT output the
	 * data-image-meta attribute, while still emitting the other data-* attributes.
	 */
	public function test_omits_image_meta_when_exif_disabled() {
		update_option( 'carousel_display_exif', 0 );
		$output = $this->render( $this->create_stub_item_with_exif() );

		$this->assertStringNotContainsString( 'data-image-meta=', $output );
		$this->assertStringNotContainsString( 'JetpackCam', $output );
		// Other attributes the modal needs must still be present.
		$this->assertStringContainsString( 'data-attachment-id=', $output );
		$this->assertStringContainsString( 'data-image-title=', $output );
	}
}
