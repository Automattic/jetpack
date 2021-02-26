<?php
/**
 * Implements a basic interface of the SimplePie_Locator class in environments where it doesn't exist.
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( 'SimplePie_File' ) ) {
	/**
	 * Class SimplePie_Locator
	 */
	class SimplePie_File {
		/**
		 * Constructor
		 *
		 * Stores a response directly into the file body for similating feed markup.
		 *
		 * @param string $response Response body.
		 */
		public function __construct( $response ) {
			$this->body = $response;
		}
	}
}
