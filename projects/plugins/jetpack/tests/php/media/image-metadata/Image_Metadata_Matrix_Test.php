<?php
/**
 * End-to-end matrix (GD/Imagick x PNG/JPEG) and late-priority ordering.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/class-image-metadata-fixtures.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\Metadata_Preserver
 */
#[CoversClass( \Automattic\Jetpack\Plugin\Image_Metadata\Metadata_Preserver::class )]
class Image_Metadata_Matrix_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @var string
	 */
	private $dir;

	public function set_up() {
		parent::set_up();

		// Match the upload path to the base directory used for attached files.
		update_option( 'uploads_use_yearmonth_folders', 0 );

		// Refresh the upload directory after changing the option.
		$uploads   = wp_upload_dir( null, true, true );
		$this->dir = trailingslashit( $uploads['path'] );
		wp_mkdir_p( $this->dir );

		require_once ABSPATH . 'wp-admin/includes/image.php';

		// Load editor classes before checking their availability.
		require_once ABSPATH . WPINC . '/class-wp-image-editor.php';
		require_once ABSPATH . WPINC . '/class-wp-image-editor-gd.php';
		require_once ABSPATH . WPINC . '/class-wp-image-editor-imagick.php';

		// Use a size smaller than the fixture images.
		add_filter(
			'intermediate_image_sizes_advanced',
			function () {
				return array(
					'jetpack_image_metadata_test' => array(
						'width'  => 2,
						'height' => 2,
						'crop'   => true,
					),
				);
			}
		);
	}

	public function tear_down() {
		remove_all_filters( 'wp_image_editors' );
		remove_all_filters( 'wp_generate_attachment_metadata' );
		remove_all_filters( 'intermediate_image_sizes_advanced' );
		parent::tear_down();
	}

	/**
	 * Force a single image editor, skipping the cell when unavailable.
	 *
	 * @param string $editor_class Editor class.
	 * @return void
	 */
	private function force_editor( $editor_class ) {
		if ( ! class_exists( $editor_class ) || ! call_user_func( array( $editor_class, 'test' ), array() ) ) {
			$this->markTestSkipped( $editor_class . ' is not available.' );
		}
		add_filter(
			'wp_image_editors',
			function () use ( $editor_class ) {
				return array( $editor_class );
			}
		);
	}

	/**
	 * Upload an image and generate its derivatives.
	 *
	 * @param string $bytes    Source bytes with provenance.
	 * @param string $filename Target filename.
	 * @return array Attachment metadata.
	 */
	private function process( $bytes, $filename ) {
		$path = $this->dir . $filename;
		file_put_contents( $path, $bytes );
		$id = self::factory()->attachment->create_object(
			array(
				'file'           => $path,
				'post_mime_type' => wp_check_filetype( $path )['type'],
			)
		);
		update_post_meta( $id, '_wp_attached_file', $filename );

		// Ignore warnings from the fixture's deliberately invalid EXIF segment.
		set_error_handler(
			static function ( $errno, $errstr ) {
				foreach ( array( 'Incorrect APP1 Exif Identifier Code', 'Invalid TIFF alignment marker' ) as $known_benign_warning ) {
					if ( str_contains( $errstr, $known_benign_warning ) ) {
						return true;
					}
				}
				return false;
			},
			E_WARNING
		);
		try {
			return wp_generate_attachment_metadata( $id, $path );
		} finally {
			restore_error_handler();
		}
	}

	/**
	 * @return array<string,array{0:string}>
	 */
	public static function editor_provider() {
		return array(
			'GD'      => array( 'WP_Image_Editor_GD' ),
			'Imagick' => array( 'WP_Image_Editor_Imagick' ),
		);
	}

	/**
	 * @param string $editor_class Editor to force.
	 * @dataProvider editor_provider
	 */
	#[DataProvider( 'editor_provider' )]
	public function test_png_derivatives_carry_provenance( $editor_class ) {
		$this->force_editor( $editor_class );
		$metadata = $this->process( Image_Metadata_Fixtures::png_with_provenance(), 'matrix.png' );

		$this->assertNotEmpty( $metadata['sizes'] );
		foreach ( $metadata['sizes'] as $size ) {
			$this->assertStringContainsString(
				'trainedAlgorithmicMedia',
				file_get_contents( $this->dir . $size['file'] ),
				"size {$size['file']} lost provenance under $editor_class"
			);
		}
	}

	/**
	 * @param string $editor_class Editor to force.
	 * @dataProvider editor_provider
	 */
	#[DataProvider( 'editor_provider' )]
	public function test_jpeg_derivatives_carry_provenance_exactly_once( $editor_class ) {
		$this->force_editor( $editor_class );
		$metadata = $this->process( Image_Metadata_Fixtures::jpeg_with_provenance(), 'matrix.jpg' );

		$this->assertNotEmpty( $metadata['sizes'] );
		foreach ( $metadata['sizes'] as $size ) {
			$deriv = file_get_contents( $this->dir . $size['file'] );
			$this->assertStringContainsString( 'trainedAlgorithmicMedia', $deriv, "size {$size['file']} lost provenance under $editor_class" );
			$this->assertSame(
				1,
				substr_count( $deriv, 'ns.adobe.com/xap/1.0' ),
				"size {$size['file']} has a duplicate XMP packet under $editor_class"
			);
		}
	}

	public function test_late_priority_beats_an_earlier_optimizer() {
		$this->force_editor( 'WP_Image_Editor_GD' );

		// Strip metadata immediately before the preservation callback runs.
		$dir = $this->dir;
		add_filter(
			'wp_generate_attachment_metadata',
			function ( $metadata ) use ( $dir ) {
				if ( ! empty( $metadata['sizes'] ) ) {
					foreach ( $metadata['sizes'] as $size ) {
						file_put_contents( $dir . $size['file'], Image_Metadata_Fixtures::bare_png() );
					}
				}
				return $metadata;
			},
			PHP_INT_MAX - 1,
			1
		);

		$metadata = $this->process( Image_Metadata_Fixtures::png_with_provenance(), 'ordering.png' );

		$this->assertNotEmpty( $metadata['sizes'] );
		foreach ( $metadata['sizes'] as $size ) {
			$this->assertStringContainsString(
				'trainedAlgorithmicMedia',
				file_get_contents( $this->dir . $size['file'] ),
				"an earlier optimizer stripped {$size['file']} and we did not re-inject"
			);
		}
	}
}
