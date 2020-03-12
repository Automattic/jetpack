<?php
/**
 * Class for running shell scripts
 *
 * @package automattic/jetpack-scripts
 */

namespace Automattic\Jetpack\Scripts;

/**
 * Class for running shell commands
 */
class Cmd {
	/**
	 * Shell command
	 *
	 * @var String
	 */
	public $cmd = '';

	/**
	 * Process pipes
	 *
	 * @var Array
	 */
	public $pipes = null;

	/**
	 * Proc itself
	 *
	 * @var Process
	 */
	public $resource = null;

	/**
	 * Timestamp when command was fired
	 *
	 * @var int
	 */
	private $strt_tm = 0;

	/**
	 * Command exit code
	 *
	 * @var int
	 */
	private $exitcode = null;

	/**
	 * Descriptors to use in new process
	 *
	 * @var Array
	 */
	private $descriptors = array(
		0 => array( 'pipe', 'r' ),
		1 => array( 'pipe', 'w' ),
		2 => array( 'pipe', 'w' ),
	);

	/**
	 * Opens a process with the provided shell command
	 *
	 * @param {String} $cmd shell command to run.
	 */
	public function __construct( $cmd = '' ) {
			$this->cmd = $cmd;

			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_proc_open
			$this->resource = proc_open( $this->cmd, $this->descriptors, $this->pipes, realpath( './' ) );
			$this->strt_tm  = microtime( true );
	}

	/**
	 * Class entry point
	 *
	 * @param {String} $cmd shell command to run.
	 * @param {bool}   $interactive wether or not to output interactively.
	 */
	public static function run( $cmd, $interactive = true ) {
		$proc = new Cmd( $cmd );
		// phpcs:ignore
		error_log( print_r( 'RUNNING: ' . $cmd, 1 ) );

		$out = '';

		while ( $proc->is_running() ) {
			if ( $interactive ) {
				$s = fgets( $proc->pipes[1] );
				while ( $s ) {
					$out = $out . $s;
					error_log( $s ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					$s = fgets( $proc->pipes[1] );
				}
			}
		}

		return array(
			'output'    => trim( $interactive ? $out : stream_get_contents( $proc->pipes[1] ) ),
			'exit_code' => $proc->get_exitcode(),
			'stderr'    => stream_get_contents( $proc->pipes[2] ),
		);
	}

	/**
	 * Checks if the process is still running. Also populates an $exitcode once the process is done running
	 */
	public function is_running() {
		$status = proc_get_status( $this->resource );

		/**
		 * `proc_get_status` will only pull valid exitcode one
		 * time after process has ended, so cache the exitcode
		 * if the process is finished and $exitcode is uninitialized
		 */
		if ( false === $status['running'] && null === $this->exitcode ) {
			$this->exitcode = $status['exitcode'];
		}
		return $status['running'];
	}

	/**
	 * Exit code accessor
	 */
	public function get_exitcode() {
		return $this->exitcode;
	}

	/**
	 * Return elapsed time
	 */
	public function get_elapsed() {
		return microtime( true ) - $this->strt_tm;
	}
}
