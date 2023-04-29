<?php

namespace Automattic\Jetpack\CRM\Automation;

class Automation_Logger {
	
	private static $instance = null;
	
	private $log = array();
	
	private $output = false;

	/**
	 * Initialize the logger
	 */
	public static function instance(): Automation_Logger {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		
		return self::$instance;
	}

	/**
	 * Set if output the log or not
	 */
	public function with_output( bool $output ) {
		$this->output = $output;
	}
	
	/**
	 * Get log list
	 */
	public function get_log(): array {
		return $this->log;
	}
	
	/**
	 * Add a log entry
	 * 
	 * @param string $message
	 */
	public function log( string $message ) {
		
		if ( $this->output ) {
			error_log( $message );
		}
		
		$log = array( date( 'Y-m-d H:i' ), $message );
		$this->log[] = $log;
	}
}