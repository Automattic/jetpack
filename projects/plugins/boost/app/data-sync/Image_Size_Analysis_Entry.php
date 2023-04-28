<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;

class Image_Size_Analysis_Entry implements Entry_Can_Get, Entry_Can_Set {

	private $page = 1;

	private function get_mock_data( $page ) {

		return array(
			'pagination'   => array(
				'current' => $page,
				'total'   => 3,
			),
			'last_updated' => 1682419855474,
			'images'       => jetpack_boost_mock_api( 10, $page ),
		);
	}

	public function get() {
		return $this->get_mock_data( $this->page );
	}

	public function set(
		$value
	) {
		$this->page = $value['pagination']['current'];
		return $this->get();
	}
}

