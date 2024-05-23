<?php
namespace Automattic\Jetpack_Boost\Contracts;

interface Has_Sub_Modules {
	public function setup_sub_modules();
	public function get_sub_modules_state();
}
