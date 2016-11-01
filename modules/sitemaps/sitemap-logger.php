<?php

/**
 * Handles logging errors and debug messages for sitemap generator.
 *
 * A Jetpack_Sitemap_Logger object keeps track of its birth time as well
 * as a "unique" ID string. Calling the report() method writes a message
 * to the PHP error log as well as the ID string for easier grepping.
 */
class Jetpack_Sitemap_Logger {
	/**
	 * A unique-ish string for each logger, enabling us to grep
	 * for the messages written by an individual generation phase.
	 *
	 * @since 4.5.0
	 */
	private $key;

	/**
	 * The birth time of this object in microseconds.
	 *
	 * @since 4.5.0
	 */
	private $starttime;

	/**
	 * Initializes a new logger object.
	 *
	 * @since 4.5.0
	 *
	 * @param string $message A message string to be written to the debug log on initialization.
	 */
	public function __construct($message) {
		$this->key = wp_generate_password(5, false);
		$this->starttime = microtime(true);
		$this->report($message);
		return;
	}

	/**
	 * Writes a string to the debug log, including the logger's ID string.
	 *
	 * @since 4.5.0
	 *
	 * @param string $message The string to be written to the log.
	 */
	public function report($message) {
		error_log( 'woo! jp-sitemap-' .  $this->key . ': ' . $message );
		return;
	}

	/**
	 * Writes the elapsed lifetime of the logger to the debug log, with an optional message.
	 *
	 * @since 4.5.0
	 *
	 * @param string $message The optional message string.
	 */
	public function time($message = '') {
		$time = (microtime(true) - $this->starttime);
		$this->report($message . ' ' . $time . ' seconds elapsed');
		return;
	}
}
