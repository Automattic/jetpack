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
require_once __DIR__ . '/trait-fake-ai-marker-tools.php';
require_once __DIR__ . '/fixtures/log-upload.php';

/**
 * Uses fake exiftool and c2patool scripts, so the tests need neither tool.
 *
 * @requires function imagejpeg
 */
#[RequiresFunction( 'imagejpeg' )]
class Jetpack_WPCOM_Image_Editor_GD_Test extends \WorDBless\BaseTestCase {
	use Fake_AI_Marker_Tools;

	const AI_MARKER = 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia';

	const CAMERA = 'http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture';

	const COMPOSITE = 'http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia';

	const SYNTHETIC = 'http://cv.iptc.org/newscodes/digitalsourcetype/compositeSynthetic';

	/**
	 * An image whose active manifest has an AI ingredient, signed with c2patool's test certificate.
	 */
	const C2PA_FIXTURE = __DIR__ . '/fixtures/c2pa-ai-composite.jpg';

	/**
	 * Values the editor sent to jetpack_bump_stats_extras.
	 *
	 * @var string[]
	 */
	private $stats = array();

	/**
	 * Errors the editor sent to Logstash, as array( message, extra ).
	 *
	 * @var array[]
	 */
	private $logged = array();

	/**
	 * Path download_url() wrote to, when a test mocks the download.
	 *
	 * @var string
	 */
	private $downloaded;

	/**
	 * URL download_url() fetched, when a test mocks the download.
	 *
	 * @var string
	 */
	private $requested_url;

	/**
	 * Keeps real tools and Imagick out of the tests.
	 */
	public function set_up() {
		parent::set_up();
		$GLOBALS['jetpack_wpcom_ai_marker_log_uploads'] = array();

		add_filter( 'jetpack_wpcom_ai_marker_tool_path', '__return_empty_string' );
		add_filter( 'wp_client_side_media_processing_enabled', '__return_true' );
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
		add_filter(
			'jetpack_wpcom_ai_marker_log_enabled',
			function ( $enabled, $message, $extra ) {
				$this->logged[] = array( $message, $extra );
				return false;
			},
			10,
			3
		);

		// Each test is its own request.
		foreach ( array( 'logged', 'broken_tools' ) as $name ) {
			$property = new \ReflectionProperty( \Jetpack_WPCOM_AI_Marker::class, $name );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$property->setValue( null, array() );
		}

		// Other suites call Feature_Flags::reset(), which drops the flag this file registered on load.
		jetpack_wpcom_ai_marker_register_flag();
	}

	public function tear_down() {
		$this->remove_temp_dir();
		parent::tear_down();
	}

	/**
	 * Whether the host has exiftool, and the editors that should result.
	 *
	 * @return array
	 */
	public static function data_exiftool() {
		return array(
			'with exiftool'    => array( true, array( 'WP_Image_Editor_Imagick', 'Jetpack_WPCOM_Image_Editor_GD' ) ),
			'without exiftool' => array( false, array( 'WP_Image_Editor_Imagick', 'WP_Image_Editor_GD' ) ),
		);
	}

	/**
	 * Some hosts subclass each editor by name with eval(), so the name must be a plain identifier.
	 *
	 * @dataProvider data_exiftool
	 *
	 * @param bool     $has_exiftool Whether the host has exiftool.
	 * @param string[] $expected     The editors after the swap.
	 */
	#[DataProvider( 'data_exiftool' )]
	public function test_replaces_gd_only_when_exiftool_exists( $has_exiftool, $expected ) {
		if ( $has_exiftool ) {
			$this->fake_exiftool( '' );
		}

		$this->assertSame( $expected, jetpack_wpcom_ai_marker_image_editors( array( 'WP_Image_Editor_Imagick', 'WP_Image_Editor_GD' ) ) );
		$this->assertSame( end( $expected ), get_class( wp_get_image_editor( $this->jpeg() ) ) );
	}

	public function test_keeps_gd_when_the_flag_is_off() {
		$this->fake_exiftool( '' );
		add_filter( 'jetpack_feature_flag_enabled_' . JETPACK_WPCOM_AI_MARKER_FLAG, '__return_false' );

		$this->assertSame( 'WP_Image_Editor_GD', get_class( wp_get_image_editor( $this->jpeg() ) ) );
	}

	/**
	 * AI source types.
	 *
	 * @return array
	 */
	public static function data_types() {
		return array(
			'ai'           => array( self::AI_MARKER ),
			'ai composite' => array( self::COMPOSITE ),
			'synthetic'    => array( self::SYNTHETIC ),
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
				array( '-config', '', '-m', '-S', '-XMP-iptcExt:DigitalSourceType', '-JUMBF:JUMDLabel', $source ),
				array( '-config', '', '-m', '-q', '-overwrite_original', '-XMP-x:XMPToolkit=', self::$write_arg . $type, $target ),
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
	 * The tool that hangs, and the script that makes it hang.
	 *
	 * @return array
	 */
	public static function data_hangs() {
		return array(
			'exiftool'                               => array( 'exiftool', "exec sleep 5\n" ),
			'exiftool closes its output, then hangs' => array( 'exiftool', "exec >&-\nexec sleep 5\n" ),
		);
	}

	/**
	 * @dataProvider data_hangs
	 *
	 * @param string $tool The tool that hangs.
	 * @param string $body The fake tool's script.
	 */
	#[DataProvider( 'data_hangs' )]
	public function test_stops_a_tool_at_the_time_limit( $tool, $body ) {
		$this->fake_exiftool( '', 0, true );
		$this->fake_tool( $tool, $body );
		$this->limit_tools_to_one_second();
		$start = microtime( true );

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertLessThan( 3, microtime( true ) - $start );
		$this->assertIsArray( $saved );
		$this->assertSame( array( 'timed-out' ), $this->stats );
		$this->assertSame(
			array(
				array(
					'timed-out',
					$this->log_extra(
						array(
							'tool' => $tool,
							'step' => 'read',
						)
					),
				),
			),
			$this->logged
		);
	}

	public function test_skips_a_tool_for_the_rest_of_the_request_once_it_times_out() {
		$this->fake_tool( 'exiftool', "exec sleep 5\n" );
		$this->limit_tools_to_one_second();
		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );
		$start = microtime( true );

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertLessThan( 0.5, microtime( true ) - $start );
		$this->assertIsArray( $saved );
		$this->assertSame( array( 'timed-out' ), $this->stats );
	}

	/**
	 * Only SIGINT makes exiftool delete its temp file.
	 */
	public function test_interrupts_a_tool_at_the_time_limit() {
		$interrupted = $this->temp_path( 'log' );
		$this->fake_tool( 'exiftool', 'trap "touch ' . escapeshellarg( $interrupted ) . "; exit 1\" INT\nsleep 5 &\nwait\n" );
		$this->limit_tools_to_one_second();

		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertFileExists( $interrupted );
	}

	/**
	 * Scripts that print more than the tool output limit.
	 *
	 * @return array
	 */
	public static function data_too_much_output() {
		return array(
			'never stops'               => array( "exec yes\n" ),
			'exits just over the limit' => array( "exec head -c 262244 /dev/zero\n" ),
		);
	}

	/**
	 * @dataProvider data_too_much_output
	 *
	 * @param string $body The fake exiftool's script.
	 */
	#[DataProvider( 'data_too_much_output' )]
	public function test_stops_a_tool_that_prints_too_much( $body ) {
		$this->fake_tool( 'exiftool', $body );

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertIsArray( $saved );
		$this->assertSame( array( 'output-too-large' ), $this->stats );
		$this->assertSame(
			array(
				array(
					'output-too-large',
					$this->log_extra(
						array(
							'tool' => 'exiftool',
							'step' => 'read',
						)
					),
				),
			),
			$this->logged
		);
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
			'active manifest listed last'      => array(
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
			'AI ingredient after a camera one' => array(
				$store(
					'edit',
					array(
						'edit'   => self::manifest( null ),
						'camera' => self::manifest( self::CAMERA ),
						'ai'     => self::manifest( self::AI_MARKER ),
					)
				),
				0,
				self::AI_MARKER,
			),
			'AI composite ingredient'          => array(
				$store(
					'edit',
					array(
						'edit'   => self::manifest( null ),
						'camera' => self::manifest( self::CAMERA ),
						'ai'     => self::manifest( self::COMPOSITE ),
					)
				),
				0,
				self::COMPOSITE,
			),
			'AI action after a blank canvas'   => array(
				$store( 'a', array( 'a' => self::manifest( 'http://c2pa.org/digitalsourcetype/empty', self::AI_MARKER ) ) ),
				0,
				self::AI_MARKER,
			),
			'camera photo'                     => array( $store( 'a', array( 'a' => self::manifest( self::CAMERA ) ) ), 0, '' ),
			'no type'                          => array( $store( 'a', array( 'a' => self::manifest( null ) ) ), 0, '' ),
			'string type after a bad one'      => array(
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
			'c2patool fails'                   => array( $store( 'a', array( 'a' => self::manifest( self::AI_MARKER ) ) ), 1, '' ),
			'type with a null byte'            => array( $store( 'a', array( 'a' => self::manifest( "http://x\0y" ) ) ), 0, '' ),
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

	/**
	 * What exiftool reports when c2patool must not run, and the types the saved file should get.
	 *
	 * @return array
	 */
	public static function data_no_c2patool() {
		return array(
			'XMP wins over the manifest' => array( self::COMPOSITE, true, array( self::COMPOSITE ) ),
			'camera photo'               => array( self::CAMERA, false, array() ),
			'not an IPTC type'           => array( 'x;id/trainedAlgorithmicMedia', false, array() ),
			// Most uploads have no manifest.
			'no manifest'                => array( '', false, array() ),
		);
	}

	/**
	 * @dataProvider data_no_c2patool
	 *
	 * @param string   $type     The XMP type exiftool reports.
	 * @param bool     $has_c2pa Whether exiftool reports a C2PA box.
	 * @param string[] $expected The types the saved file should get.
	 */
	#[DataProvider( 'data_no_c2patool' )]
	public function test_skips_c2patool( $type, $has_c2pa, $expected ) {
		$this->fake_exiftool( $type, 0, $has_c2pa );
		$this->fake_c2patool( array( 'manifests' => array( 'a' => self::manifest( self::AI_MARKER ) ) ) );

		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( $expected, $this->written_types() );
		$this->assertSame( array(), $this->calls( 'c2patool' ) );
	}

	/**
	 * An AI edit of a camera photo can keep the camera's XMP and record the edit in C2PA.
	 */
	public function test_reads_the_c2pa_type_when_the_xmp_type_is_not_ai() {
		$this->fake_exiftool( self::CAMERA, 0, true );
		$this->fake_c2patool( array( 'manifests' => array( 'a' => self::manifest( self::AI_MARKER ) ) ) );

		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( array( self::AI_MARKER ), $this->written_types() );
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

	/**
	 * By default exiftool records its version in the XMP it writes. Skips without exiftool.
	 */
	public function test_the_saved_file_does_not_record_the_exiftool_version() {
		exec( 'command -v exiftool 2>/dev/null', $output, $status );
		if ( 0 !== $status ) {
			$this->markTestSkipped( 'exiftool is not installed.' );
		}
		$exiftool = trim( implode( '', $output ) );
		$this->use_tool( 'exiftool', $exiftool );
		$source = $this->jpeg();
		$saved  = $this->temp_path( 'jpeg' );
		exec( implode( ' ', array_map( 'escapeshellarg', array( $exiftool, '-m', '-q', '-overwrite_original', self::$write_arg . self::AI_MARKER, $source ) ) ) );

		wp_get_image_editor( $source )->save( $saved );

		exec( implode( ' ', array_map( 'escapeshellarg', array( $exiftool, '-m', '-S', '-XMPToolkit', '-DigitalSourceType', $saved ) ) ), $tags );
		$this->assertSame( array( 'DigitalSourceType: ' . self::AI_MARKER ), $tags );
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
		$this->assertSame( array( array( 'download-failed', $this->log_extra( array( 'error' => 'http_request_failed' ) ) ) ), $this->logged );
	}

	public function test_deletes_the_download_when_the_read_fails() {
		$this->use_tool( 'exiftool', "/no/such\0tool" );
		$this->mock_download( $this->jpeg() );

		$saved = $this->editor_loaded_by_url()->save( $this->temp_path( 'jpeg' ) );

		$this->assertIsArray( $saved );
		$this->assertFileDoesNotExist( $this->downloaded );
		$this->assertSame( array( 'remote-source', 'read-error' ), $this->stats );
		$this->assertSame( array( 'read-error' ), array_column( $this->logged, 0 ) );
		// The class only: messages can hold file paths.
		$this->assertSame( 'ValueError', $this->logged[0][1]['error'] );
	}

	public function test_saves_the_edit_when_exiftool_cannot_write() {
		$this->fake_exiftool( self::AI_MARKER, 1 );

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertIsArray( $saved );
		$this->assertNotFalse( getimagesize( $saved['path'] ) );
		$this->assertSame( array( 'tool-failed' ), $this->stats );
		$this->assertSame(
			array(
				array(
					'tool-failed',
					$this->log_extra(
						array(
							'tool'      => 'exiftool',
							'step'      => 'write',
							'exit_code' => 1,
						)
					),
				),
			),
			$this->logged
		);
	}

	public function test_logs_a_read_that_fails() {
		$this->fake_tool( 'exiftool', "exit 3\n" );

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertIsArray( $saved );
		$this->assertSame( array( 'tool-failed' ), $this->stats );
		$this->assertSame(
			array(
				array(
					'tool-failed',
					$this->log_extra(
						array(
							'tool'      => 'exiftool',
							'step'      => 'read',
							'exit_code' => 3,
						)
					),
				),
			),
			$this->logged
		);
	}

	public function test_saves_the_edit_when_logging_throws() {
		$this->use_tool( 'exiftool', "/no/such\0tool" );
		add_filter(
			'jetpack_wpcom_ai_marker_log_enabled',
			/** @return never */ function () {
				throw new \RuntimeException( 'Logging failed.' );
			},
			20
		);

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertIsArray( $saved );
	}

	public function test_logs_a_tool_that_cannot_start() {
		$this->use_tool( 'exiftool', '/no/such/exiftool' );
		// proc_open() warns before it returns false.
		set_error_handler( '__return_true', E_WARNING ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler

		try {
			$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );
		} finally {
			restore_error_handler();
		}

		$this->assertIsArray( $saved );
		$this->assertSame( array( 'could-not-start' ), $this->stats );
		$this->assertSame(
			array(
				array(
					'could-not-start',
					$this->log_extra(
						array(
							'tool' => 'exiftool',
							'step' => 'read',
						)
					),
				),
			),
			$this->logged
		);
	}

	public function test_treats_exit_code_127_as_a_tool_that_cannot_start() {
		$this->fake_tool( 'exiftool', "exit 127\n" );

		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- The second save must skip the tool.
		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( array( 'could-not-start' ), $this->stats );
	}

	public function test_sends_each_error_to_logstash_once_per_request() {
		$this->fake_exiftool( self::AI_MARKER, 1 );

		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- The second save is the one under test.
		wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertSame( array( 'tool-failed', 'tool-failed' ), $this->stats );
		$this->assertSame( array( 'tool-failed' ), array_column( $this->logged, 0 ) );
	}

	public function test_saves_the_edit_when_a_stats_hook_throws() {
		$this->fake_exiftool( self::AI_MARKER );
		add_action(
			'jetpack_bump_stats_extras',
			/** @return never */ function () {
				throw new \RuntimeException( 'Stats failed.' );
			},
			20
		);

		$saved = wp_get_image_editor( $this->jpeg() )->save( $this->temp_path( 'jpeg' ) );

		$this->assertIsArray( $saved );
		$this->assertSame( array( 'written' ), $this->stats );
	}

	public function test_an_image_edited_in_the_browser_gets_the_type_from_the_source_c2pa() {
		$source = $this->jpeg();
		$edited = $this->jpeg();
		$this->fake_exiftool_with_c2pa_except( $edited );
		$this->fake_c2patool( array( 'manifests' => array( 'a' => self::manifest( self::AI_MARKER ) ) ) );

		$metadata = $this->filter_edited_image_metadata( $source, $edited );

		$this->assertSame( array( $edited, $source ), $this->read_paths() );
		$this->assertSame( array( '-config', '', '-m', '-q', '-overwrite_original', '-XMP-x:XMPToolkit=', self::$write_arg . self::AI_MARKER, $edited ), $this->calls( 'exiftool' )[2] );
		$this->assertSame( wp_filesize( $edited ), $metadata['filesize'] );
		$this->assertSame( array( 'from-c2pa', 'written' ), $this->stats );
		$this->assertSame(
			array(
				array(
					array(
						'file' => $edited,
						'type' => 'image/jpeg',
					),
					false,
				),
			),
			$GLOBALS['jetpack_wpcom_ai_marker_log_uploads']
		);
	}

	public function test_an_edited_image_that_has_an_ai_type_is_left_alone() {
		$this->fake_exiftool( self::AI_MARKER );
		$edited = $this->jpeg();

		$metadata = $this->filter_edited_image_metadata( $this->jpeg(), $edited );

		$this->assertSame( array( $edited ), $this->read_paths() );
		$this->assertSame( array(), $this->written_types() );
		$this->assertSame( 1, $metadata['filesize'] );
		$this->assertSame( array(), $GLOBALS['jetpack_wpcom_ai_marker_log_uploads'] );
	}

	/**
	 * The browser keeps a camera photo's XMP but drops the C2PA that records an AI edit.
	 */
	public function test_an_edited_image_with_a_camera_type_gets_the_source_c2pa_type() {
		$edited = $this->jpeg();
		$this->fake_exiftool_with_c2pa_except( $edited, self::CAMERA );
		$this->fake_c2patool( array( 'manifests' => array( 'a' => self::manifest( self::AI_MARKER ) ) ) );

		$this->filter_edited_image_metadata( $this->jpeg(), $edited );

		$this->assertSame( array( self::AI_MARKER ), $this->written_types() );
	}

	public function test_an_edited_image_whose_source_has_no_type_is_left_alone() {
		$this->fake_exiftool( '' );

		$metadata = $this->filter_edited_image_metadata( $this->jpeg(), $this->jpeg() );

		$this->assertSame( array(), $this->written_types() );
		$this->assertSame( 1, $metadata['filesize'] );
	}

	public function test_an_edited_image_keeps_its_filesize_when_exiftool_cannot_write() {
		$edited = $this->jpeg();
		$this->fake_exiftool_with_c2pa_except( $edited, '', 1 );
		$this->fake_c2patool( array( 'manifests' => array( 'a' => self::manifest( self::AI_MARKER ) ) ) );

		$metadata = $this->filter_edited_image_metadata( $this->jpeg(), $edited );

		$this->assertSame( 1, $metadata['filesize'] );
		$this->assertSame( array( 'from-c2pa', 'tool-failed' ), $this->stats );
		$this->assertSame( array(), $GLOBALS['jetpack_wpcom_ai_marker_log_uploads'] );
	}

	/**
	 * WordPress.com adds a private site's key to the URL through load_image_to_edit_attachmenturl.
	 */
	public function test_an_edited_image_reads_a_source_that_is_not_on_this_host_by_url() {
		$edited = $this->jpeg();
		$this->fake_exiftool_with_c2pa_except( $edited );
		$this->fake_c2patool( array( 'manifests' => array( 'a' => self::manifest( self::AI_MARKER ) ) ) );
		$this->mock_download( $this->jpeg() );
		add_filter(
			'load_image_to_edit_attachmenturl',
			function ( $url ) {
				return add_query_arg( 'key', 'private', $url );
			}
		);

		$this->filter_edited_image_metadata( $this->temp_path( 'jpeg' ), $edited );

		$this->assertStringEndsWith( '?key=private', $this->requested_url );
		$this->assertSame( array( 'remote-source', 'from-c2pa', 'written' ), $this->stats );
		$this->assertSame( array( self::AI_MARKER ), $this->written_types() );
	}

	/**
	 * A batch runs its requests in one process, so a server edit after a browser edit mustn't run the hook.
	 */
	public function test_watches_a_browser_edit_until_its_request_is_done() {
		$this->require_client_side_processing();
		$this->dispatch_media_request( 'create_item', array( 'parent_image' => 1 ) );
		$this->assertSame( 10, has_filter( 'wp_edited_image_metadata', 'jetpack_wpcom_ai_marker_edited_image_metadata' ) );

		apply_filters( 'rest_request_after_callbacks', null, array(), new \WP_REST_Request() );

		$this->assertFalse( has_filter( 'wp_edited_image_metadata', 'jetpack_wpcom_ai_marker_edited_image_metadata' ) );
	}

	/**
	 * Requests that can't carry an image edited in the browser.
	 *
	 * @return array
	 */
	public static function data_not_browser_edits() {
		return array(
			'no parent_image'               => array( 'create_item', array(), true ),
			'core edit endpoint'            => array( 'edit_item', array( 'parent_image' => 1 ), true ),
			'client-side processing is off' => array( 'create_item', array( 'parent_image' => 1 ), false ),
		);
	}

	/**
	 * Server edits keep the marker through the GD editor.
	 *
	 * @dataProvider data_not_browser_edits
	 *
	 * @param string $method     The attachments controller method that handles the request.
	 * @param array  $params     The request's parameters.
	 * @param bool   $client_side Whether client-side media processing is on.
	 */
	#[DataProvider( 'data_not_browser_edits' )]
	public function test_ignores_requests_that_are_not_browser_edits( $method, $params, $client_side ) {
		$this->require_client_side_processing();
		add_filter( 'wp_client_side_media_processing_enabled', $client_side ? '__return_true' : '__return_false', 11 );

		$this->dispatch_media_request( $method, $params );

		$this->assertFalse( has_filter( 'wp_edited_image_metadata', 'jetpack_wpcom_ai_marker_edited_image_metadata' ) );
	}

	public function test_skips_an_edited_image_that_is_not_on_this_host() {
		$this->fake_exiftool( self::AI_MARKER );

		$metadata = $this->filter_edited_image_metadata( $this->jpeg(), $this->temp_path( 'jpeg' ) );

		$this->assertSame( array(), $this->calls( 'exiftool' ) );
		$this->assertSame( array( 'filesize' => 1 ), $metadata );
	}

	/**
	 * Fakes exiftool that reports $type, and a C2PA box on every file but $edited, since browser edits drop C2PA.
	 *
	 * @param string $edited       Path of the edited image.
	 * @param string $type         The XMP type a read reports, or '' for none.
	 * @param int    $write_status Exit status of a write.
	 */
	private function fake_exiftool_with_c2pa_except( $edited, $type = '', $write_status = 0 ) {
		$read = '' === $type ? '' : "printf 'DigitalSourceType: %s\\n' " . escapeshellarg( $type ) . '; ';
		$this->fake_tool( 'exiftool', 'case " $* " in *" -S "*) ' . $read . 'case "$*" in *' . escapeshellarg( $edited ) . ") ;; *) echo 'JUMDLabel: c2pa';; esac; exit 0;; esac\nexit $write_status\n" );
	}

	/**
	 * Runs the edited-image hook on a new attachment at $edited made from one at $source.
	 *
	 * @param string $source Path of the source image.
	 * @param string $edited Path of the edited image.
	 * @return array The filtered metadata.
	 */
	private function filter_edited_image_metadata( $source, $edited ) {
		return jetpack_wpcom_ai_marker_edited_image_metadata(
			array( 'filesize' => 1 ),
			$this->attachment( $edited ),
			$this->attachment( $source )
		);
	}

	/**
	 * Skips a test on WordPress versions that have no client-side media processing.
	 */
	private function require_client_side_processing() {
		if ( ! function_exists( 'wp_is_client_side_media_processing_enabled' ) && ! function_exists( 'gutenberg_is_client_side_media_processing_enabled' ) ) {
			$this->markTestSkipped( 'Needs WordPress 7.1 or later, or the Gutenberg plugin.' );
		}
	}

	/**
	 * Applies rest_request_before_callbacks as the REST server does before a media request's handler.
	 *
	 * @param string $method The attachments controller method that handles the request.
	 * @param array  $params The request's parameters.
	 */
	private function dispatch_media_request( $method, array $params ) {
		$request = new \WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_query_params( $params );
		$handler = array( 'callback' => array( new \WP_REST_Attachments_Controller( 'attachment' ), $method ) );

		apply_filters( 'rest_request_before_callbacks', null, $handler, $request );
	}

	/**
	 * Creates a JPEG attachment for the file at $path.
	 *
	 * @param string $path Path of the image.
	 * @return int The attachment ID.
	 */
	private function attachment( $path ) {
		return wp_insert_attachment(
			array(
				'post_mime_type' => 'image/jpeg',
				'post_status'    => 'inherit',
				'post_title'     => wp_basename( $path ),
			),
			$path
		);
	}

	/**
	 * A manifest with one c2pa.created action for each type.
	 *
	 * @param mixed ...$types Each action's type, or null for none.
	 * @return array
	 */
	private static function manifest( ...$types ) {
		$actions = array();
		foreach ( $types as $type ) {
			$action = array( 'action' => 'c2pa.created' );
			if ( null !== $type ) {
				$action['digitalSourceType'] = $type;
			}
			$actions[] = $action;
		}

		return array(
			'assertions' => array(
				array(
					'label' => 'c2pa.actions.v2',
					'data'  => array( 'actions' => $actions ),
				),
			),
		);
	}

	/**
	 * Returns the extra fields a Logstash entry should have.
	 *
	 * @param array $extra The fields after the stats group.
	 * @return array
	 */
	private function log_extra( array $extra ) {
		return array( 'group' => 'image_editor_ai_marker' ) + $extra;
	}

	/**
	 * Sets the tool time limit to 1 second.
	 */
	private function limit_tools_to_one_second() {
		add_filter(
			'jetpack_wpcom_ai_marker_tool_time_limit',
			function () {
				return 1;
			}
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
			function ( $response, $args, $url ) use ( $source ) {
				if ( null === $source ) {
					return new WP_Error( 'http_request_failed', 'Offline.' );
				}
				$this->requested_url = $url;
				$this->downloaded    = $args['filename'];
				copy( $source, $args['filename'] );

				return array( 'response' => array( 'code' => 200 ) );
			},
			10,
			3
		);
	}

	/**
	 * Loads from disk, then sets a URL, since tests can't mock GD's file_get_contents().
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
}
