<?php
/**
 * Integration tests for jetpack-stub-generator.
 *
 * @package automattic/jetpack-stub-generator
 */

namespace Automattic\Jetpack\StubGenerator\Tests;

use Automattic\Jetpack\StubGenerator\Application;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Tester\CommandTester;

/**
 * Integration tests for jetpack-stub-generator.
 *
 * @covers \Automattic\Jetpack\StubGenerator\Application
 * @covers \Automattic\Jetpack\StubGenerator\PhpParser\StripDocsNodeVisitor
 */
class IntegrationTest extends TestCase {

	/**
	 * Set up before class.
	 */
	public static function setUpBeforeClass(): void {
		stream_wrapper_register(
			'test-application',
			get_class(
				new class() {
					public $context; // 🤷

					public function url_stat() {
						$stat = array(
							'dev'     => 0,
							'ino'     => 0,
							'mode'    => 0100664,
							'nlink'   => 1,
							'uid'     => 0,
							'gid'     => 0,
							'rdev'    => 0,
							'size'    => 42,
							'atime'   => 0,
							'mtime'   => 0,
							'ctime'   => 0,
							'blksize' => -1,
							'blocks'  => -1,
						);
						// @phan-suppress-next-line PhanUselessBinaryAddRight -- Not useless.
						$stat += array_values( $stat );
						return $stat;
					}

					public function stream_open( $path, $mode, $options ) {
						if ( $options & STREAM_REPORT_ERRORS ) {
							trigger_error( 'Open fail from dummy stream wrapper', E_USER_ERROR );
						}
						return false;
					}
				}
			)
		);
	}

	/**
	 * Clean up after class.
	 */
	public static function tearDownAfterClass(): void {
		stream_wrapper_unregister( 'test-application' );
	}

	/**
	 * Test the command.
	 *
	 * @dataProvider provideExecute
	 * @param string[] $args Command line arguments.
	 * @param array    $options Options for the test and CommandTester.
	 * @param int      $expectExitCode Expected exit code.
	 * @param array[]  $expect Output expectations.
	 */
	public function testExecute( array $args, array $options, $expectExitCode, $expect ) {
		$options += array(
			'capture_stderr_separately' => true,
		);

		$app = new Application();
		$app->setAutoExit( false );
		$tester = new CommandTester( $app );
		$code   = $tester->execute( $args, $options );
		$srcs   = array(
			'stdout' => $tester->getDisplay( true ),
			'stderr' => $tester->getErrorOutput( true ),
		);
		foreach ( $expect as $x ) {
			list( $src, $type, $val ) = $x;
			$actual                   = $srcs[ $src ];
			if ( $type === 'replace' ) {
				$srcs[ $src ] = str_replace( $val, $x[3], $srcs[ $src ] );
			} elseif ( $type === 'contains' ) {
				$this->assertStringContainsString( $val, $actual );
			} elseif ( $type === 'regex' ) {
				$this->assertMatchesRegularExpression( $val, $actual );
			} else {
				$this->assertSame( $val, $actual );
			}
		}
		$this->assertSame( $expectExitCode, $code );
	}

	/**
	 * Data provider for testExecute.
	 */
	public function provideExecute() {
		$dir = __DIR__;

		return array(
			'Version'                         => array(
				array( '--version' => true ),
				array(),
				0,
				array(
					array( 'stdout', 'exact', 'Jetpack Stub Generator ' . Application::VERSION . "\n" ),
					array( 'stderr', 'exact', '' ),
				),
			),
			'Help'                            => array(
				array( '--help' => true ),
				array(),
				0,
				array(
					array( 'stdout', 'regex', '#^\s*Generate stubs for specific functions/classes/etc from a codebase\.\s*$#m' ),
					array( 'stdout', 'regex', '#^\s*stub-definition\s+Stub definition file\.\s*$#m' ),
					array( 'stdout', 'regex', '#^\s*--json\s+Definition file is a JSON file\.\s*$#m' ),
					array( 'stdout', 'regex', '#^\s*--output=OUTPUT\s+Write output to this file rather than standard output\.\s*$#m' ),
					array( 'stdout', 'regex', '#The file specifies which files to scan and which functions,\s*classes, and such to extract from each one\.#' ),
					array( 'stderr', 'exact', '' ),
				),
			),

			'Missing config file'             => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/missing.php' ),
				array(),
				1,
				array(
					array( 'stdout', 'exact', '' ),
					array( 'stderr', 'exact', "File $dir/fixtures/missing.php does not exist or is not readable\n" ),
				),
			),
			'JSON config file read error'     => array(
				array(
					'--json'          => true,
					'stub-definition' => 'test-application://foo',
				),
				array(),
				1,
				array(
					array( 'stdout', 'exact', '' ),
					array( 'stderr', 'replace', 'failed to open stream:', 'Failed to open stream:' ),
					array( 'stderr', 'exact', "Failed to read test-application://foo: file_get_contents(test-application://foo): Failed to open stream: \"class@anonymous::stream_open\" call failed\n" ),
				),
			),
			'JSON config file isn\'t JSON'    => array(
				array(
					'--json'          => true,
					'stub-definition' => __DIR__ . '/fixtures/bad-json.notjson',
				),
				array(),
				1,
				array(
					array( 'stdout', 'exact', '' ),
					array( 'stderr', 'exact', "Invalid JSON data in $dir/fixtures/bad-json.notjson: Syntax error\n" ),
				),
			),
			'JSON config file non-array'      => array(
				array(
					'--json'          => true,
					'stub-definition' => __DIR__ . '/fixtures/not-array.json',
				),
				array(),
				1,
				array(
					array( 'stdout', 'exact', '' ),
					array( 'stderr', 'exact', "$dir/fixtures/not-array.json did not contain a JSON object\n" ),
				),
			),
			'PHP config file throws'          => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/throws.php' ),
				array(),
				1,
				array(
					array( 'stdout', 'exact', '' ),
					array( 'stderr', 'exact', "Exception thrown when loading $dir/fixtures/throws.php: nope\n" ),
				),
			),
			'PHP config file throws, verbose' => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/throws.php' ),
				array( 'verbosity' => OutputInterface::VERBOSITY_DEBUG ),
				1,
				array(
					array( 'stdout', 'exact', '' ),
					array( 'stderr', 'contains', "Exception thrown when loading $dir/fixtures/throws.php: nope\n" ),
					array( 'stderr', 'contains', "RuntimeException: nope in $dir/fixtures/throws.php:3" ),
				),
			),
			'PHP config file non-array'       => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/not-array.php' ),
				array(),
				1,
				array(
					array( 'stdout', 'exact', '' ),
					array( 'stderr', 'exact', "$dir/fixtures/not-array.php did not return an array\n" ),
				),
			),

			'Basic test'                      => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/basic.php' ),
				array(),
				0,
				array(
					array( 'stdout', 'exact', file_get_contents( __DIR__ . '/fixtures/basic.php.out' ) ),
					array( 'stderr', 'exact', '' ),
				),
			),
			'Basedir, relative'               => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/basedir_relative.php' ),
				array(),
				0,
				array(
					array( 'stdout', 'exact', file_get_contents( __DIR__ . '/fixtures/basedir_relative.php.out' ) ),
					array( 'stderr', 'exact', '' ),
				),
			),
			'Basedir, absolute'               => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/basedir_absolute.php' ),
				array(),
				0,
				array(
					array( 'stdout', 'exact', file_get_contents( __DIR__ . '/fixtures/basedir_absolute.php.out' ) ),
					array( 'stderr', 'exact', '' ),
				),
			),
			'Header and footer options'       => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/header-footer.php' ),
				array(),
				0,
				array(
					array( 'stdout', 'exact', file_get_contents( __DIR__ . '/fixtures/header-footer.php.out' ) ),
					array( 'stderr', 'exact', '' ),
				),
			),
			'Strip docs'                      => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/strip-docs.php' ),
				array(),
				0,
				array(
					array( 'stdout', 'exact', file_get_contents( __DIR__ . '/fixtures/strip-docs.php.out' ) ),
					array( 'stderr', 'exact', '' ),
				),
			),
			'Multiple namespaces'             => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/namespaces.php' ),
				array(),
				0,
				array(
					array( 'stdout', 'exact', file_get_contents( __DIR__ . '/fixtures/namespaces.php.out' ) ),
					array( 'stderr', 'exact', '' ),
				),
			),
			'One namespace'                   => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/namespaces2.php' ),
				array(),
				0,
				array(
					array( 'stdout', 'exact', file_get_contents( __DIR__ . '/fixtures/namespaces2.php.out' ) ),
					array( 'stderr', 'exact', '' ),
				),
			),
			'No files to process'             => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/no-files.php' ),
				array(),
				0,
				array(
					array( 'stdout', 'exact', "<?php\n\n" ),
					array( 'stderr', 'exact', '' ),
				),
			),
			'No files to process, verbose'    => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/no-files.php' ),
				array( 'verbosity' => OutputInterface::VERBOSITY_VERBOSE ),
				0,
				array(
					array( 'stdout', 'exact', "<?php\n\n" ),
					array( 'stderr', 'exact', "No files in definition\n" ),
				),
			),
			'Bad files to process'            => array(
				array( 'stub-definition' => __DIR__ . '/fixtures/bad-files.php' ),
				array(),
				2,
				array(
					array( 'stdout', 'exact', "<?php\n\n" ),
					array( 'stderr', 'replace', 'failed to open stream:', 'Failed to open stream:' ),
					array(
						'stderr',
						'exact',
						<<<ERR
						File $dir/fixtures/files/does-not-exist.php does not exist or is not readable
						Failed to read test-application://foo: file_get_contents(test-application://foo): Failed to open stream: "class@anonymous::stream_open" call failed
						Failed to parse $dir/fixtures/files/bad-php.notphp: Syntax error, unexpected T_STRING on line 3
						ERR . "\n", // phpcs:ignore PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696
					),
				),
			),
		);
	}

	/**
	 * Test the --output option.
	 */
	public function testOutputFile() {
		$file = tempnam( sys_get_temp_dir(), 'tmp.' );
		$this->assertFileExists( $file );
		try {
			$this->testExecute(
				array(
					'stub-definition' => __DIR__ . '/fixtures/basic.php',
					'--output'        => $file,
				),
				array(),
				0,
				array(
					array( 'stdout', 'exact', '' ),
					array( 'stderr', 'exact', "Output written to $file\n" ),
				)
			);
			$this->assertFileEquals( __DIR__ . '/fixtures/basic.php.out', $file );
		} finally {
			unlink( $file );
		}
	}

	/**
	 * Test the --output option with an unwritable file.
	 */
	public function testOutputFile_fail() {
		if ( ! is_writable( '/dev/full' ) ) {
			$this->markTestSkipped( 'Test needs /dev/full to exist' );
		}
		$this->testExecute(
			array(
				'stub-definition' => __DIR__ . '/fixtures/basic.php',
				'--output'        => '/dev/full',
			),
			array(),
			1,
			array(
				array( 'stdout', 'exact', '' ),
				array(
					'stderr',
					'regex',
					'#^Failed to write /dev/full: file_put_contents\(\): (Only -1 of 347 bytes written, possibly out of free disk space|Write of \d+ bytes failed with errno=\d+)#',
				),
			)
		);
	}
}
