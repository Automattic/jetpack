<?php
/**
 * A message logger for the Jetpack Sitemap module.
 *
 * @package Jetpack
 * @since 4.7.0
 */

/**
 * Handles logging errors and debug messages for sitemap generator.
 *
 * A Jetpack_Sitemap_Logger object keeps track of its birth time as well
 * as a "unique" ID string. Calling the report() method writes a message
 * to the PHP error log as well as the ID string for easier grepping.
 *
 * @since 4.7.0
 */
class Jetpack_Sitemap_Logger {
	/**
	 * A unique-ish string for each logger, enabling us to grep
	 * for the messages written by an individual generation phase.
	 *
	 * @access private
	 * @since 4.7.0
	 * @var string $key The key string.
	 */
	private $key;

	/**
	 * The birth time of this object in microseconds.
	 *
	 * @access private
	 * @since 4.7.0
	 * @var int $starttime The birth time.
	 */
	private $starttime;

	/**
	 * Initializes a new logger object.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param string $message An optional message string to be written to the debug log on initialization.
	 */
	public function __construct( $message = null ) {
		$this->key = wp_generate_password( 5, false );
		$this->starttime = microtime( true );
		if ( ! is_null( $message ) ) {
			$this->report( $message );
		}
		return;
	}

	/**
	 * Writes a string to the debug log, including the logger's ID string.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param string $message The string to be written to the log.
	 */
	public function report( $message ) {
		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			error_log( 'jp-sitemap-' . $this->key . ': ' . $message );
		}
		return;
	}

	/**
	 * Writes the elapsed lifetime of the logger to the debug log, with an optional message.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param string $message The optional message string. Default is the empty string.
	 */
	public function time( $message = '' ) {
		$time = round( microtime( true ) - $this->starttime, 3 );
		$this->report( $message . ' ' . $time . ' seconds elapsed.' );
		return;
	}
}
