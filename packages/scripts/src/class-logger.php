<?php
/**
 * Set of scripts for Jetpack.
 *
 * @package automattic/jetpack-scripts
 */

namespace Automattic\Jetpack\Scripts;

/**
 * Fancy logger
 */
class Logger {
	/**
	 * Array of foreground colors
	 *
	 * @var Array
	 */
	private $foreground_colors = array();
	/**
	 * Array of background colors
	 *
	 * @var Array
	 */
	private $background_colors = array();

	/**
	 * A generic log command
	 *
	 * @param String $string string to log.
	 * @param String $foreground_color foreground color.
	 * @param String $background_color background color.
	 */
	public static function log( $string, $foreground_color = null, $background_color = null ) {
		$logger = new Logger();
		$out    = $string;

		if ( ! is_string( $out ) ) {
			$out = print_r( $string, 1 ); //phpcs:ignore
		}

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( $logger->get_colored_string( $out, $foreground_color, $background_color ) );
	}

	/**
	 * Info log command in yellow
	 *
	 * @param String $string string to log.
	 */
	public static function info( $string ) {
		self::log( $string, 'yellow' );
	}

	/**
	 * Set up shell colors
	 */
	public function __construct() {
		$this->foreground_colors['black']        = '0;30';
		$this->foreground_colors['dark_gray']    = '1;30';
		$this->foreground_colors['blue']         = '0;34';
		$this->foreground_colors['light_blue']   = '1;34';
		$this->foreground_colors['green']        = '0;32';
		$this->foreground_colors['light_green']  = '1;32';
		$this->foreground_colors['cyan']         = '0;36';
		$this->foreground_colors['light_cyan']   = '1;36';
		$this->foreground_colors['red']          = '0;31';
		$this->foreground_colors['light_red']    = '1;31';
		$this->foreground_colors['purple']       = '0;35';
		$this->foreground_colors['light_purple'] = '1;35';
		$this->foreground_colors['brown']        = '0;33';
		$this->foreground_colors['yellow']       = '1;33';
		$this->foreground_colors['light_gray']   = '0;37';
		$this->foreground_colors['white']        = '1;37';

		$this->background_colors['black']      = '40';
		$this->background_colors['red']        = '41';
		$this->background_colors['green']      = '42';
		$this->background_colors['yellow']     = '43';
		$this->background_colors['blue']       = '44';
		$this->background_colors['magenta']    = '45';
		$this->background_colors['cyan']       = '46';
		$this->background_colors['light_gray'] = '47';
	}

	/**
	 * Returns colored string
	 *
	 * @param String $string string to log.
	 * @param String $foreground_color foreground color.
	 * @param String $background_color background color.
	 */
	public function get_colored_string( $string, $foreground_color = null, $background_color = null ) {
		$colored_string = '';

		// Check if given foreground color found.
		if ( isset( $this->foreground_colors[ $foreground_color ] ) ) {
			$colored_string .= "\033[" . $this->foreground_colors[ $foreground_color ] . 'm';
		}
		// Check if given background color found.
		if ( isset( $this->background_colors[ $background_color ] ) ) {
			$colored_string .= "\033[" . $this->background_colors[ $background_color ] . 'm';
		}

		// Add string and end coloring.
		$colored_string .= $string . "\033[0m";

		return $colored_string;
	}

	/**
	 * Returns all foreground color names
	 */
	public function get_foreground_colors() {
		return array_keys( $this->foreground_colors );
	}

	/**
	 * Returns all background color names
	 */
	public function get_background_colors() {
		return array_keys( $this->background_colors );
	}
}
