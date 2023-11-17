<?php

// Todo: Do something about these.
// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.system_calls_shell_exec, Generic.CodeAnalysis.EmptyStatement.DetectedCatch, Squiz.Commenting.EmptyCatchComment.Missing

namespace Helper;

class RunProcess {

	protected $pid;
	protected $cmd;
	protected $outputFile;
	protected $append;

	/**
	 * RunProcess constructor.
	 *
	 * @param $cmd
	 * @param string $outputFile
	 * @param bool   $append
	 */
	public function __construct( $cmd, $outputFile = '/dev/null', $append = false ) {
		$this->cmd        = $cmd;
		$this->outputFile = $outputFile;
		$this->append     = $append;
	}

	public function run() {
		if ( $this->cmd === null ) {
			return;
		}

		$this->pid = (int) shell_exec( sprintf( '%s %s %s 2>&1 & echo $!', $this->cmd, ( $this->append ) ? '>>' : '>', $this->outputFile ) );

		return $this->pid;
	}

	public function isRunning() {
		try {
			$result = shell_exec( sprintf( 'ps %d 2>&1', $this->pid ) );
			if ( count( preg_split( "/\n/", $result ) ) > 2 && ! preg_match( '/ERROR: Process ID out of range/', $result ) ) {
				return true;
			}
		} catch ( Exception $e ) {

		}

		return false;
	}

	public function stop() {
		try {
			$result = shell_exec( sprintf( 'kill %d 2>&1', $this->pid ) );
			if ( is_string( $result ) && ! preg_match( '/No such process/', $result ) ) {
				return true;
			}
		} catch ( Exception $e ) {

		}

		return false;
	}
}
