<?php
/**
 * Tests for image XMP preservation.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Image_Metadata\Image_Metadata;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/class-image-metadata-fixtures.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\Image_Metadata
 */
#[CoversClass( Image_Metadata::class )]
class Image_Metadata_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @var string
	 */
	private $dir;

	public function set_up() {
		parent::set_up();

		update_option( 'uploads_use_yearmonth_folders', 0 );
		$uploads   = wp_upload_dir( null, true, true );
		$this->dir = trailingslashit( $uploads['path'] );
		wp_mkdir_p( $this->dir );

		require_once ABSPATH . 'wp-admin/includes/image.php';
		require_once ABSPATH . WPINC . '/class-wp-image-editor.php';
		require_once ABSPATH . WPINC . '/class-wp-image-editor-gd.php';
		require_once ABSPATH . WPINC . '/class-wp-image-editor-imagick.php';

		add_filter(
			'intermediate_image_sizes_advanced',
			function () {
				return array(
					'xmp_test' => array(
						'width'  => 2,
						'height' => 2,
						'crop'   => true,
					),
				);
			}
		);

		Image_Metadata::init();
	}

	public function tear_down() {
		remove_all_filters( 'wp_image_editors' );
		remove_all_filters( 'intermediate_image_sizes_advanced' );
		parent::tear_down();
	}

	/**
	 * @return array<string,array{0:string,1:string,2:string}>
	 */
	public static function editor_provider() {
		return array(
			'GD JPEG'      => array( 'WP_Image_Editor_GD', 'matrix.jpg', 'jpeg_with_xmp' ),
			'GD PNG'       => array( 'WP_Image_Editor_GD', 'matrix.png', 'png_with_xmp' ),
			'Imagick JPEG' => array( 'WP_Image_Editor_Imagick', 'matrix.jpg', 'jpeg_with_xmp' ),
			'Imagick PNG'  => array( 'WP_Image_Editor_Imagick', 'matrix.png', 'png_with_xmp' ),
		);
	}

	/**
	 * @param string $editor_class Image editor class.
	 * @param string $filename     Source filename.
	 * @param string $fixture      Source fixture method.
	 * @dataProvider editor_provider
	 */
	#[DataProvider( 'editor_provider' )]
	public function test_generated_sizes_carry_ai_xmp( $editor_class, $filename, $fixture ) {
		$this->force_editor( $editor_class );
		$path = $this->dir . $filename;
		file_put_contents( $path, Image_Metadata_Fixtures::$fixture( Image_Metadata_Fixtures::xmp_packet() ) );
		$id = $this->create_attachment( $path, $filename );

		$metadata = $this->generate_metadata( $id, $path );

		$this->assertNotEmpty( $metadata['sizes'] );
		foreach ( $metadata['sizes'] as $size ) {
			$this->assertStringContainsString( 'trainedAlgorithmicMedia', file_get_contents( $this->dir . $size['file'] ) );
		}
	}

	public function test_skips_non_ai_xmp() {
		$original = $this->dir . 'photo.png';
		$target   = $this->dir . 'photo-2x2.png';
		file_put_contents(
			$original,
			Image_Metadata_Fixtures::png_with_xmp(
				Image_Metadata_Fixtures::xmp_packet( Image_Metadata_Fixtures::NON_AI_SOURCE_TYPE )
			)
		);
		file_put_contents( $target, Image_Metadata_Fixtures::bare_png() );
		$id       = $this->create_attachment( $original, 'photo.png' );
		$metadata = array(
			'file'  => 'photo.png',
			'sizes' => array( 'small' => array( 'file' => 'photo-2x2.png' ) ),
		);

		$this->assertSame( $metadata, Image_Metadata::preserve( $metadata, $id ) );
		$this->assertStringNotContainsString( 'digitalCapture', file_get_contents( $target ) );
	}

	public function test_injects_into_scaled_main_image() {
		$original = $this->dir . 'large.png';
		$scaled   = $this->dir . 'large-scaled.png';
		file_put_contents( $original, Image_Metadata_Fixtures::png_with_xmp( Image_Metadata_Fixtures::xmp_packet() ) );
		file_put_contents( $scaled, Image_Metadata_Fixtures::bare_png() );
		$id = $this->create_attachment( $original, 'large.png' );

		Image_Metadata::preserve(
			array(
				'file'  => 'large-scaled.png',
				'sizes' => array(),
			),
			$id
		);

		$this->assertStringContainsString( 'trainedAlgorithmicMedia', file_get_contents( $scaled ) );
	}

	public function test_skips_when_photon_is_active() {
		$original = $this->dir . 'photon.png';
		$target   = $this->dir . 'photon-2x2.png';
		file_put_contents( $original, Image_Metadata_Fixtures::png_with_xmp( Image_Metadata_Fixtures::xmp_packet() ) );
		file_put_contents( $target, Image_Metadata_Fixtures::bare_png() );
		$id       = $this->create_attachment( $original, 'photon.png' );
		$metadata = array(
			'file'  => 'photon.png',
			'sizes' => array( 'small' => array( 'file' => 'photon-2x2.png' ) ),
		);

		$enabled = new ReflectionProperty( '\Automattic\Jetpack\Image_CDN\Image_CDN', 'is_enabled' );
		if ( PHP_VERSION_ID < 80100 ) {
			$enabled->setAccessible( true );
		}
		$enabled->setValue( null, true );
		try {
			Image_Metadata::preserve( $metadata, $id );
		} finally {
			$enabled->setValue( null, false );
		}

		$this->assertStringNotContainsString( 'trainedAlgorithmicMedia', file_get_contents( $target ) );
	}

	public function test_fires_failure_action_on_unexpected_error() {
		$original = $this->dir . 'boom.png';
		file_put_contents( $original, Image_Metadata_Fixtures::png_with_xmp( Image_Metadata_Fixtures::xmp_packet() ) );
		$id = $this->create_attachment( $original, 'boom.png' );

		// Force an unexpected error deep inside preservation.
		add_filter(
			'wp_get_original_image_path',
			/** @return never */
			static function () {
				throw new \RuntimeException( 'boom' );
			}
		);

		$fired = null;
		add_action(
			'jetpack_preserve_image_provenance_failed',
			static function ( $message ) use ( &$fired ) {
				$fired = $message;
			}
		);

		// warn() also raises a WP_DEBUG-gated E_USER_WARNING; swallow just that so
		// the suite's failOnWarning does not turn the intended diagnostic into a failure.
		set_error_handler( '__return_true', E_USER_WARNING );
		try {
			$metadata = array(
				'file'  => 'boom.png',
				'sizes' => array(),
			);
			$this->assertSame( $metadata, Image_Metadata::preserve( $metadata, $id ), 'metadata must be returned unchanged even on error' );
		} finally {
			restore_error_handler();
		}

		$this->assertNotNull( $fired, 'the failure action must fire when preservation throws' );
		$this->assertStringContainsString( 'boom', $fired );
	}

	public function test_filter_can_disable_preservation() {
		$original = $this->dir . 'off.png';
		$target   = $this->dir . 'off-2x2.png';
		file_put_contents( $original, Image_Metadata_Fixtures::png_with_xmp( Image_Metadata_Fixtures::xmp_packet() ) );
		file_put_contents( $target, Image_Metadata_Fixtures::bare_png() );
		$id       = $this->create_attachment( $original, 'off.png' );
		$metadata = array(
			'file'  => 'off.png',
			'sizes' => array( 'small' => array( 'file' => 'off-2x2.png' ) ),
		);

		add_filter( 'jetpack_preserve_image_provenance', '__return_false' );

		Image_Metadata::preserve( $metadata, $id );

		$this->assertStringNotContainsString( 'trainedAlgorithmicMedia', file_get_contents( $target ) );
	}

	public function test_skips_on_wpcom_platform() {
		$original = $this->dir . 'wpcom.png';
		$target   = $this->dir . 'wpcom-2x2.png';
		file_put_contents( $original, Image_Metadata_Fixtures::png_with_xmp( Image_Metadata_Fixtures::xmp_packet() ) );
		file_put_contents( $target, Image_Metadata_Fixtures::bare_png() );
		$id       = $this->create_attachment( $original, 'wpcom.png' );
		$metadata = array(
			'file'  => 'wpcom.png',
			'sizes' => array( 'small' => array( 'file' => 'wpcom-2x2.png' ) ),
		);

		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );
		try {
			Image_Metadata::preserve( $metadata, $id );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}

		$this->assertStringNotContainsString( 'trainedAlgorithmicMedia', file_get_contents( $target ) );
	}

	/**
	 * Force one image editor.
	 *
	 * @param string $editor_class Image editor class.
	 * @return void
	 */
	private function force_editor( $editor_class ) {
		if ( ! call_user_func( array( $editor_class, 'test' ), array() ) ) {
			$this->markTestSkipped( $editor_class . ' is unavailable.' );
		}
		add_filter(
			'wp_image_editors',
			function () use ( $editor_class ) {
				return array( $editor_class );
			}
		);
	}

	/**
	 * Create an image attachment.
	 *
	 * @param string $path     Image path.
	 * @param string $filename Attached filename.
	 * @return int Attachment ID.
	 */
	private function create_attachment( $path, $filename ) {
		$id = self::factory()->attachment->create_object(
			array(
				'file'           => $path,
				'post_mime_type' => wp_check_filetype( $path )['type'],
			)
		);
		update_post_meta( $id, '_wp_attached_file', $filename );
		return $id;
	}

	/**
	 * Generate metadata while ignoring PHP's expected XMP-as-EXIF warning.
	 *
	 * @param int    $id   Attachment ID.
	 * @param string $path Image path.
	 * @return array Attachment metadata.
	 */
	private function generate_metadata( $id, $path ) {
		set_error_handler(
			static function ( $errno, $message ) {
				return E_WARNING === $errno && false !== strpos( $message, 'Incorrect APP1 Exif Identifier Code' );
			},
			E_WARNING
		);
		try {
			return wp_generate_attachment_metadata( $id, $path );
		} finally {
			restore_error_handler();
		}
	}
}
