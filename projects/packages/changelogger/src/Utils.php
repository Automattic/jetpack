<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Utilities for the changelogger tool.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid, WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

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

	/**
	 * Load and parse a change file to an array.
	 *
	 * Header names are normalized. The entry is returned under the empty
	 * string key.
	 *
	 * @param string $filename File to load.
	 * @param mixed  $diagnostics Output variable, set to an array with diagnostic data.
	 *   - warnings: An array of warning messages and applicable lines.
	 *   - lines: An array mapping headers to line numbers.
	 * @return array
	 * @throws \RuntimeException On error.
	 */
	public static function loadChangeFile( $filename, &$diagnostics = null ) {
		$diagnostics = array(
			'warnings' => array(),
			'lines'    => array(),
		);

		if ( ! file_exists( $filename ) ) {
			$ex           = new \RuntimeException( 'File does not exist.' );
			$ex->fileLine = null;
			throw $ex;
		}

		$fileinfo = new \SplFileInfo( $filename );
		if ( $fileinfo->getType() !== 'file' ) {
			$ex           = new \RuntimeException( "Expected a file, got {$fileinfo->getType()}." );
			$ex->fileLine = null;
			throw $ex;
		}
		if ( ! $fileinfo->isReadable() ) {
			$ex           = new \RuntimeException( 'File is not readable.' );
			$ex->fileLine = null;
			throw $ex;
		}

		self::error_clear_last();
		$contents = quietCall( 'file_get_contents', $filename );
		// @codeCoverageIgnoreStart
		if ( false === $contents ) {
			$err          = error_get_last();
			$ex           = new \RuntimeException( "Failed to read file: {$err['message']}" );
			$ex->fileLine = null;
			throw $ex;
		}
		// @codeCoverageIgnoreEnd

		$ret  = array();
		$line = 1;
		while ( preg_match( '/^([A-Z][a-zA-Z0-9-]*):((?:.|\n[ \t])*)(?:\n|$)/', $contents, $m ) ) {
			if ( isset( $diagnostics['lines'][ $m[1] ] ) ) {
				$diagnostics['warnings'][] = array(
					"Duplicate header \"{$m[1]}\", previously seen on line {$diagnostics['lines'][ $m[1] ]}.",
					$line,
				);
			} else {
				$diagnostics['lines'][ $m[1] ] = $line;
				$ret[ $m[1] ]                  = trim( preg_replace( '/(\n[ \t]+)+/', ' ', $m[2] ) );
			}
			$line    += substr_count( $m[0], "\n" );
			$contents = (string) substr( $contents, strlen( $m[0] ) );
		}

		if ( '' !== $contents && "\n" !== $contents[0] ) {
			$ex           = new \RuntimeException( 'Invalid header.' );
			$ex->fileLine = $line;
			throw $ex;
		}
		$diagnostics['lines'][''] = $line + strspn( $contents, "\n" );
		$ret['']                  = trim( $contents );

		return $ret;
	}

}

