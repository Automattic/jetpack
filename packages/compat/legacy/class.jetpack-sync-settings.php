<?php

use Automattic\Jetpack\Sync\Settings;

/**
 * Class Jetpack_Sync_Settings
 *
 * @deprecated Use Automattic\Jetpack\Sync\Settings
 */
class Jetpack_Sync_Settings {

	static function is_syncing() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::is_syncing();
	}

}
