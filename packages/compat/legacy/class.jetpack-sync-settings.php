<?php

/**
 * Class Jetpack_Sync_Settings
 *
 * @deprecated Use Automattic\Jetpack\Sync\Settings
 */
class Jetpack_Sync_Settings extends Automattic\Jetpack\Sync\Settings {

	public function __callStatic( $method, $args ) {
		if ( method_exists( parent, $method ) ) {
			_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
			return call_user_func_array( [ parent, $method ], $args );
		}
		throw new Exception( "Method doesn't exist" );
	}

}
