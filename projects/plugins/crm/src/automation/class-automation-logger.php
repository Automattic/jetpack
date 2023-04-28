<?php

namespace Automattic\Jetpack\CRM\Automation;

class Automation_Logger {
	
	private static $instance = null;
	
	private $log = array();

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
	 * Get log list
	 */
	public static function get_log(): array {
		return self::$instance->log;
	}
	
	/**
	 * Add a log entry
	 * 
	 * @param string $message
	 */
	public static function log( string $message ) {
		self::$instance->log[] = array( date( 'Y-m-d H:i' ), $message );
	}
}