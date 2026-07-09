<?php
/**
 * Test stub for the global exception provided by the resumable uploader.
 *
 * @package automattic/jetpack-videopress
 */

if ( ! class_exists( 'Out_Of_Range_Exception' ) ) {
	/**
	 * Global out of range exception.
	 */
	class Out_Of_Range_Exception extends Exception {
	}
}
