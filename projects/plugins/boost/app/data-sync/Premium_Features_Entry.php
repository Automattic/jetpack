<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Premium_Features_Entry implements Entry_Can_Get {
	public function get() {
		return Premium_Features::get_features();
	}
}
