<?php
/**
 * Class used to define Initializer.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Class Initializer
 */
class Initializer {

	/**
	 * Main instance
	 *
	 * @var Main
	 */
	private static $instance = null;

	/**
	 * Constructor
	 */
	private function __construct() {}

	/**
	 * Initialize the Main instance
	 *
	 * @return Main
	 */
	public static function init(): Main {
		if ( self::$instance === null ) {

			self::$instance = new Main();
			self::$instance->initialize();
		}

		return self::$instance;
	}
}
