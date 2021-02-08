<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelogger utils.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelogger\Utils;
use Symfony\Component\Console\Helper\DebugFormatterHelper;
use Symfony\Component\Console\Output\BufferedOutput;
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
		$this->assertTrue( empty( $err['message'] ) );
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

}
