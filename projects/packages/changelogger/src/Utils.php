<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Utilities for the changelogger tool.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid

namespace Automattic\Jetpack\Changelogger;

use Symfony\Component\Console\Helper\DebugFormatterHelper;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Process\Process;
use function error_clear_last; // phpcs:ignore PHPCompatibility.FunctionUse.NewFunctions.error_clear_lastFound
use function Wikimedia\quietCall;

/**
 * Utilities for the changelogger tool.
 */
class Utils {

	/**
	 * Calls `error_clear_last()` or emulates it.
	 */
	public static function error_clear_last() {
		if ( is_callable( 'error_clear_last' ) ) {
			// phpcs:ignore PHPCompatibility.FunctionUse.NewFunctions.error_clear_lastFound
			error_clear_last();
		} else {
			// @codeCoverageIgnoreStart
			quietCall( 'trigger_error', '', E_USER_NOTICE );
			// @codeCoverageIgnoreEnd
		}
	}

	/**
	 * Helper to run a process.
	 *
	 * @param string[]             $command Command to execute.
	 * @param OutputInterface      $output OutputInterface to write debug output to.
	 * @param DebugFormatterHelper $formatter Formatter to use to format debug output.
	 * @param array                $options An associative array with the following optional keys. Defaults are null unless otherwise specified.
	 *                 - cwd: (string|null) The working directory or null to use the working dir of the current PHP process.
	 *                 - env: (array|null) The environment variables or null to use the same environment as the current PHP process.
	 *                 - input: (mixed|null) The input as stream resource, scalar or \Traversable, or null for no input.
	 *                 - timeout: (float|null) The timeout in seconds or null to disable. Default 60.
	 *                 - mustRun: (boolean) If set true, an exception will be thrown if the command fails. Default false.
	 * @return Process The process, which has already been run.
	 */
	public static function runCommand( array $command, OutputInterface $output, DebugFormatterHelper $formatter, array $options = array() ) {
		$options += array(
			'cwd'     => null,
			'env'     => null,
			'input'   => null,
			'timeout' => 60,
			'mustRun' => false,
		);

		$process = new Process( $command, $options['cwd'], $options['env'], $options['input'], $options['timeout'] );
		$output->writeln(
			$formatter->start( spl_object_hash( $process ), $process->getCommandLine() ),
			OutputInterface::VERBOSITY_DEBUG
		);
		$func = $options['mustRun'] ? 'mustRun' : 'run';
		$process->$func(
			function ( $type, $buffer ) use ( $output, $formatter, $process ) {
				$output->writeln(
					$formatter->progress( spl_object_hash( $process ), $buffer, Process::ERR === $type ),
					OutputInterface::VERBOSITY_DEBUG
				);
			}
		);
		return $process;
	}

}

