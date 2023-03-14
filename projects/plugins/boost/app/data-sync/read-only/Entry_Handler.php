<?php

namespace Automattic\Jetpack_Boost\Data_Sync\Read_Only;

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry_Handler;

class Entry_Handler extends Data_Sync_Entry_Handler {

	/**
	 * No need to do anything as it is read-only data.
	 */
	public function sanitize( $value ) {
		return $value;
	}
}
