<?php
/**
 * Initializer base class.
 *
 * @package    @automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use WP_Error;

/**
 * Base class for the initializer pattern.
 */
abstract class Initializer {
	/**
	 * Perform necessary initialization steps for classic and instant search in the constructor.
	 */
	public static function initialize() {
		return new WP_Error(
			'invalid-method',
			/* translators: %s: Method name. */
			sprintf( __( "Method '%s' not implemented. Must be overridden in subclass.", 'jetpack-search-pkg' ), __METHOD__ ),
			array( 'status' => 405 )
		);
	}
}
