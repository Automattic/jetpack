<?php

namespace Automattic\Jetpack_Boost\Data_Sync\Read_Only;

class Available_Modules implements Source {
	public function get_value() {
		return array(
			'cloud_css',
			'lazy_images',
		);
	}
}
