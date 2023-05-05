<?php

namespace Automattic\Jetpack\CRM\Automation;

class Automation_Logger {
	
	private static $instance = null;
	
	private $log = array();
	
	private $output = false;
	
	private $is_active = true;

	/**
	 * Initialize the logger
	 */
	public static function instance(): Automation_Logger {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		
		return self::$instance;
	}
	
	public function turn_on() {
		$this->is_active = true;
	}
	
	public function turn_off() {
		$this->is_active = false;
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

	/**
	 * Reset the log
	 */
	public function reset_log() {
		$this->log = array();
	}
}