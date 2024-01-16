<?php
/**
 * Defines the Jetpack CRM Automation logger.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Automation_Logger class.
 *
 * @since 6.2.0
 */
class Automation_Logger {

	/**
	 * Instance singleton.
	 *
	 * @since 6.2.0
	 * @var Automation_Logger
	 */
	private static $instance = null;

	/**
	 * The log list.
	 *
	 * @var string[]
	 */
	private $log = array();

	/**
	 * Whether or not the log is set to output.
	 *
	 * @since 6.2.0
	 * @var bool
	 */
	private $output = false;

	/**
	 * Whether or not the logger is set to be active.
	 *
	 * @since 6.2.0
	 * @var bool
	 */
	private $is_active = true;

	/**
	 * Initialize the logger.
	 *
	 * @since 6.2.0
	 *
	 * @param bool $force Force a new instance.
	 * @return Automation_Logger An instance of the Automation_Logger class.
	 */
	public static function instance( bool $force = false ): Automation_Logger {
		if ( ! self::$instance || $force ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Set is_active to true to indicate the logger is active.
	 *
	 * @since 6.2.0
	 */
	public function turn_on() {
		$this->is_active = true;
	}

	/**
	 * Set is_active to false to indicate the logger is not active.
	 *
	 * @since 6.2.0
	 */
	public function turn_off() {
		$this->is_active = false;
	}

	/**
	 * Set if output the log or not.
	 *
	 * @since 6.2.0
	 *
	 * @param bool $output Whether or not the log is set to output.
	 */
	public function with_output( bool $output ) {
		$this->output = $output;
	}

	/**
	 * Get log list.
	 *
	 * @since 6.2.0
	 *
	 * @return string[] The log list.
	 */
	public function get_log(): array {
		return $this->log;
	}

	/**
	 * Get formatted log.
	 *
	 * @since 6.2.0
	 *
	 * @param bool $output Whether or not the log is set to output.
	 * @return string[]|null The formatted log as array.
	 */
	public function formatted_log( $output = false ): ?array {
		if ( $output ) {
			echo "***** LOGS *****\n";
			foreach ( $this->log as $log ) {
				echo $log[0] . ' - ' . $log[1] . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}
			echo "***** END LOGS *****\n";
		} else {
			$output = array();
			foreach ( $this->log as $log ) {
				$output[] = $log[0] . ' - ' . $log[1]; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}
			return $output;
		}
		return null;
	}

	/**
	 * Add a log entry.
	 *
	 * @since 6.2.0
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
	 * Reset the log.
	 *
	 * @since 6.2.0
	 */
	public function reset_log() {
		$this->log = array();
	}
}
