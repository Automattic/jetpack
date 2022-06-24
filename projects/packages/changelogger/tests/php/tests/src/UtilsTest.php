<?php
/**
 * Tests for the changelogger utils.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelog\ChangeEntry;
use Automattic\Jetpack\Changelogger\FormatterPlugin;
use Automattic\Jetpack\Changelogger\Utils;
use Symfony\Component\Console\Helper\DebugFormatterHelper;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\Console\Output\ConsoleOutput;
use Symfony\Component\Console\Output\NullOutput;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use function Wikimedia\quietCall;

/**
 * Tests for the changelogger utils.
 *
 * @covers \Automattic\Jetpack\Changelogger\Utils
 */
class UtilsTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertionRenames;
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Test error_clear_last.
	 */
	public function test_error_clear_last() {
		quietCall( 'trigger_error', 'Test', E_USER_NOTICE );
		$err = error_get_last();
		$this->assertSame( 'Test', $err['message'] );

		Utils::error_clear_last();
		$err = error_get_last();
		$this->assertTrue( empty( $err['message'] ) ); // phpcs:ignore MediaWiki.PHPUnit.SpecificAssertions.assertEmpty -- We need the potential error suppression, behavior varies by PHP version.
	}

	/**
	 * Test runCommand.
	 *
	 * @dataProvider provideRunCommand
	 * @param string $cmd Bash command string.
	 * @param array  $options Options for `runCommand()`.
	 * @param int    $expectExitCode Expected exit code.
	 * @param string $expectStdout Expected output from the command.
	 * @param string $expectStderr Expected output from the command.
	 * @param string $expectOutput Expected output to the console.
	 * @param int    $verbosity Output buffer verbosity.
	 */
	public function testRunCommand( $cmd, $options, $expectExitCode, $expectStdout, $expectStderr, $expectOutput, $verbosity = BufferedOutput::VERBOSITY_DEBUG ) {
		$sh = ( new ExecutableFinder() )->find( 'sh' );
		if ( ! $sh ) {
			$this->markTestSkipped( 'This test requires a Posix shell' );
		}

		$expectOutput = strtr( $expectOutput, array( '{SHELL}' => $sh ) );

		$output = new BufferedOutput();
		$output->setVerbosity( $verbosity );
		$helper = new DebugFormatterHelper();
		$ret    = Utils::runCommand( array( $sh, '-c', $cmd ), $output, $helper, $options );
		$this->assertInstanceOf( Process::class, $ret );
		$this->assertSame( $expectExitCode, $ret->getExitCode() );
		$this->assertSame( $expectStdout, $ret->getOutput() );
		$this->assertSame( $expectStderr, $ret->getErrorOutput() );
		$this->assertSame( $expectOutput, $output->fetch() );
	}

	/**
	 * Data provider for testRunCommand.
	 */
	public function provideRunCommand() {
		$tmp = sys_get_temp_dir();

		return array(
			'true'                      => array(
				'true',
				array(),
				0,
				'',
				'',
				"  RUN  '{SHELL}' '-c' 'true'\n\n",
			),
			'false'                     => array(
				'false',
				array(),
				1,
				'',
				'',
				"  RUN  '{SHELL}' '-c' 'false'\n\n",
			),
			'true, non-debug verbosity' => array(
				'true',
				array(),
				0,
				'',
				'',
				'',
				BufferedOutput::VERBOSITY_VERY_VERBOSE,
			),
			'With cwd'                  => array(
				'pwd',
				array(
					'cwd' => $tmp,
				),
				0,
				"$tmp\n",
				'',
				"  RUN  '{SHELL}' '-c' 'pwd'\n\n  OUT  $tmp\n  OUT  \n",
			),
			'With env'                  => array(
				'echo "$FOO" >&2',
				array(
					'env' => array( 'FOO' => 'FOOBAR' ),
				),
				0,
				'',
				"FOOBAR\n",
				"  RUN  '{SHELL}' '-c' 'echo \"\$FOO\" >&2'\n\n  ERR  FOOBAR\n  ERR  \n",
			),
			'With input'                => array(
				'while IFS= read X; do echo "{{$X}}"; done',
				array(
					'input' => "A\nB\nC\n",
				),
				0,
				"{{A}}\n{{B}}\n{{C}}\n",
				'',
				'',
				BufferedOutput::VERBOSITY_NORMAL,
			),
		);
	}

	/**
	 * Test runCommand with a timeout.
	 */
	public function testRunCommand_timeout() {
		$sleep = ( new ExecutableFinder() )->find( 'sleep' );
		if ( ! $sleep ) {
			$this->markTestSkipped( 'This test requires a "sleep" command' );
		}

		$output = new BufferedOutput();
		$output->setVerbosity( BufferedOutput::VERBOSITY_DEBUG );
		$helper = new DebugFormatterHelper();
		$this->expectException( ProcessTimedOutException::class );
		Utils::runCommand( array( $sleep, '1' ), $output, $helper, array( 'timeout' => 0.1 ) );
	}

	/**
	 * Test loadChangeFile.
	 *
	 * @dataProvider provideLoadChangeFile
	 * @param string                  $contents File contents.
	 * @param array|\RuntimeException $expect Expected output.
	 * @param array                   $expectDiagnostics Expected diagnostics.
	 */
	public function testLoadChangeFile( $contents, $expect, $expectDiagnostics = array() ) {
		$temp = tempnam( sys_get_temp_dir(), 'phpunit-testLoadChangeFile-' );
		try {
			file_put_contents( $temp, $contents );
			if ( ! $expect instanceof \RuntimeException ) {
				$diagnostics = null; // Make phpcs happy.
				$this->assertSame( $expect, Utils::loadChangeFile( $temp, $diagnostics ) );
				$this->assertSame( $expectDiagnostics, $diagnostics );
			} else {
				try {
					Utils::loadChangeFile( $temp );
					$this->fail( 'Expcected exception not thrown' );
				} catch ( \RuntimeException $ex ) {
					$this->assertInstanceOf( get_class( $expect ), $ex );
					$this->assertMatchesRegularExpression( $expect->getMessage(), $ex->getMessage() );
					$this->assertObjectHasAttribute( 'fileLine', $ex );
					$this->assertSame( $expect->fileLine, $ex->fileLine );
				}
			}
		} finally {
			unlink( $temp );
		}
	}

	/**
	 * Data provider for testLoadChangeFile.
	 */
	public function provideLoadChangeFile() {
		$ex = function ( $msg, $line ) {
			$ret           = new \RuntimeException( $msg );
			$ret->fileLine = $line;
			return $ret;
		};
		return array(
			'Normal file'                 => array(
				"Foo: bar baz\nQuux: XXX\n\nEntry\n",
				array(
					'Foo'  => 'bar baz',
					'Quux' => 'XXX',
					''     => 'Entry',
				),
				array(
					'warnings' => array(),
					'lines'    => array(
						'Foo'  => 1,
						'Quux' => 2,
						''     => 4,
					),
				),
			),
			'File with no entry'          => array(
				"Foo: bar baz\nQuux: XXX\n\n\n\n",
				array(
					'Foo'  => 'bar baz',
					'Quux' => 'XXX',
					''     => '',
				),
				array(
					'warnings' => array(),
					'lines'    => array(
						'Foo'  => 1,
						'Quux' => 2,
						''     => 6,
					),
				),
			),
			'Trimmed file with no entry'  => array(
				"Foo: bar baz\nQuux: XXX",
				array(
					'Foo'  => 'bar baz',
					'Quux' => 'XXX',
					''     => '',
				),
				array(
					'warnings' => array(),
					'lines'    => array(
						'Foo'  => 1,
						'Quux' => 2,
						''     => 2,
					),
				),
			),
			'File with no headers'        => array(
				"\nEntry\n",
				array(
					'' => 'Entry',
				),
				array(
					'warnings' => array(),
					'lines'    => array(
						'' => 2,
					),
				),
			),
			'Empty file'                  => array(
				'',
				array(
					'' => '',
				),
				array(
					'warnings' => array(),
					'lines'    => array(
						'' => 1,
					),
				),
			),
			'File with wrapped header'    => array(
				"Foo: bar\n  baz\n  \n  ok?\n\nThis is a multiline\nentry.\n",
				array(
					'Foo' => 'bar baz ok?',
					''    => "This is a multiline\nentry.",
				),
				array(
					'warnings' => array(),
					'lines'    => array(
						'Foo' => 1,
						''    => 6,
					),
				),
			),
			'File with duplicate headers' => array(
				"Foo: A\nFoo: B\nBar:\nFoo: C\nBar: X\n\nEntry\n",
				array(
					'Foo' => 'A',
					'Bar' => '',
					''    => 'Entry',
				),
				array(
					'warnings' => array(
						array( 'Duplicate header "Foo", previously seen on line 1.', 2 ),
						array( 'Duplicate header "Foo", previously seen on line 1.', 4 ),
						array( 'Duplicate header "Bar", previously seen on line 3.', 5 ),
					),
					'lines'    => array(
						'Foo' => 1,
						'Bar' => 3,
						''    => 7,
					),
				),
			),
			'Invalid header'              => array(
				"Foo: bar\nWrapped: A\n B\n C\nEntry.\n",
				$ex( '/^Invalid header.$/', 5 ),
			),
		);
	}

	/**
	 * Test "bad filename" paths in loadChangeFile.
	 */
	public function testLoadChangeFile_badFile() {
		try {
			Utils::loadChangeFile( 'doesnotexist/reallydoesnotexist.txt' );
			$this->fail( 'Expected exception not thrown' );
		} catch ( \RuntimeException $ex ) {
			$this->assertSame( 'File does not exist.', $ex->getMessage() );
			$this->assertNull( $ex->fileLine );
		}
		try {
			Utils::loadChangeFile( '.' );
			$this->fail( 'Expected exception not thrown' );
		} catch ( \RuntimeException $ex ) {
			$this->assertSame( 'Expected a file, got dir.', $ex->getMessage() );
			$this->assertNull( $ex->fileLine );
		}

		// Try to create an unreadable file. May fail if tests are running as root.
		$temp = tempnam( sys_get_temp_dir(), 'phpunit-testLoadChangeFile-' );
		try {
			chmod( $temp, 0000 );
			if ( ! is_readable( $temp ) ) {
				try {
					Utils::loadChangeFile( $temp );
					$this->fail( 'Expected exception not thrown' );
				} catch ( \RuntimeException $ex ) {
					$this->assertSame( 'File is not readable.', $ex->getMessage() );
					$this->assertNull( $ex->fileLine );
				}
			}
		} finally {
			unlink( $temp );
		}
	}

	/**
	 * Test getRepoData
	 */
	public function testGetRepoData() {
		$this->useTempDir();

		if ( in_array( '--debug', $GLOBALS['argv'], true ) ) {
			$output = new ConsoleOutput();
			$output->setVerbosity( ConsoleOutput::VERBOSITY_DEBUG );
		} else {
			$output = new NullOutput();
		}
		$helper = new DebugFormatterHelper();

		// Create a non-git file in a non-git checkout.
		touch( 'not-in-git.txt', 1614124800 );
		$this->assertSame(
			array(
				'timestamp' => '2021-02-24T00:00:00Z',
				'pr-num'    => null,
			),
			Utils::getRepoData( 'not-in-git.txt', $output, $helper )
		);

		// Create a file in a git checkout.
		file_put_contents( 'in-git.txt', '' );
		$args = array(
			$output,
			$helper,
			array(
				'mustRun' => true,
				'env'     => array(
					'GIT_AUTHOR_NAME'     => 'Dummy',
					'GIT_AUTHOR_EMAIL'    => 'dummy@example.com',
					'GIT_AUTHOR_DATE'     => '2021-01-01T11:11:11Z',
					'GIT_COMMITTER_NAME'  => 'Dummy',
					'GIT_COMMITTER_EMAIL' => 'dummy@example.com',
					'GIT_COMMITTER_DATE'  => '2021-02-02T22:22:22Z',
				),
			),
		);
		Utils::runCommand( array( 'git', 'init', '.' ), ...$args );
		Utils::runCommand( array( 'git', 'add', 'in-git.txt' ), ...$args );
		Utils::runCommand( array( 'git', 'commit', '-m', 'Commit (#123)' ), ...$args );

		$this->assertSame(
			array(
				'timestamp' => '2021-02-02T22:22:22+00:00',
				'pr-num'    => '123',
			),
			Utils::getRepoData( 'in-git.txt', $output, $helper )
		);

		// Test our non-git file again.
		$this->assertSame(
			array(
				'timestamp' => '2021-02-24T00:00:00Z',
				'pr-num'    => null,
			),
			Utils::getRepoData( 'not-in-git.txt', $output, $helper )
		);

		// Nonexistent file.
		$this->assertSame(
			array(
				'timestamp' => null,
				'pr-num'    => null,
			),
			Utils::getRepoData( 'missing.txt', $output, $helper )
		);
	}

	/**
	 * Test loadAllChanges.
	 */
	public function testLoadAllChanges() {
		$formatter = $this->getMockBuilder( FormatterPlugin::class )
			->setMethodsExcept( array() )
			->getMock();
		$formatter->expects( $this->never() )->method( $this->logicalNot( $this->matches( 'newChangeEntry' ) ) );
		$formatter->method( 'newChangeEntry' )->willReturnCallback(
			function ( $data ) {
				return new ChangeEntry( $data );
			}
		);

		$dir = $this->useTempDir() . '/changes';
		mkdir( $dir );

		file_put_contents( "$dir/a", "Date: 2021-02-22T00:00:00Z\nSignificance: minor\nType: added\n\nAAAAA\n" );
		file_put_contents( "$dir/b", "Significance: minor\nType: unknown\nType: unknown\n\nBBBBB\n" );
		touch( "$dir/b", 1614124800 );
		file_put_contents( "$dir/c", "Significance: minor\nType: added\nCCCCC\n" );
		mkdir( "$dir/d" );
		file_put_contents( "$dir/e", "Significance: bogus\nType: added\n\nEEEEE\n" );

		$out   = new BufferedOutput();
		$files = null; // Make phpcs happy.
		$ret   = Utils::loadAllChanges( $dir, array( 'added' => 'Added!' ), $formatter, $out, $files );
		$this->assertIsArray( $ret );
		foreach ( $ret as $e ) {
			$this->assertInstanceOf( ChangeEntry::class, $e );
		}

		$this->assertSame(
			'{"a":{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\ChangeEntry","significance":"minor","timestamp":"2021-02-22T00:00:00+0000","subheading":"Added!","author":"","content":"AAAAA"},"b":{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\ChangeEntry","significance":"minor","timestamp":"2021-02-24T00:00:00+0000","subheading":"Unknown","author":"","content":"BBBBB"}}',
			json_encode( $ret )
		);
		$this->assertSame(
			array(
				'a' => 0,
				'b' => 1,
				'c' => 2,
				'd' => 2,
				'e' => 2,
			),
			$files
		);
		$this->assertSame(
			"<warning>b:3: Duplicate header \"Type\", previously seen on line 2.\nc: Invalid header.\nd: Expected a file, got dir.\ne: Automattic\\Jetpack\\Changelog\\ChangeEntry::setSignificance: Significance must be 'patch', 'minor', or 'major' (or null)\n",
			$out->fetch()
		);
	}

}
