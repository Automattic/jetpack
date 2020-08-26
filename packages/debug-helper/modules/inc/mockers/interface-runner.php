<?php
/**
 * The Mocker Runner Interface.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Debug_Helper\Mocker;

/**
 * Mocker Runner Interface.
 */
interface Runner_Interface {

	/**
	 * Run the mocker functionality
	 *
	 * @param int $number How many mock options to create.
	 *
	 * @return bool
	 */
	public function run( $number );

}
