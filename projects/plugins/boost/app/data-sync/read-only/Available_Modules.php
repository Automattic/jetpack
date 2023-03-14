<?php

namespace Automattic\Jetpack_Boost\Data_Sync\Read_Only;

class Available_Modules extends Storage {
	public function get( $_key ) {
		return array(
			'cloud_css',
			'lazy_images',
		);
	}
}
