<?php

namespace Automattic\Jetpack_Boost\Modules\Performance_History;

use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Performance_History implements Pluggable, Is_Always_On {

	public function setup() {
		// noop
	}

	public static function is_available() {
		return Premium_Features::has_feature( Premium_Features::PERFORMANCE_HISTORY );
	}

	public static function get_slug() {
		return 'performance_history';
	}
}
