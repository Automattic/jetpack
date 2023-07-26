<?php
/**
 * Defines the Jetpack CRM Automation logger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Automation_Logger class.
 */
class Automation_Logger {

	/**
	 * @var Automation_Logger An instance of the Automation_Logger class.
	 */
	private static $instance = null;

	/**
	 * @var array An array of logged outputs.
	 */
	private $log = array();

	/**
	 * @var bool Whether or not the log is set to output.
	 */
	private $output = false;

	/**
	 * @var bool Whether or not the logger is set to be active.
	 */
	private $is_active = true;

	/**
	 * Initialize the logger
	 *
	 * @param bool $force Force a new instance.
	 * @return Automation_Logger
	 */
	public static function instance( bool $force = false ): Automation_Logger {
		if ( ! self::$instance || $force ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Set is_active to true to indicate the logger is active
	 */
	public function turn_on() {
		$this->is_active = true;
	}

	/**
	 * Set is_active to false to indicate the logger is not active
	 */
	public function turn_off() {
		$this->is_active = false;
	}

	/**
	 * Set if output the log or not
	 * @param bool $output Whether or not the log is set to output.
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
	 * @param string $message The message to be output in the log.
	 */
	public function log( string $message ) {

		if ( $this->output ) {
			error_log( $message ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Intention use of error_log.
		}

		$log         = array( date( 'Y-m-d H:i' ), $message ); // phpcs:ignore WordPress.DateTime.RestrictedFunctions.date_date -- we want the correct timezone showing in logs.
		$this->log[] = $log;
	}

	/**
	 * Reset the log
	 */
	public function reset_log() {
		$this->log = array();
	}
}
