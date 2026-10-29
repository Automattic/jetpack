<?php
/**
 * Tests for the WordPress.com GD image editor.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
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
class Jetpack_WPCOM_Image_Editor_GD_Test extends \WorDBless\BaseTestCase {

	const AI_MARKER = 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia';

	const CAMERA = 'http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture';

	const COMPOSITE = 'http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia';

	const WRITE_ARG = '-XMP-iptcExt:DigitalSourceType=';

	/**
	 * An image whose active manifest has an AI ingredient, signed with c2patool's test certificate.
	 */
	const C2PA_FIXTURE = __DIR__ . '/fixtures/c2pa-ai-composite.jpg';

	/**
	 * Log file for each fake tool, by tool name.
	 *
	 * @var string[]
	 */
	private $logs = array();

	/**
	 * Values the editor sent to jetpack_bump_stats_extras.
	 *
	 * @var string[]
	 */
	private $stats = array();

	/**
	 * Path download_url() wrote to, when a test mocks the download.
	 *
	 * @var string
	 */
	private $downloaded;

	/**
	 * Keeps real tools and Imagick out of the tests.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_wpcom_ai_marker_tool_path', '__return_empty_string' );
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

	/**
	 * Some hosts subclass each editor by name with eval(), so the name must be a plain identifier.
	 */
	public function test_replaces_gd_with_the_wpcom_editor() {
		$this->assertSame(
			array( 'WP_Image_Editor_Imagick', 'Jetpack_WPCOM_Image_Editor_GD' ),
			jetpack_wpcom_ai_marker_image_editors( array( 'WP_Image_Editor_Imagick', 'WP_Image_Editor_GD' ) )
		);
		$this->assertInstanceOf( 'Jetpack_WPCOM_Image_Editor_GD', wp_get_image_editor( $this->jpeg() ) );
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
				array( '-m', '-S', '-XMP-iptcExt:DigitalSourceType', '-JUMBF:JUMDLabel', $source ),
				array( '-m', '-q', '-overwrite_original', self::WRITE_ARG . $type, $target ),
			),
			$this->calls( 'exiftool' )
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
	 * The tool that hangs.
	 *
	 * @return array
	 */
	public static function data_tools() {
		return array(
			'exiftool' => array( 'exiftool' ),
			'c2patool' => array( 'c2patool' ),
		);
	}

	/**
	 * @dataProvider data_tools
	 *
	 * @param string $tool The tool that hangs.
	 */
	#[DataProvider( 'data_tools' )]
	public function test_stops_a_tool_at_the_time_limit( $tool ) {
		if ( 'c2patool' === $tool ) {
			$this->fake_exiftool( '', 0, true );
		}
		$this->fake_tool( $tool, "exec sleep 5\n" );
		add_filter(
			'jetpack_wpcom_ai_marker_tool_time_limit',
			function () {
				return 1;
			}
		);
		$start = microtime( true );

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertLessThan( 3, microtime( true ) - $start );
		$this->assertIsArray( $saved );
		$this->assertSame( array( 'timed-out' ), $this->stats );
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
			'type is not a string'        => array( $store( 'a', array( 'a' => self::manifest( array( 'x' => 1 ) ) ) ), 0, '' ),
			'string type after a bad one' => array(
				$store(
					'edit',
					array(
						'edit'       => self::manifest( array( 'x' => 1 ) ),
						'ingredient' => self::manifest( self::AI_MARKER ),
					)
				),
				0,
				self::AI_MARKER,
			),
			'c2patool fails'              => array( $store( 'a', array( 'a' => self::manifest( self::AI_MARKER ) ) ), 1, '' ),
		);
	}

	/**
	 * @dataProvider data_c2pa_stores
	 *
	 * @param array  $store    The manifest store the fake c2patool prints.
	 * @param int    $status   The fake c2patool's exit status.
	 * @param string $expected The type the saved file should get.
	 */
	#[DataProvider( 'data_c2pa_stores' )]
	public function test_reads_the_type_from_the_c2pa_store( $store, $status, $expected ) {
		$this->fake_exiftool( '', 0, true );
		$this->fake_c2patool( $store, $status );
		$source = $this->jpeg();

		wp_get_image_editor( $source )->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( '' === $expected ? array() : array( $expected ), $this->written_types() );
		$this->assertSame( '' !== $expected, in_array( 'from-c2pa', $this->stats, true ) );
		$args = $this->calls( 'c2patool' )[0];
		$this->assertSame( array( '--settings', $source ), array( $args[0], $args[2] ) );
		$this->assertFileEquals( Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/media/c2pa-settings.json', $args[1] );
	}

	public function test_xmp_wins_over_the_c2pa_manifest() {
		$this->fake_exiftool( self::CAMERA, 0, true );
		$this->fake_c2patool( array( 'manifests' => array( 'a' => self::manifest( self::AI_MARKER ) ) ) );

		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( array( self::CAMERA ), $this->written_types() );
		$this->assertSame( array(), $this->calls( 'c2patool' ) );
	}

	/**
	 * Most uploads have no manifest, so c2patool would otherwise run on nearly every save.
	 */
	public function test_skips_c2patool_when_the_file_has_no_manifest() {
		$this->fake_exiftool( '' );
		$this->fake_c2patool( array( 'manifests' => array( 'a' => self::manifest( self::AI_MARKER ) ) ) );

		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( array(), $this->calls( 'c2patool' ) );
		$this->assertSame( array(), $this->written_types() );
	}

	/**
	 * Checks the fake stores against real c2patool output. Skips without c2patool.
	 */
	public function test_reads_the_type_from_real_c2patool_output() {
		$this->fake_exiftool( '', 0, true );
		$source = $this->c2pa_fixture();

		wp_get_image_editor( $source )->save( $this->temp_path( 'jpg' ) );

		$this->assertSame( array( self::COMPOSITE ), $this->written_types() );
		$this->assertFileEquals( self::C2PA_FIXTURE, $source );
	}

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
		$this->assertSame( array(), $this->calls( 'exiftool' ) );
		$this->assertSame( array( 'remote-source', 'download-failed' ), $this->stats );
	}

	public function test_saves_the_edit_without_exiftool() {
		$this->fake_c2patool( array( 'manifests' => array( 'a' => self::manifest( self::AI_MARKER ) ) ) );

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertIsArray( $saved );
		$this->assertSame( array(), $this->calls( 'c2patool' ) );
		$this->assertSame( array(), $this->stats );
	}

	public function test_saves_the_edit_when_exiftool_cannot_write() {
		$this->fake_exiftool( self::AI_MARKER, 1 );

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertIsArray( $saved );
		$this->assertNotFalse( getimagesize( $saved['path'] ) );
		$this->assertSame( array( 'write-failed' ), $this->stats );
	}

	/**
	 * Fakes exiftool: a read reports $type and maybe a C2PA box, a write exits with $write_status.
	 *
	 * @param string $type         The XMP type a read reports, or '' for none.
	 * @param int    $write_status Exit status of a write.
	 * @param bool   $has_c2pa     Whether a read reports a C2PA box.
	 */
	private function fake_exiftool( $type, $write_status = 0, $has_c2pa = false ) {
		$read = '' === $type ? '' : "printf 'DigitalSourceType: %s\\n' " . escapeshellarg( $type ) . '; ';
		if ( $has_c2pa ) {
			$read .= "echo 'JUMDLabel: c2pa'; ";
		}

		$this->fake_tool( 'exiftool', 'case " $* " in *" -S "*) ' . $read . "exit 0;; esac\nexit $write_status\n" );
	}

	/**
	 * Points the editor at a fake c2patool that prints $store and exits with $status.
	 *
	 * @param array $store  The manifest store to print as JSON.
	 * @param int   $status Exit status.
	 */
	private function fake_c2patool( $store, $status = 0 ) {
		$output = $this->temp_path( 'json' );
		file_put_contents( $output, wp_json_encode( $store, JSON_UNESCAPED_SLASHES ) );
		$this->fake_tool( 'c2patool', 'cat ' . escapeshellarg( $output ) . "\nexit $status\n" );
	}

	/**
	 * Makes $tool a shell script that logs its arguments, then runs $body.
	 *
	 * @param string $tool exiftool or c2patool.
	 * @param string $body The script after the logging lines.
	 */
	private function fake_tool( $tool, $body ) {
		$this->logs[ $tool ] = $this->temp_path( 'log' );
		$log                 = escapeshellarg( $this->logs[ $tool ] );
		$script              = $this->temp_path( 'sh' );
		file_put_contents( $script, "#!/bin/sh\nprintf '%s\\037' \"\$@\" >> $log\nprintf '\\036' >> $log\n" . $body );
		chmod( $script, 0755 );
		$this->use_tool( $tool, $script );
	}

	/**
	 * Points the editor at $path for $tool.
	 *
	 * @param string $tool exiftool or c2patool.
	 * @param string $path Path of the program.
	 */
	private function use_tool( $tool, $path ) {
		add_filter(
			'jetpack_wpcom_ai_marker_tool_path',
			function ( $current, $name ) use ( $tool, $path ) {
				return $tool === $name ? $path : $current;
			},
			20,
			2
		);
	}

	/**
	 * Returns the arguments of each call to the fake $tool, in order.
	 *
	 * @param string $tool exiftool or c2patool.
	 * @return string[][]
	 */
	private function calls( $tool ) {
		if ( ! file_exists( $this->logs[ $tool ] ) ) {
			return array();
		}
		$calls = array_filter( explode( "\036", file_get_contents( $this->logs[ $tool ] ) ) );

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
		foreach ( $this->calls( 'exiftool' ) as $args ) {
			if ( in_array( '-S', $args, true ) ) {
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
		foreach ( $this->calls( 'exiftool' ) as $args ) {
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
	 * @param mixed $type The action's type, or null for none.
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
	 * GD reads URLs with file_get_contents(), which tests can't mock, so load from disk, then set a URL.
	 *
	 * @return WP_Image_Editor
	 */
	private function editor_loaded_by_url() {
		$editor = wp_get_image_editor( $this->jpeg() );
		(
			/** @phan-closure-scope \WP_Image_Editor */
			function () {
				$this->file = 'https://example.files.wordpress.com/2026/10/ai.jpeg';
			}
		)->call( $editor );

		return $editor;
	}

	/**
	 * Copies the C2PA fixture and points the editor at the real c2patool, or skips without one.
	 *
	 * @return string
	 */
	private function c2pa_fixture() {
		exec( 'command -v c2patool 2>/dev/null', $output, $status );
		if ( 0 !== $status ) {
			$this->markTestSkipped( 'c2patool is not installed.' );
		}
		$this->use_tool( 'c2patool', trim( implode( '', $output ) ) );

		$path = $this->temp_path( 'jpg' );
		copy( self::C2PA_FIXTURE, $path );

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
	 * Returns a fresh path in the uploads directory.
	 *
	 * @param string $extension File extension.
	 * @return string
	 */
	private function temp_path( $extension ) {
		return wp_upload_dir()['path'] . '/ai-marker-' . wp_generate_password( 12, false ) . '.' . $extension;
	}
}
