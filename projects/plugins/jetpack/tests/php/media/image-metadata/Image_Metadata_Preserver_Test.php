<?php
/**
 * Tests for the metadata preservation orchestrator.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Image_Metadata\Metadata_Preserver;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/class-image-metadata-fixtures.php';
require_once __DIR__ . '/class-image-metadata-stream-probe.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\Metadata_Preserver
 */
#[CoversClass( Metadata_Preserver::class )]
class Image_Metadata_Preserver_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @var string Uploads directory for the current test.
	 */
	private $dir;

	public function set_up() {
		parent::set_up();

		// The WP test harness defaults to year/month upload subfolders, so
		// `wp_upload_dir()['path']` would be `.../uploads/2026/07` while a bare
		// `_wp_attached_file` of `example.png` resolves against the uploads
		// basedir (`.../uploads/example.png`) — `get_attached_file()`, which
		// `wp_get_original_image_path()` calls, always resolves against
		// `basedir`, never `path`. Turning off year/month folders keeps `path`
		// equal to `basedir`, so the file this test writes is the same file
		// `wp_get_original_image_path()` reads back.
		//
		// `wp_upload_dir()` memoises its result in a function-static cache keyed
		// only by blog ID and the (here, always null) `$time` argument. The core
		// test harness's own `set_up()` (invoked above via `parent::set_up()`)
		// already primes that cache before this option is changed, so a plain
		// `wp_upload_dir()` call here would still return the stale, cached
		// year/month path. Passing `$refresh_cache = true` forces it to
		// recompute against the option we just set.
		update_option( 'uploads_use_yearmonth_folders', 0 );

		$uploads   = wp_upload_dir( null, true, true );
		$this->dir = trailingslashit( $uploads['path'] );
		wp_mkdir_p( $this->dir );
	}

	public function tear_down() {
		if ( in_array( 'provprobe', stream_get_wrappers(), true ) ) {
			stream_wrapper_unregister( 'provprobe' );
		}
		Image_Metadata_Stream_Probe::$opens = 0;

		parent::tear_down();
	}

	/**
	 * Create a real PNG attachment whose original carries provenance, plus one
	 * bare derivative on disk. Returns [ attachment_id, metadata ].
	 *
	 * @return array
	 */
	private function seed_png_attachment() {
		$original = $this->dir . 'example.png';
		$deriv    = $this->dir . 'example-150x150.png';
		file_put_contents( $original, Image_Metadata_Fixtures::png_with_provenance() );
		file_put_contents( $deriv, Image_Metadata_Fixtures::bare_png() );

		$attachment_id = $this->factory->attachment->create_object(
			array(
				'file'           => $original,
				'post_mime_type' => 'image/png',
			)
		);
		update_post_meta( $attachment_id, '_wp_attached_file', 'example.png' );

		// Confirm the upload-path fix above actually resolved to the file this
		// test wrote, so a mismatch fails loudly here instead of masquerading as
		// a "no provenance found" skip further down the pipeline.
		$this->assertSame( $original, wp_get_original_image_path( $attachment_id ) );

		$metadata = array(
			'file'  => 'example.png',
			'sizes' => array(
				'thumbnail' => array( 'file' => 'example-150x150.png' ),
			),
		);
		return array( $attachment_id, $metadata );
	}

	public function test_injects_provenance_into_derivative() {
		list( $id, $metadata ) = $this->seed_png_attachment();
		$returned              = Metadata_Preserver::preserve( $metadata, $id );

		$this->assertSame( $metadata, $returned, 'metadata array must be returned unchanged' );
		$this->assertStringContainsString( 'trainedAlgorithmicMedia', file_get_contents( $this->dir . 'example-150x150.png' ) );
	}

	public function test_is_idempotent_no_second_injection() {
		list( $id, $metadata ) = $this->seed_png_attachment();
		Metadata_Preserver::preserve( $metadata, $id );
		$after_first = file_get_contents( $this->dir . 'example-150x150.png' );

		Metadata_Preserver::preserve( $metadata, $id );
		$after_second = file_get_contents( $this->dir . 'example-150x150.png' );

		$this->assertSame( $after_first, $after_second, 'a second run must be a no-op' );
		// Note: this test's fixture is a PNG, whose provenance chunk carries the
		// keyword `XML:com.adobe.xmp` (see Image_Metadata_Fixtures::png_with_provenance())
		// rather than the JPEG-only `http://ns.adobe.com/xap/1.0/` APP1 signature, so
		// the format-agnostic DigitalSourceType marker is what proves a single copy.
		$this->assertSame( 1, substr_count( $after_second, 'trainedAlgorithmicMedia' ) );
	}

	public function test_filter_override_can_disable() {
		list( $id, $metadata ) = $this->seed_png_attachment();
		add_filter( 'jetpack_preserve_image_provenance_metadata', '__return_false' );

		Metadata_Preserver::preserve( $metadata, $id );
		$this->assertStringNotContainsString( 'trainedAlgorithmicMedia', file_get_contents( $this->dir . 'example-150x150.png' ) );
	}

	public function test_skips_when_photon_active() {
		list( $id, $metadata ) = $this->seed_png_attachment();

		// Flip the Image CDN's private static enabled flag without instantiating
		// the singleton, then restore it so no state leaks to other tests.
		$prop = new ReflectionProperty( '\Automattic\Jetpack\Image_CDN\Image_CDN', 'is_enabled' );
		$prop->setAccessible( true );
		$prop->setValue( null, true );
		try {
			Metadata_Preserver::preserve( $metadata, $id );
			$this->assertStringNotContainsString( 'trainedAlgorithmicMedia', file_get_contents( $this->dir . 'example-150x150.png' ) );
		} finally {
			$prop->setValue( null, false );
		}
	}

	public function test_skips_stream_wrapper_original() {
		list( $id, $metadata ) = $this->seed_png_attachment();

		if ( in_array( 'provprobe', stream_get_wrappers(), true ) ) {
			stream_wrapper_unregister( 'provprobe' );
		}
		Image_Metadata_Stream_Probe::$opens = 0;
		stream_wrapper_register( 'provprobe', 'Image_Metadata_Stream_Probe' );

		add_filter(
			'wp_get_original_image_path',
			function () {
				return 'provprobe://vfs/example.png';
			}
		);

		// Sanity-check that the condition gate 3 relies on is actually true here,
		// so this test would fail loudly (rather than silently pass) if a future
		// change made `wp_is_stream()` stop recognising this scheme.
		$this->assertTrue( wp_is_stream( 'provprobe://vfs/example.png' ) );

		// `Metadata_Preserver::warn()` deliberately calls `trigger_error()` with
		// E_USER_WARNING when gate 3 skips, so this is the expected, intended
		// behaviour of the code under test rather than an accident. Install a
		// no-op error handler for the duration of the call so PHPUnit's own
		// error handler (which would otherwise convert that warning into a test
		// failure) never sees it; the assertions below are what actually verify
		// the gate worked.
		set_error_handler( '__return_true' );
		try {
			// Must not fatal and must return metadata unchanged; derivative untouched.
			$this->assertSame( $metadata, Metadata_Preserver::preserve( $metadata, $id ) );
		} finally {
			restore_error_handler();
		}

		// The key assertion: if gate 3 were bypassed, extracting provenance from
		// the "original" would call file_get_contents( 'provprobe://...' ), which
		// PHP routes through Image_Metadata_Stream_Probe::stream_open(). A count
		// of zero proves the gate stopped execution before any read was attempted.
		$this->assertSame( 0, Image_Metadata_Stream_Probe::$opens, 'gate 3 must skip before extract() opens the original' );

		$this->assertStringNotContainsString( 'trainedAlgorithmicMedia', file_get_contents( $this->dir . 'example-150x150.png' ) );
	}

	public function test_injects_into_scaled_main_derivative() {
		list( $id ) = $this->seed_png_attachment();

		// A bare (no-provenance) "-scaled" derivative, standing in for the case
		// where WordPress downsizes an oversized upload and stores the resized
		// copy as the attachment's main file while the untouched original stays
		// on disk under its own name.
		$scaled = $this->dir . 'example-scaled.png';
		file_put_contents( $scaled, Image_Metadata_Fixtures::bare_png() );

		// `wp_get_original_image_path()` still resolves to `example.png` (the
		// real original seeded above), so this main file genuinely differs from
		// the original and exercises the main-derivative branch of `output_files()`.
		$metadata = array(
			'file'  => 'example-scaled.png',
			'sizes' => array(),
		);
		Metadata_Preserver::preserve( $metadata, $id );

		$this->assertStringContainsString( 'trainedAlgorithmicMedia', file_get_contents( $scaled ) );
	}

	public function test_corrupt_original_leaves_derivative_intact() {
		$original = $this->dir . 'broken.png';
		$deriv    = $this->dir . 'broken-150x150.png';
		file_put_contents( $original, "\x89PNG\r\n\x1a\ngarbage-not-a-real-png" );
		$bare = Image_Metadata_Fixtures::bare_png();
		file_put_contents( $deriv, $bare );

		$id = $this->factory->attachment->create_object(
			array(
				'file'           => $original,
				'post_mime_type' => 'image/png',
			)
		);
		update_post_meta( $id, '_wp_attached_file', 'broken.png' );

		$metadata = array(
			'file'  => 'broken.png',
			'sizes' => array( 'thumbnail' => array( 'file' => 'broken-150x150.png' ) ),
		);
		Metadata_Preserver::preserve( $metadata, $id );

		$this->assertSame( $bare, file_get_contents( $deriv ), 'derivative must be untouched' );
	}
}
