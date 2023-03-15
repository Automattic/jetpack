<?php

namespace Automattic\Jetpack_Boost\Data_Sync\Read_Only;

use Automattic\Jetpack_Boost\Modules\Modules;

class Available_Modules extends Storage {
	public function get( $_key ) {
		$modules           = Modules::MODULES;
		$available_modules = array();
		foreach ( $modules as $module ) {
			$available_modules[ $module::get_slug() ] = $module::is_available();
		}

		return $available_modules;
	}
}
