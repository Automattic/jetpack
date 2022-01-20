<?php
namespace Automattic\Jetpack_Boost\Contracts;

interface Feature extends Initialize {
	public function get_slug();
}
