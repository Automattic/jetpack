<?php

namespace Automattic\Jetpack_Boost\Data_Sync\Read_Only;

use Automattic\Jetpack_Boost\Modules\Modules;

class Available_Modules extends Storage {
	public function get( $_key ) {
		$modules = new Modules();
		$keys    = array_keys( $modules->available_modules() );

		return str_replace( '-', '_', $keys );
	}
}
