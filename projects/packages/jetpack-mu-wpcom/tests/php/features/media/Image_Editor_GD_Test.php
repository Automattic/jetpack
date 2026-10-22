<?php
/**
 * Tests for the WordPress.com GD image editor.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Closure;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\RequiresFunction;
use WP_Error;
use WP_Image_Editor;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/media/ai-marker-image-editor.php';

/**
 * Runs the editor against fake exiftool and c2patool scripts, so the tests need neither tool.
 *
 * @requires function imagejpeg
 */
#[RequiresFunction( 'imagejpeg' )]
class Image_Editor_GD_Test extends \WorDBless\BaseTestCase {

	const AI_MARKER = 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia';

	const CAMERA = 'http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture';

	const COMPOSITE = 'http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia';

	const WRITE_ARG = '-XMP-iptcExt:DigitalSourceType=';

	const SOURCE_URL = 'https://example.files.wordpress.com/2026/10/ai.jpeg';

	/**
	 * An image whose active manifest has an AI ingredient, signed with c2patool's test certificate.
	 */
	const C2PA_FIXTURES = __DIR__ . '/fixtures/';

	/**
	 * File the fake exiftool appends each call's arguments to.
	 *
	 * @var string
	 */
	private $log;

	/**
	 * Values the editor sent to jetpack_bump_stats_extras.
	 *
	 * @var string[]
	 */
	private $stats = array();

	/**
	 * File the fake c2patool writes its arguments to.
	 *
	 * @var string
	 */
	private $c2patool_log;

	/**
	 * Path download_url() wrote to, when a test mocks the download.
	 *
	 * @var string
	 */
	private $downloaded;

	/**
	 * Keeps real tools and Imagick out of the tests. The base class restores hooks and
	 * empties the uploads directory after each test.
	 */
	public function set_up() {
		parent::set_up();
		$this->log = $this->temp_path( 'log' );
		add_filter( 'jetpack_wpcom_exiftool_path', '__return_empty_string' );
		add_filter( 'jetpack_wpcom_c2patool_path', '__return_empty_string' );
		add_filter(
			'wp_image_editors',
			function ( $editors ) {
				return array_values( array_diff( $editors, array( 'WP_Image_Editor_Imagick' ) ) );
			},
			5
		);
		add_action(
			'jetpack_bump_stats_extras',
			function ( $name, $value ) {
				if ( 'image_editor_ai_marker' === $name ) {
					$this->stats[] = $value;
				}
			},
			10,
			2
		);
	}

	public function test_replaces_gd_with_the_wpcom_editor() {
		$this->assertSame(
			array( 'WP_Image_Editor_Imagick', Image_Editor_GD::class ),
			jetpack_wpcom_ai_marker_image_editors( array( 'WP_Image_Editor_Imagick', 'WP_Image_Editor_GD' ) )
		);
		$this->assertInstanceOf( Image_Editor_GD::class, wp_get_image_editor( $this->jpeg() ) );
	}

	/**
	 * Source types.
	 *
	 * @return array
	 */
	public static function data_types() {
		return array(
			'ai'           => array( self::AI_MARKER ),
			'camera photo' => array( self::CAMERA ),
		);
	}

	/**
	 * Like Photon, the editor copies the type whatever it is.
	 *
	 * @dataProvider data_types
	 *
	 * @param string $type The source's type.
	 */
	#[DataProvider( 'data_types' )]
	public function test_writes_the_source_type_into_the_saved_file( $type ) {
		$this->fake_exiftool( $type );
		$source = $this->jpeg();
		$target = $this->temp_path( 'jpeg' );

		wp_get_image_editor( $source )->save( $target );

		$this->assertSame(
			array(
				array( '-m', '-s3', '-XMP-iptcExt:DigitalSourceType', $source ),
				array( '-m', '-q', '-overwrite_original', self::WRITE_ARG . $type, $target ),
			),
			$this->exiftool_calls()
		);
		$this->assertSame( array( 'written' ), $this->stats );
	}

	public function test_the_type_is_written_before_image_make_intermediate_size_filters_run() {
		$this->fake_exiftool( self::AI_MARKER );
		$written_when_filtered = null;
		add_filter(
			'image_make_intermediate_size',
			function ( $filename ) use ( &$written_when_filtered ) {
				$written_when_filtered = $this->written_types();
				return $filename;
			}
		);

		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( array( self::AI_MARKER ), $written_when_filtered );
	}

	/**
	 * Core points the editor at each file it saves, so a later read would see the saved copy.
	 */
	public function test_reads_the_type_once_from_the_source() {
		$this->fake_exiftool( self::AI_MARKER );
		$source = $this->jpeg();
		$editor = wp_get_image_editor( $source );

		$editor->save( $this->temp_path( 'jpeg' ) );
		$editor->multi_resize(
			array(
				'small' => array(
					'width'  => 16,
					'height' => 16,
					'crop'   => true,
				),
			)
		);

		$this->assertSame( array( $source ), $this->read_paths() );
		$this->assertSame( array( self::AI_MARKER, self::AI_MARKER ), $this->written_types() );
	}

	/**
	 * The type comes from the file and must reach exiftool as one unchanged argument.
	 */
	public function test_a_type_with_shell_metacharacters_stays_one_argument() {
		$type = 'x\'; touch CANARY; echo $(id) `id` "q" \\ &end';
		$this->fake_exiftool( $type );

		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( array( $type ), $this->written_types() );
	}

	/**
	 * Manifest stores as c2patool prints them, with the exit status and the expected type.
	 *
	 * @return array
	 */
	public static function data_c2pa_stores() {
		$store = function ( $active, $manifests ) {
			return array(
				'active_manifest' => $active,
				'manifests'       => $manifests,
			);
		};

		return array(
			'active manifest listed last' => array(
				$store(
					'composite',
					array(
						'ingredient' => self::manifest( self::AI_MARKER ),
						'composite'  => self::manifest( self::COMPOSITE ),
					)
				),
				0,
				self::COMPOSITE,
			),
			'type only on an ingredient'  => array(
				$store(
					'edit',
					array(
						'edit'       => self::manifest( null ),
						'ingredient' => self::manifest( self::AI_MARKER ),
					)
				),
				0,
				self::AI_MARKER,
			),
			'no type'                     => array( $store( 'a', array( 'a' => self::manifest( null ) ) ), 0, '' ),
			'c2patool fails'              => array( $store( 'a', array( 'a' => self::manifest( self::AI_MARKER ) ) ), 1, '' ),
		);
	}

	/**
	 * Some models mark their output only in C2PA, so a source with no XMP type falls back to it.
	 *
	 * @dataProvider data_c2pa_stores
	 *
	 * @param array  $store    The manifest store the fake c2patool prints.
	 * @param int    $status   The fake c2patool's exit status.
	 * @param string $expected The type the saved file should get.
	 */
	#[DataProvider( 'data_c2pa_stores' )]
	public function test_reads_the_type_from_the_c2pa_store( $store, $status, $expected ) {
		$this->fake_exiftool( '' );
		$this->fake_c2patool( $store, $status );
		$source = $this->jpeg();

		wp_get_image_editor( $source )->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( '' === $expected ? array() : array( $expected ), $this->written_types() );
		$this->assertSame( '' !== $expected, in_array( 'from-c2pa', $this->stats, true ) );
		$args = $this->c2patool_args();
		$this->assertSame( array( '--settings', $source ), array( $args[0], $args[2] ) );
		$this->assertFileEquals( Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/media/c2pa-settings.json', $args[1] );
	}

	public function test_xmp_wins_over_the_c2pa_manifest() {
		$this->fake_exiftool( self::CAMERA );
		$this->fake_c2patool( array( 'manifests' => array( 'a' => self::manifest( self::AI_MARKER ) ) ) );
		$lookups = 0;
		add_filter(
			'jetpack_wpcom_c2patool_path',
			function ( $path ) use ( &$lookups ) {
				++$lookups;
				return $path;
			},
			30
		);

		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( array( self::CAMERA ), $this->written_types() );
		$this->assertSame( 0, $lookups );
	}

	/**
	 * Checks the fake stores above against real c2patool output, so it skips without c2patool.
	 */
	public function test_reads_the_type_from_real_c2patool_output() {
		$this->fake_exiftool( '' );
		$source = $this->c2pa_fixture( 'c2pa-ai-composite.jpg' );

		wp_get_image_editor( $source )->save( $this->temp_path( 'jpg' ) );

		$this->assertSame( array( self::COMPOSITE ), $this->written_types() );
		$this->assertFileEquals( self::C2PA_FIXTURES . 'c2pa-ai-composite.jpg', $source );
	}

	/**
	 * Core loads the source by URL when the file isn't on this host.
	 */
	public function test_an_image_loaded_by_url_keeps_its_type() {
		$this->fake_exiftool( self::AI_MARKER );
		$this->mock_download( $this->jpeg() );

		$this->editor_loaded_by_url()->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( array( $this->downloaded ), $this->read_paths() );
		$this->assertSame( array( self::AI_MARKER ), $this->written_types() );
		$this->assertFileDoesNotExist( $this->downloaded );
	}

	public function test_saves_the_edit_when_the_download_fails() {
		$this->fake_exiftool( self::AI_MARKER );
		$this->mock_download( null );

		$saved = $this->editor_loaded_by_url()->save( $this->temp_path( 'jpeg' ) );

		$this->assertIsArray( $saved );
		$this->assertSame( array(), $this->exiftool_calls() );
		$this->assertSame( array( 'remote-source', 'download-failed' ), $this->stats );
	}

	/**
	 * The C2PA read can find a type that exiftool, being missing, cannot write.
	 */
	public function test_saves_the_edit_without_exiftool() {
		$this->fake_c2patool( array( 'manifests' => array( 'a' => self::manifest( self::AI_MARKER ) ) ) );

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertIsArray( $saved );
		$this->assertNotContains( 'write-failed', $this->stats );
	}

	public function test_saves_the_edit_when_exiftool_cannot_write() {
		$this->fake_exiftool( self::AI_MARKER, 1 );

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertIsArray( $saved );
		$this->assertNotFalse( getimagesize( $saved['path'] ) );
		$this->assertSame( array( 'write-failed' ), $this->stats );
	}

	/**
	 * Points the editor at a fake exiftool that logs its arguments and prints $type for a read.
	 *
	 * @param string $type         What a read prints.
	 * @param int    $write_status Exit status of a write.
	 */
	private function fake_exiftool( $type, $write_status = 0 ) {
		$log = escapeshellarg( $this->log );
		$this->fake_tool(
			'exiftool',
			"printf '%s\\037' \"\$@\" >> $log\n"
			. "printf '\\036' >> $log\n"
			. 'case " $* " in *" -s3 "*) printf %s ' . escapeshellarg( $type ) . "; exit 0;; esac\n"
			. "exit $write_status\n"
		);
	}

	/**
	 * Points the editor at a fake c2patool that prints $store and exits with $status.
	 *
	 * @param array $store  The manifest store to print as JSON.
	 * @param int   $status Exit status.
	 */
	private function fake_c2patool( $store, $status = 0 ) {
		$output             = $this->temp_path( 'json' );
		$this->c2patool_log = $this->temp_path( 'log' );
		file_put_contents( $output, wp_json_encode( $store, JSON_UNESCAPED_SLASHES ) );
		$this->fake_tool( 'c2patool', "printf '%s\\037' \"\$@\" > " . escapeshellarg( $this->c2patool_log ) . "\ncat " . escapeshellarg( $output ) . "\nexit $status\n" );
	}

	/**
	 * Returns the arguments the fake c2patool got.
	 *
	 * @return string[]
	 */
	private function c2patool_args() {
		return explode( "\037", rtrim( (string) file_get_contents( $this->c2patool_log ), "\037" ) );
	}

	/**
	 * Writes a shell script and makes the editor's lookup for $tool return it.
	 *
	 * @param string $tool exiftool or c2patool.
	 * @param string $body The script after its shebang line.
	 */
	private function fake_tool( $tool, $body ) {
		$script = $this->temp_path( 'sh' );
		file_put_contents( $script, "#!/bin/sh\n" . $body );
		chmod( $script, 0755 );
		add_filter(
			"jetpack_wpcom_{$tool}_path",
			function () use ( $script ) {
				return $script;
			},
			20
		);
	}

	/**
	 * Returns the arguments of each call to the fake exiftool, in order.
	 *
	 * @return string[][]
	 */
	private function exiftool_calls() {
		if ( ! file_exists( $this->log ) ) {
			return array();
		}
		$calls = array_filter( explode( "\036", file_get_contents( $this->log ) ) );

		return array_values(
			array_map(
				function ( $call ) {
					return explode( "\037", rtrim( $call, "\037" ) );
				},
				$calls
			)
		);
	}

	/**
	 * Returns the file each read asked exiftool about.
	 *
	 * @return string[]
	 */
	private function read_paths() {
		$paths = array();
		foreach ( $this->exiftool_calls() as $args ) {
			if ( in_array( '-s3', $args, true ) ) {
				$paths[] = end( $args );
			}
		}

		return $paths;
	}

	/**
	 * Returns the type each write asked exiftool to set.
	 *
	 * @return string[]
	 */
	private function written_types() {
		$types = array();
		foreach ( $this->exiftool_calls() as $args ) {
			foreach ( $args as $arg ) {
				if ( str_starts_with( $arg, self::WRITE_ARG ) ) {
					$types[] = substr( $arg, strlen( self::WRITE_ARG ) );
				}
			}
		}

		return $types;
	}

	/**
	 * A manifest with one c2pa.created action.
	 *
	 * @param string|null $type The action's type, or null for none.
	 * @return array
	 */
	private static function manifest( $type ) {
		$action = array( 'action' => 'c2pa.created' );
		if ( null !== $type ) {
			$action['digitalSourceType'] = $type;
		}

		return array(
			'assertions' => array(
				array(
					'label' => 'c2pa.actions.v2',
					'data'  => array( 'actions' => array( $action ) ),
				),
			),
		);
	}

	/**
	 * Serves $source to download_url(), or fails the request when $source is null.
	 *
	 * @param string|null $source Path of the file to serve.
	 */
	private function mock_download( $source ) {
		add_filter(
			'pre_http_request',
			function ( $response, $args ) use ( $source ) {
				if ( null === $source ) {
					return new WP_Error( 'http_request_failed', 'Offline.' );
				}
				$this->downloaded = $args['filename'];
				copy( $source, $args['filename'] );

				return array( 'response' => array( 'code' => 200 ) );
			},
			10,
			2
		);
	}

	/**
	 * Tests can't mock the file_get_contents() GD uses for a URL source, so the pixels
	 * come from disk and the editor then points at the URL, as core does when the file
	 * isn't on this host.
	 *
	 * @return WP_Image_Editor
	 */
	private function editor_loaded_by_url() {
		$editor = wp_get_image_editor( $this->jpeg() );
		$url    = self::SOURCE_URL;
		Closure::bind(
			/** @phan-closure-scope \WP_Image_Editor */
			function () use ( $url ) {
				$this->file = $url;
			},
			$editor,
			WP_Image_Editor::class
		)();

		return $editor;
	}

	/**
	 * Copies a C2PA fixture and points the editor at the real c2patool, or skips without one.
	 *
	 * @param string $name Fixture file name.
	 * @return string
	 */
	private function c2pa_fixture( $name ) {
		exec( 'command -v c2patool 2>/dev/null', $output, $status );
		if ( 0 !== $status ) {
			$this->markTestSkipped( 'c2patool is not installed.' );
		}
		$c2patool = trim( implode( '', $output ) );
		add_filter(
			'jetpack_wpcom_c2patool_path',
			function () use ( $c2patool ) {
				return $c2patool;
			},
			20
		);

		$path = $this->temp_path( 'jpg' );
		copy( self::C2PA_FIXTURES . $name, $path );

		return $path;
	}

	/**
	 * Returns the path of a fresh 32x48 JPEG.
	 *
	 * @return string
	 */
	private function jpeg() {
		$path = $this->temp_path( 'jpeg' );
		imagejpeg( imagecreatetruecolor( 32, 48 ), $path );

		return $path;
	}

	/**
	 * Returns a fresh path in the uploads directory, which the base class empties after each test.
	 *
	 * @param string $extension File extension.
	 * @return string
	 */
	private function temp_path( $extension ) {
		return wp_upload_dir()['path'] . '/ai-marker-' . wp_generate_password( 12, false ) . '.' . $extension;
	}
}
