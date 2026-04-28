<?php
/**
 * Tests for the pure helpers in the Plugin Conflicts Guardian feature.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/class-pcg-load-tester.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/activation-guard.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/update-guard.php';

/**
 * Exercises the pure / near-pure helpers: transient keying, error-reason
 * formatting, errno-name mapping, the update guard's parse-error sweep, and
 * the upgrader_source_selection filter callback.
 */
class Plugin_Conflicts_Guardian_Test extends \WorDBless\BaseTestCase {

	/**
	 * Absolute path to a temporary directory used by scan tests.
	 *
	 * @var string|null
	 */
	private $tmp_dir = null;

	/**
	 * Clean up any temp directory and guard filter after each test.
	 */
	public function tear_down() {
		if ( $this->tmp_dir && is_dir( $this->tmp_dir ) ) {
			$this->rrmdir( $this->tmp_dir );
			$this->tmp_dir = null;
		}
		// activation-guard.php registers these unconditionally on require_once
		// at the top of the file; tear them down so leakage between tests
		// doesn't fire wp_safe_redirect / unwanted notices.
		remove_action( 'load-plugins.php', 'pcg_guard_maybe_block_activation', 0 );
		remove_action( 'load-update.php', 'pcg_guard_maybe_block_activation', 0 );
		remove_action( 'admin_notices', 'pcg_guard_render_block_notice' );
		remove_all_filters( 'pcg_guard_activation' );
		parent::tear_down();
	}

	/**
	 * The transient key is deterministic and namespaced with the pcg_probe_ prefix.
	 */
	public function test_transient_key_is_deterministic_and_namespaced() {
		$token = 'abc123';
		$key   = PCG_Load_Tester::transient_key( $token );

		$this->assertSame( 'pcg_probe_' . md5( $token ), $key );
		$this->assertSame( $key, PCG_Load_Tester::transient_key( $token ) );
	}

	/**
	 * Different tokens produce different keys.
	 */
	public function test_transient_key_differs_per_token() {
		$this->assertNotSame(
			PCG_Load_Tester::transient_key( 'aaa' ),
			PCG_Load_Tester::transient_key( 'bbb' )
		);
	}

	/**
	 * Scenarios for pcg_guard_errno_name.
	 *
	 * @return array<string,array{0:int,1:string}>
	 */
	public static function provide_errno_names(): array {
		return array(
			'E_ERROR'             => array( E_ERROR, 'E_ERROR' ),
			'E_PARSE'             => array( E_PARSE, 'E_PARSE' ),
			'E_CORE_ERROR'        => array( E_CORE_ERROR, 'E_CORE_ERROR' ),
			'E_COMPILE_ERROR'     => array( E_COMPILE_ERROR, 'E_COMPILE_ERROR' ),
			'E_USER_ERROR'        => array( E_USER_ERROR, 'E_USER_ERROR' ),
			'E_RECOVERABLE_ERROR' => array( E_RECOVERABLE_ERROR, 'E_RECOVERABLE_ERROR' ),
			'unknown errno'       => array( 9999, 'error 9999' ),
		);
	}

	/**
	 * Pcg_guard_errno_name maps known error constants to their symbolic names.
	 *
	 * @param int    $errno    Error constant value.
	 * @param string $expected Expected symbolic label.
	 * @dataProvider provide_errno_names
	 */
	#[DataProvider( 'provide_errno_names' )]
	public function test_errno_name( int $errno, string $expected ) {
		$this->assertSame( $expected, pcg_guard_errno_name( $errno ) );
	}

	/**
	 * Scenarios for pcg_guard_format_block_reason.
	 *
	 * @return array<string,array{0:array<string,mixed>,1:string}>
	 */
	public static function provide_block_reason_scenarios(): array {
		return array(
			'fatal with errno + file + line' => array(
				array(
					'status'  => 'fatal',
					'errno'   => E_USER_ERROR,
					'message' => 'boom',
					'file'    => '/var/www/plugins/foo/foo.php',
					'line'    => 42,
				),
				'E_USER_ERROR: boom (foo.php, line 42)',
			),
			'throwable with class + file'    => array(
				array(
					'status'  => 'throwable',
					'class'   => 'RuntimeException',
					'message' => 'nope',
					'file'    => 'bar.php',
				),
				'RuntimeException: nope (bar.php)',
			),
			'no label falls back to message' => array(
				array(
					'message' => 'lonely message',
				),
				'lonely message',
			),
			'missing message says unknown'   => array(
				array(
					'status'  => 'fatal',
					'errno'   => E_ERROR,
					'message' => '',
				),
				'E_ERROR: unknown error',
			),
			'line zero is omitted'           => array(
				array(
					'status'  => 'fatal',
					'errno'   => E_ERROR,
					'message' => 'oops',
					'file'    => 'x.php',
					'line'    => 0,
				),
				'E_ERROR: oops (x.php)',
			),
		);
	}

	/**
	 * Pcg_guard_format_block_reason renders the probe result in a single human-readable line.
	 *
	 * @param array  $result   Probe result payload.
	 * @param string $expected Expected rendered reason.
	 * @dataProvider provide_block_reason_scenarios
	 */
	#[DataProvider( 'provide_block_reason_scenarios' )]
	public function test_format_block_reason( array $result, string $expected ) {
		$this->assertSame( $expected, pcg_guard_format_block_reason( $result ) );
	}

	/**
	 * A package with only valid PHP files scans clean.
	 */
	public function test_parse_error_scan_returns_empty_for_valid_files() {
		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/a.php', "<?php\nfunction pcg_valid_a() { return 1; }\n" );
		file_put_contents( $dir . '/b.php', "<?php\nclass Pcg_Valid_B {}\n" );
		file_put_contents( $dir . '/README.txt', "Not PHP.\n" );

		$result = pcg_update_guard_scan_for_parse_errors( $dir );
		$this->assertSame( array(), $result['errors'] );
		$this->assertFalse( $result['budget_exceeded'] );
	}

	/**
	 * A file with a PHP parse error is reported with its path, line, and message.
	 */
	public function test_parse_error_scan_reports_parse_errors() {
		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/good.php', "<?php\nreturn 1;\n" );
		file_put_contents( $dir . '/bad.php', "<?php\nfunction broken( {\n" );

		$result = pcg_update_guard_scan_for_parse_errors( $dir );

		$this->assertCount( 1, $result['errors'] );
		$this->assertStringEndsWith( '/bad.php', $result['errors'][0]['file'] );
		$this->assertIsInt( $result['errors'][0]['line'] );
		$this->assertNotEmpty( $result['errors'][0]['message'] );
		$this->assertFalse( $result['budget_exceeded'] );
	}

	/**
	 * A missing or empty directory returns an empty result rather than failing.
	 */
	public function test_parse_error_scan_handles_missing_dir() {
		$result = pcg_update_guard_scan_for_parse_errors( '' );
		$this->assertSame( array(), $result['errors'] );
		$this->assertFalse( $result['budget_exceeded'] );

		$result = pcg_update_guard_scan_for_parse_errors( '/no/such/path/pcg-does-not-exist' );
		$this->assertSame( array(), $result['errors'] );
		$this->assertFalse( $result['budget_exceeded'] );
	}

	/**
	 * The filter returns the source unchanged when the guard is disabled.
	 */
	public function test_update_guard_check_passthrough_when_disabled() {
		add_filter( 'pcg_guard_activation', '__return_false' );

		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/bad.php', "<?php function ( {\n" );

		$result = pcg_update_guard_check(
			$dir,
			$dir,
			null,
			array(
				'type'   => 'plugin',
				'action' => 'install',
			)
		);

		$this->assertSame( $dir, $result );
	}

	/**
	 * Non-plugin extensions (themes, core) are not inspected.
	 */
	public function test_update_guard_check_ignores_non_plugin_types() {
		add_filter( 'pcg_guard_activation', '__return_true' );

		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/bad.php', "<?php function ( {\n" );

		$result = pcg_update_guard_check(
			$dir,
			$dir,
			null,
			array(
				'type'   => 'theme',
				'action' => 'install',
			)
		);

		$this->assertSame( $dir, $result );
	}

	/**
	 * Actions other than install/update are not inspected.
	 */
	public function test_update_guard_check_ignores_unrelated_actions() {
		add_filter( 'pcg_guard_activation', '__return_true' );

		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/bad.php', "<?php function ( {\n" );

		$result = pcg_update_guard_check(
			$dir,
			$dir,
			null,
			array(
				'type'   => 'plugin',
				'action' => 'download',
			)
		);

		$this->assertSame( $dir, $result );
	}

	/**
	 * Clean plugin packages pass through untouched.
	 */
	public function test_update_guard_check_allows_clean_plugin_package() {
		add_filter( 'pcg_guard_activation', '__return_true' );

		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/plugin.php', "<?php\n// Plugin Name: PCG Ok\n" );

		$result = pcg_update_guard_check(
			$dir,
			$dir,
			null,
			array(
				'type'   => 'plugin',
				'action' => 'install',
			)
		);

		$this->assertSame( $dir, $result );
	}

	/**
	 * Packages with parse errors are rejected with a descriptive WP_Error.
	 */
	public function test_update_guard_check_blocks_plugin_with_parse_error() {
		add_filter( 'pcg_guard_activation', '__return_true' );

		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/plugin.php', "<?php function ( {\n" );

		$result = pcg_update_guard_check(
			$dir,
			$dir,
			null,
			array(
				'type'   => 'plugin',
				'action' => 'update',
			)
		);

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'pcg_update_parse_error', $result->get_error_code() );
		$this->assertStringContainsString( 'update', $result->get_error_message() );
		$this->assertStringContainsString( 'plugin.php', $result->get_error_message() );
	}

	/**
	 * A pre-existing WP_Error from an earlier filter is returned untouched.
	 */
	public function test_update_guard_check_preserves_incoming_error() {
		$incoming = new WP_Error( 'other_error', 'something else went wrong' );

		$result = pcg_update_guard_check(
			$incoming,
			'/ignored',
			null,
			array(
				'type'   => 'plugin',
				'action' => 'install',
			)
		);

		$this->assertSame( $incoming, $result );
	}

	/**
	 * Create a unique temp directory for a single test.
	 *
	 * @return string Absolute path.
	 */
	private function make_tmp_dir(): string {
		$this->tmp_dir = rtrim( sys_get_temp_dir(), '/' ) . '/pcg-test-' . wp_generate_password( 8, false );
		mkdir( $this->tmp_dir, 0777, true );
		return $this->tmp_dir;
	}

	/**
	 * Recursively delete a directory. Used only against paths we created in this test.
	 *
	 * @param string $dir Directory to remove.
	 */
	private function rrmdir( string $dir ): void {
		if ( ! is_dir( $dir ) ) {
			return;
		}
		$iter = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::CHILD_FIRST
		);
		foreach ( $iter as $path => $file ) {
			if ( $file->isDir() ) {
				rmdir( (string) $path );
			} else {
				unlink( (string) $path );
			}
		}
		rmdir( $dir );
	}
}
