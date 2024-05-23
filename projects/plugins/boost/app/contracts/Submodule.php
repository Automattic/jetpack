<?php

namespace Automattic\Jetpack_Boost\Contracts;

interface Submodule extends Has_Slug {
	public function get_state();
	public static function is_available();
}
