<?php
/**
 * Primary class file for the Jetpack Flow plugin.
 *
 * @package automattic/jetpack-flow-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use Automattic\Jetpack\Flow\Flow;

/**
 * Thin wrapper that initializes the flow package.
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_Flow {

	/**
	 * Constructor.
	 */
	public function __construct() {
		Flow::init();
	}
}
