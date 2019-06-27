<?php

/**
 * Class Jetpack_Sync_Modules
 *
 * @deprecated Use Automattic\Jetpack\Sync\Modules
 */
class Jetpack_Sync_Modules {
	static function get_module( $module_name ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Modules' );

		return Modules::get_module( $module_name );
	}
}