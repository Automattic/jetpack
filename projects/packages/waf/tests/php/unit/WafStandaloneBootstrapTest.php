<?php
/**
 * Standalone bootstrap test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Standalone_Bootstrap;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound

// Unfortunately PHPUnit deprecated addMethods with no replacement. Create an interface for it to "mock".
// phpcs:ignore PEAR.NamingConventions.ValidClassName.Invalid
interface WafStandaloneBootstrapTest_filesystem_mock {
	public function is_dir( $path );
	public function mkdir( $path );
	public function put_contents( $path, $contents );
}

// phpcs:ignore PEAR.NamingConventions.ValidClassName.Invalid
class WafStandaloneBootstrapTest_real_filesystem implements WafStandaloneBootstrapTest_filesystem_mock {
	public function is_dir( $path ) {
		return is_dir( $path );
	}
	public function mkdir( $path ) {
		return mkdir( $path );
	}
	public function put_contents( $path, $contents ) {
		return false !== file_put_contents( $path, $contents );
	}
}

/**
 * Runtime test suite.
 */
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */]
final class WafStandaloneBootstrapTest extends PHPUnit\Framework\TestCase {

	/**
	 * Temporary WP_CONTENT_DIR created by `generate_real_bootstrap()`, removed on teardown.
	 *
	 * @var string|null
	 */
	private $content_dir;

	/**
	 * Remove the temporary WP_CONTENT_DIR, if any.
	 */
	protected function tearDown(): void {
		if ( $this->content_dir ) {
			foreach ( glob( $this->content_dir . '/jetpack-waf/*' ) as $file ) {
				unlink( $file );
			}
			foreach ( array( $this->content_dir . '/jetpack-waf', $this->content_dir ) as $dir ) {
				if ( is_dir( $dir ) ) {
					rmdir( $dir );
				}
			}
		}
		parent::tearDown();
	}

	/**
	 * Generates a real bootstrap file under a fresh temporary WP_CONTENT_DIR.
	 *
	 * @return string Path to the generated bootstrap file.
	 */
	private function generate_real_bootstrap() {
		$content_dir       = sys_get_temp_dir() . '/jetpack-waf-bootstrap-test-' . uniqid();
		$this->content_dir = $content_dir;
		mkdir( $content_dir );

		define( 'ABSPATH', $content_dir . '/' );
		define( 'WP_CONTENT_DIR', $content_dir );
		add_test_option( 'jetpack_waf_mode', 'normal' );

		global $wp_filesystem;
		$wp_filesystem = new WafStandaloneBootstrapTest_real_filesystem();

		$sut = $this->getMockBuilder( Waf_Standalone_Bootstrap::class )
			->onlyMethods( array( 'initialize_filesystem' ) )
			->getMock();

		return $sut->generate();
	}

	/**
	 * Runs a bootstrap file in a fresh PHP process, as `auto_prepend_file` would, and returns what it reports.
	 *
	 * @param string $bootstrap_file Path to the bootstrap file.
	 * @return array The decoded report from `fixtures/run-bootstrap.php`, plus `exit_code` and `stderr`.
	 * @throws RuntimeException If the process cannot be started.
	 */
	private function run_bootstrap_in_child_process( $bootstrap_file ) {
		$process = proc_open(
			array( PHP_BINARY, '-d', 'display_errors=stderr', '-d', 'error_reporting=E_ALL', __DIR__ . '/fixtures/run-bootstrap.php', $bootstrap_file ),
			array(
				array( 'pipe', 'r' ),
				array( 'pipe', 'w' ),
				array( 'pipe', 'w' ),
			),
			$pipes
		);
		if ( ! is_resource( $process ) ) {
			throw new RuntimeException( 'proc_open failed' );
		}
		fclose( $pipes[0] );
		$stdout = stream_get_contents( $pipes[1] );
		$stderr = stream_get_contents( $pipes[2] );
		fclose( $pipes[1] );
		fclose( $pipes[2] );
		$exit_code = proc_close( $process );

		$report = json_decode( $stdout, true );
		$this->assertIsArray( $report, "Child process produced no report. stdout: $stdout stderr: $stderr" );

		return $report + array(
			'exit_code' => $exit_code,
			'stderr'    => $stderr,
		);
	}

	/**
	 * Test that the generated bootstrap runs the firewall before WordPress without loading package files or leaving an autoloader registered.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testGeneratedBootstrapRunsTheFirewallAndLeavesNothingBehind() {
		$report = $this->run_bootstrap_in_child_process( $this->generate_real_bootstrap() );

		$this->assertSame( 0, $report['exit_code'] );
		$this->assertSame( '', $report['stderr'] );
		$this->assertSame( 'preload', $report['run'] );
		$this->assertTrue( $report['runner_loaded'] );
		$this->assertSame( 0, $report['autoloaders'] );
		$this->assertSame( array(), $report['variables'] );
		$this->assertSame( array(), $report['package_files'] );
	}

	/**
	 * Test that the generated bootstrap skips the firewall run instead of fataling when its classmap is gone.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testGeneratedBootstrapSkipsTheRunWhenTheClassmapIsMissing() {
		$bootstrap_file = $this->generate_real_bootstrap();
		file_put_contents(
			$bootstrap_file,
			str_replace( 'autoload_classmap.php', 'autoload_classmap_gone.php', file_get_contents( $bootstrap_file ) )
		);

		$report = $this->run_bootstrap_in_child_process( $bootstrap_file );

		$this->assertSame( 0, $report['exit_code'] );
		$this->assertSame( '', $report['stderr'] );
		$this->assertNull( $report['run'] );
		$this->assertFalse( $report['runner_loaded'] );
		$this->assertSame( 0, $report['autoloaders'] );
	}

	/**
	 * Test guarding against running outside of WP context.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testConstructingTheBootstrapWithoutAbspathConstantThrowsException() {
		$this->assertFalse( defined( 'ABSPATH' ) );
		$this->expectExceptionMessage( 'Cannot generate the WAF bootstrap if we are not running in WordPress context.' );
		new Waf_Standalone_Bootstrap();
	}

	/**
	 * Test constructing the generator defined WAF constants if they are still missing.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testConstructingTheBootstrapDefinesRequiredWafConstants() {
		define( 'ABSPATH', '/pseudo' );
		define( 'WP_CONTENT_DIR', '/pseudo/dir' );

		$this->assertFalse( defined( 'JETPACK_WAF_DIR' ) );
		$this->assertFalse( defined( 'JETPACK_WAF_WPCONFIG' ) );

		new Waf_Standalone_Bootstrap();

		$this->assertSame( '/pseudo/dir/jetpack-waf', JETPACK_WAF_DIR );
		$this->assertSame( '/pseudo/dir/../wp-config.php', JETPACK_WAF_WPCONFIG );
	}

	/**
	 * Test throwing an exception if the filesystem is not initialized.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testGenerateThrowsAnExceptionIfFilesystemIsNotInitialized() {
		define( 'ABSPATH', '/pseudo' );
		define( 'WP_CONTENT_DIR', '/pseudo/dir' );

		$mock_builder = $this->getMockBuilder( Waf_Standalone_Bootstrap::class );
		$mock_builder->onlyMethods( array( 'initialize_filesystem' ) );

		$sut = $mock_builder->getMock();
		$this->expectExceptionMessage( 'Cannot work without the file system being initialized.' );
		$sut->generate();
	}

	/**
	 * Test generating the bootstrap file successfully.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testGenerateGeneratesTheBootstrapFileSuccessfully() {
		define( 'ABSPATH', '/awesome' );
		define( 'WP_CONTENT_DIR', '/awesome/dir' );

		$filesystem_mock_builder = $this->getMockBuilder( WafStandaloneBootstrapTest_filesystem_mock::class );

		$filesystem_mock = $filesystem_mock_builder->getMock();

		$filesystem_mock->expects( $this->once() )
			->method( 'is_dir' )
			->willReturn( true );

		$filesystem_mock->expects( $this->once() )
			->method( 'put_contents' )
			->with(
				'/awesome/dir/jetpack-waf/bootstrap.php',
				$this->callback(
					function ( $file_contents ) {
						return strpos( $file_contents, "define( 'JETPACK_WAF_MODE', 'mockModeOption' );" ) !== false
							&& strpos( $file_contents, "define( 'JETPACK_WAF_DIR', '/awesome/dir/jetpack-waf' );" ) !== false
							// Checking the classmap path fuzzy because it will vary depending on the system that the test is executed on.
							&& preg_match( '/\$jetpack_waf_classmap_file = \'.*\/vendor\/composer\/autoload_classmap\.php\';/', $file_contents ) === 1
							&& strpos( $file_contents, 'require_once' ) === false
							&& strpos( $file_contents, 'spl_autoload_register( $jetpack_waf_autoloader );' ) !== false
							&& preg_match( '/Automattic\\\Jetpack\\\Waf\\\Waf_Runner::initialize/', $file_contents ) === 1
							&& strpos( $file_contents, 'spl_autoload_unregister( $jetpack_waf_autoloader );' ) !== false;
					}
				)
			)
			->willReturn( true );

		add_test_option( 'jetpack_waf_mode', 'mockModeOption' );

		global $wp_filesystem;
		$wp_filesystem = $filesystem_mock;

		$mock_builder = $this->getMockBuilder( Waf_Standalone_Bootstrap::class );
		$mock_builder->onlyMethods( array( 'initialize_filesystem' ) );

		$sut = $mock_builder->getMock();

		$sut->expects( $this->once() )->method( 'initialize_filesystem' );

		$bootstrap_path = $sut->generate();

		$this->assertSame( '/awesome/dir/jetpack-waf/bootstrap.php', $bootstrap_path );
	}

	/**
	 * Test not being able to write the bootstrap file throws an exception.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testGenerateThrowsAnExceptionIfUnableToWriteBootstrapFile() {
		define( 'ABSPATH', '/foo' );
		define( 'WP_CONTENT_DIR', '/awesome/dir' );

		$filesystem_mock_builder = $this->getMockBuilder( WafStandaloneBootstrapTest_filesystem_mock::class );

		$filesystem_mock = $filesystem_mock_builder->getMock();
		$filesystem_mock->expects( $this->once() )
			->method( 'is_dir' )
			->willReturn( true );

		$filesystem_mock->expects( $this->once() )
			->method( 'put_contents' )
			->willReturn( false );

		add_test_option( 'jetpack_waf_mode', 'mockModeOption' );

		global $wp_filesystem;
		$wp_filesystem = $filesystem_mock;

		$mock_builder = $this->getMockBuilder( Waf_Standalone_Bootstrap::class );
		$mock_builder->onlyMethods( array( 'initialize_filesystem' ) );

		$sut = $mock_builder->getMock();

		$this->expectExceptionMessage( 'Failed writing WAF standalone bootstrap file to: /awesome/dir/jetpack-waf/bootstrap.php' );
		$sut->generate();
	}

	/**
	 * Test creating the jetpack WAF directory successfully if it does not exist.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testGenerateCreatesTheJetpackWafDirectoryIfItDoesNotExistYet() {
		define( 'ABSPATH', '/awesome' );
		define( 'WP_CONTENT_DIR', '/awesome/dir' );

		$filesystem_mock_builder = $this->getMockBuilder( WafStandaloneBootstrapTest_filesystem_mock::class );

		$filesystem_mock = $filesystem_mock_builder->getMock();

		$filesystem_mock->expects( $this->once() )
			->method( 'is_dir' )
			->willReturn( false );

		$filesystem_mock->expects( $this->once() )
			->method( 'mkdir' )
			->with( '/awesome/dir/jetpack-waf' )
			->willReturn( true );

		$filesystem_mock->expects( $this->once() )
			->method( 'put_contents' )
			->willReturn( true );

		global $wp_filesystem;
		$wp_filesystem = $filesystem_mock;

		$mock_builder = $this->getMockBuilder( Waf_Standalone_Bootstrap::class );
		$mock_builder->onlyMethods( array( 'initialize_filesystem' ) );

		$sut = $mock_builder->getMock();
		$sut->expects( $this->once() )->method( 'initialize_filesystem' );

		$sut->generate();
	}

	/**
	 * Test not being able to create the jetpack WAF directory.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function testGenerateThrowsAnExceptionIfUnableToCreateJetpackWafDirectory() {
		define( 'ABSPATH', '/awesome' );
		define( 'WP_CONTENT_DIR', '/awesome/dir' );

		$filesystem_mock_builder = $this->getMockBuilder( WafStandaloneBootstrapTest_filesystem_mock::class );

		$filesystem_mock = $filesystem_mock_builder->getMock();

		$filesystem_mock->expects( $this->once() )
			->method( 'is_dir' )
			->willReturn( false );

		$filesystem_mock->expects( $this->once() )
			->method( 'mkdir' )
			->with( '/awesome/dir/jetpack-waf' )
			->willReturn( false );

		global $wp_filesystem;
		$wp_filesystem = $filesystem_mock;

		$mock_builder = $this->getMockBuilder( Waf_Standalone_Bootstrap::class );
		$mock_builder->onlyMethods( array( 'initialize_filesystem' ) );

		$sut = $mock_builder->getMock();
		$sut->expects( $this->once() )->method( 'initialize_filesystem' );

		$this->expectExceptionMessage( 'Failed creating WAF standalone bootstrap file directory: /awesome/dir/jetpack-waf' );
		$sut->generate();
	}
}
