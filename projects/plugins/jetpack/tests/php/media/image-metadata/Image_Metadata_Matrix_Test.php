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

		// The WP test harness defaults to year/month upload subfolders, so
		// `wp_upload_dir()['path']` would be `.../uploads/2026/07` while
		// `wp_get_original_image_path()` (via `get_attached_file()`) always
		// resolves `_wp_attached_file` against `basedir`, never `path`. Turning
		// off year/month folders keeps `path` equal to `basedir`, so the file
		// this test writes is the same file the code under test reads back.
		update_option( 'uploads_use_yearmonth_folders', 0 );

		// `wp_upload_dir()` memoises its result in a function-static cache keyed
		// only by blog ID, and the core test harness's own `set_up()` (invoked
		// above via `parent::set_up()`) already primes that cache before the
		// option above is changed. Passing `$refresh_cache = true` forces it to
		// recompute against the option we just set.
		$uploads   = wp_upload_dir( null, true, true );
		$this->dir = trailingslashit( $uploads['path'] );
		wp_mkdir_p( $this->dir );

		require_once ABSPATH . 'wp-admin/includes/image.php';

		// WP_Image_Editor_GD/Imagick are normally lazy-loaded the first time
		// core's _wp_image_editor_choose() runs. Load them explicitly up front
		// so force_editor()'s class_exists()/::test() checks below can see them
		// regardless of whether anything else has triggered that lazy load yet.
		require_once ABSPATH . WPINC . '/class-wp-image-editor.php';
		require_once ABSPATH . WPINC . '/class-wp-image-editor-gd.php';
		require_once ABSPATH . WPINC . '/class-wp-image-editor-imagick.php';

		// The fixture images are deliberately tiny (a handful of pixels) so the
		// suite runs fast; core's image_resize_dimensions() refuses to generate
		// any of the default registered sizes (thumbnail is 150x150, etc.) from a
		// source that small in both dimensions. Force a single custom sub-size
		// that's smaller than every fixture so wp_generate_attachment_metadata()
		// always produces at least one real, on-disk derivative to assert against.
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
	 * Upload a provenance-bearing image and generate real derivatives. The
	 * PHP_INT_MAX hook registered by Image_Metadata::init() (wired in the Jetpack
	 * constructor) runs during wp_generate_attachment_metadata().
	 *
	 * @param string $bytes    Source bytes with provenance.
	 * @param string $filename Target filename.
	 * @return array Attachment metadata.
	 */
	private function process( $bytes, $filename ) {
		$path = $this->dir . $filename;
		file_put_contents( $path, $bytes );
		$id = $this->factory->attachment->create_object(
			array(
				'file'           => $path,
				'post_mime_type' => wp_check_filetype( $path )['type'],
			)
		);
		update_post_meta( $id, '_wp_attached_file', $filename );

		// The JPEG provenance fixture embeds a synthetic APP1 "Exif" segment
		// whose payload is just a marker string (used only to prove EXIF is
		// excluded from what we inject) rather than valid TIFF data. Core's own
		// wp_read_image_metadata() — called by wp_generate_attachment_metadata()
		// to populate the original image's image_meta, entirely independent of
		// the Metadata_Preserver code this test exercises — hands that fake
		// payload to PHP's native exif_read_data(). With WP_DEBUG on and
		// WP_RUN_CORE_TESTS unset, wp-admin/includes/image.php deliberately
		// lets exif_read_data()'s native PHP warnings through instead of
		// silencing them (see its own inline comment referencing
		// https://core.trac.wordpress.org/ticket/42480), which PHPUnit's
		// failOnWarning setting would otherwise turn into a test failure. Swallow
		// only those two known, expected exif-parsing warnings; anything else
		// still surfaces as a failure.
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

		// Simulate an image optimizer that runs earlier in the same filter and
		// re-writes each derivative as a bare (metadata-less) file. Ours runs at
		// PHP_INT_MAX, after it, so it must re-inject into the final bytes.
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
