<?php // phpcs:disable

namespace Automattic\Jetpack\My_Jetpack;

class Mock_Boost_Child extends Products\Boost {
	public static function get_name() {
		return 'Child Boost';
	}
}

class Mock_Boost_Invalid {
	public static function get_name() {
		return 'Child Boost';
	}
}
